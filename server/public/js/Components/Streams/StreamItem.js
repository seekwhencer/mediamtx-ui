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
        this.destroy();

        this.element = document.createElement("div");
        this.element.className = "path shrunk";

        // Collapse-Button
        this.editButton = document.createElement("button");
        this.editButton.className = 'edit';
        this.editButton.innerHTML = `${this.page.icons.svg['settings']} Edit path`;
        this.editButton.onclick = () => this.collapse();
        this.element.append(this.editButton);

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

        // name form item
        const nameItem = new FormItem({
            parent: this,
            store: store,
            prop: 'name',
            inputType: inputTypes['name'] || false,
            values: options['name'] || false,
            locked: locks.includes('name'),
            elementOptions: {
                className: 'form-item name'
            }
        });

        this.items.name = nameItem;
        this.element.append(nameItem.element);

        const sourceItem = new FormItem({
            parent: this,
            store: store,
            prop: 'source',
            inputType: inputTypes['source'] || false,
            values: options['source'] || false,
            locked: locks.includes('source'),
            elementOptions: {
                className: 'form-item source'
            }
        });

        this.items.name = nameItem;
        this.items.source = sourceItem;
        this.element.append(nameItem.element);
        this.element.append(sourceItem.element);

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
                        if (prop === 'source')
                            return;

                        const item = new FormItem({
                            parent: this,
                            store: store,
                            prop: prop,
                            inputType: inputTypes[prop] || false,
                            values: options[prop] || false,
                            locked: locks.includes(prop),
                            elementOptions: {}
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
                    store: store,
                    prop: prop,
                    inputType: inputTypes[prop] || false,
                    values: options[prop] || false,
                    locked: locks.includes(prop),
                    elementOptions: {}
                });
                groupElement.append(item.element);
                this.items[prop] = item;
            });
            this.groupsElement.append(groupElement);
        }
    }

    collapse() {
        this.element.classList.remove('shrunk');
        this.editButton.classList.add('hidden');
    }

    expand() {

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
