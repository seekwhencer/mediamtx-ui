# PLAN_INFLUX — MediaMTX-Metriken → InfluxDB 3 (Server-Poller)

> **Stand:** 2026-10-28
> **Ziel:** Der Server pollt den MediaMTX-Metrics-Endpunkt (Prometheus, Port 9998) **zyklisch** und schreibt die Daten in eine **InfluxDB 3 Core**. Dazu ein **Docker-Compose-File** für InfluxDB 3.
> **Quellen:** `https://mediamtx.org/docs/features/metrics`, `https://github.com/InfluxCommunity/influxdb3-js`, `https://docs.influxdata.com/influxdb3/core/`, Code: `server/src/MetricsService.js`, `server/src/Config.js`, `server/src/Router/index.js`, `server/src/Server.js`, `compose*.yml`.
> **Bestehende Basis:** `MetricsService` (Fetch + `parsePrometheus` + `buildSnapshot`) und `GET /api/metrics` existieren bereits (PLAN_METRICS.md). Dieser Plan **baut darauf auf** und ergänzt den **Influx-Writer + Poller + Compose**.

---

## TEIL A — INFORMATION-EXTRAKT

### A.1 MediaMTX Metrics (aus `mediamtx.org/docs/features/metrics`)

**Aktivierung & Zugriff**
- Aktivierung: `metrics: yes` in der MediaMTX-Config.
- Dedizierter HTTP-Server, **Prometheus-kompatibles Format**.
- Default-Port **9998**, Endpunkt `GET /metrics`.
- Beispiel: `curl http://localhost:9998/metrics`.

**Format**
- Prometheus *Exposition Format*: `metrik{label="wert",…} <zahl>`.
- `#`-Zeilen = Kommentare (Metrik-Typ/Help), werden ignoriert.
- **Keine Bitrates** direkt — „Bitrates are not provided directly as metrics because they can be computed from received and sent bytes". → Throughput aus Byte-Deltas berechnen.

**Metrik-Familien & Labels** (vollständig aus der Doku)

| Familie | Metriken | Labels |
|---|---|---|
| **Paths** | `paths`, `paths_readers`, `paths_inbound_bytes`, `paths_outbound_bytes`, `paths_inbound_frames_in_error` | `name`, `state`, (`readerType`) |
| **HLS sessions** | `hls_sessions`, `hls_sessions_outbound_bytes` | `id`, `path` |
| **HLS muxers** | `hls_muxers`, `hls_muxers_outbound_bytes`, `hls_muxers_outbound_frames_discarded` | `name` |
| **RTSP conns** | `rtsp_conns`, `rtsp_conns_inbound_bytes`, `rtsp_conns_outbound_bytes` | `id` |
| **RTSP sessions** | `rtsp_sessions`, `…_inbound_bytes`, `…_inbound_rtp_packets`, `…_inbound_rtp_packets_lost`, `…_inbound_rtp_packets_in_error`, `…_inbound_rtp_packets_jitter`, `…_inbound_rtcp_packets`, `…_inbound_rtcp_packets_in_error`, `…_outbound_bytes`, `…_outbound_rtp_packets`, `…_outbound_rtp_packets_reported_lost`, `…_outbound_rtp_packets_discarded`, `…_outbound_rtcp_packets` | `id`, `path`, `state` |
| **RTSPS conns/sessions** | wie RTSP, Präfix `rtsps_` | `id`, (`path`, `state`) |
| **RTMP conns** | `rtmp_conns`, `…_inbound_bytes`, `…_outbound_bytes`, `…_outbound_frames_discarded` | `id`, `path`, `state` |
| **RTMPS conns** | wie RTMP, Präfix `rtmps_` | `id`, `path`, `state` |
| **SRT conns** | `srt_conns` + ~40 Metriken (`…_packets_sent/received/…`, `…_bytes_sent/received/…`, `…_ms_rtt`, `…_mbps_send_rate/receive_rate`, `…_us_snd_duration`, …) | `id`, `path`, `state` |
| **WebRTC sessions** | `webrtc_sessions`, `…_inbound_bytes`, `…_inbound_rtp_packets`, `…_inbound_rtp_packets_lost`, `…_inbound_rtp_packets_jitter`, `…_inbound_rtcp_packets`, `…_outbound_bytes`, `…_outbound_rtp_packets`, `…_outbound_rtcp_packets`, `…_outbound_frames_discarded` | `id`, `path`, `state` |
| **MoQ sessions** | `moq_sessions`, `…_inbound_bytes`, `…_outbound_bytes` | `id`, `path`, `state` |
| **Forward dests** | `forward_dests`, `forward_dests_outbound_bytes` | `pos`, `id`, `path`, `type`, `state` |

**Filter (HTTP-Query-Parameter)**
- `type=[TYPE]`: `paths`, `forward_dests`, `hls_sessions`, `hls_muxers`, `rtsp_conns`, `rtsp_sessions`, `rtsps_conns`, `rtsps_sessions`, `rtmp_conns`, `rtmps_conns`, `srt_conns`, `webrtc_sessions`, `moq_sessions`.
- `path=[PATH]`, `hls_muxer=[PATH]`, `hls_session=[ID]`, `rtsp_conn=[ID]`, `rtsp_session=[SESSION]`, `rtsps_conn=[ID]`, `rtsps_session=[SESSION]`, `rtmp_conn=[ID]`, `rtmps_conn=[ID]`, `srt_conn=[ID]`, `webrtc_session=[ID]`, `forward_dest=[ID]`, `moq_session=[ID]`.

**Auth**
- MediaMTX-Permissions (`action: metrics`); Bearer-Token möglich.

**Fazit für uns:** Der Endpunkt liefert **alle** Metriken als flache Prometheus-Serien. Für InfluxDB ist die **generische 1:1-Mapping-Strategie** (Metrikname → Measurement, Labels → Tags, Wert → Field) ideal: verlustfrei, generisch, ohne pro-Familie-Code.

---

### A.2 InfluxDB 3 JavaScript Client (aus `github.com/InfluxCommunity/influxdb3-js`)

**Paket & Installation**
- Paket: `@influxdata/influxdb3-client` (npm).
- `npm install --save @influxdata/influxdb3-client`.
- Node.js: CJS (main), ESM (module), Browser (UMD). → passt zu `server` (`"type": "module"`).
- Lizenz: **MIT**.

