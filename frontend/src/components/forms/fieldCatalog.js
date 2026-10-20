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
  { name: 'action', label: 'Action', type: 'select', options: AUTH_ACTION_OPTIONS },
  { name: 'path', label: 'Path', type: 'text' },
];

const EXCLUDE_ITEM = [
  { name: 'action', label: 'Action', type: 'select', options: AUTH_ACTION_OPTIONS },
  { name: 'path', label: 'Path', type: 'text' },
];

const INTERNAL_USER_ITEM = [
  { name: 'user', label: 'User', type: 'text' },
  { name: 'pass', label: 'Pass', type: 'password' },
  { name: 'ips', label: 'IPs', type: 'tags' },
  { name: 'permissions', label: 'Permissions', type: 'list', itemSchema: PERMISSION_ITEM },
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
  { name: 'dest', label: 'Dest', type: 'text' },
  { name: 'destFingerprint', label: 'Dest Fingerprint', type: 'text' },
  { name: 'moqTransport', label: 'MoQ Transport', type: 'text' },
  { name: 'whipBearerToken', label: 'WHEP Bearer Token', type: 'password' },
];

// ===== GlobalConf (§5.13.2) =====

export const GLOBAL_CONF_CATALOG = [
  // General
  { name: 'api', label: 'API', type: 'toggle', group: 'General' },
  { name: 'apiAddress', label: 'API Address', type: 'text', group: 'General' },
  { name: 'apiAllowOrigins', label: 'API Allow Origins', type: 'tags', group: 'General' },
  { name: 'apiEncryption', label: 'API Encryption', type: 'toggle', group: 'General' },
  { name: 'apiServerCert', label: 'API Server Cert', type: 'path', group: 'General' },
  { name: 'apiServerKey', label: 'API Server Key', type: 'path', group: 'General' },
  { name: 'apiTrustedProxies', label: 'API Trusted Proxies', type: 'tags', group: 'General' },
  { name: 'dumpPackets', label: 'Dump Packets', type: 'toggle', group: 'General' },
  { name: 'logDestinations', label: 'Log Destinations', type: 'multi-select', group: 'General', options: ['stdout', 'file', 'syslog'] },
  { name: 'logFile', label: 'Log File', type: 'path', group: 'General' },
  { name: 'logLevel', label: 'Log Level', type: 'select', group: 'General', options: ['error', 'warn', 'info', 'debug'] },
  { name: 'logStructured', label: 'Log Structured', type: 'toggle', group: 'General' },
  { name: 'sysLogPrefix', label: 'SysLog Prefix', type: 'text', group: 'General' },
  { name: 'udpMaxPayloadSize', label: 'UDP Max Payload Size', type: 'number', group: 'General' },
  { name: 'udpReadBufferSize', label: 'UDP Read Buffer Size', type: 'number', group: 'General' },
  { name: 'readTimeout', label: 'Read Timeout', type: 'duration', group: 'General', placeholder: '5s' },
  { name: 'writeQueueSize', label: 'Write Queue Size', type: 'number', group: 'General' },
  { name: 'writeTimeout', label: 'Write Timeout', type: 'duration', group: 'General', placeholder: '5s' },
  // Authentication
  { name: 'authMethod', label: 'Auth Method', type: 'select', group: 'Authentication', options: ['internal', 'http', 'jwt'] },
  { name: 'authInternalUsers', label: 'Internal Users', type: 'list', group: 'Authentication', itemSchema: INTERNAL_USER_ITEM },
  { name: 'authHTTPAddress', label: 'Auth HTTP Address', type: 'text', group: 'Authentication' },
  { name: 'authHTTPExclude', label: 'Auth HTTP Exclude', type: 'list', group: 'Authentication', itemSchema: EXCLUDE_ITEM },
  { name: 'authHTTPFingerprint', label: 'Auth HTTP Fingerprint', type: 'text', group: 'Authentication' },
  { name: 'authJWTAudience', label: 'Auth JWT Audience', type: 'text', group: 'Authentication' },
  { name: 'authJWTClaimKey', label: 'Auth JWT Claim Key', type: 'text', group: 'Authentication' },
  { name: 'authJWTExclude', label: 'Auth JWT Exclude', type: 'list', group: 'Authentication', itemSchema: EXCLUDE_ITEM },
  { name: 'authJWTIssuer', label: 'Auth JWT Issuer', type: 'text', group: 'Authentication' },
  { name: 'authJWTJWKS', label: 'Auth JWT JWKS', type: 'text', group: 'Authentication' },
  { name: 'authJWTJWKSFingerprint', label: 'Auth JWT JWKS Fingerprint', type: 'text', group: 'Authentication' },
  // Metrics
  { name: 'metrics', label: 'Metrics', type: 'toggle', group: 'Metrics' },
  { name: 'metricsAddress', label: 'Metrics Address', type: 'text', group: 'Metrics' },
  { name: 'metricsAllowOrigins', label: 'Metrics Allow Origins', type: 'tags', group: 'Metrics' },
  { name: 'metricsEncryption', label: 'Metrics Encryption', type: 'toggle', group: 'Metrics' },
  { name: 'metricsServerCert', label: 'Metrics Server Cert', type: 'path', group: 'Metrics' },
  { name: 'metricsServerKey', label: 'Metrics Server Key', type: 'path', group: 'Metrics' },
  { name: 'metricsTrustedProxies', label: 'Metrics Trusted Proxies', type: 'tags', group: 'Metrics' },
  // PPROF
  { name: 'pprof', label: 'PPROF', type: 'toggle', group: 'PPROF' },
  { name: 'pprofAddress', label: 'PPROF Address', type: 'text', group: 'PPROF' },
  { name: 'pprofAllowOrigins', label: 'PPROF Allow Origins', type: 'tags', group: 'PPROF' },
  { name: 'pprofEncryption', label: 'PPROF Encryption', type: 'toggle', group: 'PPROF' },
  { name: 'pprofServerCert', label: 'PPROF Server Cert', type: 'path', group: 'PPROF' },
  { name: 'pprofServerKey', label: 'PPROF Server Key', type: 'path', group: 'PPROF' },
  { name: 'pprofTrustedProxies', label: 'PPROF Trusted Proxies', type: 'tags', group: 'PPROF' },
  // Playback
  { name: 'playback', label: 'Playback', type: 'toggle', group: 'Playback' },
  { name: 'playbackAddress', label: 'Playback Address', type: 'text', group: 'Playback' },
  { name: 'playbackAllowOrigins', label: 'Playback Allow Origins', type: 'tags', group: 'Playback' },
  { name: 'playbackEncryption', label: 'Playback Encryption', type: 'toggle', group: 'Playback' },
  { name: 'playbackServerCert', label: 'Playback Server Cert', type: 'path', group: 'Playback' },
  { name: 'playbackServerKey', label: 'Playback Server Key', type: 'path', group: 'Playback' },
  { name: 'playbackTrustedProxies', label: 'Playback Trusted Proxies', type: 'tags', group: 'Playback' },
  // HLS
  { name: 'hls', label: 'HLS Server', type: 'toggle', group: 'HLS' },
  { name: 'hlsAddress', label: 'HLS Address', type: 'text', group: 'HLS' },
  { name: 'hlsAllowOrigins', label: 'HLS Allow Origins', type: 'tags', group: 'HLS' },
  { name: 'hlsAlwaysRemux', label: 'HLS Always Remux', type: 'toggle', group: 'HLS' },
  { name: 'hlsCDNSecret', label: 'HLS CDN Secret', type: 'password', group: 'HLS' },
  { name: 'hlsDirectory', label: 'HLS Directory', type: 'path', group: 'HLS' },
  { name: 'hlsEncryption', label: 'HLS Encryption', type: 'toggle', group: 'HLS' },
  { name: 'hlsMuxerCloseAfter', label: 'HLS Muxer Close After', type: 'duration', group: 'HLS', placeholder: '1h' },
  { name: 'hlsPartDuration', label: 'HLS Part Duration', type: 'duration', group: 'HLS', placeholder: '200ms' },
  { name: 'hlsSegmentCount', label: 'HLS Segment Count', type: 'number', group: 'HLS' },
  { name: 'hlsSegmentDuration', label: 'HLS Segment Duration', type: 'duration', group: 'HLS', placeholder: '1s' },
  { name: 'hlsSegmentMaxSize', label: 'HLS Segment Max Size', type: 'size', group: 'HLS', placeholder: '50MiB' },
  { name: 'hlsServerCert', label: 'HLS Server Cert', type: 'path', group: 'HLS' },
  { name: 'hlsServerKey', label: 'HLS Server Key', type: 'path', group: 'HLS' },
  { name: 'hlsTrustedProxies', label: 'HLS Trusted Proxies', type: 'tags', group: 'HLS' },
  { name: 'hlsVariant', label: 'HLS Variant', type: 'select', group: 'HLS', options: ['mpegts', 'fmp4', 'lowLatency'] },
  // MoQ
  { name: 'moq', label: 'MoQ', type: 'toggle', group: 'MoQ' },
  { name: 'moqAllowOrigins', label: 'MoQ Allow Origins', type: 'tags', group: 'MoQ' },
  { name: 'moqHTTP2Address', label: 'MoQ HTTP/2 Address', type: 'text', group: 'MoQ' },
  { name: 'moqHTTP3Address', label: 'MoQ HTTP/3 Address', type: 'text', group: 'MoQ' },
  { name: 'moqQUICAddress', label: 'MoQ QUIC Address', type: 'text', group: 'MoQ' },
  { name: 'moqServerCert', label: 'MoQ Server Cert', type: 'path', group: 'MoQ' },
  { name: 'moqServerKey', label: 'MoQ Server Key', type: 'path', group: 'MoQ' },
  { name: 'moqTrustedProxies', label: 'MoQ Trusted Proxies', type: 'tags', group: 'MoQ' },
  // RTMP
  { name: 'rtmp', label: 'RTMP Server', type: 'toggle', group: 'RTMP' },
  { name: 'rtmpAddress', label: 'RTMP Address', type: 'text', group: 'RTMP' },
  { name: 'rtmpEncryption', label: 'RTMP Encryption', type: 'select', group: 'RTMP', options: ['no', 'optional', 'strict'] },
  { name: 'rtmpServerCert', label: 'RTMP Server Cert', type: 'path', group: 'RTMP' },
  { name: 'rtmpServerKey', label: 'RTMP Server Key', type: 'path', group: 'RTMP' },
  { name: 'rtmpTrustedProxies', label: 'RTMP Trusted Proxies', type: 'tags', group: 'RTMP' },
  { name: 'rtmpsAddress', label: 'RTMPS Address', type: 'text', group: 'RTMP' },
  // RTSP
  { name: 'rtsp', label: 'RTSP Server', type: 'toggle', group: 'RTSP' },
  { name: 'rtspAddress', label: 'RTSP Address', type: 'text', group: 'RTSP' },
  { name: 'rtspAuthMethods', label: 'RTSP Auth Methods', type: 'multi-select', group: 'RTSP', options: ['basic', 'digest'] },
  { name: 'rtspEncryption', label: 'RTSP Encryption', type: 'select', group: 'RTSP', options: ['no', 'optional', 'strict'] },
  { name: 'rtspServerCert', label: 'RTSP Server Cert', type: 'path', group: 'RTSP' },
  { name: 'rtspServerKey', label: 'RTSP Server Key', type: 'path', group: 'RTSP' },
  { name: 'rtspTransports', label: 'RTSP Transports', type: 'multi-select', group: 'RTSP', options: ['udp', 'multicast', 'tcp'] },
  { name: 'rtspTrustedProxies', label: 'RTSP Trusted Proxies', type: 'tags', group: 'RTSP' },
  { name: 'rtspsAddress', label: 'RTSPS Address', type: 'text', group: 'RTSP' },
  { name: 'rtpAddress', label: 'RTP Address', type: 'text', group: 'RTSP' },
  { name: 'rtcpAddress', label: 'RTCP Address', type: 'text', group: 'RTSP' },
  { name: 'srtpAddress', label: 'SRTP Address', type: 'text', group: 'RTSP' },
  { name: 'srtcpAddress', label: 'SRTCP Address', type: 'text', group: 'RTSP' },
  // SRT
  { name: 'srt', label: 'SRT', type: 'toggle', group: 'SRT' },
  { name: 'srtAddress', label: 'SRT Address', type: 'text', group: 'SRT' },
  // WebRTC
  { name: 'webrtc', label: 'WebRTC', type: 'toggle', group: 'WebRTC' },
  { name: 'webrtcAdditionalHosts', label: 'WebRTC Additional Hosts', type: 'tags', group: 'WebRTC' },
  { name: 'webrtcAddress', label: 'WebRTC Address', type: 'text', group: 'WebRTC' },
  { name: 'webrtcAllowOrigins', label: 'WebRTC Allow Origins', type: 'tags', group: 'WebRTC' },
  { name: 'webrtcEncryption', label: 'WebRTC Encryption', type: 'toggle', group: 'WebRTC' },
  { name: 'webrtcHandshakeTimeout', label: 'WebRTC Handshake Timeout', type: 'duration', group: 'WebRTC', placeholder: '5s' },
  { name: 'webrtcICEServers2', label: 'WebRTC ICE Servers', type: 'list', group: 'WebRTC', itemSchema: ICE_SERVER_ITEM },
  { name: 'webrtcIPsFromInterfaces', label: 'WebRTC IPs From Interfaces', type: 'toggle', group: 'WebRTC' },
  { name: 'webrtcIPsFromInterfacesExcludeList', label: 'WebRTC IPs From Interfaces Exclude List', type: 'tags', group: 'WebRTC' },
  { name: 'webrtcIPsFromInterfacesList', label: 'WebRTC IPs From Interfaces List', type: 'tags', group: 'WebRTC' },
  { name: 'webrtcLocalTCPAddress', label: 'WebRTC Local TCP Address', type: 'text', group: 'WebRTC' },
  { name: 'webrtcLocalUDPAddress', label: 'WebRTC Local UDP Address', type: 'text', group: 'WebRTC' },
  { name: 'webrtcSTUNGatherTimeout', label: 'WebRTC STUN Gather Timeout', type: 'duration', group: 'WebRTC', placeholder: '2s' },
  { name: 'webrtcServerCert', label: 'WebRTC Server Cert', type: 'path', group: 'WebRTC' },
  { name: 'webrtcServerKey', label: 'WebRTC Server Key', type: 'path', group: 'WebRTC' },
  { name: 'webrtcTrackGatherTimeout', label: 'WebRTC Track Gather Timeout', type: 'duration', group: 'WebRTC', placeholder: '2s' },
  { name: 'webrtcTrustedProxies', label: 'WebRTC Trusted Proxies', type: 'tags', group: 'WebRTC' },
  // Multicast
  { name: 'multicastIPRange', label: 'Multicast IP Range', type: 'text', group: 'Multicast' },
  { name: 'multicastRTCPPort', label: 'Multicast RTCP Port', type: 'number', group: 'Multicast' },
  { name: 'multicastRTPPort', label: 'Multicast RTP Port', type: 'number', group: 'Multicast' },
  { name: 'multicastSRTCPPort', label: 'Multicast SRTCP Port', type: 'number', group: 'Multicast' },
  { name: 'multicastSRTPPort', label: 'Multicast SRTP Port', type: 'number', group: 'Multicast' },
  // Run-on-connect
  { name: 'runOnConnect', label: 'Run On Connect', type: 'command', group: 'Run-on-connect' },
  { name: 'runOnConnectRestart', label: 'Run On Connect Restart', type: 'toggle', group: 'Run-on-connect' },
  { name: 'runOnDisconnect', label: 'Run On Disconnect', type: 'command', group: 'Run-on-connect' },
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
  { name: 'source', label: 'Source', type: 'text', group: 'General' },
  { name: 'sourceFingerprint', label: 'Source Fingerprint', type: 'text', group: 'General' },
  { name: 'sourceOnDemand', label: 'Source On Demand', type: 'toggle', group: 'General' },
  { name: 'sourceOnDemandStartTimeout', label: 'Source On Demand Start Timeout', type: 'duration', group: 'General', placeholder: '5s' },
  { name: 'sourceOnDemandCloseAfter', label: 'Source On Demand Close After', type: 'duration', group: 'General', placeholder: '1m' },
  { name: 'sourceRedirect', label: 'Source Redirect', type: 'text', group: 'General' },
  { name: 'maxReaders', label: 'Max Readers', type: 'number', group: 'General' },
  { name: 'useAbsoluteTimestamp', label: 'Use Absolute Timestamp', type: 'toggle', group: 'General' },
  // Always available
  { name: 'alwaysAvailable', label: 'Always Available', type: 'toggle', group: 'Always available' },
  { name: 'alwaysAvailableFile', label: 'Always Available File', type: 'path', group: 'Always available' },
  { name: 'alwaysAvailableRecorded', label: 'Always Available Recorded', type: 'toggle', group: 'Always available' },
  { name: 'alwaysAvailableTracks', label: 'Always Available Tracks', type: 'list', group: 'Always available', itemSchema: TRACK_ITEM },
  // Record
  { name: 'record', label: 'Record', type: 'toggle', group: 'Record' },
  { name: 'recordDeleteAfter', label: 'Record Delete After', type: 'duration', group: 'Record', placeholder: '1h' },
  { name: 'recordFormat', label: 'Record Format', type: 'select', group: 'Record', options: ['fmp4', 'mpegts'] },
  { name: 'recordMaxPartSize', label: 'Record Max Part Size', type: 'size', group: 'Record', placeholder: '50MiB' },
  { name: 'recordPartDuration', label: 'Record Part Duration', type: 'duration', group: 'Record', placeholder: '200ms' },
  { name: 'recordPath', label: 'Record Path', type: 'path', group: 'Record' },
  { name: 'recordSegmentDuration', label: 'Record Segment Duration', type: 'duration', group: 'Record', placeholder: '1s' },
  // Publisher source
  { name: 'overridePublisher', label: 'Override Publisher', type: 'toggle', group: 'Publisher source' },
  { name: 'srtPublishPassphrase', label: 'SRT Publish Passphrase', type: 'password', group: 'Publisher source' },
  { name: 'srtReadPassphrase', label: 'SRT Read Passphrase', type: 'password', group: 'Publisher source' },
  { name: 'rtspDemuxMpegts', label: 'RTSP Demux MPEG-TS', type: 'toggle', group: 'Publisher source' },
  // RTSP source
  { name: 'rtspTransport', label: 'RTSP Transport', type: 'select', group: 'RTSP source', options: ['udp', 'multicast', 'tcp', 'automatic'] },
  { name: 'rtspAnyPort', label: 'RTSP Any Port', type: 'toggle', group: 'RTSP source' },
  {
    name: 'rtspRangeType',
    label: 'RTSP Range Type',
    type: 'select',
    group: 'RTSP source',
    options: [{ value: '', label: '(empty)' }, 'clock', 'npt', 'smpte'],
  },
  { name: 'rtspRangeStart', label: 'RTSP Range Start', type: 'text', group: 'RTSP source' },
  { name: 'rtspScale', label: 'RTSP Scale', type: 'text', group: 'RTSP source' },
  { name: 'rtspUDPSourcePortRange', label: 'RTSP UDP Source Port Range', type: 'tags-number', group: 'RTSP source' },
  // RTP source
  { name: 'rtpSDP', label: 'RTP SDP', type: 'text', group: 'RTP source', multiline: true },
  // MoQ source
  { name: 'moqTransport', label: 'MoQ Transport', type: 'text', group: 'MoQ source' },
  // WHEP source
  { name: 'whepBearerToken', label: 'WHEP Bearer Token', type: 'password', group: 'WHEP source' },
  { name: 'whepSTUNGatherTimeout', label: 'WHEP STUN Gather Timeout', type: 'duration', group: 'WHEP source', placeholder: '2s' },
  { name: 'whepHandshakeTimeout', label: 'WHEP Handshake Timeout', type: 'duration', group: 'WHEP source', placeholder: '5s' },
  { name: 'whepTrackGatherTimeout', label: 'WHEP Track Gather Timeout', type: 'duration', group: 'WHEP source', placeholder: '2s' },
  // Raspberry Pi Camera
  { name: 'rpiCameraCamID', label: 'Camera ID', type: 'number', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraSecondary', label: 'Secondary', type: 'toggle', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraWidth', label: 'Width', type: 'number', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraHeight', label: 'Height', type: 'number', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraHFlip', label: 'H-Flip', type: 'toggle', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraVFlip', label: 'V-Flip', type: 'toggle', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraBrightness', label: 'Brightness', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 100 },
  { name: 'rpiCameraContrast', label: 'Contrast', type: 'slider', group: 'Raspberry Pi Camera', min: -100, max: 100 },
  { name: 'rpiCameraSaturation', label: 'Saturation', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 100 },
  { name: 'rpiCameraSharpness', label: 'Sharpness', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 100 },
  { name: 'rpiCameraExposure', label: 'Exposure', type: 'select', group: 'Raspberry Pi Camera', options: ['normal', 'sport', 'night', 'off'] },
  { name: 'rpiCameraAWB', label: 'AWB', type: 'select', group: 'Raspberry Pi Camera', options: ['auto', 'off', 'sunshade', 'cloudy', 'tungsten', 'fluorescent', 'horizons', 'flash'] },
  { name: 'rpiCameraAWBGains', label: 'AWB Gains', type: 'tags-number', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraDenoise', label: 'Denoise', type: 'select', group: 'Raspberry Pi Camera', options: ['off', 'fast', 'cd'] },
  { name: 'rpiCameraShutter', label: 'Shutter', type: 'number', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraMetering', label: 'Metering', type: 'select', group: 'Raspberry Pi Camera', options: ['normal', 'backlit', 'spot', 'custom'] },
  { name: 'rpiCameraGain', label: 'Gain', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 50 },
  { name: 'rpiCameraEV', label: 'EV', type: 'slider', group: 'Raspberry Pi Camera', min: -10, max: 10, step: 0.5 },
  { name: 'rpiCameraROI', label: 'ROI', type: 'text', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraHDR', label: 'HDR', type: 'toggle', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraTuningFile', label: 'Tuning File', type: 'path', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraMode', label: 'Mode', type: 'text', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraFPS', label: 'FPS', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 90 },
  { name: 'rpiCameraAfMode', label: 'AF Mode', type: 'select', group: 'Raspberry Pi Camera', options: ['off', 'continuous', 'auto', 'manual'] },
  { name: 'rpiCameraAfRange', label: 'AF Range', type: 'text', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraAfSpeed', label: 'AF Speed', type: 'text', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraLensPosition', label: 'Lens Position', type: 'slider', group: 'Raspberry Pi Camera', min: 0, max: 100 },
  { name: 'rpiCameraAfWindow', label: 'AF Window', type: 'text', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraFlickerPeriod', label: 'Flicker Period', type: 'number', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraTextOverlayEnable', label: 'Text Overlay Enable', type: 'toggle', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraTextOverlay', label: 'Text Overlay', type: 'text', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraCodec', label: 'Codec', type: 'select', group: 'Raspberry Pi Camera', options: ['h264', 'mjpeg', 'raw'] },
  { name: 'rpiCameraIDRPeriod', label: 'IDR Period', type: 'number', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraBitrate', label: 'Bitrate', type: 'number', group: 'Raspberry Pi Camera' },
  { name: 'rpiCameraH264Profile', label: 'H264 Profile', type: 'select', group: 'Raspberry Pi Camera', options: ['baseline', 'main', 'high'] },
  { name: 'rpiCameraH264Level', label: 'H264 Level', type: 'select', group: 'Raspberry Pi Camera', options: ['4.1', '4.2', '5.1'] },
  { name: 'rpiCameraMJPEGQuality', label: 'MJPEG Quality', type: 'number', group: 'Raspberry Pi Camera' },
  // Forward
  { name: 'forward', label: 'Forward', type: 'list', group: 'Forward', itemSchema: FORWARD_ITEM },
  // Hooks
  { name: 'runOnInit', label: 'Run On Init', type: 'command', group: 'Hooks' },
  { name: 'runOnInitRestart', label: 'Run On Init Restart', type: 'toggle', group: 'Hooks' },
  { name: 'runOnDemand', label: 'Run On Demand', type: 'command', group: 'Hooks' },
  { name: 'runOnDemandRestart', label: 'Run On Demand Restart', type: 'toggle', group: 'Hooks' },
  { name: 'runOnDemandStartTimeout', label: 'Run On Demand Start Timeout', type: 'duration', group: 'Hooks', placeholder: '5s' },
  { name: 'runOnDemandCloseAfter', label: 'Run On Demand Close After', type: 'duration', group: 'Hooks', placeholder: '1m' },
  { name: 'runOnUnDemand', label: 'Run On Un-Demand', type: 'command', group: 'Hooks' },
  { name: 'runOnAvailable', label: 'Run On Available', type: 'command', group: 'Hooks' },
  { name: 'runOnAvailableRestart', label: 'Run On Available Restart', type: 'toggle', group: 'Hooks' },
  { name: 'runOnUnavailable', label: 'Run On Unavailable', type: 'command', group: 'Hooks' },
  { name: 'runOnOnline', label: 'Run On Online', type: 'command', group: 'Hooks' },
  { name: 'runOnOnlineRestart', label: 'Run On Online Restart', type: 'toggle', group: 'Hooks' },
  { name: 'runOnOffline', label: 'Run On Offline', type: 'command', group: 'Hooks' },
  { name: 'runOnRead', label: 'Run On Read', type: 'command', group: 'Hooks' },
  { name: 'runOnReadRestart', label: 'Run On Read Restart', type: 'toggle', group: 'Hooks' },
  { name: 'runOnUnread', label: 'Run On Unread', type: 'command', group: 'Hooks' },
  { name: 'runOnRecordSegmentCreate', label: 'Run On Record Segment Create', type: 'command', group: 'Hooks' },
  { name: 'runOnRecordSegmentComplete', label: 'Run On Record Segment Complete', type: 'command', group: 'Hooks' },
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
  { name: 'user', label: 'User', type: 'text', group: 'User', required: true },
  { name: 'pass', label: 'Pass', type: 'password', group: 'User' },
  { name: 'ips', label: 'IPs', type: 'tags', group: 'User' },
  { name: 'permissions', label: 'Permissions', type: 'list', group: 'User', itemSchema: PERMISSION_ITEM },
];

// ===== Server-Settings (INITIAL_SETTINGS.md §6.9) =====

export const SERVER_SETTINGS_CATALOG = [
  { name: 'serverPort', label: 'Server Port', type: 'number', group: 'Server', min: 1, max: 65535, restartRequired: true },
  { name: 'verbose', label: 'Verbose Logging', type: 'toggle', group: 'Server' },
  { name: 'mediamtxBaseUrl', label: 'MediaMTX Base URL', type: 'text', group: 'MediaMTX', placeholder: 'http://localhost:9997' },
  { name: 'mediamtxAuthToken', label: 'MediaMTX Auth Token', type: 'password', group: 'MediaMTX', placeholder: '•••• (unverändert) / leer = löschen' },
  { name: 'mediamtxApiVersion', label: 'MediaMTX API Version', type: 'text', group: 'Bridge', placeholder: 'v3', restartRequired: true },
  { name: 'mediamtxBridgeTimeout', label: 'MediaMTX Bridge Timeout (ms)', type: 'number', group: 'Bridge', min: 1000, max: 300000 },
];

// ===== App-Settings (INITIAL_SETTINGS.md §6.9) =====

export const APP_SETTINGS_CATALOG = [
  { name: 'apiBaseUrl', label: 'API Base URL', type: 'text', group: 'API', placeholder: '/v3 (Default)' },
  { name: 'theme', label: 'Theme', type: 'select', group: 'Darstellung', options: ['dark', 'light'] },
  { name: 'autoRefreshMs', label: 'Auto-Refresh (ms, 0 = aus)', type: 'number', group: 'Verhalten', min: 0, max: 3600000 },
  { name: 'itemsPerPage', label: 'Items Per Page', type: 'number', group: 'Verhalten', min: 10, max: 500 },
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

function validateField(field, value, errors, path) {
  if (field.deprecated) return;
  const key = path || field.name;

  if (field.required && isEmpty(value)) {
    errors[key] = `${field.label} is required`;
    return;
  }
  if (isEmpty(value)) return;

  switch (field.type) {
    case 'number':
    case 'slider': {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) {
        errors[key] = `${field.label} must be a number`;
      } else if (field.min != null && n < field.min) {
        errors[key] = `${field.label} must be ≥ ${field.min}`;
      } else if (field.max != null && n > field.max) {
        errors[key] = `${field.label} must be ≤ ${field.max}`;
      }
      break;
    }
    case 'duration':
      if (typeof value !== 'string' || !DURATION_RE.test(value.trim())) {
        errors[key] = `${field.label} must be a duration (e.g. 5s, 1h30m)`;
      }
      break;
    case 'size':
      if (typeof value !== 'string' || !SIZE_RE.test(value.trim())) {
        errors[key] = `${field.label} must be a size (e.g. 50MiB)`;
      }
      break;
    case 'select':
      if (field.options?.length) {
        const ok = field.options.some((o) => (typeof o === 'object' && o !== null ? o.value : o) === value);
        if (!ok) errors[key] = `${field.label} must be one of the allowed options`;
      }
      break;
    case 'multi-select':
      if (field.options?.length) {
        const allowed = field.options.map((o) => (typeof o === 'object' && o !== null ? o.value : o));
        const bad = value.filter((v) => !allowed.includes(v));
        if (bad.length) errors[key] = `${field.label}: unknown option(s) ${bad.join(', ')}`;
      }
      break;
    case 'tags-number':
      if (value.some((v) => !Number.isFinite(Number(v)))) {
        errors[key] = `${field.label} must contain numbers only`;
      }
      break;
    case 'list': {
      if (!Array.isArray(value)) {
        errors[key] = `${field.label} must be a list`;
        break;
      }
      value.forEach((item, i) => {
        if (item == null || typeof item !== 'object') {
          errors[`${key}[${i}]`] = 'invalid item';
          return;
        }
        for (const sub of field.itemSchema || []) {
          validateField(sub, item[sub.name], errors, `${key}[${i}].${sub.name}`);
        }
      });
      break;
    }
    default:
      break;
  }
}

export function validateValues(catalog, values) {
  const errors = {};
  for (const field of catalog) {
    validateField(field, (values || {})[field.name], errors);
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
