# Konzept: RECORDS PLAYER — Wiedergabe von MediaMTX-Aufnahmen

> **Stand:** 2026-10-24 — Konzept, noch nicht implementiert.
> - Frontend-Grundlagen: siehe `INITIAL_FRONTEND.md`
> - Server-Grundlagen: siehe `INITIAL_SERVER.md`
> - Doku-Stil-Vorbild: `THEATRE.md`, `PLAN_TOOLS.md`
> - Playback-API: `mediamtx/playback.openapi.yml` + MediaMTX-Doku `docs/2-features/09-playback.md`
>
> **Ziel:** Aufnahmen (Recordings) im Browser abspielen.
> - **Heute:** `Recordings.jsx` listet Aufnahmen + Segmente (nur Löschen). **Kein Player.**
> - **Ziel:** Pro Segment ein „Play"-Button → Video-Player (fMP4/MP4) im Browser.
>
> **Kernprinzip:** Die Playback-API (Port 9996) ist vom Browser **direkt erreichbar** (Port gemappt, `VIRTUAL_HOST=stream.home`, CORS gelöst). → **Frontend-Player** (natives `<video>`) mit **direktem Zugriff** auf die Playback-API — analog zu HLS (`buildHlsUrl`). Ein **Server-Proxy** ist nur noch **optionaler Fallback** (Umgebungen ohne direkten Zugriff).

---

## 1. Ist-Zustand (Relevanz für das Konzept)

| Fakt | Detail |
|------|--------|
| Recordings-Seite | `Recordings.jsx`: `useListQuery` → `api.get('/recordings/list')` (MediaMTX-API, Port 9997). Modal zeigt Segmente (nur `start`) + Delete-Button. |
| MediaMTX-API | Port 9997, via `MediaMTXBridge` (agnostischer Proxy) an `/v3`. |
| Playback-API | Port 9996. Endpunkte: `GET /list` (JSON) + `GET /get` (video/mp4). **Vom Browser direkt erreichbar** (s. unten). |
| Playback-Erreichbarkeit | `compose-mediamtx.yml`: `${PLAYBACK_PORT}:${PLAYBACK_PORT}` (9996 → Host). `.env`: `PLAYBACK_PORT=9996`, `VIRTUAL_HOST=stream.home`. **CORS/Origin-Problem gelöst** → Browser erreicht die Playback-API. |
| Playback-Config | `mediamtx.yml`: `playback: true`, `playbackAddress: :9996`. |
| Recording-Config | `record: false` (Default, alle Pfade). `recordFormat: fmp4`, `recordSegmentDuration: 1h`, `recordDeleteAfter: 1d`. |
| Theatre | `Theatre.jsx`: Fullscreen-**Live**-Player (HLS, `useHlsPlayer`). Custom-Chrome (TopBar, Auto-Hide). |
| HLS-URL | `buildHlsUrl.js`: `hlsBaseUrl` (App-Settings) oder `VITE_MEDIAMTX_HLS_URL` (Env) + `/path/index.m3u8`. **Muster für die Playback-URL.** |
| Playback-URL | `VITE_MEDIAMTX_PLAYBACK_URL=http://servant:9996` — **gesetzt** in `.env` + `compose-dev.yml` (Dev). **Nicht** in `.env.default` + `compose.yml` (Prod). |
| App-Settings | `appSettings.js`: `apiBaseUrl` + `hlsBaseUrl` (localStorage-Override). `playbackBaseUrl` kommt neu (§3.3). |
| i18n | `pages.recordings.*`, `pages.theatre.*`, `nav.recordings`. |
| UI-Bausteine | `Modal` (title/isOpen/onClose/children/footer), `Button` (variant/size/icon), `Card`, `Badge`, `Spinner`, `ErrorAlert`. |
| Styling | Plain CSS, BEM, `style/components/*.css` (Import über `index.css`). |

**Fazit:** Feature = **Frontend-Player** (Video abspielen) mit **direktem Zugriff** auf die Playback-API (analog HLS). Recording muss pro Pfad aktiviert sein (`record: true`), sonst gibt es keine Segmente. Server-Proxy = optionaler Fallback.

---

## 2. Architektur

