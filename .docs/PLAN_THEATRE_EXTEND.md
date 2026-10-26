# Konzept: THEATRE EXTEND — Multi-View (Grid + PiP) & Responsive Buttons

> **Stand:** 2026-10-26 — **implementiert ✅** (alle 5 Phasen abgeschlossen, Build + SSR-Smoke-Tests + Browser-E2E grün).
> - Basis: `THEATRE.md` (Single-View, implementiert ✅)
> - Frontend-Grundlagen: siehe `INITIAL_FRONTEND.md`
> - Doku-Stil-Vorbild: `THEATRE.md`, `PLAN_RECORDS_PLAYER.md`
>
> **Ziel:** `/theatre`-Seite erweitern um:
> 1. **Responsive Buttons** — Top-Bar-Buttons responsiv; auf Mobile kleiner **ohne Icon** (nur Text).
> 2. **Grid-View** — Toggle zwischen Single-View und Grid-View, in der **alle Streams gleichzeitig** abgespielt werden.
> 3. **PiP-View** — Picture-in-Picture: ein Stream **groß**, die anderen **klein zum Anklicken** (Klick → Stream wird groß).
>
> **Kernprinzip:** **Frontend-only.** Neue `StreamPlayer`-Komponente kapselt `<video>` + `useHlsPlayer` pro Stream. Grid/PiP rendern N `StreamPlayer`-Instanzen. **Single-View bleibt unverändert.**

---

## 1. Ist-Zustand (Relevanz für das Konzept)

| Fakt | Detail |
|------|--------|
| Single-View | `Theatre.jsx`: ein `<video>` (fixed, z-0) + `useHlsPlayer` + Tile-Strip (Dummy-Tiles, z-10). **Nur 1 Stream aktiv.** |
| `useHlsPlayer` | Kapselt hls.js-Lebenszyklus für **ein** `<video>`. `url=null` → Stopp. Unmount → `destroy()`. Wiederverwendbar pro Komponente. |
| Top-Bar | `TheatreTopBar.jsx`: Back, Mute, Fullscreen — **Icon-only** (lucide-react), 36 px (Desktop) / 40 px (Mobile). **Kein Text.** Auto-Hide. |
| i18n | `pages.theatre.*` (en/de/it) vorhanden. |
| Styling | Plain CSS, BEM, `style/components/theatre.css` (Import über `index.css`). |
| HLS-URL | `buildHlsUrl(path)` → `hlsBaseUrl/<path>/index.m3u8`. |
| Pfade | `useListQuery(QUERY_KEYS.runtimePaths, …)` → `items[]` mit `name`, `online`. |

**Fazit:** Feature = **Frontend-only.** Neue `StreamPlayer`-Komponente + Grid/PiP-Layouts + Responsive-Buttons + View-Switcher. Single-View bleibt.

---

## 2. Architektur