**Client anlegen**
```js
import { InfluxDBClient, Point, PartialWriteError } from '@influxdata/influxdb3-client';

const client = new InfluxDBClient({ host, token, database });
// oder: new InfluxDBClient()  (liest INFLUX_HOST / INFLUX_TOKEN / INFLUX_DATABASE)
// oder: new InfluxDBClient('https://host/?token=…&database=…')
// …
client.close();   // MUSS aufgerufen werden, wenn fertig
```
- `token` ist **Pflicht**.

**Schreiben (Write)**
```js
// Line-Protocol-String (eine oder mehrere Zeilen, \n-getrennt)
const line = `stat,unit=temperature avg=20.5,max=45.0`;
await client.write(line, database);

// Optional: Point-Builder (typsicher)
const point = Point.measurement('cpu')
  .setTag('region', 'us-east')
  .setTag('host', 'web-01')
  .setFloatField('usage', 0.76);
await client.write(point, database, undefined, { tagOrder: ['region','host'] });
```
- **Partial Writes:** Default aktiv (V3-API). Bei Teilablehnung wirft der Client `PartialWriteError` mit strukturierten `lineErrors` (`lineNumber`, `errorMessage`, `originalLine`).
- `acceptPartial: false` → eine abgelehnte Zeile verwirft das ganze Batch.

**API-Endpunkt (wichtig für InfluxDB 3 Core)**
- **Default:** Writes gehen über den **V2-API-Endpunkt** (`useV2Api=true`).
- **Für InfluxDB 3 Core/Enterprise:** `useV2Api: false` setzen → Writes über den **V3-API-Endpunkt** (`/api/v3/write_lp`), unterstützt `noSync` + `acceptPartial`.
- `noSync` geht **nicht** mit `useV2Api` (wird vor dem Request abgelehnt).
- → **Entscheidung:** `useV2Api: false` (wir targeten InfluxDB 3 Core).

**Abfragen (Query)**
```js
const query = `SELECT * FROM "stat" WHERE time >= now() - interval '5 minute'`;
const result = await client.query(query, database);
for await (const row of result) { console.log(row.avg, row.max); }

// typsicher:
const qp = client.queryPoints(query, database, queryOptions);
for await (const row of qp) {
  row.getField('avg','float');
  row.asPoint('stat').toLineProtocol();
}
```
- SQL (DataFusion) oder InfluxQL (`{ type: 'influxql' }`).

**gRPC-Kompression**
- Response-Kompression (gzip/deflate) ist **default an** und kann nicht deaktiviert werden (im `@grpc/grpc-js` hartkodiert).
- Request-Kompression optional via `grpcOptions` — InfluxDB-Server lehnen komprimierte Requests oft ab. → **nicht** aktivieren.

**HTTP-API (InfluxDB 3 Core, für Admin/Setup)**
- Health: `GET /health` (Bearer).
- Admin-Token: `POST /api/v3/configure/token/admin`.
- **Datenbank anlegen:** `POST /api/v3/configure/database` mit `{"name":"…"}` (Bearer).
- Write: `POST /api/v3/write_lp?db=<db>&precision=auto` (Line-Protocol, Bearer) → `204 No Content`.
- Query: `GET/POST /api/v3/query_sql?db=<db>&q=<sql>&format=jsonl`.

**Fazit für uns:** Der Client deckt **Write + Query** ab. Für **Datenbank-Anlegen** nutzen wir die HTTP-API direkt (via `axios`, bereits Dependency). Writes bauen wir als **Line-Protocol-String** (generisches Mapping) und senden per `client.write(line, database)` mit `useV2Api:false`.

---

### A.3 InfluxDB 3 Core (Docker, aus `docs.influxdata.com/influxdb3/core/`)

- **Image:** `influxdb:3-core` (Docker Hub; auch `quay.io/influxdb/influxdb3-core`). Pinne eine Version (z. B. `influxdb:3.12.0-core`), da `latest` sich ändert.
- **Ports:** `8181` (HTTP API), `8086` (Flight SQL/gRPC), `9090` (Prometheus remote write), `8090` (Prometheus remote read).
- **Auth:** Preconfigured Admin-Token via `INFLUXDB3_AUTH_TOKEN` (empfohlen für Produktion) oder `INFLUXDB3_WITHOUT_AUTH=true` (nur Dev).
- **Object Store:** `--object-store file --data-dir /var/lib/influxdb3/data` (Persistenz via Volume).
- **Node-ID:** `--node-id node0`.
- **Datenbanken:** müssen **vor** dem Write existieren (kein Auto-Create). → Server legt sie beim Start an.
- **Kein Config-Reload:** Env-Änderungen erfordern Restart.

---

## TEIL B — PLAN

### B.1 Ziel & Nicht-Ziel

**Ziel**
- Server **pollt zyklisch** `GET {mediamtxMetricsUrl}/metrics` (Intervall konfigurierbar, Default 15 s).
- Jede Abfrage wird **verlustfrei** in InfluxDB 3 geschrieben (generisches Mapping, §B.4).
- **InfluxDB 3 Core** läuft als eigener Container (`compose-influx.yml`), persistiert auf Volume.
- Feature ist **opt-in** (`influxEnabled`, Default `false`) — bestehendes Verhalten bleibt unverändert.
- Sauberer Start/Stop (Shutdown), Fehlerbehandlung (log + weiterlaufen), Tests.
- **Settings-UI:** Influx-Keys in der Settings-Seite editierbar (Runtime-Toggle ohne Restart, §B.11.2).
- **Query-Endpunkt + Historie-UI:** `GET /api/metrics/history` + einfache Historie-Ansicht in der UI (§B.11.1, §B.11.3).

**Nicht-Ziel (v1)**
- **Kein volles Grafana-Ersatz** — die UI zeigt eine **einfache Historie** (1 Metrik + Zeitfenster, §B.11); tiefe Analyse bleibt Grafana/Explorer.
- **Keine CPU/RAM**-Metriken (liefert MediaMTX nicht).
- **Kein Retention-Policy-Management** (InfluxDB 3 Core: `influxdb3 update database … retention`).
- **Kein Multi-Instance-Setup** (eine UI-Instanz = ein Poller).

