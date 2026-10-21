// Feld-Katalog (reine Daten) für den Formular-Builder.
// Quelle: INITIAL_FRONTEND.md §5.13.2–5.13.4 + deprecated-Fußnoten.
//
// Ein Feld-Eintrag:
// {
//   name, label, type, group,
//   description?, placeholder?, options?, min?, max?, step?,
//   itemSchema?, nullable?, deprecated?, required?, multiline?
// }

const AUTH_ACTION_OPTIONS = ['publish', 'read', 'playback', 'api', 'metrics', 'pprof'];

const PERMISSION_ITEM = [
  { name: 'action', label: 'Action', type: 'select', options: AUTH_ACTION_OPTIONS, descriptionKey: 'fields.permissionsAction' },
  { name: 'path', label: 'Path', type: 'text', descriptionKey: 'fields.permissionsPath' },
];

const EXCLUDE_ITEM = [
  { name: 'action', label: 'Action', type: 'select', options: AUTH_ACTION_OPTIONS },
  { name: 'path', label: 'Path', type: 'text' },
];

const ICE_SERVER_ITEM = [
  { name: 'url', label: 'URL', type: 'text' },
  { name: 'username', label: 'Username', type: 'text' },
  { name: 'password', label: 'Password', type: 'password' },
  { name: 'clientOnly', label: 'Client Only', type: 'toggle' },
];

const TRACK_ITEM = [
  {
    name: 'codec',
    label: 'Codec',
    type: 'select',
    options: ['AV1', 'VP9', 'H265', 'H264', 'MPEG4Audio', 'Opus', 'G711', 'LPCM'],
  },
  { name: 'sampleRate', label: 'Sample Rate', type: 'number' },
  { name: 'channelCount', label: 'Channel Count', type: 'number' },
  { name: 'muLaw', label: 'Mu-Law', type: 'toggle' },
];

const FORWARD_ITEM = [
  { name: 'dest', label: 'Dest', type: 'text', descriptionKey: 'fields.forwardDest' },
  { name: 'destFingerprint', label: 'Dest Fingerprint', type: 'text', descriptionKey: 'fields.forwardDestFingerprint' },
  { name: 'moqTransport', label: 'MoQ Transport', type: 'text', descriptionKey: 'fields.forwardMoqTransport' },
  { name: 'whipBearerToken', label: 'WHEP Bearer Token', type: 'password', descriptionKey: 'fields.forwardWhipBearerToken' },
];

// ===== GlobalConf (§5.13.2) =====