```
┌──────────────────────────────────────────────────────────────────────┐
│  BROWSER (Frontend)                                                  │
│                                                                      │
│  Recordings.jsx                                                      │
│     ├─ api.get('/recordings/list')   → MediaMTX-API (9997)          │
│     └─ <video src="…/get?…">          → Playback-API (9996) DIREKT  │
│                                                                      │
│  buildPlaybackUrl.js  ← URL-Bau (path, start, duration, format)     │
│     Base: playbackBaseUrl (App-Settings) > VITE_MEDIAMTX_PLAYBACK_URL│
└──────────────────────────────────────────────────────────────────────┘
        │  HTTP (JSON + video/mp4)
┌──────────────────────────────────────────────────────────────────────┐
│  MEDIAMTX (Port 9996 + 9997)                                         │
│                                                                      │
│  Playback-API (9996):  /list (JSON) + /get (video/mp4)              │
│  MediaMTX-API (9997):  /recordings/list + /recordings/segments/...  │
└──────────────────────────────────────────────────────────────────────┘

  [OPTIONAL] UI-SERVER (Node.js, Port 3000) — Fallback-Proxy:
     PlaybackRouter: GET /playback/list + GET /playback/get → 9996
     (nur wenn direkter Browser-Zugriff nicht möglich ist)
```

**Kernentscheidungen:**

1. **Direkter Browser-Zugriff auf die Playback-API.** Port 9996 ist gemappt, CORS/Origin gelöst → Browser spielt das Video direkt ab (analog HLS via `buildHlsUrl`). **Kein** Server-Proxy nötig.
2. **Natives `<video>` für die Wiedergabe.** fMP4 ist browser-ready (progressive Stream, läuft direkt im `<video>`-Tag). **Keine hls.js nötig** (die ist für Live-HLS). Native Controls (Play/Pause, Seek, Volume, Rate) — weniger Code, robuster.
3. **Inline-Player im Recordings-Modal (v1).** Einfach, hält Kontext (alle Segmente + Delete sichtbar). Fullscreen via native API. Dedizierter Fullscreen-Player (Theatre-Stil) = Backlog.
4. **Keine neuen Dependencies.** Nur React, i18next (alle vorhanden). Optional: Express (für Fallback-Proxy, vorhanden).
5. **Base-URL wie bei HLS.** `playbackBaseUrl` (App-Settings) > `VITE_MEDIAMTX_PLAYBACK_URL` (Env). Konsistent mit `buildHlsUrl`.

---

## 3. Frontend: Player

### 3.1 `buildPlaybackUrl.js` (NEU)

Analog zu `buildHlsUrl.js` (Base-URL-Auflösung + Pfad):

```js
import { getAppSettings } from '../services/appSettings';

// Playback-Base-URL: App-Settings-Override > Env > leer.
function resolvePlaybackBase() {
  const override = (getAppSettings().playbackBaseUrl || '').trim();
  if (override) return override.replace(/\/+$/, '');
  return (import.meta.env.VITE_MEDIAMTX_PLAYBACK_URL || '').trim().replace(/\/+$/, '');
}

/**
 * Baut die Wiedergabe-URL für ein Aufnahmen-Segment.
 * @param {object} p
 * @param {string} p.path     - Pfadname (z. B. 'cam1')
 * @param {string} p.start    - Startzeit (RFC3339 / ISO)
 * @param {number} [p.duration] - Dauer in Sekunden (Default: groß → Server cappt auf echte Länge)
 * @param {'fmp4'|'mp4'} [p.format] - Container (Default: fmp4, browser-ready)
 * @returns {string} z. B. 'http://…:9996/get?path=cam1&start=…&duration=999999&format=fmp4'
 */
export function buildPlaybackUrl({ path, start, duration = 999999, format = 'fmp4' }) {
  const base = resolvePlaybackBase();
  if (!base || !path || !start) return '';
  const params = new URLSearchParams({
    path,
    start,
    duration: String(duration),
    format,
  });
  return `${base}/get?${params.toString()}`;
}

export default buildPlaybackUrl;
```

**Hinweis `duration`:** Die MediaMTX-API-Segmente liefern nur `start` (keine `duration`). `duration` ist bei `/get` „maximale Dauer" — der Server cappt auf die echte Segmentlänge. Großes Default (`999999`) ist sicher. **Refinement (Backlog):** exakte `duration` via Playback-`/list` holen.

### 3.2 `Recordings.jsx` — Play-Button + Inline-Player

Änderungen (bestehender Code bleibt, Player wird ergänzt):

