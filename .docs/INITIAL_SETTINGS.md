# Konzept: Einstellungen (Settings) für Server & Frontend-App

> **Teil 4 von 4 (Einstellungen):** Dieses Dokument beschreibt die Einstellungen-Funktionalität für den UI-Server und die Frontend-App (Abschnitt 6).
> - Grundlagen: siehe `INITIAL_BASICS.md`
> - Server (Backend): siehe `INITIAL_SERVER.md`
> - Frontend: siehe `INITIAL_FRONTEND.md`

> **⚠️ Abgrenzung:** Die Einstellungen betreffen die **eigene App** (UI-Server + Frontend), **nicht** die MediaMTX-Konfiguration. MediaMTX-Settings (`GlobalConf`, `PathConf`, `InternalUser`) werden über die Config-Pages aus `INITIAL_FRONTEND.md` §5.7 verwaltet.

---

## 6. Einstellungen (Settings)

### 6.1 Scope

Zwei Ebenen, getrennt nach Persistenz und Wirkungsbereich:

| Ebene | Was | Persistenz | Änderung | Wirkung |
|-------|-----|------------|----------|---------|
| **Server-Settings** | Port, Logging, MediaMTX-Anbindung, Bridge | `config.json` (Server) | API (`GET`/`PATCH /api/settings`) | Runtime oder nach Restart |
| **App-Settings** | API-Base-URL, Theme, Auto-Refresh, Seiten-Größe | `localStorage` (Browser) | Settings-Seite (lokal) | Sofort, pro Browser |

**Ziel:** Alle Config-Parameter der App sind in der UI einseh- und änderbar — ohne `config.json` oder `.env` von Hand zu bearbeiten.

### 6.2 Parameter-Katalog (alle Config-Parameter)

#### Server-Settings

| Parameter | Typ | Default | Runtime? | Restart? | Beschreibung |
|-----------|-----|---------|----------|----------|--------------|
| `serverPort` | int (1–65535) | `3000` | nein | **ja** | Port des UI-Servers |
| `verbose` | boolean | `false` | ja | nein | Verbose-Logging |
| `mediamtxBaseUrl` | string (http/https-URL) | `http://localhost:9997` | ja | nein | MediaMTX-Root (ohne Trailing-Slash) |
| `mediamtxAuthToken` | string (Secret) | `''` | ja | nein | Bearer-Token für MediaMTX |
| `bridgePrefix` | string (startet mit `/`) | `/v3` | nein | **ja** | Mount-Pfad der Bridge |
| `bridgeTimeout` | int (ms, ≥ 1000) | `10000` | ja | nein | Timeout für Upstream-Requests |

#### App-Settings (Frontend)

| Parameter | Typ | Default | Beschreibung |
|-----------|-----|---------|--------------|
| `apiBaseUrl` | string | `''` (→ `/v3`) | API-Base-URL-Override (leer = Default: `VITE_MEDIAMTX_API_URL` oder `/v3`) |
| `theme` | enum `dark` \| `light` | `dark` | Farb-Schema |
| `autoRefreshMs` | int (ms, 0 = aus) | `10000` | Refresh-Intervall für Dashboard/Listen |
| `itemsPerPage` | int (10–500) | `100` | Standard-Seitengröße der Tabellen |

> **Priorität (Server):** `Env` > `config.json` > statische Defaults. Ist eine Env-Variablen gesetzt (z. B. `SERVER_PORT`), hat sie nach einem Restart Vorrang vor der per UI gespeicherten Einstellung. Die UI zeigt die **aktive** Einstellung (d. h. den Env-Wert, falls gesetzt).

### 6.3 Server: `Config.js`-Erweiterung

Bestehende Felder aus `INITIAL_SERVER.md` §4.7 bleiben. Neue Methoden:

