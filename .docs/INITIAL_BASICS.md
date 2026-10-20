# Konzept: OpenAPI-Spec als Admin-Interface implementieren — Grundlagen

Dieses Konzept beschreibt die Implementierung der `mediamtx/openapi.yml` (OpenAPI 3.0.0) als Admin-Interface für den MediaMTX-Server. Es ist unterteilt in die Bereiche **Server** (Backend) und **Frontend**.

> **Quellen:**
> - OpenAPI-Spec: `mediamtx/openapi.yml` (4976 Zeilen, 56 Operationen, ~90 Schemas)
> - Konfigurationsdatei: `mediamtx/mediamtx.yml` (aktuelle MediaMTX-Version)
> - Bestehender Code: `server/` (Express 5, ESM), `frontend/` (React 19 + Vite 8)

> **⚠️ Versionshinweis:** Dieses Dokument wurde gegen die `openapi.yml`/`mediamtx.yml` in diesem Repo (aktuelle MediaMTX-Version) abgeglichen. Ältere MediaMTX-Versionen nutzen andere Enum-Werte (z. B. `publishing`/`reading` statt `read`/`publish`, `yes` statt `strict`, `auto`/`main`/`sub` statt `mpegts`/`fmp4`/`lowLatency`) und andere Feldnamen. Alle Schemata in Abschnitt 3 entsprechen exakt der Spec in diesem Repo.

> **Teil 1 von 4 (Grundlagen):** Dieses Dokument enthält die Grundlagen (Überblick, Endpoint-Katalog, Schema-Referenz) sowie die projektweiten Abschnitte (Abhängigkeiten, Konventionen, Offene Fragen, Zusammenfassung).
> - Server (Backend): siehe `INITIAL_SERVER.md`
> - Frontend: siehe `INITIAL_FRONTEND.md`
> - Einstellungen (Settings): siehe `INITIAL_SETTINGS.md`
> - Roadmap: siehe `ROADMAP.md`

---

## 1. Überblick

Die OpenAPI-Spec definiert eine REST-API unter dem Basis-Pfad `/v3` mit folgenden Ressourcengruppen:

| Gruppe | Pfade | Endpoints | Beschreibung |
|--------|-------|-----------|--------------|
| General | `/v3/info` | 1 | Instanzinformationen (Version, Startzeit) |
| Authentication | `/v3/auth/jwks/refresh` | 1 | JWT JWKS Refresh |
| Configuration | `/v3/config/global/*` | 2 | Globale Konfiguration (get/patch) |
| Configuration | `/v3/config/path-defaults/*` | 2 | Standard-Pfad-Konfiguration (get/patch) |
| Configuration | `/v3/config/internal-users/*` | 6 | Interne Benutzer (CRUD + Replace) |
| Configuration | `/v3/config/paths/*` | 6 | Pfad-Konfigurationen (CRUD + Replace) |
| Paths | `/v3/paths/*` | 5 | Laufzeit-Pfade, Forward-Destinations, Static Sources |
| HLS | `/v3/hls/muxers/*`, `/v3/hls/sessions/*` | 5 | HLS Muxer & Sessions |
| RTSP | `/v3/rtsp/*`, `/v3/rtsps/*` | 10 | RTSP / RTSPS Connections & Sessions |
| RTMP | `/v3/rtmp/*`, `/v3/rtmps/*` | 6 | RTMP / RTMPS Connections |
| SRT | `/v3/srt/conns/*` | 3 | SRT Connections |
| WebRTC | `/v3/webrtc/sessions/*` | 3 | WebRTC Sessions |
| Media-over-QUIC | `/v3/moq/sessions/*` | 3 | MoQ Sessions |
| Recordings | `/v3/recordings/*` | 3 | Recordings & Segmente |

**Gesamt: 56 Endpoints.**

Alle Listen-Endpoints unterstützen Pagination (`page` default `0`, `itemsPerPage` default `100`) und antworten mit `{ itemCount, items, pageCount }`. Antworten sind JSON mit Schemas aus `components/schemas`.

### 1.1 Antwort- & Fehlerformate (aus der Spec)

**Erfolg:** JSON gemäß Schema, z. B.:
```json
{ "status": "ok" }
{ "started": "2026-10-19T17:00:00Z", "version": "v1.9.0" }
{ "itemCount": 2, "items": [ ... ], "pageCount": 1 }
```

**Fehler** (Schema `Error`):
```json
{ "error": "path not found", "status": "error" }
```

**Status-Codes:**
- `200` Erfolg
- `400` Invalid Request (z. B. ungültiger Parameter, fehlendes Body-Feld)
- `404` Not Found (nur bei Get/Delete/Replace einzelner Ressourcen)
- `500` Internal Server Error

> **Wichtig:** Die Spec definiert **keine** `401`/`403`-Antworten (`security: []`). Auth wird nicht behandelt (siehe Abschnitt 9).

---

## 2. Kompletter Endpoint-Katalog

Legende: **P** = Path-Parameter, **Q** = Query-Parameter, **B** = Request-Body.

### 2.1 General & Authentication

| # | Methode | Pfad | operationId | Parameter | Response 200 | Weitere Codes |
|---|---------|------|-------------|-----------|--------------|---------------|
| 1 | GET | `/v3/info` | `info` | – | `Info` | 500 |
| 2 | POST | `/v3/auth/jwks/refresh` | `authJwksRefresh` | – | `OK` | 500 |

