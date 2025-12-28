import EventEmitter from "./event_emitter.js";

import Icons from './icons.js'
import Settings from "./settings.js";
import Help from "./help.js";
import Auth from "./auth.js";

import TabNavigation from "./tab_navigation.js";
import * as Tabs from "./Tabs/index.js";

import LoginComponent from "./Components/Page/login.js";


export default class Page {
    constructor() {
        this.events = window._EVENTS = new EventEmitter();
        this.icons = new Icons();
        this.help = new Help(this);
        this.auth = new Auth(this);

        this.loginComponent = new LoginComponent(this);
        this.tabNavigation = new TabNavigation(this);

        this.tabs = {
            overview: new Tabs.OverviewTab(this),
            sources : new Tabs.SourcesTab(this),
            server: new Tabs.ServerTab(this),
            path: new Tabs.PathDefaultsTab(this),
            users: new Tabs.UsersTab(this),
            streams : new Tabs.StreamsTab(this)
        };
    }

    async create() {
        this.destroy();
        await this.icons.load();
        await this.auth.getCsrfToken();
        await this.auth.getStatus();

        //await this.auth.login();
        //await this.auth.logout();

        // if not logged in, show login page
        if (!this.auth.isAuthenticated) {
            await this.loginComponent.render();
            return;
        }

        // if logged in, load settings and render page
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

    destroy(){
        if (this.settings) {
            this.settings.destroy();
            delete this.settings;
        }
    }

    on(event, callback) {
        return this.events.on(event, callback);
    }

    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }
}