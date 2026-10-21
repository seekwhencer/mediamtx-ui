# Tooltip-Catalog — Feld-Descriptions

Referenz für die `description`-Werte (Tooltips) der Formular-Felder.
Jedes Feld aus `frontend/src/components/forms/fieldCatalog.js` wird hier mit seiner
empfohlenen Beschreibung geführt.

## Legende & Konventionen

- **Quelle:** `mediamtx/mediamtx.default.yml` (Kommentar direkt über dem Feld).
- **Tooltip-Text:** englischer Originaltext aus der YML (Single Source of Truth).
  Später übersetzbar via i18n (`descriptionKey`), siehe `.docs/i18n.md`.
- **YML-Zeile:** Zeilennummer in `mediamtx/mediamtx.default.yml` (Stand 2026-10-21).
- **`—`:** kein Text in der YML (deprecated oder app-spezifisch).
- **Deprecated-Felder:** nicht mehr in der aktuellen YML vorhanden → kein Tooltip.
- **App-spezifisch:** `SERVER_SETTINGS_CATALOG` / `APP_SETTINGS_CATALOG` gehören zur
  mediamtx-ui-App, nicht zu MediaMTX → keine YML-Quelle.
- Rendering: `FormField.jsx` rendert `field.description` als Markdown über dem Feld
  (`<Markdown text={field.description} />`).

---

## 1. GLOBAL_CONF_CATALOG

### General

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `api` | API | Enable the control API server, which allows to control the server. | 147 |
| `apiAddress` | API Address | Address of the TCP/HTTP listener. | 148 |
| `apiAllowOrigins` | API Allow Origins | Allowed CORS origins. Supports wildcards: `['http://*.example.com']` | 159 |
| `apiEncryption` | API Encryption | Enable HTTPS. | 150 |
| `apiServerCert` | API Server Cert | Path to the server certificate. | 157 |
| `apiServerKey` | API Server Key | Path to the server key. This is needed only when encryption is yes. | 152 |
| `apiTrustedProxies` | API Trusted Proxies | IPs or CIDRs of proxies placed before the HTTP server. These proxies can use the `X-Forwarded-For` header to set the real IP of clients, and the `X-Forwarded-Proto` header to set the original protocol. | 162 |
| `dumpPackets` | Dump Packets | Dump packets to disk. This is useful for debugging. | 19 |
| `logDestinations` | Log Destinations | Destinations of log messages; available values are `stdout`, `file` and `syslog`. | 11 |
| `logFile` | Log File | When `file` is in logDestinations, this is the file which will receive logs. | 15 |
| `logLevel` | Log Level | Verbosity of the program; available values are `error`, `warn`, `info`, `debug`. | 9 |
| `logStructured` | Log Structured | When destination is `stdout` or `file`, emit logs in structured format (JSONL). | 13 |
| `sysLogPrefix` | SysLog Prefix | When `syslog` is in logDestinations, use prefix for logs. | 17 |
| `udpMaxPayloadSize` | UDP Max Payload Size | Maximum size of outgoing UDP payloads. It defaults to the maximum packet size on ethernet (1500) minus IPv6 and UDP headers (48). This can be decreased to avoid fragmentation on networks with a low MTU. | 29 |
| `udpReadBufferSize` | UDP Read Buffer Size | Size of the read buffer of every UDP socket. This can be increased to decrease packet losses. It defaults to the default value of the operating system. | 33 |
| `readTimeout` | Read Timeout | Timeout of read operations. | 22 |
| `writeQueueSize` | Write Queue Size | Size of the queue of outgoing packets. A higher value allows to increase throughput, a lower value allows to save RAM. | 26 |
| `writeTimeout` | Write Timeout | Timeout of write operations. | 24 |

### Authentication

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `authMethod` | Auth Method | Authentication method. Available values: **internal** — credentials are stored in the configuration file; **http** — an external HTTP URL is contacted for each authentication request; **jwt** — credentials are signed tokens released by an external identity server. | 54 |
| `authHTTPAddress` | Auth HTTP Address | URL called to perform authentication. Every time a user wants to perform an action, the server calls this URL with the POST method and a payload described in the documentation. If the response code is 20x, the action is allowed, otherwise it is forbidden. | 95 |
| `authHTTPExclude` | Auth HTTP Exclude | Actions to exclude from HTTP-based authentication. Format is the same as the one of user permissions. | 107 |
| `authHTTPFingerprint` | Auth HTTP Fingerprint | If the HTTP authentication URL has a self-signed or invalid certificate, you can provide the fingerprint of the certificate in order to validate it anyway. | 101 |
| `authJWTAudience` | Auth JWT Audience | Expected audience (`aud`) claim in the JWT. Leave empty to skip validation. | 140 |
| `authJWTClaimKey` | Auth JWT Claim Key | Name of the claim that contains permissions. | 133 |
| `authJWTExclude` | Auth JWT Exclude | Actions to exclude from JWT-based authentication. Format is the same as the one of user permissions. | 135 |
| `authJWTIssuer` | Auth JWT Issuer | Expected issuer (`iss`) claim in the JWT. Leave empty to skip validation. | 138 |
| `authJWTJWKS` | Auth JWT JWKS | This is the JWKS URL that will be used to pull (once) the public key that allows to validate JWTs. | 124 |
| `authJWTJWKSFingerprint` | Auth JWT JWKS Fingerprint | If the JWKS URL has a self-signed or invalid certificate, you can provide the fingerprint of the certificate in order to validate it anyway. | 127 |

