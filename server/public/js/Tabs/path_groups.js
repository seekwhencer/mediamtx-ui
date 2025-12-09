import ServerGroups from "./server_groups.js";

const PathGroups = [
    {
        name: 'Source',
        slug: 'source',
        tabs: [
            {
                name: 'Source',
                slug: 'source',
                fields: [
                    'source',
                    'sourceRedirect',
                    'sourceFingerprint',
                    'sourceOnDemand',
                    'sourceOnDemandStartTimeout',
                    'sourceOnDemandCloseAfter'
                ]
            }, {
                name: 'I/O',
                slug: 'io',
                fields: ['maxReaders',
                    'srtReadPassphrase',
                    'fallback',
                    'useAbsoluteTimestamp',
                    'overridePublisher',
                    'srtPublishPassphrase'
                ]
            }
        ]
    }, {
        name: 'Recording',
        slug: 'recording',
        tabs: [
            {
                name: 'Enabled',
                slug: 'enabled',
                fields: ['record', 'recordPath',
                    'recordFormat',
                    'recordMaxPartSize']
            }, {
                name: 'Enabled',
                slug: 'enabled',
                fields: [
                    'recordPartDuration',
                    'recordSegmentDuration',
                    'recordDeleteAfter',
                ]
            }
        ]
    }, {
        name: 'RTSP',
        slug: 'rtsp',
        tabs: [
            {
                name: 'Enabled',
                slug: 'enabled',
                fields: [
                    // Default path settings -> RTSP source (when source is a RTSP or a RTSPS URL)
                    'rtspTransport',
                    'rtspAnyPort',
                    'rtspRangeType',
                    'rtspRangeStart',

                    // Default path settings -> RTP source (when source is RTP)
                    'rtpSDP']
            }
        ]
    }, {
        name: 'Raspberry Pi Cam',
        slug: 'raspicam',
        tabs: [
            {
                name: 'Rasperry Pi Camera',
                slug: '1',
                fields: [
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

                ]
            }, {
                name: '&nbsp;',
                slug: '2',
                fields: [
                    'rpiCameraExposure',
                    'rpiCameraAWB',
                    //'rpiCameraAWBGains',
                    'rpiCameraDenoise',
                    'rpiCameraShutter',
                    'rpiCameraMetering',
                    'rpiCameraGain',
                    'rpiCameraEV',
                    'rpiCameraROI',
                    'rpiCameraHDR',
                    'rpiCameraTuningFile',
                ]
            }, {
                name: '&nbsp;',
                slug: '3',
                fields: [
                    'rpiCameraMode',
                    'rpiCameraFPS',
                    'rpiCameraAfMode',
                    'rpiCameraAfRange',
                    'rpiCameraAfSpeed',
                    'rpiCameraLensPosition',
                    'rpiCameraLensPosition',
                    'rpiCameraAfWindow',
                    'rpiCameraFlickerPeriod',
                    'rpiCameraCodec',
                ]
            }, {
                name: '&nbsp;',
                slug: '4',
                fields: [
                    'rpiCameraIDRPeriod',
                    'rpiCameraBitrate',
                    'rpiCameraHardwareH264Profile',
                    'rpiCameraHardwareH264Level',
                    'rpiCameraSoftwareH264Profile',
                    'rpiCameraSoftwareH264Level',
                    'rpiCameraMJPEGQuality',
                    'rpiCameraAfWindow',
                    'rpiCameraFlickerPeriod',
                ]
            }, {
                name: '&nbsp;',
                slug: '5',
                fields: [
                    'rpiCameraTextOverlayEnable',
                    'rpiCameraTextOverlay',
                    'rpiCameraCodec',
                    'rpiCameraIDRPeriod',
                    'rpiCameraBitrate',
                    'rpiCameraHardwareH264Profile',
                    'rpiCameraHardwareH264Level',
                    'rpiCameraSoftwareH264Profile',
                    'rpiCameraSoftwareH264Level',
                    'rpiCameraMJPEGQuality'
                ]
            }
        ]
    }, {
        name: 'HOOKS',
        slug: 'hooks',
        tabs: [
            {
                name: 'Settings',
                slug: 'settings',
                fields: ['runOnInit',
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
                    'runOnRecordSegmentComplete',]
            }
        ]
    },
];

export default PathGroups;