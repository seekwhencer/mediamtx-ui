import Tab from "./tab.js";
import DataProxy from "../data_proxy.js";
import StreamItem from "../Components/Overview/stream.js";

export default class OverviewTab extends Tab {
    constructor(page) {
        super(page);
        this.baseUrl = '/mediamtx';
        this.pathsListUrl = `${this.baseUrl}/paths/list`;
        this.items = new DataProxy({}, this, false);
    }

    async render() {

        // the box
        this.element = document.createElement("div");
        this.element.className = "tab overview";
        this.page.element.append(this.element);

        this.pathsEl = document.createElement("div");
        this.pathsEl.classList.add('streams');
        this.element.append(this.pathsEl);

        await this.load();

    }

    renderPathItem(name) {
        const element = this.items[name].render();
        this.pathsEl.append(element);
    }

    async load() {
        await this.loadPathsList();
        this.poll();
    }

    async loadPathsList() {
        const res = await fetch(this.pathsListUrl);

        if (!res)
            return;

        const text = await res.text();
        const data = await JSON.parse(text);

        if (!data.items)
            return;

        this.syncData(data.items);
    }

    syncData(items) {
        // drop missing items
        const dropped = this.items.keys().filter(a => !items.map(i => i.confName).includes(a));
        dropped.forEach(i => {
            this.items[i].destroy();
            delete this.items[i];
        });

        if (items.length > 0) {
            items.forEach(i => {
                if (!this.items[i.confName]) {
                    this.items[i.confName] = new StreamItem(i, this);
                } else {
                    this.items[i.confName].update(i);
                }
            });
        }
    }

    poll() {
        clearInterval(this.cylce);
        this.cylce = setInterval(() => this.loadPathsList(), 500);
    }

    action(action, prop, value) {
        console.log(this.label, action, prop, value);

        if (action === 'create')
            this.renderPathItem(prop);


    }

    destroy() {
        super.destroy();
        clearInterval(this.cylce);
        this.items.keys().forEach(i => delete this.items[i]);
    }

    get settings() {
        return this.page.settings;
    }

    set settings(value) {
        // do nothing
    }
}
