import DataProxy from "../../data_proxy.js";
import Button from "../button.js";

export default class UserRow {
    constructor(index, tab) {
        this.index = index;
        this.tab = tab;
        this.page = this.tab.page;
        this.events = this.tab.events;
        this.user = this.settings[this.index];
        this.data = new DataProxy(this.user, this);
        this.debounceTime = 500; //ms

        this.render();
    }

    render() {
        this.element = document.createElement("div");
        this.element.className = 'user';

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

        // index number
        const indexElement = document.createElement("div");
        indexElement.className = 'index';
        indexElement.innerHTML = `#${this.index + 1}`;
        this.element.append(indexElement);

        // delete button
        const deleteButton = document.createElement("button");
        deleteButton.className = 'delete';
        deleteButton.innerHTML = `${this.page.icons.svg['user-minus']} Delete user`;
        deleteButton.onclick = () => this.delete();
        this.element.append(deleteButton);

        // username
        const f1 = field('USERNAME', 'username');
        this.element.append(f1);

        this.userName = document.createElement('input');
        this.userName.value = this.user.user;
        this.userName.type = 'text';
        this.userName.onblur = e => this.data.user = e.target.value;
        this.userName.onkeyup = e => e.key === 'Enter' ? this.data.user = e.target.value : null;

        f1.append(this.userName);

        const f2 = field('PASSWORD', 'password');
        this.element.append(f2);

        this.userPass = document.createElement('input');
        this.userPass.value = this.user.pass;
        this.userPass.type = 'text';
        this.userPass.placeholder = 'plain or as secure key';
        this.userPass.onblur = e => this.data.pass = e.target.value;
        this.userPass.onkeyup = e => e.key === 'Enter' ? this.data.pass = e.target.value : null;
        f2.append(this.userPass);

        const f3 = field('PERMISSIONS', 'permissions');
        this.element.append(f3);

        this.userPermissions = this.renderPermissions();
        f3.append(this.userPermissions);

        const f4 = field('IPS', 'ips');
        this.element.append(f4);

        this.userIPS = this.renderIPS();
        f4.append(this.userIPS);

        this.updatePermissions();
        this.updateIPS();

        return this.element
    }

    renderPermissions() {
        const element = document.createElement("div");
        element.className = 'permissions';

        this.data.permissions.forEach(p => {
            const row = this.renderPermissionRow(p)
            element.append(row);
        });

        return element;
    }

    renderPermissionRow(value) {
        const row = document.createElement('div');
        row.className = 'row';

        const select = document.createElement('select');
        select.change = select.oninput = e => this.concatPermissions();

        ['', 'publish', 'read', 'playback', 'api', 'metrics', 'pprof'].forEach(option => {
            const o = document.createElement("option");
            o.innerHTML = o.value = option;
            select.append(o);
        });

        select.value = value.action;
        row.append(select);

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value.path || '';
        input.onblur = e => this.concatPermissions();
        input.onkeyup = e => e.key === 'Enter' ? this.concatPermissions() : null;
        input.placeholder = 'path ...';
        row.append(input);

        return row;
    };

    renderIPS() {
        const element = document.createElement("div");
        element.className = 'ips';

        this.data.ips.forEach(ip => {
            const input = this.renderIPSRow(ip);
            element.append(input);
        });

        return element;
    }

    renderIPSRow(ip) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = ip || '';
        input.onblur = e => this.concatIPS();
        input.onkeyup = e => e.key === 'Enter' ? this.concatIPS() : null;
        input.placeholder = 'add new ...';
        return input;
    }


    destroy() {

    }

    action(action, field, value) {
        this.settings[this.index] = this.data._.target;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.settingsProxy.action(action, this.index, this.value), this.debounceTime);
    }

    concatPermissions() {
        if (this.userName.value === '')
            return;

        const values = [];
        const rows = [...this.userPermissions.querySelectorAll('.row')];
        rows.forEach(row => {
            const action = row.querySelector('select').value;
            const path = row.querySelector('input[type=text]').value;
            action !== '' ? values.push({
                action: action,
                path: path,
            }) : null;
        });
        this.data.permissions = values;
        //this.updatePermissions();
    }

    updatePermissions() {
        const rows = [...this.userPermissions.querySelectorAll('.row')];
        // drop all empty rows
        rows.forEach(row => {
            const select = row.querySelector('select');
            if (select.value === '')
                row.remove();
        });
        // add new empty row
        const add = this.renderPermissionRow({action: '', path: ''});
        this.userPermissions.append(add);
    }

    concatIPS() {
        if (this.userName.value === '')
            return;

        const values = [];
        const inputs = [...this.userIPS.querySelectorAll('input')];
        inputs.forEach(input => values.push(input.value));
        this.data.ips = values;
    }

    updateIPS() {
        const inputs = [...this.userIPS.querySelectorAll('input')];
        inputs.forEach(input => input.value === '' ? input.remove() : null);
        const input = this.renderIPSRow('');
        this.userIPS.append(input);
    }

    delete() {
        this.settings.splice(this.index, 1);
        this.tab.render();
    }

    setUser(user) {
        this.data._.target = user;

        this.render();

        //this.render();
        //this.userName.value = user.user;
        //this.userPass.value = user.pass;
        //this.updatePermissions();
        //this.updateIPS();

        //console.log('????', user);
        //this.data.target = user;
        //this.render();
    }

    get value() {
        return this.settings[this.index];
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