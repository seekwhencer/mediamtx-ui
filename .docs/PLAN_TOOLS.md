# Konzept: TOOLS — Modulares Tool-System (Frontend + Server)

> **Stand:** 2026-10-23 — Konzept, noch nicht implementiert.
> - Frontend-Grundlagen: siehe `INITIAL_FRONTEND.md`
> - Server-Grundlagen: siehe `INITIAL_SERVER.md`
> - Doku-Stil-Vorbild: `THEATRE.md`
>
> **Ziel:** Neues, **modulares** Tool-System.
> - **Navigation:** Neuer Punkt „Tools" links in der Sidebar, mit Untermenüpunkt „Switch" — und **bereit für weitere Untermenüpunkte**.
> - **Frontend:** „Switch" ist ein **Dummy** (Platzhalter). Die Architektur erlaubt es, später weitere Tools „einzuklinken", ohne bestehende Code zu zerlegen.
> - **Server:** Endpunkt `GET /tools` (Liste) + `GET /tool/:name` (pro Tool, z. B. `GET /tool/switch`).
>
> **Kernprinzip:** Ein Tool = **eine Datei pro Seite** (Server + Frontend) + **ein Eintrag in einer Registry**. Navigation, Routen und Endpunkte werden aus der Registry abgeleitet. Neues Tool = 1 Datei + 1 Registry-Eintrag + i18n-Keys. Kein Streuen über viele Dateien.

---

## 1. Ist-Zustand (Relevanz für das Konzept)

| Fakt | Detail |
|------|--------|
| Navigation | `navItems.js` → `NAV_SECTIONS` (Array aus Sektionen: `labelKey` + `items[]`). `Sidebar.jsx` rendert 1:1. Labels als i18n-Keys. |
| TopBar-Titel | `titleKeyForPath(pathname)` in `navItems.js` → i18n-Key des aktiven Nav-Items. |
| Routing | `App.jsx`: alle Routen unter `<Route element={<Layout />}>` (Sidebar + TopBar + Content). |
| Seiten-Muster | `components/pages/*.jsx`: `<div className="page">` + `page__header` (`page__title` + `page__subtitle`). |
| API-Client | `api/client.js`: `api` (MediaMTX via Bridge, Base `/v3`) **und** `localApi` (Server-eigene Endpunkte, Base `''`). |
| Server-Router | `Router/index.js` aggregiert: `/health` → `SettingsRouter` → `MediaMTXBridge` (`/v3`) → `FrontendRouter` (Catch-all, **muss zuletzt**). |
| Server-Endpunkt-Muster | `SettingsRouter.js`: Klasse mit `router`, Handler, Antwort `{ success: true, data }` / `{ success: false, error, code }`. |
| Server-Tests | `vitest` (`npm test`), Muster `test/SettingsRouter.test.js`: Express-App + `listen(0)` + `fetch`. |
| Styling | **Plain CSS**, BEM-artig, CSS-Variablen in `style/variables.css`, Komponenten-CSS in `style/components/*.css` (Import über `style/components/index.css`). Kein Tailwind. |
| i18n | `locales/{en,de,it}.json`, Top-Keys: `common`, `nav`, `topbar`, `dashboard`, `pages`, … |
| Query-Keys | `services/queryKeys.js` → `QUERY_KEYS` (Array pro Ressource). |
| Hooks | `useListQuery`, `useMutationWithInvalidate`, `useAutoRefresh` vorhanden. |
| UI-Bausteine | `Card`, `Badge`, `Button`, `Spinner`, `ErrorAlert` in `components/ui/`. |
| Detail-Layout | `detail.css`: `.detail__rows` / `.detail__row` (`dt`/`dd`) — wiederverwendbar für Tool-Metadaten. |
| Express | `^5.3.0` (ESM). Strict-Routing **aus** (Default) → `/tool/switch` und `/tool/switch/` matchen beide. |

**Fazit:** Feature ist **Frontend + Server**. Beides bekommt ein schlankes, registry-basiertes Modul-System. „Switch" ist der erste (Dummy-)Tool.

---

## 2. Architektur

```
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                             │
│                                                                      │
│  components/tools/registry.js   ← EINE Quelle: TOOLS[]               │
│     ├─ navItems.js  ← Sektion „Tools" + Items (abgeleitet)           │
│     ├─ App.jsx      ← Routen /tools/:name (abgeleitet)               │
│     └─ SwitchTool.jsx           ← Dummy-Seite (1 Tool = 1 Datei)     │
│                                                                      │
│  localApi.get('/tools')  ·  localApi.get('/tool/switch')             │
└──────────────────────────────────────────────────────────────────────┘
                                   │  HTTP (JSON)
┌──────────────────────────────────────────────────────────────────────┐
│  SERVER                                                               │
│                                                                      │
│  src/Tools/index.js           ← EINE Quelle: ToolRegistry            │
│     ├─ Tool.js                ← Basis-Klasse (Meta + handle)         │
│     ├─ SwitchTool.js          ← 1. Tool (Dummy)                      │
│     └─ ToolsRouter.js         ← GET /tools · GET /tool/:name         │
│                                                                      │
│  Router/index.js:  /health → Settings → TOOLS → Bridge → Frontend    │
└──────────────────────────────────────────────────────────────────────┘
```

