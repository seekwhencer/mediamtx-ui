import { EventEmitter } from 'node:events';

export default class Events {
    constructor(parent = null, options = {}) {
        this.parent = parent;
        this.options = options;
        this.event = new EventEmitter();

        // Optional: Standardlimit für Listener, falls angegeben
        if (options.maxListeners) {
            this.event.setMaxListeners(options.maxListeners);
        }
    }

    on(event, listener) {
        this.event.on(event, listener);
        return this; // für Chaining
    }

    once(event, listener) {
        this.event.once(event, listener);
        return this;
    }

    off(event, listener) {
        this.event.removeListener(event, listener);
        return this;
    }

    emit(event, ...args) {
        return this.event.emit(event, ...args);
    }

    removeAll(event) {
        this.event.removeAllListeners(event);
        return this;
    }

    listeners(event) {
        return this.event.listeners(event);
    }

    // Optional: Event nach oben an den "parent" weitergeben
    bubble(event, ...args) {
        this.emit(event, ...args);
        if (this.parent?.emit) {
            this.parent.emit(event, ...args);
        }
    }
}
