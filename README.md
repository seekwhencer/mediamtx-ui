# mediamtx-ui

Web-based admin interface for [MediaMTX](https://github.com/bluenviron/mediamtx).
Dashboard, configuration, runtime monitoring, and recordings — via the MediaMTX API (`/v3/*`).

## Features

- **Dashboard** — Cards per protocol (HLS, RTSP/RTSPS, RTMP/RTMPS, SRT, WebRTC, MoQ), instance info (version, start time), path overview (online/available), auto-refresh
- **Configuration** — Global, path defaults, internal users, paths (add/edit/replace/delete); schema-driven forms, deprecated fields hidden
- **Runtime** — Path list + detail (source, readers, tracks, forward destinations, static source); sessions/connections of all protocols incl. **kick**
- **Recordings** — List + segment delete
- **Settings** — Server settings via API (persisted, "applied"/"restart required" feedback) + app settings local in the browser (theme, auto-refresh, page size, API base URL)
- **Dark/Light theme** — switchable without reload
- **Config persistence** — after successful config mutations the current MediaMTX config is written as `mediamtx.yml` (optional, `MEDIAMTX_CONFIG_PATH`)

## Screenshots

| | |
|---|---|
| ![Dashboard](.docs/screenshots/dashboard.png) | ![Global](.docs/screenshots/config-global.png) |
| ![Internal users](.docs/screenshots/config-internal-users.png) | ![Paths (configuration)](.docs/screenshots/config-paths.png) |
| ![Path defaults](.docs/screenshots/config-path-defaults.png) | ![Paths (runtime)](.docs/screenshots/runtime-paths.png) |
| ![HLS](.docs/screenshots/runtime-hls.png) | ![RTSP](.docs/screenshots/runtime-rtsp.png) |
| ![RTMP](.docs/screenshots/runtime-rtmp.png) | ![SRT](.docs/screenshots/runtime-srt.png) |
| ![WebRTC](.docs/screenshots/runtime-webrtc.png) | ![MoQ](.docs/screenshots/runtime-moq.png) |
| ![Recordings](.docs/screenshots/recordings.png) | ![Settings](.docs/screenshots/settings.png) |

## Architecture

```
Browser ──► UI server (Node.js 22, Express 5)
              ├─ /health            → Health check
              ├─ /api/settings      → Server settings (GET/PATCH, persisted)
              ├─ /v3/*              → MediaMTXBridge (agnostic reverse proxy → MediaMTX API)
              └─ /*                 → FrontendRouter (React app: build from dist/ or Vite dev)
```

- **`server/`** — Node.js 22, Express 5, ESM. The `MediaMTXBridge` forwards every request under `/v3/*` 1:1 to MediaMTX (method, path, query, body, headers) — no per-endpoint code. New MediaMTX endpoints require zero server code.
- **`frontend/`** — React 19, Vite 8, TanStack Query, React Router 7, react-markdown. Generic API client (`api.get/post/patch/delete`) instead of individual functions.
- **Route order is mandatory:** `/health` → Settings → Bridge → frontend catch-all (last).

## Project structure

```
├── compose.yml            # Production (NODE_ENV=production, npm start)
├── compose-dev.yml        # Development (NODE_ENV=development, Vite dev via UI server)
├── compose-mediamtx.yml   # MediaMTX service (bluenviron/mediamtx)
├── .env.default           # Env template (ports, version, config path)
├── server/                # Node.js backend
│   ├── index.js           # Entry point (--init-config: writes defaults to config.json)
│   ├── Dockerfile
│   ├── src/
│   │   ├── Config.js              # Env + config.json, settings (masked, validated, persisted)
│   │   ├── Server.js              # HTTP server, security headers, error handler
│   │   ├── Logger.js
│   │   ├── MediaMTXBridge.js      # Agnostic proxy to MediaMTX
│   │   ├── MediaMTXConfigStore.js # Persists mediamtx.yml after config mutations
│   │   └── Router/
│   │       ├── index.js           # Route order
│   │       ├── SettingsRouter.js  # GET/PATCH /api/settings
│   │       └── FrontendRouter.js  # Static (prod) / Vite dev (dev) + SPA fallback
│   └── test/                  # vitest + E2E (mock MediaMTX)
├── frontend/              # React frontend
│   └── src/
│       ├── api/client.js          # Axios instance + generic methods
│       ├── services/              # queryKeys, appSettings (localStorage)
│       ├── hooks/                 # useApi, usePagination, useKick, useAutoRefresh
│       ├── components/
│       │   ├── layout/            # Layout, Sidebar, TopBar
│       │   ├── pages/             # Dashboard, Config-*, Runtime-*, Recordings, Settings
│       │   ├── dashboard/         # ProtocolCard, InfoCard, PathsCard, QuickLinks
│       │   ├── forms/             # FormBuilder, fieldCatalog, ListEditor
│       │   ├── tables/            # DataTable, Pagination
│       │   └── ui/                # Button, Input, Select, Toggle, Tabs, Modal, …
│       └── style/                 # CSS variables, light/dark
├── mediamtx/
│   ├── mediamtx.yml           # MediaMTX config (git-ignored, persisted by the UI)
│   ├── mediamtx.default.yml   # Reference config
│   └── openapi.yml            # OpenAPI spec of the MediaMTX API
└── .docs/                   # Concept & roadmap (basics, server, frontend, settings)
```

## Quickstart (Docker)

```bash
cp .env.default .env          # Adjust ports/version

# MediaMTX + UI (production)
docker compose -f compose-mediamtx.yml -f compose.yml up -d --build

# UI (development, Vite HMR)
docker compose -f compose-mediamtx.yml -f compose-dev.yml up -d --build
```

UI available at `http://localhost:${SERVER_PORT}` (default `3000`).
The UI talks to MediaMTX over the Docker network (`http://mediamtx:9997`) — no API port mapping required.

> **Note:** `compose-mediamtx.yml` mounts `mediamtx/mediamtx.yml` read-only into the MediaMTX container.
> The UI can update the file on the host side (auto-save via `MEDIAMTX_CONFIG_PATH`) — MediaMTX reads it on startup.

## Local development

**Server** (`server/`):

```bash
npm install
npm run dev        # node --watch (index.js + src only)
npm test           # vitest
```

**Frontend** (`frontend/`):

```bash
npm install
npm run build      # → frontend/dist (served by the UI server in production)
```

In dev mode (`NODE_ENV=development`) the UI server serves the frontend directly via the Vite middleware (HMR + SPA fallback) — no separate Vite process needed.

## Configuration

### Environment variables (server)

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `3000` | HTTP port of the UI server |
| `VERBOSE` | `false` | Verbose logging |
| `MEDIAMTX_BASE_URL` | `http://localhost:9997` | MediaMTX API (in Compose: `http://mediamtx:9997`) |
| `MEDIAMTX_AUTH_TOKEN` | — | Bearer token, forwarded to MediaMTX |
| `MEDIAMTX_API_VERSION` | `v3` | API prefix (restart required) |
| `MEDIAMTX_BRIDGE_TIMEOUT` | `10000` | Bridge timeout in ms |
| `MEDIAMTX_CONFIG_PATH` | `../mediamtx/mediamtx.yml` (via `.env.default`) | Path for the persisted `mediamtx.yml` (empty = auto-save off) |
| `CONFIG_PATH` | `server/config.json` | Path of the server config file |

### Settings (at runtime)

All server settings can be viewed and changed under **`/settings`** in the UI:

- `GET /api/settings` — returns the settings (token masked: `••••` + last 4)
- `PATCH /api/settings` — partial patch; responds with `{ applied, restartRequired }`
  - **Runtime** (takes effect immediately): `verbose`, `mediamtxBaseUrl`, `mediamtxAuthToken`, `mediamtxBridgeTimeout`, `mediamtxConfigPath`
  - **Restart**: `serverPort`, `mediamtxApiVersion`
- Token rule: masked value = unchanged, empty = deleted, otherwise = new token
- Persisted in `server/config.json` (git-ignored)

**App settings** (local in the browser, `localStorage`): theme (dark/light), auto-refresh interval, items per page, API base URL override.

## API endpoints (UI server)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check → `{ status: 'ok' }` |
| `GET` | `/api/settings` | Server settings (secrets masked) |
| `PATCH` | `/api/settings` | Change settings → `{ applied, restartRequired }` |
| `*` | `/v3/*` | 1:1 proxy to the MediaMTX API (56 endpoints, see `mediamtx/openapi.yml`) |
| `GET` | `/*` | Frontend (SPA, deep links work) |

Error format: `{ error, status: 'error', code }` — codes: `not_found`, `invalid_settings`, `upstream_unreachable` (MediaMTX unreachable), `internal_error`.

## Tests

```bash
cd server && npm test        # vitest: Config, Bridge, SettingsRouter, ConfigStore (39 tests)
node server/test/e2e-phase10.mjs   # E2E against mock MediaMTX (CRUD, errors, pagination, kick)
cd frontend && npm run build       # Build check
```

## Documentation

- `.docs/INITIAL_BASICS.md` — Concept, endpoint catalog, schema reference
- `.docs/INITIAL_SERVER.md` — Backend architecture
- `.docs/INITIAL_FRONTEND.md` — Frontend architecture
- `.docs/INITIAL_SETTINGS.md` — Settings concept
- `.docs/ROADMAP.md` — Phases & status (57/57 done)
