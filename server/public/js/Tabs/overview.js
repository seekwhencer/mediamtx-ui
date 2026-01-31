import Tab from "./Tab.js";
import DataProxy from "../data_proxy.js";
import StreamItem from "../Components/Overview/stream.js";

export default class OverviewTab extends Tab {
    constructor(page) {
        super(page);
        this.baseUrl = '/mediamtx';
        this.pathsListUrl = `${this.baseUrl}/paths/list`;
        this.items = new DataProxy({}, this, false);
        this.pollingDelay = 500; //ms
    }

    async render() {
        // the box
        this.element = document.createElement("div");
        this.element.className = "tab overview";
        this.page.element.append(this.element);

        this.pathsEl = document.createElement("div");
        this.pathsEl.classList.add('streams');
        this.element.append(this.pathsEl);

        this.openRequests = 0;
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
        const res = await this.fm.fetch(this.pathsListUrl);

        if (!res)
            return false;

        const text = await res.text();
        const data = await JSON.parse(text);

        if (!data.items)
            return;

        this.syncData(data.items);
        return true;
    }

    syncData(items) {
        // drop missing items
        const dropped = this.items.keys().filter(a => !items.map(i => i.confName).includes(a));
        dropped.forEach(i => {
            this.items[i].destroy();
            delete this.items[i];
        });

        // create or update (patch)
        if (items.length > 0) {
            items.forEach(i => {
                if (!this.items[i.confName]) {
                    this.items[i.confName] = new StreamItem(i, this);
                } else {
                    if(typeof this.items[i.confName].update === 'function') {
                        console.log('++++++++++++++++', i.confName);
                        this.items[i.confName].update(i);
                    } else {
                        console.log('>>>>>>>>>>>>>>', i.confName);
                    }
                }
            });
        }
    }

    poll() {
        clearInterval(this.cycle);
        this.cycle = setInterval(() => this.loadPathsList(), this.pollingDelay);
    }

    action(action, prop, value) {
        console.log(this.label, action, prop, value);

        if (action === 'create')
            this.renderPathItem(prop);
    }

    destroy() {
        super.destroy();
        clearInterval(this.cycle);
        this.items.keys().forEach(i => {
            this.items[i].destroy();
            delete this.items[i]
        });
        this.element ? this.element.remove() : null;
    }

    get settings() {
        return this.page.settings;
    }

    set settings(value) {
        // do nothing
    }
}