### Metrics

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `metrics` | Metrics | Enable the metrics server, which allows to extract Prometheus-compatible metrics. | 170 |
| `metricsAddress` | Metrics Address | Address of the TCP/HTTP listener. | 172 |
| `metricsAllowOrigins` | Metrics Allow Origins | Allowed CORS origins. Supports wildcards: `['http://*.example.com']` | 183 |
| `metricsEncryption` | Metrics Encryption | Enable HTTPS. | 174 |
| `metricsServerCert` | Metrics Server Cert | Path to the server certificate. | 181 |
| `metricsServerKey` | Metrics Server Key | Path to the server key. This is needed only when encryption is yes. | 176 |
| `metricsTrustedProxies` | Metrics Trusted Proxies | IPs or CIDRs of proxies placed before the HTTP server. These proxies can use the `X-Forwarded-For` header to set the real IP of clients, and the `X-Forwarded-Proto` header to set the original protocol. | 186 |

### PPROF

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `pprof` | PPROF | Enable the PPROF server, which allows to extract performance reports. | 194 |
| `pprofAddress` | PPROF Address | Address of the TCP/HTTP listener. | 196 |
| `pprofAllowOrigins` | PPROF Allow Origins | Allowed CORS origins. Supports wildcards: `['http://*.example.com']` | 207 |
| `pprofEncryption` | PPROF Encryption | Enable HTTPS. | 198 |
| `pprofServerCert` | PPROF Server Cert | Path to the server certificate. | 205 |
| `pprofServerKey` | PPROF Server Key | Path to the server key. This is needed only when encryption is yes. | 202 |
| `pprofTrustedProxies` | PPROF Trusted Proxies | IPs or CIDRs of proxies placed before the HTTP server. These proxies can use the `X-Forwarded-For` header to set the real IP of clients, and the `X-Forwarded-Proto` header to set the original protocol. | 210 |

### Playback

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `playback` | Playback | Enable the playback server, which allows to download recordings from the server. | 218 |
| `playbackAddress` | Playback Address | Address of the TCP/HTTP listener. | 220 |
| `playbackAllowOrigins` | Playback Allow Origins | Allowed CORS origins. Supports wildcards: `['http://*.example.com']` | 231 |
| `playbackEncryption` | Playback Encryption | Enable HTTPS. | 222 |
| `playbackServerCert` | Playback Server Cert | Path to the server certificate. | 229 |
| `playbackServerKey` | Playback Server Key | Path to the server key. This is needed only when encryption is yes. | 226 |
| `playbackTrustedProxies` | Playback Trusted Proxies | IPs or CIDRs of proxies placed before the HTTP server. These proxies can use the `X-Forwarded-For` header to set the real IP of clients, and the `X-Forwarded-Proto` header to set the original protocol. | 234 |

### HLS

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `hls` | HLS Server | Enable the HLS server, which allows to read streams with the HLS protocol. | 313 |
| `hlsAddress` | HLS Address | Address of the TCP/HTTP listener. | 315 |
| `hlsAllowOrigins` | HLS Allow Origins | Allowed CORS origins. Supports wildcards: `['http://*.example.com']` | 327 |
| `hlsAlwaysRemux` | HLS Always Remux | By default, HLS is generated only when requested by a user. This option allows to generate it always, avoiding the delay between request and generation. | 334 |
| `hlsCDNSecret` | HLS CDN Secret | Secret to identify requests coming from a CDN. The CDN must insert this secret in every request in the `Authorization: Bearer` header. | 368 |
| `hlsDirectory` | HLS Directory | Directory in which to save segments and non-low-latency playlists. This has two purposes: offloading RAM and creating a self-consistent directory that can be served by a CDN. | 361 |
| `hlsEncryption` | HLS Encryption | Enable HTTPS. This is required for Low-Latency HLS to function correctly on Apple devices. | 317 |
| `hlsMuxerCloseAfter` | HLS Muxer Close After | The muxer will be closed when there are no reader requests and this amount of time has passed. | 365 |
| `hlsPartDuration` | HLS Part Duration | Minimum duration of each part. A player usually puts 3 parts in a buffer before reproducing the stream. Parts are used in Low-Latency HLS in place of segments. Part duration is influenced by the distance between video/audio samples and is adjusted in order to produce segments with a similar duration. | 352 |
| `hlsSegmentCount` | HLS Segment Count | Number of HLS segments to keep on the server. Segments allow to seek through the stream. Their number doesn't influence latency. | 342 |
| `hlsSegmentDuration` | HLS Segment Duration | Minimum duration of each segment. A player usually puts 3 segments in a buffer before reproducing the stream. The final segment duration is also influenced by the interval between IDR frames, since the server changes the duration in order to include at least one IDR frame in each segment. | 346 |
| `hlsSegmentMaxSize` | HLS Segment Max Size | Maximum size of each segment. This prevents RAM exhaustion. | 358 |
| `hlsServerCert` | HLS Server Cert | Path to the server certificate. | 325 |
| `hlsServerKey` | HLS Server Key | Path to the server key. This is needed only when encryption is yes. | 322 |
| `hlsTrustedProxies` | HLS Trusted Proxies | IPs or CIDRs of proxies placed before the HLS server. If the server receives a request from one of these entries, IP in logs will be taken from the `X-Forwarded-For` header. | 330 |
| `hlsVariant` | HLS Variant | Variant of the HLS protocol to use. Available options are: **mpegts** — uses MPEG-TS segments, for maximum compatibility; **fmp4** — uses fragmented MP4 segments, more efficient; **lowLatency** — uses Low-Latency HLS. | 337 |

