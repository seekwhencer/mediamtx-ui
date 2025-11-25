import Setting from "./setting.js";
import DataProxy from "../data_proxy.js";

export default class MetricsSettings extends Setting {
    constructor(settings) {
        super();
        this.settings = settings;
        this.config = this.settings.config;
        this.source = this.config.general;
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
}