**Kernentscheidungen:**

1. **Registry pro Seite.** Frontend: `components/tools/registry.js`. Server: `src/Tools/index.js`. Alles Weitere (Nav, Routen, Endpunkte) wird daraus abgeleitet.
2. **Ein Tool = eine Datei.** Server: `SwitchTool.js` (erbt `Tool`). Frontend: `SwitchTool.jsx`. Kein Tool-Code in zentralen Dateien.
3. **Server ist die Datenquelle für Tool-Metadaten.** `GET /tools` liefert die Liste, `GET /tool/:name` liefert Detail-Daten. Die Frontend-Seite rendert, was der Server antwortet → Dummy-Inhalt kommt aus dem Server, nicht aus dem Frontend-Bundle.
4. **Kein State-Management-Framework.** React-Query (`useQuery`) + lokaler State. Bestehende Hooks wiederverwenden.
5. **Keine neuen Dependencies.** Nur Express (vorhanden), React, React-Query, i18next (alle vorhanden).
6. **Endpunkte ohne `/api`-Präfix** (explizite Vorgabe: `tools`, `tool/toolname/`). Abweichung von `/api/settings` — bewusst, s. §12.

---

## 3. Server: Modulares Tool-System

### 3.1 Dateistruktur

| Datei | Typ | Aufgabe |
|-------|-----|---------|
| `server/src/Tools/Tool.js` | NEU | Basis-Klasse: Metadaten (`name`, `label`, `description`, `version`, `enabled`) + `meta()` + `handle(req,res)`. |
| `server/src/Tools/SwitchTool.js` | NEU | 1. Tool (Dummy): erbt `Tool`, liefert Platzhalter-Payload. |
| `server/src/Tools/index.js` | NEU | `ToolRegistry` (Klasse) + `createToolRegistry(logger)` (Factory, registriert `SwitchTool`). **Einziger Registrierungspunkt.** |
| `server/src/Router/ToolsRouter.js` | NEU | Express-Router: `GET /tools` + `GET /tool/:name`. |
| `server/src/Router/index.js` | ÄNDERN | `ToolsRouter` verdrahten (nach Settings, vor Bridge). |
| `server/test/ToolsRouter.test.js` | NEU | Vitest: Liste, Detail, 404. |

### 3.2 Basis-Klasse `Tool.js`

```js
/**
 * Basis-Klasse für ein Tool.
 * Ein Tool = Metadaten (für GET /tools) + Handler (für GET /tool/:name).
 */
class Tool {
    /**
     * @param {object} def
     * @param {string} def.name        - eindeutiger Name (URL-Segment, z. B. 'switch')
     * @param {string} def.label       - Anzeigename (z. B. 'Switch')
     * @param {string} def.description - kurze Beschreibung
     * @param {string} def.version     - SemVer-String
     * @param {boolean} [def.enabled]  - true = in der Liste sichtbar
     */
    constructor({ name, label, description, version, enabled = true }) {
        if (!name || !/^[a-z0-9-]+$/.test(name)) {
            throw new Error(`Tool: ungültiger Name "${name}" (erwartet: a-z, 0-9, -)`);
        }
        this.name = name;
        this.label = label || name;
        this.description = description || '';
        this.version = version || '0.1.0';
        this.enabled = enabled;
    }

    /** Metadaten für GET /tools (flach, serialisierbar). */
    meta() {
        return {
            name: this.name,
            label: this.label,
            description: this.description,
            version: this.version,
            enabled: this.enabled,
        };
    }

    /**
     * Handler für GET /tool/:name.
     * Default: Metadaten + Status. Subklassen erweitern/überschreiben.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async handle(req, res) {
        res.status(200).json({
            success: true,
            data: { ...this.meta(), status: 'active', capabilities: [] },
        });
    }
}

export { Tool };
```

**Regeln:**
- `name` ist der **einzige** Identifier (URL-Segment). Format `[a-z0-9-]+` (keine Umlaute, keine Leerzeichen) → URL-sicher, kein Encoding nötig.
- `handle()` ist asynchron (später: DB, Bridge, externe Aufrufe).
- Fehler: `handle()` wirft oder sendet `{ success: false, error, code }` (s. §5.3).

### 3.3 1. Tool `SwitchTool.js` (Dummy)

