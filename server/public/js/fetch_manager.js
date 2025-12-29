export default class FetchManager {
    constructor({
                    idleTimeout = 10_000,
                    checkInterval = 1_000,
                    onUnauthorized = null,
                } = {}) {
        this.idleTimeout = idleTimeout;
        this.onUnauthorized = onUnauthorized;

        this.requests = new Set();
        this._unauthorizedFired = false; // 🔒 Debounce-Flag

        this._timer = setInterval(() => this._abortIdle(), checkInterval);
    }

    async fetch(url, options = {}) {
        const controller = new AbortController();

        const entry = {
            controller,
            lastActivity: Date.now(),
        };

        this.requests.add(entry);

        let response;
        try {
            response = await fetch(url, {
                ...options,
                credentials: "include",
                signal: controller.signal,
            });
        } catch (err) {
            this.requests.delete(entry);
            throw err;
        }

        if (response.status === 401) {
            this.requests.delete(entry);

            // 🔥 Debounced 401
            if (!this._unauthorizedFired) {
                this._unauthorizedFired = true;

                this.abortAll("unauthorized");

                if (this.onUnauthorized) {
                    this.onUnauthorized(response);
                }
            }

            throw new Error("Unauthorized (401)");
        }

        if (!response.body) {
            this.requests.delete(entry);
            return response;
        }

        const reader = response.body.getReader();
        const stream = new ReadableStream({
            start: async (ctrl) => {
                try {
                    while (true) {
                        const {done, value} = await reader.read();
                        if (done) break;

                        entry.lastActivity = Date.now();
                        ctrl.enqueue(value);
                    }
                    ctrl.close();
                } catch (e) {
                    ctrl.error(e);
                } finally {
                    reader.releaseLock();
                    this.requests.delete(entry);
                }
            },
        });

        return new Response(stream, {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText,
        });
    }

    abortAll(reason = "abort-all") {
        for (const r of this.requests) {
            r.controller.abort(reason);
        }
        this.requests.clear();
    }

    _abortIdle() {
        const now = Date.now();
        for (const r of this.requests) {
            if (now - r.lastActivity > this.idleTimeout) {
                r.controller.abort("idle-timeout");
                this.requests.delete(r);
            }
        }
    }

    resetUnauthorized() {
        this._unauthorizedFired = false;
    }

    destroy() {
        clearInterval(this._timer);
        this.abortAll("manager-destroyed");
    }
}
