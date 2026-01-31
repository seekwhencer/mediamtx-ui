import FormItem from "../Components/FormItem.js";
import Tab from "./Tab.js";
import PathGroups from "../Components/Page/path_groups.js";
import GroupNavigation from "../Components/Page/group_navigation.js";

export default class PathDefaultsTab extends Tab {
    constructor(page) {
        super(page);
        this.groups = PathGroups;
    }

    async render() {
        if (this.element)
            this.destroy();

        const ok = await this.service.loadPathDefaults();
        if (!ok)
            return;

        // the box
        this.element = document.createElement("div");
        this.element.className = "tab path";
        this.page.element.append(this.element);

        this.navigation = new GroupNavigation(this, () => this.renderGroup());
        this.navigation.render();

        this.listeners = [
            this.settings.on('update-path-defaults', (...args) => this.updateItem(...args)),
        ];

        this.renderGroup();
    }

    renderGroup() {
        this.items = {};

        const storeKey = 'path';
        const store = this.store.path;
        const options = this.settings.tree[storeKey].options || {};
        const inputTypes = this.settings.tree[storeKey].inputType || {};
        const locks = this.settings[storeKey].locked || [];

        this.groupsElement ? this.groupsElement.remove() : null;
        this.groupsElement = document.createElement("div");
        this.groupsElement.className = "groups";
        this.element.append(this.groupsElement);

        if (this.group.columns) {
            this.group.columns.forEach(col => {
                const groupElement = document.createElement("div");
                groupElement.className = "group";
                groupElement.innerHTML = `<h2>${col.name}</h2>`;

                if (col.props) {
                    col.props.forEach(prop => {
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

        if (this.group.props) {
            const groupElement = document.createElement("div");
            groupElement.className = "group fields";
            this.group.props.forEach(prop => {
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
            this.groupsElement.append(groupElement);
        }
    }

    updateItem(prop, value) {
        if (!this.items[prop])
            return;

        console.log(this.label, '> UPDATE ITEM', prop, value);
        this.items[prop].setValue(value);
    }

    destroy() {
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
