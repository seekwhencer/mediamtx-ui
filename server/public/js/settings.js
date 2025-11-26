import EventEmitter from "./event_emitter.js";
import DataProxy from "./data_proxy.js";
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

export default class Settings extends EventEmitter {
    constructor(page) {
        super();
        this.page = page;

        this.baseUrl = '/mediamtx/config';
        this.generalSettingsUrl = `${this.baseUrl}/global/get`;
        this.pathDefaultsUrl = `${this.baseUrl}/pathdefaults/get`;
        this.pathsListUrl = `${this.baseUrl}/paths/list`;

        this.saveGeneralSettingsUrl = `${this.baseUrl}/global/patch`;
        this.savePathDefaultsUrl = `${this.baseUrl}/pathdefaults/patch`;

        this.pathBaseUrl = `${this.baseUrl}/paths`;
        this.addPathUrl = `${this.pathBaseUrl}/add`;
        this.updatePathUrl = `${this.pathBaseUrl}/patch`;
        this.replacePathUrl = `${this.pathBaseUrl}/replace`;
        this.deletePathUrl = `${this.pathBaseUrl}/delete`;

        this.config = {
            general: new DataProxy({}, this, false),
            path: new DataProxy({}, this, false),
            paths: new DataProxy({}, this, false),
            user: new DataProxy({}, this, false),
            users: new DataProxy([], this, false),
        };

        //
        this.on('loaded', () => this.create());

        //
        this.on('loaded-general', () => console.log(this.label, 'LOADED GENERAL'));
        this.on('loaded-users', () => console.log(this.label, 'LOADED USERS', this.config.users.length, this.config.users));
        this.on('loaded-paths-list', () => console.log(this.label, 'LOADED PATHS LIST', this.config.paths.length, this.config.paths));

        // load config from mediamtx server
        this.load();
    }

    async load() {
        await this.loadGeneral();
        await this.loadPathDefaults();
        await this.loadPathsList();
        this.emit('loaded');
    }

    async loadGeneral() {
        const res = await fetch(this.generalSettingsUrl);
        const text = await res.text();
        const data = await JSON.parse(text);

        // users
        data.authInternalUsers.forEach((user, i) => this.config.users[i] = user);
        delete data.authInternalUsers;
        this.emit('loaded-users');

        // general
        Object.keys(data).forEach(key => this.config.general[key] = data[key]);
        this.emit('loaded-general');
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

    create() {
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

        this.emit('created');
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
        const res = await fetch(this.saveGeneralSettingsUrl, {
            method: 'PATCH',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(this.globalConfig)
        });

        if (res.ok) {
            console.log(this.label, 'SET GLOBAL CONFIG OK');
        } else {
            console.log(this.label, 'SET CONFIG ERROR', res.error);
        }
    }

    async setPathDefaultsConfig() {
        // to be implemented
    }

    async setPathsConfig() {
        // to be implemented
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
