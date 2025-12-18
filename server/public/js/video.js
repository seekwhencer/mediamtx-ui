export default class Video {
    constructor(stream) {
        this.label = this.constructor.name.toUpperCase();

        this.stream = stream;
        this.name = this.stream.data.confName;
        this.url = `http://raspicam:8888/${this.name}/index.m3u8`;
    }

    render() {
        this.element = document.createElement('video');
        //this.element.setAttribute('controls', 'controls');
        this.element.autoplay = true;
        this.element.setAttribute('muted', 'muted');
        this.element.className = 'cam';
        this.element.id = this.name;

        this.loaded = false;
        this.element.onclick = e => this.play();

        /*this.restartInterval = setInterval(() => {
            const v = this.element;
            console.log(this.label, this.name, 'RETRYING');

            if (v.buffered.length !== 1 && v.played.length !== 1)
                //this.element.play();
                this.play();

            if (v.buffered.length === 1 && v.played.length === 1)
                clearInterval(this.restartInterval);

        }, 3000);*/

        //this.play();
        return this.element;
    }

    play() {
        if (Hls.isSupported()) {
            this.hls = new Hls();
            this.hls.loadSource(this.url);
            this.hls.attachMedia(this.element);
            //this.hls.on(Hls.Events.MANIFEST_PARSED, this.playVideo);
        } else {
            this.element.src = this.url;
        }
    }

    playVideo(){
        this.element.play();
    }

    destroy() {
        clearInterval(this.restartInterval);
        this.element.remove();
    }
}