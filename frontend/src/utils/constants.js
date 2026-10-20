// Badge-Töne: gray, green, red, amber, blue
export const STATUS_COLORS = {
  idle: 'gray',
  read: 'green',
  publish: 'green',
  forwarding: 'green',
  running: 'green',
  online: 'green',
  available: 'green',
  enabled: 'green',
  error: 'red',
  offline: 'red',
  unavailable: 'red',
  disabled: 'gray',
};

export const ENUM_LABELS = {
  authAction: {
    publish: 'Publish',
    read: 'Read',
    playback: 'Playback',
    api: 'API',
    metrics: 'Metrics',
    pprof: 'Pprof',
  },
  authMethod: {
    internal: 'Internal',
    http: 'HTTP',
    jwt: 'JWT',
  },
  encryption: {
    no: 'No',
    optional: 'Optional',
    strict: 'Strict',
  },
  hlsVariant: {
    mpegts: 'MPEG-TS',
    fmp4: 'FMP4',
    lowLatency: 'Low Latency',
  },
  logLevel: {
    error: 'Error',
    warn: 'Warn',
    info: 'Info',
    debug: 'Debug',
  },
  logDestination: {
    stdout: 'Stdout',
    file: 'File',
    syslog: 'Syslog',
  },
  moqSessionState: {
    idle: 'Idle',
    read: 'Read',
    publish: 'Publish',
  },
  moqVersion: {
    'moqt-16': 'MOQT-16',
    'moqt-17': 'MOQT-17',
    'moqt-18': 'MOQT-18',
    'moqt-19': 'MOQT-19',
  },
  pathReaderType: {
    hlsSession: 'HLS Session',
    rtmpConn: 'RTMP Conn',
    rtspConn: 'RTSP Conn',
    rtspSession: 'RTSP Session',
    srtConn: 'SRT Conn',
    webRTCSession: 'WebRTC Session',
    moqSession: 'MoQ Session',
    hidden: 'Hidden',
  },
  pathSourceType: {
    hlsSource: 'HLS Source',
    redirect: 'Redirect',
    rpiCameraSource: 'Raspberry Pi Camera',
    rtmpConn: 'RTMP Conn',
    rtmpSource: 'RTMP Source',
    rtspSession: 'RTSP Session',
    rtspSource: 'RTSP Source',
    srtConn: 'SRT Conn',
    srtSource: 'SRT Source',
    mpegtsSource: 'MPEG-TS Source',
    rtpSource: 'RTP Source',
    webRTCSession: 'WebRTC Session',
    webRTCSource: 'WebRTC Source',
    moqSource: 'MoQ Source',
    moqSession: 'MoQ Session',
  },
  forwardDestType: {
    rtmp: 'RTMP',
    rtsp: 'RTSP',
    srt: 'SRT',
    moq: 'MoQ',
    webRTC: 'WebRTC',
  },
  forwardDestProtocol: {
    rtmp: 'RTMP',
    rtmps: 'RTMPS',
    rtsp: 'RTSP',
    rtsps: 'RTSPS',
    srt: 'SRT',
    moq: 'MoQ',
    whip: 'WHIP',
    whips: 'WHIPS',
  },
  forwardDestState: {
    idle: 'Idle',
    forwarding: 'Forwarding',
    error: 'Error',
  },
  recordFormat: {
    fmp4: 'FMP4',
    mpegts: 'MPEG-TS',
  },
  rtmpConnState: {
    idle: 'Idle',
    read: 'Read',
    publish: 'Publish',
  },
  rtspAuthMethod: {
    basic: 'Basic',
    digest: 'Digest',
  },
  rtspRangeType: {
    '': '(empty)',
    clock: 'Clock',
    npt: 'NPT',
    smpte: 'SMPTE',
  },
  rtspSessionState: {
    idle: 'Idle',
    read: 'Read',
    publish: 'Publish',
  },
  rtspTransport: {
    udp: 'UDP',
    multicast: 'Multicast',
    tcp: 'TCP',
    automatic: 'Automatic',
  },
  srtConnState: {
    idle: 'Idle',
    read: 'Read',
    publish: 'Publish',
  },
  staticSourceState: {
    idle: 'Idle',
    running: 'Running',
    error: 'Error',
  },
  webrtcSessionState: {
    read: 'Read',
    publish: 'Publish',
  },
};

export function enumLabel(enumName, value) {
  const map = ENUM_LABELS[enumName];
  if (!map) return String(value ?? '–');
  return map[value] ?? String(value ?? '–');
}
