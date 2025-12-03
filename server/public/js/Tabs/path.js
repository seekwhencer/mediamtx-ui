import FormItem from "../Components/formitem.js";
import Tab from "./tab.js";
import PathGroups from "./path_groups.js";
import GroupNavigation from "./group_navigation.js";

export default class PathDefaultsTab extends Tab {
    constructor(page) {
        super(page);
        this.groups = PathGroups;
    }

    render() {
        if (this.element)
            this.destroy();

        // the box
        this.element = document.createElement("div");
        this.element.className = "tab path";
        this.page.element.append(this.element);

        this.navigation = new GroupNavigation(this);
        this.navigation.render();
        return;

        this.renderGroup();
    }

    renderGroup() {
        this.items = {};

        this.groupsElement ? this.groupsElement.remove() : null;
        this.groupsElement = document.createElement("div");
        this.groupsElement.className = "groups";
        this.element.append(this.groupsElement);

        if (this.group.tabs) {
            this.group.tabs.forEach(tab => {
                const group = document.createElement("div");
                group.className = "group";
                group.innerHTML = `<h2>${tab.name}</h2>`;
                if (tab.fields) {
                    tab.fields.forEach(field => {
                        const item = new FormItem(this.settings, field, {}, this);
                        group.append(item.element);
                        this.items[field] = item;
                    });
                }
                this.groupsElement.append(group);
            });

            this.listeners ? this.listeners.forEach(eject => eject()) : null;
            this.listeners = [
                this.settings.on('create', (prop, value) => this.updateItem(prop, value)),
                this.settings.on('update', (prop, value) => this.updateItem(prop, value))
            ];
        }
    }

    updateItem(prop, value) {
        if (!this.items[prop])
            return;

        console.log(this.label, '> UPDATE ITEM', prop, value);
        this.items[prop].setValue(value);
    }

    get settings() {
        return this.page.settings.path;
    }

    set settings(value) {
        // do nothing
    }
}