export const GLOBAL_CONF_CATALOG = [
  // General
  { name: 'api', label: 'API', type: 'toggle', group: 'General', descriptionKey: 'fields.api' },
  { name: 'apiAddress', label: 'API Address', type: 'text', group: 'General', descriptionKey: 'fields.apiAddress' },
  { name: 'apiAllowOrigins', label: 'API Allow Origins', type: 'tags', group: 'General', descriptionKey: 'fields.apiAllowOrigins' },
  { name: 'apiEncryption', label: 'API Encryption', type: 'toggle', group: 'General', descriptionKey: 'fields.apiEncryption' },
  { name: 'apiServerCert', label: 'API Server Cert', type: 'path', group: 'General', descriptionKey: 'fields.apiServerCert' },
  { name: 'apiServerKey', label: 'API Server Key', type: 'path', group: 'General', descriptionKey: 'fields.apiServerKey' },
  { name: 'apiTrustedProxies', label: 'API Trusted Proxies', type: 'tags', group: 'General', descriptionKey: 'fields.apiTrustedProxies' },
  { name: 'dumpPackets', label: 'Dump Packets', type: 'toggle', group: 'General', descriptionKey: 'fields.dumpPackets' },
  { name: 'logDestinations', label: 'Log Destinations', type: 'multi-select', group: 'General', options: ['stdout', 'file', 'syslog'], descriptionKey: 'fields.logDestinations' },
  { name: 'logFile', label: 'Log File', type: 'path', group: 'General', descriptionKey: 'fields.logFile' },
  { name: 'logLevel', label: 'Log Level', type: 'select', group: 'General', options: ['error', 'warn', 'info', 'debug'], descriptionKey: 'fields.logLevel' },
  { name: 'logStructured', label: 'Log Structured', type: 'toggle', group: 'General', descriptionKey: 'fields.logStructured' },
  { name: 'sysLogPrefix', label: 'SysLog Prefix', type: 'text', group: 'General', descriptionKey: 'fields.sysLogPrefix' },
  { name: 'udpMaxPayloadSize', label: 'UDP Max Payload Size', type: 'number', group: 'General', descriptionKey: 'fields.udpMaxPayloadSize' },
  { name: 'udpReadBufferSize', label: 'UDP Read Buffer Size', type: 'number', group: 'General', descriptionKey: 'fields.udpReadBufferSize' },
  { name: 'readTimeout', label: 'Read Timeout', type: 'duration', group: 'General', placeholder: '5s', descriptionKey: 'fields.readTimeout' },
  { name: 'writeQueueSize', label: 'Write Queue Size', type: 'number', group: 'General', descriptionKey: 'fields.writeQueueSize' },
  { name: 'writeTimeout', label: 'Write Timeout', type: 'duration', group: 'General', placeholder: '5s', descriptionKey: 'fields.writeTimeout' },
  // Authentication
  { name: 'authMethod', label: 'Auth Method', type: 'select', group: 'Authentication', options: ['internal', 'http', 'jwt'], descriptionKey: 'fields.authMethod' },
  { name: 'authHTTPAddress', label: 'Auth HTTP Address', type: 'text', group: 'Authentication', descriptionKey: 'fields.authHTTPAddress' },
  { name: 'authHTTPExclude', label: 'Auth HTTP Exclude', type: 'list', group: 'Authentication', itemSchema: EXCLUDE_ITEM, descriptionKey: 'fields.authHTTPExclude' },
  { name: 'authHTTPFingerprint', label: 'Auth HTTP Fingerprint', type: 'text', group: 'Authentication', descriptionKey: 'fields.authHTTPFingerprint' },
  { name: 'authJWTAudience', label: 'Auth JWT Audience', type: 'text', group: 'Authentication', descriptionKey: 'fields.authJWTAudience' },
  { name: 'authJWTClaimKey', label: 'Auth JWT Claim Key', type: 'text', group: 'Authentication', descriptionKey: 'fields.authJWTClaimKey' },
  { name: 'authJWTExclude', label: 'Auth JWT Exclude', type: 'list', group: 'Authentication', itemSchema: EXCLUDE_ITEM, descriptionKey: 'fields.authJWTExclude' },
  { name: 'authJWTIssuer', label: 'Auth JWT Issuer', type: 'text', group: 'Authentication', descriptionKey: 'fields.authJWTIssuer' },
  { name: 'authJWTJWKS', label: 'Auth JWT JWKS', type: 'text', group: 'Authentication', descriptionKey: 'fields.authJWTJWKS' },
  { name: 'authJWTJWKSFingerprint', label: 'Auth JWT JWKS Fingerprint', type: 'text', group: 'Authentication', descriptionKey: 'fields.authJWTJWKSFingerprint' },
  // Metrics
  { name: 'metrics', label: 'Metrics', type: 'toggle', group: 'Metrics', descriptionKey: 'fields.metrics' },
  { name: 'metricsAddress', label: 'Metrics Address', type: 'text', group: 'Metrics', descriptionKey: 'fields.metricsAddress' },
  { name: 'metricsAllowOrigins', label: 'Metrics Allow Origins', type: 'tags', group: 'Metrics', descriptionKey: 'fields.metricsAllowOrigins' },
  { name: 'metricsEncryption', label: 'Metrics Encryption', type: 'toggle', group: 'Metrics', descriptionKey: 'fields.metricsEncryption' },
  { name: 'metricsServerCert', label: 'Metrics Server Cert', type: 'path', group: 'Metrics', descriptionKey: 'fields.metricsServerCert' },
  { name: 'metricsServerKey', label: 'Metrics Server Key', type: 'path', group: 'Metrics', descriptionKey: 'fields.metricsServerKey' },
  { name: 'metricsTrustedProxies', label: 'Metrics Trusted Proxies', type: 'tags', group: 'Metrics', descriptionKey: 'fields.metricsTrustedProxies' },
  // PPROF
  { name: 'pprof', label: 'PPROF', type: 'toggle', group: 'PPROF', descriptionKey: 'fields.pprof' },
  { name: 'pprofAddress', label: 'PPROF Address', type: 'text', group: 'PPROF', descriptionKey: 'fields.pprofAddress' },
  { name: 'pprofAllowOrigins', label: 'PPROF Allow Origins', type: 'tags', group: 'PPROF', descriptionKey: 'fields.pprofAllowOrigins' },
  { name: 'pprofEncryption', label: 'PPROF Encryption', type: 'toggle', group: 'PPROF', descriptionKey: 'fields.pprofEncryption' },
  { name: 'pprofServerCert', label: 'PPROF Server Cert', type: 'path', group: 'PPROF', descriptionKey: 'fields.pprofServerCert' },
  { name: 'pprofServerKey', label: 'PPROF Server Key', type: 'path', group: 'PPROF', descriptionKey: 'fields.pprofServerKey' },
  { name: 'pprofTrustedProxies', label: 'PPROF Trusted Proxies', type: 'tags', group: 'PPROF', descriptionKey: 'fields.pprofTrustedProxies' },
  // Playback
  { name: 'playback', label: 'Playback', type: 'toggle', group: 'Playback', descriptionKey: 'fields.playback' },
  { name: 'playbackAddress', label: 'Playback Address', type: 'text', group: 'Playback', descriptionKey: 'fields.playbackAddress' },
  { name: 'playbackAllowOrigins', label: 'Playback Allow Origins', type: 'tags', group: 'Playback', descriptionKey: 'fields.playbackAllowOrigins' },
  { name: 'playbackEncryption', label: 'Playback Encryption', type: 'toggle', group: 'Playback', descriptionKey: 'fields.playbackEncryption' },
  { name: 'playbackServerCert', label: 'Playback Server Cert', type: 'path', group: 'Playback', descriptionKey: 'fields.playbackServerCert' },
  { name: 'playbackServerKey', label: 'Playback Server Key', type: 'path', group: 'Playback', descriptionKey: 'fields.playbackServerKey' },
  { name: 'playbackTrustedProxies', label: 'Playback Trusted Proxies', type: 'tags', group: 'Playback', descriptionKey: 'fields.playbackTrustedProxies' },
  // HLS
  { name: 'hls', label: 'HLS Server', type: 'toggle', group: 'HLS', descriptionKey: 'fields.hls' },
  { name: 'hlsAddress', label: 'HLS Address', type: 'text', group: 'HLS', descriptionKey: 'fields.hlsAddress' },
  { name: 'hlsAllowOrigins', label: 'HLS Allow Origins', type: 'tags', group: 'HLS', descriptionKey: 'fields.hlsAllowOrigins' },
  { name: 'hlsAlwaysRemux', label: 'HLS Always Remux', type: 'toggle', group: 'HLS', descriptionKey: 'fields.hlsAlwaysRemux' },
  { name: 'hlsCDNSecret', label: 'HLS CDN Secret', type: 'password', group: 'HLS', descriptionKey: 'fields.hlsCDNSecret' },
  { name: 'hlsDirectory', label: 'HLS Directory', type: 'path', group: 'HLS', descriptionKey: 'fields.hlsDirectory' },
  { name: 'hlsEncryption', label: 'HLS Encryption', type: 'toggle', group: 'HLS', descriptionKey: 'fields.hlsEncryption' },
  { name: 'hlsMuxerCloseAfter', label: 'HLS Muxer Close After', type: 'duration', group: 'HLS', placeholder: '1h', descriptionKey: 'fields.hlsMuxerCloseAfter' },
  { name: 'hlsPartDuration', label: 'HLS Part Duration', type: 'duration', group: 'HLS', placeholder: '200ms', descriptionKey: 'fields.hlsPartDuration' },
  { name: 'hlsSegmentCount', label: 'HLS Segment Count', type: 'number', group: 'HLS', descriptionKey: 'fields.hlsSegmentCount' },
  { name: 'hlsSegmentDuration', label: 'HLS Segment Duration', type: 'duration', group: 'HLS', placeholder: '1s', descriptionKey: 'fields.hlsSegmentDuration' },
  { name: 'hlsSegmentMaxSize', label: 'HLS Segment Max Size', type: 'size', group: 'HLS', placeholder: '50MiB', descriptionKey: 'fields.hlsSegmentMaxSize' },
  { name: 'hlsServerCert', label: 'HLS Server Cert', type: 'path', group: 'HLS', descriptionKey: 'fields.hlsServerCert' },
  { name: 'hlsServerKey', label: 'HLS Server Key', type: 'path', group: 'HLS', descriptionKey: 'fields.hlsServerKey' },
  { name: 'hlsTrustedProxies', label: 'HLS Trusted Proxies', type: 'tags', group: 'HLS', descriptionKey: 'fields.hlsTrustedProxies' },
  { name: 'hlsVariant', label: 'HLS Variant', type: 'select', group: 'HLS', options: ['mpegts', 'fmp4', 'lowLatency'], descriptionKey: 'fields.hlsVariant' },
  // MoQ
  { name: 'moq', label: 'MoQ', type: 'toggle', group: 'MoQ', descriptionKey: 'fields.moq' },
  { name: 'moqAllowOrigins', label: 'MoQ Allow Origins', type: 'tags', group: 'MoQ', descriptionKey: 'fields.moqAllowOrigins' },
  { name: 'moqHTTP2Address', label: 'MoQ HTTP/2 Address', type: 'text', group: 'MoQ', descriptionKey: 'fields.moqHTTP2Address' },
  { name: 'moqHTTP3Address', label: 'MoQ HTTP/3 Address', type: 'text', group: 'MoQ', descriptionKey: 'fields.moqHTTP3Address' },
  { name: 'moqQUICAddress', label: 'MoQ QUIC Address', type: 'text', group: 'MoQ', descriptionKey: 'fields.moqQUICAddress' },
  { name: 'moqServerCert', label: 'MoQ Server Cert', type: 'path', group: 'MoQ', descriptionKey: 'fields.moqServerCert' },
  { name: 'moqServerKey', label: 'MoQ Server Key', type: 'path', group: 'MoQ', descriptionKey: 'fields.moqServerKey' },
  { name: 'moqTrustedProxies', label: 'MoQ Trusted Proxies', type: 'tags', group: 'MoQ', descriptionKey: 'fields.moqTrustedProxies' },
  // RTMP
  { name: 'rtmp', label: 'RTMP Server', type: 'toggle', group: 'RTMP', descriptionKey: 'fields.rtmp' },
  { name: 'rtmpAddress', label: 'RTMP Address', type: 'text', group: 'RTMP', descriptionKey: 'fields.rtmpAddress' },
  { name: 'rtmpEncryption', label: 'RTMP Encryption', type: 'select', group: 'RTMP', options: ['no', 'optional', 'strict'], descriptionKey: 'fields.rtmpEncryption' },
  { name: 'rtmpServerCert', label: 'RTMP Server Cert', type: 'path', group: 'RTMP', descriptionKey: 'fields.rtmpServerCert' },
  { name: 'rtmpServerKey', label: 'RTMP Server Key', type: 'path', group: 'RTMP', descriptionKey: 'fields.rtmpServerKey' },
  { name: 'rtmpTrustedProxies', label: 'RTMP Trusted Proxies', type: 'tags', group: 'RTMP', descriptionKey: 'fields.rtmpTrustedProxies' },
  { name: 'rtmpsAddress', label: 'RTMPS Address', type: 'text', group: 'RTMP', descriptionKey: 'fields.rtmpsAddress' },
  // RTSP
  { name: 'rtsp', label: 'RTSP Server', type: 'toggle', group: 'RTSP', descriptionKey: 'fields.rtsp' },
  { name: 'rtspAddress', label: 'RTSP Address', type: 'text', group: 'RTSP', descriptionKey: 'fields.rtspAddress' },
  { name: 'rtspAuthMethods', label: 'RTSP Auth Methods', type: 'multi-select', group: 'RTSP', options: ['basic', 'digest'], descriptionKey: 'fields.rtspAuthMethods' },
  { name: 'rtspEncryption', label: 'RTSP Encryption', type: 'select', group: 'RTSP', options: ['no', 'optional', 'strict'], descriptionKey: 'fields.rtspEncryption' },
  { name: 'rtspServerCert', label: 'RTSP Server Cert', type: 'path', group: 'RTSP', descriptionKey: 'fields.rtspServerCert' },
  { name: 'rtspServerKey', label: 'RTSP Server Key', type: 'path', group: 'RTSP', descriptionKey: 'fields.rtspServerKey' },
  { name: 'rtspTransports', label: 'RTSP Transports', type: 'multi-select', group: 'RTSP', options: ['udp', 'multicast', 'tcp'], descriptionKey: 'fields.rtspTransports' },
  { name: 'rtspTrustedProxies', label: 'RTSP Trusted Proxies', type: 'tags', group: 'RTSP', descriptionKey: 'fields.rtspTrustedProxies' },
  { name: 'rtspsAddress', label: 'RTSPS Address', type: 'text', group: 'RTSP', descriptionKey: 'fields.rtspsAddress' },
  { name: 'rtpAddress', label: 'RTP Address', type: 'text', group: 'RTSP', descriptionKey: 'fields.rtpAddress' },
  { name: 'rtcpAddress', label: 'RTCP Address', type: 'text', group: 'RTSP', descriptionKey: 'fields.rtcpAddress' },
  { name: 'srtpAddress', label: 'SRTP Address', type: 'text', group: 'RTSP', descriptionKey: 'fields.srtpAddress' },
  { name: 'srtcpAddress', label: 'SRTCP Address', type: 'text', group: 'RTSP', descriptionKey: 'fields.srtcpAddress' },
  // SRT
  { name: 'srt', label: 'SRT', type: 'toggle', group: 'SRT', descriptionKey: 'fields.srt' },
  { name: 'srtAddress', label: 'SRT Address', type: 'text', group: 'SRT', descriptionKey: 'fields.srtAddress' },
  // WebRTC
  { name: 'webrtc', label: 'WebRTC', type: 'toggle', group: 'WebRTC', descriptionKey: 'fields.webrtc' },
  { name: 'webrtcAdditionalHosts', label: 'WebRTC Additional Hosts', type: 'tags', group: 'WebRTC', descriptionKey: 'fields.webrtcAdditionalHosts' },
  { name: 'webrtcAddress', label: 'WebRTC Address', type: 'text', group: 'WebRTC', descriptionKey: 'fields.webrtcAddress' },
  { name: 'webrtcAllowOrigins', label: 'WebRTC Allow Origins', type: 'tags', group: 'WebRTC', descriptionKey: 'fields.webrtcAllowOrigins' },
  { name: 'webrtcEncryption', label: 'WebRTC Encryption', type: 'toggle', group: 'WebRTC', descriptionKey: 'fields.webrtcEncryption' },
  { name: 'webrtcHandshakeTimeout', label: 'WebRTC Handshake Timeout', type: 'duration', group: 'WebRTC', placeholder: '5s', descriptionKey: 'fields.webrtcHandshakeTimeout' },
  { name: 'webrtcICEServers2', label: 'WebRTC ICE Servers', type: 'list', group: 'WebRTC', itemSchema: ICE_SERVER_ITEM, descriptionKey: 'fields.webrtcICEServers2' },
  { name: 'webrtcIPsFromInterfaces', label: 'WebRTC IPs From Interfaces', type: 'toggle', group: 'WebRTC', descriptionKey: 'fields.webrtcIPsFromInterfaces' },
  { name: 'webrtcIPsFromInterfacesExcludeList', label: 'WebRTC IPs From Interfaces Exclude List', type: 'tags', group: 'WebRTC', descriptionKey: 'fields.webrtcIPsFromInterfacesExcludeList' },
  { name: 'webrtcIPsFromInterfacesList', label: 'WebRTC IPs From Interfaces List', type: 'tags', group: 'WebRTC', descriptionKey: 'fields.webrtcIPsFromInterfacesList' },
  { name: 'webrtcLocalTCPAddress', label: 'WebRTC Local TCP Address', type: 'text', group: 'WebRTC', descriptionKey: 'fields.webrtcLocalTCPAddress' },
  { name: 'webrtcLocalUDPAddress', label: 'WebRTC Local UDP Address', type: 'text', group: 'WebRTC', descriptionKey: 'fields.webrtcLocalUDPAddress' },
  { name: 'webrtcSTUNGatherTimeout', label: 'WebRTC STUN Gather Timeout', type: 'duration', group: 'WebRTC', placeholder: '2s', descriptionKey: 'fields.webrtcSTUNGatherTimeout' },
  { name: 'webrtcServerCert', label: 'WebRTC Server Cert', type: 'path', group: 'WebRTC', descriptionKey: 'fields.webrtcServerCert' },
  { name: 'webrtcServerKey', label: 'WebRTC Server Key', type: 'path', group: 'WebRTC', descriptionKey: 'fields.webrtcServerKey' },
  { name: 'webrtcTrackGatherTimeout', label: 'WebRTC Track Gather Timeout', type: 'duration', group: 'WebRTC', placeholder: '2s', descriptionKey: 'fields.webrtcTrackGatherTimeout' },
  { name: 'webrtcTrustedProxies', label: 'WebRTC Trusted Proxies', type: 'tags', group: 'WebRTC', descriptionKey: 'fields.webrtcTrustedProxies' },
  // Multicast
  { name: 'multicastIPRange', label: 'Multicast IP Range', type: 'text', group: 'Multicast', descriptionKey: 'fields.multicastIPRange' },
  { name: 'multicastRTCPPort', label: 'Multicast RTCP Port', type: 'number', group: 'Multicast', descriptionKey: 'fields.multicastRTCPPort' },
  { name: 'multicastRTPPort', label: 'Multicast RTP Port', type: 'number', group: 'Multicast', descriptionKey: 'fields.multicastRTPPort' },
  { name: 'multicastSRTCPPort', label: 'Multicast SRTCP Port', type: 'number', group: 'Multicast', descriptionKey: 'fields.multicastSRTCPPort' },
  { name: 'multicastSRTPPort', label: 'Multicast SRTP Port', type: 'number', group: 'Multicast', descriptionKey: 'fields.multicastSRTPPort' },
  // Run-on-connect
  { name: 'runOnConnect', label: 'Run On Connect', type: 'command', group: 'Run-on-connect', descriptionKey: 'fields.runOnConnect' },
  { name: 'runOnConnectRestart', label: 'Run On Connect Restart', type: 'toggle', group: 'Run-on-connect', descriptionKey: 'fields.runOnConnectRestart' },
  { name: 'runOnDisconnect', label: 'Run On Disconnect', type: 'command', group: 'Run-on-connect', descriptionKey: 'fields.runOnDisconnect' },
  // Deprecated (ausblenden)
  { name: 'apiAllowOrigin', label: 'API Allow Origin', type: 'tags', group: 'General', deprecated: true, nullable: true },
  { name: 'authJWTInHTTPQuery', label: 'Auth JWT In HTTP Query', type: 'toggle', group: 'Authentication', deprecated: true, nullable: true },
  { name: 'authMethods', label: 'Auth Methods', type: 'multi-select', group: 'Authentication', options: ['internal', 'http', 'jwt'], deprecated: true, nullable: true },
  { name: 'encryption', label: 'Encryption', type: 'select', group: 'General', options: ['no', 'optional', 'strict'], deprecated: true, nullable: true },
  { name: 'externalAuthenticationURL', label: 'External Authentication URL', type: 'text', group: 'Authentication', deprecated: true, nullable: true },
  { name: 'hlsAllowOrigin', label: 'HLS Allow Origin', type: 'tags', group: 'HLS', deprecated: true, nullable: true },
  { name: 'hlsDisable', label: 'HLS Disable', type: 'toggle', group: 'HLS', deprecated: true, nullable: true },
  { name: 'metricsAllowOrigin', label: 'Metrics Allow Origin', type: 'tags', group: 'Metrics', deprecated: true, nullable: true },
  { name: 'moqHTTPS2Address', label: 'MoQ HTTPS/2 Address', type: 'text', group: 'MoQ', deprecated: true, nullable: true },
  { name: 'moqHTTPS3Address', label: 'MoQ HTTPS/3 Address', type: 'text', group: 'MoQ', deprecated: true, nullable: true },
  { name: 'playbackAllowOrigin', label: 'Playback Allow Origin', type: 'tags', group: 'Playback', deprecated: true, nullable: true },
  { name: 'pprofAllowOrigin', label: 'PPROF Allow Origin', type: 'tags', group: 'PPROF', deprecated: true, nullable: true },
  { name: 'protocols', label: 'Protocols', type: 'multi-select', group: 'General', options: ['hls', 'rtmp', 'rtsp', 'srt', 'webrtc'], deprecated: true, nullable: true },
  { name: 'readBufferCount', label: 'Read Buffer Count', type: 'number', group: 'General', deprecated: true, nullable: true },
  { name: 'record', label: 'Record', type: 'toggle', group: 'General', deprecated: true, nullable: true },
  { name: 'recordDeleteAfter', label: 'Record Delete After', type: 'duration', group: 'General', placeholder: '1h', deprecated: true, nullable: true },
  { name: 'recordFormat', label: 'Record Format', type: 'select', group: 'General', options: ['fmp4', 'mpegts'], deprecated: true, nullable: true },
  { name: 'recordPartDuration', label: 'Record Part Duration', type: 'duration', group: 'General', placeholder: '200ms', deprecated: true, nullable: true },
  { name: 'recordPath', label: 'Record Path', type: 'path', group: 'General', deprecated: true, nullable: true },
  { name: 'recordSegmentDuration', label: 'Record Segment Duration', type: 'duration', group: 'General', placeholder: '1s', deprecated: true, nullable: true },
  { name: 'rtmpDisable', label: 'RTMP Disable', type: 'toggle', group: 'RTMP', deprecated: true, nullable: true },
  { name: 'rtspDisable', label: 'RTSP Disable', type: 'toggle', group: 'RTSP', deprecated: true, nullable: true },
  { name: 'rtspUDPReadBufferSize', label: 'RTSP UDP Read Buffer Size', type: 'number', group: 'RTSP', deprecated: true, nullable: true },
  { name: 'webrtcAllowOrigin', label: 'WebRTC Allow Origin', type: 'tags', group: 'WebRTC', deprecated: true, nullable: true },
  { name: 'webrtcDisable', label: 'WebRTC Disable', type: 'toggle', group: 'WebRTC', deprecated: true, nullable: true },
  { name: 'webrtcICEHostNAT1To1IPs', label: 'WebRTC ICE Host NAT 1:1 IPs', type: 'tags', group: 'WebRTC', deprecated: true, nullable: true },
  { name: 'webrtcICEServers', label: 'WebRTC ICE Servers', type: 'list', group: 'WebRTC', itemSchema: ICE_SERVER_ITEM, deprecated: true, nullable: true },
  { name: 'webrtcICETCPMuxAddress', label: 'WebRTC ICE TCP Mux Address', type: 'text', group: 'WebRTC', deprecated: true, nullable: true },
  { name: 'webrtcICEUDPMuxAddress', label: 'WebRTC ICE UDP Mux Address', type: 'text', group: 'WebRTC', deprecated: true, nullable: true },
];

