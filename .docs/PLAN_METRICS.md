# PLAN_METRICS — Metrics-Page (Polling)

> **Stand:** 2026-10-26
> **Ziel:** Neue Page `/metrics` mit Live-Metriken aus dem MediaMTX-Metrics-Server (Prometheus, Port 9998). Die Daten werden **per Polling** geladen — exakt das Dashboard-Muster (`useQuery` + `useAutoRefresh` / `refetchInterval`), **kein** WebSocket.
> **Quellen:** `https://mediamtx.org/docs/features/metrics`, `FEATURES.md` (S1), Code: `frontend/src/components/pages/Dashboard.jsx`, `frontend/src/hooks/useAutoRefresh.js`, `server/src/Router/SettingsRouter.js`, `server/src/MediaMTXBridge.js`.

---

## 1. Ziel & Nicht-Ziel

### Ziel
- Live-Metriken in der UI:
  - **Totals:** Pfade online/available, Readers, Bytes in/out, **Throughput (Bytes/s)**, Frames in Error.
  - **Pfade:** pro Pfad State, Readers, Bytes in/out, Frames in Error.
  - **Protokolle:** HLS (Muxers/Sessions), RTSP/RTMP/SRT (Conns/Sessions), WebRTC/MoQ (Sessions) + Bytes.
  - **Forward-Destinations:** id, path, type, state, outbound bytes.
- **Polling:** Der Client ruft `GET /api/metrics` im `autoRefreshMs`-Intervall ab (wie Dashboard). Der Server holt dabei die Metriken vom MediaMTX-Metrics-Endpunkt (HTTP, Prometheus-Text), parst und normalisiert sie.
- **Kein WebSocket**, kein Push, kein Client-Polling des Upstreams — nur ein sauberer HTTP-Endpunkt, den der Client im Takt abruft.
- i18n (en/de/it), Dark/Light, Wiederverwendung bestehender UI-Komponenten.
- Tests (Server: Parser, Snapshot-Bau, Fetch, Router).

### Nicht-Ziel (v1)
- **CPU / RAM:** **nicht** Teil der MediaMTX-Metriken (der Prometheus-Endpunkt liefert keine Host-Ressourcen). → klarer Extension-Punkt (§10).
- Historische Auswertung / Grafana-Export (das macht Prometheus selbst).
- Pprof-View (eigene Aufgabe C6).
- Auth-Veränderungen am MediaMTX-Metrics-Server.

---

## 2. Architektur

```
┌────────────┐   HTTP (Prometheus-Text)    ┌───────────────────┐
│  MediaMTX  │ ◄─────────────────────────── │  MetricsService   │
│  :9998     │   GET /metrics (on demand)  │  (server, Node)   │
└────────────┘                             └─────────┬─────────┘
                                                      │ normalisiertes JSON (Snapshot)
                                                      ▼
                                               ┌───────────────────┐
                                               │  MetricsRouter    │  GET /api/metrics
                                               │  (Express)        │
                                               └─────────┬─────────┘
                                                         │ HTTP (Poll, autoRefreshMs)
                                                         ▼
                                               ┌───────────────────┐
                                               │  useQuery +       │  (client, React)
                                               │  useAutoRefresh   │
                                               │  Metrics.jsx      │
                                               └───────────────────┘
```

**Muster = Dashboard (1:1):**

| Dashboard | Metrics |
|-----------|---------|
| `useQuery` + `useAutoRefresh` (`refetchInterval`) | `useQuery` + `useAutoRefresh` (`refetchInterval`) |
| `api.get('/info')`, `api.get('/hls/muxers/list')` (via Bridge) | `localApi.get('/api/metrics')` (server-eigener Endpunkt) |
| `InfoCard`, `ProtocolCard`, `PathsCard` | `MetricCard`, `Sparkline`, `DataTable` |
| `ErrorAlert` bei Fehler | `ErrorAlert` bei Fehler |

