# Konzept: OpenAPI-Spec als Admin-Interface implementieren — Frontend

> **Teil 3 von 4 (Frontend):** Dieses Dokument enthält die Frontend-Implementierung (Abschnitt 5).
> - Grundlagen: siehe `INITIAL_BASICS.md`
> - Server (Backend): siehe `INITIAL_SERVER.md`
> - Einstellungen (Settings): siehe `INITIAL_SETTINGS.md`

---

## 5. Frontend

### 5.1 Ist-Zustand

```
frontend/
├── index.html
├── vite.config.js        # appType: 'custom', middlewareMode, CSP-Header
├── package.json          # react 19, react-router-dom 7, @tanstack/react-query 5, react-markdown, remark-gfm
└── src/
    ├── main.jsx          # QueryClientProvider + BrowserRouter (fertig)
    ├── App.jsx           # Leere Shell (kein Routing)
    └── style/
        └── index.css     # (leer)
```

**Fehlend:** API-Client, Endpoints, Query-Keys, Layout, alle Pages, Routing in `App.jsx`.

### 5.2 Zielarchitektur

```
frontend/src/
├── main.jsx              # unverändert (QueryClientProvider + BrowserRouter)
├── App.jsx               # Layout + <Routes>
├── api/
│   └── client.js         # Axios-Instanz (Base-URL /v3) + generische api.get/post/patch/delete
├── services/
│   ├── queryKeys.js      # Zentrale Query-Keys
│   └── appSettings.js    # App-Settings-Store (localStorage + useAppSettings, siehe INITIAL_SETTINGS.md §6.7)
├── components/
│   ├── layout/
│   │   ├── Layout.jsx    # Sidebar + TopBar + <Outlet/>
│   │   ├── Sidebar.jsx   # Navigation
│   │   └── TopBar.jsx    # Titel, Refresh-Button, Status
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── ConfigGlobal.jsx
│   │   ├── ConfigPathDefaults.jsx
│   │   ├── InternalUsers.jsx
│   │   ├── ConfigPaths.jsx
│   │   ├── ConfigPathDetail.jsx
│   │   ├── RuntimePaths.jsx
│   │   ├── RuntimePathDetail.jsx
│   │   ├── HLS.jsx
│   │   ├── RTSP.jsx
│   │   ├── RTMP.jsx
│   │   ├── SRT.jsx
│   │   ├── WebRTC.jsx
│   │   ├── MoQ.jsx
│   │   ├── Recordings.jsx
│   │   └── Settings.jsx  # Einstellungen: Server-Settings (API) + App-Settings (lokal, siehe INITIAL_SETTINGS.md §6.9)
│   ├── forms/
│   │   ├── fieldCatalog.js     # Feld-Katalog: Feld → Element-Typ (GlobalConf, PathConf, InternalUser)
│   │   ├── FormBuilder.jsx     # Generischer Builder: rendert Formular aus Katalog
│   │   ├── FormField.jsx       # Rendert ein Feld je Element-Typ
│   │   ├── ListEditor.jsx      # Array-von-Objekten (dynamische Zeilen)
│   │   ├── GlobalConfigForm.jsx
│   │   ├── PathConfigForm.jsx
│   │   └── InternalUserForm.jsx
│   ├── tables/
│   │   ├── DataTable.jsx   # Generische Tabelle (paginiert, sortable)
│   │   └── Pagination.jsx
│   └── ui/
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Select.jsx
│       ├── Toggle.jsx          # boolean (Switch/Checkbox)
│       ├── Slider.jsx          # number (double) mit min/max/step
│       ├── TagInput.jsx        # array[string] / array[int]
│       ├── MultiSelect.jsx     # array[enum] (Checkbox-Gruppe)
│       ├── Badge.jsx
│       ├── Modal.jsx
│       ├── Card.jsx
│       ├── Spinner.jsx
│       └── ErrorAlert.jsx
├── hooks/
│   ├── useApi.js         # useQuery/useMutation-Wrapper
│   └── usePagination.js  # page/itemsPerPage-State
├── utils/
│   ├── formatBytes.js
│   ├── formatDate.js
│   └── constants.js      # Status-Farben, Enum-Labels
└── style/
    └── index.css         # Globales CSS (Variablen, Layout, Komponenten)
```

### 5.3 API-Client (`api/client.js`)

Ein Axios-Client + generische Aufruf-Helfer. Keine Einzel-Funktionen pro Endpoint.

```js
import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_MEDIAMTX_API_URL || '/v3',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// Response-Interceptor: liefert res.data direkt, mappt Fehler
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

// Generische Aufruf-Helfer (agnostisch)
export const api = {
    get: (path, params) => client.get(path, { params }),
    post: (path, body) => client.post(path, body),
    patch: (path, body) => client.patch(path, body),
    delete: (path, params) => client.delete(path, { params }),
};

export default client;
```

> **Base-URL:** `/v3` (relativ) → Requests gehen an denselben Origin (UI-Server), der sie via `MediaMTXBridge` an MediaMTX weiterleitet. Kein CORS. Alternativ `VITE_MEDIAMTX_API_URL` für direkte Anbindung.

### 5.4 API-Aufrufe (agnostisch)

Keine 56 Einzel-Funktionen. Das Frontend ruft die OpenAPI-Pfade (Katalog: `INITIAL_BASICS.md` Abschnitt 2) direkt über den generischen Client aus 5.3 auf:

```js
import { api } from './client';

// General & Auth
api.get('/info');
api.post('/auth/jwks/refresh');

// Config: Global
api.get('/config/global/get');
api.patch('/config/global/patch', globalConf);

// Config: Internal Users
api.get('/config/internal-users/list', { page: 0, itemsPerPage: 100 });
api.get(`/config/internal-users/get/${id}`);
api.post('/config/internal-users/add', user);
api.patch(`/config/internal-users/patch/${id}`, user);
api.post(`/config/internal-users/replace/${id}`, user);
api.delete(`/config/internal-users/delete/${id}`);

// Paths (Runtime)
api.get('/paths/list', { page: 0 });
api.get(`/paths/get/${encodeURIComponent(name)}`);
api.get('/paths/forward-dests/list', { path: name, page: 0 });

// HLS
api.get('/hls/sessions/list', { page: 0 });
api.post(`/hls/sessions/kick/${id}`);

// Recordings
api.get('/recordings/list', { page: 0 });
api.delete('/recordings/segments/delete', { path: name, start });
```

