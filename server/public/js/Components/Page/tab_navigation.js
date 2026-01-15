import EventEmitter from "../../event_emitter.js";

export default class TabNavigation {
    constructor(page) {
        this.page = page;
        this.events = this.page.events || new EventEmitter();

        // slug equals page.tabs[SLUG]
        this.tabs = [
            {name: "Overview", slug: "overview", icon: 'armchair'},
            {name: "Streams", slug: "streams", icon: 'expand'},
           //{name: "Sources", slug: "sources", icon: 'shrink'},
            {name: "Server", slug: "server", icon: 'settings'},
            //{name: "Playback", slug: "playback", icon: 'play'},
            //{name: "Recording", slug: "recording", icon: 'circle'},
            //{name: "Monitoring", slug: "monitoring", icon: 'chart-no-axes-combined'},
            {name: "Path Defaults", slug: "path", icon: 'layers-2'},
            {name: "Users", slug: "users", icon: 'user'}
        ];
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
        if (!this.selected) {
            this.selected = this.tabs[2].slug;
        } else {
            this.selected = this.selected;
        }

    }

    on(event, callback) {
        return this.events.on(event, callback);
    }

    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }

    destroy(){
        this.element.remove();
    }

    get selected() {
        return this._selected;
    }

    set selected(val) {
        this._selected = val;

        window.history.pushState({}, "", `#${this.selected}`);
        this.buttons.forEach(b => b.classList.remove("active"));
        this.buttons.filter(b => b.slug === this.selected)[0].classList.add("active");
        this.page.showTab(this.tab);

        //this.page.emit('tab', this.tab);
        //this.emit('select', this.tab);
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