### 2.2 Configuration

| # | Methode | Pfad | operationId | Parameter | Response 200 | Weitere Codes |
|---|---------|------|-------------|-----------|--------------|---------------|
| 3 | GET | `/v3/config/global/get` | `configGlobalGet` | – | `GlobalConf` | 400, 500 |
| 4 | PATCH | `/v3/config/global/patch` | `configGlobalSet` | B: `GlobalConf` | `GlobalConf` | 400, 500 |
| 5 | GET | `/v3/config/path-defaults/get` | `configPathDefaultsGet` | – | `PathConf` | 400, 500 |
| 6 | PATCH | `/v3/config/path-defaults/patch` | `configPathDefaultsPatch` | B: `PathConf` | `PathConf` | 400, 500 |
| 7 | GET | `/v3/config/internal-users/list` | `configInternalUsersList` | Q: `page`, `itemsPerPage` | `InternalUserList` | 400 |
| 8 | GET | `/v3/config/internal-users/get/{id}` | `configInternalUsersGet` | P: `id` (uuid) | `InternalUser` | 400, 404 |
| 9 | POST | `/v3/config/internal-users/add` | `configInternalUsersAdd` | B: `AuthInternalUser` | `InternalUserAddRes` | 400 |
| 10 | PATCH | `/v3/config/internal-users/patch/{id}` | `configInternalUsersPatch` | P: `id`, B: `OptionalAuthInternalUser` | `OK` | 400, 404 |
| 11 | POST | `/v3/config/internal-users/replace/{id}` | `configInternalUsersReplace` | P: `id`, B: `AuthInternalUser` | `OK` | 400, 404 |
| 12 | DELETE | `/v3/config/internal-users/delete/{id}` | `configInternalUsersDelete` | P: `id` | `OK` | 400, 404 |
| 13 | GET | `/v3/config/paths/list` | `configPathsList` | Q: `page`, `itemsPerPage` | `PathConfList` | 400, 500 |
| 14 | GET | `/v3/config/paths/get/{name}` | `configPathsGet` | P: `name` | `PathConf` | 400, 404, 500 |
| 15 | POST | `/v3/config/paths/add/{name}` | `configPathsAdd` | P: `name`, B: `PathConf` | `OK` | 400, 500 |
| 16 | PATCH | `/v3/config/paths/patch/{name}` | `configPathsPatch` | P: `name`, B: `PathConf` | `OK` | 400, 404, 500 |
| 17 | POST | `/v3/config/paths/replace/{name}` | `configPathsReplace` | P: `name`, B: `PathConf` | `OK` | 400, 404, 500 |
| 18 | DELETE | `/v3/config/paths/delete/{name}` | `configPathsDelete` | P: `name` | `OK` | 400, 404, 500 |

> **Achtung:** `replace` ist in der Spec **POST** (nicht PUT). `configGlobalSet` ist der operationId des **PATCH**-Endpoints.

### 2.3 Paths (Laufzeit)

| # | Methode | Pfad | operationId | Parameter | Response 200 | Weitere Codes |
|---|---------|------|-------------|-----------|--------------|---------------|
| 19 | GET | `/v3/paths/list` | `pathsList` | Q: `page`, `itemsPerPage` | `PathList` | 400, 500 |
| 20 | GET | `/v3/paths/get/{name}` | `pathsGet` | P: `name` | `Path` | 400, 404, 500 |
| 21 | GET | `/v3/paths/forward-dests/list` | `pathsForwardDestsList` | Q: `path` (required), `page`, `itemsPerPage` | `ForwardDestList` | 400, 404, 500 |
| 22 | GET | `/v3/paths/forward-dests/get` | `pathsForwardDestsGet` | Q: `id` (uuid, required), `path` (required) | `ForwardDest` | 400, 404, 500 |
| 23 | GET | `/v3/paths/static-sources/get/{name}` | `pathsStaticSourcesGet` | P: `name` | `StaticSource` | 400, 404, 500 |

> **Achtung:** `pathsForwardDestsGet` nutzt **Query-Parameter** (`id`, `path`), keine Path-Parameter.

### 2.4 HLS

| # | Methode | Pfad | operationId | Parameter | Response 200 | Weitere Codes |
|---|---------|------|-------------|-----------|--------------|---------------|
| 24 | GET | `/v3/hls/muxers/list` | `hlsMuxersList` | Q: `page`, `itemsPerPage` | `HLSMuxerList` | 400, 500 |
| 25 | GET | `/v3/hls/muxers/get/{name}` | `hlsMuxersGet` | P: `name` | `HLSMuxer` | 400, 404, 500 |
| 26 | GET | `/v3/hls/sessions/list` | `hlssessionsList` | Q: `page`, `itemsPerPage` | `HLSSessionList` | 400, 500 |
| 27 | GET | `/v3/hls/sessions/get/{id}` | `hlssessionsGet` | P: `id` (uuid) | `HLSSession` | 400, 404, 500 |
| 28 | POST | `/v3/hls/sessions/kick/{id}` | `hlssessionsKick` | P: `id` | `OK` | 400, 404, 500 |

### 2.5 RTSP / RTSPS

