/**
 * Phase-10 E2E-Smoke-Test (Test-Helfer).
 *
 * Startet in-Process:
 *   1. Mock-MediaMTX auf :9997 (150 Items für Pagination)
 *   2. UI-Server im Dev-Modus (NODE_ENV=development)  → 10.1
 *   3. UI-Server im Production-Modus (NODE_ENV=production) → 10.2
 * und spielt gegen die Bridge (HTTP) ab:
 *   10.3 CRUD (internal-users, config-paths, recordings segments)
 *   10.4 Fehlerfälle (404, 400, 500, 502)
 *   10.5 Pagination (page, itemsPerPage)
 *   10.6 Kick (alle Protokolle)
 *
 * Aufruf: node server/test/e2e-phase10.mjs
 * Exit-Code: 0 = alle Checks grün, 1 = mind. ein FAIL.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startMockMediaMTX } from './mock-mediamtx.js';
import { Config } from '../src/Config.js';
import { Server } from '../src/Server.js';
import { Logger } from '../src/Logger.js';

const MOCK_PORT = 9997;
const DEV_PORT = 3998;
const PROD_PORT = 3999;
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
    return { status: res.status, body, text, headers: res.headers };
}

const jsonBody = (data) => ({
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
});

async function waitFor(url, timeoutMs = 60000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(url);
            if (res.status < 500) return true;
        } catch { /* noch nicht bereit */ }
        await new Promise((r) => setTimeout(r, 250));
    }
    return false;
}

function tmpConfigPath(label) {
    return path.join(fs.mkdtempSync(path.join(os.tmpdir(), `mtxui-${label}-`)), 'config.json');
}

async function startUIServer({ port, nodeEnv, label }) {
    process.env.NODE_ENV = nodeEnv;
    const env = {
        ...process.env,
        SERVER_PORT: String(port),
        MEDIAMTX_BASE_URL: MOCK_URL,
        CONFIG_PATH: tmpConfigPath(label),
        VERBOSE: 'false',
    };
    const config = new Config(env);
    const logger = new Logger({ verbose: false });
    const server = new Server(config, logger);
    await server.start();
    const ready = await waitFor(`http://127.0.0.1:${port}/health`);
    if (!ready) throw new Error(`UI-Server (${label}) nicht erreichbar auf :${port}`);
    return server;
}

function closeServer(server) {
    return new Promise((resolve) => {
        const s = server.httpServer;
        const done = () => resolve();
        const t = setTimeout(done, 2000);
        if (typeof s.closeAllConnections === 'function') s.closeAllConnections();
        s.close(() => {
            clearTimeout(t);
            done();
        });
    });
}

// ---------- 10.1 / 10.2: Deep-Link-Checks (Dev + Production) ----------

async function deepLinkChecks(base, label) {
    const routes = ['/', '/paths', '/config/global', '/settings', '/config/paths/cam1', '/hls'];
    for (const route of routes) {
        const r = await req(`${base}${route}`);
        const isHtml = (r.headers.get('content-type') || '').includes('text/html');
        const hasRoot = r.text.includes('<div id="root">');
        check(`10.x ${label}: GET ${route} → 200 index.html`, r.status === 200 && isHtml && hasRoot,
            `status=${r.status} ct=${r.headers.get('content-type')}`);
    }

    const health = await req(`${base}/health`);
    check(`10.x ${label}: GET /health → 200 ok`, health.status === 200 && health.body?.status === 'ok',
        `status=${health.status}`);

    const info = await req(`${base}/v3/info`);
    check(`10.x ${label}: GET /v3/info → 200 (via Bridge)`, info.status === 200 && typeof info.body?.version === 'string',
        `status=${info.status} version=${info.body?.version}`);
}

// ---------- 10.3: CRUD ----------

