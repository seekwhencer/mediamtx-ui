import Setting from "./setting.js";

export default class PPROFSettings extends Setting {
    constructor(settings) {
        super();
        this.settings = settings;
        this.config = this.settings.config;
        this.source = this.config.general;
        this.fields = [
            'pprof',
            'pprofAddress',
            'pprofEncryption',
            'pprofServerKey',
            'pprofServerCert',
            'pprofAllowOrigins',
            'pprofTrustedProxies'
        ];

        // set the data
        this.setFields();

        return this.data;
    }
}