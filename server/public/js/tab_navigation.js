import EventEmitter from "./event_emitter.js";

export default class TabNavigation extends EventEmitter {
    constructor(page) {
        super();
        this.page = page;
        this.tabs = [
            {name: "Overview", slug: "overview", icon: 'armchair'},
            {name: "Server", slug: "server", icon: 'settings'},
            {name: "Path Defaults", slug: "path", icon: 'layers-2'},
            {name: "Sources", slug: "sources", icon: 'shrink'},
            {name: "Streams", slug: "streams", icon: 'expand'},
            {name: "Playback", slug: "playback", icon: 'play'},
            {name: "Recording", slug: "recording", icon: 'circle'},
            {name: "Monitoring", slug: "monitoring", icon: 'chart-no-axes-combined'}];

        this.on('select', () => {
            window.history.pushState({}, "", `#${this.selected}`);
            this.buttons.forEach(b => b.classList.remove("active"));
            this.buttons.filter(b => b.slug === this.selected)[0].classList.add("active");
            this.page.emit('tab', this.tab);
        });

    }

    render() {
        this.element = document.createElement("div");
        this.element.className = "tab-navigation";
        this.page.element.append(this.element);

        this.buttons = [];
        this.tabs.forEach(tab => {
            const button = document.createElement("button");
            button.setAttribute("type", "button");
            button.innerHTML = tab.icon ? `${this.icons.svg[tab.icon]}${tab.name}` : tab.name;
            button.slug = tab.slug; // custom prop
            button.onclick = () => this.selected = tab.slug;
            this.element.append(button);
            this.buttons.push(button);
        });

        // open the first tab
        if (!this.selected)
            this.selected = 'overview';

    }

    get selected() {
        return this._selected;
    }

    set selected(val) {
        this._selected = val;
        this.emit('select', this.tab);
    }

    get tab() {
        return this.tabs.filter(tab => tab.slug === this.selected)[0];
    }

    set tab(val) {
        //
    }

    get icons() {
        return this.page.icons;
    }

    set icons(val) {
        //
    }
}