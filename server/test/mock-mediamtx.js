import express from 'express';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

/**
 * Mock-MediaMTX-Server (Test-Helfer, Phase 10).
 *
 * Kleiner Express-Stub, der die relevanten /v3-Endpoints der MediaMTX-API
 * mit plausiblen JSON-Antworten bedient (Schemas aus INITIAL_BASICS.md §3).
 * In-memory-State, Pagination (page/itemsPerPage), Kick-Endpoints,
 * Recordings-Segment-Delete und Fehler-Simulation (400/404/500).
 *
 * Nutzung:
 *   - Standalone:  node server/test/mock-mediamtx.js  (Port 9997, MOCK_ITEM_COUNT)
 *   - In-Process:  import { startMockMediaMTX } from './mock-mediamtx.js'
 *
 * Bewusst KEIN Teil der Produktions-Router-Logik.
 */

const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

/**
 * Baut den Mock-Express-App.
 * @param {{ itemCount?: number, log?: (msg: string) => void }} [options]
 * @returns {import('express').Express}
 */
function createMockMediaMTX({ itemCount = 3, log = () => {} } = {}) {
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        log(`[mock-mediamtx] ${req.method} ${req.originalUrl}`);
        next();
    });

    // ---------- In-Memory-State ----------

    const users = [];
    for (let i = 1; i <= itemCount; i++) {
        users.push({
            id: uuid(),
            user: `user${i}`,
            pass: `pass${i}`,
            ips: ['127.0.0.1'],
            permissions: [{ action: 'publish', path: `cam${i}` }],
            pos: i,
        });
    }

    const pathConfs = new Map();
    for (let i = 1; i <= itemCount; i++) {
        pathConfs.set(`cam${i}`, {
            name: `cam${i}`,
            source: `rtsp://127.0.0.1:8554/cam${i}`,
            record: i % 2 === 0,
            maxReaders: 0,
        });
    }

    const runtimePaths = new Map([
        ['cam1', {
            name: 'cam1',
            confName: 'cam1',
            online: true,
            onlineTime: now(),
            available: true,
            availableTime: now(),
            inboundBytes: 1024,
            inboundFramesInError: 0,
            outboundBytes: 2048,
            source: { type: 'rtspConn', id: uuid() },
            readers: [{ type: 'hlsSession', id: uuid() }],
            tracks2: [{ codec: 'H264', codecProps: null }],
        }],
        ['cam2', {
            name: 'cam2',
            confName: 'cam2',
            online: false,
            onlineTime: null,
            available: false,
            availableTime: null,
            inboundBytes: 0,
            inboundFramesInError: 0,
            outboundBytes: 0,
            source: null,
            readers: [],
            tracks2: [],
        }],
    ]);

    const forwardDests = new Map([
        ['cam1', [{
            id: uuid(),
            created: now(),
            pos: 1,
            state: 'forwarding',
            type: 'rtmp',
            lastError: '',
            outboundBytes: 4096,
            typeSpecific: null,
        }]],
    ]);

    const staticSources = new Map([
        ['cam1', {
            created: now(),
            state: 'running',
            type: 'rtspSource',
            lastError: '',
            typeSpecific: null,
        }],
    ]);

    const hlsMuxers = [{
        path: 'cam1',
        created: now(),
        lastRequest: now(),
        outboundBytes: 8192,
        outboundFramesDiscarded: 0,
    }];

    const sessions = {
        hls: [{
            id: uuid(),
            created: now(),
            path: 'cam1',
            query: '',
            remoteAddr: '127.0.0.1:50000',
            user: 'user1',
            userAgent: 'mock-agent',
            isCDN: false,
            outboundBytes: 4096,
        }],
        rtsp: [{
            id: uuid(),
            created: now(),
            path: 'cam1',
            query: '',
            remoteAddr: '127.0.0.1:50001',
            user: 'user1',
            userAgent: 'mock-agent',
            state: 'read',
            transport: 'tcp',
            profile: null,
            conns: [uuid()],
            inboundBytes: 100,
            outboundBytes: 200,
            inboundRTPPackets: 10,
            inboundRTPPacketsLost: 0,
            inboundRTPPacketsJitter: 0,
            inboundRTCPPackets: 1,
            outboundRTPPackets: 20,
            outboundRTPPacketsDiscarded: 0,
            outboundRTCPPackets: 2,
            outboundRTPPacketsReportedLost: 0,
        }],
        rtsps: [{
            id: uuid(),
            created: now(),
            path: 'cam1',
            query: '',
            remoteAddr: '127.0.0.1:50002',
            user: 'user1',
            userAgent: 'mock-agent',
            state: 'publish',
            transport: 'tcp',
            profile: null,
            conns: [uuid()],
            inboundBytes: 300,
            outboundBytes: 400,
            inboundRTPPackets: 30,
            inboundRTPPacketsLost: 1,
            inboundRTPPacketsJitter: 0,
            inboundRTCPPackets: 3,
            outboundRTPPackets: 40,
            outboundRTPPacketsDiscarded: 0,
            outboundRTCPPackets: 4,
            outboundRTPPacketsReportedLost: 0,
        }],
        rtmp: [{
            id: uuid(),
            created: now(),
            path: 'cam1',
            query: '',
            remoteAddr: '127.0.0.1:50003',
            user: 'user1',
            userAgent: 'mock-agent',
            state: 'publish',
            inboundBytes: 500,
            outboundBytes: 600,
            outboundFramesDiscarded: 0,
        }],
        rtmps: [{
            id: uuid(),
            created: now(),
            path: 'cam1',
            query: '',
            remoteAddr: '127.0.0.1:50004',
            user: 'user1',
            userAgent: 'mock-agent',
            state: 'read',
            inboundBytes: 700,
            outboundBytes: 800,
            outboundFramesDiscarded: 0,
        }],
        srt: [{
            id: uuid(),
            created: now(),
            path: 'cam1',
            remoteAddr: '127.0.0.1:50005',
            user: 'user1',
            state: 'read',
            inboundBytes: 900,
            outboundBytes: 1000,
            byteMSS: 1460,
            packetsReceived: 100,
            packetsLost: 0,
            packetsRetrans: 1,
            rtt: 5,
        }],
        webrtc: [{
            id: uuid(),
            created: now(),
            path: 'cam1',
            query: '',
            remoteAddr: '127.0.0.1:50006',
            user: 'user1',
            userAgent: 'mock-agent',
            state: 'read',
            localCandidate: '127.0.0.1:8000',
            remoteCandidate: '127.0.0.1:50006',
            peerConnectionEstablished: true,
            inboundBytes: 1100,
            outboundBytes: 1200,
            inboundRTPPackets: 11,
            inboundRTPPacketsLost: 0,
            inboundRTPPacketsJitter: 0,
            inboundRTCPPackets: 1,
            outboundRTPPackets: 12,
            outboundRTCPPackets: 1,
            outboundFramesDiscarded: 0,
        }],
        moq: [{
            id: uuid(),
            created: now(),
            path: 'cam1',
            query: '',
            remoteAddr: '127.0.0.1:50007',
            userAgent: 'mock-agent',
            state: 'read',
            transport: 'quic',
            version: 'moqt-19',
            inboundBytes: 1300,
            outboundBytes: 1400,
        }],
    };

    const recordings = new Map([
        ['cam1', {
            name: 'cam1',
            segments: [
                { start: '2026-10-20T00:00:00.000Z' },
                { start: '2026-10-20T00:01:00.000Z' },
                { start: '2026-10-20T00:02:00.000Z' },
            ],
        }],
        ['cam2', {
            name: 'cam2',
            segments: [{ start: '2026-10-20T00:00:00.000Z' }],
        }],
    ]);

    const globalConf = {
        api: true,
        apiAddress: ':9997',
        apiAllowOrigins: ['*'],
        apiEncryption: 'no',
        logDestinations: ['stdout'],
        logLevel: 'info',
        logStructured: false,
        hls: true,
        hlsAddress: ':8888',
        hlsVariant: 'mpegts',
        hlsSegmentDuration: '1s',
        hlsSegmentCount: 5,
        rtmp: true,
        rtmpAddress: ':1935',
        rtmpEncryption: 'no',
        rtsp: true,
        rtspAddress: ':8554',
        rtspEncryption: 'no',
        rtspTransports: ['udp', 'tcp'],
        srt: true,
        srtAddress: ':8890',
        webrtc: true,
        webrtcAddress: ':8889',
        webrtcEncryption: 'no',
        moq: false,
        authMethod: 'internal',
        authInternalUsers: [],
        readTimeout: '5s',
        writeTimeout: '5s',
        writeQueueSize: 512,
    };

    const pathDefaults = {
        source: '',
        sourceOnDemand: false,
        maxReaders: 0,
        record: false,
        recordFormat: 'fmp4',
        recordPartDuration: '200ms',
        recordSegmentDuration: '1s',
        alwaysAvailable: false,
        forward: [],
        runOnInit: '',
        runOnInitRestart: false,
    };

    // ---------- Helfer ----------

    function paginate(items, query) {
        const page = Math.max(0, parseInt(query.page, 10) || 0);
        const itemsPerPage = Math.max(1, parseInt(query.itemsPerPage, 10) || 100);
        const start = page * itemsPerPage;
        return {
            itemCount: items.length,
            items: items.slice(start, start + itemsPerPage),
            pageCount: Math.max(1, Math.ceil(items.length / itemsPerPage)),
        };
    }

    function notFound(res, what) {
        return res.status(404).json({ error: `${what} not found`, status: 'error' });
    }

    function badRequest(res, msg) {
        return res.status(400).json({ error: msg, status: 'error' });
    }

    function kickHandler(list) {
        return (req, res) => {
            const idx = list.findIndex((s) => s.id === req.params.id);
            if (idx === -1) return notFound(res, 'session');
            list.splice(idx, 1);
            return res.json({ status: 'ok' });
        };
    }

    // ---------- General ----------

    app.get('/v3/info', (req, res) => {
        res.json({ started: now(), version: 'v1.9.0-mock' });
    });

    app.post('/v3/auth/jwks/refresh', (req, res) => res.json({ status: 'ok' }));

    // ---------- Config: Global ----------

    app.get('/v3/config/global/get', (req, res) => {
        if (req.query.mockError === '500') {
            return res.status(500).json({ error: 'mock internal error', status: 'error' });
        }
        res.json(globalConf);
    });

    app.patch('/v3/config/global/patch', (req, res) => {
        if (req.query.mockError === '500') {
            return res.status(500).json({ error: 'mock internal error', status: 'error' });
        }
        Object.assign(globalConf, req.body || {});
        res.json(globalConf);
    });

    // ---------- Config: Path Defaults ----------

    app.get('/v3/config/path-defaults/get', (req, res) => res.json(pathDefaults));

    app.patch('/v3/config/path-defaults/patch', (req, res) => {
        Object.assign(pathDefaults, req.body || {});
        res.json(pathDefaults);
    });

    // ---------- Config: Internal Users (CRUD) ----------

    app.get('/v3/config/internal-users/list', (req, res) => {
        res.json(paginate(users, req.query));
    });

    app.get('/v3/config/internal-users/get/:id', (req, res) => {
        const u = users.find((x) => x.id === req.params.id);
        if (!u) return notFound(res, 'user');
        res.json(u);
    });

    app.post('/v3/config/internal-users/add', (req, res) => {
        if (!req.body || typeof req.body.user !== 'string' || !req.body.user) {
            return badRequest(res, 'user is required');
        }
        const u = {
            id: uuid(),
            user: req.body.user,
            pass: req.body.pass || '',
            ips: req.body.ips || [],
            permissions: req.body.permissions || [],
            pos: users.length + 1,
        };
        users.push(u);
        res.json({ id: u.id, status: 'ok' });
    });

    app.patch('/v3/config/internal-users/patch/:id', (req, res) => {
        const u = users.find((x) => x.id === req.params.id);
        if (!u) return notFound(res, 'user');
        Object.assign(u, req.body || {});
        res.json({ status: 'ok' });
    });

    app.post('/v3/config/internal-users/replace/:id', (req, res) => {
        const u = users.find((x) => x.id === req.params.id);
        if (!u) return notFound(res, 'user');
        if (!req.body || typeof req.body.user !== 'string' || !req.body.user) {
            return badRequest(res, 'user is required');
        }
        u.user = req.body.user;
        u.pass = req.body.pass || '';
        u.ips = req.body.ips || [];
        u.permissions = req.body.permissions || [];
        res.json({ status: 'ok' });
    });

    app.delete('/v3/config/internal-users/delete/:id', (req, res) => {
        const idx = users.findIndex((x) => x.id === req.params.id);
        if (idx === -1) return notFound(res, 'user');
        users.splice(idx, 1);
        res.json({ status: 'ok' });
    });

    // ---------- Config: Paths (CRUD) ----------

    app.get('/v3/config/paths/list', (req, res) => {
        res.json(paginate([...pathConfs.values()], req.query));
    });

    app.get('/v3/config/paths/get/:name', (req, res) => {
        const c = pathConfs.get(req.params.name);
        if (!c) return notFound(res, 'path');
        res.json(c);
    });

    app.post('/v3/config/paths/add/:name', (req, res) => {
        if (pathConfs.has(req.params.name)) {
            return badRequest(res, 'path already exists');
        }
        pathConfs.set(req.params.name, { name: req.params.name, ...(req.body || {}) });
        res.json({ status: 'ok' });
    });

    app.patch('/v3/config/paths/patch/:name', (req, res) => {
        const c = pathConfs.get(req.params.name);
        if (!c) return notFound(res, 'path');
        Object.assign(c, req.body || {});
        res.json({ status: 'ok' });
    });

    app.post('/v3/config/paths/replace/:name', (req, res) => {
        const c = pathConfs.get(req.params.name);
        if (!c) return notFound(res, 'path');
        Object.assign(c, req.body || {});
        res.json({ status: 'ok' });
    });

    app.delete('/v3/config/paths/delete/:name', (req, res) => {
        if (!pathConfs.delete(req.params.name)) return notFound(res, 'path');
        res.json({ status: 'ok' });
    });

    // ---------- Paths (Runtime) ----------

    app.get('/v3/paths/list', (req, res) => {
        res.json(paginate([...runtimePaths.values()], req.query));
    });

    app.get('/v3/paths/get/:name', (req, res) => {
        const p = runtimePaths.get(req.params.name);
        if (!p) return notFound(res, 'path');
        res.json(p);
    });

    app.get('/v3/paths/forward-dests/list', (req, res) => {
        if (!req.query.path) return badRequest(res, 'path is required');
        res.json(paginate(forwardDests.get(req.query.path) || [], req.query));
    });

    app.get('/v3/paths/forward-dests/get', (req, res) => {
        const dests = forwardDests.get(req.query.path) || [];
        const d = dests.find((x) => x.id === req.query.id);
        if (!d) return notFound(res, 'forward destination');
        res.json(d);
    });

    app.get('/v3/paths/static-sources/get/:name', (req, res) => {
        const s = staticSources.get(req.params.name);
        if (!s) return notFound(res, 'static source');
        res.json(s);
    });

    // ---------- HLS ----------

    app.get('/v3/hls/muxers/list', (req, res) => res.json(paginate(hlsMuxers, req.query)));
    app.get('/v3/hls/muxers/get/:name', (req, res) => {
        const m = hlsMuxers.find((x) => x.path === req.params.name);
        if (!m) return notFound(res, 'muxer');
        res.json(m);
    });
    app.get('/v3/hls/sessions/list', (req, res) => res.json(paginate(sessions.hls, req.query)));
    app.get('/v3/hls/sessions/get/:id', (req, res) => {
        const s = sessions.hls.find((x) => x.id === req.params.id);
        if (!s) return notFound(res, 'session');
        res.json(s);
    });
    app.post('/v3/hls/sessions/kick/:id', kickHandler(sessions.hls));

    // ---------- RTSP / RTSPS ----------

    app.get('/v3/rtsp/conns/list', (req, res) => res.json(paginate(sessions.rtsp.map((s) => ({
        id: s.conns[0] || uuid(),
        created: s.created,
        remoteAddr: s.remoteAddr,
        session: s.id,
        tunnel: '',
        inboundBytes: s.inboundBytes,
        outboundBytes: s.outboundBytes,
    })), req.query)));
    app.get('/v3/rtsp/sessions/list', (req, res) => res.json(paginate(sessions.rtsp, req.query)));
    app.get('/v3/rtsp/sessions/get/:id', (req, res) => {
        const s = sessions.rtsp.find((x) => x.id === req.params.id);
        if (!s) return notFound(res, 'session');
        res.json(s);
    });
    app.post('/v3/rtsp/sessions/kick/:id', kickHandler(sessions.rtsp));

    app.get('/v3/rtsps/conns/list', (req, res) => res.json(paginate(sessions.rtsps.map((s) => ({
        id: s.conns[0] || uuid(),
        created: s.created,
        remoteAddr: s.remoteAddr,
        session: s.id,
        tunnel: '',
        inboundBytes: s.inboundBytes,
        outboundBytes: s.outboundBytes,
    })), req.query)));
    app.get('/v3/rtsps/sessions/list', (req, res) => res.json(paginate(sessions.rtsps, req.query)));
    app.get('/v3/rtsps/sessions/get/:id', (req, res) => {
        const s = sessions.rtsps.find((x) => x.id === req.params.id);
        if (!s) return notFound(res, 'session');
        res.json(s);
    });
    app.post('/v3/rtsps/sessions/kick/:id', kickHandler(sessions.rtsps));

    // ---------- RTMP / RTMPS ----------

    app.get('/v3/rtmp/conns/list', (req, res) => res.json(paginate(sessions.rtmp, req.query)));
    app.get('/v3/rtmp/conns/get/:id', (req, res) => {
        const s = sessions.rtmp.find((x) => x.id === req.params.id);
        if (!s) return notFound(res, 'connection');
        res.json(s);
    });
    app.post('/v3/rtmp/conns/kick/:id', kickHandler(sessions.rtmp));

    app.get('/v3/rtmps/conns/list', (req, res) => res.json(paginate(sessions.rtmps, req.query)));
    app.get('/v3/rtmps/conns/get/:id', (req, res) => {
        const s = sessions.rtmps.find((x) => x.id === req.params.id);
        if (!s) return notFound(res, 'connection');
        res.json(s);
    });
    app.post('/v3/rtmps/conns/kick/:id', kickHandler(sessions.rtmps));

    // ---------- SRT ----------

    app.get('/v3/srt/conns/list', (req, res) => res.json(paginate(sessions.srt, req.query)));
    app.get('/v3/srt/conns/get/:id', (req, res) => {
        const s = sessions.srt.find((x) => x.id === req.params.id);
        if (!s) return notFound(res, 'connection');
        res.json(s);
    });
    app.post('/v3/srt/conns/kick/:id', kickHandler(sessions.srt));

    // ---------- WebRTC ----------

    app.get('/v3/webrtc/sessions/list', (req, res) => res.json(paginate(sessions.webrtc, req.query)));
    app.get('/v3/webrtc/sessions/get/:id', (req, res) => {
        const s = sessions.webrtc.find((x) => x.id === req.params.id);
        if (!s) return notFound(res, 'session');
        res.json(s);
    });
    app.post('/v3/webrtc/sessions/kick/:id', kickHandler(sessions.webrtc));

    // ---------- MoQ ----------

    app.get('/v3/moq/sessions/list', (req, res) => res.json(paginate(sessions.moq, req.query)));
    app.get('/v3/moq/sessions/get/:id', (req, res) => {
        const s = sessions.moq.find((x) => x.id === req.params.id);
        if (!s) return notFound(res, 'session');
        res.json(s);
    });
    app.post('/v3/moq/sessions/kick/:id', kickHandler(sessions.moq));

    // ---------- Recordings ----------

    app.get('/v3/recordings/list', (req, res) => {
        res.json(paginate([...recordings.values()], req.query));
    });

    app.get('/v3/recordings/get/:name', (req, res) => {
        const r = recordings.get(req.params.name);
        if (!r) return notFound(res, 'recording');
        res.json(r);
    });

    app.delete('/v3/recordings/segments/delete', (req, res) => {
        const { path: p, start } = req.query;
        if (!p || !start) return badRequest(res, 'path and start are required');
        const r = recordings.get(p);
        if (!r) return notFound(res, 'recording');
        const before = r.segments.length;
        r.segments = r.segments.filter((s) => s.start !== start);
        if (r.segments.length === before) return notFound(res, 'segment');
        res.json({ status: 'ok' });
    });

    // ---------- 404 für unbekannte /v3-Endpoints ----------

    app.use('/v3', (req, res) => notFound(res, 'endpoint'));

    return app;
}

/**
 * Startet den Mock-Server.
 * @param {{ port?: number, itemCount?: number, log?: (msg: string) => void }} [options]
 * @returns {Promise<import('node:http').Server>}
 */
function startMockMediaMTX({ port = 9997, itemCount = 3, log = () => {} } = {}) {
    const app = createMockMediaMTX({ itemCount, log });
    return new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
            log(`[mock-mediamtx] listening on :${port} (itemCount=${itemCount})`);
            resolve(server);
        });
        server.on('error', reject);
    });
}

// Standalone: node server/test/mock-mediamtx.js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const port = parseInt(process.env.MOCK_PORT, 10) || 9997;
    const itemCount = parseInt(process.env.MOCK_ITEM_COUNT, 10) || 3;
    startMockMediaMTX({ port, itemCount, log: (m) => console.log(m) })
        .then(() => console.log(`[mock-mediamtx] ready on :${port}`))
        .catch((err) => {
            console.error('[mock-mediamtx] failed to start:', err.message);
            process.exit(1);
        });
}

export { createMockMediaMTX, startMockMediaMTX };