---

### B.2 Architektur

```
┌────────────┐   GET /metrics (Prometheus-Text)   ┌─────────────────────────────┐
│  MediaMTX  │ ◄────────────────────────────────── │  MetricsCollector (Poller)  │
│  :9998     │   (alle influxPollIntervalMs)       │  (server, Node, setInterval)│
└────────────┘                                     └──────────────┬──────────────┘
                                                                  │ 1. fetchText (MetricsService)
                                                                  │ 2. parsePrometheus (MetricsService, REUSE)
                                                                  │ 3. toLineProtocol (InfluxService, pure)
                                                                  ▼
                                                        ┌─────────────────────────────┐
                                                        │  InfluxService             │
                                                        │  (@influxdata/influxdb3-   │
                                                        │   client, useV2Api:false)  │
                                                        └──────────────┬──────────────┘
                                                                      │ write(line, db)
                                                                      ▼
                                                        ┌─────────────────────────────┐
                                                        │  InfluxDB 3 Core :8181      │
                                                        │  (compose-influx.yml)       │
                                                        └─────────────────────────────┘
```

**Komponenten**

| Komponente | Datei | Verantwortung |
|---|---|---|
| **MetricsService** (bestehend) | `server/src/MetricsService.js` | Fetch + `parsePrometheus` (REUSE). Kleiner Refactor: `fetchMetricsText()` extrahieren. |
| **InfluxService** (neu) | `server/src/InfluxService.js` | Client-Wrapper, `ensureDatabase()`, `writeLines()`, `close()`, pure `toLineProtocol()`. |
| **MetricsCollector** (neu) | `server/src/MetricsCollector.js` | Der **zyklische Poller**: `start()`/`stop()`/`pollOnce()`/`applyConfig()`. |
| **Config** (erweitert) | `server/src/Config.js` | 5 neue Keys (§B.5). |
| **Router** (erweitert) | `server/src/Router/index.js` | Verdrahtung + Settings-Applier. |
| **Server** (erweitert) | `server/src/Server.js` | Shutdown: Collector stop + Influx close. |

**Warum Poller im Server (nicht Client)?**
- Historie muss **unabhängig vom UI** laufen (UI kann zu/abgeschaltet sein).
- Ein zentraler Poller = **ein** Upstream-Request + **ein** Influx-Write pro Intervall (kein N-facher Traffic bei mehreren Browser-Tabs).
- Passt zum bestehenden Muster `LogTailService` (long-running Service mit `start()`/`stop()`).

---

### B.3 Datenfluss (pro Poll-Zyklus)

```
1. text   = await metricsService.fetchMetricsText()      // GET /metrics (Auth, Timeout, Fehler-Codes)
2. series = MetricsService.parsePrometheus(text)          // Map<name, [{labels, value}]>  (REUSE)
3. lines  = InfluxService.toLineProtocol(series, tsNs)    // string[]  (pure, testbar)
4. await influxService.writeLines(lines)                   // client.write(lines.join('\n'), db)
```

- **tsNs** = `Date.now() * 1_000_000` (Nanosekunden) → als Line-Protocol-Timestamp angehängt.
- Fehler in Schritt 1–4: **loggen + Zyklus abbrechen**, Poller läuft weiter (nächster Tick). Kein Crash.
- **Kein Backoff nötig** für v1 (Intervall ist klein, Upstream ist lokal). Optional: Konsekutiv-Fehler zählen + Warn-Log.

---

### B.4 Datenmodell (Line-Protocol-Mapping)

**Strategie: generisches 1:1-Mapping** (verlustfrei, ohne pro-Familie-Code)

| Prometheus | InfluxDB 3 |
|---|---|
| Metrikname (z. B. `paths_inbound_bytes`) | **Measurement** |
| Labels (z. B. `name`, `state`, `id`, `path`) | **Tags** |
| Wert (z. B. `1234`) | **Field** `value` (float) |
| — (Poll-Zeit) | **Timestamp** (ns) |

**Beispiel** (aus §A.1)

Prometheus:
```
paths{name="cam1",state="ready"} 1
paths_inbound_bytes{name="cam1",state="ready"} 123456
hls_sessions{id="abc",path="cam1"} 1
srt_conns{id="jkl",path="cam1",state="read"} 1
```

Line-Protocol (eine Write-Batch, `\n`-getrennt):
```
paths,name=cam1,state=ready value=1 1735545600000000000
paths_inbound_bytes,name=cam1,state=ready value=123456 1735545600000000000
hls_sessions,id=abc,path=cam1 value=1 1735545600000000000
srt_conns,id=jkl,path=cam1,state=read value=1 1735545600000000000
```

**SQL-Abfrage (Beispiele)**
```sql
-- Inbound-Bytes pro Pfad, letzte Stunde
SELECT time, name, state, value
FROM paths_inbound_bytes
WHERE time >= now() - INTERVAL '1 hour'
ORDER BY time;

-- Durchsatz (Bytes/s) pro Pfad (Window-Funktion)
SELECT
  name,
  (value - LAG(value) OVER (PARTITION BY name ORDER BY time))
    / (time - LAG(time) OVER (PARTITION BY name ORDER BY time)) AS bytes_per_sec
FROM paths_inbound_bytes
WHERE time >= now() - INTERVAL '10 minutes';

-- Aktive WebRTC-Sessions
SELECT time, id, path, state, value FROM webrtc_sessions
WHERE time >= now() - INTERVAL '5 minutes';
```

**Escaping (Line-Protocol)**
- **Tag-Value:** `,` `=` ` ` escapen (`\,` `\=` `\ `).
- **Measurement:** `,` ` ` escapen.
- **Field-Name** `value` ist fix (kein Escaping nötig).
- **Field-Value:** float, kein Escaping nötig.

> **Warum nicht `buildSnapshot`?** Der Snapshot ist eine **UI-normalisierte** Ansicht (Totals, Protocols, Forward). Für die Historie wollen wir die **rohen Serien** (verlustfrei, alle Metriken, alle Labels). Deshalb: `parsePrometheus` (rohe Serien) → `toLineProtocol`. `buildSnapshot` bleibt für `GET /api/metrics` (UI) unverändert.