```js
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

class Config {
    static defaults = {
        serverPort: 3000,
        verbose: false,
        mediamtxBaseUrl: 'http://localhost:9997',
        mediamtxAuthToken: '',
        bridgePrefix: '/v3',
        bridgeTimeout: 10000,
    };

    /** Keys, die ohne Restart angewendet werden können. */
    static runtimeKeys = ['verbose', 'mediamtxBaseUrl', 'mediamtxAuthToken', 'bridgeTimeout'];
    /** Keys, die erst nach einem Restart wirksam werden. */
    static restartKeys = ['serverPort', 'bridgePrefix'];

    constructor(env = process.env, logger) {
        // ... (bestehend: env, configPath, defaults aus config.json) ...
        this.mediamtxBaseUrl = env.MEDIAMTX_BASE_URL || this.defaults.mediamtxBaseUrl;
        this.mediamtxAuthToken = env.MEDIAMTX_AUTH_TOKEN || this.defaults.mediamtxAuthToken || '';
        this.bridgePrefix = env.BRIDGE_PREFIX || this.defaults.bridgePrefix || '/v3';
        this.bridgeTimeout = parseInt(env.BRIDGE_TIMEOUT, 10) || this.defaults.bridgeTimeout || 10000;
    }

    /**
     * Liefert die aktuellen Settings für die UI.
     * Secrets werden maskiert — der echte Token wird nie zurückgegeben.
     */
    getSettings() {
        return {
            serverPort: this.serverPort,
            verbose: this.verbose,
            mediamtxBaseUrl: this.mediamtxBaseUrl,
            mediamtxAuthToken: this.maskSecret(this.mediamtxAuthToken),
            bridgePrefix: this.bridgePrefix,
            bridgeTimeout: this.bridgeTimeout,
            runtimeKeys: Config.runtimeKeys,
            restartKeys: Config.restartKeys,
        };
    }

    /** Maskiert ein Secret: `••••` + letzte 4 Zeichen. */
    maskSecret(value) {
        if (!value) return '';
        return value.length <= 4 ? '••••' : `••••${value.slice(-4)}`;
    }

    /**
     * Validiert ein vollständiges Settings-Objekt.
     * @param {Record<string, unknown>} s
     * @returns {string[]} Fehlerliste (leer = gültig)
     */
    validateSettings(s) {
        const errors = [];
        if (!Number.isInteger(s.serverPort) || s.serverPort < 1 || s.serverPort > 65535)
            errors.push('serverPort muss eine Ganzzahl zwischen 1 und 65535 sein');
        if (typeof s.verbose !== 'boolean')
            errors.push('verbose muss ein Boolean sein');
        try {
            const url = new URL(s.mediamtxBaseUrl);
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad protocol');
        } catch {
            errors.push('mediamtxBaseUrl muss eine gültige http(s)-URL sein');
        }
        if (typeof s.mediamtxAuthToken !== 'string')
            errors.push('mediamtxAuthToken muss ein String sein');
        if (typeof s.bridgePrefix !== 'string'
            || !s.bridgePrefix.startsWith('/')
            || s.bridgePrefix.endsWith('/'))
            errors.push('bridgePrefix muss mit "/" beginnen und ohne "/" enden');
        if (!Number.isInteger(s.bridgeTimeout) || s.bridgeTimeout < 1000)
            errors.push('bridgeTimeout muss eine Ganzzahl >= 1000 (ms) sein');
        return errors;
    }

    /**
     * Wendet einen Partial-Patch an: validieren → mergen → persistieren → klassifizieren.
     * @param {Record<string, unknown>} patch
     * @returns {{ applied: string[], restartRequired: string[] }}
     */
    updateSettings(patch) {
        const current = {
            serverPort: this.serverPort,
            verbose: this.verbose,
            mediamtxBaseUrl: this.mediamtxBaseUrl,
            mediamtxAuthToken: this.mediamtxAuthToken,
            bridgePrefix: this.bridgePrefix,
            bridgeTimeout: this.bridgeTimeout,
        };

        const next = { ...current, ...patch };

        // Token-Regel:
        //   '' (leer)          → Token wird gelöscht
        //   '••••…' (maskiert) → unverändert (UI schickt den maskierten Wert zurück)
        //   sonst              → neuer Token
        if (next.mediamtxAuthToken.startsWith('••••')) {
            next.mediamtxAuthToken = current.mediamtxAuthToken;
        }

        const errors = this.validateSettings(next);
        if (errors.length > 0) {
            const err = new Error(errors.join('; '));
            err.status = 400;
            err.code = 'invalid_settings';
            throw err;
        }

        // Runtime-State aktualisieren
        this.serverPort = next.serverPort;
        this.verbose = next.verbose;
        this.mediamtxBaseUrl = next.mediamtxBaseUrl.replace(/\/+$/, '');
        this.mediamtxAuthToken = next.mediamtxAuthToken;
        this.bridgePrefix = next.bridgePrefix;
        this.bridgeTimeout = next.bridgeTimeout;

        // Persistieren (config.json)
        this.persist();

        const changed = Object.keys(patch).filter((k) => current[k] !== next[k]);
        return {
            applied: changed.filter((k) => Config.runtimeKeys.includes(k)),
            restartRequired: changed.filter((k) => Config.restartKeys.includes(k)),
        };
    }

    /** Schreibt die aktuellen Settings nach config.json. */
    persist() {
        writeFileSync(
            this.configPath,
            JSON.stringify({
                serverPort: this.serverPort,
                verbose: this.verbose,
                mediamtxBaseUrl: this.mediamtxBaseUrl,
                mediamtxAuthToken: this.mediamtxAuthToken,
                bridgePrefix: this.bridgePrefix,
                bridgeTimeout: this.bridgeTimeout,
            }, null, 4),
            'utf8'
        );
    }
}

export { Config };
```