**Warum Server-Endpunkt (nicht Client → MediaMTX direkt)?**
- MediaMTX-Metriken liegen auf einem **anderen Port** (9998) als die API (9997) → die bestehende Bridge deckt sie nicht ab.
- Der Server ist der einzige Ort, der den Upstream zuverlässig erreichen kann (Docker-Netz, Auth-Token, CORS-frei).
- Parsing + Normalisierung + Throughput-Berechnung laufen server-seitig → der Client bekommt fertiges JSON (wie bei allen anderen Pages).
- Polling-Intervall wird über die **bestehende** App-Setting `autoRefreshMs` gesteuert (Settings → Auto-Refresh) — kein neues Intervall-Setting nötig.

---

## 3. Datenmodell

### 3.1 Prometheus-Text (Upstream, Port 9998)

Auszug (aus der Doku):

```
# Paths
paths{name="cam1",state="online"} 1
paths_readers{name="cam1",state="online",readerType="hlsSession"} 3
paths_inbound_bytes{name="cam1",state="online"} 123456
paths_outbound_bytes{name="cam1",state="online"} 654321
paths_inbound_frames_in_error{name="cam1",state="online"} 0

# HLS
hls_muxers{name="cam1"} 1
hls_sessions{id="abc",path="cam1"} 1
hls_sessions_outbound_bytes{id="abc",path="cam1"} 187

# RTSP / RTMP / SRT / WebRTC / MoQ
rtsp_conns{id="def"} 1
rtsp_conns_inbound_bytes{id="def"} 100
rtmp_conns{id="ghi",path="cam1",state="publish"} 1
srt_conns{id="jkl",path="cam1",state="read"} 1
webrtc_sessions{id="mno",path="cam1",state="read"} 1
moq_sessions{id="pqr",path="cam1",state="read"} 1

# Forward
forward_dests{pos="1",id="stu",path="cam1",type="rtmp",state="forwarding"} 1
forward_dests_outbound_bytes{pos="1",id="stu",path="cam1",type="rtmp",state="forwarding"} 4096
```

> **Wichtig:** MediaMTX liefert **keine** Bitrates direkt — „Bitrates are not provided directly as metrics because they can be computed from received and sent bytes". → Throughput (Bytes/s) wird **server-seitig** aus der Byte-Delta zwischen zwei Abfragen berechnet.

### 3.2 Normalisierter Snapshot (Server → Client)

```json
{
  "ts": "2026-10-26T11:00:00.000Z",
  "totals": {
    "pathsOnline": 2,
    "pathsAvailable": 2,
    "readers": 5,
    "inboundBytes": 123456,
    "outboundBytes": 654321,
    "inboundBytesPerSec": 1234.5,
    "outboundBytesPerSec": 654.3,
    "inboundFramesInError": 0
  },
  "paths": [
    {
      "name": "cam1",
      "state": "online",
      "readers": 3,
      "inboundBytes": 123456,
      "outboundBytes": 654321,
      "inboundFramesInError": 0
    }
  ],
  "protocols": {
    "hls":    { "muxers": 1, "sessions": 1, "outboundBytes": 187 },
    "rtsp":   { "conns": 1, "sessions": 1, "inboundBytes": 100, "outboundBytes": 200 },
    "rtmp":   { "conns": 1, "inboundBytes": 100, "outboundBytes": 200 },
    "srt":    { "conns": 1, "inboundBytes": 100, "outboundBytes": 200 },
    "webrtc": { "sessions": 1, "inboundBytes": 100, "outboundBytes": 200 },
    "moq":    { "sessions": 1, "inboundBytes": 100, "outboundBytes": 200 }
  },
  "forwardDests": [
    { "id": "stu", "path": "cam1", "type": "rtmp", "state": "forwarding", "outboundBytes": 4096 }
  ]
}
```

### 3.3 Mapping-Regeln (Prometheus → Snapshot)