| # | Methode | Pfad | operationId | Parameter | Response 200 | Weitere Codes |
|---|---------|------|-------------|-----------|--------------|---------------|
| 29 | GET | `/v3/rtsp/conns/list` | `rtspConnsList` | Q: `page`, `itemsPerPage` | `RTSPConnList` | 400, 500 |
| 30 | GET | `/v3/rtsp/conns/get/{id}` | `rtspConnsGet` | P: `id` | `RTSPConn` | 400, 404, 500 |
| 31 | GET | `/v3/rtsp/sessions/list` | `rtspSessionsList` | Q: `page`, `itemsPerPage` | `RTSPSessionList` | 400, 500 |
| 32 | GET | `/v3/rtsp/sessions/get/{id}` | `rtspSessionsGet` | P: `id` | `RTSPSession` | 400, 404, 500 |
| 33 | POST | `/v3/rtsp/sessions/kick/{id}` | `rtspSessionsKick` | P: `id` | `OK` | 400, 404, 500 |
| 34 | GET | `/v3/rtsps/conns/list` | `rtspsConnsList` | Q: `page`, `itemsPerPage` | `RTSPConnList` | 400, 500 |
| 35 | GET | `/v3/rtsps/conns/get/{id}` | `rtspsConnsGet` | P: `id` | `RTSPConn` | 400, 404, 500 |
| 36 | GET | `/v3/rtsps/sessions/list` | `rtspsSessionsList` | Q: `page`, `itemsPerPage` | `RTSPSessionList` | 400, 500 |
| 37 | GET | `/v3/rtsps/sessions/get/{id}` | `rtspsSessionsGet` | P: `id` | `RTSPSession` | 400, 404, 500 |
| 38 | POST | `/v3/rtsps/sessions/kick/{id}` | `rtspsSessionsKick` | P: `id` | `OK` | 400, 404, 500 |

### 2.6 RTMP / RTMPS

| # | Methode | Pfad | operationId | Parameter | Response 200 | Weitere Codes |
|---|---------|------|-------------|-----------|--------------|---------------|
| 39 | GET | `/v3/rtmp/conns/list` | `rtmpConnsList` | Q: `page`, `itemsPerPage` | `RTMPConnList` | 400, 500 |
| 40 | GET | `/v3/rtmp/conns/get/{id}` | `rtmpConnectionsGet` | P: `id` | `RTMPConn` | 400, 404, 500 |
| 41 | POST | `/v3/rtmp/conns/kick/{id}` | `rtmpConnsKick` | P: `id` | `OK` | 400, 404, 500 |
| 42 | GET | `/v3/rtmps/conns/list` | `rtmpsConnsList` | Q: `page`, `itemsPerPage` | `RTMPConnList` | 400, 500 |
| 43 | GET | `/v3/rtmps/conns/get/{id}` | `rtmpsConnectionsGet` | P: `id` | `RTMPConn` | 400, 404, 500 |
| 44 | POST | `/v3/rtmps/conns/kick/{id}` | `rtmpsConnsKick` | P: `id` | `OK` | 400, 404, 500 |

> **Achtung:** operationIds `rtmpConnectionsGet` / `rtmpsConnectionsGet` (nicht `...ConnsGet`).

### 2.7 SRT

| # | Methode | Pfad | operationId | Parameter | Response 200 | Weitere Codes |
|---|---------|------|-------------|-----------|--------------|---------------|
| 45 | GET | `/v3/srt/conns/list` | `srtConnsList` | Q: `page`, `itemsPerPage` | `SRTConnList` | 400, 500 |
| 46 | GET | `/v3/srt/conns/get/{id}` | `srtConnsGet` | P: `id` | `SRTConn` | 400, 404, 500 |
| 47 | POST | `/v3/srt/conns/kick/{id}` | `srtConnsKick` | P: `id` | `OK` | 400, 404, 500 |

### 2.8 WebRTC

| # | Methode | Pfad | operationId | Parameter | Response 200 | Weitere Codes |
|---|---------|------|-------------|-----------|--------------|---------------|
| 48 | GET | `/v3/webrtc/sessions/list` | `webrtcSessionsList` | Q: `page`, `itemsPerPage` | `WebRTCSessionList` | 400, 500 |
| 49 | GET | `/v3/webrtc/sessions/get/{id}` | `webrtcSessionsGet` | P: `id` | `WebRTCSession` | 400, 404, 500 |
| 50 | POST | `/v3/webrtc/sessions/kick/{id}` | `webrtcSessionsKick` | P: `id` | `OK` | 400, 404, 500 |

### 2.9 Media-over-QUIC

| # | Methode | Pfad | operationId | Parameter | Response 200 | Weitere Codes |
|---|---------|------|-------------|-----------|--------------|---------------|
| 51 | GET | `/v3/moq/sessions/list` | `moqSessionsList` | Q: `page`, `itemsPerPage` | `MoQSessionList` | 400, 500 |
| 52 | GET | `/v3/moq/sessions/get/{id}` | `moqSessionsGet` | P: `id` | `MoQSession` | 400, 404, 500 |
| 53 | POST | `/v3/moq/sessions/kick/{id}` | `moqSessionsKick` | P: `id` | `OK` | 400, 404, 500 |

### 2.10 Recordings

