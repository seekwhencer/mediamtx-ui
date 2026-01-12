export default class StreamsService {
    constructor(parent) {
        this.tab = parent;
        this.page = this.tab.page;
        this.settings = this.page.settings;
        this.fm = this.page.fm;
    }

    async list() {
        return await this.settings.service.loadPathsList();
    }

    add(data) {
        return this.fm.fetch(
            `${this.settings.addPathUrl}/${data.name}`,
            this.#json('POST', data)
        );
    }

    update(name, data) {
        return this.fm.fetch(
            `${this.settings.replacePathUrl}/${name}`,
            this.#json('POST', data)
        );
    }

    delete(name) {
        return this.fm.fetch(
            `${this.settings.deletePathUrl}/${name}`,
            { method: 'DELETE' }
        );
    }

    #json(method, body) {
        return {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        };
    }
}
