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
        if (this.element)
            this.destroy();

        await this.load();

        // the box
        this.element = document.createElement("div");
        this.element.className = "tab overview";
        this.page.element.append(this.element);

        this.renderPathsList();
    }

    renderPathsList() {
        const pathsEl = document.createElement("div");
        pathsEl.classList.add('streams');

        this.items.keys().forEach(i => {
            const element = this.items[i].render();
            pathsEl.append(element);
        });

        this.element.append(pathsEl);
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
    }

    destroy() {
        super.destroy();
        clearInterval(this.cylce);
    }

    get settings() {
        return this.page.settings;
    }

    set settings(value) {
        // do nothing
    }
}
