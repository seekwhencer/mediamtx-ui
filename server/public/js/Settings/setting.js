import EventEmitter from "../event_emitter.js";
import DataProxy from "../data_proxy.js";

export default class Setting {
    constructor(settings, target = {}) {
        this.debug = false;
        this.label = this.constructor.name.toUpperCase();
        this.settings = settings;
        this.events = this.settings.events || new EventEmitter();
        this.data = new DataProxy(target, this, false);
        this.options = {};
    }

    action(action, prop, value) {
        action === 'create' ? console.log(this.label, 'CREATED +', prop.padEnd(30, '.'), (this.getType(value)).padEnd(10, '.'), value) : null;
        action === 'update' ? console.log(this.label, 'UPDATED >', this.constructor.name.padEnd(20, '.'), prop.padEnd(30, '.'), (this.getType(value)).padEnd(10, '.'), value) : null;
        action === 'delete' ? console.log(this.label, 'DELETED !', this.constructor.name.padEnd(20, '.'), prop.padEnd(30, '.')) : null;

        this.emit(action, prop, value);
    }

    setFields() {
        this.fields.forEach(field => this.data[field] = this.source[field]);
    }

    getType(value) {
        return Array.isArray(value) ? 'array' : typeof value;
    }

    on(event, callback) {
        return this.events.on(event, callback);
    }

    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }

}