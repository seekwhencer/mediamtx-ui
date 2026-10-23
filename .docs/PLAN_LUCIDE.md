# Konzept: LUCIDE — Icon-System (Frontend)

> **Stand:** 2026-10-23 — Konzept, noch nicht implementiert.
> - Frontend-Grundlagen: siehe `INITIAL_FRONTEND.md`
> - Doku-Stil-Vorbild: `PLAN_TOOLS.md`
> - Lucide-Doku: https://lucide.dev/guide/react/
>
> **Ziel:** Lucide-Icons (`lucide-react`) als **einheitliches Icon-System** im Frontend.
> - **Navigation:** Icons in der Sidebar (**Pflicht**).
> - **Weitere Stellen:** TopBar, Buttons, Cards, Tabellen, Forms, Dashboard, Theatre, 404, Empty-/Error-States.
> - **Ersetzt:** Inline-SVGs (`theatre/*`) + Unicode-Zeichen (`×`, `+`, `ⓘ`, `▲`, `▼`, `→`, `←`, `✓`).
>
> **Kernprinzip:** Ein Icon = **Komponenten-Referenz** (kein String, kein JSX) in der Datenquelle. Tree-shakable — nur importierte Icons landen im Bundle.

---

## 1. Ist-Zustand (Relevanz für das Konzept)

| Fakt | Detail |
|------|--------|
| Icon-Bibliothek | **Keine.** Inline-SVGs in `theatre/TheatreTopBar.jsx` + `theatre/PathTile.jsx` (feather-artig). Unicode-Zeichen in `Modal` (`×`), `TagInput` (`×`), `ListEditor` (`+`/`×`), `Tooltip` (`ⓘ`), `DataTable` (`▲`/`▼`), `Pagination` (Text), `NotFound` (Text). |
| Navigation | `layout/navItems.js` → `NAV_SECTIONS` (Array aus Sektionen: `labelKey` + `items[]`). `Sidebar.jsx` rendert 1:1. **Keine Icons.** |
| TopBar | `TopBar.jsx`: Titel + Status-`Badge` + Refresh-`Button` + Sprach-Buttons. **Keine Icons.** |
| Buttons | `Button.jsx`: `children` (Text) + optional `loading` (CSS-Spinner). `KickButton`, `ListEditor`, `TagInput`, `Modal` nutzen `×`/`+` als Text. |
| Cards | `Card.jsx`: `title` (String) + `actions`. `ProtocolCard`, `InfoCard`, `PathsCard`, `QuickLinks` bauen darauf. |
| Tabellen | `DataTable.jsx`: Sort-Indikator `▲`/`▼` (Text). `Pagination.jsx`: Back/Next (Text). |
| Forms | `FormBuilder` (Groups via `<details>`), `FormField`, `ListEditor` (`+`/`×`), `TagInput` (`×`), `Tooltip` (`ⓘ`). |
| Dashboard | `ProtocolCard` (HLS/RTSP/RTMP/SRT/WebRTC/MoQ), `InfoCard`, `PathsCard`, `QuickLinks`. |
| Theatre | `TheatreTopBar` (Back/Mute/Fullscreen als **Inline-SVG**), `PathTile` (Video/Spinner/Play als **Inline-SVG**). |
| Styling | **Plain CSS**, BEM-artig, CSS-Variablen in `style/variables.css`, Komponenten-CSS in `style/components/*.css` (Import über `index.css`). `ui-spin` Keyframes vorhanden (Button-Spinner). |
| React / Build | `react ^19.3.0`, Vite 8, i18next (en/de/it), react-router-dom v7, @tanstack/react-query v5. |
| lucide-react | **nicht installiert.** Latest `1.61.0`, peer `react ^16.5.1 \|\| ^17 \|\| ^18 \|\| ^19` → **kompatibel**. ISC-Lizenz, ESM, tree-shakable. |

**Fazit:** Feature ist **reines Frontend**. Eine neue Dependency (`lucide-react`) + Icon-Referenzen in Datenquellen + `icon`-Props in UI-Komponenten + CSS für Alignment/Spin. Kein Server, keine API, keine i18n-Keys (Icons sind dekorativ).

---

## 2. Architektur & Kernentscheidungen

