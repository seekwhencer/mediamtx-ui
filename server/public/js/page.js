import EventEmitter from "./event_emitter.js";
import FetchManager from "./fetch_manager.js";

import Icons from './icons.js'
import Settings from "./settings.js";
import Help from "./help.js";
import Auth from "./auth.js";

import TabNavigation from "./Components/Page/tab_navigation.js";
import * as Tabs from "./Tabs/index.js";

import LoginComponent from "./Components/Page/login.js";

export default class Page {
    constructor() {
        this.label = this.constructor.name.toUpperCase();
        this.events = window._EVENTS = new EventEmitter();
        this.fm = new FetchManager({
            onUnauthorized() {
                window.location.href = "/"; // redirect to home on 401
            },
        });

        this.icons = new Icons(this);
        this.help = new Help(this);
        this.auth = new Auth(this);
    }

    async create() {
        this.destroy();

        await this.help.load();
        await this.icons.load();
        await this.auth.getCsrfToken();
        await this.auth.getStatus();

        // if not logged in, show login page
        if (!this.auth.isAuthenticated) {
            console.log(this.label, 'IS NOT AUTHENTICATED');
            !this.loginComponent ? this.loginComponent = new LoginComponent(this) : null;
            await this.loginComponent.render();
            return;
        }

        !this.tabNavigation ? this.tabNavigation = new TabNavigation(this) : null;

        this.tabs = {
            overview: new Tabs.OverviewTab(this),
            sources : new Tabs.SourcesTab(this),
            server: new Tabs.ServerTab(this),
            path: new Tabs.PathDefaultsTab(this),
            users: new Tabs.UsersTab(this),
            streams : new Tabs.StreamsTab(this)
        };

        this.settings = new Settings(this);
        await this.settings.load();
        await this.render();

        // testing: change a config value and save it instantly (send it to the server
        //setTimeout(() => this.settings.general.logLevel = 'debug', 2000);
        //setTimeout(() => this.settings.general.logLevel = 'info', 4000);
    }

    async render() {
        this.element = document.createElement("div");
        this.element.className = 'page';
        document.querySelector('body').append(this.element);

        this.tabNavigation.render();
    }

    showTab(tab) {
        this.tab = this.tabs[tab.slug];

        if (!this.tab)
            return;

        this.destroyTabs();
        this.tab.render();
    }

    destroyTabs() {
        Object.keys(this.tabs).forEach(tab => this.tabs[tab].destroy());
    }

    destroyGroup() {

    }

    async eject() {
        this.auth.isAuthenticated = false;
        await this.create();
    }

    destroy(){
        if (this.settings) {
            this.settings.destroy();
            delete this.settings;
        }
        this.tabNavigation ? this.tabNavigation.destroy() : null;
        this.element ? this.element.remove() : null;
    }

    on(event, callback) {
        return this.events.on(event, callback);
    }

    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }
}