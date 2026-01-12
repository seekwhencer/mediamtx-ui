export default class Tab {
    constructor(page) {
        this.label = this.constructor.name.toUpperCase();
        this.page = page;
    }

    on(event, callback) {
        return this.events.on(event, callback);
    }

    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }

    destroy() {
        this.element ? this.element.remove() : null;
        this.listeners ? this.listeners.forEach(eject => eject()) : null;
    }

    get events() {
        return this.page.events;
    }

    set events(val) {
        // do nothing
    }

    get fm() {
        return this.page.fm;
    }

    set fm(val) {
        // do nothing
    }

    get settings() {
        return this.page.settings;
    }

    set settings(val) {
        // do nothing
    }

}