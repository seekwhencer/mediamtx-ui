import Setting from "./setting.js";

export default class PPROFSettings extends Setting {
    constructor(settings) {
        super(settings);

        this.config = this.settings.config;
        this.source = this.config.global;
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

    action(action, prop, value) {
        super.action(action, prop, value);

        if (this.settings.created)
            this.settings.setGlobalConfig();

        this.settings.action(action, prop, value);
    }
}