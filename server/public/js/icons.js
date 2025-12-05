import EventEmitter from "./event_emitter.js";

export default class Icons extends EventEmitter {
    constructor() {
        super();

        this.basePath = '/images/icons/';
        this.table = [
            {name: 'armchair'},
            {name: 'settings'},
            {name: 'layers-2'},
            {name: 'shrink'},
            {name: 'expand'},
            {name: 'play'},
            {name: 'circle'},
            {name: 'chart-no-axes-combined'},
            {name: 'user'},
            {name: 'user-minus'},
            {name: 'user-plus'},
        ];
    }

    async load() {
        await this.loadSVGs();
        this.emit('loaded');
    }

    async loadSVGs() {
        this.svg = {};

        for (const item of this.table) {
            const url = `${this.basePath}${item.name}.svg`;

            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(res.status);

                const text = await res.text();
                this.svg[item.name] = text; // roh als SVG-String
            } catch (err) {
                console.error('Fehler beim Laden von', url, err);
                this.svg[item.name] = null;
            }
        }
    }
}