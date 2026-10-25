import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { SettingsRouter } from '../src/Router/SettingsRouter.js';
import { Config } from '../src/Config.js';

// Test-Helfer (ausgenommen von der Klassen-Konvention).

const noopLogger = { log: () => {}, error: () => {} };

function makeApp() {
    const dir = mkdtempSync(join(tmpdir(), 'mtxui-settings-'));
    const configPath = join(dir, 'config.json');
    const config = new Config({ CONFIG_PATH: configPath }, noopLogger);
    const settingsRouter = new SettingsRouter(config, noopLogger);

    const app = express();
    app.use(express.json());
    app.use(settingsRouter.router);

    return {
        app,
        config,
        settingsRouter,
        cleanup: () => rmSync(dir, { recursive: true, force: true }),
    };
}

describe('SettingsRouter', () => {
    let ctx;
    let server;
    let base;

    beforeEach(async () => {
        ctx = makeApp();
        server = ctx.app.listen(0);
        await new Promise((resolve) => server.once('listening', resolve));
        base = `http://127.0.0.1:${server.address().port}`;
    });

    afterEach(() => {
        server.close();
        ctx.cleanup();
    });

    it('GET /api/settings → 200 { success, data } mit maskiertem Token', async () => {
        ctx.config.mediamtxAuthToken = 'secret-token';

        const res = await fetch(`${base}/api/settings`);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.mediamtxAuthToken).toBe('••••oken');
        expect(body.data.serverPort).toBe(3000);
        expect(body.data.mediamtxConfigPath).toBe('');
        expect(body.data.runtimeKeys).toEqual(['verbose', 'mediamtxBaseUrl', 'mediamtxAuthToken', 'mediamtxBridgeTimeout', 'mediamtxConfigPath', 'mediamtxLogPath']);
        expect(body.data.restartKeys).toEqual(['serverPort', 'mediamtxApiVersion']);
    });

    it('PATCH /api/settings gültig → 200 { success, data: { applied, restartRequired } }, Applier wird aufgerufen', async () => {
        const applier = vi.fn();
        ctx.settingsRouter.setApplier(applier);

        const res = await fetch(`${base}/api/settings`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verbose: true, serverPort: 8080 }),
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.applied).toEqual(['verbose']);
        expect(body.data.restartRequired).toEqual(['serverPort']);
        expect(applier).toHaveBeenCalledTimes(1);
        expect(ctx.config.verbose).toBe(true);
        expect(ctx.config.serverPort).toBe(8080);
    });

    it('PATCH /api/settings ungültig → 400 { success: false, code: invalid_settings }', async () => {
        const applier = vi.fn();
        ctx.settingsRouter.setApplier(applier);

        const res = await fetch(`${base}/api/settings`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serverPort: 0 }),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.code).toBe('invalid_settings');
        expect(body.error.length).toBeGreaterThan(0);
        expect(applier).not.toHaveBeenCalled();
        expect(ctx.config.serverPort).toBe(3000);
    });

    it('PATCH /api/settings mit leerem Body → 200 ohne Changes', async () => {
        const res = await fetch(`${base}/api/settings`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.applied).toEqual([]);
        expect(body.data.restartRequired).toEqual([]);
    });
});