```js
import { Tool } from './Tool.js';

/**
 * Switch — Platzhalter-Tool.
 * Bewusst minimal: beweist den Datenfluss Frontend → GET /tool/switch → Antwort.
 * Später: echte Logik (z. B. Stream-Quell-Umschaltung) in handle() ergänzen.
 */
class SwitchTool extends Tool {
    constructor() {
        super({
            name: 'switch',
            label: 'Switch',
            description: 'Placeholder tool for the modular tool system.',
            version: '0.1.0',
            enabled: true,
        });
    }

    async handle(req, res) {
        res.status(200).json({
            success: true,
            data: {
                ...this.meta(),
                status: 'placeholder',
                capabilities: [],
                message: 'This is a placeholder tool. Real functionality will be added later.',
            },
        });
    }
}

export { SwitchTool };
```

### 3.4 Registry `index.js` (einziger Registrierungspunkt)

```js
import { SwitchTool } from './SwitchTool.js';

/**
 * ToolRegistry — hält alle Tools, liefert Liste + Lookup.
 */
class ToolRegistry {
    constructor(logger) {
        this.logger = logger || { log: () => {}, error: () => {} };
        this.tools = new Map();
    }

    /** @param {import('./Tool.js').Tool} tool */
    register(tool) {
        if (this.tools.has(tool.name)) {
            this.logger.error('[ToolRegistry]', `Doppelter Tool-Name: ${tool.name}`);
            throw new Error(`Tool already registered: ${tool.name}`);
        }
        this.tools.set(tool.name, tool);
        return this;
    }

    /** Alle (aktiven) Tools als Metadaten-Array, sortiert nach Name. */
    list() {
        return [...this.tools.values()]
            .filter((t) => t.enabled)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((t) => t.meta());
    }

    /** @returns {import('./Tool.js').Tool|null} */
    get(name) {
        return this.tools.get(name) || null;
    }
}

/**
 * Factory: erzeugt die Registry + registriert alle Tools.
 * NEUES TOOL HINZUFÜGEN = hier eine Zeile (register) + neue Tool-Datei.
 */
function createToolRegistry(logger) {
    const registry = new ToolRegistry(logger);
    registry
        .register(new SwitchTool())
        // .register(new RecorderTool())   // ← späteres Tool: 1 Zeile
        ;
    return registry;
}

export { ToolRegistry, createToolRegistry };
```

### 3.5 Router `ToolsRouter.js`

```js
import express from 'express';

/**
 * Tools-Endpunkte (server-eigen, nicht an MediaMTX proxied).
 * GET /tools        → Liste aller aktiven Tools (Metadaten)
 * GET /tool/:name   → Detail-Daten eines Tools (Tool.handle)
 */
class ToolsRouter {
    /**
     * @param {import('../Tools/index.js').ToolRegistry} registry
     * @param {object} [logger]
     */
    constructor(registry, logger) {
        this.registry = registry;
        this.label = '[ToolsRouter]';
        this.logger = logger || { log: () => {}, error: () => {} };
        this.router = express.Router();

        this.router.get('/tools', this.handleList.bind(this));
        this.router.get('/tool/:name', this.handleDetail.bind(this));
    }

    handleList(req, res) {
        res.status(200).json({ success: true, data: { tools: this.registry.list() } });
    }

    async handleDetail(req, res) {
        const tool = this.registry.get(req.params.name);
        if (!tool) {
            this.logger.log(this.label, `Tool nicht gefunden: ${req.params.name}`);
            return res.status(404).json({
                success: false,
                error: `Tool not found: ${req.params.name}`,
                code: 'tool_not_found',
            });
        }
        try {
            await tool.handle(req, res);
        } catch (err) {
            const status = err.status || 500;
            this.logger.error(this.label, `Tool "${req.params.name}" fehlgeschlagen: ${err.message}`);
            res.status(status).json({
                success: false,
                error: err.message,
                code: err.code || 'tool_error',
            });
        }
    }
}

export { ToolsRouter };
```

### 3.6 Verdrahtung in `Router/index.js`

```js
import { createToolRegistry } from '../Tools/index.js';
import { ToolsRouter } from './ToolsRouter.js';
// …
async define() {
    // 1. Health
    this.router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

    // 2. Settings (server-eigene Endpunkte)
    this.settingsRouter = new SettingsRouter(this.config, this.logger);
    this.router.use(this.settingsRouter.router);

    // 2b. TOOLS (server-eigene Endpunkte) — NEU, vor der Bridge
    this.toolRegistry = createToolRegistry(this.logger);
    this.toolsRouter = new ToolsRouter(this.toolRegistry, this.logger);
    this.router.use(this.toolsRouter.router);

    // 3. MediaMTX-Bridge (agnostischer Proxy) — VOR dem Frontend.
    // … (unverändert)
}
```

**Reihenfolge bleibt:** `/health` → Settings → **Tools** → Bridge → Frontend (Catch-all zuletzt). Kein Konflikt: `/tools`, `/tool/*` kollidieren weder mit `/api/settings` noch mit `/v3/*`.

