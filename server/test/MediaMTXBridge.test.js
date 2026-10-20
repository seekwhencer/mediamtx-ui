import { describe, it, expect, vi } from 'vitest';
import { MediaMTXBridge } from '../src/MediaMTXBridge.js';

// Test-Helfer (ausgenommen von der Klassen-Konvention).

function makeBridge(overrides = {}) {
    return new MediaMTXBridge({
        mediamtxBaseUrl: 'http://mtx.test:9997',
        mediamtxAuthToken: 'secret',
        mediamtxBridgeTimeout: 1000,
        ...overrides,
    }, { log: () => {}, error: () => {} });
}

function mockRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.set = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    res.end = vi.fn().mockReturnValue(res);
    return res;
}

function mockReq(overrides = {}) {
    return {
        method: 'GET',
        originalUrl: '/v3/info',
        body: undefined,
        headers: {},
        ...overrides,
    };
}

describe('MediaMTXBridge', () => {
    describe('config & client', () => {
        it('strips trailing slashes from the base URL', () => {
            const bridge = makeBridge({ mediamtxBaseUrl: 'http://mtx.test:9997/' });
            expect(bridge.client.defaults.baseURL).toBe('http://mtx.test:9997');
        });

        it('falls back to defaults when config fields are missing', () => {
            const bridge = new MediaMTXBridge({}, { log: () => {}, error: () => {} });
            expect(bridge.client.defaults.baseURL).toBe('http://localhost:9997');
            expect(bridge.client.defaults.timeout).toBe(10000);
        });

        it('sets the Authorization header when a token is configured', () => {
            const bridge = makeBridge();
            expect(bridge.client.defaults.headers.Authorization).toBe('Bearer secret');
        });

        it('omits the Authorization header without a token', () => {
            const bridge = makeBridge({ mediamtxAuthToken: '' });
            expect(bridge.client.defaults.headers.Authorization).toBeUndefined();
        });
    });

    describe('applyConfig', () => {
        it('recreates the client with new BaseUrl/Token/Timeout (no restart)', () => {
            const bridge = makeBridge();
            const oldClient = bridge.client;

            bridge.applyConfig({
                mediamtxBaseUrl: 'http://other.test:1234',
                mediamtxAuthToken: 'new-token',
                mediamtxBridgeTimeout: 42,
            });

            expect(bridge.client).not.toBe(oldClient);
            expect(bridge.client.defaults.baseURL).toBe('http://other.test:1234');
            expect(bridge.client.defaults.timeout).toBe(42);
            expect(bridge.client.defaults.headers.Authorization).toBe('Bearer new-token');
        });
    });

    describe('handle — forwarding', () => {
        it('forwards GET with query string 1:1', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue({
                status: 200,
                headers: { 'content-type': 'application/json' },
                data: { started: 'x', version: 'v1' },
            });

            const req = mockReq({ originalUrl: '/v3/paths/list?page=0&itemsPerPage=10' });
            const res = mockRes();
            await bridge.handle(req, res);

            expect(bridge.client.request).toHaveBeenCalledWith(expect.objectContaining({
                method: 'GET',
                url: '/v3/paths/list?page=0&itemsPerPage=10',
            }));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/json');
            expect(res.json).toHaveBeenCalledWith({ started: 'x', version: 'v1' });
        });

        it('forwards method, body and (filtered) headers for PATCH', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue({
                status: 200,
                headers: { 'content-type': 'application/json' },
                data: { status: 'ok' },
            });

            const req = mockReq({
                method: 'PATCH',
                originalUrl: '/v3/config/global/patch',
                body: { api: true },
                headers: { 'x-custom': 'abc', host: 'ignored', cookie: 'ignored' },
            });
            const res = mockRes();
            await bridge.handle(req, res);

            const call = bridge.client.request.mock.calls[0][0];
            expect(call.method).toBe('PATCH');
            expect(call.url).toBe('/v3/config/global/patch');
            expect(call.data).toEqual({ api: true });
            expect(call.headers['x-custom']).toBe('abc');
            expect(call.headers.host).toBeUndefined();
            expect(call.headers.cookie).toBeUndefined();
            expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
        });

        it('forwards upstream 4xx status and body as-is', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue({
                status: 404,
                headers: { 'content-type': 'application/json' },
                data: { error: 'path not found', status: 'error' },
            });

            const req = mockReq({ originalUrl: '/v3/paths/get/missing' });
            const res = mockRes();
            await bridge.handle(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'path not found', status: 'error' });
        });

        it('ends the response for empty upstream bodies', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue({
                status: 204,
                headers: {},
                data: undefined,
            });

            const req = mockReq();
            const res = mockRes();
            await bridge.handle(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.end).toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(res.send).not.toHaveBeenCalled();
        });

        it('sends string upstream bodies verbatim', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue({
                status: 200,
                headers: { 'content-type': 'text/plain' },
                data: 'hello',
            });

            const req = mockReq();
            const res = mockRes();
            await bridge.handle(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith('hello');
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe('handle — endpoint rewrite (rtmps/rtsps -> rtmp/rtsp)', () => {
        it('rewrites rtmps and rtsps paths to the merged rtmp/rtsp endpoints', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue({
                status: 200,
                headers: { 'content-type': 'application/json' },
                data: { items: [] },
            });

            const cases = [
                ['/v3/rtmps/conns/list?page=0&itemsPerPage=100', '/v3/rtmp/conns/list?page=0&itemsPerPage=100'],
                ['/v3/rtsps/conns/list?page=0', '/v3/rtsp/conns/list?page=0'],
                ['/v3/rtsps/sessions/list', '/v3/rtsp/sessions/list'],
                ['/v3/rtsps/sessions/kick/abc', '/v3/rtsp/sessions/kick/abc'],
            ];

            for (const [input, expected] of cases) {
                bridge.client.request.mockClear();
                const req = mockReq({ originalUrl: input });
                const res = mockRes();
                await bridge.handle(req, res);
                expect(bridge.client.request).toHaveBeenCalledWith(expect.objectContaining({ url: expected }));
            }
        });

        it('leaves unrelated paths untouched', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue({
                status: 200,
                headers: { 'content-type': 'application/json' },
                data: { items: [] },
            });

            const req = mockReq({ originalUrl: '/v3/paths/list?page=0' });
            const res = mockRes();
            await bridge.handle(req, res);
            expect(bridge.client.request).toHaveBeenCalledWith(expect.objectContaining({
                url: '/v3/paths/list?page=0',
            }));
        });
    });

    describe('handle — error mapping', () => {
        it('maps network errors to 502 upstream_unreachable', async () => {
            const bridge = makeBridge();
            const err = new Error('connect ECONNREFUSED 127.0.0.1:9997');
            err.code = 'ECONNREFUSED';
            bridge.client.request = vi.fn().mockRejectedValue(err);

            const req = mockReq();
            const res = mockRes();
            await bridge.handle(req, res);

            expect(res.status).toHaveBeenCalledWith(502);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'error',
                code: 'upstream_unreachable',
            }));
        });

        it('maps timeouts to 502 with a timeout message', async () => {
            const bridge = makeBridge();
            const err = new Error('timeout of 1000ms exceeded');
            err.code = 'ECONNABORTED';
            bridge.client.request = vi.fn().mockRejectedValue(err);

            const req = mockReq();
            const res = mockRes();
            await bridge.handle(req, res);

            expect(res.status).toHaveBeenCalledWith(502);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'MediaMTX request timed out',
                code: 'upstream_unreachable',
            }));
        });
    });

    describe('isConfigMutation', () => {
        it('detects mutating requests under /config/', () => {
            const bridge = makeBridge();
            expect(bridge.isConfigMutation({ method: 'PATCH', originalUrl: '/v3/config/global/patch' })).toBe(true);
            expect(bridge.isConfigMutation({ method: 'POST', originalUrl: '/v3/config/paths/add/cam1' })).toBe(true);
            expect(bridge.isConfigMutation({ method: 'PUT', originalUrl: '/v3/config/global/put' })).toBe(true);
            expect(bridge.isConfigMutation({ method: 'DELETE', originalUrl: '/v3/config/paths/delete/cam1' })).toBe(true);
            expect(bridge.isConfigMutation({ method: 'DELETE', originalUrl: '/v3/config/internal-users/delete/abc?x=1' })).toBe(true);
        });

        it('rejects reads and non-config endpoints', () => {
            const bridge = makeBridge();
            expect(bridge.isConfigMutation({ method: 'GET', originalUrl: '/v3/config/global/get' })).toBe(false);
            expect(bridge.isConfigMutation({ method: 'POST', originalUrl: '/v3/hls/sessions/kick/abc' })).toBe(false);
            expect(bridge.isConfigMutation({ method: 'DELETE', originalUrl: '/v3/recordings/segments/delete?path=cam1' })).toBe(false);
            expect(bridge.isConfigMutation({ method: 'POST', originalUrl: '/v3/auth/jwks/refresh' })).toBe(false);
        });
    });

    describe('handle — config save hook', () => {
        function okUpstream() {
            return { status: 200, headers: { 'content-type': 'application/json' }, data: { status: 'ok' } };
        }

        it('calls onConfigMutated after a successful config mutation', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue(okUpstream());
            const hook = vi.fn().mockResolvedValue({ saved: true });
            bridge.onConfigMutated = hook;

            const req = mockReq({ method: 'PATCH', originalUrl: '/v3/config/global/patch', body: { api: true } });
            const res = mockRes();
            await bridge.handle(req, res);

            expect(hook).toHaveBeenCalledTimes(1);
        });

        it('does not call onConfigMutated for non-config requests', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue(okUpstream());
            const hook = vi.fn();
            bridge.onConfigMutated = hook;

            const req = mockReq({ method: 'POST', originalUrl: '/v3/hls/sessions/kick/abc' });
            const res = mockRes();
            await bridge.handle(req, res);

            expect(hook).not.toHaveBeenCalled();
        });

        it('does not call onConfigMutated for a failed config mutation (4xx)', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue({
                status: 400, headers: { 'content-type': 'application/json' }, data: { error: 'bad' },
            });
            const hook = vi.fn();
            bridge.onConfigMutated = hook;

            const req = mockReq({ method: 'PATCH', originalUrl: '/v3/config/global/patch', body: {} });
            const res = mockRes();
            await bridge.handle(req, res);

            expect(hook).not.toHaveBeenCalled();
        });

        it('does not call onConfigMutated for GET config requests', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue({
                status: 200, headers: { 'content-type': 'application/json' }, data: { api: true },
            });
            const hook = vi.fn();
            bridge.onConfigMutated = hook;

            const req = mockReq({ method: 'GET', originalUrl: '/v3/config/global/get' });
            const res = mockRes();
            await bridge.handle(req, res);

            expect(hook).not.toHaveBeenCalled();
        });

        it('logs an error if the hook rejects (response already sent)', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue(okUpstream());
            const hook = vi.fn().mockRejectedValue(new Error('save failed'));
            bridge.onConfigMutated = hook;
            const errorSpy = vi.spyOn(bridge.logger, 'error').mockImplementation(() => {});

            const req = mockReq({ method: 'PATCH', originalUrl: '/v3/config/global/patch', body: {} });
            const res = mockRes();
            await bridge.handle(req, res);
            // fire-and-forget: dem await auf den Microtask-Flush geben
            await new Promise((r) => setTimeout(r, 0));

            expect(hook).toHaveBeenCalledTimes(1);
            expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[MediaMTXBridge]'), expect.stringContaining('save failed'));
        });
    });

    describe('router()', () => {
        it('returns an express router that proxies all methods and paths', async () => {
            const bridge = makeBridge();
            bridge.client.request = vi.fn().mockResolvedValue({
                status: 200,
                headers: { 'content-type': 'application/json' },
                data: { ok: true },
            });

            const router = bridge.router();
            expect(typeof router).toBe('function');

            // Mount on a bare express app and hit it with a real request.
            const { default: express } = await import('express');
            const app = express();
            app.use('/v3', router);
            const server = app.listen(0);
            const port = server.address().port;

            try {
                const res = await fetch(`http://127.0.0.1:${port}/v3/anything/deep?x=1`);
                const body = await res.json();

                expect(res.status).toBe(200);
                expect(body).toEqual({ ok: true });
                expect(bridge.client.request).toHaveBeenCalledWith(expect.objectContaining({
                    url: '/v3/anything/deep?x=1',
                }));
            } finally {
                server.close();
            }
        });
    });
});