| # | Methode | Pfad | operationId | Parameter | Response 200 | Weitere Codes |
|---|---------|------|-------------|-----------|--------------|---------------|
| 54 | GET | `/v3/recordings/list` | `recordingsList` | Q: `page`, `itemsPerPage` | `RecordingList` | 400, 500 |
| 55 | GET | `/v3/recordings/get/{name}` | `recordingsGet` | P: `name` | `Recording` | 400, 404, 500 |
| 56 | DELETE | `/v3/recordings/segments/delete` | `recordingsSegmentsDelete` | Q: `path` (required), `start` (required) | `OK` | 400, 404, 500 |

> **Achtung:** `recordingsSegmentsDelete` ist **DELETE** mit Query-Parametern (kein Body, keine Path-Parameter).

### 2.11 Server-eigene Endpunkte (Einstellungen)

Nicht Teil der MediaMTX-Spec, nicht an MediaMTX proxied — werden vom UI-Server selbst bedient (Details: `INITIAL_SETTINGS.md` §6):

| # | Methode | Pfad | Parameter | Response 200 | Weitere Codes |
|---|---------|------|-----------|--------------|---------------|
| – | GET | `/api/settings` | – | `{ success, data: Settings }` (Secrets maskiert) | 500 |
| – | PATCH | `/api/settings` | B: Partial-`Settings` | `{ success, data: { applied, restartRequired } }` | 400, 500 |

> Diese zwei Endpunkte zählen **nicht** zu den 56 MediaMTX-Endpoints oben.

---

## 3. Schema-Referenz

Alle Schemas aus `components/schemas` der Spec.

### 3.1 Generische Schemas

| Schema | Felder |
|--------|--------|
| `OK` | `status: "ok"` |
| `Error` | `error: string`, `status: "error"` |
| `Info` | `started: string`, `version: string` |
| `InternalUserAddRes` | `id: uuid`, `status: "ok"` |

**Listen-Schemas** (alle identisch aufgebaut): `{ itemCount: int64, items: T[], pageCount: int64 }`
- `HLSMuxerList`, `HLSSessionList`, `InternalUserList`, `PathConfList`, `PathList`, `ForwardDestList`, `RTMPConnList`, `RTSPConnList`, `RTSPSessionList`, `SRTConnList`, `WebRTCSessionList`, `MoQSessionList`, `RecordingList`

### 3.2 Enums

> **Wichtig:** Die Werte unten entsprechen exakt der `openapi.yml` in diesem Repo (aktuelle MediaMTX-Version). Ältere MediaMTX-Versionen nutzen andere Werte (z. B. `publishing`/`reading` statt `publish`/`read`, `yes` statt `strict`).

| Enum | Werte |
|------|-------|
| `AuthAction` | `publish`, `read`, `playback`, `api`, `metrics`, `pprof` |
| `AuthMethod` | `internal`, `http`, `jwt` |
| `Encryption` | `no`, `optional`, `strict` |
| `HLSVariant` | `mpegts`, `fmp4`, `lowLatency` |
| `LogLevel` | `error`, `warn`, `info`, `debug` |
| `LogDestination` | `stdout`, `file`, `syslog` |
| `MoQSessionState` | `idle`, `read`, `publish` |
| `MoQVersion` | `moqt-16`, `moqt-17`, `moqt-18`, `moqt-19` |
| `PathReaderType` | `hlsSession`, `rtmpConn`, `rtmpsConn`, `rtspConn`, `rtspSession`, `rtspsConn`, `rtspsSession`, `srtConn`, `webRTCSession`, `moqSession`, `hidden` |
| `PathSourceType` | `hlsSource`, `redirect`, `rpiCameraSource`, `rtmpConn`, `rtmpsConn`, `rtmpSource`, `rtspSession`, `rtspSource`, `rtspsSession`, `srtConn`, `srtSource`, `mpegtsSource`, `rtpSource`, `webRTCSession`, `webRTCSource`, `moqSource`, `moqSession` |
| `ForwardDestType` | `rtmp`, `rtsp`, `srt`, `moq`, `webRTC` |
| `ForwardDestProtocol` | `rtmp`, `rtmps`, `rtsp`, `rtsps`, `srt`, `moq`, `whip`, `whips` |
| `ForwardDestState` | `idle`, `forwarding`, `error` |
| `PathTrackCodec` | `AV1`, `VP9`, `VP8`, `H265`, `H264`, `MPEG-4 Video`, `MPEG-1/2 Video`, `M-JPEG`, `Opus`, `FLAC`, `Vorbis`, `MPEG-4 Audio`, `MPEG-4 Audio LATM`, `MPEG-1/2 Audio`, `AC3`, `Speex`, `G726`, `G722`, `G711`, `LPCM`, `MPEG-TS`, `KLV`, `Generic` |
| `RecordFormat` | `fmp4`, `mpegts` |
| `RTMPConnState` | `idle`, `read`, `publish` |
| `RTSPAuthMethod` | `basic`, `digest` |
| `RTSPRangeType` | `""` (leer), `clock`, `npt`, `smpte` |
| `RTSPSessionState` | `idle`, `read`, `publish` |
| `RTSPTransport` | `udp`, `multicast`, `tcp`, `automatic` |
| `SRTConnState` | `idle`, `read`, `publish` |
| `StaticSourceState` | `idle`, `running`, `error` |
| `WebRTCSessionState` | `read`, `publish` |
| `AlwaysAvailableTrackCodec` | `AV1`, `VP9`, `H265`, `H264`, `MPEG4Audio`, `Opus`, `G711`, `LPCM` |
| `ErrorStatus` | `error` |
| `OKStatus` | `ok` |

