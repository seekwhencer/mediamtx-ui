import Tab from "./tab.js";
import Video from "../video.js";
import StreamRow from "../Components/Streams/stream.js";

export default class StreamsTab extends Tab {
    constructor(page) {
        super(page);
    }

    async render() {
        if (this.element)
            this.destroy();

        await this.page.settings.loadPathsList();

        this.element = document.createElement("div");
        this.element.className = "tab paths";
        this.page.element.append(this.element);

        this.renderRows();

        /*this.listeners ? this.listeners.forEach(eject => eject()) : null;
        this.listeners = [
            this.settings.on('create', (key, path) => this.updateItem(key, path)),
            this.settings.on('update', (key, path) => this.updateItem(key, path))
        ];*/
    }

    renderRows() {
        this.items = {};
        this.settings.keys().forEach((path) => {
            const row = this.renderRow(path);
            this.element.append(row);
        });

        this.addButton = document.createElement('button');
        this.addButton.innerHTML = `${this.page.icons.svg['list-plus']} Add path`;
        this.addButton.className = 'add';
        this.addButton.onclick = () => this.addItem();
        this.element.append(this.addButton);
    }

    renderRow(path) {
        this.items[path] = new StreamRow(path, this);
        return this.items[path].element;
    }

    replaceRow(path) {

    }

    renderTracks() {
        this.videos = {};
        this.tracks.keys().forEach(track => {
            this.videos[track] = new Video(this, this.tracks[track]);
            this.videos[track].render();
        });
    }

    destroy() {
        this.element ? this.element.remove() : null;
        this.listeners ? this.listeners.forEach(eject => eject()) : null;
    }

    action(action, name, data, prop, value) {
        if (action === 'update')
            this.update(name, data, prop, value);
    }


    updateItem(path) {


        if (!this.items[path])
            return;

        this.render(); // sorry
    }

    async addItem() {
        await this.add(false);
        this.render();
    }

    async deleteItem(name) {
        await this.delete(name);
        this.render();
    }

    async add(data) {
        if (!data)
            data = {
                ...this.page.settings.path.target,
                name: 'new'
            };

        data.source = 'publisher';

        this.settings[data.name] = data;
        await this.addPath(data.name);
    }

    async delete(name) {
        delete this.settings[name];
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

    async addPath(name) {
        const url = `${this.page.settings.addPathUrl}/${name}`;
        const data = this.settings[name];

        const res = await fetch(url, {
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

        const res = await fetch(url, {
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

        const res = await fetch(url, {
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