```jsx
import { useMemo, useRef, useState } from 'react';
import { Play, Trash2, Maximize, X } from 'lucide-react';
import { buildPlaybackUrl } from '../../utils/buildPlaybackUrl';
// … (bestehende Imports)

export default function Recordings() {
  const { t } = useTranslation();
  // … (bestehender Code: list, deleteSegment, detail)
  const [playingSegment, setPlayingSegment] = useState(null);
  const videoRef = useRef(null);

  // Play-URL nur wenn ein Segment aktiv ist.
  const playUrl = useMemo(() => {
    if (!playingSegment || !detail) return null;
    return buildPlaybackUrl({ path: detail.name, start: playingSegment.start });
  }, [playingSegment, detail]);

  // Modal schließen → Player stoppen.
  const closeDetail = () => {
    setPlayingSegment(null);
    setDetailName(null);
    setDetailFallback(null);
  };

  // Fullscreen auf dem <video> (native API).
  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else video.requestFullscreen().catch(() => {});
  };

  // … (bestehender Render, Modal-Body erweitern:)
  return (
    // … (bestehende Seite)
    <Modal title={…} isOpen={!!detail} onClose={closeDetail}>
      {detail && (
        <div className="formdialog">
          {/* NEU: Player-Bereich (nur wenn Segment aktiv) */}
          {playUrl ? (
            <div className="recording-player">
              <video ref={videoRef} src={playUrl} controls playsInline className="recording-player__video" />
              <div className="recording-player__actions">
                <Button variant="ghost" size="sm" icon={Maximize} onClick={toggleFullscreen}>
                  {t('pages.recordings.fullscreen')}
                </Button>
                <Button variant="ghost" size="sm" icon={X} onClick={() => setPlayingSegment(null)}>
                  {t('pages.recordings.stop')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="formdialog__hint">{t('pages.recordings.playerHint')}</p>
          )}

          {/* Segment-Liste (Play + Delete pro Segment) */}
          {segments.length ? (
            <ul className="segmentlist">
              {segments.map((seg) => (
                <li key={seg.start}>
                  <span className="segmentlist__start">{formatDate(seg.start)}</span>
                  <div className="segmentlist__actions">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Play}
                      onClick={() => setPlayingSegment(seg)}
                    >
                      {t('pages.recordings.play')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      loading={deleteSegment.isPending}
                      onClick={() => deleteSegment.mutate({ name: detail.name, start: seg.start })}
                    >
                      {t('pages.recordings.delete')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="formdialog__hint">{t('pages.recordings.noSegments')}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
```

**Wichtig:**
- `<video controls>` → native Controls (Play/Pause, Seek, Volume, Rate). **Kein** Custom-Player-Code.
- `playsInline` → Mobile (iOS) spielt inline ab, kein erzwungenes Fullscreen.
- Player stoppen = `setPlayingSegment(null)` → `playUrl` wird `null` → `<video>` wird entfernt (kein offener Stream).
- Modal schließen stoppt den Player (`closeDetail`).
- **Base-URL nicht gesetzt** (`buildPlaybackUrl` liefert `''`) → Player-Bereich zeigt Hinweis (`playerHint`), kein kaputter `<video>`.

### 3.3 App-Settings + Env

`appSettings.js`: `playbackBaseUrl: ''` (Default `''` → Env). Für Fortgeschrittene: eigener Origin/Proxy.

**Env-Status (aktuell):**

| Datei | `VITE_MEDIAMTX_PLAYBACK_URL` | Status |
|-------|------------------------------|--------|
| `.env` | `http://servant:9996` | ✅ gesetzt |
| `compose-dev.yml` | `${VITE_MEDIAMTX_PLAYBACK_URL:-http://servant:9996}` | ✅ gesetzt |
| `.env.default` | — | ⬜ fehlt |
| `compose.yml` (Prod) | — | ⬜ fehlt |

**Offen:** `VITE_MEDIAMTX_PLAYBACK_URL` in `.env.default` + `compose.yml` (Prod) ergänzen (analog zu `VITE_MEDIAMTX_HLS_URL`).

---

## 4. Server: Fallback-Proxy (OPTIONAL)

> **Nur nötig**, wenn in einer Umgebung der direkte Browser-Zugriff auf Port 9996 nicht möglich ist (z. B. kein Port-Mapping, kein Reverse-Proxy). In der aktuellen Dev/Prod-Umgebung **nicht erforderlich**.

### 4.1 Config-Erweiterung (`Config.js`)

