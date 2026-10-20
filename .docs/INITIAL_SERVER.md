# Konzept: OpenAPI-Spec als Admin-Interface implementieren — Server (Backend)

> **Teil 2 von 4 (Server/Backend):** Dieses Dokument enthält die Server-Implementierung (Abschnitt 4).
> - Grundlagen: siehe `INITIAL_BASICS.md`
> - Frontend: siehe `INITIAL_FRONTEND.md`
> - Einstellungen (Settings): siehe `INITIAL_SETTINGS.md`

> **⚠️ Design-Änderung (agnostische Bridge):** Der Server nutzt **keine** pro-Endpoint-Router und **keinen** Service-Layer. Stattdessen gibt es **eine einzige, agnostische Bridge-Klasse** (`MediaMTXBridge`), die jeden Request unter `/v3/*` 1:1 an MediaMTX weiterleitet. Neue MediaMTX-Endpoints brauchen **null** Server-Code.

> **📐 Konvention (Klassen):** **Alle Dateien sind Klassen** — eine Klasse pro Datei, PascalCase-Name, `export { Klasse }`. Ausnahme: **Helper- und Utility-Dateien** (z. B. Test-Helfer, reine Funktions-Sammlungen) dürfen als Module mit Funktionen exportiert werden.

---

## 4. Server (Backend)

### 4.1 Ist-Zustand

```
server/
├── index.js              # App Entry Point (App-Klasse, --init-config)
├── package.json          # express ^5.3.0, axios ^1.20.0, vitest (dev)
└── src/
    ├── Server.js         # Express App, Security-Header, 404/500 Handler, Start/Stop
    ├── Config.js         # Config aus Env + config.json (serverPort, verbose)
    ├── Logger.js         # Logger (verbose/error)
    └── Router/
        ├── index.js      # Main Router: FrontendRouter + /health
        ├── FrontendRouter.js  # Vite Dev (middlewareMode) / Static (dist)
        └── ApiRouter.js  # STUB (leere init(), kaputtes `return { ApiRouter }`)
```

**Bekannte Probleme im Ist-Zustand:**
1. `ApiRouter.js:28` nutzt `return { ApiRouter }` statt `export { ApiRouter }` → Syntax-Fehler.
2. `Router/index.js` registriert den `ApiRouter` noch nicht.
3. `Config.js` kennt noch keine MediaMTX-Settings.
4. `Router/index.js` registriert `/health` **nach** dem FrontendRouter → in Production frisst der Frontend-Catch-all (`*`) `/health`.

> **Lösung:** Die Bridge ersetzt `ApiRouter` komplett. Probleme 1–4 entfallen.

### 4.2 Konzept: Agnostische Bridge

Keine 56 Endpoints. Keine 13 Router. Keine 11 Services.

**Eine Klasse.** `MediaMTXBridge`.

Sie nimmt jeden Request unter `/v3/*` und leitet ihn 1:1 an MediaMTX weiter: Methode, Pfad, Query-String, Body, Header. Die Antwort (Status, Content-Type, Body) kommt 1:1 zurück.

Die Bridge kennt **keine** Endpoints. Sie ist ein reiner Reverse-Proxy.

**Warum:**
- Neue MediaMTX-Endpoints → null Server-Code.
- Kein Drift zwischen UI und API (keine manuell gepflegte Endpoint-Liste).
- Ein einziger Punkt kapselt Auth, Timeout und Fehler-Mapping.
- Frontend und MediaMTX nutzen denselben Pfad (`/v3`) → Forwarding ist trivial.

### 4.3 Zielarchitektur

```
server/
├── index.js              # App Entry Point (unverändert)
├── package.json
└── src/
    ├── Server.js         # Express App, Security-Header, 404/500 Handler, Start/Stop
    ├── Config.js         # + mediamtxBaseUrl, mediamtxAuthToken, bridgePrefix, bridgeTimeout
    ├── Logger.js         # unverändert
    ├── Bridge/
    │   └── MediaMTXBridge.js  # DIE eine Klasse (agnostischer Proxy zu MediaMTX)
    └── Router/
        ├── index.js      # /health + Settings (/api/settings) + MediaMTXBridge (/v3) + FrontendRouter
        ├── SettingsRouter.js  # GET/PATCH /api/settings (siehe INITIAL_SETTINGS.md §6)
        └── FrontendRouter.js  # unverändert
```

**Weg damit (werden nicht angelegt):**
- `Router/ApiRouter.js` (Stub, Syntax-Fehler) → wird gelöscht
- `Router/api/*.js` (13 Module) → entfallen
- `Service/*.js` (11 Services + `MediaMTXClient`) → entfallen

### 4.4 MediaMTXBridge (`server/src/Bridge/MediaMTXBridge.js`)

Die eine Klasse. Agnostischer Reverse-Proxy.

