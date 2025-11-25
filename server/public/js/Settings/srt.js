import Setting from "./setting.js";
import DataProxy from "../data_proxy.js";

export default class SRTSettings extends Setting {
    constructor(settings) {
        super();
        this.settings = settings;
        this.config = this.settings.config;
        this.source = this.config.general;
        this.fields = [
            'srt',
            'srtAddress'
        ];

        // set the data
        this.setFields();

        return this.data;
    }
}