### MoQ

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `moq` | MoQ | Enable the MoQ (Media over QUIC) server, which allows to publish and read streams with the MoQ protocol. | 444 |
| `moqAllowOrigins` | MoQ Allow Origins | Allowed origins for CORS. | 462 |
| `moqHTTP2Address` | MoQ HTTP/2 Address | Address of the TCP/HTTP2 listener. This hosts the web client. | 446 |
| `moqHTTP3Address` | MoQ HTTP/3 Address | Address of the UDP/HTTP3 listener. This hosts the WebTransport endpoint. | 449 |
| `moqQUICAddress` | MoQ QUIC Address | Address of the UDP/QUIC listener used for native MoQ-over-QUIC. | 452 |
| `moqServerCert` | MoQ Server Cert | Path to the server certificate. | 460 |
| `moqServerKey` | MoQ Server Key | Path to the server key. If set to `auto.key`, a key is generated automatically and saved in the current folder. | 454 |
| `moqTrustedProxies` | MoQ Trusted Proxies | Proxies which are trusted to provide the client's real IP via the `X-Forwarded-For` header. | 464 |

### RTMP

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `rtmp` | RTMP Server | Enable the RTMP server, which allows to publish and read streams with the RTMP protocol. | 289 |
| `rtmpAddress` | RTMP Address | Address of the TCP/RTMP listener. This is needed only when encryption is `no` or `optional`. | 294 |
| `rtmpEncryption` | RTMP Encryption | Use the secure protocol variant (RTMPS). Available values are `no`, `strict`, `optional`. | 291 |
| `rtmpServerCert` | RTMP Server Cert | Path to the server certificate. This is needed only when encryption is `strict` or `optional`. | 303 |
| `rtmpServerKey` | RTMP Server Key | Path to the server key. This is needed only when encryption is `strict` or `optional`. | 298 |
| `rtmpTrustedProxies` | RTMP Trusted Proxies | IPs or CIDRs of proxies placed before the RTMP server. If the server receives a request from one of these entries, IP in logs and authentication will be taken from the PROXY protocol header. | 305 |
| `rtmpsAddress` | RTMPS Address | Address of the TCP/RTMPS listener. This is needed only when encryption is `strict` or `optional`. | 296 |

### RTSP

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `rtsp` | RTSP Server | Enable the RTSP server, which allows to publish and read streams with the RTSP protocol. | 242 |
| `rtspAddress` | RTSP Address | Address of the TCP/RTSP listener. This is needed only when encryption is `no` or `optional`. | 249 |
| `rtspAuthMethods` | RTSP Auth Methods | Authentication methods. Available are `basic` and `digest`. `digest` doesn't provide any additional security and is available for compatibility only. | 278 |
| `rtspEncryption` | RTSP Encryption | Use secure protocol variants (RTSPS, SRTP, SRTCP). Available values are `no`, `strict`, `optional`. | 246 |
| `rtspServerCert` | RTSP Server Cert | Path to the server certificate. This is needed only when encryption is `strict` or `optional`. | 276 |
| `rtspServerKey` | RTSP Server Key | Path to the server key. This is needed only when encryption is `strict` or `optional`. | 271 |
| `rtspTransports` | RTSP Transports | Enabled RTSP transport protocols. The handshake is always performed with TCP. | 244 |
| `rtspTrustedProxies` | RTSP Trusted Proxies | IPs or CIDRs of proxies placed before the RTSP server. If the server receives a request from one of these entries, IP in logs and authentication will be taken from the PROXY protocol header. | 281 |
| `rtspsAddress` | RTSPS Address | Address of the TCP/RTSPS listener. This is needed only when encryption is `strict` or `optional`. | 251 |
| `rtpAddress` | RTP Address | Address of the UDP/RTP listener. This is needed only when `udp` is in rtspTransports and encryption is `no` or `optional`. | 253 |
| `rtcpAddress` | RTCP Address | Address of the UDP/RTCP listener. This is needed only when `udp` is in rtspTransports and encryption is `no` or `optional`. | 255 |
| `srtpAddress` | SRTP Address | Address of the UDP/SRTP listener. This is needed only when `udp` is in rtspTransports and encryption is `strict` or `optional`. | 263 |
| `srtcpAddress` | SRTCP Address | Address of the UDP/SRTCP listener. This is needed only when `udp` is in rtspTransports and encryption is `strict` or `optional`. | 265 |

