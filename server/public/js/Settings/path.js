import Setting from "./setting.js";

export default class PathSettings extends Setting {
    constructor(settings) {
        super(settings);

        this.debug = true;
        this.config = this.settings.config;
        this.source = this.config.path;
        this.fields = [
            'source',
            'sourceFingerprint',
            'sourceOnDemand',
            'sourceOnDemandStartTimeout',
            'sourceOnDemandCloseAfter',
            'maxReaders',
            'srtReadPassphrase',
            'fallback',
            'useAbsoluteTimestamp',

            // recording
            'record',
            'recordPath',
            'recordFormat',
            'recordPartDuration',
            'recordMaxPartSize',
            'recordSegmentDuration',
            'recordDeleteAfter',

            // Default path settings -> Publisher source (when source is "publisher")
            'overridePublisher',
            'srtPublishPassphrase',

            // Default path settings -> RTSP source (when source is a RTSP or a RTSPS URL)
            'rtspTransport',
            'rtspAnyPort',
            'rtspRangeType',
            'rtspRangeStart',

            // Default path settings -> RTP source (when source is RTP)
            'rtpSDP',

            'sourceRedirect',

            // Default path settings -> Raspberry Pi Camera source (when source is "rpiCamera")
            'rpiCameraCamID',
            'rpiCameraSecondary',
            'rpiCameraWidth',
            'rpiCameraHeight',
            'rpiCameraHFlip',
            'rpiCameraVFlip',
            'rpiCameraBrightness',
            'rpiCameraContrast',
            'rpiCameraSaturation',
            'rpiCameraSharpness',
            'rpiCameraExposure',
            'rpiCameraAWB',
            'rpiCameraAWBGains',
            'rpiCameraDenoise',
            'rpiCameraShutter',
            'rpiCameraMetering',
            'rpiCameraGain',
            'rpiCameraEV',
            'rpiCameraROI',
            'rpiCameraHDR',
            'rpiCameraTuningFile',
            'rpiCameraMode',
            'rpiCameraFPS',
            'rpiCameraAfMode',
            'rpiCameraAfRange',
            'rpiCameraAfSpeed',
            'rpiCameraLensPosition',
            'rpiCameraLensPosition',
            'rpiCameraAfWindow',
            'rpiCameraFlickerPeriod',
            'rpiCameraTextOverlayEnable',
            'rpiCameraTextOverlay',
            'rpiCameraCodec',
            'rpiCameraIDRPeriod',
            'rpiCameraBitrate',
            'rpiCameraHardwareH264Profile',
            'rpiCameraHardwareH264Level',
            'rpiCameraSoftwareH264Profile',
            'rpiCameraSoftwareH264Level',
            'rpiCameraMJPEGQuality',

            // Default path settings -> Hooks
            'runOnInit',
            'runOnInitRestart',
            'runOnDemand',
            'runOnDemandRestart',
            'runOnDemandStartTimeout',
            'runOnDemandCloseAfter',
            'runOnUnDemand',
            'runOnReady',
            'runOnReadyRestart',
            'runOnNotReady',
            'runOnRead',
            'runOnReadRestart',
            'runOnRecordSegmentCreate',
            'runOnRecordSegmentComplete',
        ];

        this.options = {
            source: ['', 'publisher', 'redirect', 'rpiCamera'],
            recordFormat: ['fmp4', 'mpegts'],
            rtspTransport: ['automatic', 'tcp', 'udp', 'http'],
            rtspRangeType: ['npt', 'smpte', 'clock'],
            rtspRangeStart: ['npt', 'smpte', 'clock'],
            rpiCameraBrightness: {min: -1, max: 1},
            rpiCameraContrast: {min: 0, max: 16},
            rpiCameraSaturation: {min: 0, max: 16},
            rpiCameraSharpness: {min: 0, max: 16},
            rpiCameraExposure: ['normal', 'short', 'long', 'custom'],
            rpiCameraAWB: ['auto', 'incandescent', 'tungsten', 'fluorescent', 'indoor', 'daylight', 'cloudy', 'custom'],
            rpiCameraAWBGains: [0, 0],
            rpiCameraDenoise: ['off', 'cdn_off', 'cdn_fast', 'cdn_hq'],
            rpiCameraMetering: ['centre', 'spot', 'matrix', 'custom'],
            rpiCameraEV: {min: -10, max: 10},
            rpiCameraAfMode: ['auto', 'manual', 'continuous'],
            rpiCameraAfRange: ['normal', 'macro', 'full'],
            rpiCameraAfSpeed: ['normal', 'fast'],
            rpiCameraCodec: ['auto', 'mjpeg'],
            rpiCameraHardwareH264Profile: ['baseline', 'main', 'high'],
            rpiCameraHardwareH264Level: ['4.0', '4.1', '4.2'],
            rpiCameraSoftwareH264Profile: ['baseline', 'main', 'high'],
            rpiCameraSoftwareH264Level: ['4.0', '4.1', '4.2']
        };

        // set the data
        this.setFields();

        return this.data;
    }

    action(action, prop, value) {
        super.action(action, prop, value);

        if (this.settings.created)
            this.settings.setPathDefaultsConfig();

        this.settings.action(action, prop, value);
    }
}