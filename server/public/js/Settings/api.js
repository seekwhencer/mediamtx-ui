import Setting from "./setting.js";

export default class ApiSettings extends Setting {
    constructor(settings) {
        super(settings);

        this.debug = false;
        this.config = this.settings.config;
        this.source = this.config.global;
        this.fields = [
            'api',
            'apiAddress',
            'apiEncryption',
            'apiServerKey',
            'apiServerCert',
            'apiAllowOrigins',
            'apiTrustedProxies'
        ];

        this.nailed = this.fields;

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