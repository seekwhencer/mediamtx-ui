import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { MetricsService } from '../src/MetricsService.js';
import { Config } from '../src/Config.js';
import { createMockMediaMTX } from './mock-mediamtx.js';

// Test-Helfer (ausgenommen von der Klassen-Konvention).

const noopLogger = { log: () => {}, error: () => {} };

// Statische Prometheus-Textprobe (PLAN_METRICS.md §3.1).
const SAMPLE_TEXT = [
    '# Paths',
    'paths{name="cam1",state="online"} 1',
    'paths_readers{name="cam1",state="online",readerType="hlsSession"} 3',
    'paths_inbound_bytes{name="cam1",state="online"} 123456',
    'paths_outbound_bytes{name="cam1",state="online"} 654321',
    'paths_inbound_frames_in_error{name="cam1",state="online"} 0',
    '',
    '# HLS',
    'hls_muxers{name="cam1"} 1',
    'hls_sessions{id="abc",path="cam1"} 1',
    'hls_sessions_outbound_bytes{id="abc",path="cam1"} 187',
    '',
    '# RTSP / RTMP / SRT / WebRTC / MoQ',
    'rtsp_conns{id="def"} 1',
    'rtsp_conns_inbound_bytes{id="def"} 100',
    'rtmp_conns{id="ghi",path="cam1",state="publish"} 1',
    'srt_conns{id="jkl",path="cam1",state="read"} 1',
    'webrtc_sessions{id="mno",path="cam1",state="read"} 1',
    'moq_sessions{id="pqr",path="cam1",state="read"} 1',
    '',
    '# Forward',
    'forward_dests{pos="1",id="stu",path="cam1",type="rtmp",state="forwarding"} 1',
    'forward_dests_outbound_bytes{pos="1",id="stu",path="cam1",type="rtmp",state="forwarding"} 4096',
    '',
].join('\n');