async function crudChecks(base) {
    const B = `${base}/v3`;

    // --- Internal Users ---
    const before = await req(`${B}/config/internal-users/list?page=0&itemsPerPage=1`);
    const countBefore = before.body?.itemCount;

    const add = await req(`${B}/config/internal-users/add`, {
        method: 'POST',
        ...jsonBody({
            user: 'e2e-user',
            pass: 'e2e-pass',
            ips: ['10.0.0.1'],
            permissions: [{ action: 'api', path: '*' }],
        }),
    });
    check('10.3 users: POST add → 200 + id', add.status === 200 && add.body?.status === 'ok' && !!add.body?.id,
        `status=${add.status}`);

    const listAfterAdd = await req(`${B}/config/internal-users/list?page=0&itemsPerPage=1`);
    check('10.3 users: GET list → itemCount +1', listAfterAdd.body?.itemCount === countBefore + 1,
        `before=${countBefore} after=${listAfterAdd.body?.itemCount}`);

    const found = await req(`${B}/config/internal-users/list?page=0&itemsPerPage=200`);
    const added = found.body?.items?.find((u) => u.user === 'e2e-user');
    check('10.3 users: GET list → neuer User vorhanden', !!added, `user=${added?.user}`);

    const get = await req(`${B}/config/internal-users/get/${added.id}`);
    check('10.3 users: GET get/{id} → 200 + Daten', get.status === 200 && get.body?.user === 'e2e-user',
        `status=${get.status}`);

    const patch = await req(`${B}/config/internal-users/patch/${added.id}`, {
        method: 'PATCH',
        ...jsonBody({ pass: 'new-pass', ips: ['10.0.0.2'] }),
    });
    check('10.3 users: PATCH patch/{id} → 200 ok', patch.status === 200 && patch.body?.status === 'ok',
        `status=${patch.status}`);
    const getAfterPatch = await req(`${B}/config/internal-users/get/${added.id}`);
    check('10.3 users: PATCH wirkt (pass/ips geändert)', getAfterPatch.body?.pass === 'new-pass' && getAfterPatch.body?.ips?.[0] === '10.0.0.2',
        `pass=${getAfterPatch.body?.pass}`);

    const replace = await req(`${B}/config/internal-users/replace/${added.id}`, {
        method: 'POST',
        ...jsonBody({
            user: 'e2e-user2', pass: 'x', ips: [], permissions: [{ action: 'read', path: 'cam1' }],
        }),
    });
    check('10.3 users: POST replace/{id} → 200 ok', replace.status === 200 && replace.body?.status === 'ok',
        `status=${replace.status}`);
    const getAfterReplace = await req(`${B}/config/internal-users/get/${added.id}`);
    check('10.3 users: REPLACE wirkt (user geändert)', getAfterReplace.body?.user === 'e2e-user2',
        `user=${getAfterReplace.body?.user}`);

    const del = await req(`${B}/config/internal-users/delete/${added.id}`, { method: 'DELETE' });
    check('10.3 users: DELETE delete/{id} → 200 ok', del.status === 200 && del.body?.status === 'ok',
        `status=${del.status}`);
    const listAfterDel = await req(`${B}/config/internal-users/list?page=0&itemsPerPage=1`);
    check('10.3 users: DELETE wirkt (itemCount zurück)', listAfterDel.body?.itemCount === countBefore,
        `after=${listAfterDel.body?.itemCount}`);

    // --- Config Paths ---
    const pAdd = await req(`${B}/config/paths/add/e2e-cam`, {
        method: 'POST',
        ...jsonBody({ source: 'rtsp://127.0.0.1:8554/e2e', record: true }),
    });
    check('10.3 paths: POST add/{name} → 200 ok', pAdd.status === 200 && pAdd.body?.status === 'ok',
        `status=${pAdd.status}`);

    const pGet = await req(`${B}/config/paths/get/e2e-cam`);
    check('10.3 paths: GET get/{name} → 200 + Daten', pGet.status === 200 && pGet.body?.source === 'rtsp://127.0.0.1:8554/e2e',
        `status=${pGet.status}`);

    const pPatch = await req(`${B}/config/paths/patch/e2e-cam`, {
        method: 'PATCH',
        ...jsonBody({ maxReaders: 5 }),
    });
    check('10.3 paths: PATCH patch/{name} → 200 ok', pPatch.status === 200 && pPatch.body?.status === 'ok',
        `status=${pPatch.status}`);
    const pGetAfter = await req(`${B}/config/paths/get/e2e-cam`);
    check('10.3 paths: PATCH wirkt (maxReaders=5)', pGetAfter.body?.maxReaders === 5,
        `maxReaders=${pGetAfter.body?.maxReaders}`);

    const pReplace = await req(`${B}/config/paths/replace/e2e-cam`, {
        method: 'POST',
        ...jsonBody({ source: 'udp://239.0.0.1:1234', record: false }),
    });
    check('10.3 paths: POST replace/{name} → 200 ok', pReplace.status === 200 && pReplace.body?.status === 'ok',
        `status=${pReplace.status}`);
    const pGetAfterReplace = await req(`${B}/config/paths/get/e2e-cam`);
    check('10.3 paths: REPLACE wirkt (source geändert)', pGetAfterReplace.body?.source === 'udp://239.0.0.1:1234',
        `source=${pGetAfterReplace.body?.source}`);

    const pDel = await req(`${B}/config/paths/delete/e2e-cam`, { method: 'DELETE' });
    check('10.3 paths: DELETE delete/{name} → 200 ok', pDel.status === 200 && pDel.body?.status === 'ok',
        `status=${pDel.status}`);
    const pGetAfterDel = await req(`${B}/config/paths/get/e2e-cam`);
    check('10.3 paths: DELETE wirkt (404 danach)', pGetAfterDel.status === 404,
        `status=${pGetAfterDel.status}`);

    // --- Recordings (Segment-Delete) ---
    const rList = await req(`${B}/recordings/list?page=0&itemsPerPage=100`);
    const cam1 = rList.body?.items?.find((r) => r.name === 'cam1');
    check('10.3 recordings: GET list → cam1 mit 3 Segmenten', cam1?.segments?.length === 3,
        `segments=${cam1?.segments?.length}`);

    const segStart = cam1.segments[0].start;
    const rDel = await req(`${B}/recordings/segments/delete?path=cam1&start=${encodeURIComponent(segStart)}`, { method: 'DELETE' });
    check('10.3 recordings: DELETE segments/delete → 200 ok', rDel.status === 200 && rDel.body?.status === 'ok',
        `status=${rDel.status}`);
    const rGet = await req(`${B}/recordings/get/cam1`);
    check('10.3 recordings: DELETE wirkt (2 Segmente übrig)', rGet.body?.segments?.length === 2,
        `segments=${rGet.body?.segments?.length}`);
}

