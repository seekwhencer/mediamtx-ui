export default class StreamsStore {
    constructor(parent) {
        this.tab = parent;
        this.service = this.tab.service;
        this.page = this.tab.page;
        this.settings = this.page.settings;
        this.paths = this.settings.paths;
        this.fm = this.page.fm;

        this.pollMs = 1000;
        this.paths = {};
        this.listeners = new Map();
    }

    on(event, fn) {
        (this.listeners.get(event) ?? this.listeners.set(event, []).get(event)).push(fn);
        return () => this.listeners.set(
            event,
            this.listeners.get(event).filter(f => f !== fn)
        );
    }

    emit(event, ...args) {
        this.listeners.get(event)?.forEach(fn => fn(...args));
    }

    async sync() {
        const old = this.paths;
        const data = JSON.parse(JSON.stringify(this.settings.paths));
        const next = structuredClone(data);

        // create + update
        Object.entries(next).forEach(([name, data]) => {
            if (!old[name]) this.emit('create', name, data);
            else if (JSON.stringify(old[name]) !== JSON.stringify(data))
                this.emit('update', name, data);
        });

        // delete
        Object.keys(old).forEach(name => {
            if (!next[name]) this.emit('delete', name);
        });

        this.paths = next;
    }

    start() {
        this.stop();
        this.timer = setInterval(() => this.sync(), this.pollMs);
    }

    stop() {
        clearInterval(this.timer);
    }
}