> **`buildDefaults()` / `saveDefaults()`** (`--init-config`) entsprechend um die vier neuen Felder erweitern (siehe `INITIAL_SERVER.md` §4.7).

### 6.4 Server: `SettingsRouter`

Neue Datei `server/src/Router/SettingsRouter.js` (Klassen-Konvention wie in `INITIAL_SERVER.md`).

```js
import express from 'express';

/**
 * Server-eigene Settings-Endpunkte (nicht an MediaMTX proxied).
 * GET   /api/settings → aktuelle Settings (Secrets maskiert)
 * PATCH /api/settings → Partial-Patch anwenden + persistieren
 */
class SettingsRouter {
    /**
     * @param {Config} config
     * @param {Logger} [logger]
     */
    constructor(config, logger) {
        this.config = config;
        this.label = '[SettingsRouter]';
        this.logger = logger || { log: () => {}, error: () => {} };
        this.router = express.Router();
        this.applier = null; // wird von Router gesetzt, sobald die Bridge existiert

        this.router.get('/api/settings', this.handleGet.bind(this));
        this.router.patch('/api/settings', this.handlePatch.bind(this));
    }

    /** Wird vom Router aufgerufen, wenn die Bridge verfügbar ist. */
    setApplier(fn) {
        this.applier = fn;
    }

    handleGet(req, res) {
        res.status(200).json({ success: true, data: this.config.getSettings() });
    }

    handlePatch(req, res) {
        try {
            const result = this.config.updateSettings(req.body || {});
            if (this.applier) this.applier();
            this.logger.log(this.label,
                `Settings updated: applied=[${result.applied.join(', ')}] restart=[${result.restartRequired.join(', ')}]`);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            const status = err.status || 500;
            this.logger.error(this.label, `Settings update failed: ${err.message}`);
            res.status(status).json({ success: false, error: err.message, code: err.code || 'internal_error' });
        }
    }
}

export { SettingsRouter };
```

**Antwort-Formate** (Konvention aus `AGENTS.md`):

`GET /api/settings` → `200`:
```json
{
    "success": true,
    "data": {
        "serverPort": 3000,
        "verbose": false,
        "mediamtxBaseUrl": "http://localhost:9997",
        "mediamtxAuthToken": "••••abcd",
        "bridgePrefix": "/v3",
        "bridgeTimeout": 10000,
        "runtimeKeys": ["verbose", "mediamtxBaseUrl", "mediamtxAuthToken", "bridgeTimeout"],
        "restartKeys": ["serverPort", "bridgePrefix"]
    }
}
```

`PATCH /api/settings` (Body: Partial-Objekt) → `200`:
```json
{
    "success": true,
    "data": {
        "applied": ["mediamtxBaseUrl", "bridgeTimeout"],
        "restartRequired": ["serverPort"]
    }
}
```

Fehler → `400`:
```json
{ "success": false, "error": "serverPort muss eine Ganzzahl zwischen 1 und 65535 sein", "code": "invalid_settings" }
```

### 6.5 Server: Runtime-Anwendung

Nicht alle Parameter können live gewechselt werden:

| Parameter | Anwendung | Mechanismus |
|-----------|-----------|-------------|
| `verbose` | sofort | `Logger.setVerbose(bool)` |
| `mediamtxBaseUrl` | sofort | `MediaMTXBridge.applyConfig(config)` → Axios-Client neu anlegen |
| `mediamtxAuthToken` | sofort | dito |
| `bridgeTimeout` | sofort | dito |
| `serverPort` | nach Restart | persistiert; `httpServer.listen()` läuft bereits |
| `bridgePrefix` | nach Restart | persistiert; Router-Mount ist fixiert |

