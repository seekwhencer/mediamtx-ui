import PathItemProxy from "./Settings/PathItemProxy.js";
import UserItemProxy from "./Settings/UserItemProxy.js";
import {UsersSettings} from "./Settings/index.js";

export default class SettingsService {
    constructor(settings) {
        this.debug = true;
        this.label = this.constructor.name.toUpperCase();

        this.settings = settings;
        this.page = this.settings.page;
        this.fm = this.page.fm;
        this.loading = this.page.loading;
        this.store = this.settings.store;
        this.csrfToken = this.page.auth.csrfToken;

        this.debounceTime = 100;
        this.debounce = {
            loadGlobal: 0,
            saveGlobal: 0,
            loadPathDefaults: 0,
            savePathDefaults: 0,
            loadPathsList: 0
        }
    }

    /**
     * load complete runtime configs
     * @returns {Promise<void>}
     */
    async loadAll() {
        await this.loadGlobal();
        await this.loadPathDefaults();
        await this.loadPathsList();
    }

    /**
     * load global and user runtime config
     * @returns {Promise<void>}
     */
    async loadGlobal() {
        const id = ++this.debounce.loadGlobal;
        await sleep(this.debounceTime);

        if (id !== this.debounce.loadGlobal)
            return;

        const res = await this.fm.fetch('/mediamtx/config/global/get', {
            headers: {
                'CSRF-Token': this.csrfToken,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!res.ok) throw new Error('LOAD GLOBAL FAILED');
        const data = await res.json();

        if (data.authInternalUsers) {
            await this.mergeUsers(data.authInternalUsers);
            delete data.authInternalUsers;
        }

        await this.mergeGlobal(data);
        this.debounce.loadGlobal = 0;
        return res.ok;
    }

    /**
     * load path defaults runtime config
     * @returns {Promise<void>}
     */
    async loadPathDefaults() {
        const id = ++this.debounce.loadPathDefaults;
        await sleep(this.debounceTime);

        if (id !== this.debounce.loadPathDefaults)
            return;

        const res = await this.fm.fetch('/mediamtx/config/pathdefaults/get', {
            headers: {
                'CSRF-Token': this.csrfToken,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!res.ok) throw new Error('LOAD PATH DEFAULTS FAILED');
        const data = await res.json();

        await this.mergePathDefaults(data);
        this.debounce.loadPathDefaults = 0;
        return res.ok;
    }

    /**
     * load paths list runtime config
     * @returns {Promise<void>}
     */
    async loadPathsList() {
        const id = ++this.debounce.loadPathsList;
        await sleep(this.debounceTime);

        if (id !== this.debounce.loadPathsList)
            return;

        const res = await this.fm.fetch('/mediamtx/config/paths/list', {
            headers: {
                'CSRF-Token': this.csrfToken,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!res.ok) throw new Error('LOAD PATHS LIST FAILED');
        const data = await res.json();

        const arr = {};
        for (const item of data.items) {
            arr[item.name] = item;
        }

        await this.mergePaths(arr);
        this.debounce.loadPathsList = 0;
        return res.ok;
    }

    /**
     * recreate the users list
     * @param list
     */
    async mergeUsers(list) {
        // do nothing, if the data was not changed
        if (JSON.stringify(list) === JSON.stringify(this.store.users))
            return;

        // drop the whole settings for users und recreate it
        this.settings.tree.users = new UsersSettings(this.settings);

        // add all users
        for (const [index, user] of list.entries()) {
            await this.addUser(user, index);
        }

        this.settings.emit('load-users');
    }

    /**
     * merge store global config with loaded config
     * @param data
     */
    async mergeGlobal(data) {
        const map = [
            'general', 'auth', 'api', 'pprof',
            'metrics', 'playback',
            'rtsp', 'rtmp', 'hls', 'webrtc', 'srt'
        ];

        for (const storeKey of map) {
            const settingStore = this.store[storeKey];
            if (!settingStore) continue;

            const setting = this.settings.tree[storeKey];
            if (!setting) continue;

            const fields = setting.fields;
            if (!fields) continue;

            for (const field of fields) {
                if (data[field] === undefined) continue;

                settingStore[field] = data[field];
            }
        }
    }

    /**
     * merge store path defaults with loaded config
     * @param data
     */
    async mergePathDefaults(data) {
        const settingStore = this.store.path;
        if (!settingStore) return;

        const setting = this.settings.tree.path;
        if (!setting) return;

        const fields = setting.fields;
        if (!fields) return;

        for (const field of fields) {
            if (data[field] === undefined) continue;

            settingStore[field] = data[field];
            //this.debug && console.log('>>> path default', field, store[field]);

        }
    }

    /**
     * merge store paths list with loaded list
     * @param list
     */
    async mergePaths(list) {
        const settingStore = this.store.paths;
        if (!settingStore) return;

        // drop removed
        Object.keys(settingStore).forEach(k => !list[k] ? delete settingStore[k] : null);

        // add or update
        Object.entries(list).forEach(([pathKey, path]) => {
            if (settingStore[pathKey] === undefined) { // create if not exist
                settingStore[pathKey] = new PathItemProxy(path, pathKey, {
                    // a field will be only updated. not deleted or created
                    onUpdate: result => this.settings.tree.paths.onUpdate({...result, path: path}),
                    onSkip: result => this.settings.tree.paths.onSkip({...result, path: path})
                });
            } else { // update the store props, triggers onChange()
                Object.keys(path).forEach(prop => settingStore[pathKey][prop] = path[prop]); // the proxy is skipping not changed values
            }
        });
    }

    /**
     * update complete global against server
     * @returns {Promise<boolean|*>}
     */
    async saveGlobal() {
        const id = ++this.debounce.saveGlobal;
        await sleep(this.debounceTime);

        if (id !== this.debounce.saveGlobal)
            return;

        const payload = this.store.globalConfig;
        const res = await this.fm.fetch('/mediamtx/config/global/patch', {
            method: 'PATCH',
            headers: {
                'CSRF-Token': this.csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await res.json();
        if (!res.ok) {
            console.error('SAVE GLOBAL FAILED');
            this.page.toast.error(data.error);
        } else {
            this.page.toast.success('Saved global settings');
        }

        this.debounce.saveGlobal = 0;
        return res.ok;
    }

    /**
     * update path defaults against server
     * @returns {Promise<boolean|*>}
     */
    async savePathDefaults() {
        const id = ++this.debounce.savePathDefaults;
        await sleep(this.debounceTime);

        if (id !== this.debounce.savePathDefaults)
            return;

        const payload = this.store.path;

        const res = await this.fm.fetch('/mediamtx/config/pathdefaults/patch', {
            method: 'PATCH',
            headers: {
                'CSRF-Token': this.csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await res.json();
        if (!res.ok) {
            console.error('SAVE PATH DEFAULTS FAILED', data.error);
            this.page.toast.error(data.error);
        } else {
            this.page.toast.success('Saved paths settings');
        }

        this.debounce.savePathDefaults = 0;
        await this.loadPathDefaults();
        return res.ok;
    }

    async flushUsers() {
        const length = [...this.store.users].length;
        for (let i = 0; i < length; i++)
            this.deleteUser(0); // <-- repat 0, because the source update instantly
    }

    async addUser(user) {
        if (user === undefined)
            return;

        let index = [...this.store.users].length;

        this.store.users[index] = new UserItemProxy(user, index, {
            onUpdate: result => this.settings.tree.users.onUpdate({...result, user: user}),
            onSkip: result => this.settings.tree.users.onUpdate({...result, user: user})
        });
    }

    async updateUser(index, user) {
        // nothing to do
        return await this.saveGlobal();
    }

    async deleteUser(index) {
        if (index === undefined)
            index = 0;

        if (!this.store.users[index])
            return;

        const user = this.store.users[index];
        this.store.users.splice(index, 1);

        this.page.toast.success(`User <strong>${user.user}</strong> deleted`);
        return await this.saveGlobal();
    }

    /**
     * add a new path to the paths list
     * @param pathData
     * @returns {Promise<boolean|*>}
     */
    async addPath(pathData) {
        if (pathData === undefined) {
            pathData = {...this.settings.path};
            pathData.name = 'new';
        }

        const res = await this.fm.fetch(
            `/mediamtx/config/paths/add/${pathData.name}`,
            {
                method: 'POST',
                headers: {
                    'CSRF-Token': this.csrfToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pathData),
                credentials: 'include'
            }
        );

        if (res.ok) {
            this.page.toast.success('Path added');
            await this.loadPathsList();
        } else {
            const data = await res.json();
            console.error('ADD PATH FAILED');
            this.page.toast.error(data.error);
        }

        return res.ok;
    }

    /**
     * update existing path from the paths list
     * @param name
     * @param pathData
     * @returns {Promise<boolean|*>}
     */
    async updatePath(name, pathData) {
        if (name !== pathData.name) {
            return await this.renamePath(name, pathData.name);
        } else {
            const res = await this.fm.fetch(
                `/mediamtx/config/paths/patch/${name}`,
                {
                    method: 'PATCH',
                    headers: {
                        'CSRF-Token': this.csrfToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(pathData),
                    credentials: 'include'
                }
            );

            if (res.ok) {
                this.page.toast.success(`Path <strong>${name}</strong> updated`);
                await this.loadPathsList();
            } else {
                const data = await res.json();
                console.error('UPDATE PATH FAILED');
                this.page.toast.error(data.error);
            }

            return res.ok;
        }
    }

    async renamePath(nameFrom, nameTo) {
        const pathData = {...this.store.paths[nameFrom]};
        pathData.name = nameTo;

        await this.deletePath(nameFrom);
        await this.addPath(pathData);
        return true;
    }

    // not really needed, because the key not equals the name
    async replacePath(name, pathData) {
        const res = await this.fm.fetch(
            `/mediamtx/config/paths/replace/${name}`,
            {
                method: 'POST',
                headers: {
                    'CSRF-Token': this.csrfToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pathData),
                credentials: 'include'
            }
        );

        if (res.ok) {
            this.page.toast.success('Path replaced');
            await this.loadPathsList();
        } else {
            const data = await res.json();
            console.error('REPLACE PATH FAILED');
            this.page.toast.error(data.error);
        }

        return res.ok;
    }

    async deletePath(name) {
        if (this.settings.paths[name] === undefined)
            return;

        const res = await this.fm.fetch(
            `/mediamtx/config/paths/delete/${name}`,
            {
                method: 'DELETE',
                headers: {
                    'CSRF-Token': this.csrfToken,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            }
        );

        if (res.ok) {
            this.page.toast.success('Path deleted');
            await this.loadPathsList();
        } else {
            const data = await res.json();
            console.error('DELETE PATH FAILED');
            this.page.toast.error(data.error);
        }

        return res.ok;
    }

}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));