> **Pfad-Konvention:** exakt die Pfade aus der OpenAPI-Spec. Path-Parameter immer `encodeURIComponent()`. Query-Parameter als zweites Argument. Die vollständige Pfad-Liste steht im Endpoint-Katalog (`INITIAL_BASICS.md` Abschnitt 2).

### 5.5 Query-Keys (`services/queryKeys.js`)

```js
export const QUERY_KEYS = {
    info: ['info'],
    globalConfig: ['config', 'global'],
    pathDefaults: ['config', 'path-defaults'],
    internalUsers: ['config', 'internal-users'],
    internalUser: (id) => ['config', 'internal-users', id],
    configPaths: ['config', 'paths'],
    configPath: (name) => ['config', 'paths', name],
    runtimePaths: ['paths'],
    runtimePath: (name) => ['paths', name],
    forwardDests: (path) => ['paths', 'forward-dests', path],
    staticSource: (name) => ['paths', 'static-sources', name],
    hlsMuxers: ['hls', 'muxers'],
    hlsMuxer: (name) => ['hls', 'muxers', name],
    hlsSessions: ['hls', 'sessions'],
    hlsSession: (id) => ['hls', 'sessions', id],
    rtspConns: ['rtsp', 'conns'],
    rtspConn: (id) => ['rtsp', 'conns', id],
    rtspSessions: ['rtsp', 'sessions'],
    rtspSession: (id) => ['rtsp', 'sessions', id],
    rtspsConns: ['rtsps', 'conns'],
    rtspsConn: (id) => ['rtsps', 'conns', id],
    rtspsSessions: ['rtsps', 'sessions'],
    rtspsSession: (id) => ['rtsps', 'sessions', id],
    rtmpConns: ['rtmp', 'conns'],
    rtmpConn: (id) => ['rtmp', 'conns', id],
    rtmpsConns: ['rtmps', 'conns'],
    rtmpsConn: (id) => ['rtmps', 'conns', id],
    srtConns: ['srt', 'conns'],
    srtConn: (id) => ['srt', 'conns', id],
    webrtcSessions: ['webrtc', 'sessions'],
    webrtcSession: (id) => ['webrtc', 'sessions', id],
    moqSessions: ['moq', 'sessions'],
    moqSession: (id) => ['moq', 'sessions', id],
    recordings: ['recordings'],
    recording: (name) => ['recordings', name],
};
```

**Regeln:**
- Listen: `useQuery` mit `keepPreviousData: true`, `refetchOnWindowFocus: false`, `staleTime: 5000`.
- Mutations: `useMutation` mit `onSuccess` → `queryClient.invalidateQueries({ queryKey: <betroffener Key> })`.
- Pagination: `page` als Teil des Query-Keys (`[...QUERY_KEYS.hlsSessions, page]`), damit Seiten separat gecacht werden.
- Kick-Operationen: `onSuccess` → invalidate der zugehörigen Listen-Keys.

### 5.6 Routing (`App.jsx`)

```jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/pages/Dashboard';
import ConfigGlobal from './components/pages/ConfigGlobal';
import ConfigPathDefaults from './components/pages/ConfigPathDefaults';
import InternalUsers from './components/pages/InternalUsers';
import ConfigPaths from './components/pages/ConfigPaths';
import ConfigPathDetail from './components/pages/ConfigPathDetail';
import RuntimePaths from './components/pages/RuntimePaths';
import RuntimePathDetail from './components/pages/RuntimePathDetail';
import HLS from './components/pages/HLS';
import RTSP from './components/pages/RTSP';
import RTMP from './components/pages/RTMP';
import SRT from './components/pages/SRT';
import WebRTC from './components/pages/WebRTC';
import MoQ from './components/pages/MoQ';
import Recordings from './components/pages/Recordings';

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="config/global" element={<ConfigGlobal />} />
                <Route path="config/path-defaults" element={<ConfigPathDefaults />} />
                <Route path="config/internal-users" element={<InternalUsers />} />
                <Route path="config/paths" element={<ConfigPaths />} />
                <Route path="config/paths/:name" element={<ConfigPathDetail />} />
                <Route path="paths" element={<RuntimePaths />} />
                <Route path="paths/:name" element={<RuntimePathDetail />} />
                <Route path="hls" element={<HLS />} />
                <Route path="rtsp" element={<RTSP />} />
                <Route path="rtmp" element={<RTMP />} />
                <Route path="srt" element={<SRT />} />
                <Route path="webrtc" element={<WebRTC />} />
                <Route path="moq" element={<MoQ />} />
                <Route path="recordings" element={<Recordings />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}
```

### 5.7 Seiten-Konzepte (detailliert)

> **Formulare:** Alle Config-Formulare (Global, Path Defaults, Internal Users, Paths) werden über den **Formular-Builder** aus Abschnitt 5.13 gerendert — nicht hart kodiert. Die Feld-Typen unten sind die *logischen* Typen; die konkrete Komponente wählt der Builder je Element-Typ aus dem Feld-Katalog.

#### Dashboard (`/`)
- **Karten pro Protokoll:** HLS (Muxer-Anzahl + Session-Anzahl), RTSP (Conn + Session), RTSPS, RTMP, RTMPS, SRT, WebRTC, MoQ.
- **Info-Karte:** Version, Startzeit (aus `/v3/info`).
- **Pfad-Übersicht:** Anzahl online/available Pfade (aus `/v3/paths/list`). Hinweis: `ready` ist deprecated.
- **Auto-Refresh:** `refetchInterval: 10000` für alle Listen.
- **Schnellzugriff:** Links zu den Config-Pages.

#### Globale Konfiguration (`/config/global`)
- **Formular** basierend auf `GlobalConf` (~150 Felder).
- **Gruppierung:** Tabs oder Accordion pro Gruppe (General, Authentication, Metrics, PPROF, Playback, HLS, MoQ, RTMP, RTSP, SRT, WebRTC, Multicast, Run-on-connect). Deprecated-Felder ausblenden.
- **Feld-Typen:**
  - `boolean` → Checkbox
  - `string` → Text-Input
  - `string[]` → Tag-Input (Komma-separiert)
  - `int64` → Number-Input
  - `duration` (z. B. `hlsSegmentDuration`) → Text-Input mit Placeholder `1s`
  - `enum` → Select
  - `nullable` → Optionales Feld (leer = null)
  - `deprecated` → Ausgeblendet (oder Read-Only mit Hinweis)
