import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import YAML from 'yaml';

/**
 * Persists the MediaMTX configuration to a YAML file.
 *
 * After a successful config mutation (see MediaMTXBridge.onConfigMutated),
 * this store fetches the current configuration from the MediaMTX API
 * (global config, path defaults, all paths) and writes it to the path
 * configured via `config.mediamtxConfigPath`.
 *
 * The output is a valid mediamtx.yml:
 *   - global config  → top-level flat keys (incl. authInternalUsers)
 *   - pathDefaults   → nested under `pathDefaults:`
 *   - paths          → nested under `paths:` (name → config map)
 */
class MediaMTXConfigStore {
    /**
     * @param {Config} config
     * @param {Logger} [logger]
     * @param {() => import('axios').AxiosInstance} clientFactory - returns the current axios client
     */
    constructor(config, logger, clientFactory) {
        this.config = config;
        this.logger = logger || { log: () => {}, error: () => {} };
        this.label = '[MediaMTXConfigStore]';
        this.clientFactory = clientFactory;
    }

    /** The current axios client (recreated on config changes). */
    get client() {
        return this.clientFactory();
    }

    /** API version prefix, e.g. `/v3`. */
    get apiPrefix() {
        const v = (this.config?.mediamtxApiVersion || 'v3').replace(/^\/+|\/+$/g, '');
        return `/${v}`;
    }

    /** True if saving is enabled (a path is configured). */
    get enabled() {
        return Boolean(this.config?.mediamtxConfigPath);
    }

    /**
     * Fetches the full config from MediaMTX and writes it to the configured path.
     * @returns {Promise<{saved: boolean, path?: string, reason?: string}>}
     */
    async save() {
        const path = this.config?.mediamtxConfigPath;
        if (!path) {
            this.logger.log(this.label, 'mediamtxConfigPath not set — skipping save');
            return { saved: false, reason: 'no_path' };
        }

        // Sequenziell (nicht parallel), um Connection-Pool-/Keep-Alive-Races zu vermeiden.
        const globalConf = await this.get('/config/global/get');
        const pathDefaults = await this.get('/config/path-defaults/get');
        const paths = await this.getAllPaths();

        const doc = {
            ...globalConf,
            pathDefaults,
            paths,
        };

        const yamlText = YAML.stringify(doc, { lineWidth: 0 });
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, yamlText, 'utf8');
        this.logger.log(this.label, `MediaMTX config saved to ${path}`);
        return { saved: true, path };
    }

    /**
     * GET a MediaMTX endpoint (relative to the API root, e.g. `/config/global/get`).
     * Retries transient network errors (socket hang up, ECONNRESET, …) but not
     * HTTP status errors (4xx/5xx).
     * @param {string} url
     * @param {number} [retries]
     * @returns {Promise<unknown>}
     */
    async get(url, retries = 2) {
        let lastErr;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const res = await this.client.request({ method: 'GET', url: `${this.apiPrefix}${url}` });
                if (res.status >= 400) {
                    throw new Error(`MediaMTX GET ${url} failed with status ${res.status}`);
                }
                return res.data;
            } catch (err) {
                lastErr = err;
                // Status-Fehler (4xx/5xx) nicht retryen — deterministisch.
                if (/failed with status \d{3}/.test(err.message)) break;
                if (attempt < retries) {
                    await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
                }
            }
        }
        throw lastErr;
    }

    /**
     * Fetches ALL paths (paginated) and returns them as a name→config map.
     * The `name` field is stripped from each entry (the map key is the name).
     * @returns {Promise<Record<string, object>>}
     */
    async getAllPaths() {
        const paths = {};
        let page = 0;
        let pageCount = 1;
        while (page < pageCount) {
            const res = await this.get(`/config/paths/list?page=${page}&itemsPerPage=100`);
            pageCount = res.pageCount ?? 1;
            for (const item of res.items || []) {
                const { name, ...rest } = item;
                paths[name] = rest;
            }
            page += 1;
        }
        return paths;
    }
}

export { MediaMTXConfigStore };
