export default class Auth {
    constructor(page) {
        this.label = this.constructor.name.toUpperCase();
        this.page = page;
        this.fm = this.page.fm;
        this.csrfUrl = '/auth/csrf';
        this.loginUrl = '/auth/login';
        this.logoutUrl = '/auth/logout';
        this.statusUrl = '/auth/status';
    }

    async getCsrfToken() {
        const res = await this.fm.fetch(this.csrfUrl);
        const text = await res.text();
        const data = await JSON.parse(text);
        this.csrfToken = data.csrfToken;
        return this.csrfToken;
    }

    async login(username, password) {
        if (!username || !password)
            return;

        try {
            const res = await this.fm.fetch(this.loginUrl, {
                method: 'POST',
                headers: {
                    'CSRF-Token': this.csrfToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            const text = await res.text();
            const data = await JSON.parse(text);

            if (data?.ok)
                this.isAuthenticated = true;
        } catch (e) {
            ///
        }
    }

    async logout() {
        const res = await this.fm.fetch(this.logoutUrl, {
            method: 'POST',
            headers: {
                'CSRF-Token': this.csrfToken
            },
            credentials: 'include'
        });
        const text = await res.text();
        const data = await JSON.parse(text);

        if (data?.ok)
            this.isAuthenticated = false;
    }

    async getStatus() {
        try {
            const res = await this.fm.fetch(this.statusUrl, {
                method: 'GET',
                headers: {
                    'CSRF-Token': this.csrfToken
                },
                credentials: 'include'
            });
            const text = await res.text();
            const data = await JSON.parse(text);

            if (data?.isAuthenticated)
                this.isAuthenticated = true;

        } catch (e) {
            //
        }
    }

    get csrfToken() {
        return this._csrfToken || false;
    }

    set csrfToken(val) {
        this._csrfToken = val;
    }

}