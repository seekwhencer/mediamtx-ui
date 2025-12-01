import Setting from "./setting.js";

export default class RTSPSettings extends Setting {
    constructor(settings) {
        super(settings);

        this.config = this.settings.config;
        this.source = this.config.global;
        this.fields = [
            'rtsp',
            'rtspTransports',
            'rtspEncryption',
            'rtspAddress',
            'rtspsAddress',
            'rtpAddress',
            'rtcpAddress',
            'multicastIPRange',
            'multicastRTPPort',
            'multicastRTCPPort',
            'srtpAddress',
            'srtcpAddress',
            'multicastSRTPPort',
            'multicastSRTCPPort',
            'rtspServerKey',
            'rtspServerCert',
            'rtspAuthMethods',
        ];

        this.options = {
            'rtspEncryption': ['no', 'strict', 'optional'],
            'rtspTransports' : ['multicast', 'tcp', 'udp' ],
            'rtspAuthMethods' : ['basic','digest']
        }

        // set the data
        this.setFields();

        return this.data;
    }

    action(action, prop, value) {
        super.action(action, prop, value);

        if (this.settings.created)
            this.settings.setGlobalConfig();

        this.settings.action(action, prop, value);
    }
}