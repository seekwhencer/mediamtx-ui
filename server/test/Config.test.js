import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Config } from '../src/Config.js';

// Test-Helfer (ausgenommen von der Klassen-Konvention).

const noopLogger = { log: () => {}, error: () => {} };

function makeConfig() {
    const dir = mkdtempSync(join(tmpdir(), 'mtxui-config-'));
    const configPath = join(dir, 'config.json');
    const config = new Config({ CONFIG_PATH: configPath }, noopLogger);
    return { config, configPath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

describe('Config — Settings', () => {
    let ctx;

    beforeEach(() => {
        ctx = makeConfig();
    });

    afterEach(() => {
        ctx.cleanup();
    });

    describe('maskSecret', () => {
        it('leert leere Tokens', () => {
            expect(ctx.config.maskSecret('')).toBe('');
        });

        it('maskiert kurze Tokens komplett', () => {
            expect(ctx.config.maskSecret('ab')).toBe('••••');
            expect(ctx.config.maskSecret('abcd')).toBe('••••');
        });

        it('maskiert lange Tokens mit den letzten 4 Zeichen', () => {
            expect(ctx.config.maskSecret('secret-token')).toBe('••••oken');
        });
    });

    describe('getSettings', () => {
        it('maskiert den Token und liefert runtime/restart-Keys', () => {
            ctx.config.mediamtxAuthToken = 'secret-token';
            const s = ctx.config.getSettings();

            expect(s.mediamtxAuthToken).toBe('••••oken');
            expect(s.serverPort).toBe(3000);
            expect(s.verbose).toBe(false);
            expect(s.mediamtxBaseUrl).toBe('http://localhost:9997');
            expect(s.mediamtxMetricsUrl).toBe('http://localhost:9998');
            expect(s.mediamtxApiVersion).toBe('v3');
            expect(s.mediamtxBridgeTimeout).toBe(10000);
            expect(s.mediamtxConfigPath).toBe('');
            expect(s.runtimeKeys).toEqual(['verbose', 'mediamtxBaseUrl', 'mediamtxMetricsUrl', 'mediamtxAuthToken', 'mediamtxBridgeTimeout', 'mediamtxConfigPath', 'mediamtxLogPath']);
            expect(s.restartKeys).toEqual(['serverPort', 'mediamtxApiVersion']);
        });

        it('lässt leere Tokens leer', () => {
            expect(ctx.config.getSettings().mediamtxAuthToken).toBe('');
        });
    });

    describe('Migration', () => {
        it('fällt bei altem config.json ohne mediamtxMetricsUrl auf den Default zurück', () => {
            const dir = mkdtempSync(join(tmpdir(), 'mtxui-config-'));
            const configPath = join(dir, 'config.json');
            writeFileSync(configPath, JSON.stringify({
                serverPort: 3000,
                verbose: false,
                mediamtxBaseUrl: 'http://localhost:9997',
                mediamtxAuthToken: '',
                mediamtxApiVersion: 'v3',
                mediamtxBridgeTimeout: 10000,
                mediamtxConfigPath: '',
            }, null, 4));

            const config = new Config({ CONFIG_PATH: configPath }, noopLogger);

            expect(config.mediamtxMetricsUrl).toBe('http://localhost:9998');
            expect(config.getSettings().mediamtxMetricsUrl).toBe('http://localhost:9998');
            // updateSettings muss mit dem gemergten Default validieren können
            const result = config.updateSettings({ verbose: true });
            expect(result.applied).toEqual(['verbose']);

            rmSync(dir, { recursive: true, force: true });
        });
    });

    describe('updateSettings — gültige Patches', () => {
        it('wendet Runtime-Keys an, persistiert und klassifiziert', () => {
            const result = ctx.config.updateSettings({
                verbose: true,
                mediamtxBaseUrl: 'http://other.test:1234/',
                mediamtxBridgeTimeout: 5000,
            });

            expect(result.applied).toEqual(['verbose', 'mediamtxBaseUrl', 'mediamtxBridgeTimeout']);
            expect(result.restartRequired).toEqual([]);
            expect(ctx.config.verbose).toBe(true);
            expect(ctx.config.mediamtxBaseUrl).toBe('http://other.test:1234');
            expect(ctx.config.mediamtxBridgeTimeout).toBe(5000);

            const persisted = JSON.parse(readFileSync(ctx.configPath, 'utf8'));
            expect(persisted.verbose).toBe(true);
            expect(persisted.mediamtxBaseUrl).toBe('http://other.test:1234');
            expect(persisted.mediamtxBridgeTimeout).toBe(5000);
        });

        it('klassifiziert serverPort/mediamtxApiVersion als restartRequired', () => {
            const result = ctx.config.updateSettings({ serverPort: 8080, mediamtxApiVersion: 'api' });

            expect(result.applied).toEqual([]);
            expect(result.restartRequired).toEqual(['serverPort', 'mediamtxApiVersion']);
            expect(ctx.config.serverPort).toBe(8080);
            expect(ctx.config.mediamtxApiVersion).toBe('api');

            const persisted = JSON.parse(readFileSync(ctx.configPath, 'utf8'));
            expect(persisted.serverPort).toBe(8080);
            expect(persisted.mediamtxApiVersion).toBe('api');
        });

        it('lässt den Token unverändert, wenn der maskierte Wert zurückkommt', () => {
            ctx.config.updateSettings({ mediamtxAuthToken: 'secret-token' });
            const masked = ctx.config.getSettings().mediamtxAuthToken;
            expect(masked).toBe('••••oken');

            const result = ctx.config.updateSettings({ mediamtxAuthToken: masked });

            expect(ctx.config.mediamtxAuthToken).toBe('secret-token');
            expect(result.applied).not.toContain('mediamtxAuthToken');
        });

        it('löscht den Token, wenn ein leerer Wert kommt', () => {
            ctx.config.updateSettings({ mediamtxAuthToken: 'secret-token' });

            const result = ctx.config.updateSettings({ mediamtxAuthToken: '' });

            expect(ctx.config.mediamtxAuthToken).toBe('');
            expect(result.applied).toContain('mediamtxAuthToken');
            const persisted = JSON.parse(readFileSync(ctx.configPath, 'utf8'));
            expect(persisted.mediamtxAuthToken).toBe('');
        });

        it('ersetzt den Token durch einen neuen Wert', () => {
            ctx.config.updateSettings({ mediamtxAuthToken: 'old-token' });

            const result = ctx.config.updateSettings({ mediamtxAuthToken: 'new-token' });

            expect(ctx.config.mediamtxAuthToken).toBe('new-token');
            expect(result.applied).toContain('mediamtxAuthToken');
        });

        it('aktualisiert mediamtxMetricsUrl (Runtime-Key, Trailing-Slash wird entfernt)', () => {
            const result = ctx.config.updateSettings({ mediamtxMetricsUrl: 'http://mtx.test:9998/' });

            expect(result.applied).toEqual(['mediamtxMetricsUrl']);
            expect(result.restartRequired).toEqual([]);
            expect(ctx.config.mediamtxMetricsUrl).toBe('http://mtx.test:9998');

            const persisted = JSON.parse(readFileSync(ctx.configPath, 'utf8'));
            expect(persisted.mediamtxMetricsUrl).toBe('http://mtx.test:9998');
        });
    });

    describe('updateSettings — ungültige Werte', () => {
        const INVALID_CASES = [
            ['serverPort 0', { serverPort: 0 }],
            ['serverPort 70000', { serverPort: 70000 }],
            ['serverPort nicht-integer', { serverPort: '3000' }],
            ['verbose nicht-boolean', { verbose: 'true' }],
            ['ftp://-URL', { mediamtxBaseUrl: 'ftp://mtx.test:21' }],
            ['ungültige URL', { mediamtxBaseUrl: 'not a url' }],
            ['Metrics-URL ftp://', { mediamtxMetricsUrl: 'ftp://mtx.test:21' }],
            ['Metrics-URL ungültig', { mediamtxMetricsUrl: 'not a url' }],
            ['Token nicht-string', { mediamtxAuthToken: 42 }],
            ['API-Version mit führendem /', { mediamtxApiVersion: '/v3' }],
            ['API-Version leer', { mediamtxApiVersion: '' }],
            ['Timeout 100', { mediamtxBridgeTimeout: 100 }],
            ['Timeout nicht-integer', { mediamtxBridgeTimeout: '10000' }],
        ];

        for (const [label, patch] of INVALID_CASES) {
            it(`lehnt ${label} ab (code: invalid_settings, nichts persistiert)`, () => {
                let thrown = null;
                try {
                    ctx.config.updateSettings(patch);
                } catch (err) {
                    thrown = err;
                }
                expect(thrown).not.toBeNull();
                expect(thrown.status).toBe(400);
                expect(thrown.code).toBe('invalid_settings');
                expect(thrown.message.length).toBeGreaterThan(0);
                expect(existsSync(ctx.configPath)).toBe(false);
            });
        }
    });

    describe('persist', () => {
        it('schreibt alle acht Settings-Felder', () => {
            ctx.config.updateSettings({ verbose: true });
            const persisted = JSON.parse(readFileSync(ctx.configPath, 'utf8'));
            expect(Object.keys(persisted).sort()).toEqual([
                'mediamtxApiVersion', 'mediamtxAuthToken', 'mediamtxBaseUrl',
                'mediamtxBridgeTimeout', 'mediamtxConfigPath', 'mediamtxMetricsUrl',
                'serverPort', 'verbose',
            ]);
        });
    });
});
