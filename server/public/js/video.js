export default class Video {
    constructor(stream) {
        this.label = this.constructor.name.toUpperCase();
        this.debug = false;
        this.stream = stream;
        this.name = this.stream.data.confName;
        this.hls = null;
    }

    render() {
        this.element = document.createElement('video');
        this.element.className = 'cam';
        this.element.id = this.name;

        this.element.autoplay = true;
        this.element.muted = true;
        this.element.setAttribute('muted', '');   // Firefox
        this.element.playsInline = true;
        this.element.setAttribute('playsinline', '');

        this.element.addEventListener('click', () => this.toggle());
        return this.element;
    }

    init() {
        if (this.hls) return;

        this.hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            maxBufferLength: 10,
            //liveSyncDuration: 3,
            //liveMaxLatencyDuration: 6,
            //maxLiveSyncPlaybackRate: 1.0
        });

        this.hls.attachMedia(this.element);

        this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            this.hls.loadSource(this.url);
        });

        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            this.element.play().catch(() => {
            });
        });

        // Retry-Handler bei Netzwerk-Fehlern
        this.hls.on(Hls.Events.ERROR, (event, data) => {
            this.debug ? console.log(this.label, `${this.name} HLS ERROR:`, data) : null;

            if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                this.debug ? console.log(this.label, `${this.name} NETWORK_ERROR -> retrying in 1s`) : null;
                setTimeout(() => {
                    this.hls.loadSource(this.url);
                    this.hls.startLoad();
                }, 1000);
            }

            if (data.fatal && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                this.debug ? console.log(this.label, `${this.name} MEDIA_ERROR -> recover media error`) : null;
                this.hls.recoverMediaError();
            }
        });
    }


    play() {
        this.element.play();
    }

    pause() {
        this.element.pause();
    }

    toggle() {
        this.element.paused ? this.element.play() : this.element.pause();
    }

    destroy() {
        this.pause();

        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }

        this.element.remove();
    }

    get url() {
        const url = new URL(window.location.href);
        //@todo check if the hlsAddress starts with :8888 for example
        return `${url.protocol}//${url.hostname}${this.stream.tab.settings.hls.hlsAddress}/${this.name}/index.m3u8`;
    }

    set url(val) {
        ///
    }
}