**`Logger.js`** — eine Methode ergänzen:

```js
setVerbose(verbose) {
    this.verbose = verbose;
}
```

**`MediaMTXBridge.js`** — Client-Erzeugung auslagern + `applyConfig()` (siehe `INITIAL_SERVER.md` §4.4):

```js
createClient() {
    return axios.create({
        baseURL: this.baseURL,
        timeout: this.timeout,
        validateStatus: () => true,
        headers: {
            'Content-Type': 'application/json',
            ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        },
    });
}

constructor(config, logger) {
    // ... (bestehend) ...
    this.client = this.createClient();
}

/** Liest die Anbindungs-Settings neu aus config (Runtime-Änderung, kein Restart). */
applyConfig(config) {
    this.baseURL = (config.mediamtxBaseUrl || 'http://localhost:9997').replace(/\/+$/, '');
    this.authToken = config.mediamtxAuthToken || '';
    this.timeout = config.bridgeTimeout || 10000;
    this.client = this.createClient();
}
```

> **Hinweis:** Laufende Requests nutzen den alten Client bis zum Abschluss — kein Problem, da die Requests kurz sind.

### 6.6 Server: Router-Integration

`Router/index.js` (`INITIAL_SERVER.md` §4.5) um die Settings erweitern — **Reihenfolge bleibt Pflicht**:

```js
async define() {
    // 1. Health (vor dem Frontend-Catch-all)
    this.router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

    // 2. Settings (server-eigene Endpunkte)
    this.settingsRouter = new SettingsRouter(this.config, this.logger);
    this.router.use(this.settingsRouter.router);

    // 3. MediaMTX-Bridge (agnostischer Proxy) — VOR dem Frontend
    this.bridge = new MediaMTXBridge(this.config, this.logger);
    this.router.use(this.config.bridgePrefix || '/v3', this.bridge.router());

    // 4. Runtime-Anwendung verdrahten (Bridge muss existieren)
    this.settingsRouter.setApplier(() => {
        this.bridge.applyConfig(this.config);
        this.logger.setVerbose(this.config.verbose);
    });

    // 5. Frontend (Catch-all, MUSS zuletzt kommen)
    const frontendRouter = new FrontendRouter(this.config, this.httpServer, this.logger);
    await frontendRouter.init();
    this.router.use('/', frontendRouter.router);
}
```

### 6.7 Frontend: App-Settings-Store

Neue Datei `frontend/src/services/appSettings.js` (Helper-Modul, keine Klasse):

```js
import { useSyncExternalStore } from 'react';

const KEY = 'mtxui.appSettings';

export const APP_SETTINGS_DEFAULTS = {
    apiBaseUrl: '',        // '' → Default (VITE_MEDIAMTX_API_URL oder /v3)
    theme: 'dark',         // 'dark' | 'light'
    autoRefreshMs: 10000,  // 0 = aus
    itemsPerPage: 100,
};

function read() {
    try {
        const raw = localStorage.getItem(KEY);
        return { ...APP_SETTINGS_DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
    } catch {
        return { ...APP_SETTINGS_DEFAULTS };
    }
}

let cache = read();
const listeners = new Set();

export function getAppSettings() {
    return cache;
}

export function setAppSettings(patch) {
    cache = { ...cache, ...patch };
    try {
        localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
        // localStorage nicht verfügbar (z. B. Private Mode) → nur In-Memory
    }
    listeners.forEach((listener) => listener());
}

export function subscribeAppSettings(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** React-Hook: reagiert auf Änderungen der App-Settings. */
export function useAppSettings() {
    return useSyncExternalStore(subscribeAppSettings, getAppSettings);
}
```

### 6.8 Frontend: API-Client (Base-URL-Auflösung + `localApi`)

`api/client.js` (`INITIAL_FRONTEND.md` §5.3) wird um zwei Dinge erweitert:

1. **Base-URL-Auflösung pro Request** (Override aus den App-Settings, sonst Env, sonst `/v3`).
2. **`localApi`** für die server-eigenen Endpunkte (gleicher Origin, ohne `/v3`-Prefix).

