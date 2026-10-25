# Konzept: LOG MONITOR — Live-Ansicht der MediaMTX-Logs (tail -f + WebSocket)

> **Stand:** 2026-10-25 — Konzept, noch nicht implementiert.
> - Frontend-Grundlagen: siehe `INITIAL_FRONTEND.md`
> - Server-Grundlagen: siehe `INITIAL_SERVER.md`
> - Doku-Stil-Vorbild: `PLAN_TOOLS.md`, `PLAN_RECORDS_PLAYER.md`
>
> **Ziel:** Neuer Bereich **„Logs"** links im Menü, unter **Runtime**, um die MediaMTX-Logs **live** anzuzeigen.
> - **Log-Datei:** `/data/mediamtx/mediamtx.log` (Pfad im *MediaMTX*-Container). Im *UI*-Container liegt dieselbe Datei unter `/app/data/mediamtx/mediamtx.log` (gemeinsames Host-Volume `./data`). Sie wird permanent (append-only) von MediaMTX neu geschrieben.
> - **Server:** Spawnt **ein** permanentes Child-Process `tail -n 500 -f <logfile>`. Die stdout-Ausgabe wird geparst und an alle verbundenen Clients **per WebSocket** weitergereicht.
> - **WebSocket-Server:** Hängt am bestehenden HTTP-Server (Port `SERVER_PORT` = 3000), Endpunkt **`/logs`**. Öffentlich erreichbar über den Reverse-Proxy auf **Port 80** (`VIRTUAL_HOST=stream.home`) → `ws://stream.home/logs`.
> - **Frontend:** Terminal-artiger Log-Viewer (Level-Farben, Level-Filter, Textsuche, Pause, Auto-Scroll, begrenzter Puffer). Verbindet sich per WebSocket an `/logs` und rendert eingehende Zeilen.
>
> **Kernprinzip:** **Ein** `tail -f`-Prozess (gemeinsam für alle Clients) liefert die Zeilen-Stream. Der **WebSocket** pusht jede Zeile in Echtzeit an die Frontend-Clients. **Kein Polling**, **kein Byte-Offset-Bookkeeping**, **keine** Datei-Lese-Logik im Request-Pfad. Neue Dependency (Server): `ws`.

---

## 1. Ist-Zustand (Relevanz für das Konzept)

| Fakt | Detail |
|------|--------|
| Log-Datei (MediaMTX-Container) | `/data/mediamtx/mediamtx.log` — `compose-mediamtx.yml`: `./data:/data`. `mediamtx.yml`: `logDestinations: [stdout, file]`, `logFile: /data/mediamtx/mediamtx.log`, `logLevel: info`, `logStructured: false`. |
| Log-Datei (UI-Container) | **Gleiches Host-Volume** `./data`. `compose-dev.yml`/`compose.yml`: `./:/app` → Datei liegt unter **`/app/data/mediamtx/mediamtx.log`**. Relativ zum Server-CWD (`/app/server`): `../data/mediamtx/mediamtx.log`. |
| Log-Format | `JJJJ/MM/TT HH:MM:SS LEVEL [component] [context] message` — z. B. `2026-10-24 23:58:12 INF [HLS] [session f1e17dfe] created by 172.18.0.1:44640`. Levels: `DBG`, `INF`, `WRN`, `ERR` (ggf. `FTL`). |
| `tail`-Verfügbarkeit | UI-Container = `node:22-alpine`. **`tail` vorhanden** (busybox, `/usr/bin/tail`). → `tail -f` als Child-Process ist machbar. |
| Server-HTTP | `Server.js`: `createHttpServer(this.app)` + `listen(config.serverPort)`. **`httpServer`-Instanz existiert** → WebSocket kann direkt daran hängen (`ws`-Lib, `upgrade`-Event). |
| Server-Router | `Router/index.js`: `/health` → `SettingsRouter` → `MediaMTXBridge` (`/v3`) → `FrontendRouter` (Catch-all, **muss zuletzt**). |
| Server-Endpunkt-Muster | `SettingsRouter.js`: Klasse mit `router`, Handler, Antwort `{ success: true, data }` / `{ success: false, error, code }`. |
| Config | `Config.js`: Defaults + `runtimeKeys`/`restartKeys`, Env-Override, `config.json`-Persistenz. Muster `mediamtxConfigPath` (Default `''`, via `MEDIAMTX_CONFIG_PATH` gesetzt). |
| Frontend-API | `api/client.js`: `api` (MediaMTX via Bridge, Base `/v3`) **und** `localApi` (Server-eigene Endpunkte, Base `''`). |
| Navigation | `navItems.js` → `NAV_SECTIONS`. Sektion **`nav.runtime`** (HLS, RTSP, RTMP, SRT, WebRTC, MoQ). `Sidebar.jsx` rendert 1:1. Labels als i18n-Keys. |
| Routing | `App.jsx`: alle Routen unter `<Route element={<Layout />}>`. |
| Seiten-Muster | `components/pages/*.jsx`: `<div className="page">` + `page__header` (`page__title` + `page__subtitle`). |
| Styling | **Plain CSS**, BEM, CSS-Variablen in `style/variables.css` (`--font-mono` vorhanden), Komponenten-CSS in `style/components/*.css` (Import über `index.css`). Kein Tailwind. |
| i18n | `locales/{en,de,it}.json`, Top-Keys: `common`, `nav`, `topbar`, `dashboard`, `pages`, … |
| UI-Bausteine | `Button`, `Badge`, `Input`, `Spinner`, `ErrorAlert`, `Toggle` in `components/ui/`. |
| Server-Tests | `vitest` (`npm test`), Muster `test/SettingsRouter.test.js`: Express-App + `listen(0)` + `fetch`. |
| Reverse-Proxy | `.env`: `VIRTUAL_HOST=stream.home` (Traefik). Öffentlich **Port 80/443** → Container-Port `SERVER_PORT` (3000). WebSocket-Upgrade wird vom Proxy weitergeleitet. |
| Server-Dependencies | `axios`, `express`, `yaml`. **`ws` NICHT vorhanden** → muss neu hinzugefügt werden. |