### SRT

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `srt` | SRT | Enable the SRT server, which allows to publish and read streams with the SRT protocol. | 436 |
| `srtAddress` | SRT Address | Address of the UDP/SRT listener. | 438 |

### WebRTC

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `webrtc` | WebRTC | Enable the WebRTC server, which allows to publish and read streams with the WebRTC protocol. | 376 |
| `webrtcAdditionalHosts` | WebRTC Additional Hosts | Additional hosts or IPs to send to clients. | 414 |
| `webrtcAddress` | WebRTC Address | Address of the WebRTC TCP/HTTP listener. | 378 |
| `webrtcAllowOrigins` | WebRTC Allow Origins | Allowed CORS origins. Supports wildcards: `['http://*.example.com']` | 391 |
| `webrtcEncryption` | WebRTC Encryption | Enable HTTPS. This covers only the WebRTC handshake, while WebRTC streams are always encrypted with a key that is exchanged during the WebRTC handshake. | 380 |
| `webrtcHandshakeTimeout` | WebRTC Handshake Timeout | Time to wait for the WebRTC handshake to complete. | 428 |
| `webrtcICEServers2` | WebRTC ICE Servers | ICE servers. Needed only when local listeners can't be reached by clients. STUN servers allow to obtain and share the public IP of the server. TURN/TURNS servers force all traffic through them. | 416 |
| `webrtcIPsFromInterfaces` | WebRTC IPs From Interfaces | WebRTC clients need to know the IP of the server. Gather IPs from interfaces and send them to clients. | 405 |
| `webrtcIPsFromInterfacesExcludeList` | WebRTC IPs From Interfaces Exclude List | Interfaces whose IPs will NOT be sent to clients. This is useful to exclude specific interfaces (e.g. VPN tunnels) while using all others. | 411 |
| `webrtcIPsFromInterfacesList` | WebRTC IPs From Interfaces List | Interfaces whose IPs will be sent to clients. An empty value means to use all available interfaces. | 408 |
| `webrtcLocalTCPAddress` | WebRTC Local TCP Address | Address of a TCP/ICE listener that will receive connections. This is disabled by default since TCP is less efficient than UDP and introduces a progressive delay when network is congested. | 401 |
| `webrtcLocalUDPAddress` | WebRTC Local UDP Address | Address of a UDP/ICE listener that will receive connections. Use a blank string to disable. | 398 |
| `webrtcSTUNGatherTimeout` | WebRTC STUN Gather Timeout | Maximum time to gather STUN candidates. | 426 |
| `webrtcServerCert` | WebRTC Server Cert | Path to the server certificate. | 389 |
| `webrtcServerKey` | WebRTC Server Key | Path to the server key. | 384 |
| `webrtcTrackGatherTimeout` | WebRTC Track Gather Timeout | Maximum time to gather tracks. | 430 |
| `webrtcTrustedProxies` | WebRTC Trusted Proxies | IPs or CIDRs of proxies placed before the WebRTC server. If the server receives a request from one of these entries, IP in logs will be taken from the `X-Forwarded-For` header. | 394 |

### Multicast

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `multicastIPRange` | Multicast IP Range | IP range of all UDP-multicast listeners. This is needed only when `multicast` is in rtspTransports and encryption is `no` or `optional`. | 257 |
| `multicastRTCPPort` | Multicast RTCP Port | Port of all UDP-multicast/RTCP listeners. This is needed only when `multicast` is in rtspTransports and encryption is `no` or `optional`. | 261 |
| `multicastRTPPort` | Multicast RTP Port | Port of all UDP-multicast/RTP listeners. This is needed only when `multicast` is in rtspTransports and encryption is `no` or `optional`. | 259 |
| `multicastSRTCPPort` | Multicast SRTCP Port | Port of all UDP-multicast/SRTCP listeners. This is needed only when `multicast` is in rtspTransports and encryption is `strict` or `optional`. | 269 |
| `multicastSRTPPort` | Multicast SRTP Port | Port of all UDP-multicast/SRTP listeners. This is needed only when `multicast` is in rtspTransports and encryption is `strict` or `optional`. | 267 |

