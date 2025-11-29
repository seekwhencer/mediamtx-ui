import EventEmitter from "./event_emitter.js";

export default class Sources extends EventEmitter {
    constructor(page) {
        super();
        this.page = page;
        //this.element = this.page.element.querySelector('[data-component="grid"]');


    }

    render() {

    }
}