### 3.7 Neues Tool einbinden (Server) — 3 Schritte

1. `server/src/Tools/MyTool.js` anlegen (erbt `Tool`, implementiert `handle()`).
2. In `server/src/Tools/index.js`: `.register(new MyTool())` (1 Zeile).
3. Fertig. `GET /tools` + `GET /tool/mytool` funktionieren automatisch.

---

## 4. Frontend: Modulares Tool-System

### 4.1 Dateistruktur

| Datei | Typ | Aufgabe |
|-------|-----|---------|
| `frontend/src/components/tools/registry.js` | NEU | `TOOLS[]` (name, labelKey, path, component) + `TOOL_NAV_ITEMS`. **Einzige Quelle** für Nav + Routen. |
| `frontend/src/components/tools/SwitchTool.jsx` | NEU | Dummy-Seite: lädt `GET /tool/switch`, rendert Metadaten. |
| `frontend/src/components/layout/navItems.js` | ÄNDERN | Sektion „Tools" + Items aus Registry. |
| `frontend/src/App.jsx` | ÄNDERN | Routen `/tools/:name` aus Registry. |
| `frontend/src/services/queryKeys.js` | ÄNDERN | `tools` + `tool(name)`. |
| `frontend/src/locales/{en,de,it}.json` | ÄNDERN | `nav.tools`, `nav.toolsSwitch`, `pages.toolsSwitch.*`. |
| `frontend/src/style/components/tools.css` | NEU | `.tools__meta` (oder Wiederverwendung `.detail__rows`). |
| `frontend/src/style/components/index.css` | ÄNDERN | `@import './tools.css';` |

### 4.2 Registry `registry.js` (einzige Quelle)

```js
import SwitchTool from './SwitchTool.jsx';

/**
 * TOOLS — EINE Quelle für Navigation + Routen.
 * NEUES TOOL HINZUFÜGEN = neue Komponente-Datei + ein Eintrag hier.
 *
 * @typedef {object} ToolDef
 * @property {string}  name       - muss zum Server-Tool-Namen passen (URL-Segment)
 * @property {string}  labelKey   - i18n-Key für den Nav-Label
 * @property {string}  path       - absolute Route
 * @property {React.ComponentType} component - Seiten-Komponente
 */
export const TOOLS = [
  {
    name: 'switch',
    labelKey: 'nav.toolsSwitch',
    path: '/tools/switch',
    component: SwitchTool,
  },
  // { name: 'recorder', labelKey: 'nav.toolsRecorder', path: '/tools/recorder', component: RecorderTool },
];

/** Nav-Items für die Sidebar (Sektion „Tools"). */
export const TOOL_NAV_ITEMS = TOOLS.map(({ path, labelKey }) => ({ to: path, labelKey }));

export default TOOLS;
```

### 4.3 Navigation `navItems.js`

```js
import { TOOL_NAV_ITEMS } from '../../tools/registry';

export const NAV_SECTIONS = [
  // … (Theater, Overview, Configuration, Runtime, Recordings — unverändert)
  {
    labelKey: 'nav.recordings',
    items: [{ to: '/recordings', labelKey: 'nav.recordings' }],
  },
  {
    labelKey: 'nav.tools',          // ← NEU: Sektion „Tools"
    items: TOOL_NAV_ITEMS,          // ← aus Registry (aktuell: Switch)
  },
  {
    labelKey: 'nav.settings',
    items: [{ to: '/settings', labelKey: 'nav.settings' }],
  },
];
```

**Position:** zwischen „Recordings" und „Settings" (Settings bleibt zuletzt). `titleKeyForPath` funktioniert ohne Änderung: `/tools/switch` matcht `item.to` → liefert `nav.toolsSwitch`.

### 4.4 Routing `App.jsx`

```jsx
import { TOOLS } from './tools/registry';
// …
<Route element={<Layout />}>
  {/* … bestehende Routen … */}
  {TOOLS.map((tool) => (
    <Route key={tool.name} path={`tools/${tool.name}`} element={<tool.component />} />
  ))}
  <Route path="*" element={<NotFound />} />
</Route>
```

**Wichtig:** `path={`tools/${tool.name}`}` (nicht `tool.path`) → Route und Name bleiben gekoppelt, kein doppeltes Pfad-Management.

### 4.5 Query-Keys `queryKeys.js`

```js
export const QUERY_KEYS = {
  // … bestehende …
  tools: ['tools'],
  tool: (name) => ['tools', name],
};
```

### 4.6 Dummy-Seite `SwitchTool.jsx`

