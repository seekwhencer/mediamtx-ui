import EventEmitter from "./event_emitter.js";

export default class DataProxy extends EventEmitter {
    constructor(target, parent, lift = true) {
        super();

        this.target = target;
        this.parent = parent;
        this.lift = lift;

        return new Proxy(this.target, {
            get: (target, prop, receiver) => {
                if (prop === 'keys' && !Array.isArray(this.target)) {
                    return () => Object.keys(target);
                }
                if (prop === 'length' && !Array.isArray(this.target)) {
                    return Object.keys(target).length;
                }
                if (prop === '_') {
                    return this; // this is the secret door to the class
                }
                if (prop === 'on') {
                    return (event, callback) => this.on(event, callback);
                }
                if (prop === 'emit') {
                    return (event, ...args) => this.emit(event, ...args);
                }
                if (prop === 'target') {
                    return this.target;
                }
                if (prop === 'enum') {
                    return () => {
                        return {};
                    };
                }

                return target[prop];
            },

            set: (target, prop, value) => {
                value = this.transformDatatype(target[prop], value);

                if (target[prop] === value)
                    return true;

                const existing = !!target[prop];
                const action = existing ? 'update' : 'create';

                target[prop] = value;

                this.lift ? this.parent[prop] = target[prop] : null; // okay party people, it's prop agnostic (and destroying)

                this.parent.emit && this.lift ? this.parent.emit(action, prop, value) : null;
                this.parent.emit && this.lift ? this.parent.emit(prop, value, action) : null;

                this.emit(action, prop, value);
                this.emit(prop, value, action);

                return true;
            },

            deleteProperty: (target, prop, receiver) => {
                delete target[prop];
                this.lift ? delete this.parent[prop] : null;
                this.parent.emit && this.lift ? this.parent.emit('delete', prop) : null;
                this.parent.emit && this.lift ? this.parent.emit(prop, 'delete') : null;

                this.emit('delete', prop);
                this.emit(prop, 'delete');

                return true;
            },
        });
    }

    transformDatatype(field, value) {
        const type = typeof field;

        //console.log('####', field, type, typeof value);

        if (type === 'string')
            return value;

        if (type === 'number')
            return parseInt(value);

        if (type === 'boolean')
            return value === 'true';

        if (type === 'function')
            return value;

        if (Array.isArray(field))
            return field;

        return value;
    }

    getType(value) {
        return Array.isArray(value) ? 'array' : typeof value;
    }
}