```js
import axios from 'axios';
import { getAppSettings } from '../services/appSettings';

function resolveBaseURL() {
    const override = (getAppSettings().apiBaseUrl || '').trim();
    if (override) return override.replace(/\/+$/, '');
    return import.meta.env.VITE_MEDIAMTX_API_URL || '/v3';
}

const client = axios.create({
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// Response-Interceptor: liefert res.data direkt, mappt Fehler (wie in INITIAL_FRONTEND.md §5.3)
client.interceptors.response.use(
    (res) => res.data,
    (err) => {
        const msg = err.response?.data?.error || err.message;
        const code = err.response?.data?.code || 'unknown';
        const e = new Error(msg);
        e.code = code;
        e.status = err.response?.status;
        throw e;
    }
);

// MediaMTX-API (via Bridge) — Base-URL wird pro Request aufgelöst
export const api = {
    get: (path, params) => client.get(path, { params, baseURL: resolveBaseURL() }),
    post: (path, body) => client.post(path, body, { baseURL: resolveBaseURL() }),
    patch: (path, body) => client.patch(path, body, { baseURL: resolveBaseURL() }),
    delete: (path, params) => client.delete(path, { params, baseURL: resolveBaseURL() }),
};

// Server-eigene Endpunkte (Einstellungen) — nicht an MediaMTX proxied
export const localApi = {
    get: (path, params) => client.get(path, { params, baseURL: '' }),
    patch: (path, body) => client.patch(path, body, { baseURL: '' }),
};

export default client;
```

> **Vorteil:** `apiBaseUrl` wirkt sofort (pro Request aufgelöst) — kein Reload nötig, wenn die Base-URL in den Einstellungen geändert wird.

### 6.9 Frontend: Settings-Seite

Neue Page `frontend/src/components/pages/Settings.jsx`, Route `/settings`, Sidebar-Eintrag „Settings".

**Aufbau:** Zwei Karten, beide über den **FormBuilder** aus `INITIAL_FRONTEND.md` §5.13 gerendert:

1. **Server** — Daten aus `GET /api/settings`, Speichern via `PATCH /api/settings`.
2. **App** — Daten aus `useAppSettings()`, Speichern via `setAppSettings()`.

**Kataloge** (in `components/forms/fieldCatalog.js` ergänzen):

```js
export const SERVER_SETTINGS_CATALOG = [
    { name: 'serverPort', label: 'Server Port', type: 'number', group: 'Server',
      min: 1, max: 65535, restartRequired: true },
    { name: 'verbose', label: 'Verbose Logging', type: 'toggle', group: 'Server' },
    { name: 'mediamtxBaseUrl', label: 'MediaMTX Base URL', type: 'text', group: 'MediaMTX',
      placeholder: 'http://localhost:9997' },
    { name: 'mediamtxAuthToken', label: 'MediaMTX Auth Token', type: 'password', group: 'MediaMTX',
      placeholder: '•••• (unverändert) / leer = löschen' },
    { name: 'bridgePrefix', label: 'Bridge Prefix', type: 'text', group: 'Bridge',
      placeholder: '/v3', restartRequired: true },
    { name: 'bridgeTimeout', label: 'Bridge Timeout (ms)', type: 'number', group: 'Bridge',
      min: 1000, max: 300000 },
];

export const APP_SETTINGS_CATALOG = [
    { name: 'apiBaseUrl', label: 'API Base URL', type: 'text', group: 'API',
      placeholder: '/v3 (Default)' },
    { name: 'theme', label: 'Theme', type: 'select', group: 'Darstellung',
      options: ['dark', 'light'] },
    { name: 'autoRefreshMs', label: 'Auto-Refresh (ms, 0 = aus)', type: 'number', group: 'Verhalten',
      min: 0, max: 3600000 },
    { name: 'itemsPerPage', label: 'Items Per Page', type: 'number', group: 'Verhalten',
      min: 10, max: 500 },
];
```

> **FormBuilder-Erweiterung:** `FormField` rendert bei `field.restartRequired: true` ein Badge „Restart required" neben dem Label. Kleine, additive Änderung — bestehende Kataloge bleiben unverändert.

**`Settings.jsx`** (Kern-Logik):