- **Speichern:** PATCH mit dem kompletten Objekt (MediaMTX erwartet das vollständige `GlobalConf`).
- **Validierung:** Clientseitig (Pflichtfelder, Zahlen-Range, Duration-Format).

#### Path Defaults (`/config/path-defaults`)
- Wie Globale Konfiguration, aber basierend auf `PathConf`.
- **Hinweis:** Änderungen wirken auf alle Pfade, die kein eigenes Override haben.

#### Interne Benutzer (`/config/internal-users`)
- **Tabelle** (paginiert): `id`, `user`, `ips` (join), `permissions` (action + path), `pos`.
- **Aktionen:** Add (Modal mit `InternalUserForm`), Edit (PATCH via Modal), Replace (POST via Modal), Delete (Bestätigungs-Modal).
- **Formular:** `user`, `pass`, `ips[]` (Tag-Input), `permissions[]` (dynamische Zeilen: `action` Select + `path` Input).

#### Pfad-Konfigurationen (`/config/paths`)
- **Tabelle** (paginiert): `name`, `source`, `record` (Badge), `alwaysAvailable` (Badge), `forward` (Anzahl), `maxReaders`.
- **Detail** (`/config/paths/:name`): Vollständige `PathConf` als Formular (wie Path Defaults).
- **Aktionen:** Add (Name-Input + Formular), Edit (PATCH), Replace (POST), Delete.

#### Laufzeit-Pfade (`/paths`)
- **Tabelle** (paginiert): `name`, `online` (Badge), `available` (Badge), `source.type` (PathSourceType), `readers.length`. Hinweis: `ready` ist deprecated.
- **Detail** (`/paths/:name`):
  - `Path`-Objekt: Source-Details, Readers-Liste, Tracks-Liste (Codec + Properties).
  - **Forward-Destinations:** Tabelle (aus `/v3/paths/forward-dests/list?path=<name>`): `id`, `type`, `state` (Badge), `outboundBytes`, `lastError`. Hinweis: `dest`/`protocol` sind deprecated (in `conf`/`typeSpecific`).
  - **Static Source:** Details (aus `/v3/paths/static-sources/get/<name>`), falls vorhanden.
  - **typeSpecific-Objekte:** Als JSON-Code-Block gerendert (kein eigenes Formular).

#### HLS (`/hls`)
- **Tabs:** Muxer | Sessions.
- **Muxer-Tabelle:** `path`, `created`, `lastRequest`, `outboundBytes`, `outboundFramesDiscarded`.
- **Sessions-Tabelle:** `id`, `created`, `path`, `remoteAddr`, `user`, `userAgent`, `isCDN`, `outboundBytes` + **Kick**-Button.

#### RTSP / RTSPS (`/rtsp`, `/rtsps`)
- **Tabs:** Connections | Sessions.
- **Connections-Tabelle:** `id`, `created`, `remoteAddr`, `session`, `tunnel`, `inboundBytes`, `outboundBytes`.
- **Sessions-Tabelle:** `id`, `created`, `path`, `remoteAddr`, `user`, `state` (Badge: idle/read/publish), `transport`, `inboundBytes`, `outboundBytes` + **Kick**-Button.
- **RTSPS:** Identisch, andere Endpoints (`/v3/rtsps/*`).

#### RTMP / RTMPS (`/rtmp`, `/rtmps`)
- **Tabelle:** `id`, `created`, `path`, `remoteAddr`, `user`, `state` (Badge: idle/read/publish), `inboundBytes`, `outboundBytes` + **Kick**-Button.

#### SRT (`/srt`)
- **Tabelle:** `id`, `created`, `path`, `remoteAddr`, `user`, `state` (Badge: idle/read/publish), `inboundBytes`, `outboundBytes` + **Kick**-Button. (SRT-Statistiken als JSON-Block)

#### WebRTC (`/webrtc`)
- **Tabelle:** `id`, `created`, `path`, `remoteAddr`, `user`, `state` (Badge: read/publish), `localCandidate`, `remoteCandidate`, `inboundBytes`, `outboundBytes` + **Kick**-Button.

#### MoQ (`/moq`)
- **Tabelle:** `id`, `created`, `path`, `remoteAddr`, `userAgent`, `state` (Badge: idle/read/publish), `version`, `transport`, `inboundBytes`, `outboundBytes` + **Kick**-Button.

#### Recordings (`/recordings`)
- **Tabelle** (paginiert): `name`, `segments.length`.
- **Detail** (Expandable Row oder Modal): Segmente mit `start` (formatiert) + **Delete**-Button pro Segment.
- **Delete:** `DELETE /v3/recordings/segments/delete?path=<name>&start=<start>`.

### 5.8 UI-Komponenten

**`DataTable.jsx`** (generisch):
```jsx
// Props: columns [{ key, label, render? }], data, loading, error, pagination, onRowClick
// - Lädt Daten via useQuery (queryKey + queryFn als Props)
// - Rendert <table> mit <thead>/<tbody>
// - Zeigt Spinner bei loading, ErrorAlert bei error
// - Pagination-Controls unten (page, itemsPerPage, pageCount)
// - onRowClick für Detail-Navigation
```

**`Pagination.jsx`:**
```jsx
// Props: page, pageCount, itemsPerPage, itemCount, onPageChange, onItemsPerPageChange
// - "Seite X von Y", "Zurück"/"Weiter"-Buttons
// - itemsPerPage-Select (10, 25, 50, 100)
```

**`Badge.jsx`:**
```jsx
// Props: value, type (status)
// - Farbige Badges: idle (grau), read/publish/forwarding/running (grün), error (rot)
// - Online/Ready/Available: grün/rot
```

**`Modal.jsx`:**
```jsx
// Props: title, isOpen, onClose, children, footer
// - Overlay + zentriertes Panel
// - Escape/Overlay-Klick schließt
```

**`ErrorAlert.jsx`:**
```jsx
// Props: error
// - Roter Alert-Box mit Fehlermeldung
// - Zeigt error.code an (z. B. "upstream_unreachable")
```

**`Card.jsx`:**
```jsx
// Props: title, children
// - Übersichtskarte für Dashboard
```