```
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                             │
│                                                                      │
│  package.json  ← + lucide-react (tree-shakable ESM)                 │
│                                                                      │
│  layout/navItems.js        ← icon: <Komponente> pro Item (NEU)       │
│     └─ Sidebar.jsx         ← rendert <item.icon />                  │
│                                                                      │
│  ui/Button.jsx             ← + icon-Prop (Komponente)               │
│  ui/Card.jsx               ← + icon-Prop (Komponente)               │
│  ui/Modal.jsx              ← X (Close)                              │
│  ui/Tooltip.jsx            ← Info (statt ⓘ)                        │
│  ui/ErrorAlert.jsx         ← AlertTriangle                          │
│  ui/KickButton.jsx         ← LogOut                                 │
│  ui/TagInput.jsx           ← X (Remove)                             │
│  tables/DataTable.jsx      ← ArrowUp/ArrowDown (Sort) + Inbox       │
│  tables/Pagination.jsx     ← ChevronLeft/ChevronRight               │
│  forms/ListEditor.jsx      ← Plus (Add) + X (Remove)                │
│  forms/FormBuilder.jsx     ← Save + CircleCheckBig                  │
│  dashboard/ProtocolCard    ← Icon pro Protokoll                     │
│  dashboard/InfoCard        ← Server                                 │
│  dashboard/PathsCard       ← Activity                               │
│  dashboard/QuickLinks      ← Zap                                    │
│  theatre/TheatreTopBar     ← ArrowLeft/Volume/Maximize (SVG→Lucide) │
│  theatre/PathTile          ← Video/Play/Loader2 (SVG→Lucide)        │
│  pages/NotFound.jsx        ← SearchX                                │
│  layout/TopBar.jsx         ← RefreshCw (spin)                       │
│                                                                      │
│  style/components/icons.css  ← Alignment + Spin (NEU)               │
└──────────────────────────────────────────────────────────────────────┘
```

**Kernentscheidungen:**

1. **Icon = Komponenten-Referenz, kein String.** `navItems.js` importiert die Icons und speichert `icon: Clapperboard` (Referenz, kein JSX). `Sidebar.jsx` rendert `<item.icon />`. Kein Lookup-Map, typsicher, tree-shakable. Funktioniert in `.js`-Datei (nur Referenz, kein JSX nötig).
2. **`icon`-Prop in UI-Komponenten.** `Button` und `Card` bekommen eine optionale `icon`-Prop (Komponente). Wiederverwendbar, konsistent, zentralisiert.
3. **Kein Icon-Wrapper.** Lucide-Props (`size`, `strokeWidth`, `color`) sind sauber. Direkte Imports mit explizitem `size`. Kein zusätzliches Indirection-Layer.
4. **A11y automatisch.** Lucide setzt `aria-hidden="true"` **automatisch**, wenn keine A11y-Props (`aria-label`, `role`, `title`, `children`) übergeben werden. Dekorative Icons brauchen also **kein** manuelles `aria-hidden`. Icon-only-Buttons setzen `aria-label` → Icon wird zugänglich.
5. **Farbe via `currentColor`.** Lucide-Icons erben die Textfarbe (`stroke: currentColor`, Default). Dark/Light-Theme + Primary-Hue funktionieren **automatisch**, kein Extra-CSS.
6. **Ersetzt Inline-SVGs + Unicode.** Theatre-SVGs → Lucide. `×`/`+`/`ⓘ`/`▲`/`▼`/`→`/`←` → Lucide. Einheitliches System statt 3 Quellen.
7. **Nur eine neue Dependency.** `lucide-react` (ISC, tree-shakable). Keine anderen Libraries.

---

## 3. Installation

```sh
cd frontend
npm install lucide-react
```

- Version: `^1.61.0` (latest, peer `react ^19` OK).
- Tree-shakable: nur importierte Icons landen im Bundle (~15–20 Icons ≈ wenige KB).
- ESM, React 19 kompatibel.

**package.json (frontend):**
```json
"dependencies": {
  "lucide-react": "^1.61.0",
  ...
}
```

---

## 4. Icon-Konventionen

### 4.1 Sizing

| Kontext | Größe | Beispiel |
|---------|-------|----------|
| Inline mit Text (Buttons, Nav, Badges) | `16` | `<Plus size={16} />` |
| Card-Titel, Section-Header | `18` | `<Radio size={18} />` |
| TopBar-Actions | `16` | `<RefreshCw size={16} />` |
| Standalone (Empty-State, 404) | `24`–`48` | `<Inbox size={32} />` |
| Theatre | `20` | `<Volume2 size={20} />` |

### 4.2 Stroke

- `strokeWidth={2}` (Default) überall.
- `stroke: currentColor` (Default) → erbt Textfarbe.
- Ausnahme: `PathTile`-Icon behält `strokeWidth={1.8}` (visuelle Parität zum bestehenden SVG).

### 4.3 A11y

- **Dekorative Icons** (neben Text): keine A11y-Props → Lucide setzt automatisch `aria-hidden="true"`.
- **Icon-only-Buttons** (Modal-Close, TagInput-Remove, ListEditor-Remove, Theatre-Buttons): `aria-label` setzen → Icon wird zugänglich, Button bleibt fokussierbar.
- **Icon + Text** (Button mit Label): Icon dekorativ, Text trägt die Bedeutung.

### 4.4 Klassen

- Lucide setzt automatisch `class="lucide lucide-<name>"` → CSS-Targeting möglich (z. B. `.lucide { flex: none; }`).

---

## 5. Icon-Map (Navigation + weitere Stellen)

### 5.1 Navigation (Sidebar) — **Pflicht**

