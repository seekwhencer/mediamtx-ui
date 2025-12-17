import Tab from "./tab.js";
import UserRow from "../Components/Users/user.js";

export default class UsersTab extends Tab {
    constructor(page) {
        super(page);
    }

    async render() {
        if (this.element)
            this.destroy();

        await this.page.settings.loadGlobal();

        // the box
        this.element = document.createElement("div");
        this.element.className = "tab users";
        this.page.element.append(this.element);

        this.renderRows();
    }

    renderRows() {
        this.items = {};

        this.settings.forEach((user, i) => {
            const row = this.renderRow(i);
            this.element.append(row);
        });

        // new one
        //const row = this.renderRow(this.settings.length);
        //this.element.append(row);

        this.addButton = document.createElement('button');
        this.addButton.innerHTML = `${this.page.icons.svg['user-plus']} Add user`;
        this.addButton.className = 'add';
        this.addButton.onclick = () => this.addUser();
        this.element.append(this.addButton);

        this.listeners ? this.listeners.forEach(eject => eject()) : null;
        this.listeners = [
            this.settings.on('create', (index, user) => this.updateItem(index, user)),
            this.settings.on('update', (index, user) => this.updateItem(index, user))
        ];
    }

    renderRow(index) {
        this.items[index] = new UserRow(index, this);
        return this.items[index].element;
    }

    updateItem(index, user) {
        if (!this.items[index])
            return;

        this.render(); // sorry
    }

    addUser() {
        this.settings[this.settings.length] = {
            user: 'new',
            pass: '',
            permissions : [],
            ips: []
        };
        this.render();
    }

    get settings() {
        return this.page.settings.users;
    }

    set settings(value) {
        // do nothing
    }
}