import Tab from './Tab.js';
import StreamItem from '../Components/Streams/StreamItem.js';
import StreamsService from '../Components/Streams/StreamService.js';

export default class StreamsTab extends Tab {
    constructor(page) {
        super(page);
        this.items = {};

        const pathSettings = this.page.settings.tree.path;
        this.pathSchema = {
            fields: pathSettings.fields ?? [],
            options: pathSettings.options ?? {},
            inputType: pathSettings.inputType ?? {}
        };
        this.pathDefaults = {...this.page.settings.path};

    }

    async render() {
        // Clean up
        this.destroy();

        const ok = await this.service.loadPathsList();
        if (!ok)
            return;

        this.element = document.createElement('div');
        this.element.className = 'tab paths';
        this.page.element.append(this.element);

        // Liste der Streams
        this.list = document.createElement('div');
        this.list.className = 'paths-list';
        this.element.append(this.list);

        // Store Events abonnieren
        /*this.unsubs = [
            this.store.on('create', (name, data) => this.addItem(name, data)),
            this.store.on('update', (name, data) => this.updateItem(name, data)),
            this.store.on('delete', name => this.removeItem(name))
        ];*/

        // Initiale Synchronisierung
        //await this.store.sync();
        this.renderList();
        this.renderAddButton();
    }

    renderList() {
        Object.keys(this.store.paths).forEach(pathKey => this.addItem(pathKey, this.store.paths[pathKey]))
    }

    renderAddButton() {
        const btn = document.createElement('button');
        btn.className = 'add';
        btn.innerHTML = `${this.page.icons.svg['list-plus']} Add path`;
        btn.onclick = () => this.addPath();
        this.element.append(btn);
    }

    addItem(name, data) {
        if (this.items[name]) return;

        const item = new StreamItem({
                name: name,
                data: data,
                schema: this.pathSchema,
                tab: this
            }
        );

        this.items[name] = item;
        this.list.append(item.element);
    }

    updateItem(name, data) {
        const item = this.items[name];
        if (item) {
            Object.keys(data).forEach(k => item.data[k] = data[k]);
        }
    }

    removeItem(name) {
        const item = this.items[name];
        if (item) {
            item.destroy();
            delete this.items[name];
        }
    }

    async addPath() {
        const data = {...this.page.settings.path, name: 'new', source: 'publisher', sourceOnDemand: false};
        await this.service.addPath(data);
    }

    async updatePath(name, data) {
        await this.service.updatePath(name, data);
    }

    async deletePath(name) {
        const ok = await this.service.deletePath(name);
        if (ok)
            this.removeItem(name);
    }

    destroy() {
        this.unsubs?.forEach(fn => fn());
        Object.values(this.items).forEach(item => item.destroy());
        this.items = {};
        this.element?.remove();
    }


    get store() {
        return this.settings.store;
    }

    set store(val) {
        // do nothing
    }

    get service() {
        return this.settings.service;
    }

    set service(val) {
        // do nothing
    }
}