### 3.3 Konfigurations-Schemas

**`GlobalConf`** (~150 Felder, gruppiert nach Präfix):

> **Hinweis:** Die `record*`-Felder sind in der aktuellen Spec **deprecated** (Recording ist jetzt ein Path-Setting, siehe `PathConf`). Die `*Disable`-Felder sind deprecated und wurden durch die Booleans `hls`/`rtmp`/`rtsp`/`webrtc` ersetzt.

| Gruppe | Felder |
|--------|--------|
| General | `api`, `apiAddress`, `apiAllowOrigins`, `apiEncryption`, `apiServerCert`, `apiServerKey`, `apiTrustedProxies`, `dumpPackets`, `logDestinations`, `logFile`, `logLevel`, `logStructured`, `sysLogPrefix`, `udpMaxPayloadSize`, `udpReadBufferSize`, `readTimeout`, `writeQueueSize`, `writeTimeout` |
| Authentication | `authHTTPAddress`, `authHTTPExclude`, `authHTTPFingerprint`, `authInternalUsers`, `authJWTAudience`, `authJWTClaimKey`, `authJWTExclude`, `authJWTIssuer`, `authJWTJWKS`, `authJWTJWKSFingerprint`, `authMethod` |
| Metrics | `metrics`, `metricsAddress`, `metricsAllowOrigins`, `metricsEncryption`, `metricsServerCert`, `metricsServerKey`, `metricsTrustedProxies` |
| PPROF | `pprof`, `pprofAddress`, `pprofAllowOrigins`, `pprofEncryption`, `pprofServerCert`, `pprofServerKey`, `pprofTrustedProxies` |
| Playback | `playback`, `playbackAddress`, `playbackAllowOrigins`, `playbackEncryption`, `playbackServerCert`, `playbackServerKey`, `playbackTrustedProxies` |
| HLS | `hls`, `hlsAddress`, `hlsAllowOrigins`, `hlsAlwaysRemux`, `hlsCDNSecret`, `hlsDirectory`, `hlsEncryption`, `hlsMuxerCloseAfter`, `hlsPartDuration`, `hlsSegmentCount`, `hlsSegmentDuration`, `hlsSegmentMaxSize`, `hlsServerCert`, `hlsServerKey`, `hlsTrustedProxies`, `hlsVariant` |
| MoQ | `moq`, `moqAllowOrigins`, `moqHTTP2Address`, `moqHTTP3Address`, `moqQUICAddress`, `moqServerCert`, `moqServerKey`, `moqTrustedProxies` |
| RTMP | `rtmp`, `rtmpAddress`, `rtmpEncryption`, `rtmpServerCert`, `rtmpServerKey`, `rtmpTrustedProxies`, `rtmpsAddress` |
| RTSP | `rtsp`, `rtspAddress`, `rtspAuthMethods`, `rtspEncryption`, `rtspServerCert`, `rtspServerKey`, `rtspTransports`, `rtspTrustedProxies`, `rtspsAddress`, `rtpAddress`, `rtcpAddress`, `srtpAddress`, `srtcpAddress` |
| SRT | `srt`, `srtAddress` |
| WebRTC | `webrtc`, `webrtcAdditionalHosts`, `webrtcAddress`, `webrtcAllowOrigins`, `webrtcEncryption`, `webrtcHandshakeTimeout`, `webrtcICEServers2`, `webrtcIPsFromInterfaces`, `webrtcIPsFromInterfacesExcludeList`, `webrtcIPsFromInterfacesList`, `webrtcLocalTCPAddress`, `webrtcLocalUDPAddress`, `webrtcSTUNGatherTimeout`, `webrtcServerCert`, `webrtcServerKey`, `webrtcTrackGatherTimeout`, `webrtcTrustedProxies` |
| Multicast | `multicastIPRange`, `multicastRTCPPort`, `multicastRTPPort`, `multicastSRTCPPort`, `multicastSRTPPort` |
| Run-on-connect | `runOnConnect`, `runOnConnectRestart`, `runOnDisconnect` |
| **Deprecated** (in Spec `deprecated: true`, im Frontend ausblenden) | `apiAllowOrigin` (→ `apiAllowOrigins`), `authJWTInHTTPQuery`, `authMethods`, `encryption`, `externalAuthenticationURL`, `hlsAllowOrigin` (→ `hlsAllowOrigins`), `hlsDisable` (→ `hls`), `metricsAllowOrigin` (→ `metricsAllowOrigins`), `moqHTTPS2Address`, `moqHTTPS3Address`, `playbackAllowOrigin` (→ `playbackAllowOrigins`), `pprofAllowOrigin` (→ `pprofAllowOrigins`), `protocols`, `readBufferCount`, `record`, `recordDeleteAfter`, `recordFormat`, `recordPartDuration`, `recordPath`, `recordSegmentDuration`, `rtmpDisable` (→ `rtmp`), `rtspDisable` (→ `rtsp`), `rtspUDPReadBufferSize`, `webrtcAllowOrigin` (→ `webrtcAllowOrigins`), `webrtcDisable` (→ `webrtc`), `webrtcICEHostNAT1To1IPs`, `webrtcICEServers` (→ `webrtcICEServers2`), `webrtcICETCPMuxAddress`, `webrtcICEUDPMuxAddress` |

