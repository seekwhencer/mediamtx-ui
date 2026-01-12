import SettingsStore from "./SettingsStore.js";
import SettingsService from "./SettingsService.js";
import {
    UsersSettings,
    GeneralSettings,
    AuthSettings,
    ApiSettings,
    PPROFSettings,
    MetricsSettings,
    PlaybackSettings,
    RTSPSettings,
    RTMPSettings,
    HLSSettings,
    WebRTCPSettings,
    SRTSettings,
    PathSettings,
    PathsSettings
} from "./Settings/index.js";

export default class Settings {
    constructor(page) {
        this.label = this.constructor.name.toUpperCase();
        this.page = page;
        this.events = this.page.events;

        this.store = new SettingsStore(this);
        this.service = new SettingsService(this);

        this.create();
    }

    async load() {
        await this.service.loadAll();
    }

    create() {
        this.tree = {};
        this.tree.general = new GeneralSettings(this);
        this.tree.users = new UsersSettings(this); // multiple

        this.tree.auth = new AuthSettings(this);
        this.tree.api = new ApiSettings(this);
        this.tree.pprof = new PPROFSettings(this);
        this.tree.metrics = new MetricsSettings(this);
        this.tree.playback = new PlaybackSettings(this);
        this.tree.rtsp = new RTSPSettings(this);
        this.tree.rtmp = new RTMPSettings(this);
        this.tree.hls = new HLSSettings(this);
        this.tree.webrtc = new WebRTCPSettings(this);
        this.tree.srt = new SRTSettings(this);

        this.tree.path = new PathSettings(this);
        this.tree.paths = new PathsSettings(this); // multiple

        this.created = true;
    }

    /**
     * the trigger on create, update and delete
     * the result contains an object:
     *
     * {
     *   "storeKey":"general",
     *   "prop":"logFormat",
     *   "value":"deinemudda"
     * }
     *
     * or
     *
     * {
     *   "storeKey":"paths",
     *   "index":"cam1",
     *   "prop":"recordFormat",
     *   "value":"deinemudda"
     * }
     *
     *
     *
     * @param result
     */

    async onCreate(result) {
        //console.log(this.label, 'ON CREATE', JSON.stringify(result));
        !['path', 'paths'].includes(result.storeKey) ? await this.service.saveGlobal() : null;

        if (result.storeKey === 'paths') {
            //console.log(this.label, 'NEW PATH CREATED', result.prop);
            // do something
        }

        if (result.storekey === 'users') {
            //console.log(this.label, 'NEW USER CREATED', result.value.name);
            // do something
        }
    }

    async onUpdate(result) {
        console.log(this.label, 'ON UPDATE', JSON.stringify(result));

        // save global config (including users)
        !['path', 'paths'].includes(result.storeKey) ? await this.service.saveGlobal() : null;

        // save path defaults
        if (result.storeKey === 'path') {
            await this.service.savePathDefaults();
        }

        // save path update
        if (result.storeKey === 'paths') {
            await this.service.updatePath(result.path.name, result.path);
        }

        // save path update
        if (result.storeKey === 'users') {
            // do something
        }

    }

    async onDelete(result) {
        //console.log(this.label, 'ON DELETE', JSON.stringify(result));
        !['path', 'paths'].includes(result.storeKey) ? await this.service.saveGlobal() : null;

        if (result.storeKey === 'paths') {
            //console.log(this.label, 'PATH DELETED', result.prop);
        }

        if (result.storeKey === 'users') {
            //console.log(this.label, 'USER DELETED', result.prop);
        }
    }

    async onSkip(result) {
        // dont do that
        //console.log(this.label, 'ON SKIP', JSON.stringify(result));
    }


    get users() {
        return this.store.users;
    }

    get general() {
        return this.store.general;
    }

    get auth() {
        return this.store.auth;
    }

    get api() {
        return this.store.api;
    }

    get pprof() {
        return this.store.pprof;
    }

    get metrics() {
        return this.store.metrics;
    }

    get playback() {
        return this.store.playback;
    }

    get rtsp() {
        return this.store.rtsp;
    }

    get rtmp() {
        return this.store.rtmp;
    }

    get hls() {
        return this.store.hls;
    }

    get webrtc() {
        return this.store.webrtc;
    }

    get srt() {
        return this.store.srt;
    }

    get path() {
        return this.store.path;
    }

    get paths() {
        return this.store.paths;
    }

    /**
     * SETTER
     * @param val
     */

    set users(val) {
        this.store.users = val;
    }

    set general(val) {
        this.store.general = val;
    }

    set auth(val) {
        this.store.auth = val;
    }

    set api(val) {
        this.store.api = val;
    }

    set pprof(val) {
        this.store.pprof = val;
    }

    set metrics(val) {
        this.store.metrics = val;
    }

    set playback(val) {
        this.store.playback = val;
    }

    set rtsp(val) {
        this.store.rtsp = val;
    }

    set rtmp(val) {
        this.store.rtmp = val;
    }

    set hls(val) {
        this.store.hls = val;
    }

    set webrtc(val) {
        this.store.webrtc = val;
    }

    set srt(val) {
        this.store.srt = val;
    }

    set path(val) {
        this.store.path = val;
    }

    set paths(val) {
        this.store.paths = val;
    }

}
