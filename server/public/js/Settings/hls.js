import Setting from "./setting.js";

export default class HLSSettings extends Setting {
    constructor(settings) {
        super(settings);

        this.debug = true;
        this.config = this.settings.config;
        this.source = this.config.global;
        this.fields = [
            'hls',
            'hlsEncryption',
            'hlsServerKey',
            'hlsServerCert',
            'hlsAllowOrigins',
            'hlsTrustedProxies',
            'hlsAlwaysRemux',
            'hlsVariant',
            'hlsSegmentCount',
            'hlsSegmentDuration',
            'hlsPartDuration',
            'hlsSegmentMaxSize',
            'hlsDirectory',
            'hlsMuxerCloseAfter',
        ];

        this.options = {
            'hlsVariant' : ['mpegts', 'fmp4', 'lowLatency ']
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