import FormItem from "../FormItem.js";

export default class UserRow {
    constructor(options) {
        this.tab = options.tab;
        this.page = this.tab.page;
        this.store = this.tab.store;

        this.index = options.index;
        this.data = options.data;
        this.schema = options.schema ?? {fields: [], options: {}, inputTypes: {}, locked: []};

        this.items = {};
        this.render();
    }

    render() {
        this.destroy();

        const store = this.data;
        const options = this.schema.options || {};
        const inputTypes = this.schema.inputType || {};
        const locks = this.schema.locked || [];

        this.element = document.createElement("div");
        this.element.className = 'user';

        // index number
        /*const indexElement = document.createElement("div");
        indexElement.className = 'index';
        indexElement.innerHTML = `#${this.index + 1}`;
        this.element.append(indexElement);*/

        this.schema.fields.forEach(prop => {
            const values = options[prop] || false;          // available enums for select or multiselect
            const inputType = inputTypes[prop] || false;    // the name of the form input class
            const locked = locks.includes(prop);            // not editable props

            //console.log([store, options, inputTypes, locks, values, inputType, locked]);

            this.items[prop] = new FormItem(this, false, store, prop, inputType, values, locked, {});
            this.element.append(this.items[prop].element);
        });

        // delete button
        const deleteButton = document.createElement("button");
        deleteButton.className = 'delete';
        deleteButton.innerHTML = `${this.page.icons.svg['user-minus']} Delete user`;
        deleteButton.onclick = () => this.delete();
        this.element.append(deleteButton);
    }

    delete() {
        this.tab.deleteUser(this.index);
        //this.tab.render();
    }

    destroy() {
        this.element?.remove();
        this.items = {};
    }

}