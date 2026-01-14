import Tab from './Tab.js';
import StreamItem from '../Components/Streams/StreamItem.js';

export default class StreamsTab extends Tab {
    constructor(page) {
        super(page);
        this.items = {};
        this.listeners = new Map();

        const pathSettings = this.page.settings.tree.path;
        this.pathSchema = {
            fields: pathSettings.fields ?? [],
            options: pathSettings.options ?? {},
            inputType: pathSettings.inputType ?? {}
        };
        this.pathDefaults = {...this.page.settings.path};

    }

    async render() {
        this.destroy();

        const ok = await this.service.loadPathsList();
        if (!ok)
            return;

        this.element = document.createElement('div');
        this.element.className = 'tab paths';
        this.page.element.append(this.element);

        this.list = document.createElement('div');
        this.list.className = 'paths-list';
        this.element.append(this.list);

        this.listeners = [
            this.settings.on('create-path', (...args) => this.addItem(...args)),
            this.settings.on('update-path', (...args) => this.updateItem(...args)),
            this.settings.on('delete-path', data => this.removeItem(data.prop))
        ];

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

    updateItem(pathKey, pathData, prop, value) {
        const pathItem = this.items[pathKey];
        if (pathItem) {
            const formItem = pathItem.items[prop];

            if (formItem) {
                formItem.setValue(value);
            } else {
                console.log('>>> UPDATE ITEM NOT EXISTS SET VALUE', pathKey, prop, value);
            }
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
        this.listeners?.forEach(fn => fn());
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