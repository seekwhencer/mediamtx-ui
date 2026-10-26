import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import express from 'express';
import { MetricsRouter } from '../src/Router/MetricsRouter.js';
import { MetricsService } from '../src/MetricsService.js';
import { Config } from '../src/Config.js';
import { createMockMediaMTX } from './mock-mediamtx.js';

// Test-Helfer (ausgenommen von der Klassen-Konvention).

const noopLogger = { log: () => {}, error: () => {} };

function makeApp(metricsUrl) {
    const dir = mkdtempSync(join(tmpdir(), 'mtxui-metrics-router-'));
    const configPath = join(dir, 'config.json');
    const config = new Config({ CONFIG_PATH: configPath }, noopLogger);
    config.mediamtxMetricsUrl = metricsUrl;
    const metricsService = new MetricsService(config, noopLogger);
    const metricsRouter = new MetricsRouter(metricsService, noopLogger);

    const app = express();
    app.use(express.json());
    app.use(metricsRouter.router);

    return {
        app,
        config,
        metricsService,
        cleanup: () => rmSync(dir, { recursive: true, force: true }),
    };
}

describe('MetricsRouter', () => {
    let ctx;
    let server;
    let base;
    let upstream;

    beforeEach(async () => {
        const mockApp = createMockMediaMTX();
        upstream = mockApp.listen(0);
        await new Promise((resolve) => upstream.once('listening', resolve));
        const upstreamBase = `http://127.0.0.1:${upstream.address().port}`;

        ctx = makeApp(upstreamBase);
        server = ctx.app.listen(0);
        await new Promise((resolve) => server.once('listening', resolve));
        base = `http://127.0.0.1:${server.address().port}`;
    });

    afterEach(() => {
        server.close();
        upstream.close();
        ctx.cleanup();
    });

    it('GET /api/metrics → 200 { success: true, data: <Snapshot> }', async () => {
        const res = await fetch(`${base}/api/metrics`);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.totals.pathsOnline).toBe(1);
        expect(body.data.totals.readers).toBe(3);
        expect(body.data.paths).toEqual([
            {
                name: 'cam1',
                state: 'online',
                readers: 3,
                inboundBytes: 123456,
                outboundBytes: 654321,
                inboundFramesInError: 0,
            },
        ]);
        expect(body.data.protocols.hls).toEqual({ muxers: 1, sessions: 1, outboundBytes: 187 });
        expect(body.data.forwardDests).toEqual([
            { id: 'stu', path: 'cam1', type: 'rtmp', state: 'forwarding', outboundBytes: 4096 },
        ]);
    });

    it('Upstream-Fehler (500) → 502 { success: false, code: upstream_unreachable }', async () => {
        const stub = http.createServer((req, res) => {
            res.statusCode = 500;
            res.end('boom');
        });
        await new Promise((resolve) => stub.listen(0, resolve));
        ctx.config.mediamtxMetricsUrl = `http://127.0.0.1:${stub.address().port}`;

        const res = await fetch(`${base}/api/metrics`);
        const body = await res.json();
        stub.close();

        expect(res.status).toBe(502);
        expect(body.success).toBe(false);
        expect(body.code).toBe('upstream_unreachable');
        expect(body.error.length).toBeGreaterThan(0);
    });

    it('Upstream-Timeout → 504 { success: false, code: upstream_timeout }', async () => {
        const hanging = http.createServer(() => { /* antwortet nie */ });
        await new Promise((resolve) => hanging.listen(0, resolve));
        ctx.config.mediamtxMetricsUrl = `http://127.0.0.1:${hanging.address().port}`;
        ctx.config.mediamtxBridgeTimeout = 300;

        const res = await fetch(`${base}/api/metrics`);
        const body = await res.json();
        hanging.close();

        expect(res.status).toBe(504);
        expect(body.success).toBe(false);
        expect(body.code).toBe('upstream_timeout');
        expect(body.error.length).toBeGreaterThan(0);
    });
});