// ---------- 10.4: Fehlerfälle ----------

async function errorChecks(base, mock) {
    const B = `${base}/v3`;

    const e404 = await req(`${B}/config/internal-users/get/00000000-0000-0000-0000-000000000000`);
    check('10.4 404: unbekannter User → 404 + error-Body',
        e404.status === 404 && e404.body?.status === 'error' && typeof e404.body?.error === 'string',
        `status=${e404.status} body=${JSON.stringify(e404.body)}`);

    const e400 = await req(`${B}/config/internal-users/add`, {
        method: 'POST',
        ...jsonBody({ pass: 'ohne-user' }),
    });
    check('10.4 400: add ohne user → 400 + error-Body',
        e400.status === 400 && e400.body?.status === 'error' && typeof e400.body?.error === 'string',
        `status=${e400.status} body=${JSON.stringify(e400.body)}`);

    const e500 = await req(`${B}/config/global/get?mockError=500`);
    check('10.4 500: Mock-500 → 500 + error-Body',
        e500.status === 500 && e500.body?.status === 'error' && typeof e500.body?.error === 'string',
        `status=${e500.status} body=${JSON.stringify(e500.body)}`);

    // 502: Mock stoppen → Bridge antwortet upstream_unreachable
    await new Promise((r) => mock.close(r));
    const e502 = await req(`${B}/info`);
    check('10.4 502: MediaMTX gestoppt → 502 + code=upstream_unreachable',
        e502.status === 502 && e502.body?.code === 'upstream_unreachable' && e502.body?.status === 'error',
        `status=${e502.status} body=${JSON.stringify(e502.body)}`);
}

// ---------- 10.5: Pagination ----------

async function paginationChecks(base) {
    const B = `${base}/v3`;
    const TOTAL = 150;

    const p0 = await req(`${B}/config/internal-users/list?page=0&itemsPerPage=100`);
    check('10.5 page=0,ipp=100 → 100 Items, pageCount=2',
        p0.body?.items?.length === 100 && p0.body?.pageCount === 2 && p0.body?.itemCount === TOTAL,
        `items=${p0.body?.items?.length} pageCount=${p0.body?.pageCount} itemCount=${p0.body?.itemCount}`);

    const p1 = await req(`${B}/config/internal-users/list?page=1&itemsPerPage=100`);
    check('10.5 page=1,ipp=100 → 50 Items (letzte Seite)',
        p1.body?.items?.length === 50 && p1.body?.pageCount === 2,
        `items=${p1.body?.items?.length}`);

    const first0 = p0.body?.items?.[0]?.id;
    const first1 = p1.body?.items?.[0]?.id;
    check('10.5 Seiten sind disjunkt (kein Item-Overlap)', !!first0 && !!first1 && first0 !== first1,
        `first0=${String(first0).slice(0, 8)} first1=${String(first1).slice(0, 8)}`);

    const q0 = await req(`${B}/config/internal-users/list?page=0&itemsPerPage=25`);
    check('10.5 itemsPerPage-Wechsel (25) → 25 Items, pageCount=6',
        q0.body?.items?.length === 25 && q0.body?.pageCount === 6,
        `items=${q0.body?.items?.length} pageCount=${q0.body?.pageCount}`);

    const q5 = await req(`${B}/config/internal-users/list?page=5&itemsPerPage=25`);
    check('10.5 letzte Seite (page=5,ipp=25) → 25 Items',
        q5.body?.items?.length === 25,
        `items=${q5.body?.items?.length}`);

    const qOver = await req(`${B}/config/internal-users/list?page=99&itemsPerPage=100`);
    check('10.5 Page über pageCount → 0 Items (leer, kein Fehler)',
        qOver.status === 200 && qOver.body?.items?.length === 0,
        `status=${qOver.status} items=${qOver.body?.items?.length}`);
}

