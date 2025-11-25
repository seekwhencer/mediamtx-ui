import EventEmitter from "./event_emitter.js";

export default class DataProxy extends EventEmitter {
    constructor(target = {}, parent, lift = true) {
        super();

        this.target = target;
        this.parent = parent;
        this.lift = lift;

        return new Proxy(this.target, {
            get: (target, prop, receiver) => {
                if (prop === 'keys') {
                    return () => Object.keys(target);
                }
                if (prop === 'length') {
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

                return target[prop];
            },

            set: (target, prop, value) => {
                if (target[prop] === value)
                    return true;

                const existing = !!target[prop];
                const action = existing ? 'update' : 'create';

                target[prop] = value;
                this.lift ? this.parent[prop] = value : null; // okay party people, it's prop agnostic (and destroying)

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
}