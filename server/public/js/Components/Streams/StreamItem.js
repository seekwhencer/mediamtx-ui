import FormItem from "../FormItem.js";
import GroupNavigation from "../Page/group_navigation.js";
import PathGroups from "../Page/path_groups.js";

export default class StreamItem {
    constructor(options) {
        this.label = this.constructor.name.toUpperCase();

        this.tab = options.tab;
        this.page = this.tab.page;
        this.store = this.tab.store;

        this.groups = PathGroups;
        this.name = options.name;
        this.data = options.data;

        this.schema = options.schema ?? {fields: [], options: {}, inputTypes: {}, locked: []};

        this.items = {};
        this.render();
    }

    render() {
        if (this.element)
            this.destroy();

        // Container
        this.element = document.createElement("div");
        this.element.className = "path";

        // Delete-Button
        const deleteButton = document.createElement("button");
        deleteButton.className = 'delete';
        deleteButton.innerHTML = `${this.page.icons.svg['list-minus']} Delete path`;
        deleteButton.onclick = () => this.delete();
        this.element.append(deleteButton);

        // Navigation
        this.navigation = new GroupNavigation(this, () => this.renderGroup());
        this.navigation.render();
        this.navigation.select('source');
        this.element.append(this.navigation.element);

        // Name-Field
        const store = this.data;
        const options = this.schema.options || {};
        const inputTypes = this.schema.inputType || {};
        const locks = this.schema.locked || [];

        const values = options['name'] || false;          // available enums for select or multiselect
        const inputType = inputTypes['name'] || false;    // the name of the form input class
        const locked = locks.includes('name');            // not editable props

        const nameItem = new FormItem(this, false, store, 'name', inputType, values, locked, {
            className: 'item name'
        });

        this.items.name = nameItem;
        this.element.append(nameItem.element);

        return this.element;
    }

    renderGroup() {
        this.items = {};
        this.groupsElement?.remove();

        const store = this.data;
        const options = this.schema.options || {};
        const inputTypes = this.schema.inputType || {};
        const locks = this.schema.locked || [];

        this.groupsElement ? this.groupsElement.remove() : null;
        this.groupsElement = document.createElement("div");
        this.groupsElement.className = "groups";
        this.element.append(this.groupsElement);

        if (this.group.columns) {
            this.group.columns.forEach(col => {
                const groupElement = document.createElement("div");
                groupElement.className = "group";

                if (col.props) {
                    col.props.forEach(prop => {
                        const values = options[prop] || false;          // available enums for select or multiselect
                        const inputType = inputTypes[prop] || false;    // the name of the form input class
                        const locked = locks.includes(prop);            // not editable props

                        const item = new FormItem(this, false, store, prop, inputType, values, locked, {});

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
                const values = options[prop] || false;          // available enums for select or multiselect
                const inputType = inputTypes[prop] || false;    // the name of the form input class
                const locked = locks.includes(prop);            // not editable props

                const item = new FormItem(this, false, store, prop, inputType, values, locked, {});
                groupElement.append(item.element);
                this.items[prop] = item;
            });
            this.groupsElement.append(groupElement);
        }
    }

    delete() {
        this.tab.deletePath(this.name);
    }

    destroy() {
        this.groupsElement?.remove();
        this.navigation?.destroy?.();
        this.element?.remove();
        this.items = {};
    }
}
