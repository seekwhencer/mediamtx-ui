# Konzept: THEATRE — Fullscreen-Stream-Wall

> **Stand:** 2026-10-21 — Konzept, noch nicht implementiert.
> - Frontend-Grundlagen: siehe `INITIAL_FRONTEND.md`
> - Roadmap: siehe `ROADMAP.md`
> - hls.js-API: https://github.com/video-dev/hls.js/blob/master/docs/API.md (v1)

**Ziel:** Neue Seite `/theatre`. Alle Pfade unten mittig als Dummy-Vorschautiles nebeneinander. Klick auf einen Tile → Stream läuft **fullscreen im Hintergrund** (hinter den Tiles). Die Tiles bleiben **im Vordergrund** (Picture-in-Picture-Prinzip). Klick auf einen anderen Tile → Streamwechsel. Klick auf aktiven Tile / `Esc` → Stopp.

---

## 1. Ist-Zustand (Relevanz für das Konzept)

| Fakt | Detail |
|------|--------|
| `hls.js` | `^1.7.3` bereits in `frontend/package.json` — **aber nirgends in `src/` verwendet**. Keine neue Dependency nötig. |
| `HLS.jsx` | Ist eine **Monitoring-Seite** (Muxer/Sessions-Tabellen), **kein** Player. Kein Namenskonflikt, aber nicht verwechseln. |
| Pfad-Liste | `GET /v3/paths/list` (via Bridge) → `items[]` mit `name`, `online`, `available`, `source`, `readers`. Paginiert (`page`, `itemsPerPage`). |
| Routing | `App.jsx`: alle Routen unter `<Route element={<Layout />}>` (Sidebar + TopBar + Content). |
| Navigation | `navItems.js` → `NAV_SECTIONS`, Labels als i18n-Keys. |
| Styling | **Plain CSS**, BEM-artig (`page`, `page__header`), CSS-Variablen in `style/variables.css`, Komponenten-CSS in `style/components/*.css` (Import über `style/components/index.css`). Kein Tailwind. |
| i18n | `locales/{en,de,it}.json`, Top-Keys: `common`, `nav`, `pages`, … |
| App-Settings | `services/appSettings.js` (localStorage): `apiBaseUrl`, `theme`, `autoRefreshMs`, `itemsPerPage`. |
| Server | `mediamtxBaseUrl` = API-Port (Default `http://localhost:9997`). **HLS-Port ist separat** (MediaMTX-Default `:8888`). |
| Hooks | `useListQuery`, `useAutoRefresh`, `usePagination` vorhanden und wiederverwendbar. |

**Fazit:** Feature ist **frontend-only**. Server braucht keine Änderung (außer optional: HLS-Base-URL als Setting, s. §4).

---

## 2. Architektur

```
┌────────────────────────────────────────────────────────────┐
│  z-10  Top-Bar (Exit-Button links, Mute/Fullscreen rechts) │
│                                                            │
│  z-0   <video> — fullscreen, object-fit: contain,          │
│        schwarzer Hintergrund, hinter ALLEM                 │
│                                                            │
│  z-10  Tile-Strip: unten mittig, horizontal, scrollbar     │
│        [ cam-1 ] [ cam-2 ] [ cam-3 ] [ cam-4 ] …           │
└────────────────────────────────────────────────────────────┘
```

**Kernentscheidungen:**