```jsx
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { localApi } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import ErrorAlert from '../ui/ErrorAlert';

export default function SwitchTool() {
  const { t } = useTranslation();

  const { data, isPending, error } = useQuery({
    queryKey: QUERY_KEYS.tool('switch'),
    queryFn: () => localApi.get('/tool/switch').then((res) => res.data),
    retry: false,
    staleTime: 30_000,
  });

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.toolsSwitch.title')}</h2>
          <p className="page__subtitle">{t('pages.toolsSwitch.subtitle')}</p>
        </div>
      </header>

      <Card title={t('pages.toolsSwitch.cardTitle')}>
        {isPending && <Spinner />}
        {error && <ErrorAlert error={error} />}
        {data && (
          <dl className="detail__rows tools__meta">
            <div className="detail__row">
              <dt>{t('pages.toolsSwitch.fields.name')}</dt>
              <dd>{data.name}</dd>
            </div>
            <div className="detail__row">
              <dt>{t('pages.toolsSwitch.fields.version')}</dt>
              <dd>{data.version}</dd>
            </div>
            <div className="detail__row">
              <dt>{t('pages.toolsSwitch.fields.status')}</dt>
              <dd><Badge color="gray">{data.status}</Badge></dd>
            </div>
            <div className="detail__row">
              <dt>{t('pages.toolsSwitch.fields.description')}</dt>
              <dd>{data.description}</dd>
            </div>
          </dl>
        )}
      </Card>
    </div>
  );
}
```

**Bewusst:** rendert **Server-Daten** (nicht Frontend-Hardcode) → beweist den kompletten Datenfluss und macht den Dummy austauschbar (später: echte `handle()`-Daten).

### 4.7 Neues Tool einbinden (Frontend) — 3 Schritte

1. `frontend/src/components/tools/MyTool.jsx` anlegen (Seiten-Komponente).
2. In `registry.js`: Eintrag in `TOOLS[]` (name, labelKey, path, component).
3. i18n-Keys `nav.toolsMyTool` + `pages.toolsMyTool.*` in `en/de/it.json`.

Fertig. Nav-Item + Route erscheinen automatisch.

---

## 5. API-Kontrakt

> Alle Endpunkte sind **server-eigen** (nicht an MediaMTX proxied). Frontend nutzt `localApi` (Base `''`).

### 5.1 `GET /tools` — Liste

**Antwort 200:**
```json
{
  "success": true,
  "data": {
    "tools": [
      {
        "name": "switch",
        "label": "Switch",
        "description": "Placeholder tool for the modular tool system.",
        "version": "0.1.0",
        "enabled": true
      }
    ]
  }
}
```

### 5.2 `GET /tool/:name` — Detail (Beispiel `switch`)

**Antwort 200:**
```json
{
  "success": true,
  "data": {
    "name": "switch",
    "label": "Switch",
    "description": "Placeholder tool for the modular tool system.",
    "version": "0.1.0",
    "enabled": true,
    "status": "placeholder",
    "capabilities": [],
    "message": "This is a placeholder tool. Real functionality will be added later."
  }
}
```

### 5.3 Fehler

| Fall | Status | Body |
|------|--------|------|
| unbekanntes Tool | `404` | `{ "success": false, "error": "Tool not found: xyz", "code": "tool_not_found" }` |
| Tool-Handler wirft | `err.status \|\| 500` | `{ "success": false, "error": "<msg>", "code": "tool_error" }` |

**Konvention:** exakt wie `SettingsRouter` (`{ success, data }` / `{ success, error, code }`).

### 5.4 Trailing-Slash

Express 5, Strict-Routing **aus** (Default) → `GET /tool/switch` und `GET /tool/switch/` liefern identisch. Die Vorgabe „`tool/toolname/`" ist damit erfüllt, ohne Extra-Route.

---

## 6. UI/UX-Spezifikation (Switch-Dummy)

- **Sidebar:** neue Sektion „Tools" (Label `nav.tools`), darunter Item „Switch" (`nav.toolsSwitch`). Active-State auf `/tools/switch` (bestehendes `sidebar__link.is-active`).
- **TopBar:** Titel „Switch" (via `titleKeyForPath` → `nav.toolsSwitch`).
- **Seite:** `page__header` (Titel + Subtitle) + 1 `Card` mit Tool-Metadaten (Name, Version, Status-Badge, Beschreibung).
- **States:**
  - `loading`: `Spinner` in der Card.
  - `error`: `ErrorAlert` mit Meldung (z. B. Server offline).
  - `success`: Metadaten-Grid (`.detail__rows`).
- **Keine Interaktion** in v1 (reines Anzeigen). Buttons/Actions kommen mit echten Tools.

---

## 7. Datenfluss

```
SwitchTool.jsx
  └─ useQuery(QUERY_KEYS.tool('switch'),
        () => localApi.get('/tool/switch').then(r => r.data))
        → GET /tool/switch  (Server)
            → ToolsRouter.handleDetail
                → registry.get('switch') → SwitchTool.handle
                    → { success, data: { name, version, status, … } }
  └─ rendert data (Name, Version, Status, Beschreibung)
```

- **Server = Datenquelle.** Frontend hardcodet keinen Tool-Inhalt.
- `staleTime: 30s` reicht für Metadaten (selten Änderung). Kein Auto-Refresh nötig (v1).