### Run-on-connect

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `runOnConnect` | Run On Connect | Command to run when a client connects to the server. This is terminated with SIGINT when a client disconnects from the server. | 38 |
| `runOnConnectRestart` | Run On Connect Restart | Restart the command if it exits. | 45 |
| `runOnDisconnect` | Run On Disconnect | Command to run when a client disconnects from the server. | 47 |

---

## 2. PATH_CONF_CATALOG

### General / Source

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `source` | Source | Source of the stream. Can be `publisher` (stream provided by an RTSP/RTMP/WebRTC/SRT client) or a pull URL: `rtsp://`, `rtsps://`, `rtsp+http://`, `rtsps+http://`, `rtsp+ws://`, `rtsps+ws://`, `rtmp://…#streamKey`, `rtmps://…#streamKey`, `http(s)://…/stream.m3u8`, `udp+mpegts://ip:port`, `unix+mpegts://socketPath`, `udp+rtp://ip:port`, `srt://host:port?streamid=…`, `moqt://…`, `whep(s)://host:port/path`, `redirect`, or `rpiCamera`. Variables: `$MTX_QUERY` (query params, passed by first reader), `$G1`, `$G2`, … (regex groups if path name is a regex). | 476 |
| `sourceFingerprint` | Source Fingerprint | If the source is a URL, and the source TLS certificate is self-signed or invalid, you can provide the fingerprint of the certificate in order to validate it anyway. | 501 |
| `sourceOnDemand` | Source On Demand | If the source is a URL, it will be pulled only when at least one reader is connected, saving bandwidth. | 507 |
| `sourceOnDemandStartTimeout` | Source On Demand Start Timeout | If sourceOnDemand is `yes`, readers will be put on hold until the source is ready or until this amount of time has passed. | 510 |
| `sourceOnDemandCloseAfter` | Source On Demand Close After | If sourceOnDemand is `yes`, the source will be closed when there are no readers connected and this amount of time has passed. | 513 |
| `sourceRedirect` | Source Redirect | Path to which clients will be redirected. It can be a relative path (i.e. `/otherstream`) or an absolute RTSP URL. | 665 |
| `maxReaders` | Max Readers | Maximum number of readers. Zero means no limit. | 516 |
| `useAbsoluteTimestamp` | Use Absolute Timestamp | Use absolute timestamp of frames, instead of replacing them with the current time. | 520 |

### Always available

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `alwaysAvailable` | Always Available | Enable always-available mode, in which an offline segment is played on repeat when the stream is not available. | 526 |
| `alwaysAvailableFile` | Always Available File | An MP4 file can be used instead of the default offline segment. | 537 |
| `alwaysAvailableRecorded` | Always Available Recorded | If recording is enabled, record the stream even while the source is offline and the offline segment is playing. Set to false to record only while a source is connected. | 539 |
| `alwaysAvailableTracks` | Always Available Tracks | Tracks of the default offline segment. | 528 |

### Record

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `record` | Record | Record streams to disk. | 575 |
| `recordDeleteAfter` | Record Delete After | Delete segments after this timespan. Set to `0s` to disable automatic deletion. | 594 |
| `recordFormat` | Record Format | Format of recorded segments. Available formats are `fmp4` (fragmented MP4) and `mpegts` (MPEG-TS). | 582 |
| `recordMaxPartSize` | Record Max Part Size | This prevents RAM exhaustion. | 590 |
| `recordPartDuration` | Record Part Duration | fMP4 segments are concatenation of small MP4 files (parts), each with this duration. MPEG-TS segments are concatenation of 188-bytes packets, flushed to disk with this period. When a system failure occurs, the last part gets lost. Therefore, the part duration is equal to the RPO (recovery point objective). | 585 |
| `recordPath` | Record Path | Path of recording segments. Extension is added automatically. Available variables are `%path` (path name), `%Y %m %d` (year, month, day), `%H %M %S` (hours, minutes, seconds), `%f` (microseconds), `%z` (time zone), `%s` (unix epoch). | 577 |
| `recordSegmentDuration` | Record Segment Duration | Minimum duration of each segment. | 592 |

### Publisher source

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `overridePublisher` | Override Publisher | Allow another client to disconnect the current publisher and publish in its place. | 601 |
| `srtPublishPassphrase` | SRT Publish Passphrase | SRT encryption passphrase required to publish to this path. | 603 |
| `srtReadPassphrase` | SRT Read Passphrase | SRT encryption passphrase required to read from this path. | 518 |
| `rtspDemuxMpegts` | RTSP Demux MPEG-TS | Demux MPEG-TS over RTSP into elementary streams. When enabled, RTSP publishers and sources sending a single MP2T/90000 track will be demultiplexed, and their elementary streams (H.264, H.265, AAC, etc.) exposed as native tracks. This allows HLS, WebRTC, and other outputs to work transparently with MPEG-TS sources. | 605 |

