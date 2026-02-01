import Toast from "./Toast.js";
import EventEmitter from "./event_emitter.js";
import FetchManager from "./fetch_manager.js";

import Icons from './icons.js'
import Settings from "./Settings.js";
import Help from "./help.js";
import Auth from "./auth.js";

import TabNavigation from "./Components/Page/tab_navigation.js";
import * as Tabs from "./Tabs/index.js";

import LoginComponent from "./Components/Page/login.js";
import LoadingIndicatorComponent from "./Components/Page/Loadingindicator.js";

export default class Page {
    constructor() {
        this.label = this.constructor.name.toUpperCase();
        this.toast = new Toast({
            duration: 5000,
            maxWidth: 400,
            position: 'top-right',
        });
        this.events = window._EVENTS = new EventEmitter();
        this.fm = new FetchManager({
            onUnauthorized() {
                window.location.href = "/"; // redirect to home on 401
            },
        });

        this.icons = new Icons(this);
        this.help = new Help(this);
        this.auth = new Auth(this);
        this.loading = new LoadingIndicatorComponent(this);
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

        this.settings = new Settings(this);
        await this.settings.load();

        this.tabs = {
            overview: Tabs.OverviewTab,
            streams: Tabs.StreamsTab,
            sources: Tabs.SourcesTab,
            server: Tabs.ServerTab,
            path: Tabs.PathDefaultsTab,
            users: Tabs.UsersTab
        };

        await this.render();
    }

    async render() {
        this.element = document.createElement("div");
        this.element.className = 'page';
        document.querySelector('body').append(this.element);

        this.tabNavigation.render();
    }

    async showTab(tab) {
        this.destroyTab();
        const constructor = this.tabs[tab.slug];
        this.tab = new constructor(this);

        if (!this.tab)
            return;

        await this.tab.render();
    }

    async eject() {
        this.auth.isAuthenticated = false;
        await this.create();
    }

    destroyTab() {
        if (!this.tab)
            return;

        this.tab.destroy();
        delete this.tab;
    }

    destroy() {
        console.log('>>> DESTROY PAGE');
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