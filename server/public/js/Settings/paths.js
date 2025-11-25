import Setting from "./setting.js";

export default class PathsSettings extends Setting {
    constructor(settings) {
        super();
        this.settings = settings;
        this.config = this.settings.config;
        this.source = this.config.paths;

        //
        this.source.keys().forEach(key => this.data[key] = this.source[key]);

        return this.data;
    }
}