```
┌──────────────────────────────────────────────────────────────────────┐
│  z-10  Top-Bar:  [Back]  [Single | Grid | PiP]  [Mute]  [Fullscreen] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  viewMode = 'single' (aktuell, unverändert):                         │
│    z-0   <video> (fixed, bg)  +  z-10 Tile-Strip (Dummy-Tiles)      │
│                                                                      │
│  viewMode = 'grid' (NEU):                                            │
│    Grid von N <StreamPlayer> — alle Streams spielen gleichzeitig     │
│                                                                      │
│  viewMode = 'pip' (NEU):                                             │
│    1 großer <StreamPlayer> (focused)  +                              │
│    Reihe kleiner <StreamPlayer> (Klick → promote)                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Kernentscheidungen:**

1. **Neue `StreamPlayer`-Komponente.** Kapselt `<video>` + `useHlsPlayer` + Status-Overlays (Loading/Error) + Name-Label. **Pro Stream eine Instanz.** Wiederverwendbar in Grid + PiP.
2. **Single-View bleibt unverändert.** Ein `<video>` + Tile-Strip (Dummy). `useHlsPlayer` direkt in `Theatre.jsx`.
3. **Grid/PiP rendern N `StreamPlayer`.** Bei View-Wechsel unmountet/mountet React → hls.js-Lebenszyklus **automatisch sauber** (Unmount → `destroy()`, kein Leak).
4. **Autoplay mit Mute.** Grid/PiP-Streams starten **muted** (Browser-Autoplay-Policy erlaubt nur muted Autoplay). Mute-Toggle steuert alle Streams.
5. **View-Switcher als Segmented-Control** (3 Optionen: Single / Grid / PiP) in der Top-Bar.
6. **Responsive Buttons.** Icon + Text (Desktop), **nur Text + kleiner** (Mobile ≤ 768 px, Icon ausgeblendet).

---

## 3. Komponenten & Dateien

| Datei | Typ | Aufgabe |
|-------|-----|---------|
| `frontend/src/components/theatre/StreamPlayer.jsx` | **NEU** | Ein Stream: `<video>` + `useHlsPlayer` + Status-Overlays + Name. Props: `name`, `online`, `muted`, `focused`, `onClick`. |
| `frontend/src/components/pages/Theatre.jsx` | ÄNDERN | `viewMode`-State, `muted`-State, `focusedPath`-State. Conditional Render: Single / Grid / PiP. |
| `frontend/src/components/theatre/TheatreTopBar.jsx` | ÄNDERN | View-Switcher (Segmented-Control) + Responsive-Buttons (Icon + Text). |
| `frontend/src/style/components/theatre.css` | ÄNDERN | Grid/PiP-Layouts, `StreamPlayer`-Styles, Responsive-Buttons, View-Switcher. |
| `frontend/src/locales/{en,de,it}.json` | ÄNDERN | Neue i18n-Keys (`viewSingle`, `viewGrid`, `viewPip`, `viewModeAria`, `playerAria`). |

---

## 4. StreamPlayer-Komponente

### 4.1 `StreamPlayer.jsx` (NEU)

```jsx
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useHlsPlayer } from '../../hooks/useHlsPlayer';
import { buildHlsUrl } from '../../utils/buildHlsUrl';

export default function StreamPlayer({ name, online, muted = true, focused = false, onClick }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const url = buildHlsUrl(name);
  const { status, errorKind } = useHlsPlayer(videoRef, url);

  // Mute-Prop auf das <video> anwenden (Autoplay-Policy).
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted, videoRef]);

  const classes = [
    'theatre-player',
    focused ? 'is-focused' : '',
    !online ? 'is-offline' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={t('pages.theatre.playerAria', { name, focused: focused ? t('common.online') : '' })}
    >
      <video ref={videoRef} className="theatre-player__video" playsInline />
      {status === 'loading' && (
        <div className="theatre-player__overlay" aria-hidden="true">
          <Loader2 size={24} className="theatre-player__spinner" />
        </div>
      )}
      {status === 'error' && (
        <div className="theatre-player__overlay theatre-player__overlay--error" role="alert">
          <AlertTriangle size={24} />
          <span className="theatre-player__error-text">{name}</span>
        </div>
      )}
      <span className="theatre-player__name">{name}</span>
    </div>
  );
}
```

**Hinweise:**
- `muted` default `true` (Autoplay-Policy). Single-View übergibt `muted={false}` (nach User-Gesture).
- `focused` → CSS-Klasse `is-focused` (hervorhebender Rand).
- `onClick` → PiP-Mode: promote Stream (setzt `focusedPath`).
- Status-Overlays: Loading (Spinner), Error (Icon + Name).
- `useHlsPlayer` pro Instanz → **nie** zwei `Hls`-Instanzen auf demselben `<video>`.

---

## 5. View-Modi & Layouts

### 5.1 Single-View (unverändert)

Aktuelles Design: ein `<video>` (fixed, z-0) + Tile-Strip (Dummy-Tiles, z-10). `useHlsPlayer` direkt in `Theatre.jsx`. **Keine Änderung.**

### 5.2 Grid-View (NEU)

Alle Streams gleichzeitig in einem Grid. Grid-Abmessungen basierend auf Stream-Anzahl (balanciert):

```js
const n = items.length;
const cols = Math.ceil(Math.sqrt(n));
const rows = Math.ceil(n / cols);
// grid-template-columns: repeat(cols, 1fr)
// grid-template-rows: repeat(rows, 1fr)
```

```jsx
<div
  className="theatre-grid"
  style={{
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
  }}
