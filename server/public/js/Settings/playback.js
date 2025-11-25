import Setting from "./setting.js";
import DataProxy from "../data_proxy.js";

export default class PlaybackSettings extends Setting {
    constructor(settings) {
        super();
        this.settings = settings;
        this.config = this.settings.config;
        this.source = this.config.general;
        this.fields = [
            'playback',
            'playbackAddress',
            'playbackEncryption',
            'playbackServerKey',
            'playbackServerCert',
            'playbackAllowOrigins',
            'playbackTrustedProxies'
        ];

        // set the data
        this.setFields();

        return this.data;
    }
}