function makeConfig() {
    const dir = mkdtempSync(join(tmpdir(), 'mtxui-metrics-'));
    const configPath = join(dir, 'config.json');
    const config = new Config({ CONFIG_PATH: configPath }, noopLogger);
    return { config, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

describe('MetricsService.parsePrometheus', () => {
    it('parst gültigen Text zu einer korrekten Map', () => {
        const series = MetricsService.parsePrometheus(SAMPLE_TEXT);

        expect(series.get('paths')).toEqual([
            { labels: { name: 'cam1', state: 'online' }, value: 1 },
        ]);
        expect(series.get('paths_readers')[0].labels.readerType).toBe('hlsSession');
        expect(series.get('paths_inbound_bytes')[0].value).toBe(123456);
        expect(series.get('hls_sessions_outbound_bytes')[0].value).toBe(187);
        expect(series.get('forward_dests')[0].labels.id).toBe('stu');
        expect(series.has('unknown_metric')).toBe(false);
    });

    it('ignoriert # -Kommentarzeilen und leere Zeilen', () => {
        const series = MetricsService.parsePrometheus('# comment\n\n   \nup 1\n# HELP up\n');
        expect(series.size).toBe(1);
        expect(series.get('up')).toEqual([{ labels: {}, value: 1 }]);
    });

    it('behandelt Labels mit Sonderzeichen und Escapes', () => {
        const text = [
            'm{name="cam 1",state="on line"} 1',
            'm{name="a\\"b"} 2',
            'm{name="a\\\\b"} 3',
            'm{name="a\\nb"} 4',
        ].join('\n');
        const series = MetricsService.parsePrometheus(text);
        const values = series.get('m').map((s) => s.labels.name);

        expect(values).toEqual(['cam 1', 'a"b', 'a\\b', 'a\nb']);
    });

    it('erlaubt Serien ohne Labels', () => {
        const series = MetricsService.parsePrometheus('up 1\nprocess_cpu 0.5\n');
        expect(series.get('up')).toEqual([{ labels: {}, value: 1 }]);
        expect(series.get('process_cpu')[0].value).toBe(0.5);
    });

    it('ignoriert Zeilen ohne gültiges Format', () => {
        const series = MetricsService.parsePrometheus('garbage line\nup 1\n');
        expect(series.size).toBe(1);
    });
});

describe('MetricsService.buildSnapshot', () => {
    const now = Date.parse('2026-10-26T11:00:00.000Z');

    it('baut Totals, Paths, Protocols und ForwardDests korrekt', () => {
        const series = MetricsService.parsePrometheus(SAMPLE_TEXT);
        const snap = MetricsService.buildSnapshot(series, null, now);

        expect(snap.ts).toBe('2026-10-26T11:00:00.000Z');
        expect(snap.totals).toEqual({
            pathsOnline: 1,
            pathsAvailable: 1,
            readers: 3,
            inboundBytes: 123456,
            outboundBytes: 654321,
            inboundBytesPerSec: 0,
            outboundBytesPerSec: 0,
            inboundFramesInError: 0,
        });
        expect(snap.paths).toEqual([
            {
                name: 'cam1',
                state: 'online',
                readers: 3,
                inboundBytes: 123456,
                outboundBytes: 654321,
                inboundFramesInError: 0,
            },
        ]);
        expect(snap.protocols).toEqual({
            hls: { muxers: 1, sessions: 1, outboundBytes: 187 },
            rtsp: { conns: 1, sessions: 0, inboundBytes: 100, outboundBytes: 0 },
            rtmp: { conns: 1, inboundBytes: 0, outboundBytes: 0 },
            srt: { conns: 1, inboundBytes: 0, outboundBytes: 0 },
            webrtc: { sessions: 1, inboundBytes: 0, outboundBytes: 0 },
            moq: { sessions: 1, inboundBytes: 0, outboundBytes: 0 },
        });
        expect(snap.forwardDests).toEqual([
            { id: 'stu', path: 'cam1', type: 'rtmp', state: 'forwarding', outboundBytes: 4096 },
        ]);
    });

    it('mappt das reale MediaMTX-Format (Global-Gauges, state=ready, SRT-Fallback-Namen)', () => {
        const text = [
            'paths{name="one",state="ready"} 1',
            'paths{name="two",state="notReady"} 1',
            'paths_readers{name="one",readerType="",state="ready"} 2',
            'paths_readers{name="two",readerType="",state="notReady"} 0',
            'paths_inbound_bytes{name="one",state="ready"} 1000',
            'paths_outbound_bytes{name="one",state="ready"} 500',
            'paths_inbound_frames_in_error{name="one",state="ready"} 1',
            'paths_inbound_bytes{name="two",state="notReady"} 0',
            'paths_outbound_bytes{name="two",state="notReady"} 0',
            'paths_inbound_frames_in_error{name="two",state="notReady"} 0',
            'hls_sessions 2',
            'hls_sessions_outbound_bytes 123',
            'hls_muxers 1',
            'rtsp_conns 3',
            'rtsp_conns_inbound_bytes 456',
            'rtsp_conns_outbound_bytes 789',
            'srt_conns 1',
            'srt_conns_bytes_received 111',
            'srt_conns_bytes_sent 222',
        ].join('\n');
        const series = MetricsService.parsePrometheus(text);
        const snap = MetricsService.buildSnapshot(series, null, now);

        expect(snap.totals.pathsOnline).toBe(1);
        expect(snap.totals.pathsAvailable).toBe(1);
        expect(snap.totals.readers).toBe(2);
        expect(snap.totals.inboundBytes).toBe(1000);
        expect(snap.totals.outboundBytes).toBe(500);
        expect(snap.totals.inboundFramesInError).toBe(1);
        expect(snap.paths).toHaveLength(2);
        expect(snap.paths[0]).toEqual({
            name: 'one', state: 'ready', readers: 2,
            inboundBytes: 1000, outboundBytes: 500, inboundFramesInError: 1,
        });
        expect(snap.paths[1].state).toBe('notReady');
        expect(snap.protocols.hls).toEqual({ muxers: 1, sessions: 2, outboundBytes: 123 });
        expect(snap.protocols.rtsp).toEqual({ conns: 3, sessions: 0, inboundBytes: 456, outboundBytes: 789 });
        expect(snap.protocols.srt).toEqual({ conns: 1, inboundBytes: 111, outboundBytes: 222 });
    });

    it('berechnet Throughput aus der Delta zu prev', () => {
        const series = new Map([
            ['paths_inbound_bytes', [{ labels: { name: 'cam1' }, value: 1500 }]],
            ['paths_outbound_bytes', [{ labels: { name: 'cam1' }, value: 3000 }]],
        ]);
        const prev = {
            ts: new Date(now - 5000).toISOString(),
            totals: { inboundBytes: 1000, outboundBytes: 2000 },
        };

        const snap = MetricsService.buildSnapshot(series, prev, now);

        expect(snap.totals.inboundBytesPerSec).toBeCloseTo(100, 5);
        expect(snap.totals.outboundBytesPerSec).toBeCloseTo(200, 5);
    });

    it('liefert Throughput 0 ohne prev', () => {
        const series = new Map([
            ['paths_inbound_bytes', [{ labels: {}, value: 1500 }]],
        ]);
        const snap = MetricsService.buildSnapshot(series, null, now);
        expect(snap.totals.inboundBytesPerSec).toBe(0);
        expect(snap.totals.outboundBytesPerSec).toBe(0);
    });

    it('liefert Throughput 0 bei Δt = 0', () => {
        const series = new Map([
            ['paths_inbound_bytes', [{ labels: {}, value: 1500 }]],
        ]);
        const prev = {
            ts: new Date(now).toISOString(),
            totals: { inboundBytes: 1000, outboundBytes: 2000 },
        };
        const snap = MetricsService.buildSnapshot(series, prev, now);
        expect(snap.totals.inboundBytesPerSec).toBe(0);
        expect(snap.totals.outboundBytesPerSec).toBe(0);
    });

    it('klemmt negative Deltas auf 0 (Zähler-Reset)', () => {
        const series = new Map([
            ['paths_inbound_bytes', [{ labels: {}, value: 100 }]],
        ]);
        const prev = {
            ts: new Date(now - 1000).toISOString(),
            totals: { inboundBytes: 1000, outboundBytes: 0 },
        };
        const snap = MetricsService.buildSnapshot(series, prev, now);
        expect(snap.totals.inboundBytesPerSec).toBe(0);
    });
});

describe('MetricsService.fetchSnapshot', () => {
    let ctx;
    let server;
    let base;
    let service;

    beforeEach(async () => {
        ctx = makeConfig();
        const app = createMockMediaMTX();
        server = app.listen(0);
        await new Promise((resolve) => server.once('listening', resolve));
        base = `http://127.0.0.1:${server.address().port}`;
        ctx.config.mediamtxMetricsUrl = base;
        service = new MetricsService(ctx.config, noopLogger);
    });

    afterEach(() => {
        server.close();
        ctx.cleanup();
    });

    it('holt 200 → Snapshot und merkt last/lastTs', async () => {
        const snap = await service.fetchSnapshot();

        expect(snap.totals.pathsOnline).toBe(1);
        expect(snap.totals.readers).toBe(3);
        expect(snap.paths[0].name).toBe('cam1');
        expect(snap.forwardDests[0].outboundBytes).toBe(4096);
        expect(service.last).toBe(snap);
        expect(service.lastTs).toBeGreaterThan(0);
    });

    it('liefert den Mock-Text auch über ?mockError=500 als HTTP 500', async () => {
        const res = await fetch(`${base}/metrics?mockError=500`);
        expect(res.status).toBe(500);
    });

    it('wirft bei HTTP 500 mit code upstream_unreachable', async () => {
        const stub = http.createServer((req, res) => {
            res.statusCode = 500;
            res.end('boom');
        });
        await new Promise((resolve) => stub.listen(0, resolve));
        const stubBase = `http://127.0.0.1:${stub.address().port}`;
        ctx.config.mediamtxMetricsUrl = stubBase;

        let thrown = null;
        try {
            await service.fetchSnapshot();
        } catch (err) {
            thrown = err;
        }
        stub.close();

        expect(thrown).not.toBeNull();
        expect(thrown.code).toBe('upstream_unreachable');
        expect(thrown.message).toContain('HTTP 500');
    });

    it('wirft bei Timeout mit code upstream_timeout', async () => {
        const hanging = http.createServer(() => { /* antwortet nie */ });
        await new Promise((resolve) => hanging.listen(0, resolve));
        const hangingBase = `http://127.0.0.1:${hanging.address().port}`;
        ctx.config.mediamtxMetricsUrl = hangingBase;
        ctx.config.mediamtxBridgeTimeout = 300;

        let thrown = null;
        try {
            await service.fetchSnapshot();
        } catch (err) {
            thrown = err;
        }
        hanging.close();

        expect(thrown).not.toBeNull();
        expect(thrown.code).toBe('upstream_timeout');
        expect(thrown.message).toContain('timed out');
    });

    it('wirft bei ECONNREFUSED mit code upstream_unreachable', async () => {
        const closed = http.createServer(() => {});
        await new Promise((resolve) => closed.listen(0, resolve));
        const closedBase = `http://127.0.0.1:${closed.address().port}`;
        closed.close();
        ctx.config.mediamtxMetricsUrl = closedBase;

        let thrown = null;
        try {
            await service.fetchSnapshot();
        } catch (err) {
            thrown = err;
        }

        expect(thrown).not.toBeNull();
        expect(thrown.code).toBe('upstream_unreachable');
    });
});