### RTSP source

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `rtspTransport` | RTSP Transport | Transport protocol used to pull the stream. Available values are `automatic`, `udp`, `multicast`, `tcp`. | 615 |
| `rtspAnyPort` | RTSP Any Port | Support sources that don't provide server ports or use random server ports. This is a security issue and must be used only when interacting with sources that require it. | 617 |
| `rtspRangeType` | RTSP Range Type | Range header to send to the source, in order to start streaming from the specified offset. Available values: **clock** — absolute time; **npt** — Normal Play Time; **smpte** — SMPTE timestamps relative to the start of the recording. | 620 |
| `rtspRangeStart` | RTSP Range Start | Available values: **clock** — UTC ISO 8601 combined date and time string, e.g. `20230812T120000Z`; **npt** — duration such as `300ms`, `1.5m` or `2h45m` (units: `ns`, `us`, `ms`, `s`, `m`, `h`); **smpte** — duration such as `300ms`, `1.5m` or `2h45m` (units: `ns`, `us`, `ms`, `s`, `m`, `h`). | 626 |
| `rtspScale` | RTSP Scale | Scale header value to send to the source, in order to play the stream at a different speed. Negative values play in reverse, values > 1 fast-forward, values 0 < x < 1 play slow motion. | 631 |
| `rtspUDPSourcePortRange` | RTSP UDP Source Port Range | Range of ports used as source port in outgoing UDP packets. | 635 |

### RTP source

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `rtpSDP` | RTP SDP | Session Description Protocol (SDP) of the RTP stream. | 641 |

### MoQ source

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `moqTransport` | MoQ Transport | Transport protocol used to pull the stream. Available values are `quic`, `webtransport`. | 647 |

### WHEP source

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `whepBearerToken` | WHEP Bearer Token | Token to insert in the `Authorization: Bearer` header. | 653 |
| `whepSTUNGatherTimeout` | WHEP STUN Gather Timeout | Maximum time to gather STUN candidates. | 655 |
| `whepHandshakeTimeout` | WHEP Handshake Timeout | Time to wait for the WebRTC handshake to complete. | 657 |
| `whepTrackGatherTimeout` | WHEP Track Gather Timeout | Maximum time to gather tracks. | 659 |

### Raspberry Pi Camera

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `rpiCameraCamID` | Camera ID | ID of the camera. | 672 |
| `rpiCameraSecondary` | Secondary | Whether this is a secondary stream. | 674 |
| `rpiCameraWidth` | Width | Width of frames. | 676 |
| `rpiCameraHeight` | Height | Height of frames. | 678 |
| `rpiCameraHFlip` | H-Flip | Flip horizontally. | 680 |
| `rpiCameraVFlip` | V-Flip | Flip vertically. | 682 |
| `rpiCameraBrightness` | Brightness | Brightness [-1, 1]. | 684 |
| `rpiCameraContrast` | Contrast | Contrast [0, 16]. | 686 |
| `rpiCameraSaturation` | Saturation | Saturation [0, 16]. | 688 |
| `rpiCameraSharpness` | Sharpness | Sharpness [0, 16]. | 690 |
| `rpiCameraExposure` | Exposure | Exposure mode. Values: `normal`, `short`, `long`, `custom`. | 692 |
| `rpiCameraAWB` | AWB | Auto-white-balance mode. (`auto`, `incandescent`, `tungsten`, `fluorescent`, `indoor`, `daylight`, `cloudy` or `custom`). | 695 |
| `rpiCameraAWBGains` | AWB Gains | Auto-white-balance fixed gains. This can be used in place of rpiCameraAWB. Format: `[red, blue]`. | 697 |
| `rpiCameraDenoise` | Denoise | Denoise operating mode (`off`, `cdn_off`, `cdn_fast`, `cdn_hq`). | 700 |
| `rpiCameraShutter` | Shutter | Fixed shutter speed, in microseconds. | 702 |
| `rpiCameraMetering` | Metering | Metering mode of the AEC/AGC algorithm (`centre`, `spot`, `matrix` or `custom`). | 704 |
| `rpiCameraGain` | Gain | Fixed gain. | 706 |
| `rpiCameraEV` | EV | EV compensation of the image in range [-10, 10]. | 708 |
| `rpiCameraROI` | ROI | Region of interest, in format `x,y,width,height` (all normalized between 0 and 1). | 710 |
| `rpiCameraHDR` | HDR | Whether to enable HDR on Raspberry Camera 3. | 712 |
| `rpiCameraTuningFile` | Tuning File | Tuning file. | 714 |
| `rpiCameraMode` | Mode | Sensor mode, in format `[width]:[height]:[bit-depth]:[packing]`. Bit-depth and packing are optional. | 716 |
| `rpiCameraFPS` | FPS | Frames per second. | 720 |
| `rpiCameraAfMode` | AF Mode | Autofocus mode (`auto`, `manual` or `continuous`). | 722 |
| `rpiCameraAfRange` | AF Range | Autofocus range (`normal`, `macro` or `full`). | 724 |
| `rpiCameraAfSpeed` | AF Speed | Autofocus speed (`normal` or `fast`). | 726 |
| `rpiCameraLensPosition` | Lens Position | Lens position (for manual autofocus only), set to focus at a specific distance calculated by `d = 1 / value`. Examples: `0` → infinity; `0.5` → objects 2 m away; `2` → objects 50 cm away. | 727 |
| `rpiCameraAfWindow` | AF Window | Autofocus window, in the form `x,y,width,height` where the coordinates are given as a proportion of the entire image. | 733 |
| `rpiCameraFlickerPeriod` | Flicker Period | Manual flicker correction period, in microseconds. | 736 |
| `rpiCameraTextOverlayEnable` | Text Overlay Enable | Enables printing text on each frame. | 738 |
| `rpiCameraTextOverlay` | Text Overlay | Text that is printed on each frame. Format is the one of the `strftime()` function. | 740 |
| `rpiCameraCodec` | Codec | Codec (`auto`, `hardwareH264`, `softwareH264` or `mjpeg`). When `auto`, it defaults to: `hardwareH264` when stream is primary and hardware encoder is available; `softwareH264` when stream is primary and hardware encoder is not available; `mjpeg` when stream is secondary. | 743 |
| `rpiCameraIDRPeriod` | IDR Period | Period between IDR frames (when codec is `hardwareH264` or `softwareH264`). | 749 |
| `rpiCameraBitrate` | Bitrate | Bitrate (when codec is `hardwareH264` or `softwareH264`). | 751 |
| `rpiCameraH264Profile` | H264 Profile | H264 profile (`auto`, `baseline`, `main` or `high`). When `auto`, it defaults to: `main` when codec is `hardwareH264`; `baseline` when codec is `softwareH264`. | 753 |
| `rpiCameraH264Level` | H264 Level | H264 level (`4.0`, `4.1` or `4.2`). | 758 |
| `rpiCameraMJPEGQuality` | MJPEG Quality | M-JPEG quality (0-100). | 760 |

