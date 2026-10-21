import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MediaMTXConfigStore } from '../src/MediaMTXConfigStore.js';

// Test-Helfer (ausgenommen von der Klassen-Konvention).

const noopLogger = { log: () => {}, error: () => {} };

/**
 * Erzeugt einen Mock-Axios-Client, dessen `request` eine Handler-Funktion aufruft.
 * @param {(opts: {url: string}) => Promise<{status: number, data: unknown}>} handler
 */
function makeClient(handler) {
    const request = vi.fn((opts) => handler(opts));
    return { request };
}

function makeStore(overrides = {}, client) {
    const config = {
        mediamtxApiVersion: 'v3',
        mediamtxConfigPath: '',
        ...overrides,
    };
    return new MediaMTXConfigStore(config, noopLogger, () => client);
}

function tmpOutPath() {
    const dir = mkdtempSync(join(tmpdir(), 'mtxui-store-'));
    return { path: join(dir, 'mediamtx.yml'), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

describe('MediaMTXConfigStore', () => {
    it('skips the save when no path is configured', async () => {
        const client = makeClient(() => Promise.reject(new Error('should not be called')));
        const store = makeStore({ mediamtxConfigPath: '' }, client);

        const result = await store.save();

        expect(result).toEqual({ saved: false, reason: 'no_path' });
        expect(client.request).not.toHaveBeenCalled();
    });

    it('reports enabled=false without a path and true with one', () => {
        expect(makeStore({ mediamtxConfigPath: '' }, makeClient(() => Promise.resolve({}))).enabled).toBe(false);
        expect(makeStore({ mediamtxConfigPath: '/tmp/x.yml' }, makeClient(() => Promise.resolve({}))).enabled).toBe(true);
    });

    it('fetches the config and writes a valid mediamtx.yml', async () => {
        const { path, cleanup } = tmpOutPath();
        const client = makeClient((opts) => {
            if (opts.url.includes('/config/global/get')) {
                return Promise.resolve({ status: 200, data: { api: true, logLevel: 'info', authInternalUsers: [{ user: 'any', pass: '', ips: [], permissions: [{ action: 'api' }] }] } });
            }
            if (opts.url.includes('/config/path-defaults/get')) {
                return Promise.resolve({ status: 200, data: { source: 'publisher', maxReaders: 0 } });
            }
            if (opts.url.includes('/config/paths/list')) {
                return Promise.resolve({ status: 200, data: { itemCount: 1, pageCount: 1, items: [{ name: 'cam1', source: 'rtsp://127.0.0.1:8554/cam1', record: true }] } });
            }
            return Promise.reject(new Error('unexpected url: ' + opts.url));
        });

        const store = makeStore({ mediamtxConfigPath: path }, client);
        const result = await store.save();

        expect(result.saved).toBe(true);
        expect(result.path).toBe(path);
        expect(existsSync(path)).toBe(true);

        const content = readFileSync(path, 'utf8');
        expect(content).toContain('api: true');
        expect(content).toContain('logLevel: info');
        expect(content).toContain('authInternalUsers:');
        expect(content).toContain('pathDefaults:');
        expect(content).toContain('source: publisher');
        expect(content).toContain('paths:');
        expect(content).toContain('cam1:');
        // `name` wird aus dem Path-Objekt gestrippt (Key ist der Name).
        expect(content).not.toMatch(/name:\s*cam1/);

        cleanup();
    });

    it('quotes YAML-1.1 boolean string values (no/off) so MediaMTX can parse them', async () => {
        const { path, cleanup } = tmpOutPath();
        const client = makeClient((opts) => {
            if (opts.url.includes('/config/global/get')) {
                return Promise.resolve({ status: 200, data: { rtspEncryption: 'no', rtmpEncryption: 'no' } });
            }
            if (opts.url.includes('/config/path-defaults/get')) {
                return Promise.resolve({ status: 200, data: { rpiCameraDenoise: 'off' } });
            }
            if (opts.url.includes('/config/paths/list')) {
                return Promise.resolve({ status: 200, data: { itemCount: 0, pageCount: 1, items: [] } });
            }
            return Promise.reject(new Error('unexpected url: ' + opts.url));
        });

        const store = makeStore({ mediamtxConfigPath: path }, client);
        await store.save();

        const content = readFileSync(path, 'utf8');
        // eemeli/yaml (YAML 1.2) würde "no"/"off" unquoted ausgeben; MediaMTX
        // (Go yaml.v3, YAML 1.1) parst sie als false → Config-Load bricht ab.
        // Die Store muss diese String-Werte daher doppelt-quoten.
        expect(content).toContain('rtspEncryption: "no"');
        expect(content).toContain('rtmpEncryption: "no"');
        expect(content).toContain('rpiCameraDenoise: "off"');
        expect(content).not.toMatch(/^rtspEncryption: no$/m);
        expect(content).not.toMatch(/^rtmpEncryption: no$/m);
        expect(content).not.toMatch(/^\s*rpiCameraDenoise: off$/m);

        cleanup();
    });

    it('paginates through all path pages', async () => {
        const { path, cleanup } = tmpOutPath();
        const client = makeClient((opts) => {
            if (opts.url.includes('/config/global/get')) {
                return Promise.resolve({ status: 200, data: { api: true } });
            }
            if (opts.url.includes('/config/path-defaults/get')) {
                return Promise.resolve({ status: 200, data: { source: 'publisher' } });
            }
            if (opts.url.includes('/config/paths/list')) {
                const page = parseInt(new URL(opts.url, 'http://x').searchParams.get('page'), 10);
                if (page === 0) return Promise.resolve({ status: 200, data: { itemCount: 2, pageCount: 2, items: [{ name: 'cam1', source: 'a' }] } });
                if (page === 1) return Promise.resolve({ status: 200, data: { itemCount: 2, pageCount: 2, items: [{ name: 'cam2', source: 'b' }] } });
            }
            return Promise.reject(new Error('unexpected url: ' + opts.url));
        });

        const store = makeStore({ mediamtxConfigPath: path }, client);
        await store.save();

        const content = readFileSync(path, 'utf8');
        expect(content).toContain('cam1:');
        expect(content).toContain('cam2:');
        cleanup();
    });

    it('throws when an upstream GET fails (nothing written)', async () => {
        const { path, cleanup } = tmpOutPath();
        const client = makeClient(() => Promise.resolve({ status: 500, data: { error: 'boom' } }));

        const store = makeStore({ mediamtxConfigPath: path }, client);
        await expect(store.save()).rejects.toThrow(/status 500/);
        expect(existsSync(path)).toBe(false);
        cleanup();
    });

    it('uses the configured API version prefix', async () => {
        const { path, cleanup } = tmpOutPath();
        const seenUrls = [];
        const client = makeClient((opts) => {
            seenUrls.push(opts.url);
            if (opts.url.includes('/config/global/get')) return Promise.resolve({ status: 200, data: { api: true } });
            if (opts.url.includes('/config/path-defaults/get')) return Promise.resolve({ status: 200, data: { source: 'publisher' } });
            if (opts.url.includes('/config/paths/list')) return Promise.resolve({ status: 200, data: { itemCount: 0, pageCount: 1, items: [] } });
            return Promise.reject(new Error('unexpected url: ' + opts.url));
        });

        const store = makeStore({ mediamtxApiVersion: 'v9', mediamtxConfigPath: path }, client);
        await store.save();

        expect(seenUrls.every((u) => u.startsWith('/v9/'))).toBe(true);
        cleanup();
    });
});
