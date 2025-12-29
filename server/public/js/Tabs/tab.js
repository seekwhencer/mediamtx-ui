export default class Tab {
    constructor(page) {
        this.label = this.constructor.name.toUpperCase();
        this.page = page;
        this.fm = this.page.fm;
        this.events = this.page.events;
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

    get group() {
        return this._group;
    }

    set group(val) {
        this._group = val;
        this.renderGroup();
    }
}