// ---------- 10.6: Kick (alle Protokolle) ----------

async function kickChecks(base) {
    const B = `${base}/v3`;
    const protocols = [
        { name: 'hls', list: '/hls/sessions/list', kick: (id) => `/hls/sessions/kick/${id}` },
        { name: 'rtsp', list: '/rtsp/sessions/list', kick: (id) => `/rtsp/sessions/kick/${id}` },
        { name: 'rtsps', list: '/rtsps/sessions/list', kick: (id) => `/rtsps/sessions/kick/${id}` },
        { name: 'rtmp', list: '/rtmp/conns/list', kick: (id) => `/rtmp/conns/kick/${id}` },
        { name: 'rtmps', list: '/rtmps/conns/list', kick: (id) => `/rtmps/conns/kick/${id}` },
        { name: 'srt', list: '/srt/conns/list', kick: (id) => `/srt/conns/kick/${id}` },
        { name: 'webrtc', list: '/webrtc/sessions/list', kick: (id) => `/webrtc/sessions/kick/${id}` },
        { name: 'moq', list: '/moq/sessions/list', kick: (id) => `/moq/sessions/kick/${id}` },
    ];

    for (const p of protocols) {
        const before = await req(`${B}${p.list}?page=0&itemsPerPage=100`);
        const id = before.body?.items?.[0]?.id;
        if (!id) {
            check(`10.6 kick ${p.name}: Session vorhanden`, false, 'keine Session in Liste');
            continue;
        }
        const kick = await req(`${B}${p.kick(id)}`, { method: 'POST' });
        const after = await req(`${B}${p.list}?page=0&itemsPerPage=100`);
        check(`10.6 kick ${p.name}: POST kick → 200 + Liste aktualisiert (Invalidate)`,
            kick.status === 200 && kick.body?.status === 'ok' && after.body?.itemCount === before.body?.itemCount - 1,
            `kick=${kick.status} before=${before.body?.itemCount} after=${after.body?.itemCount}`);
    }

    const unknown = await req(`${B}/hls/sessions/kick/00000000-0000-0000-0000-000000000000`, { method: 'POST' });
    check('10.6 kick unbekannter id → 404', unknown.status === 404, `status=${unknown.status}`);
}

// ---------- Main ----------

async function main() {
    console.log('=== Phase 10 E2E-Test ===\n');

    // Mock-MediaMTX (150 Items für Pagination)
    const mock = await startMockMediaMTX({ port: MOCK_PORT, itemCount: 150, log: () => {} });

    // 10.1 Dev-Modus
    console.log('\n--- 10.1 Dev-Modus (Vite Dev via FrontendRouter) ---');
    const devServer = await startUIServer({ port: DEV_PORT, nodeEnv: 'development', label: 'dev' });
    await deepLinkChecks(`http://127.0.0.1:${DEV_PORT}`, 'dev');
    const asset = await req(`http://127.0.0.1:${DEV_PORT}/src/main.jsx`);
    check('10.1 dev: GET /src/main.jsx → 200 (Vite-Transform, kein index.html)',
        asset.status === 200 && !asset.text.includes('<div id="root">'),
        `status=${asset.status}`);
    await closeServer(devServer);

    // 10.2 Production-Modus
    console.log('\n--- 10.2 Production-Modus (Static + Catch-all) ---');
    const prodServer = await startUIServer({ port: PROD_PORT, nodeEnv: 'production', label: 'prod' });
    await deepLinkChecks(`http://127.0.0.1:${PROD_PORT}`, 'prod');
    const prodBase = `http://127.0.0.1:${PROD_PORT}`;

    // 10.3 CRUD
    console.log('\n--- 10.3 CRUD (Users, Paths, Recordings) ---');
    await crudChecks(prodBase);

    // 10.5 Pagination
    console.log('\n--- 10.5 Pagination (page, itemsPerPage) ---');
    await paginationChecks(prodBase);

    // 10.6 Kick
    console.log('\n--- 10.6 Kick (alle Protokolle) ---');
    await kickChecks(prodBase);

    // 10.4 Fehlerfälle (502 zuletzt: Mock wird gestoppt)
    console.log('\n--- 10.4 Fehlerfälle (404, 400, 500, 502) ---');
    await errorChecks(prodBase, mock);

    await closeServer(prodServer);

    // Summary
    const failed = results.filter((r) => !r.ok);
    console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} Checks grün ===`);
    if (failed.length > 0) {
        console.log('FAILED:');
        failed.forEach((f) => console.log(`  - ${f.name} [${f.detail}]`));
    }
    process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
    console.error('E2E-Test abgebrochen:', err);
    process.exit(1);
});
