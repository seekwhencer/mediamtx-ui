import Setting from "./setting.js";

export default class UsersSettings extends Setting {
    constructor(settings) {
        super();
        this.settings = settings;
        this.config = this.settings.config;
        this.source = this.config.users;

        //
        this.source.keys().forEach(key => this.data[key] = this.source[key]);

        return this.data;
    }
}