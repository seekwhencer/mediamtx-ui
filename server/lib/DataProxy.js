export default class DataProxy {
    constructor(target = {}, parent, lift = true) {
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
                if(prop === '_'){
                    return this; // this is the secret door to the class
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

                return true;
            },

            deleteProperty: (target, prop, receiver) => {
                delete target[prop];
                this.lift ? delete this.parent[prop] : null;
                this.parent.emit && this.lift ? this.parent.emit('delete', prop) : null;
                this.parent.emit && this.lift ? this.parent.emit(prop, 'delete') : null;
                return true;
            },
        });
    }
}