| Key | Default | Runtime/Restart |
|-----|---------|-----------------|
| `playbackBaseUrl` | `http://localhost:9996` | runtime |
| `playbackAuthToken` | `''` | runtime |
| `playbackTimeout` | `10000` (ms) | runtime |

### 4.2 `PlaybackRouter.js` (NEU, optional)

```js
import express from 'express';
import axios from 'axios';

/**
 * Optionaler Proxy für die MediaMTX-Playback-API (Port 9996).
 * - GET /playback/list → /list (JSON: [{ start, duration, url }])
 * - GET /playback/get  → /get  (video/mp4, gestreamt)
 *
 * NUR als Fallback, wenn der Browser die Playback-API nicht direkt
 * erreichen kann. In der aktuellen Umgebung ist direkter Zugriff möglich.
 */
class PlaybackRouter {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger || { log: () => {}, error: () => {} };
        this.label = '[PlaybackRouter]';
        this.router = express.Router();
        this.router.get('/playback/list', this.handleList.bind(this));
        this.router.get('/playback/get', this.handleGet.bind(this));
    }

    createClient() {
        const baseURL = (this.config?.playbackBaseUrl || 'http://localhost:9996').replace(/\/+$/, '');
        const token = this.config?.playbackAuthToken || '';
        return axios.create({
            baseURL,
            timeout: this.config?.playbackTimeout || 10000,
            validateStatus: () => true,
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
    }

    async handleList(req, res) {
        try {
            const upstream = await this.createClient().get('/list', { params: req.query });
            res.status(upstream.status);
            if (upstream.headers?.['content-type']) res.set('Content-Type', upstream.headers['content-type']);
            res.json(upstream.data);
        } catch (err) {
            this.handleError(res, err);
        }
    }

    async handleGet(req, res) {
        try {
            const upstream = await this.createClient().get('/get', {
                params: req.query,
                responseType: 'stream', // NICHT puffern — Video kann groß sein
            });
            res.status(upstream.status);
            if (upstream.headers?.['content-type']) res.set('Content-Type', upstream.headers['content-type']);
            if (upstream.headers?.['content-length']) res.set('Content-Length', upstream.headers['content-length']);
            upstream.data.pipe(res);
            upstream.data.on('error', (e) => this.logger.error(this.label, `Stream-Fehler: ${e.message}`));
        } catch (err) {
            this.handleError(res, err);
        }
    }

    handleError(res, err) {
        const message = err.code === 'ECONNABORTED'
            ? 'Playback request timed out'
            : `Playback unreachable: ${err.message}`;
        this.logger.error(this.label, message);
        res.status(502).json({ error: message, status: 'error', code: 'playback_unreachable' });
    }
}

export { PlaybackRouter };
```

### 4.3 Verdrahtung (optional)

`Router/index.js`: `PlaybackRouter` nach Bridge, vor Frontend (Catch-all zuletzt). Nur aktivieren, wenn Fallback gebraucht wird.

---

## 5. API-Kontrakt (Playback-API)

> Die Frontend-URL zeigt **direkt** auf die Playback-API (Base aus `playbackBaseUrl` / `VITE_MEDIAMTX_PLAYBACK_URL`).

### 5.1 `GET /list` — Segment-Liste

**Request:** `?path=X&start=Y&end=Z` (`start`/`end` optional, RFC3339)

**Antwort 200:**
```json
[
  { "start": "2026-10-20T00:00:00Z", "duration": 60.0, "url": "http://…/get?path=cam1&start=…&duration=60.0" },
  { "start": "2026-10-20T00:01:00Z", "duration": 32.33, "url": "http://…/get?path=cam1&start=…&duration=32.33" }
]
```

### 5.2 `GET /get` — Wiedergabe

**Request:** `?path=X&start=Y&duration=Z&format=fmp4|mp4`

**Antwort 200:** `video/mp4` (Binary, progressive Stream, `Accept-Ranges: none`).

### 5.3 Fehler

| Fall | Status | Body |
|------|--------|------|
| Keine Aufnahme (Pfad/Zeit) | `404` | `{ "status": "error", "error": "…" }` |
| Ungültige Params | `400` | `{ "status": "error", "error": "…" }` |
| Interner Fehler | `500` | `{ "status": "error", "error": "…" }` |

**UI-Handling:** `<video>` feuert `error`-Event → Player-Bereich zeigt `playerError`-Meldung (statt kaputtem Video).

---

## 6. UI/UX-Spezifikation

