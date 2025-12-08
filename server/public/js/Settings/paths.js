import Setting from "./setting.js";

export default class PathsSettings extends Setting {
    constructor(settings) {
        super(settings);

        this.debug = true;
        this.config = this.settings.config;
        this.source = this.config.paths;

        //
        Object.keys(this.source).forEach(path => this.data[path] = this.source[path]);
        return this.data;
    }

    /*action(action, prop, value) {
        super.action(action, prop, value);

        //if (this.settings.created)
            //this.settings.setGlobalConfig();

        this.settings.action(action, prop, value);
    }*/

    action(action, prop, value) {
        super.action(action, prop, value);
    }
}