import EventEmitter from "./event_emitter.js";

import Icons from './icons.js'
import Settings from "./settings.js";
import TabNavigation from "./tab_navigation.js";
import OverviewTab from "./Tabs/overview.js";
import PathDefaultsTab from "./Tabs/path.js";
import ServerTab from "./Tabs/server.js";


export default class Page extends EventEmitter {
    constructor() {
        super();
        this.tabNavigation = new TabNavigation(this);

        this.tabs = {
            overview: new OverviewTab(this),
            server: new ServerTab(this),
            path: new PathDefaultsTab(this)
            //sources : new Sources(this),
            //streams : new Streams(this)
        };

        // settings
        this.settings = new Settings(this);
        this.settings.on('created', async () => {
            console.log(this.label, 'CREATED GLOBAL CONFIG', this.settings.globalConfig);
            await this.settings.setGlobalConfig();
            await this.settings.setPathDefaultsConfig();
            await this.settings.setPathConfig('cam1');
            await this.render();
        });

        // testing: change a config value and save it instantly (send it to the server
        setTimeout(() => this.settings.general.logLevel = 'debug', 2000);
        setTimeout(() => this.settings.general.logLevel = 'info', 4000);
        setTimeout(() => console.log(Object.keys(this.settings.users)), 6000);

        // render tab on tab select
        this.on('tab', tab => this.showTab(tab));

    }

    async render() {
        this.icons = new Icons();
        await this.icons.load();

        this.element = document.createElement("div");
        this.element.className = 'page';
        document.querySelector('body').append(this.element);

        this.tabNavigation.render();
        //this.tabs.overview.render();
    }

    showTab(tab) {
        this.destroyTabs();
        this.tabs[tab.slug] ? this.tabs[tab.slug].render() : null
    }

    destroyTabs() {
        Object.keys(this.tabs).forEach(tab => this.tabs[tab].destroy());
    }
}