### Forward

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `forward` | Forward | Forward the stream of this path to one or more external servers. | 546 |
| `forward[].dest` | Dest | Forward destination. Can be `rtsp://`, `rtsps://`, `rtmp://…#streamKey`, `rtmps://…#streamKey`, `srt://host:port?streamid=…`, `moqt://…`, `whip://host:port/path/whip`, or `whips://host:port/path/whip`. Variables: `$MTX_PATH` (path name), `$G1`, `$G2`, … (regex groups if path name is a regex). | 548 |
| `forward[].destFingerprint` | Dest Fingerprint | If the destination TLS certificate is self-signed or invalid, you can provide the fingerprint of the certificate in order to validate it anyway. | 561 |
| `forward[].moqTransport` | MoQ Transport | Transport protocol used when forwarding with Media-over-QUIC. Available values are `quic`, `webtransport`. | 567 |
| `forward[].whipBearerToken` | WHEP Bearer Token | Token to insert in the `Authorization: Bearer` header when using WHIP. | 569 |

### Hooks

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `runOnInit` | Run On Init | Command to run when this path is initialized. This can be used to publish a stream when the server is launched. This is terminated with SIGINT when the program closes. | 767 |
| `runOnInitRestart` | Run On Init Restart | Restart the command if it exits. | 776 |
| `runOnDemand` | Run On Demand | Command to run when this path is requested by a reader and no one is publishing to this path yet. This can be used to publish a stream on demand. This is terminated with SIGINT when there are no readers anymore. | 779 |
| `runOnDemandRestart` | Run On Demand Restart | Restart the command if it exits. | 790 |
| `runOnDemandStartTimeout` | Run On Demand Start Timeout | Readers will be put on hold until the runOnDemand command starts publishing or until this amount of time has passed. | 792 |
| `runOnDemandCloseAfter` | Run On Demand Close After | The command will be closed when there are no readers connected and this amount of time has passed. | 795 |
| `runOnUnDemand` | Run On Un-Demand | Command to run when there are no readers anymore. | 798 |
| `runOnAvailable` | Run On Available | Command to run when the stream is available to be read. This is terminated with SIGINT when the stream is not available anymore. | 802 |
| `runOnAvailableRestart` | Run On Available Restart | Restart the command if it exits. | 813 |
| `runOnUnavailable` | Run On Unavailable | Command to run when the stream is not available anymore. | 815 |
| `runOnOnline` | Run On Online | Command to run when the stream is online, which means that the stream is available and provided by an online source (not an offline segment). This is terminated with SIGINT when the stream is not online anymore. | 819 |
| `runOnOnlineRestart` | Run On Online Restart | Restart the command if it exits. | 831 |
| `runOnOffline` | Run On Offline | Command to run when the stream is not online anymore. | 833 |
| `runOnRead` | Run On Read | Command to run when a client starts reading. This is terminated with SIGINT when a client stops reading. | 837 |
| `runOnReadRestart` | Run On Read Restart | Restart the command if it exits. | 848 |
| `runOnUnread` | Run On Unread | Command to run when a client stops reading. | 850 |
| `runOnRecordSegmentCreate` | Run On Record Segment Create | Command to run when a recording segment is created. | 854 |
| `runOnRecordSegmentComplete` | Run On Record Segment Complete | Command to run when a recording segment is complete. | 863 |

