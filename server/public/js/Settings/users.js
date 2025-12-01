import Setting from "./setting.js";

export default class UsersSettings extends Setting {
    constructor(settings) {
        super(settings, []); // <--- there is an array. if not set, it's an object

        this.config = this.settings.config;
        this.source = this.config.users;

        //
        if (Array.isArray(this.source)) {
            this.source.forEach(target => this.data.push(target));
        } else {
            Object.keys(this.source).forEach(key => this.data[key] = this.source[key]);
        }

        return this.data;
    }

    action(action, prop, value) {
        super.action(action, prop, value);

        if (this.settings.created)
            this.settings.setGlobalConfig();

        this.settings.action(action, prop, value);
    }
}