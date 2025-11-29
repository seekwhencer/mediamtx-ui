import EventEmitter from '../event_emitter.js';
import FormItem from "../Components/formitem.js";

export default class OverviewTab extends EventEmitter {
    constructor(page) {
        super();
        this.page = page;
    }

    render() {
        if (this.element)
            this.destroy();

        // the box
        this.element = document.createElement("div");
        this.element.className = "tab overview";
        this.page.element.append(this.element);

        // the container
        /*this.container = document.createElement("div");
        this.container.className = "container";
        this.element.append(this.container);
*/
        // a button
        /*
        this.button = new Button({
            innerHTML: this.settings.source,
            className: 'button overview-button',
            onclick: () => console.log('>>>> clicked overview button')
        });
        this.settings.on('source', (value, action) => this.button.element.innerHTML = value);
        this.container.append(this.button.element);
        */

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
        //this.container.remove();
        //this.button.remove();
        //this.input.remove();
    }

    get settings() {
        return this.page.settings.path;
    }

    set settings(value) {
        // do nothing
    }
}