| Sektion | Item | Icon | Begründung |
|---------|------|------|------------|
| THEATER | Theater | `Clapperboard` | Film/Clapper → Theater |
| ÜBERSICHT | Dashboard | `LayoutDashboard` | Dashboard-Grid |
| KONFIGURATION | Global | `Settings2` | Globale Einstellungen |
| KONFIGURATION | Interne Benutzer | `Users` | Benutzer |
| KONFIGURATION | Pfade | `FolderTree` | Pfad-Konfiguration |
| KONFIGURATION | Path Defaults | `SlidersHorizontal` | Defaults/Slider |
| LAUFZEIT | Pfade | `Activity` | Live-Aktivität |
| LAUFZEIT | HLS | `Radio` | Broadcast |
| LAUFZEIT | RTSP | `Video` | Video-Stream |
| LAUFZEIT | RTMP | `MonitorPlay` | Player |
| LAUFZEIT | SRT | `SatelliteDish` | Satellit/UDP |
| LAUFZEIT | WebRTC | `Wifi` | Echtzeit/Netz |
| LAUFZEIT | MoQ | `Boxes` | QUIC-Pakete |
| RECORDINGS | Recordings | `HardDrive` | Aufnahmen auf Disk |
| EINSTELLUNGEN | Einstellungen | `Settings` | Zahnrad |

**Konflikt aufgelöst:** „Pfade“ taucht 2× auf (Konfiguration + Laufzeit) → `FolderTree` (Config) vs. `Activity` (Runtime).

### 5.2 TopBar

| Stelle | Icon | Anmerkung |
|--------|------|-----------|
| Refresh-Button | `RefreshCw` | spinnt während `refreshing` (CSS) |
| Status-Badge (optional) | `CircleDot` (online) / `CircleOff` (offline) | dekorativ |
| Sprache (optional) | `Languages` | dekorativ |

### 5.3 Buttons & Actions

| Stelle | Icon | Komponente |
|--------|------|------------|
| Add Path | `Plus` | `ConfigPaths` |
| Add User | `Plus` | `InternalUsers` |
| Edit | `Pencil` | `ConfigPaths`, `InternalUsers` |
| Replace | `RotateCw` | `ConfigPaths`, `InternalUsers` |
| Delete | `Trash2` | `ConfigPaths`, `InternalUsers`, `Recordings` |
| Kick | `LogOut` | `KickButton` |
| Save | `Save` | `FormBuilder`, `Settings` |
| Back (Detail) | `ArrowLeft` | `RuntimePathDetail`, `ConfigPathDetail`, `InternalUserDetail` |
| Details → | `ArrowRight` | `ProtocolCard`, `PathsCard` |
| All paths → | `ArrowRight` | `PathsCard` |
| Modal Close | `X` | `Modal` |
| TagInput Remove | `X` | `TagInput` |
| ListEditor Remove | `X` | `ListEditor` |
| ListEditor Add Row | `Plus` | `ListEditor` |
| Pagination Back | `ChevronLeft` | `Pagination` |
| Pagination Next | `ChevronRight` | `Pagination` |

### 5.4 Tabellen & States

| Stelle | Icon | Komponente |
|--------|------|------------|
| Sort-Indikator (asc) | `ArrowUp` | `DataTable` |
| Sort-Indikator (desc) | `ArrowDown` | `DataTable` |
| Empty-State | `Inbox` | `DataTable` |
| Error | `AlertTriangle` | `ErrorAlert` |
| Saved | `CircleCheckBig` | `FormBuilder` |
| Loading (optional) | `Loader2` (Spin) | `Spinner` |

### 5.5 Forms & Tooltip

| Stelle | Icon | Komponente |
|--------|------|------------|
| Tooltip-Trigger | `Info` | `Tooltip` |
| Password Show/Hide (Backlog) | `Eye` / `EyeOff` | `Input` |

### 5.6 Dashboard

| Stelle | Icon | Komponente |
|--------|------|------------|
| ProtocolCard HLS | `Radio` | `ProtocolCard` |
| ProtocolCard RTSP | `Video` | `ProtocolCard` |
| ProtocolCard RTMP | `MonitorPlay` | `ProtocolCard` |
| ProtocolCard SRT | `SatelliteDish` | `ProtocolCard` |
| ProtocolCard WebRTC | `Wifi` | `ProtocolCard` |
| ProtocolCard MoQ | `Boxes` | `ProtocolCard` |
| InfoCard | `Server` | `InfoCard` |
| PathsCard | `Activity` | `PathsCard` |
| QuickLinks | `Zap` | `QuickLinks` |

### 5.7 Theatre (Inline-SVGs ersetzen)

| Stelle | Icon | Ersetzt |
|--------|------|---------|
| Back | `ArrowLeft` | Inline-SVG (Pfeil) |
| Mute | `VolumeX` | Inline-SVG |
| Unmute | `Volume2` | Inline-SVG |
| Fullscreen | `Maximize` | Inline-SVG |
| Exit Fullscreen | `Minimize` | Inline-SVG |
| Tile-Icon | `Video` | Inline-SVG |
| Tile-Active | `Play` | Inline-SVG |
| Tile-Loading | `Loader2` (Spin) | Inline-SVG (Spinner) |

### 5.8 Seiten

| Stelle | Icon | Komponente |
|--------|------|------------|
| 404 | `SearchX` | `NotFound` |
| JsonBlock Copy (Backlog) | `Copy` | `JsonBlock` |

---

## 6. Implementierung (pro Komponente)