**`PathConf`** (~115 Felder, gruppiert):

> **Wichtig:** `PathConf` enthält **keine** Protokoll-Server-Einstellungen (HLS/RTMP/RTSP/SRT/WebRTC/MoQ) — die sind global (`GlobalConf`). Ein Pfad definiert nur: Source, Recording, Always-Available, Forward, Hooks und Source-spezifische Optionen.

| Gruppe | Felder |
|--------|--------|
| General / Source | `source`, `sourceFingerprint`, `sourceOnDemand`, `sourceOnDemandStartTimeout`, `sourceOnDemandCloseAfter`, `sourceRedirect`, `maxReaders`, `useAbsoluteTimestamp`, `name` |
| Always available | `alwaysAvailable`, `alwaysAvailableFile`, `alwaysAvailableRecorded`, `alwaysAvailableTracks` (`AlwaysAvailableTrack[]`: `codec`, `sampleRate`, `channelCount`, `muLaw`) |
| Record | `record`, `recordDeleteAfter`, `recordFormat`, `recordMaxPartSize`, `recordPartDuration`, `recordPath`, `recordSegmentDuration` |
| Publisher source | `overridePublisher`, `srtPublishPassphrase`, `srtReadPassphrase`, `rtspDemuxMpegts` |
| RTSP source | `rtspTransport`, `rtspAnyPort`, `rtspRangeType`, `rtspRangeStart`, `rtspScale`, `rtspUDPSourcePortRange` |
| RTP source | `rtpSDP` |
| MoQ source | `moqTransport` |
| WHEP source | `whepBearerToken`, `whepSTUNGatherTimeout`, `whepHandshakeTimeout`, `whepTrackGatherTimeout` |
| Raspberry Pi Camera source | `rpiCameraCamID`, `rpiCameraSecondary`, `rpiCameraWidth`, `rpiCameraHeight`, `rpiCameraHFlip`, `rpiCameraVFlip`, `rpiCameraBrightness`, `rpiCameraContrast`, `rpiCameraSaturation`, `rpiCameraSharpness`, `rpiCameraExposure`, `rpiCameraAWB`, `rpiCameraAWBGains`, `rpiCameraDenoise`, `rpiCameraShutter`, `rpiCameraMetering`, `rpiCameraGain`, `rpiCameraEV`, `rpiCameraROI`, `rpiCameraHDR`, `rpiCameraTuningFile`, `rpiCameraMode`, `rpiCameraFPS`, `rpiCameraAfMode`, `rpiCameraAfRange`, `rpiCameraAfSpeed`, `rpiCameraLensPosition`, `rpiCameraAfWindow`, `rpiCameraFlickerPeriod`, `rpiCameraTextOverlayEnable`, `rpiCameraTextOverlay`, `rpiCameraCodec`, `rpiCameraIDRPeriod`, `rpiCameraBitrate`, `rpiCameraH264Profile`, `rpiCameraH264Level`, `rpiCameraMJPEGQuality` |
| Forward | `forward` (`PathConfForwardDest[]`: `dest`, `destFingerprint`, `moqTransport`, `whipBearerToken`) |
| Hooks | `runOnInit`, `runOnInitRestart`, `runOnDemand`, `runOnDemandRestart`, `runOnDemandStartTimeout`, `runOnDemandCloseAfter`, `runOnUnDemand`, `runOnAvailable`, `runOnAvailableRestart`, `runOnUnavailable`, `runOnOnline`, `runOnOnlineRestart`, `runOnOffline`, `runOnRead`, `runOnReadRestart`, `runOnUnread`, `runOnRecordSegmentCreate`, `runOnRecordSegmentComplete` |
| **Deprecated** (in Spec `deprecated: true`, im Frontend ausblenden) | `disablePublisherOverride` (→ `overridePublisher`), `fallback`, `mpegtsUDPReadBufferSize`, `playback`, `publishIPs`, `publishPass`, `publishUser`, `readIPs`, `readPass`, `readUser`, `rpiCameraHardwareH264Level`, `rpiCameraHardwareH264Profile`, `rpiCameraJPEGQuality` (→ `rpiCameraMJPEGQuality`), `rpiCameraLevel`, `rpiCameraProfile`, `rpiCameraSoftwareH264Level`, `rpiCameraSoftwareH264Profile`, `rtpUDPReadBufferSize`, `rtspUDPReadBufferSize`, `runOnNotReady`, `runOnReady`, `runOnReadyRestart`, `sourceAnyPortEnable` (→ `rtspAnyPort`), `sourceProtocol` (→ `rtspTransport`) |

**`AuthInternalUser`:**
```json
{
  "user": "string",
  "pass": "string",
  "ips": ["string"],
  "permissions": [
    { "action": "publish|read|playback|api|metrics|pprof", "path": "string" }
  ]
}
```

**`OptionalAuthInternalUser`:** wie `AuthInternalUser`, aber alle Felder optional (für PATCH).

**`InternalUser`:** `AuthInternalUser` + `id: uuid` + `pos: int64` (1-basierte Position).

### 3.4 Laufzeit-Schemas

> **Hinweis:** `bytesReceived`/`bytesSent` sind in der aktuellen Spec **deprecated** — die aktuellen Felder sind `inboundBytes`/`outboundBytes`. Session-/Conn-States sind `idle`/`read`/`publish` (nicht `publishing`/`reading`).

