import DataProxy from "../../data_proxy.js";
import Video from "../../video.js";

export default class StreamItem {
    constructor(data, tab) {
        this.label = this.constructor.name.toUpperCase();
        this.tab = tab;
        this.page = this.tab.page;
        this.data = new DataProxy(data, this, false);
    }

    render() {
        if (this.element)
            this.destroy();

        const label = (textContent) => {
            const element = document.createElement("div");
            element.className = 'stream-label';
            element.textContent = textContent;
            return element;
        };

        const el = document.createElement("div");
        el.className = 'stream-item';

        //--- name
        const nameEl = document.createElement("div");
        nameEl.className = 'stream-name';
        nameEl.textContent = this.data.confName;
        el.append(nameEl);

        //--- type
        this.typeEl = document.createElement("div");
        this.typeEl.className = 'stream-type';
        this.typeEl.textContent = `${splitCamelCase(this.data.source.type).toUpperCase()} - ${this.data.tracks.join(', ')}`;
        el.append(this.typeEl);

        //--- viewers
        const viewersEl = document.createElement("div");
        viewersEl.className = 'stream-viewers';

        const labelViewersEl = label('Viewers');
        viewersEl.append(labelViewersEl);

        this.viewersEl = document.createElement("div");
        this.viewersEl.className = 'stream-viewers-number';
        this.viewersEl.textContent = this.data.readers.length;
        viewersEl.append(this.viewersEl);
        el.append(viewersEl);


        this.video = new Video(this);
        el.append(this.video.render());


        return this.element = el;
    }

    update(data) {
        Object.keys(data).forEach((key) => this.data[key] = data[key]);
    }

    action(action, prop, value) {
        if (action === 'update') {
            if (prop === 'readers')
                this.viewers = value.length;

            if (prop === 'bytesReceived')
                this.bytesReceived = value;

            if (prop === 'bytesSent')
                this.bytesSent = value;

            if (prop === 'type' || prop === 'tracks') {
                this.data.source && this.data.tracks.length > 0 ? this.typeEl.textContent = `${splitCamelCase(this.data.source.type).toUpperCase()} - ${this.data.tracks.join(', ')}` : null;
            }
        }

        //this.viewersEl.textContent = value.length;
        //console.log(this.label, this.data.confName, action, prop, value);


        //console.log(this.label, this.data.confName, action, prop, value);
    }

    destroy() {

    }

    get viewers() {
        return this._viewers;
    }

    set viewers(value) {
        this._viewers = value;
        this.viewersEl.textContent = this.viewers;
    }

    get bytesReceived() {
        return this._bytesReceived;
    }

    set bytesReceived(value) {
        this._bytesReceived = value;
        //this.viewersEl.textContent = this.bytesReceived;
    }

    get bytesSent() {
        return this._bytesSent;
    }

    set bytesSent(value) {
        this._bytesSent = value;
        //this.viewersEl.textContent = this.bytesSent;
    }

}

const splitCamelCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}