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

        this.settings.on('created', async () => {
            console.log(this.label, 'CREATED GLOBAL CONFIG', this.settings.globalConfig);
            await this.settings.setGlobalConfig();
            await this.settings.setPathDefaultsConfig();
            await this.settings.setPathConfig('cam1');

            this.render();
        });

        this.overview = new Overview(this);
        this.sources = new Sources(this);
        this.streams = new Streams(this);

        // testing: change a config value and save it instantly (send it to the server
        setTimeout(() => this.settings.general.logLevel = 'debug', 2000);
        setTimeout(() => this.settings.general.logLevel = 'info', 4000);

    }

    render() {
        this.streams.render();
    }
}