import EventEmitter from '../event_emitter.js';
import FormItem from "../Components/formitem.js";

export default class ServerTab extends EventEmitter {
    constructor(page) {
        super();
        this.page = page;

        this.groups = [
            {general: 'General'},
            {api: 'API'},
            {auth: 'Authentication'},
            {hls: 'HLS'},
            {hls: 'HLS'},
        ];
    }

    render() {
        if (this.element)
            this.destroy();

        // the box
        this.element = document.createElement("div");
        this.element.className = "tab server";
        this.page.element.append(this.element);


        // inputs
        this.items = {};
        this.settings.keys().forEach(prop => {
            const item = new FormItem(this.settings, prop);
            this.element.append(item.element);
            this.items[prop] = item;
        });

    }

    destroy() {
        this.element ? this.element.remove() : null;
    }

    get settings() {
        return this.page.settings.general;
    }

    set settings(value) {
        // do nothing
    }
}
