import Setting from "./setting.js";
import DataProxy from "../data_proxy.js";

export default class MetricsSettings extends Setting {
    constructor(settings) {
        super(settings);

        this.config = this.settings.config;
        this.source = this.config.global;
        this.fields = [
            'metrics',
            'metricsAddress',
            'metricsEncryption',
            'metricsServerKey',
            'metricsServerCert',
            'metricsAllowOrigins',
            'metricsTrustedProxies'
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