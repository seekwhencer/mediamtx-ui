import Setting from "./setting.js";

export default class ApiSettings extends Setting {
    constructor(settings) {
        super();
        this.settings = settings;
        this.config = this.settings.config;
        this.source = this.config.general;
        this.fields = [
            'api',
            'apiAddress',
            'apiEncryption',
            'apiServerKey',
            'apiServerCert',
            'apiAllowOrigins',
            'apiTrustedProxies'
        ];

        // set the data
        this.setFields();

        return this.data;
    }
}