| Snapshot-Feld | Prometheus-Metrik | Aggregation |
|---|---|---|
| `paths[].name` / `state` | `paths{name,state}` | State mit Wert `1` = aktueller State |
| `paths[].readers` | `paths_readers{name,state,readerType}` | Summe über alle `readerType` |
| `paths[].inboundBytes` | `paths_inbound_bytes{name,state}` | Wert |
| `paths[].outboundBytes` | `paths_outbound_bytes{name,state}` | Wert |
| `paths[].inboundFramesInError` | `paths_inbound_frames_in_error{name,state}` | Wert |
| `totals.pathsOnline` | `paths{name,state="online"}` | Anzahl Einträge mit Wert `1` |
| `totals.readers` | `paths_readers` | Summe |
| `totals.inboundBytes` | `paths_inbound_bytes` | Summe |
| `totals.outboundBytes` | `paths_outbound_bytes` | Summe |
| `totals.inboundBytesPerSec` | Δ(`paths_inbound_bytes`) / Δt | **Server berechnet** (vs. vorherige Abfrage) |
| `totals.outboundBytesPerSec` | Δ(`paths_outbound_bytes`) / Δt | **Server berechnet** |
| `protocols.hls.muxers` | `hls_muxers` | Anzahl |
| `protocols.hls.sessions` | `hls_sessions` | Anzahl |
| `protocols.rtsp.conns` | `rtsp_conns` | Anzahl |
| `protocols.rtmp.conns` | `rtmp_conns` | Anzahl |
| `protocols.srt.conns` | `srt_conns` | Anzahl |
| `protocols.webrtc.sessions` | `webrtc_sessions` | Anzahl |
| `protocols.moq.sessions` | `moq_sessions` | Anzahl |
| `forwardDests[]` | `forward_dests` + `forward_dests_outbound_bytes` | Join über `id` |

---

## 4. HTTP-Endpunkt (`GET /api/metrics`)

### 4.1 Vertrag

```
Request:  GET /api/metrics
Response 200:
  { "success": true, "data": <Snapshot> }
Response 502 (Upstream nicht erreichbar):
  { "success": false, "error": "MediaMTX metrics unreachable: …", "code": "upstream_unreachable" }
Response 504 (Timeout):
  { "success": false, "error": "MediaMTX metrics request timed out", "code": "upstream_timeout" }
```

- **Read-only**, keine Body, keine Mutation.
- **Polling:** Client, Intervall = `autoRefreshMs` (App-Setting, Default 10 s, 0 = aus). Gesteuert über `useAutoRefresh` → `refetchInterval` (wie Dashboard).
- **Throughput:** Server-seitig aus der Delta zwischen zwei Abfragen (hält `lastSnapshot` + `lastTs` in Memory).
- **Fehler:** Bei Upstream-Fehler liefert der Endpunkt 502/504; der Client zeigt `ErrorAlert` + (optional) den letzten gültigen Snapshot (grau) via `placeholderData`.

### 4.2 Optionaler Filter

- `GET /api/metrics?path=cam1` → nur Metriken dieses Pfads (nutzt MediaMTX-Query-Param `path=`). Für v1 optional.

---

## 5. Server-Implementierung

### 5.1 Neue Config-Keys (`server/src/Config.js`)

| Key | Default | Env | Zweck |
|-----|---------|-----|-------|
| `mediamtxMetricsUrl` | `http://localhost:9998` | `MEDIAMTX_METRICS_URL` | Base-URL des Metrics-Servers |

Ergänzen in: `defaults`, `buildDefaults()`, `runtimeKeys`, `getSettings()`, `validateSettings()`, `updateSettings()`, `persist()`.
- **Timeout:** wiederverwenden von `mediamtxBridgeTimeout` (kein neues Key).
- **Auth:** `mediamtxAuthToken` wird als `Authorization: Bearer <token>` an den Metrics-Endpunkt mitgegeben (falls gesetzt).
- **Intervall:** kein Server-Key — wird client-seitig über `autoRefreshMs` gesteuert.

