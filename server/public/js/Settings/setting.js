import EventEmitter from "../event_emitter.js";
import DataProxy from "../data_proxy.js";

export default class Setting extends EventEmitter {
    constructor(page) {
        super();
        this.page = page;
        this.data = new DataProxy({}, this, false);

        //this.data.on('create', (prop, value) => this.emit('create', prop, value));
        //this.data.on('update', (prop, value) => this.emit('update', prop, value));
        //this.data.on('delete', (prop, value) => this.emit('delete', prop, value));

        this.on('create', (prop, value) => {
            console.log('>>> CREATED +', this.constructor.name.padEnd(20, '.'), prop.padEnd(30, '.'), (this.getType(value)).padEnd(10, '.'), value);
        });

        this.on('update', (prop, value) => {
            console.log('>>> UPDATED >', this.constructor.name.padEnd(20, '.'), prop.padEnd(30, '.'), (this.getType(value)).padEnd(10, '.'), value);
        });

        this.on('delete', (prop) => {
            console.log('>>> DELETED !', this.constructor.name.padEnd(20, '.'), prop.padEnd(30, '.'));
        });
    }

    setFields() {
        this.fields.forEach(field => this.data[field] = this.source[field]);
    }

    getType(value) {
        return Array.isArray(value) ? 'array' : typeof value;
    }

}