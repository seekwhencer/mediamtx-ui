# Roadmap: OpenAPI-Spec als Admin-Interface implementieren

> **Stand:** 2026-10-20 — abgeleitet aus `INITIAL_BASICS.md` (Abschnitt 6), gegen den Ist-Zustand des Codes abgeglichen.
> - Grundlagen: siehe `INITIAL_BASICS.md`
> - Server (Backend): siehe `INITIAL_SERVER.md`
> - Frontend: siehe `INITIAL_FRONTEND.md`
> - Einstellungen (Settings): siehe `INITIAL_SETTINGS.md`

**Legende:** ✅ erledigt · 🚧 teilweise · ⬜ offen

**Aufbau:** 10 Phasen, sequenziell. Jede Phase ist abgeschlossen, wenn alle Akzeptanzkriterien grün sind. Abhängigkeiten: Phase 2 braucht Phase 1, Phase 3 braucht Phase 2, Phase 5–8 brauchen Phase 4, Phase 9 braucht Phase 7 (FormBuilder), Phase 10 braucht alles.

## Status-Übersicht

| Phase | Fortschritt | Aufwand |
|-------|-------------|---------|
| Phase 1: Server-Grundgerüst & Cleanup | 7/7 | 3/10 |
| Phase 2: MediaMTX-Bridge | 4/4 | 4/10 |
| Phase 3: Router-Integration & Health | 3/3 | 2/10 |
| Phase 4: Frontend-Fundament | 8/8 | 8/10 |
| Phase 5: Layout & Routing | 3/3 | 4/10 |
| Phase 6: Dashboard | 4/4 | 4/10 |
| Phase 7: Config-Pages & FormBuilder | 5/5 | 9/10 |
| Phase 8: Runtime-Pages & Recordings | 8/8 | 7/10 |
| Phase 9: Einstellungen (Settings) | 8/8 | 7/10 |
| Phase 10: Integration & Testing | 7/7 | 5/10 |

**Gesamt: 57/57 · Gesamtaufwand: 60/100**

---

## Phase 1: Server-Grundgerüst & Cleanup · Aufwand 3/10

> Basis für alles Weitere. Config kennt MediaMTX-Anbindung, Server ist sauber, Express-5-Bug behoben.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 1.1 | `Config.js` erweitern (`mediamtxBaseUrl`, `mediamtxAuthToken`, `bridgePrefix`, `bridgeTimeout`) + `buildDefaults()`/`saveDefaults()` | Env-Variablen werden gelesen, Defaults stimmen | ✅ |
| 1.2 | `.env.default` befüllen (aktuell leer) | Alle Env-Variablen aus `INITIAL_SERVER.md` 4.7 vorhanden | ✅ |
| 1.3 | `Server.js`-Constructor aufräumen (ungenutzte Parameter `sync`, `search`) | Constructor nur mit `config`, `logger` | ✅ |
| 1.4 | Error-Handler in `Server.js` anpassen (404 + 500) | 404/500 liefern `{ error, status: 'error', code }` | ✅ |
| 1.5 | `ApiRouter.js`-Stub löschen | Datei weg, kein Syntax-Fehler mehr, keine Referenz | ✅ |
| 1.6 | Express-5-Catch-all in `FrontendRouter.js` fixen (`'*'` → `'/*splat'`) | Production-Mode startet ohne Route-Registrierungs-Fehler | ✅ |
| 1.7 | `Logger.js`: `setVerbose(bool)` ergänzen | Verbose zur Laufzeit umschaltbar | ✅ |

**Erledigt (2026-10-19):**
- Alle 7 Schritte umgesetzt und verifiziert (Syntax-Checks, Smoke-Tests in Production- und Dev-Modus).
- Zusätzlich behoben (blockierende Ist-Zustands-Bugs): `index.js`-Imports zeigten auf `./Config.js` statt `./src/Config.js` (Entry-Point startete nicht); `FrontendRouter`-Pfade (`index.html`, Vite-Root, `buildDir`) wurden für die `src/`-Layout auflöst; `Dockerfile` kopiert jetzt das komplette `server/`-Verzeichnis (zuvor fehlte `Router/` im Image).

---

## Phase 2: MediaMTX-Bridge · Aufwand 4/10

> Die eine Klasse. Agnostischer Reverse-Proxy zu MediaMTX. Kein pro-Endpoint-Code.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 2.1 | `MediaMTXBridge.js` implementieren (eine Klasse, agnostischer Proxy) | Request unter `/v3/*` wird 1:1 an MediaMTX weitergeleitet (Methode, Pfad, Query, Body, Header) | ✅ |
| 2.2 | `createClient()` auslagern + `applyConfig(config)` | BaseUrl/Token/Timeout wirken ohne Restart (Client wird neu angelegt) | ✅ |
| 2.3 | Tests schreiben (vitest: `MediaMTXBridge.test.js`) | Forwarding, Status-/Body-Weiterleitung, Auth-Token, Fehler-Mapping (502 `upstream_unreachable`) grün | ✅ |
| 2.4 | Manuell testen (curl gegen lokalen MediaMTX) | `/v3/info`, `/v3/paths/list` etc. liefern korrekte JSON | ✅ |

