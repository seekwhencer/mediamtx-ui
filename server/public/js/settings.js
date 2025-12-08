/**
 * @TODO
 * - error message
 * -
 *
 */
import {
    GeneralSettings,
    AuthSettings,
    ApiSettings,
    PPROFSettings,
    PlaybackSettings,
    RTSPSettings,
    RTMPSettings,
    HLSSettings,
    WebRTCPSettings,
    SRTSettings,
    PathSettings,
    PathsSettings,
    UsersSettings
} from "./Settings/index.js"

export default class Settings {
    constructor(page) {
        this.debug = false;
        this.label = this.constructor.name.toUpperCase();
        this.page = page;
        this.events = this.page.events;

        this.baseUrl = '/mediamtx/config';
        this.globalSettingsUrl = `${this.baseUrl}/global/get`;
        this.pathDefaultsUrl = `${this.baseUrl}/pathdefaults/get`;
        this.pathsListUrl = `${this.baseUrl}/paths/list`;

        this.saveglobalSettingsUrl = `${this.baseUrl}/global/patch`;
        this.savePathDefaultsUrl = `${this.baseUrl}/pathdefaults/patch`;

        this.pathBaseUrl = `${this.baseUrl}/paths`;
        this.addPathUrl = `${this.pathBaseUrl}/add`;
        this.updatePathUrl = `${this.pathBaseUrl}/patch`;
        this.replacePathUrl = `${this.pathBaseUrl}/replace`;
        this.deletePathUrl = `${this.pathBaseUrl}/delete`;

        this.created = false;

        this.listeners = [
            this.on('loaded-global', () => this.created ? this.mergeGlobalDiffProps() : null),
            this.on('loaded-path-defaults', () => this.created ? this.mergePathDiffProps() : null),
            this.on('loaded-paths-list', () => this.created ? this.mergePathsList() : null),
            this.on('loaded-users', () => this.created ? this.mergeUsersList() : null)
        ];
    }

    async load() {
        this.config = {
            global: {},
            path: {},
            paths: {},
            user: {},
            users: {},
        };

        await this.loadGlobal();
        await this.loadPathDefaults();
        await this.loadPathsList();

        if (!this.created) {
            await this.create();
        } else {
            await this.update();
        }
        console.log('LOADED CONFIG: ', this.config);
    }

    async loadGlobal() {
        const res = await fetch(this.globalSettingsUrl);
        const text = await res.text();
        const data = await JSON.parse(text);

        // users
        if (data.authInternalUsers) {
            data.authInternalUsers.forEach((user, i) => this.config.users[i] = user);
            delete data.authInternalUsers;
            this.emit('loaded-users');
        } else {
            console.log(this.label, 'ERROR:', text);
        }
        // global
        Object.keys(data).forEach(key => this.config.global[key] = data[key]);
        this.emit('loaded-global');
    }

    async loadPathDefaults() {
        const res = await fetch(this.pathDefaultsUrl);
        const text = await res.text();
        const data = await JSON.parse(text);
        Object.keys(data).forEach(key => this.config.path[key] = data[key]);
        this.emit('loaded-path-defaults');
    }

    async loadPathsList() {
        const res = await fetch(this.pathsListUrl);
        const text = await res.text();
        const data = await JSON.parse(text);
        data.items.forEach((item, i) => this.config.paths[item.name] = item);
        this.emit('loaded-paths-list');
    }

    async create() {
        this.general = new GeneralSettings(this);
        this.auth = new AuthSettings(this);
        this.api = new ApiSettings(this);
        this.pprof = new PPROFSettings(this);
        this.playback = new PlaybackSettings(this);
        this.rtsp = new RTSPSettings(this);
        this.rtmp = new RTMPSettings(this);
        this.hls = new HLSSettings(this);
        this.webrtc = new WebRTCPSettings(this);
        this.srt = new SRTSettings(this);

        this.path = new PathSettings(this);
        this.paths = new PathsSettings(this);
        this.users = new UsersSettings(this);

        this.created = true;
    }

    async update() {
        console.log(this.label, 'UPDATE AFTER LOADING CONFIG');
    }

