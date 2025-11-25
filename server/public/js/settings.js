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

        this.generalSettingsUrl = '/mediamtx/config/global/get';
        this.pathDefaultsUrl = '/mediamtx/config/pathdefaults/get';
        this.pathsListUrl = '/mediamtx/config/paths/list';

        this.config = {
            general: new DataProxy({}, this, false),
            path: new DataProxy({}, this, false),
            paths: new DataProxy({}, this, false),
            user: new DataProxy({}, this, false),
            users: new DataProxy({}, this, false),
        };

        //
        this.on('loaded', () => this.create());

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
        Object.keys(data).forEach(key => this.config.general[key] = data[key]);
        this.emit('loaded-general');

        // users
        this.config.general.authInternalUsers.forEach((user, i) => this.config.users[i] = user);
        delete this.config.general.authInternalUsers;
        this.emit('loaded-users');
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

    getConfig() {
        return {
            ...this.general,
            ...this.auth,
            authInternalUsers: {...this.users},
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

}
