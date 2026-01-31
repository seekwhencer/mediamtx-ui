import FormItem from "../Components/FormItem.js";
import Tab from "./Tab.js";
import ServerGroups from '../Components/Page/server_groups.js';
import GroupNavigation from "../Components/Page/group_navigation.js";

export default class ServerTab extends Tab {
    constructor(page) {
        super(page);
        this.groups = ServerGroups;
    }

    async render() {
        const ok = await this.service.loadGlobal();
        if (!ok)
            return;

        this.destroy();

        // the box
        this.element = document.createElement("div");
        this.element.className = "tab server";
        this.page.element.append(this.element);

        this.navigation = new GroupNavigation(this, () => this.renderGroup());
        this.navigation.render();

        this.listeners = [
            this.settings.on('update-global', (...args) => this.updateItem(...args)),
        ];

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
                        //const item = new FormItem(this, storeKey, store, prop, inputType, values, locked, {});
                        const item = new FormItem({
                            parent: this,
                            storeKey: storeKey,
                            store: store,
                            prop: prop,
                            inputType: inputTypes[prop] || false,
                            values: options[prop] || false,
                            locked: locks.includes(prop),
                            elementOptions : {}
                        });

                        groupElement.append(item.element);
                        this.items[prop] = item;
                    });
                }
                this.groupsElement.append(groupElement);
            });
        }
    }

    updateItem(prop, value) {
        if (!this.items[prop])
            return;

        console.log(this.label, '> UPDATE ITEM', prop, value);
        this.items[prop].setValue(value);
    }

    destroy() {
        if (this.element === undefined)
            return;

        super.destroy();
        Object.values(this.items).forEach(item => item.destroy());
        this.items = {};
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