### 6.1 `navItems.js` — Icons in der Navigation

```js
import {
  Clapperboard, LayoutDashboard, Settings2, Users, FolderTree,
  SlidersHorizontal, Activity, Radio, Video, MonitorPlay,
  SatelliteDish, Wifi, Boxes, HardDrive, Settings,
} from 'lucide-react';

// Navigation: labelKey = i18n-Key (siehe locales/*.json), icon = Lucide-Komponente (Referenz).
export const NAV_SECTIONS = [
  {
    labelKey: 'nav.theatre',
    items: [{ to: '/theatre', labelKey: 'nav.theatre', icon: Clapperboard }],
  },
  {
    labelKey: 'nav.overview',
    items: [{ to: '/', labelKey: 'nav.dashboard', end: true, icon: LayoutDashboard }],
  },
  {
    labelKey: 'nav.configuration',
    items: [
      { to: '/config/global', labelKey: 'nav.global', icon: Settings2 },
      { to: '/config/internal-users', labelKey: 'nav.internalUsers', icon: Users },
      { to: '/config/paths', labelKey: 'nav.paths', icon: FolderTree },
      { to: '/config/path-defaults', labelKey: 'nav.pathDefaults', icon: SlidersHorizontal },
    ],
  },
  {
    labelKey: 'nav.runtime',
    items: [
      { to: '/paths', labelKey: 'nav.paths', icon: Activity },
      { to: '/hls', labelKey: 'nav.hls', icon: Radio },
      { to: '/rtsp', labelKey: 'nav.rtsp', icon: Video },
      { to: '/rtmp', labelKey: 'nav.rtmp', icon: MonitorPlay },
      { to: '/srt', labelKey: 'nav.srt', icon: SatelliteDish },
      { to: '/webrtc', labelKey: 'nav.webrtc', icon: Wifi },
      { to: '/moq', labelKey: 'nav.moq', icon: Boxes },
    ],
  },
  {
    labelKey: 'nav.recordings',
    items: [{ to: '/recordings', labelKey: 'nav.recordings', icon: HardDrive }],
  },
  {
    labelKey: 'nav.settings',
    items: [{ to: '/settings', labelKey: 'nav.settings', icon: Settings }],
  },
];

// Liefert den i18n-Key des Seiten-Titels für eine Pfad-URL. (unverändert)
export function titleKeyForPath(pathname) {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
        return item.labelKey;
      }
    }
  }
  return 'common.notFound';
}
```

**Wichtig:** `icon` ist eine **Referenz** (kein JSX) → funktioniert in `.js`-Datei. `titleKeyForPath` bleibt unverändert (nutzt nur `to` + `labelKey`).

### 6.2 `Sidebar.jsx` — Icon rendern

