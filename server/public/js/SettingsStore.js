export default class SettingsStore {
    constructor(settings) {
        this.settings = settings;
        this.page = this.settings.page;
        this.listeners = new Map();

        this.general = null;
        this.auth = null;
        this.api = null;
        this.pprof = null;
        this.metrics = null;
        this.playback = null;
        this.rtsp = null;
        this.rtmp = null;
        this.hls = null;
        this.webrtc = null;
        this.srt = null;

        this.path = null;
        this.paths = {};
        this.users = [];
    }

    on(event, fn) {
        (this.listeners.get(event) ?? this.listeners.set(event, []).get(event)).push(fn);
        return () => this.listeners.set(
            event,
            this.listeners.get(event).filter(f => f !== fn)
        );
    }

    emit(event, ...args) {
        this.listeners.get(event)?.forEach(fn => fn(...args));
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

        config.authInternalUsers = [];
        for (const k in this.users) {
            config.authInternalUsers[k] = {...this.users[k]};
        }

        return JSON.parse(JSON.stringify(config));
    }

    set globalConfig(val) {
        ///
    }
}