### 5.2 `server/src/MetricsService.js` (neu)

```js
class MetricsService {
    constructor(config, logger) { … }
    this.last = null;   // letzter Snapshot (für Throughput)
    this.lastTs = 0;    // Zeitstempel letzter Snapshot

    /** Holt Metriken vom Upstream, parst, normalisiert, berechnet Throughput. */
    async fetchSnapshot() {
        // GET {mediamtxMetricsUrl}/metrics  (axios, validateStatus: () => true, timeout)
        // 2xx → parsePrometheus(text) → buildSnapshot(series, this.last, now)
        //      → this.last = snapshot; this.lastTs = now; → return snapshot
        // Fehler → throw Error mit code (upstream_unreachable / upstream_timeout)
    }

    // Reine Funktionen (testbar):
    static parsePrometheus(text)            // → Map<name, Array<{labels, value}>>
    static buildSnapshot(series, prev, now) // → Snapshot (inkl. Throughput)
}
```

**`parsePrometheus` (Skizze):**

```js
static parsePrometheus(text) {
    const series = new Map();
    for (const raw of text.split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const m = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{([^}]*)\})?\s+(.+)$/);
        if (!m) continue;
        const labels = {};
        if (m[3]) {
            for (const pair of m[3].match(/([a-zA-Z_][a-zA-Z0-9_]*)="((?:[^"\\]|\\.)*)"/g) || []) {
                const [k, v] = pair.split('="');
                labels[k] = v.slice(0, -1);
            }
        }
        const value = parseFloat(m[4]);
        if (!series.has(m[1])) series.set(m[1], []);
        series.get(m[1]).push({ labels, value });
    }
    return series;
}
```

**Throughput (in `buildSnapshot`):**

```js
const dt = prev && prev.ts ? (now - Date.parse(prev.ts)) / 1000 : 0;
const inboundBytesPerSec = dt > 0
    ? Math.max(0, (sumInbound - prev.totals.inboundBytes) / dt)
    : 0;
```

### 5.3 `server/src/Router/MetricsRouter.js` (neu)

Wie `SettingsRouter`:

```js
class MetricsRouter {
    constructor(metricsService, logger) {
        this.router = express.Router();
        this.router.get('/api/metrics', this.handleGet.bind(this));
    }
    async handleGet(req, res) {
        try {
            const data = await this.metricsService.fetchSnapshot();
            res.status(200).json({ success: true, data });
        } catch (err) {
            const status = err.code === 'upstream_timeout' ? 504 : 502;
            res.status(status).json({ success: false, error: err.message, code: err.code || 'upstream_unreachable' });
        }
    }
}
```

### 5.4 `server/src/Router/index.js` (Anpassung)

```js
// in define() — neben SettingsRouter, VOR der Bridge/Frontend:
this.metricsService = new MetricsService(this.config, this.logger);
this.metricsRouter = new MetricsRouter(this.metricsService, this.logger);
this.router.use(this.metricsRouter.router);
```

> Kein Upgrade-Routing, kein `start()`/`stop()` — der Service ist on-demand (stateless außer `last`/`lastTs`).

### 5.5 `server/test/mock-mediamtx.js` (Test-Helfer)

- `GET /metrics` → Prometheus-Text (statischer Satz aus §3.1).
- `?mockError=500` → HTTP 500 (Fehlerpfad testen).

---

## 6. Frontend-Implementierung

### 6.1 `frontend/src/hooks/useMetrics.js` (neu, Hook)

Dünner Wrapper um `useQuery` + `useAutoRefresh` (wie Dashboard):

```js
export function useMetrics() {
    const refetchInterval = useAutoRefresh();
    return useQuery({
        queryKey: QUERY_KEYS.metrics,
        queryFn: () => localApi.get('/api/metrics'),
        refetchInterval,
        retry: false,
        placeholderData: (prev) => prev,   // letzter Snapshot bleibt bei Fehler sichtbar
    });
}
```

