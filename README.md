# mediamtx-ui

Web-based admin interface for [MediaMTX](https://github.com/bluenviron/mediamtx).
Dashboard, configuration, runtime monitoring, live logs, and recordings (list, delete, playback) — via the MediaMTX API (`/v3/*`), the MediaMTX Playback API, and a WebSocket log stream.

## Features

- **Dashboard** — Cards per protocol (HLS, RTSP/RTSPS, RTMP/RTMPS, SRT, WebRTC, MoQ), instance info (version, start time), path overview (online/available), auto-refresh
- **Configuration** — Global, path defaults, internal users, paths (add/edit/replace/delete); schema-driven forms, deprecated fields hidden
- **Runtime** — Path list + detail (source, readers, tracks, forward destinations, static source); sessions/connections of all protocols incl. **kick**
- **Recordings** — List, segment delete, and inline playback (play / stop / fullscreen)
- **Logs** — Live MediaMTX log monitor (WebSocket `/logs`): history + streaming, level filter (ERR/WAR/INF/DBG), search, pause/resume, auto-reconnect
- **Settings** — Server settings via API (persisted, "applied"/"restart required" feedback) + app settings local in the browser (theme, auto-refresh, page size, API base URL)
- **Dark/Light theme** — switchable without reload
- **Config persistence** — after successful config mutations the current MediaMTX config is written as `mediamtx.yml` (optional, `MEDIAMTX_CONFIG_PATH`)

> **NOTE:** Don't use it reachable over the internet! Use it in a local network environment.

| Light | Dark |
|-------|------|
| ![Dashboard (light)](.docs/screenshots/light_dashboard.png) | ![Dashboard (dark)](.docs/screenshots/dark_dashboard.png) |


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

> **Playback:** Recording playback streams directly from the MediaMTX **Playback API** (port `9996`) to the browser, so that port must be reachable from the browser (mapped in `compose-mediamtx.yml`). Base URL: `VITE_MEDIAMTX_PLAYBACK_URL` (build-time) or the `playbackBaseUrl` app setting (runtime override). Recordings must be in a browser-decodable codec (e.g. H.264/AAC) — HEVC/H.265 will not play in most browsers.

> **Note:** `compose-mediamtx.yml` mounts `mediamtx/mediamtx.yml` read-only into the MediaMTX container.
> The UI can update the file on the host side (auto-save via `MEDIAMTX_CONFIG_PATH`) — MediaMTX reads it on startup.

> **Logs:** The log monitor tails the MediaMTX log file (`MEDIAMTX_LOG_PATH`, default `../data/mediamtx/mediamtx.log`). MediaMTX must write to a file — the bundled `mediamtx/mediamtx.yml` already sets `logDestinations: [stdout, file]` + `logFile: /data/mediamtx/mediamtx.log`, and `compose-mediamtx.yml` mounts `./data:/data`.

### MediaMTX from the main branch (unreleased)

Some endpoints (e.g. `config/internal-users/*`) only exist on the **main branch**, not in released versions. To run MediaMTX compiled from `main` (or any branch/tag/commit) instead of the released image:

```bash
# Build + run MediaMTX from main (drop-in replacement for compose-mediamtx.yml)
docker compose -f compose-mediamtx-build.yml up --build -d

# Pin to a specific branch / tag / full commit SHA
docker compose -f compose-mediamtx-build.yml build --build-arg MEDIAMTX_REF=v1.21.2
# …or via env:  MEDIAMTX_BUILD_REF=<ref> docker compose -f compose-mediamtx-build.yml up --build
```

- **`mediamtx/Dockerfile`** — multi-stage build: `golang:1.27-alpine3.24` compiles a static binary (`CGO_ENABLED=0`) from the cloned repo, then copies it into a `scratch` runtime image (mirrors the official `docker/standard.Dockerfile`).
- **`compose-mediamtx-build.yml`** — builds the image (`mediamtx:main`) and runs it with the same ports/volumes/network as `compose-mediamtx.yml`.
- The build clones `bluenviron/mediamtx` at `MEDIAMTX_REF` (default `main`), so it always tracks the latest main unless pinned.

> **Note:** `compose-mediamtx.yml` and `compose-mediamtx-build.yml` both define a `mediamtx` service with `container_name: mediamtx` — they are **alternatives**, run one at a time.


## First Start
- edit the `mediamtx/mediamtx.yml`
- add the network ip from the mediamtx-ui container, replace `XXX.XXX.0.0/16` with your own
  
 ```
  - user: any
    pass: ""
    ips:
      - 127.0.0.1/32
      - ::1/128
      - 172.18.0.0/16
      - XXX.XXX.0.0/16
    permissions:
      - action: api
        path: ""
      - action: metrics
        path: ""
      - action: pprof
        path: ""
```

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
| `MEDIAMTX_LOG_PATH` | `../data/mediamtx/mediamtx.log` (via `.env.default`) | MediaMTX log file for the log monitor (empty = log monitor off) |
| `CONFIG_PATH` | `server/config.json` | Path of the server config file |

### Settings (at runtime)

All server settings can be viewed and changed under **`/settings`** in the UI:

- `GET /api/settings` — returns the settings (token masked: `••••` + last 4)
- `PATCH /api/settings` — partial patch; responds with `{ applied, restartRequired }`
  - **Runtime** (takes effect immediately): `verbose`, `mediamtxBaseUrl`, `mediamtxAuthToken`, `mediamtxBridgeTimeout`, `mediamtxConfigPath`
  - **Restart**: `serverPort`, `mediamtxApiVersion`
- Token rule: masked value = unchanged, empty = deleted, otherwise = new token
- Persisted in `server/config.json` (git-ignored)

**App settings** (local in the browser, `localStorage`): theme (dark/light), auto-refresh interval, items per page, API base URL override, playback base URL override.

## API endpoints (UI server)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check → `{ status: 'ok' }` |
| `GET` | `/api/settings` | Server settings (secrets masked) |
| `PATCH` | `/api/settings` | Change settings → `{ applied, restartRequired }` |
| `*` | `/v3/*` | 1:1 proxy to the MediaMTX API (56 endpoints, see `mediamtx/openapi.yml`) |
| `WS` | `/logs` | Live log stream: `{ type: 'history' \| 'line' \| 'update', data }` (see `server/src/LogsWebSocket.js`) |
| `GET` | `/*` | Frontend (SPA, deep links work) |

Error format: `{ error, status: 'error', code }` — codes: `not_found`, `invalid_settings`, `upstream_unreachable` (MediaMTX unreachable), `internal_error`.




## Tests

```bash
cd server && npm test        # vitest: Config, Bridge, SettingsRouter, ConfigStore, LogTail, LogsWebSocket (74 tests)
node server/test/e2e-phase10.mjs   # E2E against mock MediaMTX (CRUD, errors, pagination, kick)
cd frontend && npm run build       # Build check
```

## All screenshots

| Page | Light | Dark |
|------|-------|------|
| Theatre | ![Theatre (light)](.docs/screenshots/light_theatre.png) | ![Theatre (dark)](.docs/screenshots/dark_theatre.png) |
| Global | ![Global (light)](.docs/screenshots/light_global.png) | ![Global (dark)](.docs/screenshots/dark_global.png) |
| Global (all groups) | ![Global groups (light)](.docs/screenshots/light_global_subnav.png) | ![Global groups (dark)](.docs/screenshots/dark_global_subnav.png) |
| Internal users | ![Internal users (light)](.docs/screenshots/light_internal-users.png) | ![Internal users (dark)](.docs/screenshots/dark_internal-users.png) |
| Paths (configuration) | ![Paths config (light)](.docs/screenshots/light_paths.png) | ![Paths config (dark)](.docs/screenshots/dark_paths.png) |
| Path defaults | ![Path defaults (light)](.docs/screenshots/light_path-defaults.png) | ![Path defaults (dark)](.docs/screenshots/dark_path-defaults.png) |
| Path defaults (all groups) | ![Path defaults groups (light)](.docs/screenshots/light_path-defaults_subnav.png) | ![Path defaults groups (dark)](.docs/screenshots/dark_path-defaults_subnav.png) |
| Paths (runtime) | ![Paths runtime (light)](.docs/screenshots/light_runtime-paths.png) | ![Paths runtime (dark)](.docs/screenshots/dark_runtime-paths.png) |
| Logs | ![Logs (light)](.docs/screenshots/light_logs.png) | ![Logs (dark)](.docs/screenshots/dark_logs.png) |
| HLS | ![HLS (light)](.docs/screenshots/light_hls.png) | ![HLS (dark)](.docs/screenshots/dark_hls.png) |
| RTSP | ![RTSP (light)](.docs/screenshots/light_rtsp.png) | ![RTSP (dark)](.docs/screenshots/dark_rtsp.png) |
| RTMP | ![RTMP (light)](.docs/screenshots/light_rtmp.png) | ![RTMP (dark)](.docs/screenshots/dark_rtmp.png) |
| SRT | ![SRT (light)](.docs/screenshots/light_srt.png) | ![SRT (dark)](.docs/screenshots/dark_srt.png) |
| WebRTC | ![WebRTC (light)](.docs/screenshots/light_webrtc.png) | ![WebRTC (dark)](.docs/screenshots/dark_webrtc.png) |
| MoQ | ![MoQ (light)](.docs/screenshots/light_moq.png) | ![MoQ (dark)](.docs/screenshots/dark_moq.png) |
| Recordings | ![Recordings (light)](.docs/screenshots/light_recordings.png) | ![Recordings (dark)](.docs/screenshots/dark_recordings.png) |
| Settings | ![Settings (light)](.docs/screenshots/light_settings.png) | ![Settings (dark)](.docs/screenshots/dark_settings.png) |