---

## 8. i18n-Keys (en/de/it)

> **Namenskonvention:** flache Nav-Keys (konsistent mit `nav.internalUsers` etc.).
> Sektion: `nav.tools` · Item pro Tool: `nav.tools<ToolName>` (z. B. `nav.toolsSwitch`).
> Seiten-Content: `pages.tools<ToolName>.*`.

```jsonc
// en.json
"nav": {
  "tools": "Tools",
  "toolsSwitch": "Switch"
},
"pages": {
  "toolsSwitch": {
    "title": "Switch",
    "subtitle": "Placeholder tool for the modular tool system.",
    "cardTitle": "Tool info",
    "fields": {
      "name": "Name",
      "version": "Version",
      "status": "Status",
      "description": "Description"
    }
  }
}
```

```jsonc
// de.json
"nav": {
  "tools": "Tools",
  "toolsSwitch": "Switch"
},
"pages": {
  "toolsSwitch": {
    "title": "Switch",
    "subtitle": "Platzhalter-Tool für das modulare Tool-System.",
    "cardTitle": "Tool-Info",
    "fields": {
      "name": "Name",
      "version": "Version",
      "status": "Status",
      "description": "Beschreibung"
    }
  }
}
```

```jsonc
// it.json
"nav": {
  "tools": "Strumenti",
  "toolsSwitch": "Switch"
},
"pages": {
  "toolsSwitch": {
    "title": "Switch",
    "subtitle": "Strumento segnaposto per il sistema modulare di strumenti.",
    "cardTitle": "Info strumento",
    "fields": {
      "name": "Nome",
      "version": "Versione",
      "status": "Stato",
      "description": "Descrizione"
    }
  }
}
```

---

## 9. Styling

- **Wiederverwendung:** `.detail__rows` / `.detail__row` (`detail.css`) für das Metadaten-Grid → kein neues Grid nötig.
- **Neu `tools.css`** (minimal, nur falls nötig):
  ```css
  /* ===== Tools (Tool-Seiten) ===== */
  .tools__meta {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
  ```
- **Import:** `style/components/index.css` → `@import './tools.css';`
- **Regel:** nur CSS-Variablen aus `variables.css`, keine Hardcodes. Dark/Light-Theme automatisch (Variablen).

---

## 10. Tests (Server)

`server/test/ToolsRouter.test.js` (Muster: `SettingsRouter.test.js`):

| Test | Erwartung |
|------|-----------|
| `GET /tools` → 200 | `{ success: true, data.tools[] }` enthält `switch` (name, label, version, enabled) |
| `GET /tool/switch` → 200 | `{ success: true, data.name === 'switch' }`, `status === 'placeholder'` |
| `GET /tool/unknown` → 404 | `{ success: false, code: 'tool_not_found' }` |
| Registry: doppelte Registrierung | wirft `Error` (kein stiller Override) |

**Frontend:** kein Test-Framework vorhanden (wie bei THEATRE) → manuell via Build + E2E (s. Phase 6).

---

## 11. Akzeptanzkriterien

- [ ] Sidebar: neue Sektion „Tools" mit Untermenüpunkt „Switch" (zwischen Recordings und Settings).
- [ ] `/tools/switch` erreichbar über Sidebar und URL, Active-State korrekt.
- [ ] TopBar-Titel auf `/tools/switch` = „Switch".
- [ ] Switch-Seite rendert Server-Metadaten (Name, Version, Status, Beschreibung) aus `GET /tool/switch`.
- [ ] `GET /tools` liefert die Tool-Liste (enthält `switch`).
- [ ] `GET /tool/switch` liefert Detail-Daten; `GET /tool/unknown` → 404 `tool_not_found`.
- [ ] Loading- und Error-State auf der Switch-Seite sichtbar (kein White-Screen).
- [ ] i18n: en/de/it vollständig (keine fehlenden Keys in der Console).
- [ ] `npm test` (server) grün, inkl. neuer `ToolsRouter.test.js`.
- [ ] `npm run build` (frontend) grün.
- [ ] Manueller E2E via `docker exec mediamtx-ui …` (Dev-Architektur laut AGENTS.md).
- [ ] **Modularität:** neues Tool lässt sich mit 1 Datei + 1 Registry-Eintrag (pro Seite) einbinden — dokumentiert in §3.7 / §4.7.

---

## 12. Risiken & offene Punkte