    // complete
    getConfig() {
        return {
            ...this.general,
            ...this.auth,
            authInternalUsers: this.users,
            ...this.api,
            ...this.pprof,
            ...this.playback,
            ...this.rtsp,
            ...this.rtmp,
            ...this.hls,
            ...this.webrtc,
            ...this.srt,
            pathDefaults: {...this.path},
            paths: {...this.paths},
        }
    }

    async setGlobalConfig() {
        const res = await fetch(this.saveglobalSettingsUrl, {
            method: 'PATCH',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(this.globalConfig)
        });

        if (res.ok) {
            console.log(this.label, 'SAVE GLOBAL CONFIG OK');
        } else {
            console.log(this.label, 'SAVE GLOBAL CONFIG ERROR', res.error);
            await this.loadGlobal();
        }
    }

    async setPathDefaultsConfig() {
        const res = await fetch(this.savePathDefaultsUrl, {
            method: 'PATCH',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(this.path)
        });

        if (res.ok) {
            console.log(this.label, 'SAVE PATH DEFAULTS CONFIG OK');
        } else {
            console.log(this.label, 'SAVE PATH DEFAULTS CONFIG ERROR', res.error);
            await this.loadPathDefaults();
        }
    }

    async setPathsConfig() {

    }

    mergeGlobalDiffProps() {
        console.log(this.label, 'MERGE GLOBAL DIFF PROPS');
        ['general', 'auth', 'api', 'pprof', 'playback', 'rtsp', 'rtmp', 'hls', 'webrtc', 'srt'].forEach(c => {
            const to = this[c];
            for (const k of to.keys()) {
                if (JSON.stringify(this.config.global[k]) !== JSON.stringify(to[k])) {
                    to[k] = this.config.global[k];
                    this.debug ? console.log(this.label, '>>>', c, k, to[k]) : null;
                }
            }
        });
    }

    mergePathDiffProps() {
        console.log(this.label, 'MERGE PATH DEFAULTS DIFF PROPS');
        const to = this.path;
        for (const k of to.keys()) {
            if (JSON.stringify(this.config.path[k]) !== JSON.stringify(to[k])) {
                to[k] = this.config.path[k];
                this.debug ? console.log(this.label, '>>>', k, to[k]) : null;
            }
        }
    }

    mergePathsList() {
        console.log(this.label, 'MERGE PATHS LIST DIFF PROPS');
        const to = this.paths;
        for (const k of to.keys()) {
            if (JSON.stringify(this.config.paths[k]) !== JSON.stringify(to[k])) {
                to[k] = this.config.paths[k];
                this.debug ? console.log(this.label, '>>>', k, to[k]) : null;
            }
        }
    }

    mergeUsersList() {
        console.log(this.label, 'MERGE USERS LIST DIFF PROPS');
        const to = this.users;
        for (const k of to.keys()) {
            if (JSON.stringify(this.config.users[k]) !== JSON.stringify(to[k])) {
                to[k] = this.config.users[k];
                this.debug ? console.log(this.label, '>>>', k, to[k]) : null;
            }
        }
    }

    on(event, callback) {
        return this.events.on(event, callback);
    }

    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }

    destroy() {
        this.created = false;
        //...
        this.listeners.forEach(eject => eject());
    }

    action(action, prop, value) {
        if (!this.debug)
            return;

        this.debug ? console.log(this.label, 'ACTION', action, prop, value) : null;
    }

    async setPathConfig(pathName) {
        const pathConfig = this.paths[pathName];
        const url = `${this.updatePathUrl}/${pathName}`;
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(pathConfig)
        });

        if (res.ok) {
            console.log(this.label, `SAVE PATH (${pathName}) CONFIG OK`);
        } else {
            console.log(this.label, `SAVE PATH (${pathName}) CONFIG ERROR`, res.error);
        }
    }

    get globalConfig() {
        const config = {
            ...this.general,
            ...this.auth,
            ...this.api,
            ...this.pprof,
            ...this.playback,
            ...this.rtsp,
            ...this.rtmp,
            ...this.hls,
            ...this.webrtc,
            ...this.srt
        };

        config.authInternalUsers = this.users.target;
        return config;
    }

    set globalConfig(value) {
        // do nothing
    }
}