---

### B.5 Config-Keys (neu, `server/src/Config.js`)

| Key | Default | Env | Typ | Runtime? | Zweck |
|---|---|---|---|---|---|
| `influxEnabled` | `false` | `INFLUX_ENABLED` | boolean | ✅ | Feature an/aus (startet/stopt den Poller) |
| `influxHost` | `http://localhost:8181` | `INFLUX_HOST` | string (URL) | ✅ | InfluxDB-Base-URL |
| `influxToken` | `''` | `INFLUX_TOKEN` | string (Secret) | ✅ | Admin/Operator-Token (maskiert in Settings) |
| `influxDatabase` | `mediamtx` | `INFLUX_DATABASE` | string | ✅ | Datenbank-/Bucket-Name |
| `influxPollIntervalMs` | `15000` | `INFLUX_POLL_INTERVAL_MS` | int (ms) | ✅ | Poll-Intervall |

**Änderungen in `Config.js`** (Muster = bestehende Keys):
- `static defaults`: 5 neue Einträge.
- `static runtimeKeys`: 5 neue Keys anhängen.
- `constructor`: 5 neue `this.*`-Zuweisungen (Env → default).
- `buildDefaults()`: 5 neue Einträge.
- `getSettings()`: 5 neue Keys (`influxToken` via `maskSecret`).
- `validateSettings()`:
  - `influxEnabled` muss boolean sein.
  - `influxHost` muss gültige http(s)-URL sein.
  - `influxToken` muss String sein.
  - `influxDatabase` muss nicht-leerer String sein.
  - `influxPollIntervalMs` muss int ≥ 1000 sein.
- `updateSettings()`: 5 neue Keys in `current`/`next`/Apply; **Token-Regel** wie `mediamtxAuthToken` (maskiert `••••…` → unverändert).
- `persist()`: 5 neue Keys.

> **Hinweis:** `influxEnabled` ist ein **Runtime-Key** — der Settings-Applier startet/stopt den Poller ohne Restart (§B.7).

---

### B.6 `server/src/InfluxService.js` (neu)

```js
import axios from 'axios';
import { InfluxDBClient } from '@influxdata/influxdb3-client';

class InfluxService {
    constructor(config, logger) {
        this.config = config;
        this.label = '[InfluxService]';
        this.logger = logger || { log: () => {}, error: () => {} };
        this.client = null;
    }

    /** Client anlegen + Datenbank sicherstellen. Idempotent. */
    async init() {
        if (this.client) return;
        const host = (this.config.influxHost || 'http://localhost:8181').replace(/\/+$/, '');
        const token = this.config.influxToken || '';
        const database = this.config.influxDatabase || 'mediamtx';
        this.client = new InfluxDBClient({ host, token, database });
        await this.ensureDatabase(host, token, database);
        this.logger.log(this.label, `init -> ${host} db=${database}`);
    }

    /** POST /api/v3/configure/database (idempotent: 409/exists = OK). */
    async ensureDatabase(host, token, database) {
        try {
            await axios.post(`${host}/api/v3/configure/database`,
                { name: database },
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true });
        } catch (err) {
            this.logger.error(this.label, `ensureDatabase -> ${err.message}`);
            throw new Error(`InfluxDB unreachable: ${err.message}`);
        }
        // 2xx = erstellt, 4xx (exists) = OK. Nur Netzwerk-Fehler werfen oben.
    }

    /** Schreibt eine Batch von Line-Protocol-Zeilen. */
    async writeLines(lines) {
        if (!this.client) throw new Error('InfluxService not initialized');
        if (!lines.length) return;
        await this.client.write(lines.join('\n'), this.config.influxDatabase, undefined, {
            useV2Api: false,   // InfluxDB 3 Core → V3-API-Endpunkt
        });
    }

    /** Client schließen (Shutdown). */
    async close() {
        if (this.client) { await this.client.close(); this.client = null; }
    }

    // ---------- Pure Funktionen (unit-testbar) ----------

    static escapeTagValue(v) {
        return String(v).replace(/\\/g, '\\\\').replace(/,/g, '\\,')
                        .replace(/=/g, '\\=').replace(/ /g, '\\ ');
    }
    static escapeMeasurement(v) {
        return String(v).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/ /g, '\\ ');
    }

    /**
     * Map<name, [{labels, value}]> → string[] (Line-Protocol).
     * Reine Funktion — unit-testbar ohne I/O.
     */
    static toLineProtocol(series, tsNs) {
        const lines = [];
        for (const [metric, samples] of series) {
            for (const { labels, value } of samples) {
                const tags = Object.entries(labels)
                    .map(([k, v]) => `${k}=${InfluxService.escapeTagValue(v)}`)
                    .join(',');
                const head = tags
                    ? `${InfluxService.escapeMeasurement(metric)},${tags}`
                    : InfluxService.escapeMeasurement(metric);
                lines.push(`${head} value=${value} ${tsNs}`);
            }
        }
        return lines;
    }
}

export { InfluxService };
```

**Anmerkungen**
- `useV2Api: false` → V3-API-Endpunkt (InfluxDB 3 Core). Siehe §A.2.
- `ensureDatabase` nutzt `axios` (bereits Dependency) — der Client hat keine Create-DB-Methode.
- `writeLines` batcht **alle** Zeilen eines Polls in **einem** Write (effizient).
- Fehler: `writeLines` wirft → Collector fängt + loggt (§B.3).

---

### B.7 `server/src/MetricsCollector.js` (neu)