**`Path`:**
```json
{
  "name": "string",
  "confName": "string",
  "online": "boolean",
  "onlineTime": "string|null",
  "available": "boolean",
  "availableTime": "string|null",
  "inboundBytes": "uint64",
  "inboundFramesInError": "uint64",
  "outboundBytes": "uint64",
  "source": { "type": "PathSourceType", "id": "string" } | null,
  "readers": [ { "type": "PathReaderType", "id": "string" } ],
  "tracks2": [ { "codec": "PathTrackCodec", "codecProps": { ... } | null } ]
}
```
(deprecated: `ready`, `readyTime`, `tracks`, `bytesReceived`, `bytesSent`)

**`PathReader`:** `id: string`, `type: PathReaderType`.

**`PathSource`:** `id: string`, `type: PathSourceType`.

**`PathTrack`:** `codec: PathTrackCodec`, `codecProps: object|null` (typspezifisch: `PathTrackCodecProps*`).

**`ForwardDest`:** `id: uuid`, `created: string`, `pos: int64`, `state: ForwardDestState`, `type: ForwardDestType`, `lastError: string`, `outboundBytes: uint64`, `typeSpecific: object|null` (typspezifisch: `ForwardDestTypeSpecificRTMP/MoQ/RTSP/SRT/WebRTC`).
(deprecated: `conf`, `protocol`)

**`StaticSource`:** `created: string`, `state: StaticSourceState`, `type: PathSourceType`, `lastError: string`, `typeSpecific: object|null` (typspezifisch: `StaticSourceTypeSpecificRTMP/MoQ/RTSP/SRT/WebRTC`).

**`HLSMuxer`:** `path: string`, `created: string`, `lastRequest: string`, `outboundBytes: uint64`, `outboundFramesDiscarded: uint64`.
(deprecated: `bytesSent`)

**`HLSSession`:** `id: uuid`, `created: string`, `path: string`, `query: string`, `remoteAddr: string`, `user: string`, `userAgent: string`, `isCDN: boolean`, `outboundBytes: uint64`.

**`RTSPConn`:** `id: uuid`, `created: string`, `remoteAddr: string`, `session: uuid|null`, `tunnel: string`, `inboundBytes: uint64`, `outboundBytes: uint64`.
(deprecated: `bytesReceived`, `bytesSent`)

**`RTSPSession`:** `id: uuid`, `created: string`, `path: string`, `query: string`, `remoteAddr: string`, `user: string`, `userAgent: string`, `state: RTSPSessionState`, `transport: string|null`, `profile: string|null`, `conns: uuid[]`, `inboundBytes`, `outboundBytes`, `inboundRTPPackets`, `inboundRTPPacketsLost`, `inboundRTPPacketsJitter`, `inboundRTCPPackets`, `outboundRTPPackets`, `outboundRTPPacketsDiscarded`, `outboundRTCPPackets`, `outboundRTPPacketsReportedLost`.
(deprecated: `bytesReceived`, `bytesSent`, `rtpPackets*`, `rtcpPackets*`)

**`RTMPConn`:** `id: uuid`, `created: string`, `path: string`, `query: string`, `remoteAddr: string`, `user: string`, `userAgent: string`, `state: RTMPConnState`, `inboundBytes`, `outboundBytes`, `outboundFramesDiscarded`.
(deprecated: `bytesReceived`, `bytesSent`)

**`SRTConn`:** `id: uuid`, `created: string`, `path: string`, `remoteAddr: string`, `user: string`, `state: SRTConnState`, `inboundBytes`, `outboundBytes`, plus umfangreiche SRT-Statistiken (`byteMSS`, `bytesAvailReceiveBuf`, `bytesAvailSendBuf`, `bytesReceiveBuf`, `packetsReceived`, `packetsLost`, `packetsRetrans`, `rtt`, ...).

**`WebRTCSession`:** `id: uuid`, `created: string`, `path: string`, `query: string`, `remoteAddr: string`, `user: string`, `userAgent: string`, `state: WebRTCSessionState`, `localCandidate: string`, `remoteCandidate: string`, `peerConnectionEstablished: boolean`, `inboundBytes`, `outboundBytes`, `inboundRTPPackets`, `inboundRTPPacketsLost`, `inboundRTPPacketsJitter`, `inboundRTCPPackets`, `outboundRTPPackets`, `outboundRTCPPackets`, `outboundFramesDiscarded`.
(deprecated: `bytesReceived`, `bytesSent`, `rtpPackets*`, `rtcpPackets*`)

**`MoQSession`:** `id: uuid`, `created: string`, `path: string`, `query: string`, `remoteAddr: string`, `userAgent: string`, `state: MoQSessionState`, `transport: string`, `version: MoQVersion`, `inboundBytes`, `outboundBytes`.

**`Recording`:** `name: string`, `segments: [ { start: string } ]`.

> **Hinweis:** Die genauen Felder der `typeSpecific`-Objekte (`ForwardDestTypeSpecific*`, `StaticSourceTypeSpecific*`) und der `codecProps`-Objekte (`PathTrackCodecProps*`) sind in der Spec vollständig definiert und werden bei der Implementierung 1:1 übernommen. Für die UI werden sie als JSON-Code-Block gerendert (siehe 5.7).

