export default class GroupNavigation {
    constructor(tab, onSelect) {
        this.tab = tab;
        this.page = this.tab.page;
        this.events = this.page.events;
        this.groups = this.tab.groups;
        this.onSelect = onSelect;
    }

    render() {
        this.element = document.createElement("div");
        this.element.className = "group-navigation";
        this.tab.element.append(this.element);

        this.buttons = [];
        this.groups.forEach(group => {
            const button = document.createElement("button");
            button.setAttribute("type", "button");
            button.innerHTML = group.icon ? `${this.icons.svg[group.icon]}${group.name}` : group.name;
            button.storeKey = group.storeKey;
            button.onclick = () => this.select(group.storeKey)
            this.element.append(button);
            this.buttons.push(button);
        });

        // open the first group
        if (!this.selected)
            this.selected = this.groups[0].storeKey;

    }

    select(storeKey) {
        this.selected = storeKey;

        if (this.onSelect)
            this.onSelect(storeKey);
    }

    on(event, callback) {
        return this.events.on(event, callback);
    }

    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }

    get selected() {
        return this._selected;
    }

    set selected(val) {
        this._selected = val;

        window.history.pushState({}, "", `#${this.page.tabNavigation.tab.storeKey}/${this.selected}`);
        this.buttons.forEach(b => b.classList.remove("active"));
        this.buttons.filter(b => b.storeKey === this.selected)[0].classList.add("active");
        this.tab.group = this.group;
    }

    get group() {
        return this.groups.filter(group => group.storeKey === this.selected)[0];
    }

    set group(val) {
        //
    }

    get icons() {
        return this.page.icons;
    }

    set icons(val) {
        //
    }
}