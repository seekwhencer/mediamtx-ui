import Tab from "./tab.js";

export default class SourcesTab extends Tab {
    constructor(page) {
        super(page);
    }

    render() {

        if (this.element)
            this.destroy();

        // the box
        this.element = document.createElement("div");
        this.element.className = "tab sources";
        this.page.element.append(this.element);
    }

    destroy() {
        super.destroy();
    }

    get settings() {
        return this.page.settings;
    }

    set settings(value) {
        // do nothing
    }
}