**Erledigt (2026-10-20):**
- `server/src/Bridge/MediaMTXBridge.js` implementiert (eine Klasse, agnostischer Reverse-Proxy; `createClient()` + `applyConfig()` für Runtime-Wechsel ohne Restart).
- `server/src/Bridge/MediaMTXBridge.test.js`: 13 Tests grün (Forwarding, Status-/Body-Weiterleitung, Auth-Token, Fehler-Mapping 502 `upstream_unreachable`, `applyConfig`, `router()`).
- 2.4: MediaMTX auf `:9997` **nicht erreichbar** → stattdessen End-to-End verifiziert mit Mock-Server (Express-Stub) + Bridge auf echten HTTP-Ports: Forwarding, Query/Body, Auth-Token, 404-Weiterleitung, 502-Mapping, `applyConfig` — alle Checks bestanden.

---

## Phase 3: Router-Integration & Health · Aufwand 2/10

> Bridge + `/health` vor dem Frontend-Catch-all. Reihenfolge ist Pflicht.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 3.1 | `Router/index.js` aktualisieren: `/health` + Bridge **vor** FrontendRouter | `/v3/*` funktioniert, Frontend + `/health` bleiben erreichbar | ✅ |
| 3.2 | Reihenfolge verifizieren (Health → Bridge → Frontend) | In Production frisst der Catch-all weder `/health` noch `/v3` | ✅ |
| 3.3 | Dev-Modus testen (Vite Dev via FrontendRouter) | `npm run dev` → UI + API erreichbar | ✅ |

**Erledigt (2026-10-20):**
- `server/src/Router/index.js`: Reihenfolge jetzt `/health` → `MediaMTXBridge` (Mount `config.bridgePrefix || '/v3'`) → `FrontendRouter` (Catch-all zuletzt). Bridge-Instanz als `this.bridge` gehalten (für Phase 9 `applyConfig`-Verdrahtung).
- 3.2 Production-Smoke-Test: `GET /health` → 200 `{"status":"ok"}`; `GET /v3/info` → 502 `{ code: 'upstream_unreachable' }` (Bridge antwortet, **nicht** der Frontend-Catch-all); `GET /` → 200 `index.html` (Static aus `dist`).
- 3.3 Dev-Smoke-Test (`NODE_ENV=development`): `GET /` → 200 Vite-transformiertes HTML (react-refresh aktiv), `GET /src/main.jsx` → 200 JS (Vite-Transform), `GET /health` → 200, `GET /v3/info` → 502 `upstream_unreachable` (Bridge).
- `npm test` (vitest): 13/13 grün; `node --check` auf geänderter Datei OK.

---

## Phase 4: Frontend-Fundament · Aufwand 8/10

> API-Client, Query-Keys, Hooks, Utils, UI-Bausteine, generische Tabelle, Markdown, Styling.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 4.1 | `api/client.js` implementieren (Axios-Instanz + generische `api.get/post/patch/delete` + Response-Interceptor) | Aufruf über OpenAPI-Pfade, keine Einzel-Funktionen, Fehler werden gemappt | ✅ |
| 4.2 | `services/queryKeys.js` implementieren | Alle Query-Keys definiert (Listen + Details) | ✅ |
| 4.3 | `hooks/useApi.js` + `hooks/usePagination.js` implementieren | `useListQuery`/`useMutationWithInvalidate` + `page`/`itemsPerPage`-State | ✅ |
| 4.4 | `utils/` implementieren (`formatBytes`, `formatDate`, `constants`) | Bytes/Daten formatiert, Status-Farben + Enum-Labels vorhanden | ✅ |
| 4.5 | UI-Komponenten implementieren (Button, Input, Select, Toggle, Slider, TagInput, MultiSelect, Badge, Modal, Card, Spinner, ErrorAlert) | Komponenten rendern korrekt, Toggle/Slider/TagInput/MultiSelect funktionieren | ✅ |
| 4.6 | `DataTable.jsx` + `Pagination.jsx` implementieren | Generische Tabelle mit Pagination, Loading/Error, Row-Click | ✅ |
| 4.7 | `Markdown`-Komponente integrieren (`react-markdown` + `remark-gfm`) | Description-Texte gerendert | ✅ |
| 4.8 | Styling (`style/index.css`) | CSS-Variablen, Layout, Tabellen, Komponenten — konsistentes Design | ✅ |

