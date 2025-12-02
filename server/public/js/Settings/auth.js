import Setting from "./setting.js";

export default class AuthSettings extends Setting {
    constructor(settings) {
        super(settings);

        this.debug = true;
        this.config = this.settings.config;
        this.source = this.config.global;
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

        this.options = {
            authMethod: ['internal', 'http', 'jwt']
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