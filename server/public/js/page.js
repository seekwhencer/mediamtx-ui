import EventEmitter from "./event_emitter.js";

import Settings from "./settings.js";
import Overview from "./overview.js";
import Streams from "./streams.js";
import Sources from "./sources.js";


export default class Page extends EventEmitter {
    constructor() {
        super();
        this.element = document.querySelector('#page');

        // settings
        this.settings = new Settings(this);

        setTimeout(() => this.settings.general.logLevel = 'debug', 2000);
        setTimeout(() => this.settings.general.logLevel = 'info', 4000);

        this.settings.on('created', () => {
            console.log(this.constructor.name, this.settings.getConfig());
            this.render();
        });

        this.overview = new Overview(this);
        this.sources = new Sources(this);
        this.streams = new Streams(this);

    }

    render() {
        this.streams.render();
    }
}