**`Spinner.jsx`:**
```jsx
// - Lade-Indikator (CSS-Animation)
```

**`Toggle.jsx`:**
```jsx
// Props: checked, onChange, label
// - Switch/Checkbox (CSS-only, keine Lib)
// - Accessible (role="switch", aria-checked)
```

**`Slider.jsx`:**
```jsx
// Props: value, onChange, min, max, step, label
// - <input type="range"> + Zahlen-Anzeige
// - value als number
```

**`TagInput.jsx`:**
```jsx
// Props: value (Array), onChange, type ('string'|'number')
// - Komma-separierte Eingabe → Array
// - Tags als Pills mit Entfernen-Button
// - type='number' → Zahlen parsen
```

**`MultiSelect.jsx`:**
```jsx
// Props: value (Array), onChange, options (Array)
// - Checkbox-Gruppe (eine Checkbox pro Option)
// - value = Array der gewählten Optionen
```

### 5.9 Hooks

**`useApi.js`:**
```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useListQuery(queryKey, queryFn, { page = 0, itemsPerPage = 100 } = {}) {
    return useQuery({
        queryKey: [...queryKey, page, itemsPerPage],
        queryFn: () => queryFn({ page, itemsPerPage }),
        placeholderData: (prev) => prev,
        refetchOnWindowFocus: false,
        staleTime: 5000,
    });
}

export function useMutationWithInvalidate(mutationFn, invalidateKeys) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: () => {
            invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
        },
    });
}
```

**`usePagination.js`:**
```js
import { useState } from 'react';

export function usePagination(defaultItemsPerPage = 100) {
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
    return { page, setPage, itemsPerPage, setItemsPerPage };
}
```

### 5.10 Utils

**`formatBytes.js`:**
```js
export function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
```

**`formatDate.js`:**
```js
export function formatDate(isoString) {
    if (!isoString) return '–';
    return new Date(isoString).toLocaleString();
}
```

**`constants.js`:**
```js
export const STATUS_COLORS = {
    idle: 'gray',
    read: 'green',
    publish: 'green',
    forwarding: 'green',
    running: 'green',
    error: 'red',
    online: 'green',
    offline: 'red',
};

export const ENUM_LABELS = {
    authAction: { publish: 'Publish', read: 'Read', playback: 'Playback', api: 'API', metrics: 'Metrics', pprof: 'Pprof' },
    // ... weitere Enums (siehe 3.2)
};
```

### 5.11 Styling (`style/index.css`)

