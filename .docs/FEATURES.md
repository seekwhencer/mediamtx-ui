# FEATURES — Offene Arbeit & Reihenfolge

> **Stand:** 2026-10-26
> **Zweck:** Zentrale Übersicht, was in `mediamtx-ui` noch zu tun ist — priorisiert (Muss / Sollte / Könnte) und in einer empfohlenen Reihenfolge. Ergänzt `ROADMAP.md` (abgeschlossen) und die einzelnen `PLAN_*.md`.
> **Legende:** 🔴 Muss (Bug / Security / Daten) · 🟡 Sollte (hoher Wert) · 🟢 Könnte (Polish / Perf)
> **Aufwand:** klein (< 1 Tag) · mittel (1–3 Tage) · groß (> 3 Tage)
> **Quellen:** `ROADMAP.md`, `PLAN_TOOLS.md`, `PLAN_USER_API.md`, `PLAN_RECORDS_PLAYER.md`, `PLAN_LUCIDE.md`, `THEATRE.md`, `.HANDOFF_STATE.md`, `git log`, `mediamtx/openapi.yml`, `MEDIAMTX_DOCS.md`.

---

## 1. Ist-Zustand (kurz)

**Fertig** (verifiziert via `git log` + Code):

| Bereich | Status |
|---------|--------|
| Core-Admin-UI (ROADMAP 57/57) | ✅ Dashboard, Config (Global / Path-Defaults / Paths / Users), Runtime (alle 8 Protokolle + Kick), Recordings, Settings |
| Logs | ✅ Live-Monitor via WebSocket (`/logs`), History + Streaming, Level-Filter, Suche, Pause |
| Theatre | ✅ Fullscreen-Stream-Wall (HLS, `useHlsPlayer`) |
| Icons | ✅ Lucide-React als einheitliches Icon-System |
| Records Player | ✅ Inline-Playback (`<video>`, Play / Stop / Fullscreen) |
| Internal Users | ✅ Liste + Detail-Page (Main-Branch-Endpoints, Partial-Update) |
| Settings | ✅ Playback/HLS-Base-URL, Roundness-Slider, Primary-Hue, Theme, Auto-Refresh |

**Nicht fertig** (dieses Dokument):

- TOOLS-System (`PLAN_TOOLS.md`, 0/21 Schritte)
- Metrics-View (nur Config-Toggle `metrics: false`, **kein** Daten-View)
- Pprof / Performance-View (nur Config-Toggle, **kein** Daten-View)
- JWKS-Refresh-Button (Endpunkt `/v3/auth/jwks/refresh` existiert, in der UI **nicht erreichbar**)
- ErrorBoundary (fehlt komplett)
- Diverse Bugs / Polish (s. §2)

> **Hinweis:** Mehrere `PLAN_*.md` tragen den Vermerk „noch nicht implementiert", sind aber laut `git log` **bereits committed** (Lucide `693c0a2`, Theatre `2add559`, Records Player `c8ff2ee`, Users `93cfe70`). Diese Pläne sind **stale** — der Ist-Zustand in §1 ist maßgeblich.

---

## 2. Offene Arbeit — priorisiert

### 🔴 Muss (Bugs, Security, Datenintegrität)

| # | Item | Problem | Aufwand |
|---|------|---------|---------|
| **M1** | ErrorBoundary (app-level) | Kein React ErrorBoundary vorhanden (grep: kein `componentDidCatch`). Ein Render-Fehler (z. B. unerwartete Datenform aus MediaMTX) → **White-Screen der ganzen App**. | klein |
| **M2** | Recordings `<video>` onError | Kaputter Codec (HEVC/H.265) oder 404 → totes Video **ohne Meldung**. i18n-Key `playerError` ist im Plan, aber nicht verdrahtet. | klein |
| **M3** | Passwort-Persistenz (**DATENVERLUST**) | `MediaMTXConfigStore.save()` (`server/src/MediaMTXConfigStore.js:59`) holt die Config aus der API (Passwörter = `<redacted>`) und schreibt sie nach YAML. Jede Config-Mutation → Passwörter in der Datei werden zu `<redacted>` → beim MediaMTX-Neustart **dauerhaft verloren**. | mittel |
| **M4** | WS `/logs` Auth | Log-Stream-Endpunkt ohne Auth. Logs können IPs, Pfade, Tokens enthalten. README warnt: „Don't use it reachable over the internet". | klein–mittel |

