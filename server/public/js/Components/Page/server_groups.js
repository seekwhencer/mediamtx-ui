const ServerGroups = [
    {
        name: 'General',
        storeKey: 'general',
        columns: [
            {
                name: 'Logging',
                props: ['logLevel',
                    'logDestinations',
                    'logFile',
                    'sysLogPrefix']
            }, {
                name: 'I/O',
                props: ['udpMaxPayloadSize', 'udpReadBufferSize',
                    'readTimeout',
                    'writeTimeout',
                    'writeQueueSize']
            }, {
                name: 'Hooks',
                props: ['runOnConnect', 'runOnConnectRestart', 'runOnDisconnect']
            }
        ]
    },
    {
        name: 'HLS',
        storeKey: 'hls',
        columns: [
            {
                name: 'Enabled',
                props: [
                    'hls',
                    'hlsAddress'
                ]
            }, {
                name: 'Settings',
                props: [
                    'hlsAlwaysRemux',
                    'hlsVariant',
                    'hlsSegmentCount',
                    'hlsSegmentDuration',
                    'hlsPartDuration',
                    'hlsSegmentMaxSize',
                    'hlsDirectory',
                    'hlsMuxerCloseAfter',
                ]
            }, {
                name: 'Security',
                props: [
                    'hlsEncryption',
                    'hlsServerKey',
                    'hlsServerCert',
                    'hlsAllowOrigins',
                    'hlsTrustedProxies'
                ]
            }
        ]
    },
    {
        name: 'RTSP',
        storeKey: 'rtsp',
        columns: [
            {
                name: 'Enabled',
                props: [
                    'rtsp',
                    'rtspTransports',
                    'rtspAddress',
                    'rtspsAddress',
                    'rtpAddress',
                    'rtcpAddress',
                ]
            }, {
                name: 'Multicast',
                props: [
                    'multicastIPRange',
                    'multicastRTPPort',
                    'multicastRTCPPort',
                    'multicastSRTPPort',
                    'multicastSRTCPPort',
                ]
            }, {
                name: 'Security',
                props: [
                    'rtspEncryption',
                    'srtpAddress',
                    'srtcpAddress',
                    'rtspServerKey',
                    'rtspServerCert',
                    'rtspAuthMethods'
                ]
            },
        ]
    },
    {
        name: 'RTMP',
        storeKey: 'rtmp',
        columns: [
            {
                name: 'Enabled',
                props: ['rtmp', 'rtmpAddress', 'rtmpsAddress']
            }, {
                name: 'Security',
                props: ['rtmpEncryption', 'rtmpServerKey', 'rtmpServerCert']
            }
        ]
    },
    {
        name: 'SRT',
        storeKey: 'srt',
        columns: [
            {
                name: 'Enabled',
                props: ['srt', 'srtAddress']
            }
        ]
    },
    {
        name: 'WebRTC',
        storeKey: 'webrtc',
        columns: [
            {
                name: 'Enabled',
                props: ['webrtc', 'webrtcAddress',
                    'webrtcLocalUDPAddress', 'webrtcLocalTCPAddress']
            }, {
                name: 'Settings',
                props: ['webrtcIPsFromInterfaces',
                    'webrtcIPsFromInterfacesList',
                    'webrtcAdditionalHosts',
                    'webrtcICEServers2',
                    'webrtcHandshakeTimeout',
                    'webrtcTrackGatherTimeout',
                    'webrtcSTUNGatherTimeout']
            }, {
                name: 'Security',
                props: ['webrtcEncryption',
                    'webrtcServerKey',
                    'webrtcServerCert',
                    'webrtcAllowOrigins',
                    'webrtcTrustedProxies']
            }
        ]
    },
    {
        name: 'API',
        storeKey: 'api',
        columns: [
            {
                name: 'Enabled',
                props: ['api', 'apiAddress'],
            }, {
                name: 'Security',
                props: [
                    'apiEncryption',
                    'apiServerKey',
                    'apiServerCert',
                    'apiAllowOrigins',
                    'apiTrustedProxies'
                ]
            }
        ]
    },
    {
        name: 'Authentication',
        storeKey: 'auth',
        columns: [
            {
                name: 'Connection',
                props: [
                    'authMethod',
                    'authHTTPAddress'
                ]
            }, {
                name: 'Security',
                props: [
                    'authJWTJWKS',
                    'authJWTJWKSFingerprint',
                    'authJWTClaimKey',
                    'authJWTInHTTPQuery'
                ]
            }, {
                name: 'Excludes',
                props: [

                    'authHTTPExclude',
                    'authJWTExclude'
                ]
            }
        ]
    },
    {
        name: 'PPROF',
        storeKey: 'pprof',
        columns: [
            {
                name: 'Enabled',
                props: ['pprof', 'pprofAddress']
            }, {
                name: 'Security',
                props: [

                    'pprofEncryption',
                    'pprofServerKey',
                    'pprofServerCert',
                    'pprofAllowOrigins',
                    'pprofTrustedProxies'
                ]
            }
        ]
    }
];

export default ServerGroups;