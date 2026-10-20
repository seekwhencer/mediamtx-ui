import express from 'express';
import axios from 'axios';

/**
 * Agnostic reverse proxy to the MediaMTX API.
 *
 * Forwards every request under the mount prefix verbatim to the upstream
 * MediaMTX instance: method, path, query string, body and (most) headers.
 * The upstream response (status, content-type, body) is forwarded back.
 *
 * The bridge knows nothing about specific endpoints. It is a pure proxy.
 */
class MediaMTXBridge {
    /**
     * @param {Config} config
     * @param {Logger} [logger]
     */
    constructor(config, logger) {
        this.logger = logger || { log: () => {}, error: () => {} };
        this.label = '[MediaMTXBridge]';
        this.onConfigMutated = null; // hook: called after a successful config mutation
        this.applyConfig(config);
    }

    /**
     * Creates a fresh axios client from the current config.
     * @returns {import('axios').AxiosInstance}
     */
    createClient() {
        // MediaMTX root, e.g. http://localhost:9997 (no trailing slash).
        const baseURL = (this.config?.mediamtxBaseUrl || 'http://localhost:9997').replace(/\/+$/, '');
        const authToken = this.config?.mediamtxAuthToken || '';
        const timeout = this.config?.mediamtxBridgeTimeout || 10000;

        return axios.create({
            baseURL,
            timeout,
            // Do NOT throw on 4xx/5xx — we forward the upstream status/body as-is.
            validateStatus: () => true,
            headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
        });
    }

    /**
     * Applies a (new) config and recreates the upstream client.
     * BaseUrl/Token/Timeout take effect immediately, without a restart.
     * @param {Config} config
     */
    applyConfig(config) {
        this.config = config;
        this.client = this.createClient();
    }

    /**
     * Returns an Express router that proxies ALL methods and ALL paths.
     * Mount it with e.g. `app.use('/v3', bridge.router())`.
     * @returns {import('express').Router}
     */
    router() {
        const router = express.Router();
        // router.use() matches every method + every path → fully agnostic.
        router.use(this.handle.bind(this));
        return router;
    }

    /**
     * Forwards one request to MediaMTX and sends the response back.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async handle(req, res) {
        const started = Date.now();
        const url = this.rewriteUrl(req.originalUrl); // e.g. /v3/hls/sessions/list?page=0

        try {
            const upstream = await this.client.request({
                method: req.method,
                url,
                data: req.body, // undefined for GET/HEAD → no body sent
                headers: this.pickHeaders(req),
            });

            this.logger.log(this.label, `${req.method} ${url} -> ${upstream.status} (${Date.now() - started}ms)`);

            const contentType = upstream.headers?.['content-type'];
            if (contentType) res.set('Content-Type', contentType);
            res.status(upstream.status);

            const body = upstream.data;
            if (body === undefined || body === null) {
                res.end();
            } else if (typeof body === 'string') {
                res.send(body);
            } else {
                res.json(body);
            }

            // After a successful config mutation, persist the MediaMTX config (fire-and-forget).
            if (upstream.status >= 200 && upstream.status < 300
                && this.isConfigMutation(req)
                && typeof this.onConfigMutated === 'function') {
                Promise.resolve(this.onConfigMutated()).catch((err) => {
                    this.logger.error(this.label, `Config save failed: ${err.message}`);
                });
            }
        } catch (err) {
            // Only network-level failures reach here (validateStatus: () => true).
            const message = err.code === 'ECONNABORTED'
                ? 'MediaMTX request timed out'
                : `MediaMTX unreachable: ${err.message}`;
            this.logger.error(this.label, `${req.method} ${url} -> ${message}`);
            res.status(502).json({ error: message, status: 'error', code: 'upstream_unreachable' });
        }
    }

    /**
     * Compatibility shim for the MediaMTX API change that merged the
     * secure-variant endpoints into the plain ones:
     *   /v3/rtmps/... -> /v3/rtmp/...
     *   /v3/rtsps/... -> /v3/rtsp/...
     * The old names no longer exist upstream (they 404), so existing callers
     * (RTMP/RTSP pages, Dashboard) keep working by being rewritten here.
     * Only the path is rewritten; the query string is preserved verbatim.
     * @param {string} url - Original request URL (path + optional query).
     * @returns {string} Rewritten URL.
     */
    rewriteUrl(url) {
        const qIndex = url.indexOf('?');
        const path = qIndex === -1 ? url : url.slice(0, qIndex);
        const query = qIndex === -1 ? '' : url.slice(qIndex);
        const rewrittenPath = path
            .replace(/\/rtmps\//g, '/rtmp/')
            .replace(/\/rtsps\//g, '/rtsp/');
        return rewrittenPath + query;
    }

    /**
     * True if the request is a config mutation: a mutating method
     * (POST/PATCH/PUT/DELETE) on a path under `/config/`.
     *
     * This is the trigger for persisting the MediaMTX config after a
     * successful change. Read-only requests (GET) and non-config endpoints
     * (kick, recordings, …) do not count.
     * @param {import('express').Request} req
     * @returns {boolean}
     */
    isConfigMutation(req) {
        const mutating = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
        if (!mutating.has(req.method)) return false;
        const path = (req.originalUrl || '').split('?')[0];
        return path.includes('/config/');
    }

    /**
     * Forwards all request headers except hop-by-hop / client-specific ones.
     * @param {import('express').Request} req
     * @returns {Record<string, string>}
     */
    pickHeaders(req) {
        const deny = new Set([
            'host', 'connection', 'content-length', 'accept-encoding',
            'authorization', 'cookie',
        ]);
        const headers = {};
        for (const [key, value] of Object.entries(req.headers)) {
            if (!deny.has(key) && value !== undefined) headers[key] = value;
        }
        return headers;
    }
}

export { MediaMTXBridge };