**Fazit:** Feature = **Server** (tail-Child-Process + WebSocket-Server) + **Frontend** (WebSocket-Client + Logs-Seite). Der Server ist die **einzige** Stelle, die die Log-Datei liest (via `tail`). Das Frontend konsumiert den WebSocket-Stream.

---

## 2. Architektur

```
┌──────────────────────────────────────────────────────────────────────┐
│  BROWSER (Frontend)                                                  │
│                                                                      │
│  pages/Logs.jsx          ← Seite (Header, Filter, Suche, Pause)      │
│     └─ logs/LogViewer.jsx ← Terminal-View (Zeilen, Auto-Scroll)      │
│     └─ hooks/useLogStream.js ← WebSocket-Client (connect, reconnect) │
│                                                                      │
│  WebSocket:  ws://stream.home/logs   (Port 80, via Reverse-Proxy)    │
└──────────────────────────────────────────────────────────────────────┘
        │  WebSocket (JSON: { type: 'history'|'line', data })
        │  Upgrade-Header wird vom Proxy an Port 3000 weitergeleitet
┌──────────────────────────────────────────────────────────────────────┐
│  UI-SERVER (Node.js, Port SERVER_PORT = 3000)                        │
│                                                                      │
│  Server.js:  httpServer (existiert)                                  │
│     └─ LogsWebSocket.js  ← WebSocketServer { server, path: '/logs' } │
│            └─ on('connection') → History senden + subscribe          │
│                                                                      │
│  LogTailService.js  ← EIN Child-Process, permanent                   │
│     └─ spawn('tail', ['-n','500','-f', logPath])                     │
│        ├─ stdout → parseLine() → Ring-Buffer + broadcast()           │
│        ├─ exit   → Auto-Restart (2 s)                                │
│        └─ stop() → SIGTERM (beim Server-Shutdown)                    │
│                                                                      │
│  Router/index.js:  /health → Settings → TOOLS? → Bridge → Frontend   │
│                    + LogTailService.start() + LogsWebSocket.init()   │
└──────────────────────────────────────────────────────────────────────┘
        │  tail -f liest (append-only)
┌──────────────────────────────────────────────────────────────────────┐
│  LOG-DATEI (gemeinsames Host-Volume ./data)                          │
│  /app/data/mediamtx/mediamtx.log   (= /data/mediamtx/mediamtx.log)   │
│  ← wird permanent von MEDIAMTX (anderer Container) geschrieben       │
└──────────────────────────────────────────────────────────────────────┘
```

**Kernentscheidungen:**

1. **Ein `tail -f`-Child-Process, gemeinsam für alle Clients.** `tail` ist für genau diesen Fall gebaut (follow + Rotation/Truncation-Handling). Ein Prozess liest die Datei, der Server broadcastet an alle WebSocket-Clients. Kein Polling, kein Byte-Offset.
2. **WebSocket am bestehenden HTTP-Server.** Die `ws`-Lib hängt an `httpServer` (Port 3000), Endpunkt `/logs`. **Kein** separater Port/Prozess. Öffentlich via Reverse-Proxy auf **Port 80** (`ws://stream.home/logs`).
3. **Server parst die Zeilen** (`ts`, `level`, `message`, `raw`) und hält einen **Ring-Buffer** (letzte N Zeilen). Neue Clients bekommen auf Connect zuerst die History, dann den Live-Stream.
4. **Frontend = schlanker WebSocket-Client.** `useLogStream`-Hook: connect, auto-reconnect, Puffer (max. N Zeilen), `connected`-Status. Die Seite rendert + filtert (Level, Suche) **client-seitig**.
5. **Neue Dependency (nur Server):** `ws` (WebSocket-Server). Frontend nutzt das native `WebSocket`-API (keine Dependency).
6. **Log-Pfad konfigurierbar** (`mediamtxLogPath` / `MEDIAMTX_LOG_PATH`), Default leer = Feature aus. Analog zu `mediamtxConfigPath`.

---

## 3. Server: `LogTailService` (tail -f Child-Process)

### 3.1 Aufgabe

