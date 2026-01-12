import Tab from './tab.js';
import StreamItem from '../Components/Streams/StreamItem.js';
import StreamsService from '../Components/Streams/StreamService.js';
//import StreamsStore from '../Components/Streams/StreamStore.js';

export default class StreamsTab extends Tab {
    constructor(page) {
        super(page);
        this.items = {};

        this.service = new StreamsService(this);
        //this.store = new StreamsStore(this);

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

        const ok = await this.service.list();
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
        console.log('>>> RENDER PATH LIST', this.store.paths);
        Object.keys(this.store.paths).forEach(pathKey => this.addItem(pathKey, this.store.paths[pathKey]))
    }

    renderAddButton() {
        const btn = document.createElement('button');
        btn.className = 'add';
        btn.innerHTML = `${this.page.icons.svg['list-plus']} Add path`;
        btn.onclick = () => this.addNewPath();
        this.element.append(btn);
    }

    addItem(name, data) {
        if (this.items[name]) return;

        const item = new StreamItem({
                name: name,
                data: data,
                schema: this.pathSchema,
                tab: this,
                onUpdate: (n, d) => this.updatePath(n, d),
                onDelete: n => this.deletePath(n)
            }
        );

        this.items[name] = item;
        this.list.append(item.element);
    }

    updateItem(name, data) {
        const item = this.items[name];
        if (item) {
            Object.keys(data).forEach(k => item.data[k] = data[k]);
            item.renderGroups?.(); // optional, falls Gruppen dynamisch sind
        }
    }

    removeItem(name) {
        const item = this.items[name];
        if (item) {
            item.destroy();
            delete this.items[name];
        }
    }

    async addNewPath() {
        const data = {...this.page.settings.path, name: 'new'};
        await this.service.add(data);
        await this.store.sync();
    }

    async updatePath(name, data) {
        await this.service.update(name, data);
        await this.store.sync();
    }

    async deletePath(name) {
        await this.service.delete(name);
        await this.store.sync();
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
}