// ===== PathConf (§5.13.3) =====

export const PATH_CONF_CATALOG = [
  // General / Source
  { name: 'source', label: 'Source', type: 'text', group: 'General', descriptionKey: 'fields.source' },
  { name: 'sourceFingerprint', label: 'Source Fingerprint', type: 'text', group: 'General', descriptionKey: 'fields.sourceFingerprint' },
  { name: 'sourceOnDemand', label: 'Source On Demand', type: 'toggle', group: 'General', descriptionKey: 'fields.sourceOnDemand' },
  { name: 'sourceOnDemandStartTimeout', label: 'Source On Demand Start Timeout', type: 'duration', group: 'General', placeholder: '5s', descriptionKey: 'fields.sourceOnDemandStartTimeout' },
  { name: 'sourceOnDemandCloseAfter', label: 'Source On Demand Close After', type: 'duration', group: 'General', placeholder: '1m', descriptionKey: 'fields.sourceOnDemandCloseAfter' },
  { name: 'sourceRedirect', label: 'Source Redirect', type: 'text', group: 'General', descriptionKey: 'fields.sourceRedirect' },
  { name: 'maxReaders', label: 'Max Readers', type: 'number', group: 'General', descriptionKey: 'fields.maxReaders' },
  { name: 'useAbsoluteTimestamp', label: 'Use Absolute Timestamp', type: 'toggle', group: 'General', descriptionKey: 'fields.useAbsoluteTimestamp' },
  // Always available
  { name: 'alwaysAvailable', label: 'Always Available', type: 'toggle', group: 'Always available', descriptionKey: 'fields.alwaysAvailable' },
  { name: 'alwaysAvailableFile', label: 'Always Available File', type: 'path', group: 'Always available', descriptionKey: 'fields.alwaysAvailableFile' },
  { name: 'alwaysAvailableRecorded', label: 'Always Available Recorded', type: 'toggle', group: 'Always available', descriptionKey: 'fields.alwaysAvailableRecorded' },
  { name: 'alwaysAvailableTracks', label: 'Always Available Tracks', type: 'list', group: 'Always available', itemSchema: TRACK_ITEM, descriptionKey: 'fields.alwaysAvailableTracks' },
  // Record
  { name: 'record', label: 'Record', type: 'toggle', group: 'Record', descriptionKey: 'fields.record' },
  { name: 'recordDeleteAfter', label: 'Record Delete After', type: 'duration', group: 'Record', placeholder: '1h', descriptionKey: 'fields.recordDeleteAfter' },
  { name: 'recordFormat', label: 'Record Format', type: 'select', group: 'Record', options: ['fmp4', 'mpegts'], descriptionKey: 'fields.recordFormat' },
  { name: 'recordMaxPartSize', label: 'Record Max Part Size', type: 'size', group: 'Record', placeholder: '50MiB', descriptionKey: 'fields.recordMaxPartSize' },
  { name: 'recordPartDuration', label: 'Record Part Duration', type: 'duration', group: 'Record', placeholder: '200ms', descriptionKey: 'fields.recordPartDuration' },
  { name: 'recordPath', label: 'Record Path', type: 'path', group: 'Record', descriptionKey: 'fields.recordPath' },
  { name: 'recordSegmentDuration', label: 'Record Segment Duration', type: 'duration', group: 'Record', placeholder: '1s', descriptionKey: 'fields.recordSegmentDuration' },
  // Publisher source
  { name: 'overridePublisher', label: 'Override Publisher', type: 'toggle', group: 'Publisher source', descriptionKey: 'fields.overridePublisher' },
  { name: 'srtPublishPassphrase', label: 'SRT Publish Passphrase', type: 'password', group: 'Publisher source', descriptionKey: 'fields.srtPublishPassphrase' },
  { name: 'srtReadPassphrase', label: 'SRT Read Passphrase', type: 'password', group: 'Publisher source', descriptionKey: 'fields.srtReadPassphrase' },
  { name: 'rtspDemuxMpegts', label: 'RTSP Demux MPEG-TS', type: 'toggle', group: 'Publisher source', descriptionKey: 'fields.rtspDemuxMpegts' },
  // RTSP source
  { name: 'rtspTransport', label: 'RTSP Transport', type: 'select', group: 'RTSP source', options: ['udp', 'multicast', 'tcp', 'automatic'], descriptionKey: 'fields.rtspTransport' },
  { name: 'rtspAnyPort', label: 'RTSP Any Port', type: 'toggle', group: 'RTSP source', descriptionKey: 'fields.rtspAnyPort' },
  {
    name: 'rtspRangeType',
    label: 'RTSP Range Type',
    type: 'select',
    group: 'RTSP source',
    options: [{ value: '', label: '(empty)' }, 'clock', 'npt', 'smpte'],
    descriptionKey: 'fields.rtspRangeType',
  },
  { name: 'rtspRangeStart', label: 'RTSP Range Start', type: 'text', group: 'RTSP source', descriptionKey: 'fields.rtspRangeStart' },
  { name: 'rtspScale', label: 'RTSP Scale', type: 'text', group: 'RTSP source', descriptionKey: 'fields.rtspScale' },
  { name: 'rtspUDPSourcePortRange', label: 'RTSP UDP Source Port Range', type: 'tags-number', group: 'RTSP source', descriptionKey: 'fields.rtspUDPSourcePortRange' },
  // RTP source
  { name: 'rtpSDP', label: 'RTP SDP', type: 'text', group: 'RTP source', multiline: true, descriptionKey: 'fields.rtpSDP' },
  // MoQ source
  { name: 'moqTransport', label: 'MoQ Transport', type: 'text', group: 'MoQ source', descriptionKey: 'fields.moqTransport' },
  // WHEP source
  { name: 'whepBearerToken', label: 'WHEP Bearer Token', type: 'password', group: 'WHEP source', descriptionKey: 'fields.whepBearerToken' },
  { name: 'whepSTUNGatherTimeout', label: 'WHEP STUN Gather Timeout', type: 'duration', group: 'WHEP source', placeholder: '2s', descriptionKey: 'fields.whepSTUNGatherTimeout' },
  { name: 'whepHandshakeTimeout', label: 'WHEP Handshake Timeout', type: 'duration', group: 'WHEP source', placeholder: '5s', descriptionKey: 'fields.whepHandshakeTimeout' },
  { name: 'whepTrackGatherTimeout', label: 'WHEP Track Gather Timeout', type: 'duration', group: 'WHEP source', placeholder: '2s', descriptionKey: 'fields.whepTrackGatherTimeout' },
  // Raspberry Pi Camera
  { name: 'rpiCameraCamID', label: 'Camera ID', type: 'number', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraCamID' },
  { name: 'rpiCameraSecondary', label: 'Secondary', type: 'toggle', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraSecondary' },
  { name: 'rpiCameraWidth', label: 'Width', type: 'number', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraWidth' },
  { name: 'rpiCameraHeight', label: 'Height', type: 'number', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraHeight' },
  { name: 'rpiCameraHFlip', label: 'H-Flip', type: 'toggle', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraHFlip' },
  { name: 'rpiCameraVFlip', label: 'V-Flip', type: 'toggle', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraVFlip' },
  { name: 'rpiCameraBrightness', label: 'Brightness', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 100, descriptionKey: 'fields.rpiCameraBrightness' },
  { name: 'rpiCameraContrast', label: 'Contrast', type: 'slider', group: 'Raspberry Pi Camera', min: -100, max: 100, descriptionKey: 'fields.rpiCameraContrast' },
  { name: 'rpiCameraSaturation', label: 'Saturation', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 100, descriptionKey: 'fields.rpiCameraSaturation' },
  { name: 'rpiCameraSharpness', label: 'Sharpness', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 100, descriptionKey: 'fields.rpiCameraSharpness' },
  { name: 'rpiCameraExposure', label: 'Exposure', type: 'select', group: 'Raspberry Pi Camera', options: ['normal', 'short', 'long', 'custom'], descriptionKey: 'fields.rpiCameraExposure' },
  { name: 'rpiCameraAWB', label: 'AWB', type: 'select', group: 'Raspberry Pi Camera', options: ['auto', 'incandescent', 'tungsten', 'fluorescent', 'indoor', 'daylight', 'cloudy', 'custom'], descriptionKey: 'fields.rpiCameraAWB' },
  { name: 'rpiCameraAWBGains', label: 'AWB Gains', type: 'tags-number', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraAWBGains' },
  { name: 'rpiCameraDenoise', label: 'Denoise', type: 'select', group: 'Raspberry Pi Camera', options: ['off', 'cdn_off', 'cdn_fast', 'cdn_hq'], descriptionKey: 'fields.rpiCameraDenoise' },
  { name: 'rpiCameraShutter', label: 'Shutter', type: 'number', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraShutter' },
  { name: 'rpiCameraMetering', label: 'Metering', type: 'select', group: 'Raspberry Pi Camera', options: ['centre', 'spot', 'matrix', 'custom'], descriptionKey: 'fields.rpiCameraMetering' },
  { name: 'rpiCameraGain', label: 'Gain', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 50, descriptionKey: 'fields.rpiCameraGain' },
  { name: 'rpiCameraEV', label: 'EV', type: 'slider', group: 'Raspberry Pi Camera', min: -10, max: 10, step: 0.5, descriptionKey: 'fields.rpiCameraEV' },
  { name: 'rpiCameraROI', label: 'ROI', type: 'text', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraROI' },
  { name: 'rpiCameraHDR', label: 'HDR', type: 'toggle', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraHDR' },
  { name: 'rpiCameraTuningFile', label: 'Tuning File', type: 'path', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraTuningFile' },
  { name: 'rpiCameraMode', label: 'Mode', type: 'text', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraMode' },
  { name: 'rpiCameraFPS', label: 'FPS', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 90, descriptionKey: 'fields.rpiCameraFPS' },
  { name: 'rpiCameraAfMode', label: 'AF Mode', type: 'select', group: 'Raspberry Pi Camera', options: ['auto', 'manual', 'continuous'], descriptionKey: 'fields.rpiCameraAfMode' },
  { name: 'rpiCameraAfRange', label: 'AF Range', type: 'text', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraAfRange' },
  { name: 'rpiCameraAfSpeed', label: 'AF Speed', type: 'text', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraAfSpeed' },
  { name: 'rpiCameraLensPosition', label: 'Lens Position', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 100, descriptionKey: 'fields.rpiCameraLensPosition' },
  { name: 'rpiCameraAfWindow', label: 'AF Window', type: 'text', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraAfWindow' },
  { name: 'rpiCameraFlickerPeriod', label: 'Flicker Period', type: 'number', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraFlickerPeriod' },
  { name: 'rpiCameraTextOverlayEnable', label: 'Text Overlay Enable', type: 'toggle', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraTextOverlayEnable' },
  { name: 'rpiCameraTextOverlay', label: 'Text Overlay', type: 'text', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraTextOverlay' },
  { name: 'rpiCameraCodec', label: 'Codec', type: 'select', group: 'Raspberry Pi Camera', options: ['auto', 'hardwareH264', 'softwareH264', 'mjpeg'], descriptionKey: 'fields.rpiCameraCodec' },
  { name: 'rpiCameraIDRPeriod', label: 'IDR Period', type: 'number', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraIDRPeriod' },
  { name: 'rpiCameraBitrate', label: 'Bitrate', type: 'number', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraBitrate' },
  { name: 'rpiCameraH264Profile', label: 'H264 Profile', type: 'select', group: 'Raspberry Pi Camera', options: ['auto', 'baseline', 'main', 'high'], descriptionKey: 'fields.rpiCameraH264Profile' },
  { name: 'rpiCameraH264Level', label: 'H264 Level', type: 'select', group: 'Raspberry Pi Camera', options: ['4.0', '4.1', '4.2'], descriptionKey: 'fields.rpiCameraH264Level' },
  { name: 'rpiCameraMJPEGQuality', label: 'MJPEG Quality', type: 'number', group: 'Raspberry Pi Camera', descriptionKey: 'fields.rpiCameraMJPEGQuality' },
  // Forward
  { name: 'forward', label: 'Forward', type: 'list', group: 'Forward', itemSchema: FORWARD_ITEM, descriptionKey: 'fields.forward' },
  // Hooks
  { name: 'runOnInit', label: 'Run On Init', type: 'command', group: 'Hooks', descriptionKey: 'fields.runOnInit' },
  { name: 'runOnInitRestart', label: 'Run On Init Restart', type: 'toggle', group: 'Hooks', descriptionKey: 'fields.runOnInitRestart' },
  { name: 'runOnDemand', label: 'Run On Demand', type: 'command', group: 'Hooks', descriptionKey: 'fields.runOnDemand' },
  { name: 'runOnDemandRestart', label: 'Run On Demand Restart', type: 'toggle', group: 'Hooks', descriptionKey: 'fields.runOnDemandRestart' },
  { name: 'runOnDemandStartTimeout', label: 'Run On Demand Start Timeout', type: 'duration', group: 'Hooks', placeholder: '5s', descriptionKey: 'fields.runOnDemandStartTimeout' },
  { name: 'runOnDemandCloseAfter', label: 'Run On Demand Close After', type: 'duration', group: 'Hooks', placeholder: '1m', descriptionKey: 'fields.runOnDemandCloseAfter' },
  { name: 'runOnUnDemand', label: 'Run On Un-Demand', type: 'command', group: 'Hooks', descriptionKey: 'fields.runOnUnDemand' },
  { name: 'runOnAvailable', label: 'Run On Available', type: 'command', group: 'Hooks', descriptionKey: 'fields.runOnAvailable' },
  { name: 'runOnAvailableRestart', label: 'Run On Available Restart', type: 'toggle', group: 'Hooks', descriptionKey: 'fields.runOnAvailableRestart' },
  { name: 'runOnUnavailable', label: 'Run On Unavailable', type: 'command', group: 'Hooks', descriptionKey: 'fields.runOnUnavailable' },
  { name: 'runOnOnline', label: 'Run On Online', type: 'command', group: 'Hooks', descriptionKey: 'fields.runOnOnline' },
  { name: 'runOnOnlineRestart', label: 'Run On Online Restart', type: 'toggle', group: 'Hooks', descriptionKey: 'fields.runOnOnlineRestart' },
  { name: 'runOnOffline', label: 'Run On Offline', type: 'command', group: 'Hooks', descriptionKey: 'fields.runOnOffline' },
  { name: 'runOnRead', label: 'Run On Read', type: 'command', group: 'Hooks', descriptionKey: 'fields.runOnRead' },
  { name: 'runOnReadRestart', label: 'Run On Read Restart', type: 'toggle', group: 'Hooks', descriptionKey: 'fields.runOnReadRestart' },
  { name: 'runOnUnread', label: 'Run On Unread', type: 'command', group: 'Hooks', descriptionKey: 'fields.runOnUnread' },
  { name: 'runOnRecordSegmentCreate', label: 'Run On Record Segment Create', type: 'command', group: 'Hooks', descriptionKey: 'fields.runOnRecordSegmentCreate' },
  { name: 'runOnRecordSegmentComplete', label: 'Run On Record Segment Complete', type: 'command', group: 'Hooks', descriptionKey: 'fields.runOnRecordSegmentComplete' },
  // Deprecated (ausblenden)
  { name: 'disablePublisherOverride', label: 'Disable Publisher Override', type: 'toggle', group: 'Publisher source', deprecated: true, nullable: true },
  { name: 'fallback', label: 'Fallback', type: 'text', group: 'General', deprecated: true, nullable: true },
  { name: 'mpegtsUDPReadBufferSize', label: 'MPEG-TS UDP Read Buffer Size', type: 'number', group: 'General', deprecated: true, nullable: true },
  { name: 'playback', label: 'Playback', type: 'toggle', group: 'General', deprecated: true, nullable: true },
  { name: 'publishIPs', label: 'Publish IPs', type: 'tags', group: 'General', deprecated: true, nullable: true },
  { name: 'publishPass', label: 'Publish Pass', type: 'password', group: 'General', deprecated: true, nullable: true },
  { name: 'publishUser', label: 'Publish User', type: 'text', group: 'General', deprecated: true, nullable: true },
  { name: 'readIPs', label: 'Read IPs', type: 'tags', group: 'General', deprecated: true, nullable: true },
  { name: 'readPass', label: 'Read Pass', type: 'password', group: 'General', deprecated: true, nullable: true },
  { name: 'readUser', label: 'Read User', type: 'text', group: 'General', deprecated: true, nullable: true },
  { name: 'rpiCameraHardwareH264Level', label: 'Hardware H264 Level', type: 'select', group: 'Raspberry Pi Camera', options: ['4.1', '4.2', '5.1'], deprecated: true, nullable: true },
  { name: 'rpiCameraHardwareH264Profile', label: 'Hardware H264 Profile', type: 'select', group: 'Raspberry Pi Camera', options: ['baseline', 'main', 'high'], deprecated: true, nullable: true },
  { name: 'rpiCameraJPEGQuality', label: 'JPEG Quality', type: 'number', group: 'Raspberry Pi Camera', deprecated: true, nullable: true },
  { name: 'rpiCameraLevel', label: 'Level', type: 'select', group: 'Raspberry Pi Camera', options: ['4.1', '4.2', '5.1'], deprecated: true, nullable: true },
  { name: 'rpiCameraProfile', label: 'Profile', type: 'select', group: 'Raspberry Pi Camera', options: ['baseline', 'main', 'high'], deprecated: true, nullable: true },
  { name: 'rpiCameraSoftwareH264Level', label: 'Software H264 Level', type: 'select', group: 'Raspberry Pi Camera', options: ['4.1', '4.2', '5.1'], deprecated: true, nullable: true },
  { name: 'rpiCameraSoftwareH264Profile', label: 'Software H264 Profile', type: 'select', group: 'Raspberry Pi Camera', options: ['baseline', 'main', 'high'], deprecated: true, nullable: true },
  { name: 'rtpUDPReadBufferSize', label: 'RTP UDP Read Buffer Size', type: 'number', group: 'RTP source', deprecated: true, nullable: true },
  { name: 'rtspUDPReadBufferSize', label: 'RTSP UDP Read Buffer Size', type: 'number', group: 'RTSP source', deprecated: true, nullable: true },
  { name: 'runOnNotReady', label: 'Run On Not Ready', type: 'command', group: 'Hooks', deprecated: true, nullable: true },
  { name: 'runOnReady', label: 'Run On Ready', type: 'command', group: 'Hooks', deprecated: true, nullable: true },
  { name: 'runOnReadyRestart', label: 'Run On Ready Restart', type: 'toggle', group: 'Hooks', deprecated: true, nullable: true },
  { name: 'sourceAnyPortEnable', label: 'Source Any Port Enable', type: 'toggle', group: 'RTSP source', deprecated: true, nullable: true },
  { name: 'sourceProtocol', label: 'Source Protocol', type: 'select', group: 'RTSP source', options: ['udp', 'multicast', 'tcp', 'automatic'], deprecated: true, nullable: true },
];

// ===== InternalUser (§5.13.4) =====

export const INTERNAL_USER_CATALOG = [
  { name: 'user', label: 'User', type: 'text', group: 'User', required: true, descriptionKey: 'fields.user' },
  { name: 'pass', label: 'Pass', type: 'password', group: 'User', descriptionKey: 'fields.pass' },
  { name: 'ips', label: 'IPs', type: 'tags', group: 'User', descriptionKey: 'fields.ips' },
  { name: 'permissions', label: 'Permissions', type: 'list', group: 'User', itemSchema: PERMISSION_ITEM, descriptionKey: 'fields.permissions' },
];

// ===== Server-Settings (INITIAL_SETTINGS.md §6.9) =====

export const SERVER_SETTINGS_CATALOG = [
  { name: 'serverPort', label: 'Server Port', labelKey: 'settings.serverPort', type: 'number', group: 'Server', min: 1, max: 65535, restartRequired: true, descriptionKey: 'fields.serverPort' },
  { name: 'verbose', label: 'Verbose Logging', labelKey: 'settings.verboseLogging', type: 'toggle', group: 'Server', descriptionKey: 'fields.verbose' },
  { name: 'mediamtxBaseUrl', label: 'MediaMTX Base URL', labelKey: 'settings.mediamtxBaseUrl', type: 'text', group: 'MediaMTX', placeholder: 'http://localhost:9997', descriptionKey: 'fields.mediamtxBaseUrl' },
  { name: 'mediamtxAuthToken', label: 'MediaMTX Auth Token', labelKey: 'settings.mediamtxAuthToken', type: 'password', group: 'MediaMTX', placeholder: '•••• (unchanged) / empty = delete', placeholderKey: 'settings.placeholderAuthToken', descriptionKey: 'fields.mediamtxAuthToken' },
  { name: 'mediamtxApiVersion', label: 'MediaMTX API Version', labelKey: 'settings.mediamtxApiVersion', type: 'text', group: 'Bridge', placeholder: 'v3', restartRequired: true, descriptionKey: 'fields.mediamtxApiVersion' },
  { name: 'mediamtxBridgeTimeout', label: 'MediaMTX Bridge Timeout (ms)', labelKey: 'settings.mediamtxBridgeTimeout', type: 'number', group: 'Bridge', min: 1000, max: 300000, descriptionKey: 'fields.mediamtxBridgeTimeout' },
];

// ===== App-Settings (INITIAL_SETTINGS.md §6.9) =====

export const APP_SETTINGS_CATALOG = [
  { name: 'apiBaseUrl', label: 'API Base URL', labelKey: 'settings.apiBaseUrl', type: 'text', group: 'API', placeholder: '/v3 (default)', placeholderKey: 'settings.placeholderApiBaseUrl', descriptionKey: 'fields.apiBaseUrl' },
  { name: 'theme', label: 'Theme', labelKey: 'settings.theme', type: 'select', group: 'Display', options: ['dark', 'light'], descriptionKey: 'fields.theme' },
  { name: 'autoRefreshMs', label: 'Auto-Refresh (ms, 0 = off)', labelKey: 'settings.autoRefreshMs', type: 'number', group: 'Behavior', min: 0, max: 3600000, descriptionKey: 'fields.autoRefreshMs' },
  { name: 'itemsPerPage', label: 'Items Per Page', labelKey: 'settings.itemsPerPage', type: 'number', group: 'Behavior', min: 10, max: 500, descriptionKey: 'fields.itemsPerPage' },
];

// ===== Helpers (reine Funktionen) =====

const DURATION_RE = /^(\d+(ms|s|m|h|d|w|y))(\d+(ms|s|m|h|d|w|y))*$/;
const SIZE_RE = /^\d+(\.\d+)?(KiB|MiB|GiB|TiB|KB|MB|GB|TB|K|M|G|T|B)?$/i;

function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

// Übersetztes Feld-Label (labelKey → i18n, sonst rohes label).
function fieldLabel(field, t) {
  if (field.labelKey && t) return t(field.labelKey, { defaultValue: field.label });
  return field.label;
}

function validateField(field, value, errors, path, t) {
  if (field.deprecated) return;
  const key = path || field.name;
  const label = fieldLabel(field, t);

  if (field.required && isEmpty(value)) {
    errors[key] = t('validation.required', { label });
    return;
  }
  if (isEmpty(value)) return;

  switch (field.type) {
    case 'number':
    case 'slider': {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) {
        errors[key] = t('validation.mustBeNumber', { label });
      } else if (field.min != null && n < field.min) {
        errors[key] = t('validation.mustBeGte', { label, min: field.min });
      } else if (field.max != null && n > field.max) {
        errors[key] = t('validation.mustBeLte', { label, max: field.max });
      }
      break;
    }
    case 'duration':
      if (typeof value !== 'string' || !DURATION_RE.test(value.trim())) {
        errors[key] = t('validation.mustBeDuration', { label });
      }
      break;
    case 'size':
      if (typeof value !== 'string' || !SIZE_RE.test(value.trim())) {
        errors[key] = t('validation.mustBeSize', { label });
      }
      break;
    case 'select':
      if (field.options?.length) {
        const ok = field.options.some((o) => (typeof o === 'object' && o !== null ? o.value : o) === value);
        if (!ok) errors[key] = t('validation.mustBeOneOf', { label });
      }
      break;
    case 'multi-select':
      if (field.options?.length) {
        const allowed = field.options.map((o) => (typeof o === 'object' && o !== null ? o.value : o));
        const bad = value.filter((v) => !allowed.includes(v));
        if (bad.length) errors[key] = t('validation.unknownOptions', { label, options: bad.join(', ') });
      }
      break;
    case 'tags-number':
      if (value.some((v) => !Number.isFinite(Number(v)))) {
        errors[key] = t('validation.mustContainNumbers', { label });
      }
      break;
    case 'list': {
      if (!Array.isArray(value)) {
        errors[key] = t('validation.mustBeList', { label });
        break;
      }
      value.forEach((item, i) => {
        if (item == null || typeof item !== 'object') {
          errors[`${key}[${i}]`] = t('validation.invalidItem');
          return;
        }
        for (const sub of field.itemSchema || []) {
          validateField(sub, item[sub.name], errors, `${key}[${i}].${sub.name}`, t);
        }
      });
      break;
    }
    default:
      break;
  }
}

export function validateValues(catalog, values, t) {
  const errors = {};
  for (const field of catalog) {
    validateField(field, (values || {})[field.name], errors, null, t);
  }
  return errors;
}

function normalizeField(field, value) {
  switch (field.type) {
    case 'toggle':
      return !!value;
    case 'text':
    case 'password':
    case 'duration':
    case 'size':
    case 'command':
    case 'path':
      if (value == null) return null;
      const s = String(value).trim();
      return s === '' ? null : s;
    case 'number':
    case 'slider': {
      if (value === '' || value == null) return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    case 'tags':
    case 'tags-number':
    case 'multi-select':
      return Array.isArray(value) ? value : [];
    case 'list':
      return (Array.isArray(value) ? value : []).map((item) => {
        const out = {};
        for (const sub of field.itemSchema || []) {
          out[sub.name] = normalizeField(sub, item ? item[sub.name] : undefined);
        }
        return out;
      });
    default:
      return value;
  }
}

// Normalisiert Werte für den Submit: leer → null, Zahlen parsen, Listen rekursiv.
// Unbekannte Keys (z. B. deprecated-Felder aus dem geladenen Objekt) bleiben erhalten.
export function normalizeForSubmit(catalog, values) {
  const byName = new Map(catalog.map((f) => [f.name, f]));
  const out = {};
  for (const [key, value] of Object.entries(values || {})) {
    const field = byName.get(key);
    out[key] = field ? normalizeField(field, value) : value;
  }
  return out;
}

// Gruppiert einen Katalog nach field.group (Katalog-Reihenfolge), deprecated-Felder werden übersprungen.
export function getGroups(catalog) {
  const map = new Map();
  for (const field of catalog) {
    if (field.deprecated) continue;
    const group = field.group || 'General';
    if (!map.has(group)) map.set(group, []);
    map.get(group).push(field);
  }
  return [...map.entries()];
}