- Spawnt **ein** `tail -n 500 -f <logPath>`-Prozess (permanent, für die Server-Laufzeit).
- Liest `stdout`, puffert unvollständige Zeilen (Chunk-Grenzen), parst vollständige Zeilen.
- Hält einen **Ring-Buffer** (letzte `maxBuffer` Zeilen) für die History neuer Clients.
- **Broadcastet** jede Zeile an alle abonnierten Listener (WebSocket-Clients).
- **Auto-Restart** bei `exit` (Crash/Rotation), mit kurzer Verzögerung.
- **Clean Shutdown** (`SIGTERM`) beim Server-Stop.

### 3.2 `LogTailService.js` (NEU)

```js
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

// MediaMTX-Zeile: "JJJJ/MM/TT HH:MM:SS LEVEL message"
const LINE_RE = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})\s+(DBG|INF|WRN|ERR|FTL)\s+([\s\S]*)$/;

/**
 * Verwaltet EINEN permanenten `tail -f`-Prozess auf der MediaMTX-Log-Datei.
 * Parst stdout, hält einen Ring-Buffer (History) und broadcastet an Listener.
 */
class LogTailService {
    /**
     * @param {object} config
     * @param {Logger} [logger]
     * @param {{ maxBuffer?: number, restartDelayMs?: number }} [opts]
     */
    constructor(config, logger, { maxBuffer = 1000, restartDelayMs = 2000 } = {}) {
        this.config = config;
        this.label = '[LogTailService]';
        this.logger = logger || { log: () => {}, error: () => {} };
        this.maxBuffer = maxBuffer;
        this.restartDelayMs = restartDelayMs;

        this.proc = null;
        this.buffer = [];          // Ring-Buffer: letzte maxBuffer Zeilen (History)
        this.listeners = new Set(); // (line) => void  — WebSocket-Clients
        this.partial = '';          // unvollständige Zeile (Chunk-Grenze)
        this.stopped = false;
        this.restartTimer = null;
    }

    /** Log-Pfad (relativ zum CWD) oder null, wenn nicht konfiguriert. */
    resolveLogPath() {
        const p = this.config?.mediamtxLogPath;
        return p ? resolve(p) : null;
    }

    /** Startet den tail-Prozess (no-op, wenn kein Pfad konfiguriert). */
    start() {
        const logPath = this.resolveLogPath();
        if (!logPath) {
            this.logger.log(this.label, 'mediamtxLogPath nicht gesetzt — Log-Tail deaktiviert');
            return;
        }
        this.stopped = false;
        this.spawnTail(logPath, /* withHistory */ true);
    }

    /** Spawnt `tail -n 500 -f` (mit History) bzw. `tail -f` (Restart, ohne History). */
    spawnTail(logPath, withHistory) {
        const args = withHistory ? ['-n', '500', '-f', logPath] : ['-f', logPath];
        this.proc = spawn('tail', args, { stdio: ['ignore', 'pipe', 'pipe'] });
        this.proc.stdout.setEncoding('utf8');
        this.proc.stdout.on('data', (chunk) => this.handleData(chunk));
        this.proc.stderr.on('data', (chunk) => {
            const msg = chunk.toString().trim();
            if (msg) this.logger.error(this.label, `tail stderr: ${msg}`);
        });
        this.proc.on('error', (err) => {
            this.logger.error(this.label, `tail spawn error: ${err.message}`);
        });
        this.proc.on('exit', (code, signal) => {
            this.logger.log(this.label, `tail exited (code=${code}, signal=${signal})`);
            if (!this.stopped) {
                this.logger.log(this.label, `tail-Neustart in ${this.restartDelayMs} ms`);
                this.restartTimer = setTimeout(() => this.spawnTail(logPath, false), this.restartDelayMs);
            }
        });
        this.logger.log(this.label, `tail gestartet: tail ${args.join(' ')}`);
    }

    /** stdout-Chunk → Zeilen splitten (partial puffern) → parse → buffer + broadcast. */
    handleData(chunk) {
        this.partial += chunk;
        const parts = this.partial.split('\n');
        this.partial = parts.pop(); // letztes (ggf. unvollständiges) Stück behalten
        for (const raw of parts) {
            if (raw === '') continue;
            const line = parseLine(raw, this.lastParsed);
            this.push(line);
        }
    }

    /** Zeile in den Ring-Buffer legen + an alle Listener broadcasten. */
    push(line) {
        this.buffer.push(line);
        if (this.buffer.length > this.maxBuffer) this.buffer.shift();
        this.lastParsed = line;
        for (const listener of this.listeners) {
            try {
                listener(line);
            } catch (err) {
                this.logger.error(this.label, `broadcast fehlgeschlagen: ${err.message}`);
            }
        }
    }

    /** History (Kopie des Ring-Buffers) für neue Clients. */
    getHistory() {
        return this.buffer.slice();
    }

    /** Listener abonnieren. Gibt eine Unsubscribe-Funktion zurück. */
    addListener(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    /** tail-Prozess stoppen (beim Server-Shutdown). */
    stop() {
        this.stopped = true;
        if (this.restartTimer) clearTimeout(this.restartTimer);
        if (this.proc) {
            this.proc.kill('SIGTERM');
            this.proc = null;
        }
        this.listeners.clear();
    }
}

/**
 * Parst eine MediaMTX-Logzeile.
 * @returns {{ ts: string|null, level: string|null, message: string, raw: string }}
 */
function parseLine(raw, prev) {
    const m = LINE_RE.exec(raw);
    if (m) {
        return { ts: m[1], level: m[2], message: m[3], raw };
    }
    // Kein Match → Fortsetzung einer Mehrzeilen-Nachricht (Stacktrace, dumpPackets …).
    if (prev) {
        return { ts: prev.ts, level: prev.level, message: `${prev.message}\n${raw}`, raw: `${prev.raw}\n${raw}` };
    }
    return { ts: null, level: null, message: raw, raw };
}

export { LogTailService };
```

