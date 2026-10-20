/**
 * E2E-Smoke-Test: Auto-Speichern der MediaMTX-Config.
 *
 * Startet in-Process:
 *   1. Mock-MediaMTX auf :9997
 *   2. UI-Server (Production) mit MEDIAMTX_CONFIG_PATH auf eine Temp-Datei
 * und prüft:
 *   - PATCH /v3/config/global/patch  → 200 + mediamtx.yml wird geschrieben
 *   - POST  /v3/config/paths/add/x   → 200 + mediamtx.yml enthält den Pfad
 *   - POST  /v3/hls/sessions/kick    → 200, aber KEIN Save (kein Config-Change)
 *   - PATCH /v3/config/global/patch (400) → KEIN Save
 *
 * Aufruf: node server/test/e2e-config-save.mjs
 * Exit-Code: 0 = alle Checks grün, 1 = mind. ein FAIL.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startMockMediaMTX } from './mock-mediamtx.js';
import { Config } from '../src/Config.js';
import { Server } from '../src/Server.js';
import { Logger } from '../src/Logger.js';

// 19997: bewusst NICHT 9997 — dort läuft ggf. die echte MediaMTX (Docker-Port-Mapping).
const MOCK_PORT = 19997;
const UI_PORT = 3997;
const MOCK_URL = `http://127.0.0.1:${MOCK_PORT}`;

const results = [];
function check(name, cond, detail = '') {
    const ok = !!cond;
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`);
    return ok;
}

async function req(url, opts = {}) {
    const res = await fetch(url, opts);
    const text = await res.text();
    let body = null;
    try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body };
}

const jsonBody = (data) => ({
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
});

async function waitFor(url, timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(url);
            if (res.status < 500) return true;
        } catch { /* noch nicht bereit */ }
        await new Promise((r) => setTimeout(r, 200));
    }
    return false;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
    console.log('=== E2E: Auto-Speichern der MediaMTX-Config ===\n');

    const mock = await startMockMediaMTX({ port: MOCK_PORT, itemCount: 3, log: () => {} });

    // Temp-Datei für die persistierte Config
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mtxui-e2e-save-'));
    const outPath = path.join(outDir, 'mediamtx.yml');

    const env = {
        ...process.env,
        NODE_ENV: 'production',
        SERVER_PORT: String(UI_PORT),
        MEDIAMTX_BASE_URL: MOCK_URL,
        MEDIAMTX_CONFIG_PATH: outPath,
        CONFIG_PATH: path.join(outDir, 'config.json'),
        VERBOSE: 'true',
    };
    const config = new Config(env);
    const logger = new Logger({ verbose: false });
    const server = new Server(config, logger);
    await server.start();
    const ready = await waitFor(`http://127.0.0.1:${UI_PORT}/health`);
    if (!ready) throw new Error('UI-Server nicht erreichbar');

    const B = `http://127.0.0.1:${UI_PORT}/v3`;

    try {
        // 1. Global-Config-Patch → Save
        const before = fs.existsSync(outPath) ? fs.statSync(outPath).size : -1;
        const r1 = await req(`${B}/config/global/patch`, {
            method: 'PATCH',
            ...jsonBody({ logLevel: 'debug' }),
        });
        check('PATCH /config/global/patch → 200', r1.status === 200, `status=${r1.status}`);
        await sleep(300); // fire-and-forget Save abwarten
        check('mediamtx.yml wurde geschrieben', fs.existsSync(outPath), `path=${outPath}`);
        if (fs.existsSync(outPath)) {
            const content = fs.readFileSync(outPath, 'utf8');
            check('Yml enthält logLevel: debug', content.includes('logLevel: debug'), '');
            check('Yml enthält pathDefaults:', content.includes('pathDefaults:'), '');
            check('Yml enthält paths:', content.includes('paths:'), '');
            check('Yml enthält authInternalUsers:', content.includes('authInternalUsers:'), '');
        }

        // 2. Path-Add → Save (Pfad landet in paths:)
        const r2 = await req(`${B}/config/paths/add/e2e-cam`, {
            method: 'POST',
            ...jsonBody({ source: 'rtsp://127.0.0.1:8554/e2e', record: true }),
        });
        check('POST /config/paths/add/e2e-cam → 200', r2.status === 200, `status=${r2.status} body=${JSON.stringify(r2.body)}`);
        await sleep(300);
        if (fs.existsSync(outPath)) {
            const content = fs.readFileSync(outPath, 'utf8');
            check('Yml enthält den neuen Pfad e2e-cam', content.includes('e2e-cam:'), '');
        }

        // 3. Kick → KEIN Save (kein Config-Change)
        const sessions = await req(`${B}/hls/sessions/list?page=0&itemsPerPage=1`);
        const sid = sessions.body?.items?.[0]?.id;
        if (sid) {
            const mtimeBefore = fs.statSync(outPath).mtimeMs;
            const r3 = await req(`${B}/hls/sessions/kick/${sid}`, { method: 'POST' });
            check('POST /hls/sessions/kick → 200', r3.status === 200, `status=${r3.status}`);
            await sleep(300);
            const mtimeAfter = fs.statSync(outPath).mtimeMs;
            check('Kick triggert KEIN Save (mtime unverändert)', mtimeBefore === mtimeAfter,
                `before=${mtimeBefore} after=${mtimeAfter}`);
        } else {
            check('Kick: Session vorhanden', false, 'keine HLS-Session in Mock');
        }

        // 4. Fehlgeschlagener Config-Patch (400) → KEIN Save
        const mtimeBefore4 = fs.statSync(outPath).mtimeMs;
        const r4 = await req(`${B}/config/internal-users/add`, {
            method: 'POST',
            ...jsonBody({ pass: 'ohne-user' }), // Mock liefert 400
        });
        check('POST /config/internal-users/add (ohne user) → 400', r4.status === 400, `status=${r4.status} body=${JSON.stringify(r4.body)}`);
        await sleep(300);
        const mtimeAfter4 = fs.statSync(outPath).mtimeMs;
        check('Fehlgeschlagene Mutation triggert KEIN Save', mtimeBefore4 === mtimeAfter4,
            `before=${mtimeBefore4} after=${mtimeAfter4}`);

        // 5. GET (Read) → KEIN Save
        const mtimeBefore5 = fs.statSync(outPath).mtimeMs;
        await req(`${B}/config/global/get`);
        await sleep(300);
        const mtimeAfter5 = fs.statSync(outPath).mtimeMs;
        check('GET triggert KEIN Save', mtimeBefore5 === mtimeAfter5, '');
    } finally {
        await new Promise((resolve) => {
            const s = server.httpServer;
            if (typeof s.closeAllConnections === 'function') s.closeAllConnections();
            s.close(() => resolve());
        });
        await new Promise((r) => mock.close(r));
        fs.rmSync(outDir, { recursive: true, force: true });
    }

    const failed = results.filter((r) => !r.ok);
    console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} Checks grün ===`);
    if (failed.length > 0) {
        console.log('FAILED:');
        failed.forEach((f) => console.log(`  - ${f.name} [${f.detail}]`));
    }
    process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
    console.error('E2E abgebrochen:', err);
    process.exit(1);
});
