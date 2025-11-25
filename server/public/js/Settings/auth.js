import Setting from "./setting.js";

export default class AuthSettings extends Setting {
    constructor(settings) {
        super();
        this.settings = settings;
        this.config = this.settings.config;
        this.source = this.config.general;
        this.fields = [
            'authMethod',
            'authHTTPAddress',
            'authHTTPExclude',
            'authJWTJWKS',
            'authJWTJWKSFingerprint',
            'authJWTClaimKey',
            'authJWTExclude',
            'authJWTInHTTPQuery'
        ];

        // set the data
        this.setFields();

        return this.data;
    }
}