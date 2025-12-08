import FormItem from "../formitem.js";
import DataProxy from "../../data_proxy.js";
import GroupNavigation from "../../Tabs/group_navigation.js";

export default class StreamRow {
    constructor(pathName, tab) {
        this.label = this.constructor.name.toUpperCase();
        this.pathName = pathName;
        this.tab = tab;
        this.page = this.tab.page;
        this.events = this.tab.events;
        this.stream = this.page.settings.paths[this.pathName]; //this.settings[this.pathName];

        //console.log(this.label, '???', this.stream);

        this.stream.name = this.pathName;
        this.data = new DataProxy(this.stream, this);
        this.groups = this.tab.groups;

        this.pathSettings = this.page.settings.path._.parent; // sorry
        this.options = this.pathSettings.options;
        this.fields = this.pathSettings.fields;
        this.inputType = this.pathSettings.inputType;

        this.render();
    }

    render() {
        if (this.element)
            this.destroy();

        // the box
        this.element = document.createElement("div");
        this.element.className = "path";

        // delete button
        const deleteButton = document.createElement("button");
        deleteButton.className = 'delete';
        deleteButton.innerHTML = `${this.page.icons.svg['list-minus']} Delete path`;
        deleteButton.onclick = () => this.delete();
        this.element.append(deleteButton);

        this.navigation = new GroupNavigation(this);
        this.navigation.render();

        const item = new FormItem(this.data, 'name', {
            className: 'item name'
        }, this);
        this.element.append(item.element);
        this.items.name = item;

        this.groupsElement = this.renderGroup();
        this.element.append(this.groupsElement);

        return this.element;
    }

    renderGroup() {
        this.items = {};

        this.groupsElement ? this.groupsElement.remove() : null;
        const groupsElement = document.createElement("div");
        groupsElement.className = "groups";

        if (this.group.tabs) {
            this.group.tabs.forEach(tab => {
                const group = document.createElement("div");
                group.className = "group";
                if (tab.fields) {
                    tab.fields.forEach(f => {
                        const item = new FormItem(this.data, f, {}, this);
                        group.append(item.element);
                        this.items[f] = item;
                    });
                }
                groupsElement.append(group);
            });
        }
        return groupsElement;
    }

    action(action, prop, value) {
        //console.log(this.label, this.pathName, 'ACTION:', action, prop, value);
        //console.log(this.label, this.pathName, this.data);
        this.tab.action(action, this.pathName, this.data.target);
    }

    destroy() {
    }

    delete() {
        this.tab.deleteItem(this.data.name);
    }

    get group() {
        return this._group;
    }

    set group(val) {
        this._group = val;
        this.groupsElement = this.renderGroup();
        this.element.append(this.groupsElement);
    }

    get value() {
        return this.settings[this.pathName];
    }

    set value(value) {
        //
    }

    get settings() {
        return this.tab.settings;
    }

    set settings(value) {
        // do nothing
    }


    get settingsProxy() {
        return this.settings._.parent;
    }

    set settingsProxy(value) {
        // do nothing
    }
}

const field = (text, css) => {
    const element = document.createElement("div");
    element.className = `field ${css}`;
    element.append(label(text))
    return element;
}

const label = (text) => {
    const element = document.createElement("label");
    element.innerHTML = text;
    return element;
}
const splitCamelCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}