```js
class MetricsCollector {
    constructor(metricsService, influxService, config, logger) {
        this.metricsService = metricsService;
        this.influxService = influxService;
        this.config = config;
        this.label = '[MetricsCollector]';
        this.logger = logger || { log: () => {}, error: () => {} };
        this.timer = null;
        this.running = false;
        this.consecutiveErrors = 0;
    }

    /** Startet den Poller (idempotent). */
    async start() {
        if (this.running) return;
        await this.influxService.init();
        this.running = true;
        this.schedule();
        this.logger.log(this.label, `start -> interval=${this.config.influxPollIntervalMs}ms`);
    }

    /** Stoppt den Poller (idempotent). */
    stop() {
        if (this.timer) { clearTimeout(this.timer); this.timer = null; }
        this.running = false;
        this.logger.log(this.label, 'stop');
    }

    /** Intervall neu planen (recursive setTimeout → kein Overlap). */
    schedule() {
        if (!this.running) return;
        this.timer = setTimeout(() => this.tick(), this.config.influxPollIntervalMs);
    }

    async tick() {
        if (!this.running) return;
        try {
            await this.pollOnce();
            this.consecutiveErrors = 0;
        } catch (err) {
            this.consecutiveErrors += 1;
            const lvl = this.consecutiveErrors >= 5 ? 'error' : 'log';
            this.logger[lvl](this.label,
                `poll failed (#${this.consecutiveErrors}): ${err.message}`);
        } finally {
            this.schedule();   // nächsten Tick planen (auch bei Fehler)
        }
    }

    /** Ein Poll-Zyklus: fetch → parse → convert → write. */
    async pollOnce() {
        const text = await this.metricsService.fetchMetricsText();
        const series = MetricsService.parsePrometheus(text);   // REUSE
        const tsNs = Date.now() * 1_000_000;
        const lines = InfluxService.toLineProtocol(series, tsNs);
        await this.influxService.writeLines(lines);
        this.logger.log(this.label, `poll -> ${lines.length} lines written`);
    }

    /** Settings-Applier: Config-Änderung anwenden (start/stop/restart). */
    async applyConfig() {
        const enabled = !!this.config.influxEnabled;
        if (enabled && !this.running) {
            await this.start();
        } else if (!enabled && this.running) {
            this.stop();
            await this.influxService.close();
        } else if (enabled && this.running) {
            // Intervall/Host/DB geändert → Restart
            this.stop();
            await this.influxService.close();
            await this.start();
        }
    }
}

export { MetricsCollector };
```

**Anmerkungen**
- **Recursive `setTimeout`** (nicht `setInterval`) → kein Overlap, wenn ein Poll länger als das Intervall dauert.
- **Fehlerresistent:** Fehler werden geloggt, Poller läuft weiter.
- **`applyConfig()`** wird vom Settings-Applier aufgerufen (§B.8) → Runtime-Toggle ohne Restart.
- **`MetricsService`-Refactor:** `fetchMetricsText()` extrahieren (siehe §B.9).

---

### B.8 Verdrahtung (`server/src/Router/index.js`)

In `define()` — **nach** `MetricsService`/`MetricsRouter` (die müssen existieren), **vor** der Bridge:

```js
// 2c. Influx (optional — Metriken-Historie). REUSE MetricsService.
this.influxService = new InfluxService(this.config, this.logger);
this.metricsCollector = new MetricsCollector(
    this.metricsService, this.influxService, this.config, this.logger);