- **CSS-Variablen** für Farben:
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
  ```
- **Layout:** Flexbox (Sidebar fix links, Main scrollt).
- **Tabellen:** Vollbreit, Sticky Header, Hover-Zeilen.
- **Responsive:** Sidebar kollabiert unter 768px.
- **Keine CSS-Libs:** Plain CSS, keine Tailwind/Styled-Components.

### 5.12 react-markdown

- `react-markdown` + `remark-gfm` (bereits in `dependencies`) wird genutzt, um OpenAPI-`description`-Texte zu rendern.
- **Einsatz:** In Config-Formularen (Hilfetexte pro Feld), in Detailansichten (Beschreibung von Schemas).
- **Komponente:** `<Markdown text={description} />` in `components/ui/Markdown.jsx`.

---

## 5.13 Formular-Builder (Schema-gesteuert)

> **Prinzip:** Statt ~150 (GlobalConf) + ~115 (PathConf) Felder hart zu kodieren, wird jedes Formular aus einem **Feld-Katalog** (reine Daten) gerendert. Jeder Katalog-Eintrag deklariert den **Element-Typ**. Ein generischer `FormBuilder` + `FormField` wählen die passende UI-Komponente. Neue MediaMTX-Felder = einzeiliger Katalog-Eintrag, kein neuer Code.

### 5.13.1 Element-Typ-Registry

| Element-Typ | Komponente | OpenAPI-Typ | Beispiel-Felder |
|---|---|---|---|
| `toggle` | `<Toggle>` | `boolean` | `api`, `hls`, `record`, `alwaysAvailable` |
| `text` | `<Input type="text">` | `string` | `apiAddress`, `logFile`, `source` |
| `password` | `<Input type="password">` | `string` (Secret) | `hlsCDNSecret`, `srtPublishPassphrase`, `whepBearerToken` |
| `number` | `<Input type="number">` | `integer` | `hlsSegmentCount`, `maxReaders`, `multicastRTPPort` |
| `slider` | `<Slider>` | `number` (double) | `rpiCameraBrightness`, `rpiCameraContrast`, `rpiCameraSaturation`, `rpiCameraEV` |
| `duration` | `<Input type="text" placeholder="1s">` | `string` (Duration) | `hlsSegmentDuration`, `readTimeout`, `recordPartDuration` |
| `size` | `<Input type="text" placeholder="10MiB">` | `string` (Size) | `hlsSegmentMaxSize`, `recordMaxPartSize` |
| `select` | `<Select>` | `enum` | `authMethod`, `logLevel`, `hlsVariant`, `recordFormat` |
| `multi-select` | `<MultiSelect>` | `array` von `enum` | `logDestinations`, `rtspAuthMethods`, `rtspTransports` |
| `tags` | `<TagInput>` | `array` von `string` | `apiAllowOrigins`, `webrtcAdditionalHosts` |
| `tags-number` | `<TagInput type="number">` | `array` von `integer` | `rtspUDPSourcePortRange`, `rpiCameraAWBGains` |
| `list` | `<ListEditor>` | `array` von `object` | `authInternalUsers`, `forward`, `alwaysAvailableTracks`, `webrtcICEServers2` |
| `command` | `<Input type="text" mono>` | `string` (Shell-Befehl) | `runOnConnect`, `runOnDisconnect`, `runOnInit` |
| `path` | `<Input type="text">` | `string` (Dateipfad) | `apiServerCert`, `hlsDirectory`, `recordPath` |
| `json` | `<JsonEditor>` | `object` (komplex) | `typeSpecific`, `codecProps` (nur Detail-Ansicht) |

**Regeln:**
- `deprecated: true` → nicht gerendert (ausblenden).
- `nullable: true` → leeres Feld = `null` (bei Submit leeren String → `null` mappen).
- `slider` braucht `min`/`max`/`step` im Katalog.
- `select`/`multi-select` brauchen `options` im Katalog.
- `list` braucht ein `itemSchema` (Katalog der Zeilen-Felder).
- `command`/`path`/`duration`/`size` sind `string` in der Spec — der Element-Typ steuert nur Darstellung + Validierung.

### 5.13.2 Feld-Katalog: GlobalConf

| Feld | Element-Typ | Bemerkung |
|---|---|---|
| **General** | | |
| `api` | toggle | |
| `apiAddress` | text | |
| `apiAllowOrigins` | tags | |
| `apiEncryption` | toggle | |
| `apiServerCert` | path | |
| `apiServerKey` | path | |
| `apiTrustedProxies` | tags | |
| `dumpPackets` | toggle | |
| `logDestinations` | multi-select | options: `stdout`, `file`, `syslog` |
| `logFile` | path | |
| `logLevel` | select | options: `error`, `warn`, `info`, `debug` |
| `logStructured` | toggle | |
| `sysLogPrefix` | text | |
| `udpMaxPayloadSize` | number | |
| `udpReadBufferSize` | number | |
| `readTimeout` | duration | placeholder `5s` |
| `writeQueueSize` | number | |
| `writeTimeout` | duration | placeholder `5s` |
| **Authentication** | | |
| `authHTTPAddress` | text | |
| `authHTTPExclude` | list | itemSchema: `action`(select), `path`(text) |
| `authHTTPFingerprint` | text | |
| `authInternalUsers` | list | itemSchema: `user`, `pass`, `ips`(tags), `permissions`(list) |
| `authJWTAudience` | text | |
| `authJWTClaimKey` | text | |
| `authJWTExclude` | list | itemSchema: `action`(select), `path`(text) |
| `authJWTIssuer` | text | |
| `authJWTJWKS` | text | |
| `authJWTJWKSFingerprint` | text | |
| `authMethod` | select | options: `internal`, `http`, `jwt` |
| **Metrics** | | |
| `metrics` | toggle | |
| `metricsAddress` | text | |
| `metricsAllowOrigins` | tags | |
| `metricsEncryption` | toggle | |
| `metricsServerCert` | path | |
| `metricsServerKey` | path | |
| `metricsTrustedProxies` | tags | |
| **PPROF** | | |
| `pprof` | toggle | |
| `pprofAddress` | text | |
| `pprofAllowOrigins` | tags | |
| `pprofEncryption` | toggle | |
| `pprofServerCert` | path | |
| `pprofServerKey` | path | |
| `pprofTrustedProxies` | tags | |
| **Playback** | | |
| `playback` | toggle | |
| `playbackAddress` | text | |
| `playbackAllowOrigins` | tags | |
| `playbackEncryption` | toggle | |
| `playbackServerCert` | path | |
| `playbackServerKey` | path | |
| `playbackTrustedProxies` | tags | |
| **HLS** | | |
| `hls` | toggle | |
| `hlsAddress` | text | |
| `hlsAllowOrigins` | tags | |
| `hlsAlwaysRemux` | toggle | |
| `hlsCDNSecret` | password | |
| `hlsDirectory` | path | |
| `hlsEncryption` | toggle | |
| `hlsMuxerCloseAfter` | duration | placeholder `1h` |
| `hlsPartDuration` | duration | placeholder `200ms` |
| `hlsSegmentCount` | number | |
| `hlsSegmentDuration` | duration | placeholder `1s` |
| `hlsSegmentMaxSize` | size | placeholder `50MiB` |
| `hlsServerCert` | path | |
| `hlsServerKey` | path | |
| `hlsTrustedProxies` | tags | |
| `hlsVariant` | select | options: `mpegts`, `fmp4`, `lowLatency` |
| **MoQ** | | |
| `moq` | toggle | |
| `moqAllowOrigins` | tags | |
| `moqHTTP2Address` | text | |
| `moqHTTP3Address` | text | |
| `moqQUICAddress` | text | |
| `moqServerCert` | path | |
| `moqServerKey` | path | |
| `moqTrustedProxies` | tags | |
| **RTMP** | | |
| `rtmp` | toggle | |
| `rtmpAddress` | text | |
| `rtmpEncryption` | select | options: `no`, `optional`, `strict` |
| `rtmpServerCert` | path | |
| `rtmpServerKey` | path | |
| `rtmpTrustedProxies` | tags | |
| `rtmpsAddress` | text | |
| **RTSP** | | |
| `rtsp` | toggle | |
| `rtspAddress` | text | |
| `rtspAuthMethods` | multi-select | options: `basic`, `digest` |
| `rtspEncryption` | select | options: `no`, `optional`, `strict` |
| `rtspServerCert` | path | |
| `rtspServerKey` | path | |
| `rtspTransports` | multi-select | options: `udp`, `multicast`, `tcp` |
| `rtspTrustedProxies` | tags | |
| `rtspsAddress` | text | |
| `rtpAddress` | text | |
| `rtcpAddress` | text | |
| `srtpAddress` | text | |
| `srtcpAddress` | text | |
| **SRT** | | |
| `srt` | toggle | |
| `srtAddress` | text | |
| **WebRTC** | | |
| `webrtc` | toggle | |
| `webrtcAdditionalHosts` | tags | |
| `webrtcAddress` | text | |
| `webrtcAllowOrigins` | tags | |
| `webrtcEncryption` | toggle | |
| `webrtcHandshakeTimeout` | duration | placeholder `5s` |
| `webrtcICEServers2` | list | itemSchema: `url`(text), `username`(text), `password`(password), `clientOnly`(toggle) |
| `webrtcIPsFromInterfaces` | toggle | |
| `webrtcIPsFromInterfacesExcludeList` | tags | |
| `webrtcIPsFromInterfacesList` | tags | |
| `webrtcLocalTCPAddress` | text | |
| `webrtcLocalUDPAddress` | text | |
| `webrtcSTUNGatherTimeout` | duration | placeholder `2s` |
| `webrtcServerCert` | path | |
| `webrtcServerKey` | path | |
| `webrtcTrackGatherTimeout` | duration | placeholder `2s` |
| `webrtcTrustedProxies` | tags | |
| **Multicast** | | |
| `multicastIPRange` | text | |
| `multicastRTCPPort` | number | |
| `multicastRTPPort` | number | |
| `multicastSRTCPPort` | number | |
| `multicastSRTPPort` | number | |
| **Run-on-connect** | | |
| `runOnConnect` | command | |
| `runOnConnectRestart` | toggle | |
| `runOnDisconnect` | command | |

> **Deprecated (ausblenden):** `apiAllowOrigin`, `authJWTInHTTPQuery`, `authMethods`, `encryption`, `externalAuthenticationURL`, `hlsAllowOrigin`, `hlsDisable`, `metricsAllowOrigin`, `moqHTTPS2Address`, `moqHTTPS3Address`, `playbackAllowOrigin`, `pprofAllowOrigin`, `protocols`, `readBufferCount`, `record*` (alle), `rtmpDisable`, `rtspDisable`, `rtspUDPReadBufferSize`, `webrtcAllowOrigin`, `webrtcDisable`, `webrtcICEHostNAT1To1IPs`, `webrtcICEServers`, `webrtcICETCPMuxAddress`, `webrtcICEUDPMuxAddress`.

### 5.13.3 Feld-Katalog: PathConf

| Feld | Element-Typ | Bemerkung |
|---|---|---|
| **General / Source** | | |
| `source` | text | |
| `sourceFingerprint` | text | |
| `sourceOnDemand` | toggle | |
| `sourceOnDemandStartTimeout` | duration | placeholder `5s` |
| `sourceOnDemandCloseAfter` | duration | placeholder `1m` |
| `sourceRedirect` | text | |
| `maxReaders` | number | |
| `useAbsoluteTimestamp` | toggle | |
| **Always available** | | |
| `alwaysAvailable` | toggle | |
| `alwaysAvailableFile` | path | |
| `alwaysAvailableRecorded` | toggle | |
| `alwaysAvailableTracks` | list | itemSchema: `codec`(select), `sampleRate`(number), `channelCount`(number), `muLaw`(toggle) |
| **Record** | | |
| `record` | toggle | |
| `recordDeleteAfter` | duration | placeholder `1h` |
| `recordFormat` | select | options: `fmp4`, `mpegts` |
| `recordMaxPartSize` | size | placeholder `50MiB` |
| `recordPartDuration` | duration | placeholder `200ms` |
| `recordPath` | path | |
| `recordSegmentDuration` | duration | placeholder `1s` |
| **Publisher source** | | |
| `overridePublisher` | toggle | |
| `srtPublishPassphrase` | password | |
| `srtReadPassphrase` | password | |
| `rtspDemuxMpegts` | toggle | |
| **RTSP source** | | |
| `rtspTransport` | select | options: `udp`, `multicast`, `tcp`, `automatic` |
| `rtspAnyPort` | toggle | |
| `rtspRangeType` | select | options: `(leer)`, `clock`, `npt`, `smpte` |
| `rtspRangeStart` | text | |
| `rtspScale` | text | |
| `rtspUDPSourcePortRange` | tags-number | |
| **RTP source** | | |
| `rtpSDP` | text | multiline |
| **MoQ source** | | |
| `moqTransport` | text | |
| **WHEP source** | | |
| `whepBearerToken` | password | |
| `whepSTUNGatherTimeout` | duration | placeholder `2s` |
| `whepHandshakeTimeout` | duration | placeholder `5s` |
| `whepTrackGatherTimeout` | duration | placeholder `2s` |
| **Raspberry Pi Camera** | | |
| `rpiCameraCamID` | number | |
| `rpiCameraSecondary` | toggle | |
| `rpiCameraWidth` | number | |
| `rpiCameraHeight` | number | |
| `rpiCameraHFlip` | toggle | |
| `rpiCameraVFlip` | toggle | |
| `rpiCameraBrightness` | slider | min `0`, max `100` |
| `rpiCameraContrast` | slider | min `-100`, max `100` |
| `rpiCameraSaturation` | slider | min `0`, max `100` |
| `rpiCameraSharpness` | slider | min `0`, max `100` |
| `rpiCameraExposure` | select | options: `normal`, `sport`, `night`, `off` |
| `rpiCameraAWB` | select | options: `auto`, `off`, `sunshade`, `cloudy`, `tungsten`, `fluorescent`, `horizons`, `flash` |
| `rpiCameraAWBGains` | tags-number | |
| `rpiCameraDenoise` | select | options: `off`, `fast`, `cd` |
| `rpiCameraShutter` | number | |
| `rpiCameraMetering` | select | options: `normal`, `backlit`, `spot`, `custom` |
| `rpiCameraGain` | slider | min `0`, max `50` |
| `rpiCameraEV` | slider | min `-10`, max `10`, step `0.5` |
| `rpiCameraROI` | text | |
| `rpiCameraHDR` | toggle | |
| `rpiCameraTuningFile` | path | |
| `rpiCameraMode` | text | |
| `rpiCameraFPS` | slider | min `0`, max `90` |
| `rpiCameraAfMode` | select | options: `off`, `continuous`, `auto`, `manual` |
| `rpiCameraAfRange` | text | |
| `rpiCameraAfSpeed` | text | |
| `rpiCameraLensPosition` | slider | min `0`, max `100` |
| `rpiCameraAfWindow` | text | |
| `rpiCameraFlickerPeriod` | number | |
| `rpiCameraTextOverlayEnable` | toggle | |
| `rpiCameraTextOverlay` | text | |
| `rpiCameraCodec` | select | options: `h264`, `mjpeg`, `raw` |
| `rpiCameraIDRPeriod` | number | |
| `rpiCameraBitrate` | number | |
| `rpiCameraH264Profile` | select | options: `baseline`, `main`, `high` |
| `rpiCameraH264Level` | select | options: `4.1`, `4.2`, `5.1` |
| `rpiCameraMJPEGQuality` | number | |
| **Forward** | | |
| `forward` | list | itemSchema: `dest`(text), `destFingerprint`(text), `moqTransport`(text), `whipBearerToken`(password) |
| **Hooks** | | |
| `runOnInit` | command | |
| `runOnInitRestart` | toggle | |
| `runOnDemand` | command | |
| `runOnDemandRestart` | toggle | |
| `runOnDemandStartTimeout` | duration | placeholder `5s` |
| `runOnDemandCloseAfter` | duration | placeholder `1m` |
| `runOnUnDemand` | command | |
| `runOnAvailable` | command | |
| `runOnAvailableRestart` | toggle | |
| `runOnUnavailable` | command | |
| `runOnOnline` | command | |
| `runOnOnlineRestart` | toggle | |
| `runOnOffline` | command | |
| `runOnRead` | command | |
| `runOnReadRestart` | toggle | |
| `runOnUnread` | command | |
| `runOnRecordSegmentCreate` | command | |
| `runOnRecordSegmentComplete` | command | |

> **Deprecated (ausblenden):** `disablePublisherOverride`, `fallback`, `mpegtsUDPReadBufferSize`, `playback`, `publishIPs`, `publishPass`, `publishUser`, `readIPs`, `readPass`, `readUser`, `rpiCameraHardwareH264Level`, `rpiCameraHardwareH264Profile`, `rpiCameraJPEGQuality`, `rpiCameraLevel`, `rpiCameraProfile`, `rpiCameraSoftwareH264Level`, `rpiCameraSoftwareH264Profile`, `rtpUDPReadBufferSize`, `rtspUDPReadBufferSize`, `runOnNotReady`, `runOnReady`, `runOnReadyRestart`, `sourceAnyPortEnable`, `sourceProtocol`.

### 5.13.4 Feld-Katalog: InternalUser

| Feld | Element-Typ | Bemerkung |
|---|---|---|
| `user` | text | Pflichtfeld |
| `pass` | password | |
| `ips` | tags | |
| `permissions` | list | itemSchema: `action`(select: `publish`, `read`, `playback`, `api`, `metrics`, `pprof`), `path`(text) |

### 5.13.5 Katalog-Datenstruktur (JS)

```js
// components/forms/fieldCatalog.js