**Anmerkungen:**
- **`tail -n 500 -f`** (erster Start): liefert die letzten 500 Zeilen als History + folgt dann. **`tail -f`** (Restart): nur folgen, **keine** History-Duplikate.
- **Partial-Puffering:** `tail`/Pipe kann eine Zeile über zwei `data`-Chunks teilen → `this.partial` hält das unvollständige Stück bis das nächste `\n` kommt.
- **Mehrzeilen:** Zeilen ohne Level-Match werden an die vorherige Zeile angehängt (robust gegen Stacktraces / `dumpPackets`).
- **Rotation/Truncation:** `tail -f` erkennt Datei-Ersatz/Truncation selbst und folgt weiter (kein Offset-Handling nötig).

---

## 4. Server: WebSocket-Server (`/logs`)

### 4.1 Aufgabe

- Hängt am bestehenden `httpServer` (Port `SERVER_PORT`), Endpunkt **`/logs`**.
- Bei `connection`: **History** senden (Ring-Buffer), dann auf neue Zeilen **subscribe**.
- Bei `close`/`error`: unsubscribe.
- Message-Protokoll (JSON):
  - Server → Client: `{ type: 'history', data: [line, …] }` (einmalig, auf Connect) und `{ type: 'line', data: line }` (pro neuer Zeile).
  - `line` = `{ ts, level, message, raw }`.

### 4.2 `LogsWebSocket.js` (NEU)

```js
import { WebSocketServer } from 'ws';

/**
 * WebSocket-Server für den Live-Log-Stream.
 * Hängt am bestehenden HTTP-Server, Endpunkt /logs.
 */
class LogsWebSocket {
    /**
     * @param {import('node:http').Server} httpServer
     * @param {LogTailService} tailService
     * @param {Logger} [logger]
     */
    constructor(httpServer, tailService, logger) {
        this.label = '[LogsWebSocket]';
        this.logger = logger || { log: () => {}, error: () => {} };
        this.tailService = tailService;
        this.wss = new WebSocketServer({ server: httpServer, path: '/logs' });
        this.wss.on('connection', (ws) => this.onConnection(ws));
        this.wss.on('error', (err) => this.logger.error(this.label, `wss error: ${err.message}`));
    }

    onConnection(ws) {
        this.logger.log(this.label, `Client verbunden (${this.wss.clients.size} aktiv)`);

        // 1) History senden (Ring-Buffer des tail-Service).
        const history = this.tailService.getHistory();
        ws.send(JSON.stringify({ type: 'history', data: history }));

        // 2) Auf neue Zeilen subscribe.
        const unsubscribe = this.tailService.addListener((line) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'line', data: line }));
            }
        });

        const cleanup = () => {
            unsubscribe();
            this.logger.log(this.label, `Client getrennt (${this.wss.clients.size} aktiv)`);
        };
        ws.on('close', cleanup);
        ws.on('error', cleanup);
    }
}

export { LogsWebSocket };
```

**Anmerkungen:**
- **`ws`-Lib** (neue Server-Dependency): `new WebSocketServer({ server: httpServer, path: '/logs' })` — nutzt das bestehende `upgrade`-Event des HTTP-Servers. **Kein** separater Port.
- **Broadcast-Modell:** Ein `tail`-Prozess, N Clients. Jeder Client bekommt History + Live-Stream.
- **Backpressure:** Für normale Log-Raten (MediaMTX) unkritisch. Bei sehr hohem Volumen später optional: `ws.bufferedAmount` prüfen / Throttling. (Backlog, s. §10.)

---

## 5. Server: Verdrahtung + Config

### 5.1 `Config.js` (ÄNDERN)

Neues Feld `mediamtxLogPath` (analog `mediamtxConfigPath`):

- `static defaults`: `mediamtxLogPath: ''`
- `runtimeKeys`: += `'mediamtxLogPath'` (läuft ohne Restart an)
- Constructor: `this.mediamtxLogPath = env.MEDIAMTX_LOG_PATH || this.defaults.mediamtxLogPath || '';`
- `buildDefaults()`: += `mediamtxLogPath: this.env.MEDIAMTX_LOG_PATH || ''`
- `validateSettings()`: `typeof s.mediamtxLogPath !== 'string'` → Fehler (falls in Settings-UI exponiert, s. §5.4)
- `updateSettings()` / `persist()`: Feld mitnehmen (falls in Settings-UI exponiert)

> **Scope-Entscheidung:** `mediamtxLogPath` wird per **Env** (`MEDIAMTX_LOG_PATH`) + `config.json` gesetzt. In die **Settings-UI** (`getSettings()`) kommt es **erstmal nicht** (vermeidet Scope-Creep). Optionaler Backlog-Punkt (§10).

### 5.2 `Router/index.js` (ÄNDERN)

