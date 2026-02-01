const PathGroups = [
    {
        name: 'Source',
        storeKey: 'source',
        columns: [
            {
                name: 'Source',
                props: [
                    'source',
                    'sourceRedirect',
                    'sourceFingerprint',
                    'sourceOnDemand',
                    'sourceOnDemandStartTimeout',
                    'sourceOnDemandCloseAfter'
                ]
            }, {
                name: 'Always Available',
                props: [
                    'alwaysAvailable',
                    'alwaysAvailableFile',
                    'alwaysAvailableTracks'
                ]
            }, {
                name: 'I/O',
                props: [
                    'maxReaders',
                    'srtReadPassphrase',
                    'useAbsoluteTimestamp',
                    'overridePublisher',
                    'srtPublishPassphrase'
                ]
            }
        ]
    }, {
        name: 'Recording',
        storeKey: 'recording',
        columns: [
            {
                name: 'Enabled',
                props: ['record', 'recordPath',
                    'recordFormat',
                    'recordMaxPartSize']
            }, {
                name: 'Enabled',
                props: [
                    'recordPartDuration',
                    'recordSegmentDuration',
                    'recordDeleteAfter',
                ]
            }
        ]
    }, {
        name: 'RTSP',
        storeKey: 'rtsp',
        columns: [
            {
                name: 'Enabled',
                props: [
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
        storeKey: 'raspicam',
        props: [
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
            //'rpiCameraAWBGains',
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
            'rpiCameraCodec',
            'rpiCameraIDRPeriod',
            'rpiCameraBitrate',
            'rpiCameraHardwareH264Profile',
            'rpiCameraHardwareH264Level',
            'rpiCameraSoftwareH264Profile',
            'rpiCameraSoftwareH264Level',
            'rpiCameraMJPEGQuality',
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
            'rpiCameraMJPEGQuality'
        ]
    }, {
        name: 'HOOKS',
        storeKey: 'hooks',
        columns: [
            {
                name: 'Settings',
                props: ['runOnInit',
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
                    'runOnRecordSegmentComplete']
            }
        ]
    },
];

export default PathGroups;