- **Recordings-Seite:** Unverändert (Liste + Pagination + Auto-Refresh).
- **Modal (Detail):**
  - **Oben:** Player-Bereich (Segment aktiv → `<video>`; sonst Hinweis `playerHint`).
  - **Unten:** Segment-Liste (Play + Delete pro Segment).
- **Player:**
  - `<video controls>` (native Controls: Play/Pause, Seek, Volume, Rate).
  - **Fullscreen-Button** (native API, auf dem `<video>`).
  - **Stop-Button** (Player schließen, Stream stoppen).
- **States:**
  - `idle`: Kein Segment aktiv → Hinweis `playerHint` + Segment-Liste.
  - `playing`: Segment aktiv → Player + Segment-Liste.
  - `error`: Video-Fehler → Meldung `playerError`.
  - `noBase`: Base-URL nicht gesetzt → Hinweis (kein kaputter `<video>`).
- **Mobile:** `playsInline` + größere Touch-Ziele (bestehende `ui-btn`-Größen).

---

## 7. Datenfluss

```
Recordings.jsx
  └─ useListQuery(QUERY_KEYS.recordings,
        () => api.get('/recordings/list'))
        → GET /v3/recordings/list  (MediaMTX-API, 9997)
            → { items: [{ name, segments: [{ start }] }] }
  └─ Modal: Segment-Liste (start) + Play-Button
  └─ Play-Click:
      → buildPlaybackUrl({ path, start, duration })
      → <video src="http://…:9996/get?path=…&start=…&duration=…&format=fmp4">
          → GET /get  (Playback-API, 9996) DIREKT
              → video/mp4 (progressive Stream)
```

- **Zwei Datenquellen:** MediaMTX-API (9997) für die **Liste** (Name + Segmente), Playback-API (9996) für die **Wiedergabe** (Video).
- **Kein Auto-Refresh im Player** (VOD, kein Live). Liste bleibt auto-refresh (bestehend).
- **Kein Server-Proxy** im Happy-Path (direkter Zugriff).

---

## 8. i18n-Keys (en/de/it)

> **Namenskonvention:** unter `pages.recordings.*` (bestehende Sektion erweitern).

```jsonc
// en.json
"pages": {
  "recordings": {
    // … bestehende (title, subtitle, noRecordings, name, segments, recording, delete, noSegments) …
    "play": "Play",
    "stop": "Stop",
    "fullscreen": "Fullscreen",
    "exitFullscreen": "Exit fullscreen",
    "playerError": "Playback error",
    "playerHint": "Select a segment to play"
  }
}
```

```jsonc
// de.json
"pages": {
  "recordings": {
    "play": "Abspielen",
    "stop": "Stopp",
    "fullscreen": "Vollbild",
    "exitFullscreen": "Vollbild beenden",
    "playerError": "Wiedergabe-Fehler",
    "playerHint": "Segment wählen zum Abspielen"
  }
}
```

```jsonc
// it.json
"pages": {
  "recordings": {
    "play": "Riproduci",
    "stop": "Stop",
    "fullscreen": "Schermo intero",
    "exitFullscreen": "Esci dallo schermo intero",
    "playerError": "Errore di riproduzione",
    "playerHint": "Seleziona un segmento da riprodurre"
  }
}
```

---

## 9. Styling

`style/components/recordings.css` (erweitern, bestehende `.segmentlist` bleibt):

```css
/* ===== Recordings: Player ===== */
.recording-player {
  margin-bottom: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  background: #000;
}

.recording-player__video {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: block;
  background: #000;
}

.recording-player__actions {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-surface-alt);
}

/* ===== Recordings: Segment-Aktionen (Play + Delete) ===== */
.segmentlist__actions {
  display: flex;
  gap: var(--space-2);
}
```

**Regel:** nur CSS-Variablen aus `variables.css`, keine Hardcodes. Dark/Light-Theme automatisch (Variablen).

---

## 10. Tests

**Frontend:** kein Test-Framework vorhanden (wie THEATRE/TOOLS) → manuell via Build + E2E.

**Server (nur wenn Fallback-Proxy implementiert):** `server/test/PlaybackRouter.test.js`:

| Test | Erwartung |
|------|-----------|
| `GET /playback/list?path=cam1` → 200 | JSON-Array `[{ start, duration, url }]` |
| `GET /playback/get?path=cam1&start=…&duration=60` → 200 | `Content-Type: video/mp4`, Body gestreamt |
| Playback-API offline (falsche BaseUrl) → 502 | `{ code: 'playback_unreachable' }` |
| Playback-API 404 (unbekannter Pfad) → 404 | Status + Body 1:1 forwardet |