`LogTailService` + `LogsWebSocket` instanziieren und starten (nach `httpServer`-Existenz, vor/parallel zu den Routen):

```js
// in define():
// Log-Tail + WebSocket (braucht httpServer + config.mediamtxLogPath)
this.tailService = new LogTailService(this.config, this.logger);
this.logsWs = new LogsWebSocket(this.httpServer, this.tailService, this.logger);
this.tailService.start(); // no-op, wenn mediamtxLogPath leer
```

> Reihenfolge: `httpServer` existiert bereits (aus `Server.js`). `tailService.start()` kann direkt nach der Konstruktion laufen. Die Express-Routen bleiben unverändert (WebSocket ist **kein** Express-Route, sondern hängt am `httpServer`).

### 5.3 `Server.js` (ÄNDERN)

Beim Shutdown den tail-Prozess sauber beenden:

```js
const shutdown = async () => {
    this.logger.log(this.label, 'Shutting down...');
    this.router?.tailService?.stop();   // tail-Child-Process SIGTERM
    this.httpServer.close(() => process.exit(0));
};
```

### 5.4 `.env` / `.env.default` / `compose-*.yml` (ÄNDERN)

Pfad setzen (relativ zum Server-CWD `/app/server` → `/app/data/mediamtx/mediamtx.log`):

```bash
# .env / .env.default
# Pfad zur MediaMTX-Log-Datei (relativ zum Server-CWD). Leer = Log-Monitor aus.
MEDIAMTX_LOG_PATH=../data/mediamtx/mediamtx.log
```

```yaml
# compose-dev.yml + compose.yml (environment des mediamtx-ui-Services)
- MEDIAMTX_LOG_PATH=${MEDIAMTX_LOG_PATH:-../data/mediamtx/mediamtx.log}
```

> **Pfad-Hinweis:** Der User-Pfad `/data/mediamtx/mediamtx.log` gilt im *MediaMTX*-Container. Im *UI*-Container (wo `tail` läuft) ist es **`/app/data/mediamtx/mediamtx.log`** bzw. relativ `../data/mediamtx/mediamtx.log`.

### 5.5 `server/package.json` (ÄNDERN)

Neue Dependency (nur Server):

```json
"dependencies": {
    "axios": "^1.20.0",
    "express": "^5.3.0",
    "ws": "^8.18.0",
    "yaml": "^2.9.1"
}
```

---

## 6. Frontend: WebSocket-Client + Logs-Seite

### 6.1 `hooks/useLogStream.js` (NEU)

WebSocket-Client: connect, auto-reconnect, Puffer (max. N Zeilen), `connected`-Status.

```js
import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_LINES = 2000;
const RECONNECT_MS = 2000;

/**
 * WebSocket-Client für den Live-Log-Stream (/logs).
 * Liefert: lines (Puffer), connected, error, clear().
 */
export function useLogStream({ enabled = true } = {}) {
    const [lines, setLines] = useState([]);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!enabled) return;
        let closed = false;

        const append = (incoming) => {
            setLines((prev) => {
                const next = [...prev, ...incoming];
                return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
            });
        };

        function connect() {
            const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const ws = new WebSocket(`${proto}://${window.location.host}/logs`);
            wsRef.current = ws;

            ws.onopen = () => { setConnected(true); setError(null); };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'history') append(msg.data || []);
                    else if (msg.type === 'line') append([msg.data]);
                } catch { /* malformed → ignorieren */ }
            };

            ws.onclose = () => {
                setConnected(false);
                if (!closed) timerRef.current = setTimeout(connect, RECONNECT_MS);
            };

            ws.onerror = () => setError(new Error('WebSocket-Fehler'));
        }

        connect();

        return () => {
            closed = true;
            clearTimeout(timerRef.current);
            wsRef.current?.close();
        };
    }, [enabled]);

    const clear = useCallback(() => setLines([]), []);

    return { lines, connected, error, clear };
}
```

**Anmerkungen:**
- **URL:** `ws(s)://<host>/logs` — `window.location.host` nutzt die aktuelle Host:Port-Kombi (dev: `localhost:3000`, prod: `stream.home` Port 80/443). **Kein** harter Port.
- **Auto-Reconnect:** Bei `close` (nicht durch uns) nach 2 s neu verbinden.
- **Puffer:** max. `MAX_LINES` (2000), älteste werden verworfen.
- **Keine Dependency:** natives `WebSocket`-API.

### 6.2 `components/logs/LogViewer.jsx` (NEU)

Terminal-View: rendert Zeilen (Level-Farbe), Auto-Scroll, „Jump to latest".