```js
import express from 'express';
import axios from 'axios';

/**
 * Agnostic reverse proxy to the MediaMTX API.
 *
 * Forwards every request under the mount prefix verbatim to the upstream
 * MediaMTX instance: method, path, query string, body and (most) headers.
 * The upstream response (status, content-type, body) is forwarded back.
 *
 * The bridge knows nothing about specific endpoints. It is a pure proxy.
 */
class MediaMTXBridge {
    /**
     * @param {Config} config
     * @param {Logger} [logger]
     */
    constructor(config, logger) {
        this.config = config;
        this.logger = logger || { log: () => {}, error: () => {} };
        this.label = '[MediaMTXBridge]';

        // MediaMTX root, e.g. http://localhost:9997 (no trailing slash).
        this.baseURL = (config.mediamtxBaseUrl || 'http://localhost:9997').replace(/\/+$/, '');
        this.authToken = config.mediamtxAuthToken || '';
        this.timeout = config.bridgeTimeout || 10000;

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            // Do NOT throw on 4xx/5xx — we forward the upstream status/body as-is.
            validateStatus: () => true,
            headers: {
                'Content-Type': 'application/json',
                ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
            },
        });
    }

    /**
     * Returns an Express router that proxies ALL methods and ALL paths.
     * Mount it with e.g. `app.use('/v3', bridge.router())`.
     * @returns {import('express').Router}
     */
    router() {
        const router = express.Router();
        // router.use() matches every method + every path → fully agnostic.
        router.use(this.handle.bind(this));
        return router;
    }

    /**
     * Forwards one request to MediaMTX and sends the response back.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async handle(req, res) {
        const started = Date.now();
        const url = req.originalUrl; // e.g. /v3/hls/sessions/list?page=0

        try {
            const upstream = await this.client.request({
                method: req.method,
                url,
                data: req.body, // undefined for GET/HEAD → no body sent
                headers: this.pickHeaders(req),
            });

            this.logger.log(this.label, `${req.method} ${url} -> ${upstream.status} (${Date.now() - started}ms)`);

            const contentType = upstream.headers?.['content-type'];
            if (contentType) res.set('Content-Type', contentType);
            res.status(upstream.status);

            const body = upstream.data;
            if (body === undefined || body === null) return res.end();
            if (typeof body === 'string') return res.send(body);
            return res.json(body);
        } catch (err) {
            // Only network-level failures reach here (validateStatus: () => true).
            const message = err.code === 'ECONNABORTED'
                ? 'MediaMTX request timed out'
                : `MediaMTX unreachable: ${err.message}`;
            this.logger.error(this.label, `${req.method} ${url} -> ${message}`);
            res.status(502).json({ error: message, status: 'error', code: 'upstream_unreachable' });
        }
    }

    /**
     * Forwards all request headers except hop-by-hop / client-specific ones.
     * @param {import('express').Request} req
     * @returns {Record<string, string>}
     */
    pickHeaders(req) {
        const deny = new Set([
            'host', 'connection', 'content-length', 'accept-encoding',
            'authorization', 'cookie',
        ]);
        const headers = {};
        for (const [key, value] of Object.entries(req.headers)) {
            if (!deny.has(key) && value !== undefined) headers[key] = value;
        }
        return headers;
    }
}

export { MediaMTXBridge };
```

**Verhalten:**
- `router.use(handler)` → matcht **alle** Methoden + **alle** Pfade. Kein Pfad-Muster.
- `req.originalUrl` wird 1:1 an `baseURL` angehängt → exakt der Request, den das Frontend geschickt hat.
- `validateStatus: () => true` → 4xx/5xx von MediaMTX werden **nicht** geworfen, sondern weitergeleitet.
- Nur Netzwerkfehler (kein Response) landen im `catch` → 502.

### 4.5 Router-Integration (`Router/index.js`)

```js
import express from 'express';
import { FrontendRouter } from './FrontendRouter.js';
import { MediaMTXBridge } from '../Bridge/MediaMTXBridge.js';

class Router {
    constructor(config, httpServer, logger) {
        this.config = config;
        this.httpServer = httpServer;
        this.label = '[Router]';
        this.logger = logger || { log: () => {}, error: () => {} };
        this.router = express.Router();
        this.router.use(express.json());
    }

    async define() {
        // 1. Health (vor dem Frontend-Catch-all)
        this.router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

        // 2. MediaMTX-Bridge (agnostischer Proxy) — VOR dem Frontend.
        const bridge = new MediaMTXBridge(this.config, this.logger);
        this.router.use(this.config.bridgePrefix || '/v3', bridge.router());

        // 3. Frontend (Catch-all, MUSS zuletzt kommen)
        const frontendRouter = new FrontendRouter(this.config, this.httpServer, this.logger);
        await frontendRouter.init();
        this.router.use('/', frontendRouter.router);
    }
}

export { Router };
```