// Ein Feld-Eintrag:
// {
//   name: 'hlsSegmentDuration',
//   label: 'Segment Duration',
//   type: 'duration',          // Element-Typ aus 5.13.1
//   group: 'HLS',
//   description: 'Dauer eines HLS-Segments',
//   placeholder: '1s',
//   // optional:
//   options: [...],            // select / multi-select
//   min, max, step,           // slider / number
//   itemSchema: [...],        // list (Array von Feld-Einträgen)
//   nullable: true,
//   deprecated: false,
// }

export const GLOBAL_CONF_CATALOG = [
    // General
    { name: 'api', label: 'API', type: 'toggle', group: 'General' },
    { name: 'apiAddress', label: 'API Address', type: 'text', group: 'General' },
    { name: 'apiAllowOrigins', label: 'API Allow Origins', type: 'tags', group: 'General' },
    { name: 'apiEncryption', label: 'API Encryption', type: 'toggle', group: 'General' },
    { name: 'apiServerCert', label: 'API Server Cert', type: 'path', group: 'General' },
    { name: 'apiServerKey', label: 'API Server Key', type: 'path', group: 'General' },
    { name: 'apiTrustedProxies', label: 'API Trusted Proxies', type: 'tags', group: 'General' },
    { name: 'dumpPackets', label: 'Dump Packets', type: 'toggle', group: 'General' },
    { name: 'logDestinations', label: 'Log Destinations', type: 'multi-select', group: 'General',
      options: ['stdout', 'file', 'syslog'] },
    { name: 'logFile', label: 'Log File', type: 'path', group: 'General' },
    { name: 'logLevel', label: 'Log Level', type: 'select', group: 'General',
      options: ['error', 'warn', 'info', 'debug'] },
    { name: 'logStructured', label: 'Log Structured', type: 'toggle', group: 'General' },
    { name: 'sysLogPrefix', label: 'SysLog Prefix', type: 'text', group: 'General' },
    { name: 'udpMaxPayloadSize', label: 'UDP Max Payload Size', type: 'number', group: 'General' },
    { name: 'udpReadBufferSize', label: 'UDP Read Buffer Size', type: 'number', group: 'General' },
    { name: 'readTimeout', label: 'Read Timeout', type: 'duration', group: 'General', placeholder: '5s' },
    { name: 'writeQueueSize', label: 'Write Queue Size', type: 'number', group: 'General' },
    { name: 'writeTimeout', label: 'Write Timeout', type: 'duration', group: 'General', placeholder: '5s' },
    // Authentication
    { name: 'authMethod', label: 'Auth Method', type: 'select', group: 'Authentication',
      options: ['internal', 'http', 'jwt'] },
    { name: 'authInternalUsers', label: 'Internal Users', type: 'list', group: 'Authentication',
      itemSchema: [
          { name: 'user', label: 'User', type: 'text' },
          { name: 'pass', label: 'Pass', type: 'password' },
          { name: 'ips', label: 'IPs', type: 'tags' },
          { name: 'permissions', label: 'Permissions', type: 'list',
            itemSchema: [
                { name: 'action', label: 'Action', type: 'select',
                  options: ['publish', 'read', 'playback', 'api', 'metrics', 'pprof'] },
                { name: 'path', label: 'Path', type: 'text' },
            ] },
      ] },
    // HLS
    { name: 'hls', label: 'HLS Server', type: 'toggle', group: 'HLS' },
    { name: 'hlsCDNSecret', label: 'HLS CDN Secret', type: 'password', group: 'HLS' },
    { name: 'hlsSegmentDuration', label: 'Segment Duration', type: 'duration', group: 'HLS', placeholder: '1s' },
    { name: 'hlsSegmentMaxSize', label: 'Segment Max Size', type: 'size', group: 'HLS', placeholder: '50MiB' },
    { name: 'hlsVariant', label: 'HLS Variant', type: 'select', group: 'HLS',
      options: ['mpegts', 'fmp4', 'lowLatency'] },
    // RTMP
    { name: 'rtmpEncryption', label: 'RTMP Encryption', type: 'select', group: 'RTMP',
      options: ['no', 'optional', 'strict'] },
    // RTSP
    { name: 'rtspAuthMethods', label: 'RTSP Auth Methods', type: 'multi-select', group: 'RTSP',
      options: ['basic', 'digest'] },
    { name: 'rtspTransports', label: 'RTSP Transports', type: 'multi-select', group: 'RTSP',
      options: ['udp', 'multicast', 'tcp'] },
    // WebRTC
    { name: 'webrtcICEServers2', label: 'ICE Servers', type: 'list', group: 'WebRTC',
      itemSchema: [
          { name: 'url', label: 'URL', type: 'text' },
          { name: 'username', label: 'Username', type: 'text' },
          { name: 'password', label: 'Password', type: 'password' },
          { name: 'clientOnly', label: 'Client Only', type: 'toggle' },
      ] },
    // Run-on-connect
    { name: 'runOnConnect', label: 'Run On Connect', type: 'command', group: 'Run-on-connect' },
    { name: 'runOnConnectRestart', label: 'Run On Connect Restart', type: 'toggle', group: 'Run-on-connect' },
    { name: 'runOnDisconnect', label: 'Run On Disconnect', type: 'command', group: 'Run-on-connect' },
    // ... (alle weiteren Felder aus 5.13.2)
];