```jsx
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown } from 'lucide-react';

export default function LogViewer({ lines, connected, error }) {
    const { t } = useTranslation();
    const scrollRef = useRef(null);
    const [atBottom, setAtBottom] = useState(true);

    // Auto-Scroll, wenn der User am Boden ist.
    useEffect(() => {
        if (atBottom && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lines, atBottom]);

    const onScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
    };

    const jumpToBottom = () => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
        setAtBottom(true);
    };

    if (error) return <div className="logviewer__state logviewer__state--error">{t('pages.logs.error')}</div>;
    if (lines.length === 0) return <div className="logviewer__state">{t('pages.logs.empty')}</div>;

    return (
        <div className="logviewer">
            <div className="logviewer__scroll" ref={scrollRef} onScroll={onScroll}>
                {lines.map((l, i) => (
                    <div key={i} className={`logviewer__line logviewer__line--${(l.level || 'raw').toLowerCase()}`}>
                        <span className="logviewer__ts">{l.ts || ''}</span>
                        <span className="logviewer__level">{l.level || '·'}</span>
                        <span className="logviewer__msg">{l.message}</span>
                    </div>
                ))}
            </div>
            {!atBottom && (
                <button type="button" className="logviewer__jump" onClick={jumpToBottom}>
                    <ArrowDown size={14} /> {t('pages.logs.jumpToLatest')}
                </button>
            )}
        </div>
    );
}
```

### 6.3 `components/pages/Logs.jsx` (NEU)

Seite: Header + Controls (Level-Filter, Suche, Pause, Clear, Status) + `LogViewer`.

```jsx
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, Play, Trash2 } from 'lucide-react';
import { useLogStream } from '../../hooks/useLogStream';
import LogViewer from '../logs/LogViewer';
import Button from '../ui/Button';
import Input from '../ui/Input';

const LEVELS = ['ERR', 'WRN', 'INF', 'DBG'];

export default function Logs() {
    const { t } = useTranslation();
    const { lines, connected, error, clear } = useLogStream();
    const [levelFilter, setLevelFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [paused, setPaused] = useState(false);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return lines.filter((l) => {
            if (levelFilter !== 'ALL' && l.level !== levelFilter) return false;
            if (q && !`${l.message}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [lines, levelFilter, search]);

    return (
        <div className="page">
            <header className="page__header">
                <div>
                    <h2 className="page__title">{t('pages.logs.title')}</h2>
                    <p className="page__subtitle">
                        {t('pages.logs.subtitle')}{' '}
                        <span className={`logs__status${connected ? ' is-on' : ' is-off'}`}>
                            {connected ? t('pages.logs.live') : t('pages.logs.offline')}
                        </span>
                    </p>
                </div>
                <div className="logs__controls">
                    <div className="logs__levels" role="group" aria-label={t('pages.logs.levelFilter')}>
                        <button type="button" className={levelFilter === 'ALL' ? 'is-active' : ''} onClick={() => setLevelFilter('ALL')}>{t('pages.logs.levelAll')}</button>
                        {LEVELS.map((lv) => (
                            <button key={lv} type="button" className={levelFilter === lv ? 'is-active' : ''} onClick={() => setLevelFilter(lv)}>{lv}</button>
                        ))}
                    </div>
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('pages.logs.search')} className="logs__search" />
                    <Button variant="secondary" size="sm" icon={paused ? Play : Pause} onClick={() => setPaused((p) => !p)}>
                        {paused ? t('pages.logs.resume') : t('pages.logs.pause')}
                    </Button>
                    <Button variant="secondary" size="sm" icon={Trash2} onClick={clear}>{t('pages.logs.clear')}</Button>
                </div>
            </header>

            <LogViewer lines={paused ? filtered : filtered} connected={connected} error={error} />
        </div>
    );
}
```

> **Pause:** In v1 pausiert der Button nur das **Rendern/Anhängen** (client-seitig); der WebSocket bleibt verbunden (kein Datenverlust). Alternativ (Backlog): Pause = `ws.close()` + bei Resume neu connect (History wird nachgeliefert).

### 6.4 `style/components/logviewer.css` (NEU)

```css
/* ===== Log Viewer (terminal-artig) ===== */
.logviewer {
  position: relative;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}

.logviewer__scroll {
  height: 60vh;
  overflow-y: auto;
  padding: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  line-height: 1.7;
}

.logviewer__line {
  display: flex;
  gap: var(--space-2);
  white-space: pre-wrap;
  word-break: break-word;
}

.logviewer__ts { color: var(--color-muted); flex-shrink: 0; }
.logviewer__level { flex-shrink: 0; width: 3ch; font-weight: 600; }
.logviewer__msg { white-space: pre-wrap; }

/* Level-Farben */
.logviewer__line--err .logviewer__level { color: var(--color-error); }
.logviewer__line--wrn .logviewer__level { color: var(--color-validation); }
.logviewer__line--inf .logviewer__level { color: var(--color-text-secondary); }
.logviewer__line--dbg .logviewer__level,
.logviewer__line--dbg .logviewer__msg { color: var(--color-muted); }
.logviewer__line--raw .logviewer__msg { color: var(--color-text-secondary); }

.logviewer__jump {
  position: absolute;
  bottom: var(--space-3);
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  font-size: var(--fs-xs);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-md);
  cursor: pointer;
}