| Risiko / Punkt | Einschätzung / Gegenmaßnahme |
|----------------|------------------------------|
| **Endpunkt-Präfix:** Vorgabe `tools` / `tool/toolname/` weicht von `/api/settings` ab. | Bewusst so umgesetzt (explizite Vorgabe). **Offene Entscheidung:** später ggf. nachziehen auf `/api/tools` + `/api/tool/:name` für Konsistenz. Bruch wäre nur 1 Router-Pfad + Frontend-`localApi`-Pfade. |
| **Name-Kollision Frontend/Server:** Tool-`name` muss auf beiden Seiten identisch sein. | Doku-Regel (§3.7/§4.7): `name` = einziger Identifier. Optional: Frontend-Registry validiert `path === '/tools/' + name`. |
| **Tool-Handler wirft asynchron** | `ToolsRouter.handleDetail` fängt via try/catch → sauberes `{ success:false, code }`. |
| **Viele Tools später** | Sidebar-Sektion skaliert (Liste). Bei > 8 Tools: ggf. Gruppierung/Icons (Backlog). |
| **Dummy-Inhalt veraltet** | Switch rendert Server-Daten → Inhalt bleibt aktuell, wenn `handle()` später echte Logik bekommt. |
| **CORS / Base-URL** | `localApi` nutzt relative Pfade (Base `''`) → kein CORS-Problem (gleicher Origin wie UI). |

---

## 13. Bewusst NICHT in v1 (Backlog)