### 🟡 Sollte (hohe Wert-Features)

| # | Item | Nutzen | Aufwand |
|---|------|--------|---------|
| **S1** | **Metrics-Page** | Doku-Haupt-Feature („Extract metrics"). CPU / RAM / Throughput / pro-Pfad. Komplement zu Dashboard (Zähler) + Logs (Events). Infra bereit (Port 9998 gemappt). | mittel |
| **S2** | JWKS-Refresh-Button | `/v3/auth/jwks/refresh` ist der **einzige** Runtime-Action-Endpunkt, der in der UI nicht erreichbar ist. Nur relevant bei `authMethod: jwt`. | klein |
| **S3** | TOOLS-System | Modulare Foundation (`PLAN_TOOLS.md`) für zukünftige Tools (Switch-Dummy + Registry). Neues Tool = 1 Datei + 1 Registry-Eintrag. | mittel |

### 🟢 Könnte (Polish, Perf, nice-to-have)

| # | Item | Nutzen | Aufwand |
|---|------|--------|---------|
| **C1** | Frontend lint/test-Scripts | Fehlen (nur `dev` / `build` / `preview`). Qualität + CI. | klein |
| **C2** | Code-Splitting (Lazy-Routing) | Bundle-Size, Initial-Load. | mittel |
| **C3** | vite.config.js Cleanup | Hygiene: Debug-`console.log`, toter `ws`-Block. | klein |
| **C4** | Logs-Refinements | Server-seitiges Level-Filtern, Backpressure-Throttling, `mediamtxLogPath` in Settings-UI. | klein–mittel |
| **C5** | Recordings-Refinements | Exakte Duration via Playback-`/list`, Format-Toggle (fmp4/mp4), Download-Button, Thumbnails. | klein–mittel |
| **C6** | Pprof / Performance-View | Doku-Feature („Monitor performance"). Dev-Tool (CPU-Profile, Heap). Geringerer Admin-Wert. | mittel |
| **C7** | Build-Permission-Fix | `frontend/dist/assets` root-eigentlich → `npm run build` auf Host EACCES (Workaround: `--outDir /tmp/…`). | klein |

---

## 3. Empfohlene Reihenfolge

> Prinzip: **Erst Robustheit & Sicherheit (Muss), dann das Top-Feature (S1), dann Feature-Abschluss, dann Qualität/Perf, zuletzt Refinements.** MUSTs sind klein und unabhängig → parallelisierbar.

### Welle 1 — Robustheit & Sicherheit (🔴 Muss)

| Schritt | Item | Rationale |
|---------|------|-----------|
| 1 | **M1** ErrorBoundary | Schützt **alles Weitere**. Verhindert White-Screens. Kommt zuerst, damit neue Pages (S1) auch geschützt sind. |
| 2 | **M2** Recordings video onError | Kleiner, sichtbarer Gap. i18n-Key existiert schon. |
| 3 | **M3** Passwort-Persistenz-Bug | **Datenverlust.** Vor jeder weiteren Config-Mutation fixen. (Zuerst verifizieren, s. §5.) |
| 4 | **M4** WS `/logs` Auth | Security. Logs sind sensibel. |

> M1–M4 haben keine Abhängigkeiten untereinander → **parallelisierbar**.

### Welle 2 — Top-Feature (🟡 Sollte)

| Schritt | Item | Rationale |
|---------|------|-----------|
| 5 | **S1** Metrics-Page | Höchster Wert, Doku-Haupt-Feature, Infra bereit. Kommt **nach** den MUSTs (damit die neue Page von der ErrorBoundary geschützt ist). |

### Welle 3 — Feature-Abschluss (🟡 Sollte)

| Schritt | Item | Rationale |
|---------|------|-----------|
| 6 | **S2** JWKS-Refresh-Button | Kleiner Abschluss. Schließt den letzten nicht erreichbaren Endpunkt. |
| 7 | **S3** TOOLS-System | Optional. Nur wenn die Extensibilität wirklich gebraucht wird (s. §5). |

### Welle 4 — Qualität & Perf (🟢 Könnte)

| Schritt | Item | Rationale |
|---------|------|-----------|
| 8 | **C1** Frontend lint/test | Vor Code-Splitting (sonst Refactoring ohne Netz). |
| 9 | **C7** Build-Permission-Fix | Blockiert saubere Host-Builds. |
| 10 | **C3** vite.config Cleanup | Hygiene, klein. |
| 11 | **C2** Code-Splitting | Erst **nach** stabilen Features (vermeidet Rework). |

### Welle 5 — Refinements (🟢 Könnte)

| Schritt | Item | Rationale |
|---------|------|-----------|
| 12 | **C4** Logs-Refinements | Polish auf dem fertigen Logs-Feature. |
| 13 | **C5** Recordings-Refinements | Polish auf dem fertigen Player. |
| 14 | **C6** Pprof-View | Dev-Tool, geringster Admin-Wert. Zuletzt. |

---

## 4. Feature-Details

### M1 — ErrorBoundary (app-level) 🔴

- **Was:** React ErrorBoundary um `<Routes>` / `<Layout>` in `App.jsx`. Fängt Render-Fehler, zeigt `ErrorAlert` + „Zurück zum Dashboard" (statt White-Screen).
- **Warum:** Ein einziger unerwarteter Datenform-Fehler (z. B. MediaMTX liefert ein Feld, das das Frontend nicht erwartet) bricht die **ganze** App ab.
- **Aufwand:** klein. 1 Komponente + Verdrahtung in `App.jsx`.
- **Abhängigkeiten:** keine.
- **Akzeptanz:** Simulierter Render-Fehler (z. B. `throw` in einer Page) → ErrorBoundary rendert, App bleibt bedienbar, „Zurück zum Dashboard" funktioniert.

### M2 — Recordings `<video>` onError 🔴

- **Was:** `onError`-Handler am `<video>` in `Recordings.jsx` → zeigt `playerError`-Meldung (i18n-Key `pages.recordings.playerError` im Plan vorhanden).
- **Warum:** HEVC/H.265-Aufnahmen oder 404 → totes Video ohne Erklärung.
- **Aufwand:** klein.
- **Abhängigkeiten:** keine.
- **Akzeptanz:** Nicht-decodierbare Aufnahme → klare Fehlermeldung statt totem Video.

### M3 — Passwort-Persistenz-Bug (DATENVERLUST) 🔴

- **Was:** `MediaMTXConfigStore.save()` darf **keine** `<redacted>`-Werte in die YAML schreiben.
- **Warum:** `save()` liest die Config aus der API (`GET /config/global/get` → Passwörter = `<redacted>`) und schreibt sie nach `mediamtxConfigPath`. Bei gesetztem `MEDIAMTX_CONFIG_PATH` (in `.env.default` gesetzt) wird **jede** Config-Mutation die Passwörter in der Datei auf `<redacted>` setzen → beim MediaMTX-Neustart dauerhaft verloren.
- **Fix-Optionen:**
  1. `save()` liest die **bestehende YAML-Datei** (hat echte Passwörter/Hashes) und merged nur die geänderten Felder.
  2. `save()` ersetzt alle `<redacted>`-Werte durch die aus der YAML gelesenen Werte.
  3. Persistenz nur für nicht-redigierte Felder; Passwörter bleiben in der Datei unverändert.
- **Aufwand:** mittel.
- **Abhängigkeiten:** keine.
- **Akzeptanz:** Benutzer mit Passwort anlegen → Config-Mutation (z. B. Pfad ändern) → YAML-Datei enthält das **echte** Passwort (nicht `<redacted>`).
- **Abgrenzung:** Die **Frontend**-Benutzerverwaltung nutzt Main-Branch-Endpoints (Partial-Update, Passwort bleibt) → dort sicher. Der Bug ist **server-seitig** (YAML-Persistenz).

### M4 — WS `/logs` Auth 🔴

- **Was:** Token-Check am WebSocket-Upgrade (`/logs`), analog zur Bridge. Oder: zumindest dokumentiert + optionaler Token.
- **Warum:** Log-Stream ohne Auth. Logs können IPs, Pfade, Tokens enthalten.
- **Aufwand:** klein–mittel.
- **Abhängigkeiten:** keine.
- **Akzeptanz:** Ohne gültiges Token → WS-Verbindung abgelehnt (oder: Token optional + Risiko dokumentiert).

### S1 — Metrics-Page 🟡 (Top-Pick)

- **Was:** Neue Page `/metrics`. Server-seitig Prometheus-`/metrics` (Port 9998) holen (Bridge-Pattern) + Frontend rendert Key-Metrics als Cards: CPU, RAM, Bytes in/out, Streams, pro-Pfad.
- **Warum:** Doku-Haupt-Feature („Extract metrics from the server in a Prometheus-compatible format"). Aktuell nur Config-Toggle (`metrics: false`), **kein** Daten-View. Komplement zu Dashboard (Zähler) + Logs (Events) → drittes Monitoring-Bein.
- **Infra:** Port 9998 gemappt (`compose-mediamtx.yml:12`), `metrics`-Config-Feld existiert (`fieldCatalog.js:83`).
- **Aufwand:** mittel. Server-Proxy + Frontend-Page + i18n. Gleiche Architektur wie Logs-Page.
- **Abhängigkeiten:** `metrics: true` (geht schon im Global-Config-Formular).
- **Akzeptanz:** `/metrics` erreichbar, CPU/RAM/Bytes/Streams sichtbar, Auto-Refresh, i18n en/de/it, Build grün.

### S2 — JWKS-Refresh-Button 🟡

- **Was:** Button (z. B. in der Authentication-Gruppe oder Runtime) → `POST /v3/auth/jwks/refresh`.
- **Warum:** Einziger Runtime-Action-Endpunkt, der in der UI nicht erreichbar ist. Relevant bei `authMethod: jwt` (JWKS manuell neu laden).
- **Aufwand:** klein. 1 POST + 1 Button + i18n.
- **Abhängigkeiten:** `authMethod: jwt` (sonst irrelevant).
- **Akzeptanz:** Button triggert den Refresh, Erfolg/Fehler sichtbar.

### S3 — TOOLS-System 🟡

- **Was:** Modulares Tool-System (`PLAN_TOOLS.md`): Server-Registry (`Tool` + `ToolRegistry` + `ToolsRouter`) + Frontend-Registry (`TOOLS[]` + Nav + Routen). Erstes Tool: Switch-Dummy.
- **Warum:** Foundation für zukünftige Tools. Neues Tool = 1 Datei + 1 Registry-Eintrag (pro Seite).
- **Aufwand:** mittel (21 Schritte, 6 Phasen).
- **Abhängigkeiten:** keine.
- **Akzeptanz:** `GET /tools` + `GET /tool/switch` antworten, Sidebar „Tools" → „Switch", i18n, Build grün, Modularität bestätigt.

### C1 — Frontend lint/test-Scripts 🟢

- **Was:** `lint` + `test`-Scripts in `frontend/package.json` (ESLint + Vitest oder ähnliches).
- **Warum:** Fehlen aktuell. Qualität + CI.
- **Aufwand:** klein.
- **Akzeptanz:** `npm run lint` + `npm test` (frontend) grün.

### C2 — Code-Splitting (Lazy-Routing) 🟢

- **Was:** `React.lazy` + `Suspense` pro Page. Reduziert Bundle-Size + Initial-Load.
- **Aufwand:** mittel.
- **Abhängigkeiten:** nach stabilen Features (vermeidet Rework).
- **Akzeptanz:** Bundle-Size sinkt, Initial-Load schneller, alle Routen laden korrekt.

### C3 — vite.config.js Cleanup 🟢

- **Was:** Debug-`console.log` entfernen, toter `ws`-Block aufräumen.
- **Aufwand:** klein.
- **Akzeptanz:** `vite.config.js` ohne Dead Code, Build grün.

### C4 — Logs-Refinements 🟢

- **Was:** Server-seitiges Level-Filtern, Backpressure-Throttling, `mediamtxLogPath` in Settings-UI.
- **Aufwand:** klein–mittel.
- **Akzeptanz:** Level-Filter server-seitig, Backpressure greift, `mediamtxLogPath` in Settings editierbar.

### C5 — Recordings-Refinements 🟢

- **Was:** Exakte Duration via Playback-`/list`, Format-Toggle (fmp4/mp4), Download-Button, Thumbnails.
- **Aufwand:** klein–mittel.
- **Akzeptanz:** Duration exakt, Format wählbar, Download funktioniert, Thumbnails sichtbar.

### C6 — Pprof / Performance-View 🟢

- **Was:** Neue Page für Pprof (CPU-Profile, Heap). Analog zu Metrics.
- **Warum:** Doku-Feature („Monitor performance"). Dev-Tool, geringerer Admin-Wert.
- **Aufwand:** mittel.
- **Abhängigkeiten:** `pprof: true` (Config-Toggle existiert).
- **Akzeptanz:** `/pprof` erreichbar, CPU/Heap-Profile sichtbar.

### C7 — Build-Permission-Fix 🟢

- **Was:** `frontend/dist/assets` root-eigentlich → `npm run build` auf Host EACCES. Fix: Ownership korrigieren oder Build-Verzeichnis umziehen.
- **Aufwand:** klein.
- **Akzeptanz:** `npm run build` (frontend) auf Host ohne EACCES.

---

## 5. Vor der Umsetzung verifizieren

| Item | Frage | Warum |
|------|-------|-------|
| **M3** | Ist `MEDIAMTX_CONFIG_PATH` in der Ziel-Umgebung gesetzt? | In `.env.default` **ja** → Bug aktiv. Wenn leer → Bug inaktiv (Persistenz aus). |
| **S2** | Wird `authMethod: jwt` genutzt? | Sonst ist der JWKS-Refresh-Button irrelevant. |
| **S3** | Wird die TOOLS-Extensibilität wirklich gebraucht? | Sonst auf den konkreten Use-Case warten (Dummy hat keinen Eigenwert). |
| **S1** | Ist `metrics: true` in der Ziel-Umgebung gewünscht? | Sonst zeigt die Metrics-Page „nicht konfiguriert". |

---

## 6. Parkplatz / Backlog (langfristig)

- **Multi-View** (2×2 / 3×3 Grid) in Theatre — mehrere `<video>` + `Hls`-Instanzen.
- **Echte Vorschau-Videos** in Theatre-Tiles (N parallele HLS-Verbindungen, Bandbreite).
- **Playlist** (mehrere Recordings-Segmente nacheinander).
- **Icon-Only-Modus** (Sidebar nur Icons, ohne Labels).
- **Dynamische Nav aus `GET /tools`** (Server steuert sichtbare Tools).
- **Password Show/Hide** (`Eye` / `EyeOff`) in Forms.
- **JsonBlock Copy** (`Copy`-Button).
- **Frontend-Test-Framework** (aktuell: manuell via Build + E2E).

---

## 7. Zusammenfassung (TL;DR)

**Reihenfolge in einem Satz:**
> ErrorBoundary → Recordings-onError → Passwort-Bug → WS-Auth → **Metrics-Page** → JWKS-Button → (TOOLS) → lint/test → Build-Fix → vite-Cleanup → Code-Splitting → Logs/Recordings-Refinements → Pprof.

**Top-3 (höchster Wert / dringendste):**
1. 🔴 **M3** Passwort-Persistenz-Bug (Datenverlust)
2. 🔴 **M1** ErrorBoundary (White-Screen-Schutz)
3. 🟡 **S1** Metrics-Page (Doku-Haupt-Feature, Infra bereit)
