import Tab from "./tab.js";
import Video from "../video.js";
import StreamRow from "../Components/Streams/stream.js";
import PathGroups from "./path_groups.js";

export default class StreamsTab extends Tab {
    constructor(page) {
        super(page);
        this.groups = PathGroups;
    }

    render() {
        if (this.element)
            this.destroy();

        this.element = document.createElement("div");
        this.element.className = "tab paths";
        this.page.element.append(this.element);

        this.renderRows();
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
        this.addButton.onclick = () => this.add();
        this.element.append(this.addButton);

        /*this.listeners ? this.listeners.forEach(eject => eject()) : null;
        this.listeners = [
            this.settings.on('create', (key, path) => this.updateItem(key, path)),
            this.settings.on('update', (key, path) => this.updateItem(key, path))
        ];*/
    }

    renderRow(path) {
        this.items[path] = new StreamRow(path, this);
        return this.items[path].element;
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

    add() {
        this.settings[this.settings.length] = {};
        this.render();
    }

    updateItem(path) {
        if (!this.items[path])
            return;

        this.render(); // sorry
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