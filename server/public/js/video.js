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
        //this.element.setAttribute('controls', 'controls');
        this.element.setAttribute('autoplay', 'autoplay');
        this.element.setAttribute('muted', 'muted');
        this.element.className = 'cam';
        this.element.id = this.name;

        this.loaded = false;
        this.streams.element.append(this.element);
        this.element.onclick = e => this.play();

        this.restartInterval = setInterval(() => {
            const v = this.element;
            console.log(this.label, this.name, 'RETRYING');

            if (v.buffered.length !== 1 && v.played.length !== 1)
                this.play();

            if (v.buffered.length === 1 && v.played.length === 1)
                clearInterval(this.restartInterval);

        }, 1000);

    }

    play() {
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(this.url);
            hls.attachMedia(this.element);
        } else {
            this.element.src = this.url;
        }

        this.element.play();
    }
}