**Erledigt (2026-10-20):**
- 4.1 `frontend/src/api/client.js`: Axios-Instanz (baseURL `/v3`, `VITE_MEDIAMTX_API_URL`-Override, Timeout 10s), Response-Interceptor (liefert `res.data`, mappt Fehler auf `Error` mit `code`/`status`), generische `api.get/post/patch/delete`.
- 4.2 `frontend/src/services/queryKeys.js`: alle Query-Keys aus `INITIAL_FRONTEND.md` §5.5 (Listen + Details).
- 4.3 `frontend/src/hooks/useApi.js` (`useListQuery` mit `placeholderData`/`staleTime: 5000`, `useMutationWithInvalidate`) + `frontend/src/hooks/usePagination.js`.
- 4.4 `frontend/src/utils/`: `formatBytes.js`, `formatDate.js`, `constants.js` (`STATUS_COLORS` + `ENUM_LABELS` für alle 22 Enums aus §3.2 + `enumLabel()`-Helper).
- 4.5 `frontend/src/components/ui/`: Button, Input, Select, Toggle, Slider, TagInput, MultiSelect, Badge, Modal, Card, Spinner, ErrorAlert (funktionale Komponenten, CSS-only, accessible: `role="switch"`, `aria-*`).
- 4.6 `frontend/src/components/tables/`: `DataTable.jsx` (generisch, sortable, Loading/Spinner, Error/ErrorAlert, Row-Click, Empty-State) + `Pagination.jsx` (Seite X von Y, Zurück/Weiter, itemsPerPage 10/25/50/100).
- 4.7 `frontend/src/components/ui/Markdown.jsx`: `react-markdown` + `remark-gfm`.
- 4.8 `frontend/src/style/components.css` (via `index.css` importiert): Buttons, Form-Fields, Toggle, Slider, TagInput, MultiSelect, Badge, Modal, Card, Spinner, ErrorAlert, Markdown, DataTable, Pagination, Layout (Sidebar/Main, responsive <768px), Page-Helfer — konsistent mit bestehendem `variables.css`-Designsystem (Light/Dark). `variables.css` um `--color-success`/`--color-success-subtle` (Light + Dark) erweitert.
- **Abweichung (dokumentiert):** `axios` war nicht in `frontend/package.json` → als Dependency ergänzt (`^1.20.0`, gleiche Version wie Server) + `npm install`.
- Verifikation: `npm run build` grün; zusätzlich Build-Check mit temporärem Entry, der alle 25 neuen Module importiert (380 Module transformiert, grün); Utils-Smoke-Test via Node (formatBytes/formatDate/constants) grün. Kein Lint-Setup im Frontend vorhanden.

---

## Phase 5: Layout & Routing · Aufwand 4/10

> Navigation + alle Routen erreichbar.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 5.1 | Layout implementieren (`Layout`, `Sidebar`, `TopBar`) | Sidebar + TopBar + `<Outlet/>`, Navigation funktioniert | ✅ |
| 5.2 | `App.jsx` mit `<Routes>` aktualisieren | Alle Routen erreichbar (Config, Runtime, Recordings) | ✅ |
| 5.3 | `NotFound`-Page + Catch-all-Route | Unbekannte Pfade zeigen 404-Page | ✅ |