---

## 11. Akzeptanzkriterien

- [ ] `buildPlaybackUrl` liefert die korrekte Wiedergabe-URL (URL-encoded, Base aus Settings/Env).
- [ ] Recordings-Modal: **Play-Button** pro Segment.
- [ ] Player: `<video controls>` (Play/Pause, Seek, Volume, Rate) — Video spielt ab.
- [ ] **Fullscreen-Button** funktioniert (native API).
- [ ] **Stop-Button** schließt den Player (Stream gestoppt).
- [ ] Modal schließen stoppt den Player.
- [ ] Base-URL nicht gesetzt → Hinweis `playerHint` (kein kaputter `<video>`).
- [ ] Video-Fehler → Meldung `playerError`.
- [ ] i18n: en/de/it vollständig (keine fehlenden Keys in der Console).
- [ ] `npm run build` (frontend) grün.
- [ ] Manueller E2E via `docker exec mediamtx-ui …` (Dev-Architektur laut AGENTS.md).
- [ ] *(optional, nur bei Fallback-Proxy)* `npm test` (server) grün, inkl. `PlaybackRouter.test.js`.

---

## 12. Risiken & offene Punkte

| Risiko / Punkt | Einschätzung / Gegenmaßnahme |
|----------------|------------------------------|
| **Base-URL nicht gesetzt** | Dev: ✅ gesetzt (`.env` + `compose-dev.yml`). Prod: ⬜ fehlt (`.env.default` + `compose.yml`) → `buildPlaybackUrl` liefert `''` → Hinweis `playerHint`. Kein kaputter `<video>`. |
| **Große Aufnahmen** | fMP4 streamt progressiv (kein RAM-Puffer im Browser). `Accept-Ranges: none` → kein Seek über Byte-Ranges, aber fMP4-Seek funktioniert. |
| **CORS / Erreichbarkeit** | **Gelöst:** Port 9996 gemappt, `VIRTUAL_HOST=stream.home`, CORS ok. Direkter Browser-Zugriff möglich. |
| **Duration unbekannt** | v1: großes Default (`999999`), Server cappt auf echte Länge. **Refinement:** exakte `duration` via Playback-`/list`. |
| **fMP4-Kompatibilität** | fMP4 ist browser-ready (progressive Stream). Fallback: `format=mp4` (Backlog-Toggle). |
| **Auth** | Playback-API: `security: []` (kein Auth). Optional: Token via Header (Fallback-Proxy). |
| **Recording nicht aktiv** | `record: false` (Default) → keine Segmente. UI zeigt „No segments" (bestehend). Hinweis: Pfad muss `record: true` haben. |
| **Umgebung ohne direkten Zugriff** | Fallback-Proxy (`PlaybackRouter`, §4) aktivieren. |

---

## 13. Bewusst NICHT in v1 (Backlog)

- **Dedizierter Fullscreen-Player** (Theatre-Stil, eigene Route `/recordings/play`, Custom-Chrome + Auto-Hide).
- **Exakte Duration** via Playback-`/list` (statt großem Default).
- **Format-Toggle** (fmp4/mp4) in der UI.
- **Segment-Vorschau** (Thumbnail) in der Liste.
- **Playlist** (mehrere Segmente nacheinander).
- **Download-Button** (Video herunterladen).
- **Frontend-Tests** (kein Test-Framework vorhanden).
- **Server-Fallback-Proxy** (`PlaybackRouter`, §4) — nur bei Bedarf.

---

## 14. Roadmap: 4 Phasen

> **Stand:** 2026-10-24 — Konzept, noch nicht implementiert.
> **Legende:** ✅ erledigt · 🚧 teilweise · ⬜ offen
> **Aufbau:** 4 Phasen, sequenziell. Eine Phase ist abgeschlossen, wenn alle Akzeptanzkriterien grün sind.
> **Abhängigkeiten:** P2 braucht P1 · P3 braucht P2 · P4 braucht alles.
> **Hinweis:** Kein Server-Proxy im Happy-Path (direkter Browser-Zugriff). Fallback-Proxy (§4) nur bei Bedarf.

### Status-Übersicht