- **Echte Switch-Funktionalität** (z. B. Stream-Quell-Umschaltung, Config-Mutation) — kommt mit dem echten Use-Case.
- **Tool-Actions** (POST/PATCH auf `GET /tool/:name`, z. B. „Switch ausführen") — v1 ist read-only.
- **Dynamische Nav aus `GET /tools`** (Server steuert, welche Tools sichtbar sind) — v1: statische Frontend-Registry. Später: Frontend filtert Nav-Items gegen `GET /tools`.
- **Tool-Icons** in der Sidebar (aktuell: Text-Labels wie alle anderen Sektionen).
- **Tool-Gruppierung / Kategorien** (wenn > 8 Tools).
- **Frontend-Tests** (kein Test-Framework im Frontend vorhanden).
- **`/api`-Präfix** für Konsistenz mit `/api/settings` (s. §12).

---

## 14. Roadmap: 6 Phasen

> **Stand:** 2026-10-23 — Konzept, noch nicht implementiert.
> **Legende:** ✅ erledigt · 🚧 teilweise · ⬜ offen
> **Aufbau:** 6 Phasen, sequenziell. Eine Phase ist abgeschlossen, wenn alle Akzeptanzkriterien grün sind.
> **Abhängigkeiten:** P2 braucht P1 · P3 braucht P1 · P4 braucht P3 · P5 braucht P3+P4 · P6 braucht alles.

### Status-Übersicht

| Phase | Fortschritt | Aufwand |
|-------|-------------|---------|
| Phase 1: Server — Tool-Basis (Tool + Registry) | 0/3 | 3/10 |
| Phase 2: Server — SwitchTool + Router + Tests | 0/4 | 5/10 |
| Phase 3: Frontend — Registry + SwitchTool-Seite | 0/3 | 4/10 |
| Phase 4: Frontend — Navigation + Routing + Query-Keys | 0/3 | 2/10 |
| Phase 5: i18n + Styling | 0/3 | 2/10 |
| Phase 6: Integration & Testing | 0/5 | 4/10 |

**Gesamt: 0/21 Schritte · Gesamtaufwand: 20/100**

---

### Phase 1: Server — Tool-Basis · Aufwand 3/10

> Fundament: Basis-Klasse + Registry. Noch kein Router, noch kein Tool.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 1.1 | `server/src/Tools/Tool.js`: Basis-Klasse (`name`-Validierung, `meta()`, `handle()`-Default) | `new Tool({name:'x'})` wirft bei ungültigem Namen; `meta()` liefert flaches Objekt | ⬜ |
| 1.2 | `server/src/Tools/index.js`: `ToolRegistry` (register/list/get) + `createToolRegistry(logger)` | `register` wirft bei Doppel-Name; `list()` sortiert + filtert `enabled` | ⬜ |
| 1.3 | Import-Check: `node -e "import('./src/Tools/index.js')"` (ESM) ohne Fehler | Modul lädt sauber, keine Zirkularimporte | ⬜ |

**Abnahme Phase 1:** Registry ist isoliert nutzbar (register → list → get), Name-Validierung greift.

---

### Phase 2: Server — SwitchTool + Router + Tests · Aufwand 5/10

> Erster lauffähiger Endpunkt. `GET /tools` + `GET /tool/switch` antworten.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 2.1 | `server/src/Tools/SwitchTool.js`: Dummy-Tool (erbt `Tool`, `handle()` mit `status:'placeholder'`) | `new SwitchTool().meta().name === 'switch'` | ⬜ |
| 2.2 | `server/src/Tools/index.js`: `SwitchTool` in `createToolRegistry` registrieren | `createToolRegistry().list()` enthält `switch` | ⬜ |
| 2.3 | `server/src/Router/ToolsRouter.js`: `GET /tools` + `GET /tool/:name` (404 `tool_not_found`, try/catch) | Beide Endpunkte antworten korrekt | ⬜ |
| 2.4 | `server/src/Router/index.js`: `ToolsRouter` verdrahten (nach Settings, vor Bridge) + `test/ToolsRouter.test.js` (4 Tests, s. §10) | `npm test` grün, inkl. neuer Tests | ⬜ |

**Abnahme Phase 2:** `curl localhost:3000/tools` und `curl localhost:3000/tool/switch` liefern gültiges JSON; `npm test` grün.

---

### Phase 3: Frontend — Registry + SwitchTool-Seite · Aufwand 4/10

> Frontend-Modul: Registry + Dummy-Seite. Noch nicht in Nav/Routing.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 3.1 | `frontend/src/components/tools/registry.js`: `TOOLS[]` + `TOOL_NAV_ITEMS` (Eintrag `switch`) | `TOOLS[0].name === 'switch'`, `TOOL_NAV_ITEMS` korrekt | ⬜ |
| 3.2 | `frontend/src/components/tools/SwitchTool.jsx`: Seite (useQuery `GET /tool/switch`, Card, States) | Rendert Server-Metadaten; Loading/Error-States sichtbar | ⬜ |
| 3.3 | `frontend/src/services/queryKeys.js`: `tools` + `tool(name)` | Keys vorhanden, konsistent | ⬜ |

**Abnahme Phase 3:** SwitchTool-Komponente ist isoliert renderbar (z. B. temporäre Route) und lädt Server-Daten.

---

### Phase 4: Frontend — Navigation + Routing · Aufwand 2/10

> Tool wird sichtbar + erreichbar.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 4.1 | `navItems.js`: Sektion „Tools" + `TOOL_NAV_ITEMS` (zwischen Recordings und Settings) | Sidebar zeigt Sektion „Tools" mit Item „Switch" | ⬜ |
| 4.2 | `App.jsx`: Routen aus `TOOLS` (`tools/${name}`) innerhalb `<Layout>` | `/tools/switch` erreichbar, Active-State korrekt | ⬜ |
| 4.3 | `titleKeyForPath` prüfen (liefert `nav.toolsSwitch` für `/tools/switch`) | TopBar-Titel = „Switch", keine falschen Titel auf anderen Seiten | ⬜ |

**Abnahme Phase 4:** `/tools/switch` über Sidebar + URL erreichbar, Navigation dorthin/von dort sauber.

---

### Phase 5: i18n + Styling · Aufwand 2/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 5.1 | i18n-Keys `nav.tools`, `nav.toolsSwitch`, `pages.toolsSwitch.*` in `en/de/it.json` (s. §8) | Keine fehlenden Keys (Console-Check), alle 3 Sprachen vollständig | ⬜ |
| 5.2 | `style/components/tools.css` (`.tools__meta`) + Import in `index.css` | Build ohne fehlende Styles, Grid korrekt | ⬜ |
| 5.3 | Dark/Light-Theme + Mobile (375 px) prüfen | Beide Themes OK, Mobile nutzbar | ⬜ |

**Abnahme Phase 5:** Feature in allen 3 Sprachen, in beiden Themes, auf Mobile + Desktop vollständig bedienbar.

---

### Phase 6: Integration & Testing · Aufwand 4/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 6.1 | `npm test` (server) grün | 0 Failures, inkl. `ToolsRouter.test.js` | ⬜ |
| 6.2 | `npm run build` (frontend) grün | Production-Build ohne Fehler | ⬜ |
| 6.3 | Manueller E2E via `docker exec mediamtx-ui …`: Nav → Switch → Metadaten; `curl /tools` + `/tool/switch` + `/tool/unknown` | Alle Akzeptanzkriterien aus §11 grün | ⬜ |
| 6.4 | Modularitäts-Check: fiktives 2. Tool nur über Doku-Schritte (§3.7/§4.7) „einbinden" (Code-Review, kein Merge) | 1 Datei + 1 Registry-Eintrag pro Seite reichen — bestätigt | ⬜ |
| 6.5 | `.HANDOFF_STATE.md` aktualisieren (Status COMPLETED, nächste Optionen aus §13) | Handoff-Datei aktuell | ⬜ |

**Abnahme Phase 6:** Feature produktionsreif. Alle Akzeptanzkriterien aus §11 erfüllt.

---

### Meilensteine

| Meilenstein | Phasen | Ergebnis |
|-------------|--------|----------|
| **M1: Server antwortet** | 1–2 | `GET /tools` + `GET /tool/switch` liefern gültiges JSON, Tests grün |
| **M2: Sichtbar & erreichbar** | 3–4 | Sidebar „Tools" → „Switch", Seite rendert Server-Daten |
| **M3: Poliert** | 5 | i18n (en/de/it), Styling, Themes, Mobile |
| **M4: Fertig** | 6 | Tests/Build/E2E grün, Modularität bestätigt, produktionsreif |