```jsx
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV_SECTIONS } from './navItems';

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="layout__sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">MTX</span>
        <span className="sidebar__name">mediamtx ui</span>
      </div>
      <nav className="sidebar__nav" aria-label={t('nav.overview')}>
        {NAV_SECTIONS.map((section) => (
          <div className="sidebar__section" key={section.labelKey}>
            <div className="sidebar__section-label">{t(section.labelKey)}</div>
            <ul className="sidebar__list">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
                    >
                      {Icon && <Icon size={16} className="sidebar__link-icon" />}
                      <span className="sidebar__link-label">{t(item.labelKey)}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

**CSS (`sidebar.css`):**
```css
.sidebar__link {
  display: flex;          /* war: block */
  align-items: center;
  gap: var(--space-2);
  /* …rest unchanged (padding, radius, font, color, transition) */
}
.sidebar__link-icon {
  flex: none;
  color: currentColor;    /* erbt Link-Farbe (secondary / primary bei active) */
}
```

### 6.3 `Button.jsx` — `icon`-Prop

```jsx
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  icon: Icon,
  children,
  ...rest
}) {
  const classes = [
    'ui-btn',
    `ui-btn--${variant}`,
    size !== 'md' ? `ui-btn--${size}` : '',
    loading ? 'is-loading' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading && <span className="ui-btn__spinner" aria-hidden="true" />}
      {Icon && <Icon size={16} className="ui-btn__icon" />}
      <span className="ui-btn__label">{children}</span>
    </button>
  );
}
```

**CSS (`buttons.css`):**
```css
.ui-btn__icon {
  flex: none;
}
```

**Nutzung:**
```jsx
<Button icon={Plus} onClick={...}>{t('pages.configPaths.addPath')}</Button>
<Button icon={Pencil} variant="ghost" size="sm" onClick={...}>{t('common.edit')}</Button>
<Button icon={Trash2} variant="danger" size="sm" onClick={...}>{t('common.delete')}</Button>
<Button icon={LogOut} variant="danger" size="sm" loading={loading} onClick={onKick}>{label}</Button>
<Button icon={Save} type="submit" variant="primary" loading={submitting}>{submitLabel}</Button>
```

### 6.4 `Card.jsx` — `icon`-Prop

```jsx
export default function Card({ title, value, actions, icon: Icon, children, className = '' }) {
  const classes = ['ui-card', className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      {(title || actions) && (
        <header className="ui-card__header">
          {title && (
            <h3 className="ui-card__title">
              {Icon && <Icon size={18} className="ui-card__title-icon" />}
              {title}
            </h3>
          )}
          {actions && <div className="ui-card__actions">{actions}</div>}
        </header>
      )}
      {value !== undefined && <div className="ui-card__value">{value}</div>}
      {children && <div className="ui-card__body">{children}</div>}
    </div>
  );
}
```

**CSS (`card.css`):**
```css
.ui-card__title {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.ui-card__title-icon {
  flex: none;
  color: var(--color-text-secondary);
}
```

**Nutzung (ProtocolCard):**
```jsx
import { Radio, Video, MonitorPlay, SatelliteDish, Wifi, Boxes } from 'lucide-react';

const PROTOCOL_ICONS = {
  HLS: Radio, RTSP: Video, RTMP: MonitorPlay, SRT: SatelliteDish, WebRTC: Wifi, MoQ: Boxes,
};

// In Dashboard.jsx:
<ProtocolCard title="HLS" icon={PROTOCOL_ICONS.HLS} to="/hls" metrics={...} />
```

### 6.5 `Modal.jsx` — X-Icon

```jsx
import { X } from 'lucide-react';
// …
<button type="button" className="ui-modal__close" onClick={onClose} aria-label={t('common.close')}>
  <X size={18} />
</button>
```

### 6.6 `Tooltip.jsx` — Info-Icon

```jsx
import { Info } from 'lucide-react';
// …
<button
  type="button"
  className="ui-tooltip__trigger"
  aria-label={text}
  aria-describedby={id}
  onClick={(e) => e.stopPropagation()}
>
  <Info size={14} />
</button>
```

### 6.7 `ErrorAlert.jsx` — Alert-Icon

```jsx
import { AlertTriangle } from 'lucide-react';
// …
<div className="ui-erroralert" role="alert">
  <AlertTriangle size={18} className="ui-erroralert__icon" />
  <div className="ui-erroralert__content">
    <strong>{titleText}</strong>
    <span>{msg}</span>
    {meta && <code className="ui-erroralert__meta">{meta}</code>}
  </div>
</div>
```

**CSS (`erroralert.css`):**
```css
.ui-erroralert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}
.ui-erroralert__icon {
  flex: none;
  color: var(--color-error);
  margin-top: 2px;
}
```

### 6.8 `DataTable.jsx` — Sort-Icons + Empty-State

```jsx
import { ArrowUp, ArrowDown, Inbox } from 'lucide-react';
// …
{active && (
  <span className="table__sort-indicator">
    {sort.dir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
  </span>
)}
// …
<td colSpan={columns.length} className="table__empty">
  <Inbox size={24} className="table__empty-icon" />
  {empty}
</td>
```

**CSS (`datatable.css`):**
```css
.table__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}
.table__empty-icon {
  color: var(--color-muted);
}
```

### 6.9 `Pagination.jsx` — Chevron-Icons

```jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
// …
<button
  type="button"
  className="ui-btn ui-btn--secondary ui-btn--sm"
  disabled={page <= 0}
  onClick={() => onPageChange?.(page - 1)}
>
  <ChevronLeft size={14} />
  {t('common.back')}
</button>
<button
  type="button"
  className="ui-btn ui-btn--secondary ui-btn--sm"
  disabled={page >= pageCount - 1}
  onClick={() => onPageChange?.(page + 1)}
>
  {t('common.next')}
  <ChevronRight size={14} />
</button>
```

### 6.10 `ListEditor.jsx` — Plus + X

```jsx
import { Plus, X } from 'lucide-react';
// …
<button
  type="button"
  className="ui-btn ui-btn--danger ui-btn--sm listeditor__remove"
  onClick={() => removeAt(i)}
  aria-label={t('form.removeRow', { n: i + 1 })}
>
  <X size={14} />
</button>
// …
<Button type="button" className="listeditor__btn--add-row" variant="primary" icon={Plus} onClick={add}>
  {t('form.addRow')}
</Button>
```

### 6.11 `TagInput.jsx` — X-Icon

```jsx
import { X } from 'lucide-react';
// …
<button
  type="button"
  className="ui-taginput__remove"
  onClick={() => removeAt(i)}
  aria-label={t('common.removeTag', { tag })}
  disabled={disabled}
>
  <X size={12} />