export const PATH_CONF_CATALOG = [
    // General / Source
    { name: 'source', label: 'Source', type: 'text', group: 'General' },
    { name: 'sourceOnDemand', label: 'Source On Demand', type: 'toggle', group: 'General' },
    { name: 'maxReaders', label: 'Max Readers', type: 'number', group: 'General' },
    // Record
    { name: 'record', label: 'Record', type: 'toggle', group: 'Record' },
    { name: 'recordFormat', label: 'Record Format', type: 'select', group: 'Record',
      options: ['fmp4', 'mpegts'] },
    { name: 'recordMaxPartSize', label: 'Record Max Part Size', type: 'size', group: 'Record', placeholder: '50MiB' },
    // Raspberry Pi Camera (Slider-Beispiele)
    { name: 'rpiCameraBrightness', label: 'Brightness', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 100 },
    { name: 'rpiCameraContrast', label: 'Contrast', type: 'slider', group: 'Raspberry Pi Camera', min: -100, max: 100 },
    { name: 'rpiCameraSaturation', label: 'Saturation', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 100 },
    { name: 'rpiCameraEV', label: 'EV', type: 'slider', group: 'Raspberry Pi Camera', min: -10, max: 10, step: 0.5 },
    { name: 'rpiCameraFPS', label: 'FPS', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 90 },
    // Forward
    { name: 'forward', label: 'Forward', type: 'list', group: 'Forward',
      itemSchema: [
          { name: 'dest', label: 'Dest', type: 'text' },
          { name: 'destFingerprint', label: 'Dest Fingerprint', type: 'text' },
          { name: 'moqTransport', label: 'MoQ Transport', type: 'text' },
          { name: 'whipBearerToken', label: 'WHEP Bearer Token', type: 'password' },
      ] },
    // Hooks
    { name: 'runOnInit', label: 'Run On Init', type: 'command', group: 'Hooks' },
    { name: 'runOnInitRestart', label: 'Run On Init Restart', type: 'toggle', group: 'Hooks' },
    // ... (alle weiteren Felder aus 5.13.3)
];

