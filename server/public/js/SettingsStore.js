export default class SettingsStore {
    constructor(settings) {
        this.settings = settings;
        this.page = this.settings.page;

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
            ...this.srt,
            ...this.metrics,
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