| Phase | Fortschritt | Aufwand |
|-------|-------------|---------|
| Phase 1: Frontend — buildPlaybackUrl + Settings/Env | 0/3 | 3/10 |
| Phase 2: Frontend — Player im Recordings-Modal | 0/3 | 4/10 |
| Phase 3: i18n + Styling | 0/3 | 2/10 |
| Phase 4: Integration & Testing | 0/4 | 3/10 |

**Gesamt: 0/13 Schritte · Gesamtaufwand: 12/100**

---

### Phase 1: Frontend — buildPlaybackUrl + Settings/Env · Aufwand 3/10

> Fundament: URL-Bau + Base-URL-Konfiguration. Noch kein Player.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 1.1 | `buildPlaybackUrl.js`: URL-Bau (path, start, duration, format) + `resolvePlaybackBase` | URL korrekt (URL-encoded), Base aus Settings/Env | ⬜ |
| 1.2 | `appSettings.js`: `playbackBaseUrl: ''` (Default) | Settings laden sauber, Override funktioniert | ⬜ |
| 1.3 | `VITE_MEDIAMTX_PLAYBACK_URL` in `.env` + `compose-dev.yml` (Dev) ✅; in `.env.default` + `compose.yml` (Prod) ⬜ | Dev: Env gesetzt, Vite liest sie. Prod: noch ergänzen | 🚧 |

**Abnahme Phase 1:** `buildPlaybackUrl({ path: 'cam1', start: '…' })` liefert eine gültige Wiedergabe-URL.

---

### Phase 2: Frontend — Player im Recordings-Modal · Aufwand 4/10

> Player: Play-Button + Inline-Player + Fullscreen/Stop.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 2.1 | `Recordings.jsx`: Play-Button pro Segment + `playingSegment`-State | Play-Button rendert, State wechselt | ⬜ |
| 2.2 | Inline-Player (`<video controls>`) + `closeDetail` (Modal schließen stoppt) | Player rendert, Video spielt ab | ⬜ |
| 2.3 | Fullscreen-Button (native API) + Stop-Button + `playerHint`/`playerError` | Fullscreen funktioniert, Stop schließt Player, Hinweise sichtbar | ⬜ |

**Abnahme Phase 2:** Play-Button → Video spielt im Modal; Fullscreen + Stop funktionieren; Modal schließen stoppt den Player.

---

### Phase 3: i18n + Styling · Aufwand 2/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 3.1 | i18n-Keys `pages.recordings.play/stop/fullscreen/exitFullscreen/playerError/playerHint` in `en/de/it.json` | Keine fehlenden Keys (Console-Check), alle 3 Sprachen vollständig | ⬜ |
| 3.2 | `recordings.css`: `.recording-player*` + `.segmentlist__actions` | Build ohne fehlende Styles, Player korrekt | ⬜ |
| 3.3 | Dark/Light-Theme + Mobile (375 px) prüfen | Beide Themes OK, Mobile nutzbar (`playsInline`) | ⬜ |

**Abnahme Phase 3:** Feature in allen 3 Sprachen, in beiden Themes, auf Mobile + Desktop vollständig bedienbar.

---

### Phase 4: Integration & Testing · Aufwand 3/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 4.1 | `npm run build` (frontend) grün | Production-Build ohne Fehler | ⬜ |
| 4.2 | Manueller E2E via `docker exec mediamtx-ui …`: Recordings → Modal → Play → Video | Alle Akzeptanzkriterien aus §11 grün | ⬜ |
| 4.3 | Base-URL-Check: `VITE_MEDIAMTX_PLAYBACK_URL` gesetzt, Video lädt | Wiedergabe funktioniert in der Dev-Umgebung | ⬜ |
| 4.4 | `.HANDOFF_STATE.md` aktualisieren (Status COMPLETED, nächste Optionen aus §13) | Handoff-Datei aktuell | ⬜ |

**Abnahme Phase 4:** Feature produktionsreif. Alle Akzeptanzkriterien aus §11 erfüllt.

---

### Meilensteine

| Meilenstein | Phasen | Ergebnis |
|-------------|--------|----------|
| **M1: URL + Config** | 1 | `buildPlaybackUrl` liefert gültige Wiedergabe-URL |
| **M2: Player sichtbar** | 2 | Play-Button → Video spielt im Modal |
| **M3: Poliert** | 3 | i18n (en/de/it), Styling, Themes, Mobile |
| **M4: Fertig** | 4 | Build/E2E grün, produktionsreif |