**Erledigt (2026-10-20):**
- 5.1 `frontend/src/components/layout/`: `Layout.jsx` (Sidebar + TopBar + `<Outlet/>`), `Sidebar.jsx` (NavLink-Navigation, gruppiert: Übersicht/Konfiguration/Laufzeit/Aufnahmen, aktive Markierung), `TopBar.jsx` (Titel aus Pfad, Refresh-Button via `queryClient.refetchQueries`, Status-Badge online/offline via `/v3/info` mit 10s-Auto-Refresh). Gemeinsame Nav-Daten + `titleForPath()` in `navItems.js`.
- 5.2 `App.jsx`: alle Routen aus `INITIAL_FRONTEND.md` §5.6 unter `<Route element={<Layout/>}>`. Page-Komponenten sind Platzhalter unter `components/pages/` (gemeinsame `PlaceholderPage.jsx` mit Titel + „kommt in Phase X"), werden in Phase 6–8 durch die echten Pages ersetzt.
- 5.3 `NotFound.jsx` + Catch-all-Route `path="*"` (404-Page mit Link zum Dashboard).
- Styling: Sidebar-Nav, TopBar-Actions, NotFound in `style/components.css` ergänzt (bestehendes Layout-/Page-CSS aus Phase 4 genutzt).
- Verifikation: `npm run build` grün (152 Module); Dev-Smoke-Test (`NODE_ENV=development`, Port 3210): `GET /` → 200, alle neuen Module via Vite transformiert (200), `/health` → 200, `/v3/info` → 502 `upstream_unreachable` (Bridge intakt); SSR-Smoke-Test (Vite `ssrLoadModule` + `renderToString`): alle 16 Routen rendern ohne JS-Fehler mit Sidebar + TopBar, 404-Page + Platzhalter-Inhalte korrekt.

---

## Phase 6: Dashboard · Aufwand 4/10

> Übersicht: Karten pro Protokoll, Info, Pfad-Status, Auto-Refresh.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 6.1 | Karten pro Protokoll (HLS, RTSP, RTSPS, RTMP, RTMPS, SRT, WebRTC, MoQ) | Muxer-/Session-/Conn-Anzahlen pro Protokoll | ✅ |
| 6.2 | Info-Karte (Version, Startzeit aus `/v3/info`) | Version + Startzeit sichtbar | ✅ |
| 6.3 | Pfad-Übersicht (Anzahl online/available aus `/v3/paths/list`) | Online/Available-Zähler | ✅ |
| 6.4 | Auto-Refresh (`refetchInterval`) | Alle Listen aktualisieren sich automatisch | ✅ |

**Erledigt (2026-10-20):**
- 6.1 `frontend/src/components/dashboard/ProtocolCard.jsx` + `Dashboard.jsx`: 8 Karten (HLS: Muxer+Sessions, RTSP/RTSPS: Conns+Sessions, RTMP/RTMPS/SRT: Conns, WebRTC/MoQ: Sessions) via `useListQuery` auf die jeweiligen `/list`-Endpoints (`itemCount`), je Karte Link zur Runtime-Page.
- 6.2 `frontend/src/components/dashboard/InfoCard.jsx`: Version + Startzeit aus `/v3/info` (Query-Key `QUERY_KEYS.info`, geteilter Cache mit TopBar).
- 6.3 `frontend/src/components/dashboard/PathsCard.jsx`: Pfade gesamt + online/available-Zähler aus `/v3/paths/list` (nur `online`/`available` — deprecated `ready` nicht genutzt), Link zu `/paths`.
- 6.4 Auto-Refresh: `refetchInterval: 10000` auf allen 12 Listen + Info-Query; `useListQuery` (`hooks/useApi.js`) akzeptiert jetzt zusätzliche Query-Optionen (Backward-kompatibel).
- Zusätzlich (§5.7): `frontend/src/components/dashboard/QuickLinks.jsx` — Schnellzugriff-Links zu den 4 Config-Pages.
- Styling: `.ui-link`, `.dashboard__section`, `.protocol-card__*`, `.info-card__*`, `.paths-card__*`, `.quicklinks` in `style/components.css` (bestehendes Designsystem: CSS-Variablen, Light/Dark).
- Verifikation: `npm run build` grün (160 Module); SSR-Smoke-Test (Vite `ssrLoadModule` + `renderToString`): Pending-State (Spinner), Error-State (ErrorAlerts + `upstream_unreachable`-Code, TopBar offline) und Data-State (Version, Startzeit, alle Zähler korrekt) rendern ohne JS-Fehler.

---

## Phase 7: Config-Pages & FormBuilder · Aufwand 9/10

> Schema-gesteuerte Formulare. Neue MediaMTX-Felder = einzeiliger Katalog-Eintrag.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 7.1 | `fieldCatalog.js` implementieren (`GLOBAL_CONF_CATALOG`, `PATH_CONF_CATALOG`, `INTERNAL_USER_CATALOG`) | Alle Felder mit Element-Typ, Gruppe, Options, Deprecated-Markierung | ✅ |
| 7.2 | `FormBuilder.jsx` + `FormField.jsx` + `ListEditor.jsx` implementieren | Rendert Formular aus Katalog, deprecated-Felder ausgeblendet, Validierung | ✅ |
| 7.3 | `GlobalConfigForm.jsx` + Page `ConfigGlobal` | GlobalConf laden, editieren, PATCH, invalidate | ✅ |
| 7.4 | `PathConfigForm.jsx` + Pages `ConfigPathDefaults`, `ConfigPaths`, `ConfigPathDetail` | Path Defaults + Pfad-CRUD (Add/Edit/Replace/Delete) | ✅ |
| 7.5 | `InternalUserForm.jsx` + Page `InternalUsers` | User-CRUD (Add/Edit/Replace/Delete) + Permissions-Liste | ✅ |

**Erledigt (2026-10-20):**
- 7.1 `frontend/src/components/forms/fieldCatalog.js`: `GLOBAL_CONF_CATALOG` (121 aktiv + 29 deprecated), `PATH_CONF_CATALOG` (91 aktiv + 24 deprecated), `INTERNAL_USER_CATALOG` (4 Felder, `user` Pflichtfeld). Alle Felder aus `INITIAL_FRONTEND.md` §5.13.2–5.13.4 mit Element-Typ, Gruppe, Options, min/max/step (Slider), itemSchema (List), placeholder (duration/size), deprecated-Markierung. Zusätzlich reine Helfer: `validateValues` (Pflichtfelder, Zahlen-Range, Duration-/Size-Format, Select-Options, Listen rekursiv), `normalizeForSubmit` (leer → `null`, Zahlen parsen, Listen rekursiv; unbekannte Keys aus dem geladenen Objekt bleiben erhalten → MediaMTX bekommt das vollständige Objekt bei PATCH), `getGroups` (Gruppierung nach `field.group`, deprecated übersprungen).
- 7.2 `frontend/src/components/forms/FormBuilder.jsx` + `FormField.jsx` + `ListEditor.jsx`: rendert Formular aus Katalog, deprecated-Felder ausgeblendet, Gruppierung als Accordion (`<details>`), Validierung (Pflichtfelder, Zahlen-Range, Duration-Format), nullable-Felder (leer = `null`), `ListEditor` für Array-von-Objekt (Zeile hinzufügen/entfernen, rekursiv via `FormField`). Werte werden synchron initialisiert (lazy `useState`), wenn `initialValues` beim Mount vorliegen (Modal-Flows + SSR); asynchrone Query-Daten kommen über einen Effect.
- 7.3 `frontend/src/components/forms/GlobalConfigForm.jsx` + Page `ConfigGlobal.jsx`: `useQuery` holt `GET /config/global/get` → `FormBuilder` mit `GLOBAL_CONF_CATALOG` → `onSubmit` → `PATCH /config/global/patch` → invalidate `QUERY_KEYS.globalConfig`.
- 7.4 `frontend/src/components/forms/PathConfigForm.jsx` (dünn, Daten + Submit von der Page) + Pages `ConfigPathDefaults.jsx` (`PATCH /config/path-defaults/patch`), `ConfigPaths.jsx` (Tabelle + Add `POST /config/paths/add/{name}`, Edit `PATCH /config/paths/patch/{name}`, Replace `POST /config/paths/replace/{name}`, Delete `DELETE /config/paths/delete/{name}`), `ConfigPathDetail.jsx` (`GET /config/paths/get/{name}` → `PATCH /config/paths/patch/{name}`). Path-Parameter immer `encodeURIComponent()`.
- 7.5 `frontend/src/components/forms/InternalUserForm.jsx` + Page `InternalUsers.jsx`: Tabelle (paginiert) + Add `POST /config/internal-users/add`, Edit `PATCH /config/internal-users/patch/{id}`, Replace `POST /config/internal-users/replace/{id}`, Delete `DELETE /config/internal-users/delete/{id}` + Permissions-Liste via `ListEditor`.
- Verifikation: `npm run build` grün; SSR-Smoke-Test (`frontend/ssr-smoke-phase7.mjs`, Vite `ssrLoadModule` + `renderToString`): alle 5 Pages in Pending-State (Spinner), Error-State (ErrorAlert + `upstream_unreachable` statt Crash) und Data-State (Formular mit Gruppen, Slidern, ListEditor, Tabellen) rendern ohne JS-Fehler; deprecated-Felder ausgeblendet; Pfad-Name mit Sonderzeichen (`cam 1/x`) korrekt encodiert/dekodiert. Zähl-Check: alle Felder aus §5.13.2–5.13.4 vorhanden, deprecated-Markierung korrekt.
- Abweichung (dokumentiert): `ConfigPaths.jsx` Edit/Replace-Modal strippt jetzt `name` aus der List-Zeile, bevor sie als `initialValues` übergeben wird (sonst landet `name` im PATCH/POST-Body des PathConf-Objekts).

---

## Phase 8: Runtime-Pages & Recordings · Aufwand 7/10

> Laufzeit-Monitoring: Listen + Detail + Kick für alle Protokolle, Recordings.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 8.1 | `RuntimePaths.jsx` + `RuntimePathDetail.jsx` | Pfad-Liste + Detail (Source, Readers, Tracks, Forward-Dests, Static Source) | ✅ |
| 8.2 | `HLS.jsx` (Muxer + Sessions + Kick) | Tabs, Listen, Kick-Button | ✅ |
| 8.3 | `RTSP.jsx` + `RTSPS` (Conns + Sessions + Kick) | Tabs, Listen, Kick-Button | ✅ |
| 8.4 | `RTMP.jsx` + `RTMPS` (Conns + Kick) | Listen, Kick-Button | ✅ |
| 8.5 | `SRT.jsx` (Conns + Kick) | Liste, Kick-Button, SRT-Statistiken als JSON-Block | ✅ |
| 8.6 | `WebRTC.jsx` (Sessions + Kick) | Liste, Kick-Button | ✅ |
| 8.7 | `MoQ.jsx` (Sessions + Kick) | Liste, Kick-Button | ✅ |
| 8.8 | `Recordings.jsx` (Liste + Segment-Delete) | Recording-Liste, Segmente, Delete pro Segment | ✅ |

**Erledigt (2026-10-20):**
- 8.1 `RuntimePaths.jsx` (Tabelle: name, online/available-Badges, source.type, readers.length — deprecated `ready` nicht genutzt, Row-Click → Detail) + `RuntimePathDetail.jsx` (Status-Badges + Bytes/Zeiten, Source-Details, Readers-Liste, Tracks mit Codec + `codecProps` als JSON-Block, Forward-Destinations-Tabelle aus `/paths/forward-dests/list?path=<name>` mit state-Badge + `typeSpecific`-Details-Modal, Static Source aus `/paths/static-sources/get/<name>` (404 → Hinweis statt ErrorAlert) + `typeSpecific` als JSON-Block).
- 8.2 `HLS.jsx`: Tabs Muxer | Sessions; Muxer-Tabelle (path, created, lastRequest, outboundBytes, outboundFramesDiscarded); Sessions-Tabelle (id, created, path, remoteAddr, user, userAgent, isCDN, outboundBytes) + Kick (`POST /hls/sessions/kick/{id}`).
- 8.3 `RTSP.jsx`: Tabs RTSP | RTSPS, je mit Tabs Connections | Sessions (gemeinsame `RTSPSection`-Komponente, `base`-Parameter); Conns (id, created, remoteAddr, session, tunnel, inbound/outboundBytes); Sessions (id, created, path, remoteAddr, user, state-Badge, transport, Bytes) + Kick (`POST /rtsp[s]/sessions/kick/{id}`).
- 8.4 `RTMP.jsx`: Tabs RTMP | RTMPS (gemeinsame `RTMPSection`-Komponente); Conns (id, created, path, remoteAddr, user, state-Badge, Bytes) + Kick (`POST /rtmp[s]/conns/kick/{id}`).
- 8.5 `SRT.jsx`: Conns (id, created, path, remoteAddr, user, state-Badge, Bytes) + Kick (`POST /srt/conns/kick/{id}`) + Stats-Button pro Zeile → Modal mit SRTConn (inkl. SRT-Statistiken) als JSON-Block.
- 8.6 `WebRTC.jsx`: Sessions (id, created, path, remoteAddr, user, state-Badge read/publish, localCandidate, remoteCandidate, Bytes) + Kick (`POST /webrtc/sessions/kick/{id}`).
- 8.7 `MoQ.jsx`: Sessions (id, created, path, remoteAddr, userAgent, state-Badge idle/read/publish, version, transport, Bytes) + Kick (`POST /moq/sessions/kick/{id}`).
- 8.8 `Recordings.jsx`: Tabelle (paginiert: name, segments.length), Row-Click → Modal mit Segmenten (start formatiert) + Delete-Button pro Segment (`DELETE /recordings/segments/delete?path=<name>&start=<start>`).
- Gemeinsame Bausteine: `components/ui/Tabs.jsx` (Tab-Panel, inaktive Panels bleiben gemountet), `components/ui/JsonBlock.jsx` (JSON-Code-Block für `typeSpecific`/`codecProps`, eigene Komponente statt FormBuilder-Feld), `components/ui/KickButton.jsx`, `hooks/useKick.js` (Kick-Mutation mit `encodeURIComponent(id)` + `useMutationWithInvalidate`).
- Alle Listen: `refetchInterval: 10000`; Path-Parameter immer `encodeURIComponent()`; Kick → invalidate der Listen-Keys.
- Styling: Tabs, JsonBlock, Detail-Sektionen (Status/Source/Readers/Tracks), Segment-Liste in `style/components.css` (bestehendes Designsystem).
- Verifikation: `npm run build` grün; SSR-Smoke-Test (`frontend/ssr-smoke-phase8.mjs`, Vite `ssrLoadModule` + `renderToString`): alle 9 Pages in Pending-State (Spinner), Error-State (ErrorAlert + `upstream_unreachable` statt Crash) und Data-State (Tabellen, Badges, JSON-Blöcke, Kick-Buttons) rendern ohne JS-Fehler; Phase-7-Smoke-Test als Regression grün.

---

## Phase 9: Einstellungen (Settings) · Aufwand 7/10

> Alle Config-Parameter der App einseh- und änderbar. Server-Settings via API, App-Settings lokal.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 9.1 | `Config.js` erweitern (`getSettings`, `updateSettings`, `maskSecret`, `validateSettings`, `persist`) | Settings lesbar/änderbar, Token maskiert, ungültige Werte abgelehnt | ✅ |
| 9.2 | `SettingsRouter.js` implementieren (`GET`/`PATCH /api/settings`) | Endpunkte antworten mit `{ success, data }` / `{ success: false, error, code }` | ✅ |
| 9.3 | `Router/index.js`: `SettingsRouter` registrieren (nach `/health`, vor Bridge/Frontend) + Applier verdrahten | `/api/settings` erreichbar, `/v3` + Frontend + `/health` bleiben intakt | ✅ |
| 9.4 | Tests schreiben (vitest: `Config.test.js`, `SettingsRouter.test.js`) | Maskierung, Validierung, Persistenz, applied/restartRequired grün | ✅ |
| 9.5 | `services/appSettings.js` implementieren (localStorage + `useAppSettings`) | App-Settings überleben Reload | ✅ |
| 9.6 | `api/client.js`: Base-URL-Auflösung pro Request + `localApi` | `apiBaseUrl`-Override wirkt sofort, `/api/settings` erreichbar | ✅ |
| 9.7 | Settings-Page (`/settings`) + Sidebar-Eintrag + `SERVER_SETTINGS_CATALOG`/`APP_SETTINGS_CATALOG` + `restartRequired`-Badge im FormBuilder | Alle Parameter editierbar, applied/restartRequired-Feedback, Token-Regel (maskiert = kein Change, leer = löschen) | ✅ |
| 9.8 | Theme (dark/light via `data-theme`) + Auto-Refresh + `itemsPerPage` aus App-Settings | Theme-Wechsel ohne Reload, Refresh-Intervall + Seitengröße konfigurierbar | ✅ |

**Erledigt (2026-10-20):**
- 9.1 `server/src/Config.js`: `runtimeKeys`/`restartKeys`, `getSettings()` (Token maskiert), `maskSecret()` (`••••` + letzte 4), `validateSettings()` (Port-Range, Boolean, http(s)-URL, Prefix-Format, Timeout-Minimum), `updateSettings()` (Token-Regel: maskiert = kein Change, leer = löschen; validieren → mergen → persistieren → klassifizieren), `persist()` (config.json).
- 9.2 `server/src/Router/SettingsRouter.js`: `GET`/`PATCH /api/settings` mit `{ success, data }` / `{ success: false, error, code }`; `setApplier()` für die Runtime-Anwendung.
- 9.3 `server/src/Router/index.js`: Reihenfolge `/health` → `SettingsRouter` → `MediaMTXBridge` → `FrontendRouter`; Applier verdrahtet `bridge.applyConfig(config)` + `logger.setVerbose(config.verbose)`.
- 9.4 `server/src/Config.test.js` (22 Tests) + `server/src/Router/SettingsRouter.test.js` (4 Tests): Maskierung, Token-Regel, Validierung (11 ungültige Fälle → 400 `invalid_settings`, nichts persistiert), Persistenz, applied/restartRequired, Applier-Aufruf. `npm test`: 39/39 grün.
- 9.5 `frontend/src/services/appSettings.js`: localStorage-Store (`mtxui.appSettings`) + `useSyncExternalStore`-Hook `useAppSettings()` (inkl. `getServerSnapshot` für SSR); Defaults `apiBaseUrl ''`, `theme 'dark'`, `autoRefreshMs 10000`, `itemsPerPage 100`.
- 9.6 `frontend/src/api/client.js`: `resolveBaseURL()` pro Request (App-Settings-Override > `VITE_MEDIAMTX_API_URL` > `/v3`, Trailing-Slash-Strip) + `localApi` (gleicher Origin) für `/api/settings`.
- 9.7 `frontend/src/components/pages/Settings.jsx` (Route `/settings`, Sidebar-Sektion „Einstellungen"): Server-Karte (Query `['settings']` → FormBuilder mit `SERVER_SETTINGS_CATALOG` → PATCH, Badges „angewendet"/„Restart erforderlich") + App-Karte (`useAppSettings` → `setAppSettings`); `SERVER_SETTINGS_CATALOG`/`APP_SETTINGS_CATALOG` in `fieldCatalog.js`; `FormField` rendert bei `restartRequired: true` ein Badge „Restart required"; Token-Regel: Prefill maskiert, leer → `''` (Löschen) — `null`-Normalisierung des FormBuilder wird in der Page zurückgemappt.
- 9.8 Theme: `App.jsx` setzt `document.documentElement.dataset.theme` aus den App-Settings (bestehendes `data-theme`-CSS in `variables.css`); Auto-Refresh: `hooks/useAutoRefresh.js` (`autoRefreshMs || false`) ersetzt alle harten `REFRESH_MS = 10000` (10 Pages + TopBar); `usePagination()` initialisiert `itemsPerPage` aus den App-Settings (alle Pages ohne Argument).
- Verifikation: `npm test` (server) 39/39 grün; `npm run build` (frontend) grün; SSR-Smoke `ssr-smoke-phase9.mjs` (Store, Base-URL-Auflösung, localApi, Fehler-Mapping, Settings-Page Pending/Error/Data, App-Route + Sidebar) grün; Phase-7/8-Smoke-Tests als Regression grün (itemsPerPage-Default 25→100 via App-Settings, Tests pinnen `itemsPerPage: 25`); Dev-Smoke (Port 3210): `/health` 200, `GET /api/settings` 200 maskiert, `PATCH` applied/restartRequired korrekt, ungültig → 400 `invalid_settings`, Token-Flow (set → maskiert → maskiert = kein Change → leer = gelöscht) + `config.json`-Persistenz, `/v3/info` → 502 `upstream_unreachable` (Bridge intakt), `/` → 200 (Frontend).
- Abweichung (dokumentiert): `updateSettings()` guardet die Token-Regel mit `typeof === 'string'` (sonst TypeError bei nicht-string-Token → 500 statt 400); `Settings.jsx` nutzt die existierende FormBuilder-API (`initialValues`/`onSubmit`) statt der Pseudo-Props aus `INITIAL_SETTINGS.md` §6.9.

---

## Phase 10: Integration & Testing · Aufwand 5/10

> End-to-End: Dev, Build, CRUD, Fehler, Pagination, Kick, Docker.

| Schritt | Aufgabe | Akzeptanzkriterium | Status |
|---------|---------|-------------------|--------|
| 10.1 | Dev-Modus testen (Vite Dev via FrontendRouter) | `npm run dev` → UI + API erreichbar | ✅ |
| 10.2 | Build testen (`vite build` → `frontend/dist`) | `NODE_ENV=production` → Static-Files, Catch-all funktioniert | ✅ |
| 10.3 | End-to-End: Alle CRUD-Operationen durchspielen | Add/Edit/Delete für Users, Paths, Recordings | ✅ |
| 10.4 | Fehlerfälle testen (404, 400, 500, 502) | ErrorAlert zeigt korrekte Meldung + `code` | ✅ |
| 10.5 | Pagination testen (page, itemsPerPage) | Seitenwechsel funktioniert, Cache korrekt | ✅ |
| 10.6 | Kick-Operationen testen (alle Protokolle) | Session wird beendet, Liste aktualisiert | ✅ |
| 10.7 | Docker-Compose testen (`compose-dev.yml`) | Container startet, UI erreichbar | ✅ |

**Erledigt (2026-10-20):**
- 10.1 Dev-SPA-Fallback fixiert (`FrontendRouter.js`): Catch-all `/*splat` mit Asset-Guard (`isAssetPath`) VOR der Vite-Middleware → Deep-Links `/paths`, `/config/global`, `/settings`, `/config/paths/cam1`, `/hls` liefern 200 `index.html` (transformiert, `@vite/client` aktiv) statt 404; `/src/main.jsx` → 200 JS (Vite-Transform); `/health` + `/v3/info` (Bridge) intakt.
- 10.2 `vite build` → `frontend/dist` grün; `NODE_ENV=production`: Static-Files + Catch-all — alle Deep-Links → 200 `index.html`, `/assets/*.js` → 200, `/health` → 200, `/v3/info` → 200 (Bridge).
- 10.3 E2E-CRUD via Mock-MediaMTX (`server/test/mock-mediamtx.js`, Express-Stub auf :9997, In-Memory-State) + Bridge (HTTP): internal-users add/list/get/patch/replace/delete, config-paths add/list/get/patch/replace/delete, recordings segments delete — 21/21 Checks grün (inkl. Wirkungs-Checks: Werte nach PATCH/REPLACE geändert, itemCount nach DELETE zurück).
- 10.4 Fehlerfälle: 404 (unbekannter User), 400 (add ohne `user`), 500 (Mock `?mockError=500`) → Status + `{ error, status: 'error' }` 1:1 weitergeleitet; 502 (Mock gestoppt) → `{ code: 'upstream_unreachable' }`. ErrorAlert rendert Meldung + `code` + HTTP-Status (Komponente `ErrorAlert.jsx`, Fehler-Mapping im Client-Interceptor).
- 10.5 Pagination (Mock mit 150 Items): page/itemsPerPage-Kombinationen (100/25), disjunkte Seiten, letzte Seite, Page über pageCount → 0 Items; Frontend-Cache korrekt via Query-Key `[key, page, itemsPerPage]` (`useListQuery`), itemsPerPage-Wechsel setzt page auf 0.
- 10.6 Kick alle 8 Protokolle (hls, rtsp, rtsps, rtmp, rtmps, srt, webrtc, moq): POST kick → 200 `{ status: 'ok' }`, Liste aktualisiert (itemCount −1 = Invalidate-Refetch); unbekannter id → 404.
- 10.7 Docker-Compose (`compose-dev.yml`): Container startet stabil, UI + API erreichbar (über `proxy_default`-Netz; kein Port-Mapping by design — Traefik-Proxy). Production-Image-Pfad zusätzlich verifiziert (Dockerfile CMD, Static-Mode: `/`, `/paths`, `/settings`, `/health`, `/assets/*.js` → 200).
- **Behobene Blocker (dokumentiert):**
  - `server/package.json` `dev`-Skript: `--watch-path=./server` (→ `server/server`, ENOENT-Crash) + `--watch-path=./config.json` (fehlt im Image → Crash) → `node --watch --watch-path=./index.js --watch-path=./src index.js`. Explizite `--watch-path` ersetzen den Default-Watch-Scope (geladene node_modules-Dateien) → verhindert den Restart-Loop (Vite schreibt `node_modules/.vite/deps_temp_*` → Watch-Trigger → Restart → Re-Optimierung → …). Frontend-HMR bleibt via Vite-Own-Watcher + WS erhalten; Server-Code-Änderungen → Prozess-Neustart.
  - `server/Dockerfile`: Layout an Host-Layout angepasst (`/app/server/` + `/app/frontend/`, `WORKDIR /app/server`) — passt zu `compose-dev.yml` (Bind-Mount `./:/app` + Named Volumes `/app/server/node_modules`, `/app/frontend/node_modules`); zuvor installierte das Image nach `/app/node_modules` → `ERR_MODULE_NOT_FOUND: express` im Dev-Container.
  - `.dockerignore` neu: `server/node_modules`, `frontend/node_modules` (Host-`node_modules` nicht ins Image kopieren).
- **Offene Punkte aus früheren Phasen:** Problem #1 (Dev-SPA-Fallback) behoben; Problem #2 (Secrets) → `.gitignore` neu angelegt (`server/config.json`, `.env`, `node_modules/`, `dist/`, Logs); Problem #3 (MediaMTX :9997 nicht erreichbar) → durch Mock-MediaMTX abgedeckt, 502 `upstream_unreachable` bleibt erwartetes Verhalten ohne Upstream.
- **Dead Code:** `frontend/src/components/pages/PlaceholderPage.jsx` entfernt (Phase-5-Platzhalter, keine Referenzen mehr — alle Pages sind real).
- Verifikation: `npm test` (server) 39/39 grün; `npm run build` (frontend) grün; `node server/test/e2e-phase10.mjs` 57/57 Checks grün; Docker compose-dev + Production-Image verifiziert.

---

## Reihenfolge & Abhängigkeiten

```
Phase 1 (Grundgerüst)
   └─> Phase 2 (Bridge)
          └─> Phase 3 (Router + Health)
                 └─> Phase 4 (Frontend-Fundament)
                        ├─> Phase 5 (Layout + Routing)
                        │      └─> Phase 6 (Dashboard)
                        │      └─> Phase 7 (Config + FormBuilder)
                        │             └─> Phase 9 (Settings)   ← braucht FormBuilder
                        │      └─> Phase 8 (Runtime + Recordings)
                        └─> Phase 10 (Integration + Testing)   ← braucht alles
```

- **Phase 1** ist die Basis — ohne saubere Config + Express-5-Fix geht nichts.
- **Phase 2–3** liefern die funktionierende API (Bridge + Routing).
- **Phase 4** ist das Frontend-Fundament — ohne API-Client + UI-Bausteine keine Pages.
- **Phase 5–8** bauen die eigentlichen Seiten (Layout → Dashboard → Config → Runtime).
- **Phase 9** (Settings) braucht den FormBuilder aus Phase 7.
- **Phase 10** (Integration) ist der Abschluss — braucht alle vorherigen Phasen.

> **Tipp:** Phasen 6, 7, 8 sind nach Phase 5 weitgehend unabhängig und können parallelisiert werden. Phase 9 kann nach Phase 7 direkt angegangen werden (nicht erst nach Phase 8).
