import Setting from "./setting.js";
import DataProxy from "../data_proxy.js";

export default class RTMPSettings extends Setting {
    constructor(settings) {
        super();
        this.settings = settings;
        this.config = this.settings.config;
        this.source = this.config.general;
        this.fields = [
            'rtmp',
            'rtmpAddress',
            'rtmpEncryption',
            'rtmpsAddress',
            'rtmpServerKey',
            'rtmpServerCert'
        ];

        // set the data
        this.setFields();

        return this.data;
    }
}