> **Reihenfolge ist Pflicht:** Bridge **vor** Frontend. In Production hat der FrontendRouter einen Catch-all, der sonst alle API-Requests frisst. `/health` ebenfalls vor dem Frontend.
>
> **Express-5-Hinweis:** Der FrontendRouter-Catch-all muss ein echter Catch-all sein (`this.router.get('/*splat', ...)` statt `'*'`), da Express 5 das alte `*`-Syntax nicht mehr unterstützt.

### 4.6 Server.js

Unverändert im Kern. `Router` bekommt die Bridge via `define()`. Zentrale Fehlerbehandlung:

```js
// 404
this.app.use((req, res) => {
    res.status(404).json({ error: 'Not found', status: 'error', code: 'not_found' });
});

// 500 (zentraler Error-Handler)
this.app.use((error, req, res, next) => {
    const status = error.status || 500;
    const code = error.code || 'internal_error';
    if (status >= 500) {
        this.logger.error(this.label, 'Error', { error: error.message, code });
    }
    res.status(status).json({ error: error.message, status: 'error', code });
});
```

> Der Error-Handler antwortet mit `{ error, status: 'error', code }`. Das `code`-Feld dient dem Frontend zur Fehlerklassifizierung.

### 4.7 Config.js (Erweiterung)

```js
static defaults = {
    serverPort: 3000,
    verbose: false,
    mediamtxBaseUrl: 'http://localhost:9997',
    mediamtxAuthToken: '',
    bridgePrefix: '/v3',
    bridgeTimeout: 10000,
};

// im Constructor:
this.mediamtxBaseUrl = env.MEDIAMTX_BASE_URL || this.defaults.mediamtxBaseUrl;
this.mediamtxAuthToken = env.MEDIAMTX_AUTH_TOKEN || this.defaults.mediamtxAuthToken || '';
this.bridgePrefix = env.BRIDGE_PREFIX || this.defaults.bridgePrefix || '/v3';
this.bridgeTimeout = parseInt(env.BRIDGE_TIMEOUT, 10) || this.defaults.bridgeTimeout || 10000;
```

`buildDefaults()` und `saveDefaults()` entsprechend um die neuen Felder erweitern.

**Env-Variablen:**

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `SERVER_PORT` | `3000` | Port des UI-Servers |
| `MEDIAMTX_BASE_URL` | `http://localhost:9997` | MediaMTX-Root (ohne Trailing-Slash) |
| `MEDIAMTX_AUTH_TOKEN` | – | Optionaler Bearer-Token für MediaMTX |
| `BRIDGE_PREFIX` | `/v3` | Mount-Pfad der Bridge (muss zum MediaMTX-API-Pfad passen) |
| `BRIDGE_TIMEOUT` | `10000` | Timeout in ms für Upstream-Requests |
| `VERBOSE` | `false` | Logging |
| `NODE_ENV` | – | `development` → Vite Dev, sonst Static |

`.env.default`:
```
SERVER_PORT=3000
MEDIAMTX_BASE_URL=http://localhost:9997
MEDIAMTX_AUTH_TOKEN=
BRIDGE_PREFIX=/v3
BRIDGE_TIMEOUT=10000
VERBOSE=false
```

### 4.8 Fehler-Mapping

| Ursache | Status | Body |
|---------|--------|------|
| MediaMTX antwortet 4xx/5xx | identisch (400/404/500) | MediaMTX-Body 1:1 (`{ error, status }`) |
| MediaMTX nicht erreichbar (ECONNREFUSED, DNS) | 502 | `{ error, status: 'error', code: 'upstream_unreachable' }` |
| Timeout | 502 | `{ error, status: 'error', code: 'upstream_unreachable' }` |
| Interne Exception | 500 | zentraler Error-Handler in `Server.js` |

### 4.9 Testing (Server)

- **Framework:** `vitest` (bereits in `devDependencies`).
- **Strategie:**
  - `MediaMTXBridge`: `client.request` mocken (`vi.fn()`), testen von Forwarding, Status-/Body-Weiterleitung, Auth-Token, Fehler-Mapping.
  - Integration (optional): App via `app.listen(0)` + echter MediaMTX (Docker) — nicht im CI-Pflichtprogramm.
- **Test-Datei:** `server/src/Bridge/MediaMTXBridge.test.js` (neben der Quelldatei).

> **Hinweis (Klassen-Konvention):** `makeBridge` und `mockRes` sind **Test-Helfer** (Helper) — sie sind von der Klassen-Konvention ausgenommen und bleiben Funktionen.

