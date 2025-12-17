const ServerGroups = [
    {
        name: 'General',
        slug: 'general',
        tabs: [
            {
                name: 'Logging',
                slug: 'logging',
                fields: ['logLevel',
                    'logDestinations',
                    'logFile',
                    'sysLogPrefix']
            }, {
                name: 'I/O',
                slug: 'io',
                fields: ['udpMaxPayloadSize', 'udpReadBufferSize',
                    'readTimeout',
                    'writeTimeout',
                    'writeQueueSize']
            }, {
                name: 'Hooks',
                slug: 'hooks',
                fields: ['runOnConnect', 'runOnConnectRestart', 'runOnDisconnect']
            }
        ]
    },
    {
        name: 'HLS',
        slug: 'hls',
        tabs: [
            {
                name: 'Enabled',
                slug: 'enabled',
                fields: [
                    'hls',
                    'hlsAddress'
                ]
            }, {
                name: 'Settings',
                slug: 'settings',
                fields: [
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
                slug: 'security',
                fields: [
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
        slug: 'rtsp',
        tabs: [
            {
                name: 'Enabled',
                slug: 'enabled',
                fields: [
                    'rtsp',
                    'rtspTransports',
                    'rtspAddress',
                    'rtspsAddress',
                    'rtpAddress',
                    'rtcpAddress',
                ]
            }, {
                name: 'Multicast',
                slug: 'multicast',
                fields: [
                    'multicastIPRange',
                    'multicastRTPPort',
                    'multicastRTCPPort',
                    'multicastSRTPPort',
                    'multicastSRTCPPort',
                ]
            }, {
                name: 'Security',
                slug: 'security',
                fields: [
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
        slug: 'rtmp',
        tabs: [
            {
                name: 'Enabled',
                slug: 'enabled',
                fields: ['rtmp', 'rtmpAddress', 'rtmpsAddress']
            }, {
                name: 'Security',
                slug: 'security',
                fields: ['rtmpEncryption', 'rtmpServerKey', 'rtmpServerCert']
            }
        ]
    },
    {
        name: 'SRT',
        slug: 'srt',
        tabs: [
            {
                name: 'Enabled',
                slug: 'enabled',
                fields: ['srt', 'srtAddress']
            }
        ]
    },
    {
        name: 'WebRTC',
        slug: 'webrtc',
        tabs: [
            {
                name: 'Enabled',
                slug: 'enabled',
                fields: ['webrtc', 'webrtcAddress',
                    'webrtcLocalUDPAddress', 'webrtcLocalTCPAddress']
            }, {
                name: 'Settings',
                slug: 'settings',
                fields: ['webrtcIPsFromInterfaces',
                    'webrtcIPsFromInterfacesList',
                    'webrtcAdditionalHosts',
                    'webrtcICEServers2',
                    'webrtcHandshakeTimeout',
                    'webrtcTrackGatherTimeout',
                    'webrtcSTUNGatherTimeout']
            }, {
                name: 'Security',
                slug: 'security',
                fields: ['webrtcEncryption',
                    'webrtcServerKey',
                    'webrtcServerCert',
                    'webrtcAllowOrigins',
                    'webrtcTrustedProxies']
            }
        ]
    },
    {
        name: 'API',
        slug: 'api',
        tabs: [
            {
                name: 'Enabled',
                slug: 'enabled',
                fields: ['api', 'apiAddress'],
            }, {
                name: 'Security',
                slug: 'security',
                fields: [
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
        slug: 'auth',
        tabs: [
            {
                name: 'Connection',
                slug: 'connection',
                fields: [
                    'authMethod',
                    'authHTTPAddress'
                ]
            }, {
                name: 'Security',
                slug: 'security',
                fields: [
                    'authJWTJWKS',
                    'authJWTJWKSFingerprint',
                    'authJWTClaimKey',
                    'authJWTInHTTPQuery'
                ]
            }, {
                name: 'Excludes',
                slug: 'excludes',
                fields: [

                    'authHTTPExclude',
                    'authJWTExclude'
                ]
            }
        ]
    },
    {
        name: 'PPROF',
        slug: 'pprof',
        tabs: [
            {
                name: 'Enabled',
                slug: 'enabled',
                fields: ['pprof', 'pprofAddress']
            }, {
                name: 'Security',
                slug: 'security',
                fields: [

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