if (this.config.influxEnabled) {
    await this.metricsCollector.start();   // init + ensureDatabase + Poller
}
```

**Settings-Applier erweitern** (bestehend: `bridge.applyConfig` + `logger.setVerbose`):

```js
this.settingsRouter.setApplier(async () => {
    this.bridge.applyConfig(this.config);
    this.logger.setVerbose(this.config.verbose);
    await this.metricsCollector.applyConfig();   // NEU: Influx start/stop/restart
});
```

> **Hinweis:** Der Applier wird **async**. `SettingsRouter.setApplier` muss das aushalten (aufrufen + `await`/`.catch`). Falls synchron erwartet: `applyConfig().catch(err => logger.error(...))`.

---

### B.9 `server/src/MetricsService.js` (kleiner Refactor)

`fetchSnapshot()` aktuell: Fetch + Parse + Snapshot. Für den Collector brauchen wir **Fetch + Parse** (ohne Snapshot). Extrahieren:

```js
/** Holt den rohen Prometheus-Text vom Upstream. (NEU) */
async fetchMetricsText() {
    const baseURL = (this.config.mediamtxMetricsUrl || 'http://localhost:9998').replace(/\/+$/, '');
    const authToken = this.config.mediamtxAuthToken || '';
    const timeout = this.config.mediamtxBridgeTimeout || 10000;
    const url = `${baseURL}/metrics`;
    let res;
    try {
        res = await axios.get(url, {
            timeout,
            validateStatus: () => true,
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
    } catch (err) {
        const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT'
            || /timeout/i.test(err.message || '');
        const e = new Error(isTimeout ? 'MediaMTX metrics request timed out'
            : `MediaMTX metrics unreachable: ${err.message}`);
        e.code = isTimeout ? 'upstream_timeout' : 'upstream_unreachable';
        throw e;
    }
    if (res.status < 200 || res.status >= 300) {
        const e = new Error(`MediaMTX metrics unreachable: HTTP ${res.status}`);
        e.code = 'upstream_unreachable';
        throw e;
    }
    return typeof res.data === 'string' ? res.data : '';
}

/** (BESTEHEND, refactored) — nutzt jetzt fetchMetricsText(). */
async fetchSnapshot() {
    const text = await this.fetchMetricsText();
    const series = MetricsService.parsePrometheus(text);
    const now = Date.now();
    const snapshot = MetricsService.buildSnapshot(series, this.last, now);
    this.last = snapshot;
    this.lastTs = now;
    return snapshot;
}
```

> **Wichtig:** `fetchSnapshot()`-Verhalten + `GET /api/metrics` bleiben **unverändert** (PLAN_METRICS.md). Nur der Fetch-Teil wird extrahiert. Bestehende Tests müssen weiter grün sein.

---

### B.10 `server/src/Server.js` (Shutdown)

In `shutdown()` — **vor** `httpServer.close()`:

```js
const shutdown = async () => {
    this.logger.log(this.label, 'Shutting down...');
    this.router?.logsWs?.close();
    this.router?.tailService?.stop();
    this.router?.metricsCollector?.stop();          // NEU: Poller stoppen
    await this.router?.influxService?.close();      // NEU: Influx-Client schließen
    this.httpServer.close(() => process.exit(0));
    this.httpServer.closeAllConnections();
    this.router?.closeUpgradedSockets?.();
};
```

---

### B.11 Query-Endpunkt & Settings-UI (neu)

> **Entscheidung (TEIL C):** Settings-UI für Influx-Keys = **ja**, Query-Endpunkt für UI = **ja**. Beide sind **v1-Scope** (nicht mehr v1.1).

#### B.11.1 Query-Endpunkt (server)

**Ziel:** Historie aus InfluxDB 3 abfragen und als JSON an die UI liefern.

**Endpunkt:** `GET /api/metrics/history` (server-eigen, nicht an MediaMTX proxied)

**Query-Parameter**

| Param | Pflicht | Default | Zweck |
|---|---|---|---|
| `metric` | ✅ | — | Measurement-Name (z. B. `paths_inbound_bytes`) |
| `range` | — | `1h` | Zeitfenster (Whitelist: `15m`, `1h`, `24h`, `7d`) |
| `limit` | — | `1000` | Max. Zeilen (max `10000`) |
| `<tagKey>=<tagValue>` | — | — | optionale Tag-Filter (z. B. `name=cam1`, `state=ready`) |

**Verhalten / Fehler**
- `influxEnabled=false` → `503 { success:false, code:'influx_disabled' }`.
- `metric` fehlt/ungültig → `400 { success:false, code:'invalid_metric' }`.
- InfluxDB nicht erreichbar → `502 { success:false, code:'influx_unreachable' }`.
- Erfolg → `200 { success:true, data:{ metric, range, points:[{ time, value, …tags }] } }`.

**SQL (DataFusion, via `InfluxService.queryHistory()`)**
```sql
SELECT time, value, name, state
FROM paths_inbound_bytes
WHERE time >= now() - INTERVAL '1 hour'
  AND name = 'cam1'
ORDER BY time DESC
LIMIT 1000;
```

**SQL-Injection-Schutz**
- `metric` + Tag-Keys als **Identifier** validieren (`/^[a-zA-Z_][a-zA-Z0-9_]*$/`).
- Tag-Values **escapen** (`'` → `''`).
- `range` → `INTERVAL`-Mapping (Whitelist). Keine freie SQL-Konkatenation.

**Neue Methode `InfluxService.queryHistory(params)`** (in `server/src/InfluxService.js`)
```js
async queryHistory({ metric, range = '1h', limit = 1000, tags = {} }) {
    if (!this.client) throw new Error('InfluxService not initialized');
    const sql = InfluxService.buildHistorySql(metric, range, limit, tags); // pure, testbar
    const result = await this.client.query(sql, this.config.influxDatabase);
    const points = [];
    for await (const row of result) points.push(row);
    return points;
}
```

**Router:** `MetricsRouter` bekommt `influxService` + Route `GET /api/metrics/history` (alternativ neuer `MetricsHistoryRouter`).

#### B.11.2 Settings-UI (frontend)

**Ziel:** Influx-Keys in der Settings-Seite editierbar (Runtime-Toggle ohne Restart).

**Änderungen**
- `frontend/src/components/forms/fieldCatalog.js` → `SERVER_SETTINGS_CATALOG` um 5 Felder erweitern (Gruppe `Influx`):
  - `influxEnabled` (toggle)
  - `influxHost` (text)
  - `influxToken` (password, maskiert wie `mediamtxAuthToken`)
  - `influxDatabase` (text)
  - `influxPollIntervalMs` (number, min 1000)
- `frontend/src/locales/{en,de,it}.json` → neue i18n-Keys (Labels + Beschreibungen).
- `frontend/src/components/pages/Settings.jsx` → **keine JSX-Änderung nötig** (FormBuilder rendert den Katalog).
- `server/src/Config.js` → Token-Regel für `influxToken` (wie `mediamtxAuthToken`, §B.5).

> **Hinweis:** Die Settings-UI ist **aufbaukostenlos** — `FormBuilder` + `SERVER_SETTINGS_CATALOG` + `getSettings()`/`updateSettings()` decken das ab. Nur Katalog + i18n + Token-Regel ergänzen.

#### B.11.3 Historie-UI (frontend)

**Ziel:** Einfache Historie-Ansicht (1 Metrik + Zeitfenster) in der UI.

- **v1 (empfohlen, dependency-frei):** Neue Sektion in `Metrics.jsx` — Metrik-Picker + Range-Picker + `DataTable` (Zeit, Wert, Tags). Reused: `DataTable`, `useQuery`, `localApi`.
- **v1.1 (optional):** `recharts`-Line-Chart (neue Dependency) für die Zeitreihe.

**Neu**
- `frontend/src/hooks/useMetricsHistory.js` (useQuery + `localApi.get('/api/metrics/history', params)`)
- `frontend/src/services/queryKeys.js` → `metricsHistory: (metric, range) => ['metrics', 'history', metric, range]`
- `frontend/src/components/metrics/HistoryPanel.jsx` (Metrik- + Range-Picker + Tabelle/Chart)
- `frontend/src/locales/{en,de,it}.json` → neue i18n-Keys.

> **Abhängigkeit:** Historie-UI zeigt nur Daten, wenn `influxEnabled=true` + Poller läuft. Sonst: Hinweis „Influx-Historie nicht aktiviert" (503 → `ErrorAlert`).

---

### B.12 Docker Compose (`compose-influx.yml`, neu)

```yaml
services:
  influxdb3:
    image: influxdb:3-core          # Version pinnen, z. B. influxdb:3.12.0-core
    container_name: influxdb3
    restart: unless-stopped
    command:
      - influxdb3
      - serve
      - --node-id=node0
      - --object-store=file
      - --data-dir=/var/lib/influxdb3/data
    environment:
      - INFLUXDB3_AUTH_TOKEN=${INFLUXDB3_AUTH_TOKEN}
    ports:
      - "${INFLUX_HTTP_PORT:-8181}:8181"
      - "${INFLUX_FLIGHT_PORT:-8086}:8086"
    volumes:
      - ./data/influxdb3:/var/lib/influxdb3/data
    networks:
      - mediamtx

networks:
  mediamtx:
    external: false
    name: "mediamtx"
```

**Anmerkungen**
- **Netzwerk:** `mediamtx` (bestehend) → `mediamtx-ui` erreicht Influx via `http://influxdb3:8181`.
- **Auth:** Preconfigured Admin-Token via `INFLUXDB3_AUTH_TOKEN` (empfohlen). Für Dev: `INFLUXDB3_WITHOUT_AUTH=true` (dann `INFLUX_TOKEN` leer lassen).
- **Persistenz:** `./data/influxdb3` (Volume).
- **Ports:** `8181` (HTTP, für UI/Server + Admin), `8086` (Flight SQL, für Client-Libs). `9090`/`8090` (Prometheus) optional.
- **Start:** `docker compose -f compose-dev.yml -f compose-mediamtx.yml -f compose-influx.yml up`.

**`.env.default` (ergänzen)**
```
# InfluxDB 3 (optional — Metriken-Historie)
INFLUX_ENABLED=false
INFLUX_HOST=http://influxdb3:8181
INFLUX_TOKEN=
INFLUX_DATABASE=mediamtx
INFLUX_POLL_INTERVAL_MS=15000
INFLUXDB3_AUTH_TOKEN=
INFLUX_HTTP_PORT=8181
INFLUX_FLIGHT_PORT=8086
```

**`compose.yml` / `compose-dev.yml` (mediamtx-ui-Service, ergänzen)**
```yaml
    environment:
      # … bestehende …
      - INFLUX_ENABLED=${INFLUX_ENABLED:-false}
      - INFLUX_HOST=${INFLUX_HOST:-http://influxdb3:8181}
      - INFLUX_TOKEN=${INFLUX_TOKEN:-}
      - INFLUX_DATABASE=${INFLUX_DATABASE:-mediamtx}
      - INFLUX_POLL_INTERVAL_MS=${INFLUX_POLL_INTERVAL_MS:-15000}
```

---

### B.13 Tests (Server)

**`server/test/InfluxService.test.js` (neu)**
- `toLineProtocol`: gültige Serie → korrekte Zeilen; Escaping (`,` `=` ` ` in Tag-Value + Measurement); leere Serie → `[]`; float-Werte.
- `escapeTagValue` / `escapeMeasurement`: Sonderzeichen.
- `ensureDatabase`: Mock-Server (201 erstellt, 409 exists) → OK; Netzwerk-Fehler → throw.
- `writeLines`: Mock-Client → `client.write` aufgerufen mit `useV2Api:false`; leere Zeilen → no-op.

**`server/test/MetricsCollector.test.js` (neu)**
- `start()`/`stop()`: idempotent; `running`-Flag.
- `pollOnce()`: Mock `fetchMetricsText` + Mock `writeLines` → korrekte Reihenfolge; Fehler → throw.
- `tick()`: Fehler → `consecutiveErrors` inkrementiert, `schedule()` trotzdem aufgerufen.
- `applyConfig()`: enabled→start, disabled→stop+close, change→restart.
- **Fake-Timer** (Vitest `vi.useFakeTimers()`) für Intervall-Verhalten.

**`server/test/mock-influx.js` (neu)**
- `POST /api/v3/configure/database` → 201/409.
- `POST /api/v3/write_lp` → 204 (Body loggen für Assertions).
- `GET /health` → 200.
- `?mockError=500` → HTTP 500 (Fehlerpfad).

**`server/test/Config.test.js` (erweitern)**
- 5 neue Keys in Defaults / Validation / Update / persist.
- Token-Masking (`influxToken`).

**`server/test/MetricsService.test.js` (erweitern)**
- `fetchMetricsText()`: Mock-Server (200) → Text; Fehler (500) → throw mit `code`; Timeout → `upstream_timeout`.
- `fetchSnapshot()` bleibt grün (Refactor-Regression).

> **Muster:** `server/test/SettingsRouter.test.js`, `server/test/LogTailService.test.js`.

---

### B.14 Phasen & Schritte

> Reihenfolge: **Config → InfluxService → Collector → Verdrahtung → Compose → Tests → UI (Settings + Historie) → Abnahme.** Jeder Schritt verifizierbar.

**Phase 1 — Server (Kern)**
1. **Config-Keys** (5 neue) in `Config.js` (defaults, runtimeKeys, constructor, buildDefaults, getSettings, validate, update, persist). → `Config.test.js` erweitern.
2. **`InfluxService`** (neu): `init`, `ensureDatabase`, `writeLines`, `close`, pure `toLineProtocol`/`escape*`. → Unit-Tests.
3. **`MetricsService`-Refactor:** `fetchMetricsText()` extrahieren. → `MetricsService.test.js` erweitern (bestehende Tests grün).
4. **`MetricsCollector`** (neu): `start`/`stop`/`tick`/`pollOnce`/`applyConfig`. → Unit-Tests (Fake-Timer).
5. **Verdrahtung:** `Router/index.js` (Instanz + start + Applier), `Server.js` (Shutdown). → Smoke-Test.
6. **Dependency:** `@influxdata/influxdb3-client` in `server/package.json` + `npm install`.

**Phase 2 — Docker & Betrieb**
7. **`compose-influx.yml`** (neu).
8. **`.env.default`** (neue Env-Keys).
9. **`compose.yml` / `compose-dev.yml`** (INFLUX_*-Env an mediamtx-ui).
10. **E2E-Smoke:** Stack starten, `INFLUX_ENABLED=true`, Poller schreibt, `influxdb3 query` zeigt Daten.

**Phase 3 — UI (Settings + Historie)**
11. **Settings-UI:** Influx-Keys in `SERVER_SETTINGS_CATALOG` + i18n + Token-Regel (§B.11.2).
12. **Query-Endpunkt:** `InfluxService.queryHistory()` + `GET /api/metrics/history` (§B.11.1).
13. **Historie-UI:** `useMetricsHistory` + `HistoryPanel` + i18n (§B.11.3).

**Phase 4 — Abnahme**
14. **Build + Tests** grün (server + frontend).
15. **Doku:** `README.md` / `FEATURES.md` ergänzen (optional).

---

### B.15 Risiken & offene Fragen

| # | Risiko / Frage | Impact | Mitigation |
|---|---|---|---|
| R1 | `metrics: false` in `mediamtx.yml` | Poller liefert keine Daten | Vor Abnahme `metrics: yes` setzen (Config-Formular oder YAML). |
| R2 | InfluxDB-Port 8181 nicht erreichbar (Netzwerk) | Kein Write | `influxHost` konfigurierbar; Docker-Netz `mediamtx` nutzen (`http://influxdb3:8181`). |
| R3 | Influx-Token fehlt/falsch | 401/403 | `influxToken` in Settings; `INFLUXDB3_AUTH_TOKEN` im Compose. |
| R4 | Datenbank existiert nicht | Write schlägt fehl | `ensureDatabase()` beim Start (idempotent). |
| R5 | Poll-Intervall zu klein | Last auf MediaMTX + Influx | `influxPollIntervalMs` konfigurierbar (Default 15 s, min 1 s). |
| R6 | MediaMTX liefert viele SRT-Metriken (~40) | Große Write-Batches | Batch-Write ist effizient; InfluxDB 3 Core skaliert. Optional: `type=`-Filter. |
| R7 | `useV2Api` falsch gesetzt | Write schlägt fehl | `useV2Api: false` hartkodet (InfluxDB 3 Core). |
| R8 | Mehrere UI-Instanzen | Doppelte Writes | Akzeptabel (eine Instanz); optional: Leader-Election (v2). |
| R9 | InfluxDB-Image `latest` ändert sich | Unerwartete Upgrades | Version pinnen (`influxdb:3.12.0-core`). |
| R10 | Token in `.env` | Secret-Leak | `.env.default` nur Platzhalter; echtes Token in `.env` (git-ignored). |

---

### B.16 Abnahmekriterien (gesamt)

- [ ] `INFLUX_ENABLED=true` → Poller startet, schreibt zyklisch (Intervall einhaltbar).
- [ ] InfluxDB 3 Core: Daten sichtbar (`influxdb3 query` / SQL).
- [ ] Mapping korrekt: Measurement = Metrikname, Tags = Labels, Field = `value`, Timestamp = ns.
- [ ] `ensureDatabase()` idempotent (Start mit/ohne existierende DB).
- [ ] Fehlerbehandlung: Upstream-Fehler → log + weiterlaufen (kein Crash).
- [ ] Shutdown: Poller stoppt, Influx-Client schließt (kein hängender Prozess).
- [ ] `INFLUX_ENABLED=false` (Default) → kein Poller, bestehendes Verhalten unverändert.
- [ ] Settings-Applier: Runtime-Toggle (an/aus) ohne Restart.
- [ ] Settings-UI: Influx-Keys editierbar, Runtime-Toggle wirkt ohne Restart.
- [ ] Query-Endpunkt: `GET /api/metrics/history` liefert Punkte (200) / `influx_disabled` (503) / `invalid_metric` (400).
- [ ] Historie-UI: Metrik + Range wählbar, Punkte sichtbar (Tabelle/Chart).
- [ ] SQL-Injection-Schutz: `metric`/Tag-Keys validiert, Tag-Values escaped.
- [ ] Tests (InfluxService, Collector, Config, MetricsService-Refactor) grün.
- [ ] `npm test` (server) + `npm test` (frontend) grün.
- [ ] Docker-Stack startet sauber (`compose-influx.yml` + bestehende).
- [ ] Kein Secret im Repo (`.env.default` nur Platzhalter).

---

### B.17 Betroffene Dateien (Übersicht)

**Neu (server):**
- `server/src/InfluxService.js`
- `server/src/MetricsCollector.js`
- `server/test/InfluxService.test.js`
- `server/test/MetricsCollector.test.js`
- `server/test/mock-influx.js`

**Geändert (server):**
- `server/package.json` (+ `@influxdata/influxdb3-client`)
- `server/src/Config.js` (5 neue Keys)
- `server/src/MetricsService.js` (`fetchMetricsText()` extrahieren)
- `server/src/Router/index.js` (Verdrahtung + Applier)
- `server/src/Router/MetricsRouter.js` (Route `GET /api/metrics/history`)
- `server/src/Server.js` (Shutdown)
- `server/test/Config.test.js` (neue Keys)
- `server/test/MetricsService.test.js` (`fetchMetricsText`)

**Neu (root):**
- `compose-influx.yml`

**Neu (frontend):**
- `frontend/src/hooks/useMetricsHistory.js`
- `frontend/src/components/metrics/HistoryPanel.jsx`

**Geändert (frontend):**
- `frontend/src/components/forms/fieldCatalog.js` (`SERVER_SETTINGS_CATALOG` + 5 Influx-Felder)
- `frontend/src/services/queryKeys.js` (`metricsHistory`)
- `frontend/src/locales/en.json` (Influx-Labels + Historie)
- `frontend/src/locales/de.json` (Influx-Labels + Historie)
- `frontend/src/locales/it.json` (Influx-Labels + Historie)

**Geändert (root):**
- `.env.default` (INFLUX_*-Keys)
- `compose.yml` (INFLUX_*-Env an mediamtx-ui)
- `compose-dev.yml` (INFLUX_*-Env an mediamtx-ui)

**Konfiguration (Betrieb):**
- `mediamtx/mediamtx.yml`: `metrics: yes` (vor Abnahme).
- `.env`: `INFLUX_ENABLED=true`, `INFLUX_TOKEN=…`, `INFLUXDB3_AUTH_TOKEN=…`.

---

## TEIL C — ENTSCHEIDUNGEN

> **Stand:** 2026-10-29 — Entscheidungen 4 & 5 auf **ja** gekippt (v1-Scope, §B.11).

1. **InfluxDB-Version pinnen?** Empfehlung: `influxdb:3.12.0-core` (aktuell). Alternativ `influxdb:3-core` (latest).
2. **Auth an/aus?** Empfehlung: **an** (`INFLUXDB3_AUTH_TOKEN` + `INFLUX_TOKEN`). Dev-Alternative: `INFLUXDB3_WITHOUT_AUTH=true`.
3. **Poll-Intervall Default?** Empfehlung: **15 s** (Balance aus Last + Frische).
4. **Settings-UI für Influx-Keys?** ✅ **ja** (v1). Influx-Keys in `SERVER_SETTINGS_CATALOG` + i18n + Token-Regel. Runtime-Toggle ohne Restart (§B.11.2).
5. **Query-Endpunkt in der UI?** ✅ **ja** (v1). `GET /api/metrics/history` + einfache Historie-Ansicht (Metrik + Range, Tabelle; optional `recharts`-Chart in v1.1) (§B.11.1, §B.11.3).