</button>
```

### 6.12 `TheatreTopBar.jsx` — Inline-SVGs ersetzen

```jsx
import { ArrowLeft, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
// …
<button
  type="button"
  className="theatre-topbar__btn"
  onClick={onExit}
  aria-label={t('pages.theatre.back')}
  title={t('pages.theatre.back')}
>
  <ArrowLeft size={20} />
</button>
// …
<button
  type="button"
  className="theatre-topbar__btn"
  onClick={handleMuteToggle}
  aria-label={muted ? t('pages.theatre.unmute') : t('pages.theatre.mute')}
  aria-pressed={muted}
  title={muted ? t('pages.theatre.unmute') : t('pages.theatre.mute')}
>
  {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
</button>
// …
<button
  type="button"
  className="theatre-topbar__btn"
  onClick={handleFullscreenToggle}
  aria-label={isFullscreen ? t('pages.theatre.exitFullscreen') : t('pages.theatre.fullscreen')}
  aria-pressed={isFullscreen}
  title={isFullscreen ? t('pages.theatre.exitFullscreen') : t('pages.theatre.fullscreen')}
>
  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
</button>
```

### 6.13 `PathTile.jsx` — Inline-SVGs ersetzen

```jsx
import { Video, Play, Loader2 } from 'lucide-react';
// …
<span className="theatre-tile__icon" aria-hidden="true">
  <Video size={22} strokeWidth={1.8} />
</span>
// …
{loading && (
  <span className="theatre-tile__overlay" aria-hidden="true">
    <Loader2 size={22} className="theatre-tile__spinner" />
  </span>
)}
// …
{active && !loading && (
  <span className="theatre-tile__overlay" aria-hidden="true">
    <Play size={30} fill="currentColor" />
  </span>
)}
```

**CSS (`theatre.css`):**
```css
.theatre-tile__spinner {
  animation: ui-spin 0.7s linear infinite;
}
```

### 6.14 `NotFound.jsx` — SearchX-Icon

```jsx
import { SearchX } from 'lucide-react';
// …
<div className="notfound__code" aria-hidden="true">
  <SearchX size={48} />
  404
</div>
```

### 6.15 `TopBar.jsx` — Refresh-Icon (spin)

```jsx
import { RefreshCw } from 'lucide-react';
// …
<Button
  variant="secondary"
  size="sm"
  icon={RefreshCw}
  className={refreshing ? 'is-refreshing' : ''}
  onClick={handleRefresh}
>
  {t('topbar.refresh')}
</Button>
```

**Spin während Refresh (statt Doppel-Spinner):**
```css
.ui-btn.is-refreshing .ui-btn__icon {
  animation: ui-spin 0.7s linear infinite;
}
```

> **Hinweis:** Refresh-Button nutzt **kein** `loading`-Prop (sonst Doppel-Spinner). Stattdessen spinnt das Icon via CSS-Klasse.

### 6.16 `FormBuilder.jsx` — Save-Icon + Saved-Icon

```jsx
import { Save, CircleCheckBig } from 'lucide-react';
// …
{saved && (
  <span className="formbuilder__saved">
    <CircleCheckBig size={14} />
    {t('form.saved')}
  </span>
)}
<Button type="submit" variant="primary" icon={Save} loading={submitting} disabled={disabled}>
  {submitLabel}
</Button>
```

### 6.17 `QuickLinks.jsx` — Zap-Icon

```jsx
import { Zap } from 'lucide-react';
// …
<Card title={t('dashboard.quickAccess')} icon={Zap}>
```

### 6.18 `InfoCard.jsx` — Server-Icon

```jsx
import { Server } from 'lucide-react';
// …
<Card title={t('dashboard.instance')} icon={Server}>
```

### 6.19 `PathsCard.jsx` — Activity-Icon

```jsx
import { Activity } from 'lucide-react';
// …
<Card title={t('dashboard.paths')} icon={Activity} actions={<Link className="ui-link" to="/paths">{t('dashboard.allPaths')}</Link>}>
```

### 6.20 Detail-Seiten — Back-Icon

```jsx
// RuntimePathDetail.jsx, ConfigPathDetail.jsx, InternalUserDetail.jsx
import { ArrowLeft } from 'lucide-react';
// …
<Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/paths')}>
  {t('pages.runtimePathDetail.back')}
</Button>
```

---

## 7. i18n

- **Keine neuen i18n-Keys** für dekorative Icons (sie sind `aria-hidden`).
- **Icon-only-Buttons** brauchen `aria-label` (bestehende i18n-Keys wiederverwenden):
  - Modal Close: `common.close` (vorhanden)
  - TagInput Remove: `common.removeTag` (vorhanden)
  - ListEditor Remove: `form.removeRow` (vorhanden)
  - Theatre Back/Mute/Fullscreen: `pages.theatre.*` (vorhanden)
- **Keine Änderungen** an `locales/*.json` nötig.

---

## 8. Styling (neu: `icons.css`)

```css
/* ===== Lucide-Icons (globale Basis) ===== */
.lucide {
  flex: none;            /* bricht nicht in Flex-Containern */
  vertical-align: middle;
}

/* Spin (Refresh, Loader) — nutzt bestehendes ui-spin aus buttons.css */
.is-spinning .lucide,
.lucide.is-spinning {
  animation: ui-spin 0.7s linear infinite;
}
```

**Import:** `style/components/index.css` → `@import './icons.css';`

**Regel:** nur CSS-Variablen aus `variables.css`, keine Hardcodes. Dark/Light-Theme automatisch (Icons erben `currentColor`).

---

## 9. Tests

- **Frontend:** kein Test-Framework vorhanden (wie bei TOOLS/THEATRE) → manuell via Build + E2E.
- **Build-Check:** `npm run build` (frontend) grün → tree-shaking funktioniert, keine fehlenden Imports.
- **Bundle-Size:** vor/nach vergleichen (nur importierte Icons landen im Bundle).
- **Manueller E2E:**
  - Sidebar: alle 15 Nav-Items mit Icon sichtbar, Active-State korrekt.
  - TopBar: Refresh-Icon spinnt während Refresh.
  - Buttons: Add/Edit/Delete/Kick/Save mit Icon.
  - Cards: ProtocolCard (6 Protokoll-Icons), InfoCard, PathsCard, QuickLinks mit Icon.
  - Tabellen: Sort-Icons, Empty-State-Icon.
  - Forms: ListEditor (+/×), TagInput (×), Tooltip (Info).
  - Theatre: Back/Mute/Fullscreen/Tile-Icons.
  - 404: SearchX-Icon.
  - Dark/Light-Theme: Icons erben Textfarbe.
  - Mobile (375 px): Icons + Labels nicht überlappend.

---

## 10. Akzeptanzkriterien

- [ ] `lucide-react` installiert (frontend `package.json`).
- [ ] Sidebar: alle 15 Nav-Items mit Icon (s. §5.1), Active-State korrekt.
- [ ] TopBar: Refresh-Button mit `RefreshCw`-Icon (spinnt während Refresh).
- [ ] Buttons: Add/Edit/Replace/Delete/Kick/Save mit Icon.
- [ ] Cards: ProtocolCard (6 Protokoll-Icons), InfoCard, PathsCard, QuickLinks mit Icon.
- [ ] Tabellen: Sort-Icons (`ArrowUp`/`ArrowDown`), Empty-State (`Inbox`).
- [ ] Forms: ListEditor (`Plus`/`X`), TagInput (`X`), Tooltip (`Info`).
- [ ] Modal: Close-Icon (`X`).
- [ ] ErrorAlert: `AlertTriangle`-Icon.
- [ ] Theatre: Inline-SVGs durch Lucide ersetzt (Back/Mute/Fullscreen/Tile).
- [ ] 404: `SearchX`-Icon.
- [ ] A11y: Icon-only-Buttons haben `aria-label`, dekorative Icons `aria-hidden`.
- [ ] Dark/Light-Theme: Icons erben Textfarbe (kein Hardcode).
- [ ] Mobile (375 px): Icons + Labels nicht überlappend.
- [ ] `npm run build` (frontend) grün.
- [ ] Bundle-Size: nur importierte Icons (tree-shaking).
- [ ] Manueller E2E via `docker exec mediamtx-ui …` (Dev-Architektur laut AGENTS.md).

---

## 11. Risiken & offene Punkte

| Risiko / Punkt | Einschätzung / Gegenmaßnahme |
|----------------|------------------------------|
| **Bundle-Size** | Lucide ist tree-shakable → nur importierte Icons. ~15–20 Icons ≈ wenige KB. |
| **Icon-Konsistenz** | Konventionen in §4 (Sizing, Stroke, A11y). `icon`-Prop in Button/Card zentralisiert. |
| **Doppelte Spinner** | Refresh-Button: Icon spinnt (CSS), kein zusätzlicher CSS-Spinner. |
| **Icon-Only-Buttons A11y** | `aria-label` setzen (bestehende i18n-Keys). |
| **Theatre-SVG-Wechsel** | Visuelle Parität prüfen (Stroke, Größe). `strokeWidth={1.8}` für Tile-Icon beibehalten. |
| **Lucide-Version** | `^1.61.0` pinnen. Icon-Namen sind stabil (keine Breaking Changes bei Rename). |
| **Dark/Light** | Icons erben `currentColor` → automatisch. Kein Extra-CSS nötig. |

---

## 12. Bewusst NICHT in v1 (Backlog)

- **Icon-Only-Modus** (Sidebar nur Icons, ohne Labels) — später, wenn Sidebar zu breit wird.
- **Icon-Picker / Konfiguration** (Icons pro User wählbar) — Overkill.
- **Animated Icons** (Lucide Lab) — nur statische Icons.
- **Icon-Search / Autocomplete** — nicht nötig.
- **Favicon / Logo-Icons** — separat.
- **Password Show/Hide** (`Eye`/`EyeOff`) — nice-to-have, nicht Pflicht.
- **JsonBlock Copy** (`Copy`) — nice-to-have, nicht Pflicht.
- **Status-Badge-Icons** (`CircleDot`/`CircleOff`) — optional, nicht Pflicht.

---

## 13. Roadmap: 5 Phasen

> **Stand:** 2026-10-23 — Konzept, noch nicht implementiert.
> **Legende:** ✅ erledigt · 🚧 teilweise · ⬜ offen
> **Aufbau:** 5 Phasen, sequenziell. Eine Phase ist abgeschlossen, wenn alle Akzeptanzkriterien grün sind.
> **Abhängigkeiten:** P2 braucht P1 · P3 braucht P1 · P4 braucht P3 · P5 braucht alles.

### Status-Übersicht

| Phase | Fortschritt | Aufwand |
|-------|-------------|---------|
| Phase 1: Installation + Konventionen | 0/2 | 2/10 |
| Phase 2: Navigation (Sidebar) | 0/2 | 3/10 |
| Phase 3: UI-Komponenten (Button/Card/Modal/…) | 0/6 | 6/10 |
| Phase 4: Seiten (Dashboard/Theatre/404/…) | 0/5 | 5/10 |
| Phase 5: Styling + Integration + Testing | 0/5 | 4/10 |

**Gesamt: 0/20 Schritte · Gesamtaufwand: 20/100**

---

### Phase 1: Installation + Konventionen · Aufwand 2/10

> Fundament: Dependency + Konventionen. Noch keine Icons im UI.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 1.1 | `npm install lucide-react` (frontend) | `package.json` enthält `lucide-react ^1.61.0` | ⬜ |
| 1.2 | `style/components/icons.css` anlegen (`.lucide { flex: none }` + Spin) + Import in `index.css` | Build ohne Fehler, CSS geladen | ⬜ |

**Abnahme Phase 1:** Dependency installiert, Basis-CSS vorhanden.

---

### Phase 2: Navigation (Sidebar) · Aufwand 3/10

> **Pflicht-Feature:** Icons in der Navigation.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 2.1 | `navItems.js`: `icon`-Feld pro Item (s. §6.1) | Alle 15 Items haben `icon` (Komponente) | ⬜ |
| 2.2 | `Sidebar.jsx`: Icon rendern (s. §6.2) + CSS | Sidebar zeigt alle Icons, Active-State korrekt | ⬜ |

**Abnahme Phase 2:** Sidebar mit Icons sichtbar, Navigation funktioniert.

---

### Phase 3: UI-Komponenten · Aufwand 6/10

> Icons in wiederverwendbaren UI-Bausteinen.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 3.1 | `Button.jsx`: `icon`-Prop (s. §6.3) + CSS | Button mit Icon rendert korrekt | ⬜ |
| 3.2 | `Card.jsx`: `icon`-Prop (s. §6.4) + CSS | Card mit Icon rendert korrekt | ⬜ |
| 3.3 | `Modal.jsx` (X), `Tooltip.jsx` (Info), `ErrorAlert.jsx` (AlertTriangle) | Icons sichtbar, A11y korrekt | ⬜ |
| 3.4 | `DataTable.jsx` (ArrowUp/Down, Inbox), `Pagination.jsx` (Chevron) | Sort-Icons + Empty-State + Pagination | ⬜ |
| 3.5 | `ListEditor.jsx` (Plus/X), `TagInput.jsx` (X) | Icons sichtbar, A11y korrekt | ⬜ |
| 3.6 | `KickButton.jsx` (LogOut), `FormBuilder.jsx` (Save/CircleCheckBig) | Icons sichtbar | ⬜ |

**Abnahme Phase 3:** Alle UI-Komponenten mit Icons, konsistent.

---

### Phase 4: Seiten · Aufwand 5/10

> Icons in Seiten + Dashboard + Theatre.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 4.1 | `TopBar.jsx`: Refresh-Icon (s. §6.15) | Refresh-Icon spinnt während Refresh | ⬜ |
| 4.2 | `ProtocolCard` (6 Icons), `InfoCard` (Server), `PathsCard` (Activity), `QuickLinks` (Zap) | Dashboard-Cards mit Icons | ⬜ |
| 4.3 | `TheatreTopBar.jsx`: Inline-SVGs → Lucide (s. §6.12) | Back/Mute/Fullscreen-Icons | ⬜ |
| 4.4 | `PathTile.jsx`: Inline-SVGs → Lucide (s. §6.13) | Tile-Icon/Active/Loading | ⬜ |
| 4.5 | `NotFound.jsx`: SearchX-Icon (s. §6.14) + Detail-Seiten (ArrowLeft) | 404 + Back-Icons | ⬜ |

**Abnahme Phase 4:** Alle Seiten mit Icons, Theatre-SVGs ersetzt.

---

### Phase 5: Styling + Integration + Testing · Aufwand 4/10

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 5.1 | CSS finalisieren (Alignment, Spin, A11y) | Keine Überlappungen, Spin funktioniert | ⬜ |
| 5.2 | Dark/Light-Theme prüfen | Icons erben Textfarbe | ⬜ |
| 5.3 | Mobile (375 px) prüfen | Icons + Labels nicht überlappend | ⬜ |
| 5.4 | `npm run build` (frontend) grün | Production-Build ohne Fehler | ⬜ |
| 5.5 | Manueller E2E via `docker exec mediamtx-ui …` | Alle Akzeptanzkriterien aus §10 grün | ⬜ |

**Abnahme Phase 5:** Feature produktionsreif. Alle Akzeptanzkriterien aus §10 erfüllt.

---

### Meilensteine

| Meilenstein | Phasen | Ergebnis |
|-------------|--------|----------|
| **M1: Fundament** | 1 | Dependency + Basis-CSS |
| **M2: Navigation** | 2 | Sidebar mit Icons (Pflicht) |
| **M3: UI-Komponenten** | 3 | Button/Card/Modal/Tabellen/Forms mit Icons |
| **M4: Seiten** | 4 | Dashboard/Theatre/404/TopBar mit Icons |
| **M5: Fertig** | 5 | Styling/Theme/Mobile/Build/E2E grün, produktionsreif |
