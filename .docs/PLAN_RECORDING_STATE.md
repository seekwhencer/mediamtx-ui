# PLAN_RECORDING_STATE — Aufnahme-Status (Recording State) in Runtime-Ansichten

> **Stand:** 2026-10-27
> **Ziel:** Den Aufnahme-Status eines Pfades (heute nur sichtbar unter `/config/paths`, Spalte „AUFNAHME") zusätzlich in **vier Runtime-Ansichten** anzeigen:
> 1. **Laufzeitpfade** — `/paths` (`RuntimePaths.jsx`)
> 2. **Dashboard** — `/` (`PathsCard.jsx`)
> 3. **Pfad-Detail** — `/paths/:name` (`RuntimePathDetail.jsx`)
> 4. **Theater** — `/theatre` (`Theatre.jsx` + `PathTile.jsx` + `StreamPlayer.jsx`)
>
> **NUR FRONTEND.** Kein Server-Code, keine neuen API-Endpunkte. Es werden ausschließlich **bestehende** MediaMTX-API-Endpunkte über die bestehende Bridge (`/v3`) abgerufen.
>
> **Quellen (Code):** `frontend/src/components/pages/ConfigPaths.jsx` (Referenz-Anzeige), `frontend/src/components/pages/RuntimePaths.jsx`, `frontend/src/components/dashboard/PathsCard.jsx`, `frontend/src/components/pages/RuntimePathDetail.jsx`, `frontend/src/components/pages/Theatre.jsx`, `frontend/src/components/theatre/PathTile.jsx`, `frontend/src/components/theatre/StreamPlayer.jsx`, `frontend/src/hooks/useApi.js`, `frontend/src/hooks/useAutoRefresh.js`, `frontend/src/services/queryKeys.js`, `frontend/src/components/ui/Badge.jsx`, `frontend/src/utils/constants.js`, `frontend/src/locales/{en,de,it}.json`.
> **Quellen (API):** `mediamtx/openapi.yml` (Schemas `Path`, `PathConf`), Live-API `http://localhost:3000/v3/...`.

---

## 1. Ziel & Nicht-Ziel

### Ziel
- Der Aufnahme-Status eines Pfades ist in **allen vier Runtime-Ansichten** auf einen Blick erkennbar — ohne Umweg über `/config/paths`.
- **Einheitliche Darstellung** über alle vier Ansichten (gleiche Komponente, gleiche Farben, gleiche i18n-Labels).
- **Live-Status:** Nicht nur die *Konfiguration* („dieser Pfad soll aufnehmen"), sondern der *tatsächliche* Zustand („dieser Pfad nimmt **gerade** auf") — weil in den Runtime-Ansichten der Online-Status bekannt ist.
- **Wiederverwendung:** Ein gemeinsamer Hook + eine gemeinsame Badge-Komponente, die an allen vier Stellen eingesetzt wird (kein Copy-Paste).
- i18n (en/de/it), Dark/Light, Wiederverwendung bestehender UI-Bausteine (`Badge`, `useAutoRefresh`, `useQuery`).

### Nicht-Ziel (v1)
- **Kein Server-Code.** Die Bridge (`MediaMTXBridge.js`) bleibt unverändert — sie proxied bereits `/config/paths/list` und `/config/path-defaults/get`.
- **Keine neuen API-Endpunkte**, kein WebSocket, kein Push.
- **Keine Änderung** der bestehenden `/config/paths`-Anzeige (die bleibt Referenz).
- **Keine Aufnahme-Steuerung** (Start/Stop) — nur Anzeige. (Extension-Punkt, §10.)
- **Keine Historie** („wann wurde zuletzt aufgenommen") — das macht die `/recordings`-Page.

---

## 2. Datenquelle & Merge-Logik (Kern des Konzepts)

### 2.1 Woher kommt der Aufnahme-Status?

Der Aufnahme-Status ist **keine** Runtime-Eigenschaft des Pfades. Er kommt aus der **Konfiguration**:

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `record` | `boolean` | `true` = „dieser Pfad nimmt (immer) auf", `false` = „keine Aufnahme". |

- **Quelle:** `GET /v3/config/paths/list` → jedes Item hat `name` + `record` (Schema `PathConf.record`, `openapi.yml:1103`).
- **Fallback:** `GET /v3/config/path-defaults/get` → `record` (gilt, wenn ein Pfad **keine** eigene Config hat).

> **Wichtig:** Die Runtime-API `GET /v3/paths/list` (Schema `Path`, `openapi.yml:964`) enthält **kein** `record`-Feld. Der Aufnahme-Status muss daher aus der Config geladen und mit den Runtime-Pfaden **gemerged** werden.

### 2.2 Merge-Key: `confName`

Jeder Runtime-Pfad trägt das Feld `confName` = Name der Config, die für ihn gilt. Damit lässt sich der Aufnahme-Status pro Pfad auflösen:

```
runtimePath.confName  ──►  config[name].record
```

**Live-Beispiel (Dev, 2026-10-27):**

| Pfad | `confName` | `online` | Config `record` | → Zustand |
|------|-----------|----------|-----------------|-----------|
| `one`  | `one`   | ✅ true  | `false` | **off** |
| `track`| `track` | ❌ false | `false` | **off** |
| `two`  | `two`   | ✅ true  | `true`  | **REC (aktiv)** |
| `walk` | `walk`  | ❌ false | `false` | **off** |

→ Nur `two` nimmt gerade auf. Das entspricht exakt der `/config/paths`-Spalte „AUFNAHME" (`two` = „an", Rest = „aus").

### 2.3 Drei-Zustands-Modell (empfohlen)

Da in den Runtime-Ansichten der **Online-Status** bekannt ist, wird aus `record` + `online` ein präziserer Live-Zustand:

| Zustand | Bedingung | Bedeutung | Darstellung |
|---------|-----------|-----------|-------------|
| **`rec`** (aktiv) | `record === true && online === true` | nimmt **gerade** auf | rotes Badge „REC" + **pulsierender** Punkt |
| **`armed`** (bereit) | `record === true && online === false` | Aufnahme konfiguriert, aber Pfad offline | amber Badge „REC" (ohne Puls) |
| **`off`** | `record === false` | keine Aufnahme | graues Badge „off"/„aus" |
| **`unknown`** | `record === undefined` | kein Config-Match + kein Default | graues Badge „–" |

> **Warum 3 Zustände statt 1?** Die Frage des Users ist „welcher Pfad nimmt **gerade** auf". `record=true` allein sagt nur „soll aufnehmen". Erst `record=true && online=true` bedeutet „nimmt jetzt auf". Die drei Zustände machen genau das sichtbar — und bleiben dabei vollständig kompatibel mit der `/config/paths`-Anzeige (dort wird nur `record` als an/aus gezeigt).
>
> **Minimal-Variante (falls gewünscht):** Nur `record` anzeigen (an/aus) — exakt wie `/config/paths`. Dann entfällt die `online`-Verfeinerung. Das 3-Zustands-Modell ist aber die empfohlene, informativere Lösung.

---

## 3. Architektur

```
┌──────────────────────────────────────────────────────────────────────┐
│  MediaMTX API (via Bridge /v3)                                       │
│  GET /config/paths/list        →  [{ name, record, ... }, ...]       │
│  GET /config/path-defaults/get →  { record, ... }   (Fallback)       │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  (bestehende Endpunkte, kein Server-Code)
                                ▼
                 ┌───────────────────────────────┐
                 │  useRecordingMap()  (NEU)     │  frontend/src/hooks/
                 │  Map<confName, boolean>       │  useRecordingMap.js
                 │  + isRecording(confName)      │
                 │  + pathDefaults-Fallback      │
                 └───────────────┬───────────────┘
                                 │  (ein Cache, von allen Seiten geteilt)
        ┌────────────┬───────────┼────────────┬──────────────────┐
        ▼            ▼           ▼            ▼                  ▼
  RuntimePaths   PathsCard   RuntimePath   Theatre            (zukunft:
  (/paths)       (Dashboard)  Detail        (/theatre)         weitere)
        │            │           │            │
        └────────────┴─────┬─────┴────────────┘
                           ▼
                 ┌───────────────────────┐
                 │  RecordingBadge (NEU) │  frontend/src/components/ui/
                 │  3-Zustand + compact  │  RecordingBadge.jsx
                 └───────────────────────┘
```

**Muster = bestehende Pages (1:1):**

| Bestehend | Recording-State |
|-----------|-----------------|
| `useQuery` + `useAutoRefresh` (`refetchInterval`) | `useQuery` + `useAutoRefresh` (`refetchInterval`) |
| `api.get('/paths/list')` (via Bridge) | `api.get('/config/paths/list')` + `api.get('/config/path-defaults/get')` (via Bridge) |
| `Badge` (online/available) | `RecordingBadge` (rec/armed/off) |
| `QUERY_KEYS.runtimePaths` | `QUERY_KEYS.configPathsRecording` (neu) |

**Warum ein gemeinsamer Hook (nicht pro Seite)?**
- **Ein Cache:** Alle vier Seiten teilen sich dieselbe Query (`configPathsRecording`) → nur **ein** HTTP-Request pro Refresh-Zyklus, egal wie viele Seiten offen sind.
- **Ein Merge-Ort:** Die `confName → record`-Logik + pathDefaults-Fallback existiert genau einmal.
- **Ein Refresh-Takt:** Gesteuert über die **bestehende** App-Setting `autoRefreshMs` (Settings → Auto-Refresh) — kein neues Intervall.

---

## 4. Bausteine (Detail)

### 4.1 Hook: `useRecordingMap()`

**Neue Datei:** `frontend/src/hooks/useRecordingMap.js`

```js
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAutoRefresh } from './useAutoRefresh';

/**
 * Aufnahme-Status aller Pfade aus der Konfiguration.
 *
 * Liefert:
 *  - map:          Map<confName, boolean>  (record-Wert pro Config)
 *  - isRecording(confName): boolean | null
 *                   true  = nimmt auf (record=true)
 *                   false = keine Aufnahme (record=false)
 *                   null  = unbekannt (kein Config-Match, kein Default)
 *  - loading, error
 *
 * Fallback: pathDefaults.record (wenn ein Pfad keine eigene Config hat).
 * Refresh:  bestehende App-Setting autoRefreshMs (0 = aus).
 */
export function useRecordingMap() {
  const refetchInterval = useAutoRefresh();

  const configs = useQuery({
    queryKey: QUERY_KEYS.configPathsRecording,
    queryFn: () => api.get('/config/paths/list', { page: 0, itemsPerPage: 1000 }),
    refetchInterval,
    staleTime: 5000,
    retry: false,
  });

  const defaults = useQuery({
    queryKey: QUERY_KEYS.pathDefaults, // bestehenden Key wiederverwenden → Cache-Share mit ConfigPathDefaults
    queryFn: () => api.get('/config/path-defaults/get'),
    refetchInterval,
    staleTime: 5000,
    retry: false,
  });

  const map = useMemo(() => {
    const m = new Map();
    (configs.data?.items ?? []).forEach((c) => m.set(c.name, !!c.record));
    return m;
  }, [configs.data]);

  const defaultRecord = defaults.data?.record ?? null;

  const isRecording = (confName) => {
    if (confName && map.has(confName)) return map.get(confName);
    return defaultRecord; // true | false | null
  };

  return {
    map,
    isRecording,
    loading: configs.isPending,
    error: configs.error || defaults.error,
  };
}

export default useRecordingMap;
```

**Zugehörige Änderung:** `frontend/src/services/queryKeys.js` — neuen Key ergänzen:

```js
configPathsRecording: ['config', 'paths', 'recording'],
```

> **Hinweis Cache:** Der Key `configPathsRecording` ist bewusst **abgegrenzt** vom paginierten `configPaths`-Key (`['config','paths',page,itemsPerPage]`) der Config-Page — hier wird die **vollständige** Liste (itemsPerPage=1000) geladen. Der `pathDefaults`-Key wird dagegen **geteilt** (gleiche Query wie `ConfigPathDefaults.jsx`) → kein doppelter Request.

### 4.2 Komponente: `RecordingBadge`

**Neue Datei:** `frontend/src/components/ui/RecordingBadge.jsx`

```jsx
import { useTranslation } from 'react-i18next';
import Badge from './Badge';

/**
 * Aufnahme-Status eines Pfades (3 Zustände + unknown).
 *
 * @param {boolean}  record   - Config-Wert (record: true/false). undefined → unknown.
 * @param {boolean}  [online] - Runtime-Online-Status (optional; verfeinert rec vs. armed).
 * @param {boolean}  [compact]- true → nur farbiger Punkt (Theater-Tiles), false → Badge mit Text.
 */
export default function RecordingBadge({ record, online, compact = false }) {
  const { t } = useTranslation();

  let state;
  if (record === true && online === true) state = 'rec';
  else if (record === true && online === false) state = 'armed';
  else if (record === false) state = 'off';
  else state = 'unknown';

  const cfg = {
    rec:     { color: 'red',   label: t('recording.rec'),  pulse: true,  aria: t('recording.ariaActive') },
    armed:   { color: 'amber', label: t('recording.armed'), pulse: false, aria: t('recording.ariaArmed') },
    off:     { color: 'gray',  label: t('recording.off'),  pulse: false, aria: t('recording.ariaOff') },
    unknown: { color: 'gray',  label: '–',                 pulse: false, aria: t('recording.ariaUnknown') },
  }[state];

  if (compact) {
    return (
      <span
        className={`rec-dot rec-dot--${state}${cfg.pulse ? ' rec-dot--pulse' : ''}`}
        role="img"
        aria-label={cfg.aria}
      />
    );
  }

  return (
    <Badge color={cfg.color} className={cfg.pulse ? 'rec-badge--pulse' : ''} title={cfg.aria}>
      {cfg.pulse && <span className="rec-badge__dot" aria-hidden="true" />}
      {cfg.label}
    </Badge>
  );
}
```

> **Wiederverwendung:** Nutzt die bestehende `Badge`-Komponente (`ui/Badge.jsx`) + die bestehenden Töne `red`/`amber`/`gray` (`badge.css`). Kein neues Badge-System.

---

## 5. Integration pro Seite

### 5.1 Laufzeitpfade — `/paths` (`RuntimePaths.jsx`)

**Änderung:** Neue Spalte „Aufnahme" zwischen „Available" und „Source Type".

```jsx
import RecordingBadge from '../ui/RecordingBadge';
import { useRecordingMap } from '../../hooks/useRecordingMap';

// im Component:
const { isRecording } = useRecordingMap();

// in columns (nach 'available'):
{
  key: 'record',
  label: t('pages.runtimePaths.record'),
  render: (row) => (
    <RecordingBadge record={isRecording(row.confName)} online={row.online} />
  ),
},
```

**Ergebnis:** Tabelle zeigt pro Pfad `REC` (rot, pulsierend) / `REC` (amber) / `off` (grau).

### 5.2 Dashboard — `/` (`PathsCard.jsx`)

**Änderung:** Gleiche neue Spalte in der Pfad-Tabelle des Dashboards.

```jsx
import RecordingBadge from '../ui/RecordingBadge';
import { useRecordingMap } from '../../hooks/useRecordingMap';

// im Component:
const { isRecording } = useRecordingMap();

// in columns (nach 'available'):
{
  key: 'record',
  label: t('pages.runtimePaths.record'),
  render: (row) => (
    <RecordingBadge record={isRecording(row.confName)} online={row.online} />
  ),
},
```

> **Optional (Empfehlung):** In der Statistik-Zeile (`paths-card__stats`) einen vierten Stat-Block „Aufnahme aktiv" = Anzahl Pfade mit `record=true && online=true`. Siehe §10.

### 5.3 Pfad-Detail — `/paths/:name` (`RuntimePathDetail.jsx`)

**Änderung:** Im Status-Bereich (`DetailSection` „Status") den Aufnahme-Status als Badge + als Detail-Zeile zeigen.

```jsx
import RecordingBadge from '../ui/RecordingBadge';
import { useRecordingMap } from '../../hooks/useRecordingMap';

// im Component:
const { isRecording } = useRecordingMap();
const record = isRecording(p?.confName);

// 1) Badge in detail__badges (neben online/available):
<div className="detail__badges">
  <Badge value={p.online ? 'online' : 'offline'}>{...}</Badge>
  <Badge value={p.available ? 'available' : 'unavailable'}>{...}</Badge>
  <RecordingBadge record={record} online={p.online} />
</div>

// 2) Detail-Zeile in detail__rows:
<div className="detail__row">
  <dt>{t('pages.runtimePathDetail.record')}</dt>
  <dd><RecordingBadge record={record} online={p.online} /></dd>
</div>
```

### 5.4 Theater — `/theatre` (`Theatre.jsx` + `PathTile.jsx` + `StreamPlayer.jsx`)

**Ziel:** Auf jedem Tile / Stream-Player ein kompaktes REC-Indikator (farbiger Punkt), damit man im Theater sofort sieht, welcher Stream aufgenommen wird.

**Schritt 1 — `Theatre.jsx`:** Hook nutzen + `recording` an `PathTile` und `StreamPlayer` weiterreichen.

```jsx
import { useRecordingMap } from '../../hooks/useRecordingMap';

// im Component:
const { isRecording } = useRecordingMap();

// PathTile (Single-View, Tile-Strip):
<PathTile
  key={item.name}
  name={item.name}
  online={item.online}
  recording={isRecording(item.confName)}   // NEU
  active={activePath === item.name}
  ...
/>

// StreamPlayer (Grid- + PiP-View):
<StreamPlayer key={item.name} name={item.name} online={item.online}
  recording={isRecording(item.confName)}   // NEU
  muted={muted} ... />
```

**Schritt 2 — `PathTile.jsx`:** `recording`-Prop entgegennehmen + kompakten `RecordingBadge` rendern.

```jsx
import RecordingBadge from '../ui/RecordingBadge';

export default function PathTile({ name, online, recording, active, loading, error, onClick }) {
  ...
  return (
    <button ...>
      <span className="theatre-tile__dot" aria-hidden="true" />
      {recording !== undefined && (
        <span className="theatre-tile__rec" aria-hidden="true">
          <RecordingBadge record={recording} online={online} compact />
        </span>
      )}
      <span className="theatre-tile__body">...</span>
      ...
    </button>
  );
}
```

**Schritt 3 — `StreamPlayer.jsx`:** Gleicher kompakter Indikator (z. B. oben links über dem Video).

```jsx
import RecordingBadge from '../ui/RecordingBadge';

export default function StreamPlayer({ name, online, recording, muted = true, focused = false, onClick }) {
  ...
  return (
    <div className={classes} ...>
      <video ref={videoRef} className="theatre-player__video" playsInline />
      {recording !== undefined && (
        <span className="theatre-player__rec" aria-hidden="true">
          <RecordingBadge record={recording} online={online} compact />
        </span>
      )}
      ...
    </div>
  );
}
```

> **Positionierung:** `theatre-tile__rec` = oben links (Dot ist oben rechts). `theatre-player__rec` = oben links über dem Video. Siehe §7 (CSS).

---

## 6. i18n (en/de/it)

**Neue Keys** in `frontend/src/locales/{en,de,it}.json`:

### 6.1 Spalten-/Feld-Header (bestehende Sektionen ergänzen)

```jsonc
// pages.runtimePaths (alle 3 Sprachen)
"record": "Record"            // en
"record": "Aufnahme"          // de
"record": "Registrazione"     // it

// pages.runtimePathDetail (alle 3 Sprachen)
"record": "Record"            // en
"record": "Aufnahme"          // de
"record": "Registrazione"     // it
```

### 6.2 Neue Sektion `recording` (alle 3 Sprachen)

```jsonc
"recording": {
  "rec":   "REC",             // en/de/it (universell)
  "armed": "REC",             // en/de/it (Farbe unterscheidet: amber)
  "off":   "off",             // en   → de: "aus",  it: "disattivo"
  "ariaActive":  "Recording",                       // en
  "ariaArmed":   "Recording configured (offline)",  // en
  "ariaOff":     "Not recording",                   // en
  "ariaUnknown": "Recording state unknown"          // en
}
```

**de:**
```jsonc
"recording": {
  "rec":   "REC",
  "armed": "REC",
  "off":   "aus",
  "ariaActive":  "Aufnimmt",
  "ariaArmed":   "Aufnahme aktiviert (offline)",
  "ariaOff":     "Keine Aufnahme",
  "ariaUnknown": "Aufnahme-Status unbekannt"
}
```

**it:**
```jsonc
"recording": {
  "rec":   "REC",
  "armed": "REC",
  "off":   "disattivo",
  "ariaActive":  "Registrazione in corso",
  "ariaArmed":   "Registrazione attiva (offline)",
  "ariaOff":     "Nessuna registrazione",
  "ariaUnknown": "Stato registrazione sconosciuto"
}
```

> **Hinweis:** `rec`/`armed` sind bewusst identisch („REC") — der Zustand wird über **Farbe** (rot vs. amber) + **Puls** + **aria-label** unterschieden. Das ist konsistent mit dem bestehenden Badge-Muster (Farbe = Zustand).

---

## 7. Styling (CSS)

**Neue Datei:** `frontend/src/style/components/recording.css` (in `style/components/index.css` importieren).

```css
/* ===== RecordingBadge (Text-Badge) ===== */
.rec-badge--pulse {
  gap: 6px;
}

.rec-badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  animation: rec-pulse 1.4s ease-in-out infinite;
}

/* ===== RecordingBadge (kompakt, nur Punkt — Theater) ===== */
.rec-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-muted);
}
.rec-dot--rec    { background: var(--color-error); }
.rec-dot--armed  { background: var(--color-validation); }
.rec-dot--off    { background: var(--color-muted); }
.rec-dot--unknown{ background: var(--color-muted); opacity: .5; }

.rec-dot--pulse {
  animation: rec-pulse 1.4s ease-in-out infinite;
}

@keyframes rec-pulse {
  0%, 100% { opacity: 1;   transform: scale(1); }
  50%      { opacity: .35; transform: scale(.8); }
}

/* ===== Positionierung im Theater ===== */
.theatre-tile__rec {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
}

.theatre-player__rec {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  z-index: 2;
}

/* Reduced Motion: Puls aus (Barrierefreiheit) */
@media (prefers-reduced-motion: reduce) {
  .rec-badge__dot,
  .rec-dot--pulse {
    animation: none;
  }
}
```

> **Farben:** Nutzen die bestehenden Design-Tokens (`--color-error`, `--color-validation`, `--color-muted`) — konsistent mit `badge.css` und `theatre.css`.
> **Barrierefreiheit:** `prefers-reduced-motion` deaktiviert den Puls; der Zustand bleibt über Farbe + aria-label erkennbar.

---

## 8. Edge-Cases & Fehlerbehandlung

| Fall | Verhalten |
|------|-----------|
| **Kein Config-Match** (`confName` nicht in Map) | Fallback auf `pathDefaults.record`. Ist auch der `null` → Zustand `unknown` (grau „–"). |
| **Config-Liste lädt noch** (`loading=true`) | `isRecording()` liefert `null` → `unknown`. Kein Falsch-Positiv. (Optional: Badge erst nach Load rendern.) |
| **Config-API fehlerhaft** (`error`) | `unknown` für alle Pfade. Die Runtime-Daten (online/available) bleiben sichtbar. Kein Crash. |
| **`record` fehlt im Config-Item** | `!!c.record` → `false` → `off`. (Defensive Normalisierung im Hook.) |
| **Pfad offline + record=true** | Zustand `armed` (amber) — korrekt: „soll aufnehmen, aber gerade offline". |
| **Theater: `recording` undefined** | Indikator wird **nicht** gerendert (`recording !== undefined`-Guard) → kein visueller Mülleimer. |
| **Auto-Refresh aus** (`autoRefreshMs=0`) | `refetchInterval=false` → kein Polling. Status wird bei Seitenwechsel/Refetch aktualisiert. (Bestehendes Verhalten aller Pages.) |
| **Viele Pfade (>1000)** | `itemsPerPage=1000` deckt realistische Größen ab. (Extension: Pagination, §10.) |

---

## 9. Tests & Verifikation

### 9.1 Manuelle Verifikation (Dev, `http://localhost:3000`)

Voraussetzung: Pfad `two` hat `record=true` + ist online (siehe §2.2).

| # | Schritt | Erwartung |
|---|---------|-----------|
| 1 | `/paths` öffnen | Neue Spalte „Aufnahme". `two` = rotes „REC" (pulsierend), Rest = grau „off". |
| 2 | `/` (Dashboard) öffnen | Gleiche Spalte in der Pfad-Tabelle. `two` = „REC". |
| 3 | `/paths/two` öffnen | Status-Bereich zeigt rotes „REC"-Badge + Detail-Zeile „Aufnahme: REC". |
| 4 | `/theatre` öffnen | Tile `two` hat roten REC-Punkt (oben links). Andere Tiles keinen. |
| 5 | Sprache auf **DE** umstellen | Labels: „Aufnahme", „aus", aria „Aufnimmt". |
| 6 | Sprache auf **IT** umstellen | Labels: „Registrazione", „disattivo", aria „Registrazione in corso". |
| 7 | Dark/Light umschalten | Farben passen sich an (Design-Tokens). |
| 8 | Pfad `two` **offline** schalten (Publisher stoppen) | `two` wechselt von rot „REC" → amber „REC" (armed). |
| 9 | `record` von `two` auf `false` setzen (Config) | `two` wechselt → grau „off". |
| 10 | Network-Tab: Config-Request | **Ein** Request `/config/paths/list` pro Refresh-Zyklus (Cache-Share über alle Seiten). |

### 9.2 Build-Gate

```bash
# Frontend-Build (das Gate — `npm run lint` existiert NICHT im Projekt)
docker exec mediamtx-ui /bin/sh -c "cd /app/frontend && npm run build"
```

> **Hinweis:** Node ist NICHT im Host-PATH → Build im Dev-Container ausführen (siehe `.HANDOFF_STATE.md` §5).

### 9.3 (Optional) Unit-Tests

Falls das Projekt Frontend-Tests nutzt: `RecordingBadge`-Zustandslogik (rec/armed/off/unknown) + `useRecordingMap.isRecording()` (Match/Fallback/unknown) sind rein und gut testbar.

---

## 10. Extension-Punkte (nicht in v1)

1. **Dashboard-Statistik:** Vierter Stat-Block „Aufnahme aktiv" = `items.filter(p => isRecording(p.confName) && p.online).length`.
2. **Filter/Sortierung:** In `/paths` nach Aufnahme-Status filtern (nur aufnehmende Pfade).
3. **Aufnahme-Steuerung:** REC-Indikator klickbar → `record` umschalten (PATCH Config). (Braucht Bestätigung + ist eine Mutation.)
4. **Letzte Aufnahme:** Pro Pfad „zuletzt aufgenommen um …" aus `/recordings/list` (Merge mit Recording-Historie).
5. **Pagination der Config-Liste:** Falls >1000 Pfade (aktuell nicht relevant).
6. **Theater-Overlay:** REC-Indikator auch als Overlay auf dem aktiven Video (Single-View), nicht nur am Tile.

---

## 11. Datei-Änderungsliste (konkret)

### Neue Dateien
| Datei | Zweck |
|-------|-------|
| `frontend/src/hooks/useRecordingMap.js` | Gemeinsamer Hook: Config-Liste + pathDefaults → `isRecording(confName)` |
| `frontend/src/components/ui/RecordingBadge.jsx` | Gemeinsame Badge-Komponente (3 Zustände + compact) |
| `frontend/src/style/components/recording.css` | Styling (Puls, kompakter Punkt, Positionierung, reduced-motion) |

### Geänderte Dateien
| Datei | Änderung |
|-------|----------|
| `frontend/src/services/queryKeys.js` | + `configPathsRecording: ['config','paths','recording']` |
| `frontend/src/components/pages/RuntimePaths.jsx` | + Spalte „Aufnahme" (`RecordingBadge`) |
| `frontend/src/components/dashboard/PathsCard.jsx` | + Spalte „Aufnahme" (`RecordingBadge`) |
| `frontend/src/components/pages/RuntimePathDetail.jsx` | + Badge + Detail-Zeile im Status-Bereich |
| `frontend/src/components/pages/Theatre.jsx` | + `useRecordingMap()`, `recording` an Tile/Player weiterreichen |
| `frontend/src/components/theatre/PathTile.jsx` | + `recording`-Prop + kompakter Indikator |
| `frontend/src/components/theatre/StreamPlayer.jsx` | + `recording`-Prop + kompakter Indikator |
| `frontend/src/style/components/index.css` | + `import './recording.css';` |
| `frontend/src/locales/en.json` | + `pages.runtimePaths.record`, `pages.runtimePathDetail.record`, `recording.*` |
| `frontend/src/locales/de.json` | + dito (de) |
| `frontend/src/locales/it.json` | + dito (it) |

### Unverändert (bewusst)
- `server/**` — **kein** Server-Code (NUR FRONTEND).
- `frontend/src/components/pages/ConfigPaths.jsx` — Referenz-Anzeige bleibt.
- `frontend/src/MediaMTXBridge.js` (server) — proxied die benötigten Endpunkte bereits.

---

## 12. Zusammenfassung

- **Kern:** Aufnahme-Status kommt aus der **Config** (`record`), nicht aus der Runtime. Merge über `confName`.
- **Ein Hook** (`useRecordingMap`) + **eine Komponente** (`RecordingBadge`) → einheitlich an **vier** Stellen.
- **3 Zustände** (rec/armed/off) machen „nimmt **gerade** auf" sichtbar — präziser als die reine Config-Anzeige, aber vollständig kompatibel.
- **NUR FRONTEND**, bestehende Endpunkte, bestehende Bausteine, i18n en/de/it, Dark/Light, Barrierefreiheit (reduced-motion + aria).
- **Build-Gate:** `npm run build` im Dev-Container.

---

## 13. Phasenplan (Abarbeitung)

> **Prinzip:** Jede Phase ist ein **eigenständig verifizierbarer** Schritt (Build grün + manueller Check). Reihenfolge: erst Fundament (Hook), dann Baustein (Badge+CSS+i18n), dann die vier Integrationen — jede für sich abnehmbar. So ist nach jeder Phase ein stabiler, lauffähiger Zustand erreicht.
>
> **Build-Gate pro Phase:** `docker exec mediamtx-ui /bin/sh -c "cd /app/frontend && npm run build"` (Node ist NICHT im Host-PATH).
>
> **Voraussetzung (Dev):** Pfad `two` = `record=true` + online (siehe §2.2) → dient als Testfall „REC aktiv".

### Phasen-Übersicht

| Phase | Inhalt | Neue/Geänderte Dateien | Abhängigkeit |
|-------|--------|------------------------|--------------|
| **0** | Fundament: Query-Key + Hook | `queryKeys.js`, `useRecordingMap.js` (neu) | — |
| **1** | Baustein: Badge + CSS + i18n-Basis | `RecordingBadge.jsx` (neu), `recording.css` (neu), `index.css`, `locales/*` | 0 |
| **2** | Integration `/paths` | `RuntimePaths.jsx`, `locales/*` | 1 |
| **3** | Integration Dashboard `/` | `PathsCard.jsx` | 1 |
| **4** | Integration `/paths/:name` | `RuntimePathDetail.jsx`, `locales/*` | 1 |
| **5** | Integration `/theatre` | `Theatre.jsx`, `PathTile.jsx`, `StreamPlayer.jsx` | 1 |
| **6** | Abschluss: i18n-Vollcheck + finale Verifikation | (keine neuen) | 2–5 |

> Phasen **2–5 sind unabhängig voneinander** (alle hängen nur von 0+1 ab) → können bei Bedarf parallel/vertauscht abgearbeitet werden. Empfohlene Reihenfolge: 2 → 3 → 4 → 5 (Tabelle → Detail → Theater, aufsteigende Komplexität).

---

### Phase 0 — Fundament (Query-Key + Hook)

**Ziel:** Der gemeinsame Daten-Hook existiert und liefert `isRecording(confName)` korrekt.

**Aufgaben:**
1. `frontend/src/services/queryKeys.js` — Key ergänzen: `configPathsRecording: ['config', 'paths', 'recording']`.
2. `frontend/src/hooks/useRecordingMap.js` (neu) — exakt nach §4.1 (Config-Liste + pathDefaults-Fallback + `isRecording`).

**Verifikation:**
- Build grün.
- (Optional, schnell) In einer bestehenden Page temporär `console.log(useRecordingMap().isRecording('two'))` → erwartet `true`; `isRecording('one')` → `false`. (Vor Phase-Ende wieder entfernen.)

**Done:** Hook importierbar, `isRecording` liefert für `two`=`true`, `one`/`track`/`walk`=`false`.

---

### Phase 1 — Baustein (Badge + CSS + i18n-Basis)

**Ziel:** `RecordingBadge` rendert alle 4 Zustände (rec/armed/off/unknown) + compact-Modus; Styling + Basis-i18n vorhanden.

**Aufgaben:**
1. `frontend/src/components/ui/RecordingBadge.jsx` (neu) — exakt nach §4.2.
2. `frontend/src/style/components/recording.css` (neu) — exakt nach §7.
3. `frontend/src/style/components/index.css` — `import './recording.css';` ergänzen.
4. `frontend/src/locales/{en,de,it}.json` — Sektion `recording.*` ergänzen (§6.2).

**Verifikation:**
- Build grün.
- (Optional) `RecordingBadge` in einer Teststelle mit `record={true} online={true}` / `online={false}` / `record={false}` / `record={undefined}` rendern → 4 Zustände + compact sichtbar.

**Done:** Komponente + CSS + i18n-Basis vorhanden, Build grün.

---

### Phase 2 — Integration Laufzeitpfade `/paths`

**Ziel:** Neue Spalte „Aufnahme" in der Runtime-Pfad-Tabelle.

**Aufgaben:**
1. `frontend/src/components/pages/RuntimePaths.jsx` — `useRecordingMap` + `RecordingBadge` importieren, Spalte „Aufnahme" nach „Available" einfügen (§5.1).
2. `frontend/src/locales/{en,de,it}.json` — `pages.runtimePaths.record` ergänzen (§6.1).

**Verifikation:**
- Build grün.
- Manuell `/paths`: Spalte „Aufnahme" sichtbar. `two` = rotes „REC" (pulsierend), Rest = grau „off".

**Done:** `/paths` zeigt Aufnahme-Status pro Pfad.

---

### Phase 3 — Integration Dashboard `/`

**Ziel:** Gleiche Spalte in der Dashboard-Pfad-Tabelle.

**Aufgaben:**
1. `frontend/src/components/dashboard/PathsCard.jsx` — `useRecordingMap` + `RecordingBadge` importieren, Spalte „Aufnahme" nach „Available" einfügen (§5.2).

**Verifikation:**
- Build grün.
- Manuell `/`: Pfad-Tabelle zeigt Spalte „Aufnahme". `two` = „REC".

**Done:** Dashboard zeigt Aufnahme-Status pro Pfad.

---

### Phase 4 — Integration Pfad-Detail `/paths/:name`

**Ziel:** Aufnahme-Status im Status-Bereich (Badge + Detail-Zeile).

**Aufgaben:**
1. `frontend/src/components/pages/RuntimePathDetail.jsx` — `useRecordingMap` + `RecordingBadge` importieren, Badge in `detail__badges` + Detail-Zeile in `detail__rows` einfügen (§5.3).
2. `frontend/src/locales/{en,de,it}.json` — `pages.runtimePathDetail.record` ergänzen (§6.1).

**Verifikation:**
- Build grün.
- Manuell `/paths/two`: Status-Bereich zeigt rotes „REC"-Badge + Detail-Zeile „Aufnahme: REC".
- Manuell `/paths/one`: Detail-Zeile „Aufnahme: off".

**Done:** Detail-Ansicht zeigt Aufnahme-Status.

---

### Phase 5 — Integration Theater `/theatre`

**Ziel:** Kompakter REC-Indikator an Tile (Single-View) + Stream-Player (Grid/PiP).

**Aufgaben:**
1. `frontend/src/components/pages/Theatre.jsx` — `useRecordingMap` importieren, `recording={isRecording(item.confName)}` an `PathTile` (Single) + `StreamPlayer` (Grid/PiP) weiterreichen (§5.4 Schritt 1).
2. `frontend/src/components/theatre/PathTile.jsx` — `recording`-Prop + kompakter `RecordingBadge` (§5.4 Schritt 2).
3. `frontend/src/components/theatre/StreamPlayer.jsx` — `recording`-Prop + kompakter `RecordingBadge` (§5.4 Schritt 3).

**Verifikation:**
- Build grün.
- Manuell `/theatre` (Single-View): Tile `two` hat roten REC-Punkt (oben links), andere Tiles keinen.
- Manuell `/theatre` (Grid- + PiP-View): Stream `two` hat REC-Punkt.

**Done:** Theater zeigt Aufnahme-Status pro Stream.

---

### Phase 6 — Abschluss (i18n-Vollcheck + finale Verifikation)

**Ziel:** Alle 4 Ansichten in allen 3 Sprachen + Dark/Light + Barrierefreiheit verifiziert; Build final grün.

**Aufgaben:**
1. i18n-Vollständigkeit prüfen: alle neuen Keys in `en`/`de`/`it` vorhanden + korrekt (keine fehlenden/leeren Werte).
2. Volle manuelle Verifikation gemäß **§9.1** (10 Schritte, inkl. online/offline-Wechsel + `record`-Wechsel + Network-Check Cache-Share).
3. Dark/Light + `prefers-reduced-motion` prüfen.
4. Finaler Build: `docker exec mediamtx-ui /bin/sh -c "cd /app/frontend && npm run build"`.
5. (Optional, nur auf Anforderung) Commit.

**Done:** Alle 4 Ansichten zeigen in en/de/it den korrekten Aufnahme-Status; Build grün; §9.1 vollständig abgehakt.

---

### Abarbeitungs-Checkliste (Kurzform)

- [ ] **P0** `queryKeys.js` + `useRecordingMap.js` — Build grün
- [ ] **P1** `RecordingBadge.jsx` + `recording.css` + `index.css` + `locales/*` (recording.*) — Build grün
- [ ] **P2** `RuntimePaths.jsx` + `locales/*` (runtimePaths.record) — `/paths` ✓
- [ ] **P3** `PathsCard.jsx` — `/` ✓
- [ ] **P4** `RuntimePathDetail.jsx` + `locales/*` (runtimePathDetail.record) — `/paths/two` ✓
- [ ] **P5** `Theatre.jsx` + `PathTile.jsx` + `StreamPlayer.jsx` — `/theatre` ✓
- [ ] **P6** i18n-Vollcheck + §9.1 + Dark/Light + finaler Build ✓
