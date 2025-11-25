import EventEmitter from "./event_emitter.js";

export default class Video extends EventEmitter {
    constructor(streams, track) {
        super();
        this.streams = streams;
        this.track = track;

        this.name = this.track.name;
        this.url = `http://raspicam:8888/${this.name}/index.m3u8`;
    }

    render() {
        this.element = document.createElement('video');
        this.element.setAttribute('controls', 'controls');
        this.element.setAttribute('autoplay', 'autoplay');
        this.element.setAttribute('muted', 'muted');
        this.element.className = 'cam';
        this.element.id = this.name;

        this.streams.element.append(this.element);

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(this.url);
            hls.attachMedia(this.element);
        } else {
            this.element.src = this.url;
        }
    }
}