- Rückgabe: `{ data, isPending, isError, error, refetch }`.
- `data` = Snapshot (§3.2).

### 6.2 `frontend/src/components/pages/Metrics.jsx` (neu)

Layout (`.page`, wie `Dashboard.jsx`):
1. **Header:** Titel + Subtitle (+ optional „auto-refresh every X s").
2. **Totals** (`.card-grid`): `MetricCard` pro Kennzahl — Paths online, Readers, Inbound (Bytes + Bytes/s), Outbound (Bytes + Bytes/s), Frames in Error.
3. **Protocols** (`.card-grid`): HLS, RTSP, RTMP, SRT, WebRTC, MoQ (Conns/Sessions + Bytes).
4. **Paths** (`DataTable`): Name, State (`Badge`), Readers, Inbound, Outbound, Frames in Error.
5. **Forward-Destinations** (kleine `DataTable`): id, path, type, state, outbound.
6. **Fehlerzustand:** `ErrorAlert` (Upstream nicht erreichbar) + letzter Snapshot (grau, via `placeholderData`).
7. **Leerzustand:** „Keine Metriken" (MediaMTX liefert keine Daten).
8. **Loading:** `Spinner` bei `isPending` (erster Load).

### 6.3 Komponenten (neu, `frontend/src/components/metrics/`)

- **`MetricCard.jsx`** — `Card` mit Label, Wert, optional Sub (Bytes/s), optional `Sparkline`.
- **`Sparkline.jsx`** — schlanke SVG-Linie (keine Chart-Lib), nimmt `number[]`, rendert `<polyline>`. (Optional für v1 — nur wenn History gehalten wird.)
- Wiederverwendung: `Card`, `Badge`, `ErrorAlert`, `Spinner`, `DataTable`, `Button`.

> **Hinweis Sparkline:** Bei reinem Polling ohne History-Puffer gibt es pro Request nur einen Punkt. Für Sparklines müsste der Client eine kleine History halten (z. B. `useRef`-Array der letzten N Snapshots). Für v1 optional — die Cards zeigen den aktuellen Wert + Throughput.

### 6.4 Navigation (`frontend/src/components/layout/navItems.js`)

Runtime-Sektion ergänzen:
```js
{ to: '/metrics', labelKey: 'nav.metrics', icon: Gauge }   // lucide-react: Gauge
```

### 6.5 Routing (`frontend/src/App.jsx`)

```jsx
<Route path="metrics" element={<Metrics />} />   // innerhalb <Layout />
```

### 6.6 i18n (`frontend/src/locales/{en,de,it}.json`)

Vollständige Key-Liste in §9.

### 6.7 CSS (`frontend/src/style/components/metrics.css`, neu)

- `.metric-card__sub` (Bytes/s, kleiner, secondary).
- `.sparkline` (SVG, `width:100%`, `height:32px`) — falls Sparkline genutzt.
- In `frontend/src/style/components/index.css` importieren.

---

## 7. Tests (Server)

### 7.1 `server/test/MetricsService.test.js` (neu)
- `parsePrometheus`: gültiger Text → korrekte Map; `#`-Zeilen ignoriert; Labels mit Sonderzeichen; leere Zeilen.
- `buildSnapshot`: Totals, Paths, Protocols, ForwardDests korrekt; Throughput mit/ohne `prev`; Δt = 0 → 0.
- `fetchSnapshot`: Mock-Server (200) → Snapshot; Fehler (500) → throw mit `code`; Timeout → `upstream_timeout`.

### 7.2 `server/test/MetricsRouter.test.js` (neu)
- `GET /api/metrics` → 200 `{ success: true, data: <Snapshot> }`.
- Upstream-Fehler → 502 `{ success: false, code: 'upstream_unreachable' }`.
- Timeout → 504 `{ success: false, code: 'upstream_timeout' }`.
- Muster: `server/test/SettingsRouter.test.js`.

### 7.3 `server/test/mock-mediamtx.js`
- `/metrics`-Endpoint (Prometheus-Text) + `?mockError=500`.

### 7.4 `server/test/Config.test.js`
- Neuer Key (`mediamtxMetricsUrl`) in Defaults / Validation / Update.

---

## 8. Phasen & Schritte

> Reihenfolge: **Server (Datenquelle + Endpunkt) → Client.** Jeder Schritt verifizierbar.

### Phase 1 — Server
1. **Config-Key** `mediamtxMetricsUrl` in `Config.js` (defaults, runtimeKeys, getSettings, validate, update, persist). → `Config.test.js` erweitern.
2. **`parsePrometheus()`** (reine Funktion) + Unit-Tests.
3. **`buildSnapshot()`** (reine Funktion, inkl. Throughput) + Unit-Tests.
4. **`MetricsService.fetchSnapshot()`** (Fetch + Fehler-Codes) + Tests (Mock-Server).
5. **`MetricsRouter`** (`GET /api/metrics`) + Tests.
6. **Router-Verdrahtung** (`Router/index.js`) + Smoke-Test.

### Phase 2 — Client
7. **`useMetrics`** Hook (`useQuery` + `useAutoRefresh`).
8. **`MetricCard`** (+ optional `Sparkline`) Komponenten.
9. **`Metrics.jsx`** Page (Totals, Protocols, Paths, Forward, Fehler/Leer/Loading).
10. **Nav + Route** (`navItems.js`, `App.jsx`).
11. **i18n** (en/de/it) + **CSS** (`metrics.css`).

### Phase 3 — Polish & Abnahme
12. **Settings-UI:** `mediamtxMetricsUrl` in Settings editierbar (optional).
13. **E2E-Smoke:** `metrics: true` in `mediamtx.yml`, Page lädt, Werte ändern sich bei Last.
14. **Build + Lint** grün (server + frontend).

---

## 9. i18n-Keys (vollständig)

```
nav.metrics
pages.metrics.title
pages.metrics.subtitle
pages.metrics.empty
pages.metrics.error
pages.metrics.loading
pages.metrics.totals.title
pages.metrics.totals.pathsOnline
pages.metrics.totals.readers
pages.metrics.totals.inbound
pages.metrics.totals.outbound
pages.metrics.totals.framesInError
pages.metrics.totals.perSec
pages.metrics.protocols.title
pages.metrics.protocols.hls
pages.metrics.protocols.rtsp
pages.metrics.protocols.rtmp
pages.metrics.protocols.srt
pages.metrics.protocols.webrtc
pages.metrics.protocols.moq
pages.metrics.protocols.muxers
pages.metrics.protocols.sessions
pages.metrics.protocols.conns
pages.metrics.protocols.inbound
pages.metrics.protocols.outbound
pages.metrics.paths.title
pages.metrics.paths.name
pages.metrics.paths.state
pages.metrics.paths.readers
pages.metrics.paths.inbound
pages.metrics.paths.outbound
pages.metrics.paths.framesInError
pages.metrics.paths.noPaths
pages.metrics.forward.title
pages.metrics.forward.id
pages.metrics.forward.path
pages.metrics.forward.type
pages.metrics.forward.state
pages.metrics.forward.outbound
pages.metrics.forward.noDests
```

---

## 10. Optionaler Extension-Punkt: CPU / RAM

- MediaMTX-Metriken enthalten **keine** Host-Ressourcen (CPU/RAM). Der Prometheus-Endpunkt liefert nur Medien-Metriken.
- **Option A:** Server liest `os.cpus()` / `os.totalmem()` / `os.freemem()` (Node) → meldet die **UI-Server-Host**-Ressourcen (nicht zwingend der MediaMTX-Host, da separate Container).
- **Option B:** Separater Agent/Endpoint auf dem MediaMTX-Host.
- **Empfehlung:** v1 weglassen. `FEATURES.md` („CPU / RAM") ist hier aspirativ — der Prometheus-Endpunkt liefert es nicht. Klar kommunizieren.

---

## 11. Risiken & offene Fragen

| # | Risiko / Frage | Impact | Mitigation |
|---|---|---|---|
| R1 | `metrics: false` in `mediamtx.yml` | Page zeigt „nicht erreichbar" | Vor Abnahme `metrics: true` setzen (Config-Formular oder YAML). |
| R2 | Metrics-Port 9998 nicht vom UI-Server erreichbar (Netzwerk) | Kein Datenfluss | `mediamtxMetricsUrl` konfigurierbar; Docker-Netz `mediamtx` nutzen (`http://mediamtx:9998`). |
| R3 | Auth am Metrics-Server (permissions `action: metrics`) | 401/403 | `mediamtxAuthToken` als Bearer mitgeben; in `mediamtx.yml` hat der `any`-User bereits `metrics`-Permission (IP-restrikt). |
| R4 | CPU/RAM nicht verfügbar | `FEATURES.md`-Erwartung | §10: klar kommunizieren, v1 weglassen. |
| R5 | Poll-Intervall zu hoch/gering | Last / Latenz | Über bestehende App-Setting `autoRefreshMs` (Default 10 s) steuerbar. |
| R6 | Throughput bei `autoRefreshMs = 0` (aus) | Kein Δt → 0 Bytes/s | Erwartetes Verhalten; Throughput zeigt 0, Zähler bleiben korrekt. |
| R7 | `lastSnapshot`-State pro Server-Instanz | Bei mehreren Instanzen unterschiedlich | Akzeptabel (eine UI-Instanz); Throughput ist pro Instanz. |

---

## 12. Abnahmekriterien (gesamt)

- [ ] `GET /api/metrics` liefert normalisiertes Snapshot (200) bzw. sauberen Fehler (502/504).
- [ ] Client: **Polling** via `useQuery` + `useAutoRefresh` (kein WebSocket, kein Upstream-Polling).
- [ ] Page `/metrics`: Totals, Protocols, Paths, Forward-Destinations sichtbar.
- [ ] Fehlerzustand: `ErrorAlert` + letzter Snapshot (grau) via `placeholderData`.
- [ ] i18n en/de/it vollständig; Dark/Light korrekt.
- [ ] Tests (Parser, Snapshot, Fetch, Router) grün.
- [ ] `npm run build` (frontend) + `npm test` (server) grün.
- [ ] E2E: `metrics: true` → Page zeigt Werte, die sich bei Last ändern.

---

## 13. Betroffene Dateien (Übersicht)

**Neu (server):**
- `server/src/MetricsService.js`
- `server/src/Router/MetricsRouter.js`
- `server/test/MetricsService.test.js`
- `server/test/MetricsRouter.test.js`

**Neu (frontend):**
- `frontend/src/hooks/useMetrics.js`
- `frontend/src/components/pages/Metrics.jsx`
- `frontend/src/components/metrics/MetricCard.jsx`
- `frontend/src/components/metrics/Sparkline.jsx` (optional)
- `frontend/src/style/components/metrics.css`

**Geändert (server):**
- `server/src/Config.js` (1 neuer Key)
- `server/src/Router/index.js` (MetricsRouter mounten)
- `server/test/mock-mediamtx.js` (`/metrics`)
- `server/test/Config.test.js` (neuer Key)

**Geändert (frontend):**
- `frontend/src/components/layout/navItems.js` (Nav-Item)
- `frontend/src/App.jsx` (Route)
- `frontend/src/services/queryKeys.js` (`metrics`)
- `frontend/src/locales/en.json`, `de.json`, `it.json` (Keys)
- `frontend/src/style/components/index.css` (import)

**Konfiguration (Betrieb):**
- `mediamtx/mediamtx.yml`: `metrics: true` (vor Abnahme)
- `.env` / `compose-dev.yml`: `MEDIAMTX_METRICS_URL=http://mediamtx:9998`
