import Setting from "./setting.js";
import DataProxy from "../data_proxy.js";

export default class RTMPSettings extends Setting {
    constructor(settings) {
        super(settings);

        this.debug = false;
        this.config = this.settings.config;
        this.source = this.config.global;
        this.fields = [
            'rtmp',
            'rtmpAddress',
            'rtmpEncryption',
            'rtmpsAddress',
            'rtmpServerKey',
            'rtmpServerCert'
        ];

        this.options = {
            'rtmpEncryption': ['no', 'strict', 'optional']
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