---

## 3. INTERNAL_USER_CATALOG

| Feld | Label | Tooltip | YML-Zeile |
|---|---|---|---|
| `user` | User | Username. `any` means any user, including anonymous ones. | 64 |
| `pass` | Pass | Password. Not used in case of `any` user. | 66 |
| `ips` | IPs | IPs or networks allowed to use this user. An empty list means any IP. | 68 |
| `permissions` | Permissions | Permissions. | 70 |
| `permissions[].action` | Action | Available actions are: `publish`, `read`, `playback`, `api`, `metrics`, `pprof`. | 72 |
| `permissions[].path` | Path | Paths can be set to further restrict access to a specific path. An empty path means any path. Regular expressions can be used by using a tilde as prefix. | 74 |

---

## 4. SERVER_SETTINGS_CATALOG (app-spezifisch)

Nicht aus `mediamtx.default.yml` — diese Felder gehören zur mediamtx-ui-App.
Keine YML-Quelle; Tooltips aus dem App-Kontext (`.docs/INITIAL_SETTINGS.md` §6.9).

| Feld | Label | Tooltip | Quelle |
|---|---|---|---|
| `serverPort` | Server Port | TCP-Port, auf dem die mediamtx-ui-API lauscht. | App |
| `verbose` | Verbose Logging | Aktiviert ausführliche Logging-Ausgaben des Servers. | App |
| `mediamtxBaseUrl` | MediaMTX Base URL | Basis-URL der MediaMTX Control API (z. B. `http://localhost:9997`). | App |
| `mediamtxAuthToken` | MediaMTX Auth Token | Auth-Token für die MediaMTX API. Leer = Token löschen. | App |
| `mediamtxApiVersion` | MediaMTX API Version | Version der MediaMTX Control API (z. B. `v3`). | App |
| `mediamtxBridgeTimeout` | MediaMTX Bridge Timeout (ms) | Timeout für Bridge-Aufrufe an MediaMTX in Millisekunden. | App |

---

## 5. APP_SETTINGS_CATALOG (app-spezifisch)

Nicht aus `mediamtx.default.yml` — diese Felder gehören zur mediamtx-ui-App.

| Feld | Label | Tooltip | Quelle |
|---|---|---|---|
| `apiBaseUrl` | API Base URL | Basis-Pfad der eigenen API (Default `/v3`). | App |
| `theme` | Theme | Farbtheme der Oberfläche (`dark` oder `light`). | App |
| `autoRefreshMs` | Auto-Refresh (ms, 0 = off) | Intervall in ms, in dem Daten automatisch neu geladen werden. `0` = aus. | App |
| `itemsPerPage` | Items Per Page | Anzahl der pro Seite angezeigten Einträge. | App |

---

## 6. Deprecated-Felder (kein Tooltip)

Diese Felder sind in `fieldCatalog.js` als `deprecated: true` markiert und werden
übersprungen. Sie existieren nicht mehr in der aktuellen `mediamtx.default.yml` →
kein extrahierbarer Tooltip.

### GLOBAL_CONF_CATALOG (deprecated)

`apiAllowOrigin`, `authJWTInHTTPQuery`, `authMethods`, `encryption`,
`externalAuthenticationURL`, `hlsAllowOrigin`, `hlsDisable`, `metricsAllowOrigin`,
`moqHTTPS2Address`, `moqHTTPS3Address`, `playbackAllowOrigin`, `pprofAllowOrigin`,
`protocols`, `readBufferCount`, `record`, `recordDeleteAfter`, `recordFormat`,
`recordPartDuration`, `recordPath`, `recordSegmentDuration`, `rtmpDisable`,
`rtspDisable`, `rtspUDPReadBufferSize`, `webrtcAllowOrigin`, `webrtcDisable`,
`webrtcICEHostNAT1To1IPs`, `webrtcICEServers`, `webrtcICETCPMuxAddress`,
`webrtcICEUDPMuxAddress`

### PATH_CONF_CATALOG (deprecated)

`disablePublisherOverride`, `fallback`, `mpegtsUDPReadBufferSize`, `playback`,
`publishIPs`, `publishPass`, `publishUser`, `readIPs`, `readPass`, `readUser`,
`rpiCameraHardwareH264Level`, `rpiCameraHardwareH264Profile`, `rpiCameraJPEGQuality`,
`rpiCameraLevel`, `rpiCameraProfile`, `rpiCameraSoftwareH264Level`,
`rpiCameraSoftwareH264Profile`, `rtpUDPReadBufferSize`, `rtspUDPReadBufferSize`,
`runOnNotReady`, `runOnReady`, `runOnReadyRestart`, `sourceAnyPortEnable`,
`sourceProtocol`
