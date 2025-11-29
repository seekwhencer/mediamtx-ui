import EventEmitter from "./event_emitter.js";
import Video from "./video.js";

export default class Streams extends EventEmitter {
    constructor(page) {
        super();
        this.page = page;

        this.element = this.page.element.querySelector('#streams');
        this.videos = {};
    }

    render() {
        this.destroy();

        this.tracks.keys().forEach(track => {
            this.videos[track] = new Video(this, this.tracks[track]);
            this.videos[track].render();
        });
    }

    destroy() {
        this.element.innerHTML = '';
    }

    get tracks() {
        return this.page.settings.paths;
    }

    set tracks(value) {}

}