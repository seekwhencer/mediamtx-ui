import FormItem from "../Components/FormItem.js";
import Tab from "./tab.js";
import ServerGroups from '../Components/Page/server_groups.js';
import GroupNavigation from "../Components/Page/group_navigation.js";

export default class ServerTab extends Tab {
    constructor(page) {
        super(page);
        this.groups = ServerGroups;
    }

    async render() {
        if (this.element)
            this.destroy();

        const ok = await this.service.loadGlobal();
        if (!ok)
            return;

        // the box
        this.element = document.createElement("div");
        this.element.className = "tab server";
        this.page.element.append(this.element);

        this.navigation = new GroupNavigation(this, () => this.renderGroup());
        this.navigation.render();

        this.renderGroup();
    }

    renderGroup() {
        this.items = {};

        this.groupsElement ? this.groupsElement.remove() : null;
        this.groupsElement = document.createElement("div");
        this.groupsElement.className = "groups";
        this.element.append(this.groupsElement);

        const storeKey = this.group.storeKey;
        const store = this.store[storeKey];

        // server_groups.js
        if (this.group.columns) {
            this.group.columns.forEach(col => {

                const groupElement = document.createElement("div");
                groupElement.className = "group";
                groupElement.innerHTML = `<h2>${col.name}</h2>`;

                if (col.props) {
                    const options = this.settings.tree[storeKey].options || {};
                    const inputTypes = this.settings.tree[storeKey].inputType || {};
                    const locks = this.settings[storeKey].locked || [];

                    col.props.forEach(prop => {
                        const values = options[prop] || false;          // available enums for select or multiselect
                        const inputType = inputTypes[prop] || false;    // the name of the form input class
                        const locked = locks.includes(prop);            // not editable props

                        const item = new FormItem(this, storeKey, store, prop, inputType, values, locked, {});

                        groupElement.append(item.element);
                        this.items[prop] = item;
                    });
                }
                this.groupsElement.append(groupElement);
            });

            /*this.listeners ? this.listeners.forEach(eject => eject()) : null;
            this.listeners = [
                this.settings.on('create', (prop, value) => this.updateItem(prop, value)),
                this.settings.on('update', (prop, value) => this.updateItem(prop, value))
            ];*/
        }
    }

    updateItem(prop, value) {
        if (!this.items[prop])
            return;

        console.log(this.label, '> UPDATE ITEM', prop, value);
        this.items[prop].setValue(value);
    }

    destroy() {
        this.items ? Object.keys(this.items).forEach(k => this.items[k].destroy()) : null;
        super.destroy();
    }

    get service() {
        return this.settings.service;
    }

    set service(val) {
        // do nothing
    }

    get store() {
        return this.settings.store;
    }

    set store(val) {
        // do nothing
    }
}
