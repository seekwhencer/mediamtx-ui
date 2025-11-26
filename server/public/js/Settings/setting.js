import EventEmitter from "../event_emitter.js";
import DataProxy from "../data_proxy.js";

export default class Setting extends EventEmitter {
    constructor(settings, target = {}) {
        super();

        this.settings = settings;
        this.data = new DataProxy(target, this, false);

        this.data.on('create', (prop, value) => this.emit('create', prop, value));
        this.data.on('update', (prop, value) => this.emit('update', prop, value));
        this.data.on('delete', (prop, value) => this.emit('delete', prop, value));

        this.on('create', (prop, value) => {
            this.debug ? console.log(this.label, 'CREATED +', prop.padEnd(30, '.'), (this.getType(value)).padEnd(10, '.'), value) : null;
            this.settings.emit('create', prop, value);
        });

        this.on('update', (prop, value) => {
            this.debug ? console.log(this.label, 'UPDATED >', this.constructor.name.padEnd(20, '.'), prop.padEnd(30, '.'), (this.getType(value)).padEnd(10, '.'), value) : null;
            this.settings.emit('update', prop, value);
        });

        this.on('delete', (prop) => {
            this.debug ? console.log(this.label, 'DELETED !', this.constructor.name.padEnd(20, '.'), prop.padEnd(30, '.')) : null;
            this.settings.emit('delete', prop);
        });
    }

    setFields() {
        this.fields.forEach(field => this.data[field] = this.source[field]);
    }

    getType(value) {
        return Array.isArray(value) ? 'array' : typeof value;
    }

}