---

## 7. Abhängigkeiten

**Server (bereits vorhanden):**
- `express` ^5.3.0
- `axios` ^1.20.0
- `vitest` ^2.1.8 (dev)

**Frontend (bereits vorhanden):**
- `react` ^19.3.0
- `react-dom` ^19.3.0
- `@tanstack/react-query` ^5.104.1
- `react-router-dom` ^7.18.4
- `react-markdown` ^10.1.0
- `remark-gfm` ^4.0.1
- `vite` ^8.3.4
- `@vitejs/plugin-react` ^6.1.2 (dev)

**Keine neuen Dependencies erforderlich.**

> **Hinweis:** `zod` ist **nicht** in den Dependencies (im ursprünglichen Konzept fälschlich als vorhanden angegeben). Clientseitige Validierung erfolgt manuell (Pflichtfelder, UUID-Format, Zahlen-Range).

---

## 8. Konventionen

- **Dateienamen:** kebab-case für Module (`internal-users.js`), PascalCase für React-Komponenten (`InternalUsers.jsx`).
- **API-Pfade:** entsprechen exakt den Pfaden der OpenAPI-Spec (z. B. `/config/global/get`, `/hls/sessions/kick/{id}`). Das Frontend ruft sie über den generischen Client auf; der Server leitet sie agnostisch weiter.
- **Query Keys:** Array-Notation, z. B. `['hls', 'sessions']`, mit ID/Name als letztes Element für Details.
- **Error-Codes:** `not_found`, `internal_error`, `upstream_unreachable` (letzterer nur bei Netzwerkfehlern; Upstream-4xx/5xx kommen ohne `code` direkt von MediaMTX).
- **Deprecated Felder:** Im Frontend ausgeblendet (nicht gerendert), da sie in der Spec als `deprecated: true` markiert sind.
- **Nullable Felder:** Im Frontend als optional behandeln (leer = null).
- **Path-Parameter:** Immer `encodeURIComponent()` (Pfad-Namen können Sonderzeichen enthalten).
- **Query-Parameter:** Als Objekt an `client.get(path, { params })` übergeben.
- **Body:** Immer als JSON-Objekt an `client.patch/post(path, body)` übergeben.

---

## 9. Offene Fragen / Entscheidungen

| Frage | Empfehlung | Status |
|-------|-----------|--------|
| **Auth gegen MediaMTX** | Spec hat `security: []`. Admin-Interface ohne eigenen Login. Optionaler Bearer-Token via `MEDIAMTX_AUTH_TOKEN` (wird an MediaMTX weitergeleitet). | Offen |
| **Base-URL** | Frontend ruft `/v3` auf (gleicher Origin via UI-Server-Proxy). Kein CORS. Alternativ `VITE_MEDIAMTX_API_URL` für direkte Anbindung. | Empfohlen: Proxy |
| **TypeScript** | Derzeit plain JS. Falls TS gewünscht: `vite` + `@vitejs/plugin-react` unterstützt TS. Typen könnten aus der OpenAPI-Spec generiert werden (`openapi-typescript-codegen`). | Offen |
| **Auto-Refresh** | Dashboard: 10s. Listen-Pages: 5s (staleTime). Detail-Pages: kein Auto-Refresh. | Empfohlen |
| **Icons** | Emoji oder einfache SVG (keine externen Libs). | Offen |
| **Dark/Light Mode** | Dark Mode als Default (siehe CSS-Variablen). Light Mode optional. | Offen |

---

## 10. Zusammenfassung

Die Implementierung folgt einer sauberen Trennung:

- **Server:** Express + **eine agnostische Bridge-Klasse** (`MediaMTXBridge`) leitet jeden Request unter `/v3/*` 1:1 an MediaMTX weiter. Keine pro-Endpoint-Router, kein Service-Layer. Die Bridge ist der einzige Punkt, der mit MediaMTX kommuniziert (Auth, Timeout, Fehler-Mapping). Neue MediaMTX-Endpoints brauchen null Server-Code.
- **Frontend:** React + Vite + TanStack Query + React Router bietet ein vollständiges Admin-Interface mit Dashboard, Konfiguration (Global, Path Defaults, Internal Users, Paths), Runtime-Monitoring (Paths, HLS, RTSP, RTMP, SRT, WebRTC, MoQ) und Session-Management (Kick). Der API-Client ist generisch (`api.get/post/patch/delete`) statt 56 Einzel-Funktionen.
- **Einstellungen:** Alle Config-Parameter der App (Server: Port, Logging, MediaMTX-Anbindung, Bridge; Frontend: API-Base-URL, Theme, Auto-Refresh, Seitengröße) sind über eine Settings-Seite einseh- und änderbar — Server-Settings via `GET`/`PATCH /api/settings` (persistiert, Runtime- oder Restart-Wirkung), App-Settings lokal im Browser (siehe `INITIAL_SETTINGS.md`).

Die bestehende Infrastruktur (`Server.js`, `FrontendRouter`, `main.jsx` mit QueryClient & Router) wird weitgehend wiederverwendet. Hauptarbeit liegt in der `MediaMTXBridge`, der Config-Erweiterung und den Frontend-Pages. Die Roadmap (siehe `ROADMAP.md`) ist in 3 Phasen unterteilt und kann sequenziell abgearbeitet werden.
