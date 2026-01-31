import EventEmitter from "./event_emitter.js";

export default class DataProxy {
    constructor(target, parent, lift = true) {

        this.label = this.constructor.name.toUpperCase();
        this.parent = parent;
        this.events = this.parent.events || new EventEmitter();
        this.target = target || {};
        this.lift = lift;

        this.data = new Proxy(this.target, {
            get: (target, prop, receiver) => {
                if (prop === 'keys' && !Array.isArray(this.target)) {
                    return () => Object.keys(target);
                }
                if (prop === 'length' && !Array.isArray(this.target)) {
                    return Object.keys(target).length;
                }
                /*if (prop === '_') {
                    return this; // this is the secret door to the class
                }*/
                if (prop === 'on') {
                    return (event, callback) => this.on(event, callback);
                }
                if (prop === 'emit') {
                    return (event, ...args) => this.emit(event, ...args);
                }
                if (prop === 'target') {
                    return this.target;
                }

                return target[prop];
            },

            set: (target, prop, value) => {
                value = this.transformDatatype(target[prop], value);

                const existing = target[prop] !== undefined;
                const action = existing ? 'update' : 'create';

                if (action === 'update')
                    if (JSON.stringify(target[prop]) === JSON.stringify(value))
                        return true;

                target[prop] = value;

                // set parent's prop
                this.lift ? this.parent[prop] = target[prop] : null; // okay party people, it's prop agnostic (and destroying)

                // trigger parent action()
                this.parent.action ? this.parent.action(action, prop, value) : null;

                return true;
            },

            deleteProperty: (target, prop, receiver) => {
                delete target[prop];

                // delete parent's prop
                this.lift ? delete this.parent[prop] : null;

                // trigger parent action()
                this.parent.action ? this.parent.action('delete', prop) : null;
                return true;
            },
        });

        return this.data;
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

        if (Array.isArray(value))
            return value;

        return value;
    }

    on(event, callback) {
        return this.events.on(event, callback);
    }

    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }

    getType(value) {
        return Array.isArray(value) ? 'array' : typeof value;
    }
}