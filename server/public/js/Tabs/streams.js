import Tab from "./tab.js";
import StreamRow from "../Components/Streams/stream.js";
import DataProxy from "../data_proxy.js";

export default class StreamsTab extends Tab {
    constructor(page) {
        super(page);
        this.pollingDelay = 1000;
    }

    async render() {
        if (this.element)
            this.destroy();

        await this.page.settings.loadPathsList();

        // events
        this.listeners = [
            this.settings.on('create', (name, data) => this.addItem(name)),
            this.settings.on('update', (name, data) => this.updateItem(name)),
            this.settings.on('delete', (name) => this.deleteItem(name))
        ];

        this.element = document.createElement("div");
        this.element.className = "tab paths";
        this.page.element.append(this.element);

        this.listElement = document.createElement("div");
        this.listElement.className = "paths-list";
        this.element.append(this.listElement);

        await this.load();

        this.renderRows();
    }

    renderRows() {
        this.items = {}
        this.settings.keys().forEach(path => this.addItem(path));

        this.addButton = document.createElement('button');
        this.addButton.innerHTML = `${this.page.icons.svg['list-plus']} Add path`;
        this.addButton.className = 'add';
        this.addButton.onclick = () => this.add(false);
        this.element.append(this.addButton);
    }

    renderRow(path) {
        this.items[path] = new StreamRow(path, this);
        return this.items[path].element;
    }

    async load() {
        await this.page.settings.loadPathsList();
        this.poll();
    }

    poll() {
        clearInterval(this.cylce);
        this.cylce = setInterval(() => this.page.settings.loadPathsList(), this.pollingDelay);
    }

    replaceRow(path) {

    }

    destroy() {
        this.element ? this.element.remove() : null;
        this.listeners ? this.listeners.forEach(eject => eject()) : null;
    }

    action(action, name, data, prop, value) {
        if (action === 'update')
            this.update(name, data, prop, value);
    }


    addItem(name) {
        const row = this.renderRow(name);
        this.listElement.append(row);
    }

    updateItem(path) {
        if (!this.items[path])
            return;

        const props = this.items[path].items;

        Object.keys(props).forEach(p => {
            const prop = props[p];
            prop.setValue(this.settings[path][p]);
        })

        //this.render(); // sorry
        console.log('>>> UPDATE', props, path);

    }

    deleteItem(name) {
        this.items[name].destroy();
        delete this.items[name];
    }

    async add(data) {
        if (!data)
            data = {
                ...this.page.settings.path.target,
                name: 'new'
            };

        data.source = 'publisher';
        await this.addPath(data);
    }

    async delete(name) {
        await this.deletePath(name);
    }

    async update(name, data, prop, value) {
        if (name !== data.name) { // on renaming
            console.log(this.label, 'RENAMING PATH:', name, data.name);
            // delete the old one
            await this.delete(name);
            // add the with a new name
            await this.add(data);
            this.render();
        } else {
            console.log(this.label, 'PATH UPDATED:', name);
            this.settings[name] = data;
            await this.updatePath(name, data);
        }
    }

    async addPath(data) {
        !data ? data = {} : null;
        const url = `${this.page.settings.addPathUrl}/${data.name}`;

        const res = await this.fm.fetch(url, {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });

        if (res.ok) {
            console.log(this.label, 'ADD PATH CONFIG OK');
        } else {
            console.log(this.label, 'ADD PATH CONFIG ERROR', res.error);
        }
    }

    async updatePath(name, data) {
        const url = `${this.page.settings.replacePathUrl}/${name}`;

        const res = await this.fm.fetch(url, {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });

        if (res.ok) {
            console.log(this.label, 'REPLACE PATH CONFIG OK');
        } else {
            console.log(this.label, 'REPLACE PATH CONFIG ERROR', res.error);
            //this.items[name].groupsElement.replace(this.items[name].renderGroup());
            //this.render();
        }
    }

    async deletePath(name) {
        const url = `${this.page.settings.deletePathUrl}/${name}`;
        const data = this.settings[name];

        const res = await this.fm.fetch(url, {
            method: 'DELETE',
            headers: {"Content-Type": "application/json"}
        });

        if (res.ok) {
            console.log(this.label, 'DELETE PATH CONFIG OK');
        } else {
            console.log(this.label, 'DELETE PATH CONFIG ERROR', res.error);
        }
    }

    get tracks() {
        return this.page.settings.paths;
    }

    set tracks(value) {
    }

    get settings() {
        return this.page.settings.paths;
    }

    set settings(value) {
        // do nothing
    }

}