>
  {items.map((item) => (
    <StreamPlayer key={item.name} name={item.name} online={item.online} muted={muted} />
  ))}
</div>
```

**CSS:**
```css
.theatre-grid {
  display: grid;
  gap: var(--space-2);
  height: 100vh;
  padding: var(--space-3);
  box-sizing: border-box;
}
```

### 5.3 PiP-View (NEU)

Ein Stream groß (focused), die anderen klein (Klick → promote).

```jsx
<div className="theatre-pip">
  <div className="theatre-pip__main">
    <StreamPlayer name={focusedPath} online={focusedOnline} muted={muted} focused />
  </div>
  <div className="theatre-pip__thumbs">
    {items
      .filter((it) => it.name !== focusedPath)
      .map((item) => (
        <StreamPlayer
          key={item.name}
          name={item.name}
          online={item.online}
          muted={muted}
          onClick={() => setFocusedPath(item.name)}
        />
      ))}
  </div>
</div>
```

**CSS:**
```css
.theatre-pip {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: var(--space-3);
  gap: var(--space-2);
  box-sizing: border-box;
}
.theatre-pip__main {
  flex: 1;
  min-height: 0;
}
.theatre-pip__thumbs {
  display: flex;
  gap: var(--space-2);
  height: 120px;
  overflow-x: auto;
}
.theatre-pip__thumbs .theatre-player {
  flex: none;
  width: 160px;
}
```

**Interaktion:** Klick auf kleinen Stream → `setFocusedPath(name)` → Stream wird groß, bisheriger Focused wird klein.

---

## 6. Responsive Buttons (Top-Bar)

### 6.1 Anforderung

- Buttons **responsiv** (Flex, Wrap bei Bedarf).
- **Mobile (≤ 768 px):** kleiner, **ohne Icon** (nur Text).
- **Desktop:** Icon + Text.

### 6.2 Umsetzung

`TheatreTopBar.jsx`: Buttons mit Icon + Text-Label.

```jsx
<button type="button" className="theatre-topbar__btn" onClick={onExit}>
  <ArrowLeft size={16} className="theatre-topbar__btn-icon" />
  <span className="theatre-topbar__btn-label">{t('pages.theatre.back')}</span>
</button>
```

**CSS:**
```css
.theatre-topbar__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  font-size: var(--fs-sm);
}
.theatre-topbar__btn-icon {
  flex: none;
}

@media (max-width: 768px) {
  .theatre-topbar__btn {
    padding: var(--space-1);
    font-size: var(--fs-xs);
  }
  .theatre-topbar__btn-icon {
    display: none; /* Mobile: ohne Icon */
  }
}
```

### 6.3 View-Switcher (Segmented-Control)

3 Optionen: Single / Grid / PiP.

```jsx
<div className="theatre-topbar__viewswitcher" role="tablist" aria-label={t('pages.theatre.viewModeAria')}>
  {['single', 'grid', 'pip'].map((mode) => (
    <button
      key={mode}
      type="button"
      role="tab"
      aria-selected={viewMode === mode}
      className={`theatre-topbar__viewbtn${viewMode === mode ? ' is-active' : ''}`}
      onClick={() => onViewModeChange(mode)}
    >
      {t(`pages.theatre.view${mode.charAt(0).toUpperCase()}${mode.slice(1)}`)}
    </button>
  ))}
