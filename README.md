# mediamtx-ui

Web-basiertes Admin-Interface für [MediaMTX](https://github.com/bluenviron/mediamtx).
Dashboard, Konfiguration, Laufzeit-Monitoring und Recordings — über die MediaMTX-API (`/v3/*`).

## Features

- **Dashboard** — Karten pro Protokoll (HLS, RTSP/RTSPS, RTMP/RTMPS, SRT, WebRTC, MoQ), Instanz-Info (Version, Startzeit), Pfad-Übersicht (online/available), Auto-Refresh
- **Konfiguration** — Global, Path Defaults, Interne Benutzer, Pfade (Add/Edit/Replace/Delete); schema-gesteuerte Formulare, deprecated Felder ausgeblendet
- **Laufzeit** — Pfad-Liste + Detail (Source, Readers, Tracks, Forward-Destinations, Static Source); Sessions/Connections aller Protokolle inkl. **Kick**
- **Recordings** — Liste + Segment-Delete
- **Settings** — Server-Settings via API (persistiert, „angewendet"/„Restart erforderlich"-Feedback) + App-Settings lokal im Browser (Theme, Auto-Refresh, Seitengröße, API-Base-URL)
- **Dark/Light Theme** — ohne Reload umschaltbar
- **Config-Persistenz** — nach erfolgreichen Config-Mutationen wird die aktuelle MediaMTX-Config als `mediamtx.yml` geschrieben (optional, `MEDIAMTX_CONFIG_PATH`)

## Screenshots

| | |
|---|---|
| ![Dashboard](.docs/screenshots/dashboard.png) | ![Global](.docs/screenshots/config-global.png) |
| ![Interne Benutzer](.docs/screenshots/config-internal-users.png) | ![Pfade (Konfiguration)](.docs/screenshots/config-paths.png) |
| ![Path Defaults](.docs/screenshots/config-path-defaults.png) | ![Pfade (Laufzeit)](.docs/screenshots/runtime-paths.png) |
| ![HLS](.docs/screenshots/runtime-hls.png) | ![RTSP](.docs/screenshots/runtime-rtsp.png) |
| ![RTMP](.docs/screenshots/runtime-rtmp.png) | ![SRT](.docs/screenshots/runtime-srt.png) |
| ![WebRTC](.docs/screenshots/runtime-webrtc.png) | ![MoQ](.docs/screenshots/runtime-moq.png) |
| ![Recordings](.docs/screenshots/recordings.png) | ![Settings](.docs/screenshots/settings.png) |

## Architektur

```
Browser ──► UI-Server (Node.js 22, Express 5)
              ├─ /health            → Health-Check
              ├─ /api/settings      → Server-Settings (GET/PATCH, persistiert)
              ├─ /v3/*              → MediaMTXBridge (agnostischer Reverse-Proxy → MediaMTX-API)
              └─ /*                 → FrontendRouter (React-App: Build aus dist/ oder Vite-Dev)
```

- **`server/`** — Node.js 22, Express 5, ESM. Die `MediaMTXBridge` leitet jeden Request unter `/v3/*` 1:1 an MediaMTX weiter (Methode, Pfad, Query, Body, Header) — kein pro-Endpoint-Code. Neue MediaMTX-Endpoints brauchen null Server-Code.
- **`frontend/`** — React 19, Vite 8, TanStack Query, React Router 7, react-markdown. Generischer API-Client (`api.get/post/patch/delete`) statt Einzel-Funktionen.
- **Route-Reihenfolge ist Pflicht:** `/health` → Settings → Bridge → Frontend-Catch-all (zuletzt).

## Projektstruktur

```
├── compose.yml            # Production (NODE_ENV=production, npm start)
├── compose-dev.yml        # Development (NODE_ENV=development, Vite-Dev via UI-Server)
├── compose-mediamtx.yml   # MediaMTX-Service (bluenviron/mediamtx)
├── .env.default           # Env-Vorlage (Ports, Version, Config-Pfad)
├── server/                # Node.js-Backend
│   ├── index.js           # Entry-Point (--init-config: Defaults nach config.json)
│   ├── Dockerfile
│   ├── src/
│   │   ├── Config.js              # Env + config.json, Settings (maskiert, validiert, persistiert)
│   │   ├── Server.js              # HTTP-Server, Security-Header, Error-Handler
│   │   ├── Logger.js
│   │   ├── MediaMTXBridge.js      # Agnostischer Proxy zu MediaMTX
│   │   ├── MediaMTXConfigStore.js # Persistiert mediamtx.yml nach Config-Mutationen
│   │   └── Router/
│   │       ├── index.js           # Route-Reihenfolge
│   │       ├── SettingsRouter.js  # GET/PATCH /api/settings
│   │       └── FrontendRouter.js  # Static (prod) / Vite-Dev (dev) + SPA-Fallback
│   └── test/                  # vitest + E2E (Mock-MediaMTX)
├── frontend/              # React-Frontend
│   └── src/
│       ├── api/client.js          # Axios-Instanz + generische Methoden
│       ├── services/              # queryKeys, appSettings (localStorage)
│       ├── hooks/                 # useApi, usePagination, useKick, useAutoRefresh
│       ├── components/
│       │   ├── layout/            # Layout, Sidebar, TopBar
│       │   ├── pages/             # Dashboard, Config-*, Runtime-*, Recordings, Settings
│       │   ├── dashboard/         # ProtocolCard, InfoCard, PathsCard, QuickLinks
│       │   ├── forms/             # FormBuilder, fieldCatalog, ListEditor
│       │   ├── tables/            # DataTable, Pagination
│       │   └── ui/                # Button, Input, Select, Toggle, Tabs, Modal, …
│       └── style/                 # CSS-Variablen, Light/Dark
├── mediamtx/
│   ├── mediamtx.yml           # MediaMTX-Config (git-ignored, wird von der UI persistiert)
│   ├── mediamtx.default.yml   # Referenz-Config
│   └── openapi.yml            # OpenAPI-Spec der MediaMTX-API
└── .docs/                   # Konzept & Roadmap (Grundlagen, Server, Frontend, Settings)
```

## Quickstart (Docker)

```bash
cp .env.default .env          # Ports/Version anpassen

# MediaMTX + UI (Production)
docker compose -f compose-mediamtx.yml -f compose.yml up -d --build

# UI (Development, Vite-HMR)
docker compose -f compose-mediamtx.yml -f compose-dev.yml up -d --build
```

UI erreichbar unter `http://localhost:${SERVER_PORT}` (Default `3000`).
Die UI spricht MediaMTX über das Docker-Netzwerk an (`http://mediamtx:9997`) — kein Port-Mapping der API nötig.

> **Hinweis:** `compose-mediamtx.yml` mountet `mediamtx/mediamtx.yml` read-only in den MediaMTX-Container.
> Die UI kann die Datei auf Host-Seite aktualisieren (Auto-Save via `MEDIAMTX_CONFIG_PATH`) — MediaMTX liest sie beim Start.

## Lokale Entwicklung

**Server** (`server/`):

```bash
npm install
npm run dev        # node --watch (nur index.js + src)
npm test           # vitest
```

**Frontend** (`frontend/`):

```bash
npm install
npm run build      # → frontend/dist (wird vom UI-Server in Production ausgeliefert)
```

Im Dev-Modus (`NODE_ENV=development`) liefert der UI-Server das Frontend direkt über die Vite-Middleware (HMR + SPA-Fallback) — kein separater Vite-Prozess nötig.

## Konfiguration

### Environment-Variablen (Server)

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `SERVER_PORT` | `3000` | HTTP-Port des UI-Servers |
| `VERBOSE` | `false` | Verbose-Logging |
| `MEDIAMTX_BASE_URL` | `http://localhost:9997` | MediaMTX-API (im Compose: `http://mediamtx:9997`) |
| `MEDIAMTX_AUTH_TOKEN` | — | Bearer-Token, wird an MediaMTX weitergeleitet |
| `MEDIAMTX_API_VERSION` | `v3` | API-Prefix (Restart erforderlich) |
| `MEDIAMTX_BRIDGE_TIMEOUT` | `10000` | Bridge-Timeout in ms |
| `MEDIAMTX_CONFIG_PATH` | `../mediamtx/mediamtx.yml` (via `.env.default`) | Pfad für die persistierte `mediamtx.yml` (leer = Auto-Save aus) |
| `CONFIG_PATH` | `server/config.json` | Pfad der Server-Config-Datei |

### Settings (zur Laufzeit)

Alle Server-Settings sind unter **`/settings`** in der UI einseh- und änderbar:

- `GET /api/settings` — liefert die Settings (Token maskiert: `••••` + letzte 4)
- `PATCH /api/settings` — Partial-Patch; antwortet mit `{ applied, restartRequired }`
  - **Runtime** (sofort wirksam): `verbose`, `mediamtxBaseUrl`, `mediamtxAuthToken`, `mediamtxBridgeTimeout`, `mediamtxConfigPath`
  - **Restart**: `serverPort`, `mediamtxApiVersion`
- Token-Regel: maskierter Wert = unverändert, leer = gelöscht, sonst = neuer Token
- Persistiert in `server/config.json` (git-ignored)

**App-Settings** (lokal im Browser, `localStorage`): Theme (dark/light), Auto-Refresh-Intervall, Items pro Seite, API-Base-URL-Override.

## API-Endpunkte (UI-Server)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/health` | Health-Check → `{ status: 'ok' }` |
| `GET` | `/api/settings` | Server-Settings (Secrets maskiert) |
| `PATCH` | `/api/settings` | Settings ändern → `{ applied, restartRequired }` |
| `*` | `/v3/*` | 1:1-Proxy an die MediaMTX-API (56 Endpoints, siehe `mediamtx/openapi.yml`) |
| `GET` | `/*` | Frontend (SPA, Deep-Links funktionieren) |

Fehlerformat: `{ error, status: 'error', code }` — Codes: `not_found`, `invalid_settings`, `upstream_unreachable` (MediaMTX nicht erreichbar), `internal_error`.

## Tests

```bash
cd server && npm test        # vitest: Config, Bridge, SettingsRouter, ConfigStore (39 Tests)
node server/test/e2e-phase10.mjs   # E2E gegen Mock-MediaMTX (CRUD, Fehler, Pagination, Kick)
cd frontend && npm run build       # Build-Check
```

## Dokumentation

- `.docs/INITIAL_BASICS.md` — Konzept, Endpoint-Katalog, Schema-Referenz
- `.docs/INITIAL_SERVER.md` — Backend-Architektur
- `.docs/INITIAL_FRONTEND.md` — Frontend-Architektur
- `.docs/INITIAL_SETTINGS.md` — Settings-Konzept
- `.docs/ROADMAP.md` — Phasen & Status (57/57 erledigt)