1. **Eine Seite, ein `<video>`, eine `Hls`-Instanz.** Nie mehrere Streams parallel → nur eine HLS-Verbindung aktiv, Bandbreite kontrolliert.
2. **Theater-Route AUFERHALB des `Layout`** (kein Sidebar/TopBar-Chrome) → echtes Fullscreen. In `App.jsx` als Geschwister der `<Route element={<Layout />}>`-Gruppe.
3. **Dummy-Tiles, keine echten Video-Vorschauen.** Ein Tile = 16:9-Platzhalter (Icon + Pfadname + Online-Dot). Echte Vorschauen würden N parallele HLS-Verbindungen kosten — bewusst nicht. (Option für später, s. §11.)
4. **Stream-Wechsel über `hls.loadSource(newUrl)`** auf derselben Instanz (hls.js-API: „destroying, switching between streams"). Kein Destroy/Recreate pro Klick.
5. **Kein State-Management-Framework.** Lokaler React-State (`activePath`, `status`) in der Theater-Komponente.

---

## 3. Komponenten & Dateien

| Datei | Typ | Aufgabe |
|-------|-----|---------|
| `frontend/src/components/pages/Theatre.jsx` | NEU | Seite: Pfad-Liste laden, `activePath`-State, Tile-Strip, Top-Bar, Keyboard-Handling. |
| `frontend/src/hooks/useHlsPlayer.js` | NEU | hls.js-Lebenszyklus kapseln: `attachMedia`, `loadSource`, Error-Recovery, `destroy()` bei Unmount. Gibt `status` (`idle/loading/playing/error`) zurück. |
| `frontend/src/components/theatre/PathTile.jsx` | NEU | Ein Dummy-Tile: Name, Online-Dot, Active-/Loading-/Error-Zustand, `onClick`. |
| `frontend/src/style/components/theatre.css` | NEU | Layout, Z-Layering, Tile-Styles, Responsive. |
| `frontend/src/style/components/index.css` | ÄNDERN | `@import './theatre.css';` |
| `frontend/src/App.jsx` | ÄNDERN | Route `theatre` (außerhalb Layout). |
| `frontend/src/components/layout/navItems.js` | ÄNDERN | Nav-Item `theatre` (eigene Sektion „Theater" oberhalb von Overview, oder in Overview). |
| `frontend/src/locales/{en,de,it}.json` | ÄNDERN | `nav.theatre` + `pages.theatre.*`. |
| `frontend/src/services/appSettings.js` | ÄNDERN | Neues Setting `hlsBaseUrl` (Default `''` → Env-Fallback). |
| `frontend/src/components/pages/Settings.jsx` | ÄNDERN (opt.) | Feld `hlsBaseUrl` in der Settings-Seite (Gruppe „MediaMTX"). |

---

## 4. Stream-URL auflösen

MediaMTX HLS-Endpoint: `http://<host>:8888/<path>/index.m3u8`

Problem: Die UI kennt nur die **API**-Base-URL (`:9997`). Der HLS-Port (`:8888`) ist eine eigene MediaMTX-Config (`hlsAddress`).

**Lösung (Priorität):**

1. **App-Setting `hlsBaseUrl`** (localStorage, exakt wie das bestehende `apiBaseUrl`):
   - Auflösung: `appSettings.hlsBaseUrl || import.meta.env.VITE_MEDIAMTX_HLS_URL || ''`
   - Leer → Theater zeigt Hinweis „HLS-Base-URL nicht konfiguriert" (keine Tiles klickbar).
2. **Env-Default** `VITE_MEDIAMTX_HLS_URL` in `.env` / `.env.default` / `compose*.yml` (z. B. `http://localhost:8888`).
3. URL-Bau: `` `${hlsBase.replace(/\/+$/, '')}/${encodeURIComponent(path)}/index.m3u8` ``

**Kein Server-Code nötig.** (Alternative: `mediamtxHlsBaseUrl` als Server-Setting unter `/api/settings` — nur wenn die URL serverseitig bekannt sein soll; für v1 überdimensioniert.)

---

## 5. hls.js-Integration (aus der API-Doku)

### 5.1 Setup & Support-Check

```js
import Hls from 'hls.js';

if (Hls.isSupported()) {
  // MSE verfügbar → hls.js-Pfad
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  // Safari/iOS: nativer HLS → video.src = url (kein hls.js)
} else {
  // kein HLS möglich → Fehlerzustand
}
```

### 5.2 Lebenszyklus (in `useHlsPlayer.js`)

```
Mount:
  hls = new Hls(config)
  hls.attachMedia(video)
  hls.on(Hls.Events.MANIFEST_PARSED, () => video.play())
  hls.on(Hls.Events.ERROR, onHlsError)

Pfad gewählt (User-Gesture):
  hls.loadSource(url)          // Streamwechsel auf derselben Instanz
  video.play()                 // Klick = User-Gesture → Audio erlaubt

Unmount:
  hls.destroy()                // Ressourcen freigeben (Pflicht laut Doku)
```

### 5.3 Konfiguration (Live-Streams)

```js
new Hls({
  debug: false,
  capLevelToPlayerSize: true,      // Level an Player-Größe koppeln (Fullscreen)
  liveSyncDurationCount: 3,        // Default: 3× TargetDuration hinter Live-Edge
  maxBufferLength: 30,             // Default OK
  backBufferLength: 60,            // Live: Backbuffer begrenzen (Speicher)
  maxLiveSyncPlaybackRate: 1,      // Default (kein Playback-Rate-Catchup)
  // LoadPolicies: Defaults lassen (Timeouts/Retries sind sinnvoll)
});
```

### 5.4 Error-Handling (Doku: „Fatal Error Recovery")

```js
hls.on(Hls.Events.ERROR, (event, data) => {
  if (!data.fatal) return; // hls.js recovert selbst
  switch (data.type) {
    case Hls.ErrorTypes.MEDIA_ERROR:
      // gedrosselt (≥ 5 s Abstand), sonst Loop-Gefahr:
      hls.recoverMediaError();
      break;
    case Hls.ErrorTypes.NETWORK_ERROR:
      // z. B. Pfad offline / CORS → Tile auf Error-Zustand, kein Retry-Loop
      setStatus('error');
      break;
    default:
      hls.destroy();
      setStatus('error');
  }
});
```

Zusätzlich: `video.addEventListener('error', …)` für `MEDIA_ERR_DECODE` → `recoverMediaError()` (Doku-Sample, mit 5-s-Throttle).

### 5.5 Stream-Wechsel

- `hls.loadSource(newUrl)` — hls.js unterstützt Source-Wechsel auf bestehender Instanz.
- Fallback (falls Verhalten instabil): `hls.destroy()` + neue Instanz + `attachMedia` + `loadSource`.
- **Niemals** zwei `Hls`-Instanzen auf demselben `<video>` gleichzeitig.

---

## 6. UI/UX-Spezifikation

### 6.1 Seitenlayout

- `<video>`: `position: fixed; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #000; z-index: 0;`
- Kein Layout-Chrome (Route außerhalb `Layout`).
- Hintergrund ohne aktiven Stream: dunkle Fläche + zentrierter Hinweis „Pfad wählen" (i18n).

### 6.2 Tile-Strip (Vordergrund)

- Position: **unten mittig**, `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 10;`
- Flex-Row, `gap: 12px`, `max-width: min(90vw, 1200px)`, `overflow-x: auto` (viele Pfade → horizontales Scrollen).
- Tile: **16:9**, ca. `160×90 px`, `border-radius: var(--radius)`, halbtransparenter dunkler Hintergrund (`color-mix` mit `--color-surface`), `box-shadow: var(--shadow-md)`.
- Tile-Inhalt: Video-Kamera-Icon (SVG, inline), Pfadname (1 Zeile, `text-overflow: ellipsis`), Status-Dot (grün = online, grau = offline).
- **Dummy-Bild:** bewusst kein echtes Vorschau-Video (s. §2.3).
- States:
  - `default`: neutral, Hover → leicht anheben (`transform: translateY(-2px)`).
  - `active`: Rand in `--color-primary`, leicht skaliert (`scale(1.05)`), Play-Overlay-Icon.
  - `loading`: Spinner im Tile.
  - `error`: roter Dot + Tile abgedunkelt.
  - `offline`: abgedunkelt, aber klickbar (Versuch → Error-State).

### 6.3 Top-Bar (Vordergrund, dezent)

- Links: Exit-Button (`←` / `Esc`) → verlässt `/theatre` (navigate `-1` bzw. `/`).
- Rechts: Mute/Unmute-Toggle, Fullscreen-Toggle (Fullscreen-API auf `document.documentElement`), aktueller Pfadname.
- Auto-Hide: nach 3 s ohne Mausbewegung `opacity: 0` (Hover/Mausbewegung → sichtbar).

### 6.4 Interaktion

| Aktion | Effekt |
|--------|--------|
| Klick auf inaktiven Tile | Stream startet (User-Gesture → Audio erlaubt), Tile wird `active`. |
| Klick auf aktiven Tile | Stream stoppt, Tile wird inaktiv. |
| Klick auf anderen Tile | `loadSource` → Streamwechsel, alte Instanz bleibt. |
| `Esc` | Stream stoppen (oder Fullscreen verlassen, wenn aktiv). |
| `←` / `→` | Optional: zum vorherigen/nächsten Tile springen (Nice-to-have). |
| Mute-Toggle | `video.muted` flippen. |
| Fullscreen-Toggle | `requestFullscreen()` / `exitFullscreen()`. |

### 6.5 Autoplay & Audio

- Start **nur** nach Klick (User-Gesture) → Browser-Blockierung von Audio-Autoplay umgangen.
- Default: **unmuted** (User hat explizit gewählt), Mute-Button verfügbar.

---

## 7. Datenfluss

```
Theatre.jsx
  ├─ useListQuery(QUERY_KEYS.runtimePaths, p => api.get('/paths/list', p),
  │     { itemsPerPage: 500, refetchInterval: useAutoRefresh() })
  │     → alle Pfade (online + offline)
  ├─ activePath: string | null          (lokaler State)
  ├─ useHlsPlayer(videoRef, activePath ? buildHlsUrl(activePath) : null)
  │     → { status: 'idle'|'loading'|'playing'|'error' }
  └─ PathTile[] (aus items, mit active/loading/error-Mapping)
```

- **Alle** Pfade anzeigen (nicht nur aktive) — offline-Tiles abgedunkelt.
- `itemsPerPage: 500` reicht für realistische Pfad-Anzahlen; bei Bedarf Pagination nachladen (v1: nein).

---

## 8. i18n-Keys (en/de/it)

```jsonc
"nav": { "theatre": "Theater" },
"pages": {
  "theatre": {
    "title": "Theater",
    "subtitle": "Live-Streams fullscreen ansehen",
    "selectPath": "Pfad unten wählen, um den Stream zu starten",
    "noPaths": "Keine Pfade gefunden",
    "hlsNotConfigured": "HLS-Base-URL nicht konfiguriert (Settings → hlsBaseUrl)",
    "hlsUnsupported": "Browser unterstützt kein HLS",
    "streamError": "Stream-Fehler",
    "stop": "Stopp",
    "mute": "Stummschalten",
    "unmute": "Ton an",
    "fullscreen": "Vollbild",
    "exitFullscreen": "Vollbild beenden",
    "back": "Zurück"
  }
}
```

---

## 9. Akzeptanzkriterien

- [x] `/theatre` erreichbar über Sidebar (eigene Sektion) und URL.
- [x] Alle Pfade aus `/paths/list` als Tiles unten mittig, nebeneinander, horizontal scrollbar.
- [x] Tile = Dummy (Icon + Name + Online-Dot), **kein** echtes Vorschau-Video.
- [x] Klick → Stream läuft fullscreen **hinter** den Tiles, Tiles bleiben klickbar (PiP-Prinzip).
- [x] Klick auf zweiten Tile → sauberer Streamwechsel (keine Doppel-Instanz, kein Leak).
- [x] Klick auf aktiven Tile / `Esc` → Stream stoppt, `hls.destroy()` bzw. `loadSource`-Stopp.
- [x] Offline-Pfad → Error-State am Tile, keine Crash/Retry-Loop.
- [x] Safari: nativer-HLS-Fallback funktioniert.
- [x] Unmount → keine hängenden HLS-Verbindungen (DevTools Network prüfen).
- [x] i18n: en/de/it vollständig.
- [x] `npm run lint` + `npm run build` (frontend) grün.
- [x] Manueller E2E-Check via `docker exec mediamtx-ui …` (Dev-Architektur laut AGENTS.md).

---

## 10. Risiken & offene Punkte

| Risiko | Einschätzung / Gegenmaßnahme |
|--------|------------------------------|
| **CORS**: UI-Origin ≠ MediaMTX-Origin (z. B. Vite `:5173` vs. `:8888`) → hls.js lädt m3u8/Segments per XHR → CORS nötig. | MediaMTX-Setting `hlsAllowOrigin: '*'` (bzw. UI-Origin) in `mediamtx.yml` setzen. **In Dev-Setup prüfen!** |
| Autoplay mit Audio | Nur nach User-Gesture (Klick) starten → OK. |
| Viele Pfade | Horizontaler Scroll; Tile-Breite fix. |
| Bandbreite | Nur 1 Stream aktiv → unkritisch. |
| `loadSource`-Wechsel instabil (Browser-Edge-Cases) | Fallback: Destroy + Re-Create (in `useHlsPlayer` als 2. Code-Pfad). |
| Safari: kein MSE | Nativer-HLS-Fallback (§5.1). |
| Pfadnamen mit Sonderzeichen | `encodeURIComponent(path)` im URL-Bau. |

---

## 11. Bewusst NICHT in v1 (Backlog)

- **Echte Vorschau-Videos** in den Tiles (N parallele HLS-Verbindungen, Bandbreite) — oder WebRTC-Snapshots.
- **Multi-View** (2×2 / 3×3 Grid) — würde mehrere `<video>` + `Hls`-Instanzen erfordern.
- **Audio-Mixing** mehrerer Streams.
- **Keyboard-Navigation** `←`/`→` (Nice-to-have, s. §6.4).
- **Server-Setting** `mediamtxHlsBaseUrl` (nur wenn UI-Origin serverseitig unbekannt ist).

---

## 12. Roadmap: 10 Phasen

> **Stand:** 2026-10-22 — alle Phasen 1–10 abgeschlossen (Phase 10: Integration & Testing grün).
> **Legende:** ✅ erledigt · 🚧 teilweise · ⬜ offen
> **Aufbau:** 10 Phasen, sequenziell. Eine Phase ist abgeschlossen, wenn alle Akzeptanzkriterien grün sind.
> **Abhängigkeiten:** P2 braucht P1 · P4 braucht P2 + P3 · P5–P9 brauchen P4 · P10 braucht alles.

### Status-Übersicht

| Phase | Fortschritt | Aufwand |
|-------|-------------|---------|
| Phase 1: Konfiguration & Stream-URL | 4/4 | 2/10 |
| Phase 2: hls.js-Kern (`useHlsPlayer`) | 7/7 | 8/10 |
| Phase 3: Tile & Styling | 4/4 | 5/10 |
| Phase 4: Theater-Seite | 4/4 | 6/10 |
| Phase 5: Routing & Navigation | 3/3 | 2/10 |
| Phase 6: Top-Bar & Controls | 4/4 | 4/10 |
| Phase 7: Interaktion & Keyboard | 3/3 | 3/10 |
| Phase 8: Error-States & Edge-Cases | 4/4 | 4/10 |
| Phase 9: i18n & Polish | 3/3 | 3/10 |
| Phase 10: Integration & Testing | 5/5 | 4/10 |

**Gesamt: 41/41 Schritte · Gesamtaufwand: 41/100**

---

### Phase 1: Konfiguration & Stream-URL · Aufwand 2/10

> Basis für alles: die UI muss wissen, wo der HLS-Server läuft (API-Port `:9997` ≠ HLS-Port `:8888`).

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 1.1 | `services/appSettings.js`: `hlsBaseUrl` in `APP_SETTINGS_DEFAULTS` (Default `''`) | Setting lesbar/setzbar, Pattern wie `apiBaseUrl` | ✅ |
| 1.2 | `.env` / `.env.default` / `compose*.yml`: `VITE_MEDIAMTX_HLS_URL=http://localhost:8888` | Env in allen 3 Dateien, Dev-Setup liefert Wert | ✅ |
| 1.3 | `utils/buildHlsUrl.js`: `buildHlsUrl(path)` (trailing-slash-Strip + `encodeURIComponent`) | `buildHlsUrl('cam/1')` → `http://host:8888/cam%2F1/index.m3u8` | ✅ |
| 1.4 | CORS: `hlsAllowOrigin` in `mediamtx.yml` (Dev + Prod) prüfen/setzen | Preflight-Request UI-Origin → `:8888` liefert `Access-Control-Allow-Origin` | ✅ |

**Abnahme Phase 1:** In Dev-Setup (Docker) lädt `http://localhost:8888/<path>/index.m3u8` aus dem Browser ohne CORS-Fehler.

---

### Phase 2: hls.js-Kern — `useHlsPlayer.js` · Aufwand 8/10

> Das Herzstück. Kapselt den kompletten hls.js-Lebenszyklus. Kein hls.js-Code außerhalb dieses Hooks.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 2.1 | Hook-Signatur: `useHlsPlayer(videoRef, url \| null)` → `{ status: 'idle'\|'loading'\|'playing'\|'error' }` | Hook mountet/demountet sauber, `url=null` → kein Load | ✅ |
| 2.2 | Support-Check: `Hls.isSupported()` + Safari-Fallback (`canPlayType('application/vnd.apple.mpegurl')` → `video.src`) | Chrome: hls.js-Pfad · Safari: nativer Pfad · beide: `status` korrekt | ✅ |
| 2.3 | Lebenszyklus: `new Hls(config)` → `attachMedia(video)` → `loadSource(url)`; Unmount → `hls.destroy()` | Network-Tab: nach Unmount keine offenen HLS-Requests | ✅ |
| 2.4 | Config: `capLevelToPlayerSize: true`, `liveSyncDurationCount: 3`, `backBufferLength: 60`, `maxBufferLength: 30` | Live-Stream startet ~3×TargetDuration hinter Edge, RAM stabil | ✅ |
| 2.5 | `Hls.Events.ERROR` (fatal): `MEDIA_ERROR` → `recoverMediaError()` (5-s-Throttle) · `NETWORK_ERROR` → `status='error'` · sonst → `destroy()` + `status='error'` | Kein Crash, kein Retry-Loop, Status wechselt sichtbar | ✅ |
| 2.6 | `video.addEventListener('error', …)` für `MEDIA_ERR_DECODE` → `recoverMediaError()` (Doku-Sample, 5-s-Throttle) | Decode-Fehler recovert ohne manuellen Reload | ✅ |
| 2.7 | Stream-Wechsel: `hls.loadSource(newUrl)` auf derselben Instanz; Fallback-Pfad Destroy + Re-Create | 10× schneller Tile-Wechsel: keine Doppel-Instanz, kein Leak | ✅ |

**Abnahme Phase 2:** Isoliert testbar (z. B. via temporäres Test-Page oder Storybook-artiges Dev-Setup): Stream startet, wechselt, stoppt, recovert — ohne sichtbare Seite.

---

### Phase 3: Tile & Styling · Aufwand 5/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 3.1 | `components/theatre/PathTile.jsx`: Props `{ name, online, active, loading, error, onClick }` | Alle 5 Zustände rendern, `onClick` durchgereicht | ✅ |
| 3.2 | `style/components/theatre.css`: Tile 16:9 (~160×90), States (default/hover/active/loading/error/offline), Strip-Layout (unten mittig, `overflow-x: auto`) | Nur CSS-Variablen aus `variables.css`, keine Hardcodes | ✅ |
| 3.3 | `style/components/index.css`: `@import './theatre.css';` | Build ohne fehlende Styles | ✅ |
| 3.4 | Inline-SVG-Icons: Kamera, Play, Spinner (keine neue Icon-Dependency) | Icons in allen Zuständen sichtbar, Dark/Light OK | ✅ |

**Abnahme Phase 3:** Tile-Strip mit 10 Mock-Tiles (Dummy-Daten) zeigt alle Zustände korrekt, horizontal scrollbar.

---

### Phase 4: Theater-Seite · Aufwand 6/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 4.1 | `pages/Theatre.jsx`: `useListQuery(QUERY_KEYS.runtimePaths, …, { itemsPerPage: 500, refetchInterval: useAutoRefresh() })` | Alle Pfade (online + offline) geladen, Auto-Refresh aktiv | ✅ |
| 4.2 | State: `activePath` (string \| null) + Status-Mapping auf Tiles (active/loading/error) | Klick setzt `activePath`, Tile-States folgen | ✅ |
| 4.3 | `<video>` (fixed, z-0, `object-fit: contain`) + `useHlsPlayer`-Verdrahtung | Klick → Stream fullscreen hinter den Tiles, Tiles bleiben klickbar | ✅ |
| 4.4 | Empty-States: keine Pfade / `hlsBaseUrl` leer / HLS unsupported (jeweils i18n-Text) | Jeder Zustand zeigt klaren Hinweis, kein White-Screen | ✅ |

**Abnahme Phase 4:** Kern-Use-Case läuft: Pfad wählen → Stream läuft → anderer Pfad → Wechsel → aktiver Pfad → Stopp.

---

### Phase 5: Routing & Navigation · Aufwand 2/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 5.1 | `App.jsx`: Route `theatre` **außerhalb** der `<Route element={<Layout />}>`-Gruppe | `/theatre` ohne Sidebar/TopBar, Browser-Back funktioniert | ✅ |
| 5.2 | `navItems.js`: neue Sektion „Theater" (oberhalb von Overview) mit Item `theatre` | Sidebar-Link sichtbar, Active-State auf `/theatre` | ✅ |
| 5.3 | `titleKeyForPath` prüfen (Theater hat keine Sub-Pfade) | Kein falscher Titel in TopBar anderer Seiten | ✅ |

**Abnahme Phase 5:** `/theatre` über Sidebar und URL erreichbar, Navigation dorthin/von dort sauber.

---

### Phase 6: Top-Bar & Controls · Aufwand 4/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 6.1 | Exit-Button links (`←`) → `navigate(-1)` | Verlässt Theater, Stream wird gestoppt (Unmount) | ✅ |
| 6.2 | Mute/Unmute-Toggle rechts (`video.muted`) | Toggle wirkt sofort, Icon wechselt | ✅ |
| 6.3 | Fullscreen-Toggle rechts (Fullscreen-API auf `document.documentElement`) | Vollbild an/aus, `fullscreenchange`-Event aktualisiert Icon | ✅ |
| 6.4 | Auto-Hide: Top-Bar nach 3 s ohne Mausbewegung `opacity: 0`; Maus/Hover → sichtbar | Bar blockiert nie dauerhaft die Interaktion | ✅ |

**Abnahme Phase 6:** Alle 4 Controls funktional, Auto-Hide stört nicht.

---

### Phase 7: Interaktion & Keyboard · Aufwand 3/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 7.1 | Klick-Logik: inaktiv → Start · aktiv → Stopp · anderer → Wechsel (User-Gesture → Audio erlaubt) | Alle 3 Fälle pro §6.4-Spezifikation | ✅ |
| 7.2 | `Esc`: Stream stoppen (bzw. Fullscreen verlassen, wenn aktiv) | `Esc` verhält sich kontextabhängig korrekt | ✅ |
| 7.3 | `←`/`→`: zum vorherigen/nächsten Tile springen (Nice-to-have) | Navigation ohne Maus möglich | ✅ |

**Abnahme Phase 7:** Kompletter Workflow nur per Tastatur durchführbar.

---

### Phase 8: Error-States & Edge-Cases · Aufwand 4/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 8.1 | Offline-Pfad geklickt → Tile-Error-State (roter Dot, abgedunkelt), kein Crash | Fehler sichtbar, andere Tiles bleiben nutzbar | ✅ |
| 8.2 | CORS-Fehler → klare Meldung (nicht generischer „Stream-Fehler") | Meldung weist auf `hlsAllowOrigin`/`hlsBaseUrl` hin | ✅ |
| 8.3 | > 10 Pfade → horizontaler Scroll, aktiver Tile bleibt sichtbar (auto-scroll in View) | 20 Mock-Pfade: Scroll + Auto-Scroll OK | ✅ |
| 8.4 | Pfadnamen mit Sonderzeichen (`/`, `#`, Umlaute) | `encodeURIComponent` hält, Stream startet | ✅ |

**Abnahme Phase 8:** Kein einziger Crash-Pfad; jeder Fehler zeigt eine verständliche Meldung.

---

### Phase 9: i18n & Polish · Aufwand 3/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 9.1 | i18n-Keys `nav.theatre` + `pages.theatre.*` in `en.json`, `de.json`, `it.json` (s. §8) | Keine fehlenden Keys (Console-Check), alle 3 Sprachen vollständig | ✅ |
| 9.2 | Responsive: Mobile (Tile-Breite, Strip, Top-Bar) + Dark/Light-Theme | 375 px breit: alles nutzbar, beide Themes OK | ✅ |
| 9.3 | Accessibility: `aria-label` auf Tiles/Buttons, Fokus-States, Tiles per Tab+Enter bedienbar | Screenreader-Test (oder a11y-DevTools) ohne Blocker | ✅ |

**Abnahme Phase 9:** Feature in allen 3 Sprachen, auf Mobile und Desktop, in beiden Themes vollständig bedienbar.

---

### Phase 10: Integration & Testing · Aufwand 4/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 10.1 | `npm run lint` (frontend) grün | 0 Errors, 0 Warnings | ✅ |
| 10.2 | `npm run build` (frontend) grün | Production-Build ohne Fehler | ✅ |
| 10.3 | Manueller E2E via `docker exec mediamtx-ui …` (Dev-Architektur AGENTS.md): Start, Wechsel, Stopp, Fehler, Safari-Fallback | Alle Akzeptanzkriterien aus §9 grün | ✅ |
| 10.4 | Leak-Check: DevTools Network + Memory nach 10× Wechsel + Unmount | Keine offenen HLS-Requests, Heap stabil | ✅ |
| 10.5 | `.HANDOFF_STATE.md` aktualisieren (Status COMPLETED, nächste Optionen aus §11) | Handoff-Datei aktuell | ✅ |

**Abnahme Phase 10:** Feature produktionsreif. Alle 12 Akzeptanzkriterien aus §9 erfüllt.

---

### Meilensteine

| Meilenstein | Phasen | Ergebnis |
|-------------|--------|----------|
| **M1: Stream läuft** | 1–4 | Klick auf Tile → Stream fullscreen (ohne Chrome, ohne Controls) |
| **M2: Bedienbar** | 5–7 | Navigation, Controls, Keyboard — kompletter Workflow |
| **M3: Robust** | 8–9 | Fehlerfälle, i18n, Mobile, A11y |
| **M4: Fertig** | 10 | Lint/Build/E2E grün, produktionsreif |