```js
import { describe, it, expect, vi } from 'vitest';
import { MediaMTXBridge } from './MediaMTXBridge.js';

function makeBridge(overrides = {}) {
    return new MediaMTXBridge({
        mediamtxBaseUrl: 'http://mtx.test:9997',
        mediamtxAuthToken: 'secret',
        bridgeTimeout: 1000,
        ...overrides,
    }, { log: () => {}, error: () => {} });
}

function mockRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.set = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    res.end = vi.fn().mockReturnValue(res);
    return res;
}

describe('MediaMTXBridge', () => {
    it('leitet GET mit Query 1:1 weiter', async () => {
        const bridge = makeBridge();
        bridge.client.request = vi.fn().mockResolvedValue({
            status: 200,
            headers: { 'content-type': 'application/json' },
            data: { started: 'x', version: 'v1' },
        });

        const req = { method: 'GET', originalUrl: '/v3/info', body: undefined, headers: {} };
        const res = mockRes();
        await bridge.handle(req, res);

        expect(bridge.client.request).toHaveBeenCalledWith(expect.objectContaining({
            method: 'GET', url: '/v3/info',
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ started: 'x', version: 'v1' });
    });

    it('mappt Netzwerkfehler auf 502 upstream_unreachable', async () => {
        const bridge = makeBridge();
        const err = new Error('connect ECONNREFUSED');
        err.code = 'ECONNREFUSED';
        bridge.client.request = vi.fn().mockRejectedValue(err);

        const req = { method: 'GET', originalUrl: '/v3/info', body: undefined, headers: {} };
        const res = mockRes();
        await bridge.handle(req, res);

        expect(res.status).toHaveBeenCalledWith(502);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'upstream_unreachable' }));
    });

    it('fügt Auth-Token ein', () => {
        const bridge = makeBridge();
        expect(bridge.client.defaults.headers.common.Authorization).toBe('Bearer secret');
    });
});
```

### 4.10 Tradeoffs / Alternativen

| Ansatz | Pro | Contra |
|--------|-----|--------|
| **axios (gewählt)** | keine neue Dependency (schon da); JSON-API → Puffern egal | kein Streaming (Response im RAM) — für MediaMTX-JSON egal |
| `http-proxy` | echtes Streaming, Header 1:1 | neue Dependency; nur bei großen Binär-Payloads nötig |
| `node:http` (built-in) | keine Dependency, Streaming | mehr Code, TLS/Redirects selbst |

→ Für diese API (JSON, kleine Responses): **axios**.

### 4.11 Frontend-Pairing

Bridge ist agnostisch → Frontend kann auch agnostisch sein. Statt 56 Funktionen in `endpoints.js` (siehe `INITIAL_FRONTEND.md` 5.4) genügt ein generischer Client:

```js
// frontend/src/api/client.js
import axios from 'axios';

class ApiClient {
    constructor(baseURL = '/v3', timeout = 10000) {
        this.client = axios.create({ baseURL, timeout });
    }

    get(path, params) {
        return this.client.get(path, { params }).then(r => r.data);
    }

    post(path, body) {
        return this.client.post(path, body).then(r => r.data);
    }

    patch(path, body) {
        return this.client.patch(path, body).then(r => r.data);
    }

    delete(path, params) {
        return this.client.delete(path, { params }).then(r => r.data);
    }
}

export const api = new ApiClient();
export { ApiClient };
```

Aufruf: `api.get('/hls/sessions/list', { page: 0 })`. Keine 56 Funktionen.

### 4.12 Zusammenfassung (Server)

Der Server ist ein **agnostischer Proxy** zu MediaMTX:

- **Eine Klasse** (`MediaMTXBridge`) leitet jeden Request unter `/v3/*` 1:1 an MediaMTX weiter.
- **Keine** pro-Endpoint-Router, **kein** Service-Layer, **kein** manueller Endpoint-Katalog.
- **Ein einziger Punkt** kapselt Auth, Timeout und Fehler-Mapping.
- Neue MediaMTX-Endpoints brauchen **null** Server-Code.
- Frontend spricht nur mit dem Server (gleicher Origin, `/v3`), der Server nur mit MediaMTX.

Die bestehende Infrastruktur (`Server.js`, `FrontendRouter`, `index.js`) wird weitgehend wiederverwendet. Hauptarbeit: `MediaMTXBridge` + Config-Erweiterung + Router-Integration + Test.

### 4.13 Einstellungen (Settings)

Die Server-Settings (`serverPort`, `verbose`, `mediamtxBaseUrl`, `mediamtxAuthToken`, `bridgePrefix`, `bridgeTimeout`) sind über `GET`/`PATCH /api/settings` einseh- und änderbar — inkl. `Config.updateSettings()` (Validierung, Maskierung, Persistenz), `SettingsRouter`, Runtime-Anwendung (`MediaMTXBridge.applyConfig()`, `Logger.setVerbose()`) und Testing.

→ **Details: `INITIAL_SETTINGS.md` §6.**