```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localApi } from '../../api/client';
import { useAppSettings, setAppSettings } from '../../services/appSettings';
import FormBuilder from '../forms/FormBuilder';
import { SERVER_SETTINGS_CATALOG, APP_SETTINGS_CATALOG } from '../forms/fieldCatalog';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ErrorAlert from '../ui/ErrorAlert';
import Spinner from '../ui/Spinner';

export default function Settings() {
    const queryClient = useQueryClient();

    // --- Server-Settings (API) ---
    const { data, isLoading, error } = useQuery({
        queryKey: ['settings'],
        queryFn: () => localApi.get('/api/settings'),
        staleTime: 0,
        refetchOnWindowFocus: false,
    });

    const [serverValues, setServerValues] = useState(null);
    if (data && !serverValues) setServerValues(data);

    const saveServer = useMutation({
        mutationFn: (values) => localApi.patch('/api/settings', values),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
    });

    // --- App-Settings (lokal) ---
    const appSettings = useAppSettings();
    const [appValues, setAppValues] = useState(null);
    if (!appValues) setAppValues(appSettings);

    return (
        <div className="page">
            <h1>Einstellungen</h1>

            <Card title="Server">
                {isLoading && <Spinner />}
                {error && <ErrorAlert error={error} />}
                {serverValues && (
                    <FormBuilder
                        catalog={SERVER_SETTINGS_CATALOG}
                        values={serverValues}
                        onChange={setServerValues}
                        onSubmit={() => saveServer.mutate(serverValues)}
                        submitLabel="Server speichern"
                        busy={saveServer.isPending}
                    />
                )}
                {saveServer.isSuccess && (
                    <div className="settings__result">
                        {saveServer.data.data.applied.map((k) => (
                            <Badge key={k} type="success">{k} — angewendet</Badge>
                        ))}
                        {saveServer.data.data.restartRequired.map((k) => (
                            <Badge key={k} type="warning">{k} — Restart erforderlich</Badge>
                        ))}
                    </div>
                )}
                {saveServer.isError && <ErrorAlert error={saveServer.error} />}
            </Card>

            <Card title="App (dieser Browser)">
                <FormBuilder
                    catalog={APP_SETTINGS_CATALOG}
                    values={appValues}
                    onChange={setAppValues}
                    onSubmit={() => setAppSettings(appValues)}
                    submitLabel="App speichern"
                />
            </Card>
        </div>
    );
}
```

**Verhalten:**
- **Token:** Prefill zeigt den maskierten Wert (`••••abcd`). Unverändert speichern = kein Change. Feld leeren = Token wird gelöscht. Neuer Wert = neuer Token.
- **Feedback:** Nach dem Speichern Badges pro Parameter: „angewendet" (grün) bzw. „Restart erforderlich" (gelb).
- **Routing:** `App.jsx` um `<Route path="settings" element={<Settings />} />` erweitern; `Sidebar.jsx` um den Eintrag.

### 6.10 Frontend: Theme & Auto-Refresh

**Theme** — CSS-Variablen aus `INITIAL_FRONTEND.md` §5.11 um ein Light-Schema ergänzen:

```css
:root {
    --color-bg: #1a1a2e;
    --color-surface: #16213e;
    --color-primary: #0f3460;
    --color-accent: #e94560;
    --color-text: #eaeaea;
    --color-muted: #a0a0a0;
    --color-success: #4caf50;
    --color-error: #f44336;
    --color-warning: #ff9800;
}

[data-theme='light'] {
    --color-bg: #f5f6fa;
    --color-surface: #ffffff;
    --color-primary: #0f3460;
    --color-accent: #e94560;
    --color-text: #1a1a2e;
    --color-muted: #555555;
}
```

Anwendung in `App.jsx` (reagiert auf Änderungen ohne Reload):

```jsx
import { useAppSettings } from './services/appSettings';
import { useEffect } from 'react';

export default function App() {
    const { theme } = useAppSettings();

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    return (
        <Routes>
            {/* ... (wie in INITIAL_FRONTEND.md §5.6) ... */}
        </Routes>
    );
}
```

**Auto-Refresh** — Dashboard/Listen lesen das Intervall aus den App-Settings statt harter 10s:

```js
import { getAppSettings } from '../services/appSettings';

useQuery({
    queryKey: [...QUERY_KEYS.hlsSessions, page],
    queryFn: () => api.get('/hls/sessions/list', { page, itemsPerPage }),
    refetchInterval: getAppSettings().autoRefreshMs || false, // 0 = aus
    // ...
});
```

**Seitengröße** — `usePagination` (`INITIAL_FRONTEND.md` §5.9) initialisiert `itemsPerPage` aus den App-Settings:

```js
import { getAppSettings } from '../services/appSettings';

export function usePagination() {
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(getAppSettings().itemsPerPage);
    return { page, setPage, itemsPerPage, setItemsPerPage };
}
```

### 6.11 Sicherheit

| Thema | Maßnahme |
|-------|----------|
| **Token-Leak** | `GET` liefert nur den maskierten Wert (`••••` + letzte 4). Der echte Token verlässt den Server nie. |
| **Token-Änderung** | Maskierter Wert im PATCH = kein Change; leer = löschen; sonst = neuer Wert. |
| **Secrets auf Disk** | `config.json` enthält den Token → **nicht** in die VCS committen (`.gitignore`-Eintrag `server/config.json`), Dateirechte beachten. |
| **Validierung** | Port-Range, URL-Format, Prefix-Format, Timeout-Minimum — ungültige Werte werden abgelehnt (400), nichts Halbgültiges persistiert. |
| **Auth** | `/api/settings` ist — wie der Rest der UI — ohne Login erreichbar (siehe offene Frage „Auth" in `INITIAL_BASICS.md` §9). Gleiche Vertrauensbasis wie die MediaMTX-API selbst. |
| **CSP** | Unverändert; Settings-Seite nutzt keine externen Ressourcen. |

### 6.12 Testing

**Server (vitest, Pflicht):**

- `server/src/Config.test.js`:
  - `getSettings()` maskiert den Token (`••••abcd`), leeres Token bleibt `''`.
  - `updateSettings()` mit gültigem Patch: Werte angewendet, `config.json` geschrieben, `applied`/`restartRequired` korrekt klassifiziert.
  - `updateSettings()` mit maskiertem Token: Token bleibt unverändert.
  - `updateSettings()` mit leerem Token: Token wird gelöscht.
  - Ungültige Werte (Port 0/70000, `ftp://`-URL, Prefix ohne `/`, Timeout 100) → Fehler mit `code: 'invalid_settings'`, nichts persistiert.
- `server/src/Router/SettingsRouter.test.js`:
  - `GET /api/settings` → `200 { success: true, data: { … maskierter Token … } }`.
  - `PATCH /api/settings` gültig → `200 { success: true, data: { applied, restartRequired } }`, Applier wurde aufgerufen.
  - `PATCH /api/settings` ungültig → `400 { success: false, code: 'invalid_settings' }`.

**Frontend:** Kein Test-Runner in `frontend/package.json` → manuell testen (Settings ändern → Reload → Werte bleiben; Theme wechselt; `apiBaseUrl`-Override wirkt sofort).

### 6.13 Offene Fragen / Erweiterungen

| Frage | Empfehlung | Status |
|-------|-----------|--------|
| **Reset auf Defaults** | Optional: `POST /api/settings/reset` → `config.resetToDefaults()` (alle Felder auf Defaults, inkl. Token-Löschung). | Offen |
| **Auth für Settings** | Wie in `INITIAL_BASICS.md` §9: optionaler Bearer-Token für die ganze UI. | Offen |
| **Per-User-Settings** | App-Settings sind pro Browser (localStorage). Server-Settings sind global. Genügt für den Admin-Betrieb. | Beantwortet |
| **Live-Port-Wechsel** | Nicht möglich ohne Neustart des HTTP-Servers — bewusst als „Restart erforderlich" markiert. | Beantwortet |

### 6.14 Zusammenfassung (Einstellungen)

- **Zwei Ebenen:** Server-Settings (persistiert, API-gesteuert) und App-Settings (Browser-lokal).
- **Server:** `Config.js` bekommt `getSettings()`/`updateSettings()`/`persist()`; `SettingsRouter` liefert `GET`/`PATCH /api/settings`; Runtime-Parameter (BaseUrl, Token, Timeout, Verbose) wirken sofort via `bridge.applyConfig()` + `Logger.setVerbose()`; `serverPort`/`bridgePrefix` nach Restart.
- **Frontend:** `appSettings.js`-Store (localStorage + `useSyncExternalStore`), Base-URL-Auflösung pro Request, `localApi` für Server-Endpunkte, Settings-Page über den bestehenden FormBuilder, Theme + Auto-Refresh + Seitengröße aus den App-Settings.
- **Sicherheit:** Token wird nie im Klartext zurückgegeben, Validierung vor Persistenz, `config.json` bleibt aus der VCS heraus.
- **Keine neuen Dependencies.**