</div>
```

**CSS:**
```css
.theatre-topbar__viewswitcher {
  display: inline-flex;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.theatre-topbar__viewbtn {
  padding: var(--space-1) var(--space-2);
  font-size: var(--fs-sm);
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: none;
  cursor: pointer;
}
.theatre-topbar__viewbtn.is-active {
  background: var(--color-primary);
  color: #fff;
}
```

---

## 7. State & Datenfluss

```
Theatre.jsx
  ├─ viewMode: 'single' | 'grid' | 'pip'   (default 'single')
  ├─ activePath: string | null             (Single-View)
  ├─ focusedPath: string | null            (PiP-View, default: erster online-Pfad)
  ├─ muted: boolean                        (default false; Grid/PiP → true bei Entry)
  ├─ items: alle Pfade (useListQuery)
  │
  ├─ <TheatreTopBar viewMode onViewModeChange muted onMuteToggle activePath onExit />
  │
  └─ content by viewMode:
       ├─ single: <video> (bg) + Tile-Strip (aktuell)
       ├─ grid:   <div class="theatre-grid"> {items.map(<StreamPlayer/>)} </div>
       └─ pip:    <div class="theatre-pip">
                     <StreamPlayer large focused={focusedPath}/>
                     <div class="theatre-pip__thumbs"> {others.map(<StreamPlayer small/>)} </div>
                   </div>
```

**View-Wechsel:**
- `viewMode` ändert sich → React unmountet altes Layout, mountet neues → hls.js-Lebenszyklus **automatisch sauber**.
- Bei Entry in Grid/PiP: `muted = true` (Autoplay). `focusedPath` = `activePath` oder erster online-Pfad.
- Bei Entry in Single: `activePath` = `focusedPath` (falls gesetzt) oder `null`.

**Mute-Logik:**
- Single-View: `muted` default `false` (nach User-Gesture). Mute-Toggle flippt.
- Grid/PiP: `muted` default `true` (Autoplay). Mute-Toggle flippt (alle Streams).

---

## 8. i18n-Keys (en/de/it)

```jsonc
"pages": {
  "theatre": {
    // … bestehende Keys …
    "viewSingle": "Single",
    "viewGrid": "Grid",
    "viewPip": "PiP",
    "viewModeAria": "View mode",
    "playerAria": "{{name}} ({{focused}})"
  }
}
```

---

## 9. Akzeptanzkriterien

- [x] Top-Bar-Buttons responsiv; Mobile kleiner **ohne Icon** (nur Text).
- [x] View-Switcher (Single/Grid/PiP) in der Top-Bar, klickbar, Active-State.
- [x] Single-View unverändert (ein Stream + Tile-Strip).
- [x] Grid-View: alle Streams gleichzeitig in einem Grid, Grid-Abmessungen basierend auf Stream-Anzahl.
- [x] PiP-View: ein Stream groß, andere klein, Klick → promote.
- [x] Autoplay: Grid/PiP-Streams starten muted, Mute-Toggle steuert alle.
- [x] View-Wechsel: hls.js-Lebenszyklus sauber (kein Leak), DevTools Network prüfen.
- [x] i18n: en/de/it vollständig.
- [x] `npm run build` (frontend) grün.
- [x] Manueller E2E via `docker exec mediamtx-ui …`.

---

## 10. Risiken & offene Punkte

| Risiko | Einschätzung / Gegenmaßnahme |
|--------|------------------------------|
| **Autoplay-Policy** | Grid/PiP-Streams starten muted (Autoplay erlaubt). Mute-Toggle für Audio. |
| **Bandbreite** | Grid/PiP: N parallele HLS-Verbindungen. Bei vielen Streams hohe Bandbreite. |
| **hls.js-Lebenszyklus** | View-Wechsel → React unmount/mount → `destroy()` automatisch. Kein Leak. |
| **Viele Streams** | Grid: computed cols/rows. PiP: Thumbnails horizontal scrollbar. |
| **CORS** | Wie Single-View (`hlsAllowOrigin`). |

---

## 11. Roadmap: 5 Phasen

> **Legende:** ✅ erledigt · 🚧 teilweise · ⬜ offen
> **Aufbau:** 5 Phasen, sequenziell. Eine Phase ist abgeschlossen, wenn alle Akzeptanzkriterien grün sind.

### Status-Übersicht

| Phase | Fortschritt | Aufwand |
|-------|-------------|---------|
| Phase 1: StreamPlayer-Komponente | 4/4 | 4/10 |
| Phase 2: Grid-View | 3/3 | 4/10 |
| Phase 3: PiP-View | 3/3 | 4/10 |
| Phase 4: Responsive Buttons + View-Switcher | 3/3 | 3/10 |
| Phase 5: i18n + Integration + Testing | 4/4 | 3/10 |

**Gesamt: 17/17 Schritte · Gesamtaufwand: 18/50**

---

### Phase 1: StreamPlayer-Komponente · Aufwand 4/10

> Basis für Grid + PiP: eine wiederverwendbare Stream-Komponente.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 1.1 | `StreamPlayer.jsx`: `<video>` + `useHlsPlayer` + Status-Overlays + Name | Komponente rendert, Stream startet/stopp | ✅ |
| 1.2 | `muted`-Prop + `useEffect` (`video.muted`) | Mute wirkt sofort | ✅ |
| 1.3 | `focused`-Prop + CSS-Klasse `is-focused` | Focused-Stream visuell hervorgehoben | ✅ |
| 1.4 | `onClick` + Keyboard (Enter/Space) | Klick/Enter → promote (PiP) | ✅ |

**Abnahme Phase 1:** `StreamPlayer` isoliert testbar (Stream startet, Mute, Focused, Klick).

---

### Phase 2: Grid-View · Aufwand 4/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 2.1 | `Theatre.jsx`: `viewMode`-State + conditional Render (grid) | Grid-View rendert | ✅ |
| 2.2 | Grid-Layout (computed cols/rows) + CSS | Grid füllt Viewport, responsive | ✅ |
| 2.3 | Alle Streams muted (Autoplay) | Grid-Streams starten muted | ✅ |

**Abnahme Phase 2:** Grid-View zeigt alle Streams gleichzeitig, Grid-Layout korrekt.

---

### Phase 3: PiP-View · Aufwand 4/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 3.1 | `Theatre.jsx`: `focusedPath`-State + conditional Render (pip) | PiP-View rendert | ✅ |
| 3.2 | PiP-Layout (large + thumbs) + CSS | Large-Stream + Thumbnail-Reihe | ✅ |
| 3.3 | Klick auf Thumbnail → promote (`setFocusedPath`) | Klick → Stream wird groß | ✅ |

**Abnahme Phase 3:** PiP-View zeigt einen großen + kleine Streams, Klick promote.

---

### Phase 4: Responsive Buttons + View-Switcher · Aufwand 3/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 4.1 | `TheatreTopBar.jsx`: Buttons mit Icon + Text | Buttons zeigen Icon + Text | ✅ |
| 4.2 | Responsive CSS (Mobile: ohne Icon, kleiner) | Mobile: nur Text, kleiner | ✅ |
| 4.3 | View-Switcher (Segmented-Control) + CSS | Switcher klickbar, Active-State | ✅ |

**Abnahme Phase 4:** Buttons responsiv, View-Switcher funktional.

---

### Phase 5: i18n + Integration + Testing · Aufwand 3/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 5.1 | i18n-Keys (en/de/it) | Keine fehlenden Keys | ✅ |
| 5.2 | `npm run build` (frontend) grün | Production-Build ohne Fehler | ✅ |
| 5.3 | Manueller E2E via `docker exec mediamtx-ui …` | Alle Akzeptanzkriterien grün | ✅ |
| 5.4 | `.HANDOFF_STATE.md` aktualisieren | Handoff-Datei aktuell | ✅ |

**Abnahme Phase 5:** Feature produktionsreif.

---

### Meilensteine

| Meilenstein | Phasen | Ergebnis |
|-------------|--------|----------|
| **M1: StreamPlayer** | 1 | Wiederverwendbare Stream-Komponente |
| **M2: Multi-View** | 2–3 | Grid + PiP-Views |
| **M3: Bedienbar** | 4 | Responsive Buttons + View-Switcher |
| **M4: Fertig** | 5 | i18n/Build/E2E grün, produktionsreif |
