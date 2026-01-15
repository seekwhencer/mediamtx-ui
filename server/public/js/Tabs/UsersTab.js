import Tab from "./Tab.js";
import UserItem from "../Components/Users/UserItem.js";

export default class UsersTab extends Tab {
    constructor(page) {
        super(page);
        this.items = [];
        this.listeners = new Map();

        this.userSchema = this.page.settings.tree.users.itemSchema;
        this.userDefaults = {
            user: 'new',
            pass: 'password',
            permissions: [],
            ips: []
        };
    }

    async render() {
        this.destroy();

        const ok = await this.service.loadGlobal();
        if (!ok)
            return;

        // the box
        this.element = document.createElement("div");
        this.element.className = "tab users";
        this.page.element.append(this.element);

        this.list = document.createElement('div');
        this.list.className = 'users-list';
        this.element.append(this.list);

        this.listeners = [
            this.settings.on('load-users', () => this.refreshList()),
            //this.settings.on('create-user', (...args) => this.addItem(...args)),
            //this.settings.on('update-user', (...args) => this.updateItem(...args)),
            //this.settings.on('delete-user', data => this.removeItem(data.prop))
        ];

        this.renderList();
        this.renderAddButton();
    }

    refreshList() {
        this.items.forEach((item, index) => this.removeItem(index));
        this.renderList();
    }

    renderList() {
        this.items = [];
        this.store.users.forEach((...args) => this.addItem(...args));
    }

    renderAddButton() {
        const btn = document.createElement('button');
        btn.className = 'add';
        btn.innerHTML = `${this.page.icons.svg['list-plus']} Add user`;
        btn.onclick = () => this.addUser();
        this.element.append(btn);
    }

    addItem(data, index) {
        if (this.items[index]) return;

        const item = new UserItem({
                index: index,
                data: data,
                schema: this.userSchema,
                tab: this
            }
        );

        this.items[index] = item;
        this.list.append(item.element);
    }

    updateItem(index, userData, prop, value) {
        //console.log(index, userData, prop, value);

        const userItem = this.items[index];
        if (userItem) {
            const formItem = userItem.items[prop];

            if (formItem) {
                formItem.setValue(value);
            } else {
                console.log('>>> UPDATE ITEM NOT EXISTS SET VALUE', index, prop, value);
            }
        }
    }

    removeItem(index) {
        const item = this.items[index];
        if (item) {
            item.destroy();
            delete this.items[index];
        }
    }

    async addUser() {
        const data = this.userDefaults;
        await this.service.addUser(data);
        await this.service.saveGlobal();
        await this.service.loadGlobal();
    }

    async updateUser(...args) {
        await this.service.updateUser(...args);
    }

    async deleteUser(name) {
        const ok = await this.service.deleteUser(name);
        if (ok)
            this.removeItem(name);
    }

    get store() {
        return this.settings.store;
    }

    set store(val) {
        // do nothing
    }

    get service() {
        return this.settings.service;
    }

    set service(val) {
        // do nothing
    }
}