.logviewer__state {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.logviewer__state--error { color: var(--color-error); }

/* ===== Logs-Seite: Controls ===== */
.logs__controls { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.logs__levels { display: inline-flex; border: 1px solid var(--color-border); border-radius: var(--radius-pill); overflow: hidden; }
.logs__levels button {
  padding: var(--space-1) var(--space-3);
  font-size: var(--fs-xs);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
}
.logs__levels button.is-active { background: var(--color-primary-subtle); color: var(--color-primary); font-weight: 600; }
.logs__search { width: 180px; }
.logs__status { font-size: var(--fs-xs); font-weight: 600; margin-left: var(--space-2); }
.logs__status.is-on { color: var(--color-success); }
.logs__status.is-off { color: var(--color-error); }
```

`style/components/index.css` (ÄNDERN): `@import './logviewer.css';` anhängen.

---

## 7. Navigation + i18n

### 7.1 `navItems.js` (ÄNDERN)

RUNTIME-Sektion: neuen Punkt **Logs** anhängen (Icon `ScrollText`):

```js
import { ScrollText } from 'lucide-react'; // += Import

{
  labelKey: 'nav.runtime',
  items: [
    { to: '/hls', labelKey: 'nav.hls', icon: Radio },
    { to: '/rtsp', labelKey: 'nav.rtsp', icon: Video },
    { to: '/rtmp', labelKey: 'nav.rtmp', icon: MonitorPlay },
    { to: '/srt', labelKey: 'nav.srt', icon: SatelliteDish },
    { to: '/webrtc', labelKey: 'nav.webrtc', icon: Wifi },
    { to: '/moq', labelKey: 'nav.moq', icon: Boxes },
    { to: '/logs', labelKey: 'nav.logs', icon: ScrollText },   // NEU
  ],
},
```

### 7.2 `App.jsx` (ÄNDERN)

Route anhängen (unter `<Layout>`):

```jsx
import Logs from './components/pages/Logs';
// …
<Route path="logs" element={<Logs />} />
```

### 7.3 `locales/{en,de,it}.json` (ÄNDERN)

**`nav`** (alle 3 Sprachen): `"logs": "Logs"` (IT: `"Log"`).

**`pages.logs`** (neu, alle 3 Sprachen):

```json
"logs": {
  "title": "Logs",
  "subtitle": "Live view of the MediaMTX log file.",
  "live": "LIVE",
  "offline": "OFFLINE",
  "empty": "No log entries yet.",
  "error": "Could not load logs.",
  "jumpToLatest": "Jump to latest",
  "pause": "Pause",
  "resume": "Resume",
  "clear": "Clear",
  "search": "Filter…",
  "levelFilter": "Log level",
  "levelAll": "All"
}
```

DE: `title: "Logs"`, `subtitle: "Live-Ansicht der MediaMTX-Logdatei."`, `empty: "Noch keine Log-Einträge."`, `error: "Logs konnten nicht geladen werden."`, `jumpToLatest: "Zum Neuesten"`, `pause: "Pause"`, `resume: "Fortsetzen"`, `clear: "Leeren"`, `search: "Filtern…"`, `levelFilter: "Log-Level"`, `levelAll: "Alle"`.

IT: `title: "Log"`, `subtitle: "Visualizzazione in tempo reale del file di log di MediaMTX."`, `empty: "Nessuna voce di log."`, `error: "Impossibile caricare i log."`, `jumpToLatest: "Vai all'ultimo"`, `pause: "Pausa"`, `resume: "Riprendi"`, `clear: "Svuota"`, `search: "Filtra…"`, `levelFilter: "Livello log"`, `levelAll: "Tutti"`.

> **Key-Parität:** EN/DE/IT müssen dieselben Keys haben (Bestand: 669 Keys, s. `.HANDOFF_STATE.md`). Nach dem Hinzufügen in **allen 3** Dateien prüfen.

---

## 8. Tests

### 8.1 Server: `test/LogTailService.test.js` (NEU)

- **Parse:** `parseLine` → `ts`, `level`, `message` korrekt (INF/WRN/ERR/DBG).
- **Mehrzeilen:** Zeile ohne Level-Match wird an die vorherige angehängt.
- **Ring-Buffer:** > `maxBuffer` Zeilen → älteste werden verworfen, `getHistory()` korrekt.
- **Broadcast:** Listener bekommt jede `push()`-Zeile.
- **Partial-Puffering:** Chunk ohne abschließendes `\n` → erst bei nächstem Chunk als Zeile emittiert.

### 8.2 Server: `test/LogsWebSocket.test.js` (NEU)

- **Connect:** Client verbindet an `/logs` → erhält `{ type: 'history', data: […] }`.
- **Live:** `tailService.push(line)` → Client erhält `{ type: 'line', data: line }`.
- **Disconnect:** `ws.close()` → Listener wird unsubscribed (kein Leak).
- **Setup:** `httpServer = http.createServer()`, `listen(0)`, `ws`-Client aus dem Test.

### 8.3 Integration (manuell / e2e)

- `docker compose -f compose-dev.yml up` → UI öffnen → **Runtime → Logs**.
- In einem anderen Terminal `docker exec mediamtx …` bzw. einen Stream starten → neue Log-Zeilen erscheinen **live** in der UI.
- Level-Filter + Suche + Pause + Clear testen.
- Browser-Tab schließen/öffnen → Reconnect + History-Nachlieferung.

> **Frontend-Tests:** Kein Frontend-Test-Framework vorhanden (s. `.HANDOFF_STATE.md` Backlog). → Manuelle Verifikation + (optional) später Vitest für `useLogStream` (mock `WebSocket`).

---

## 9. Dateiliste

### Server

| Datei | Typ | Aufgabe |
|-------|-----|---------|
| `server/src/LogTailService.js` | NEU | tail-Child-Process, Parse, Ring-Buffer, Broadcast, Restart, Stop. |
| `server/src/LogsWebSocket.js` | NEU | WebSocket-Server (`/logs`), History + Live-Stream. |
| `server/src/Config.js` | ÄNDERN | `mediamtxLogPath` (Env `MEDIAMTX_LOG_PATH`, runtimeKey). |
| `server/src/Router/index.js` | ÄNDERN | `LogTailService` + `LogsWebSocket` instanziieren/starten. |
| `server/src/Server.js` | ÄNDERN | Shutdown: `tailService.stop()`. |
| `server/package.json` | ÄNDERN | Dependency `ws` hinzufügen. |
| `server/test/LogTailService.test.js` | NEU | Parse, Buffer, Broadcast, Partial. |
| `server/test/LogsWebSocket.test.js` | NEU | Connect, History, Live, Disconnect. |

### Frontend

| Datei | Typ | Aufgabe |
|-------|-----|---------|
| `frontend/src/hooks/useLogStream.js` | NEU | WebSocket-Client (connect, reconnect, Puffer). |
| `frontend/src/components/logs/LogViewer.jsx` | NEU | Terminal-View (Zeilen, Auto-Scroll, Jump). |
| `frontend/src/components/pages/Logs.jsx` | NEU | Seite (Header, Filter, Suche, Pause, Clear). |
| `frontend/src/style/components/logviewer.css` | NEU | Styling (terminal, Level-Farben, Controls). |
| `frontend/src/style/components/index.css` | ÄNDERN | `@import './logviewer.css';` |
| `frontend/src/App.jsx` | ÄNDERN | Route `/logs`. |
| `frontend/src/components/layout/navItems.js` | ÄNDERN | Nav-Item `nav.logs` (RUNTIME). |
| `frontend/src/locales/{en,de,it}.json` | ÄNDERN | `nav.logs` + `pages.logs.*`. |

### Config / Env

| Datei | Typ | Aufgabe |
|-------|-----|---------|
| `.env` / `.env.default` | ÄNDERN | `MEDIAMTX_LOG_PATH=../data/mediamtx/mediamtx.log`. |
| `compose-dev.yml` / `compose.yml` | ÄNDERN | `MEDIAMTX_LOG_PATH` an den UI-Service weitergeben. |

---

## 10. Offene Punkte / Backlog / Trade-offs

1. **`tail`-Binary-Abhängigkeit:** Der UI-Container muss `tail` haben (aktuell: `node:22-alpine` → busybox `tail` ✓). Bei Basis-Image-Wechsel prüfen. **Alternative (robuster, mehr Code):** tail-Logik in Node.js (`fs.watch` + `read` ab Offset) — aber `tail -f` ist explizit gewünscht und weniger Code.
2. **Backpressure bei hohem Log-Volumen:** `ws` puffert pro Client. Bei sehr hohem Volumen optional: `ws.bufferedAmount` prüfen, langsamen Clients Throttle/Drop. Für MediaMTX-Log-Raten unkritisch.
3. **Pause-Semantik:** v1 = client-seitig (Rendern pausieren, WS bleibt verbunden). Alternative: Pause = `ws.close()`, Resume = neu connect (History-Nachlieferung).
4. **Settings-UI:** `mediamtxLogPath` aktuell nur per Env/config.json. Optional: in `getSettings()`/`updateSettings()` + Settings-Seite exponieren (Pfaden-Feld).
5. **Level-Filter server-seitig:** Aktuell client-seitig. Optional: Query-Param am WS (z. B. `?level=ERR`) für server-seitiges Filtern (spart Bandbreite bei hohem Volumen).
6. **Log-Rotation/Größe:** MediaMTX rotiert die Datei nicht selbst (wächst). Optional: `logDestinations`/`logFile` in `mediamtx.yml` anpassen oder externes Log-Rolling. `tail -f` folgt Rotation/Truncation korrekt.
7. **Mehrere Log-Dateien:** Aktuell eine Datei. Optional: mehrere Pfade (z. B. `mediamtx` + `ui`) über mehrere `tail`-Prozesse / einen WS-Endpunkt pro Quelle.
8. **Auth:** Der WS-Endpunkt `/logs` ist aktuell **nicht** authentifiziert (wie die anderen UI-Endpunkte). Bei exponiertem Deployment optional: Token/Session-Check am `connection`-Event.

---

## 11. Umsetzung (empfohlene Reihenfolge)

1. **Server-Grundgerüst:** `Config.js` (`mediamtxLogPath`) + `LogTailService.js` + Tests.
2. **WebSocket:** `ws`-Dependency + `LogsWebSocket.js` + Verdrahtung in `Router/index.js` + Shutdown in `Server.js` + Tests.
3. **Env/Compose:** `MEDIAMTX_LOG_PATH` in `.env`/`.env.default`/`compose-*.yml`.
4. **Frontend:** `useLogStream.js` + `LogViewer.jsx` + `Logs.jsx` + `logviewer.css` + `index.css`.
5. **Nav + i18n:** `navItems.js` + `App.jsx` + `locales/{en,de,it}.json`.
6. **Verifikation:** `npm test` (Server), `npm run build` (Frontend), manuelle e2e (Live-Log, Filter, Pause, Reconnect).