export const INTERNAL_USER_CATALOG = [
    { name: 'user', label: 'User', type: 'text', group: 'User' },
    { name: 'pass', label: 'Pass', type: 'password', group: 'User' },
    { name: 'ips', label: 'IPs', type: 'tags', group: 'User' },
    { name: 'permissions', label: 'Permissions', type: 'list', group: 'User',
      itemSchema: [
          { name: 'action', label: 'Action', type: 'select',
            options: ['publish', 'read', 'playback', 'api', 'metrics', 'pprof'] },
          { name: 'path', label: 'Path', type: 'text' },
      ] },
];
```

### 5.13.6 FormBuilder-Architektur

**`FormField.jsx`** (ein Feld):
```jsx
// Props: field (Katalog-Eintrag), value, onChange, error
// - Wählt Komponente je field.type (Registry aus 5.13.1)
// - Rendert Label + Beschreibung (Markdown) + Komponente
// - toggle        → <Toggle checked={value} onChange={...}/>
// - text/password/duration/size/command/path → <Input type=... value={...} placeholder={...}/>
// - number        → <Input type="number" min max step/>
// - slider        → <Slider value min max step/>
// - select        → <Select value options/>
// - multi-select  → <MultiSelect value options/>
// - tags / tags-number → <TagInput value type/>
// - list          → <ListEditor value itemSchema/>
// - json          → <JsonEditor value/>
```

**`FormBuilder.jsx`** (komplettes Formular):
```jsx
// Props: catalog (Array), values (Objekt), onChange, onSubmit, submitLabel
// - Gruppiert Felder nach field.group (Accordion/Tabs)
// - Rendert pro Gruppe einen <section> mit <FormField> pro Feld
// - deprecated-Felder überspringt
// - Submit → onSubmit(values)
// - Validierung: Pflichtfelder, Zahlen-Range, Duration-Format
```

**`ListEditor.jsx`** (Array von Objekten):
```jsx
// Props: value (Array), itemSchema (Array), onChange
// - "Zeile hinzufügen"-Button
// - Pro Zeile: <FormField> pro itemSchema-Feld + "Entfernen"-Button
// - Reihenfolge = Array-Index
```

### 5.13.7 Integration in Config-Pages

- **`GlobalConfigForm.jsx`:** `useQuery` holt `GlobalConf` → `FormBuilder` mit `GLOBAL_CONF_CATALOG` → `onSubmit` → `api.patch('/config/global/patch', values)` → invalidate `QUERY_KEYS.globalConfig`.
- **`PathConfigForm.jsx`:** wie Global, aber `PATH_CONF_CATALOG` + `api.patch('/config/path-defaults/patch', values)` bzw. `/config/paths/patch/{name}`.
- **`InternalUserForm.jsx`:** `INTERNAL_USER_CATALOG` + `api.post/patch('/config/internal-users/...', values)`.

> **Vorteil:** Die drei Config-Formulare sind jetzt dünn (nur Daten + Submit). Alle Feld-Logik steckt im `FormBuilder` + `fieldCatalog.js`. Neue MediaMTX-Felder = einzeiliger Katalog-Eintrag.

---

## 5.14 Einstellungen (Settings)

Die Settings-Seite (`/settings`) verwaltet die Config-Parameter der **eigenen App** (nicht MediaMTX): Server-Settings via `GET`/`PATCH /api/settings` (Token maskiert, Runtime- vs. Restart-Klassifizierung) und App-Settings lokal im Browser (`apiBaseUrl`, `theme`, `autoRefreshMs`, `itemsPerPage`). Beide Formulare laufen über den FormBuilder aus §5.13 mit `SERVER_SETTINGS_CATALOG` / `APP_SETTINGS_CATALOG`.

→ **Details: `INITIAL_SETTINGS.md` §6.**
