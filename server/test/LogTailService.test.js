import { describe, it, expect } from 'vitest';
import { LogTailService, parseLine } from '../src/LogTailService.js';

const noopLogger = { log: () => {}, error: () => {} };

function makeService(opts = {}) {
    return new LogTailService({ mediamtxLogPath: '' }, noopLogger, opts);
}

describe('parseLine', () => {
    it('parst INF-Zeile (MediaMTX-Format mit /) → ts, level, message', () => {
        const line = parseLine('2026/10/24 23:58:12 INF [HLS] [session f1e17dfe] created by 172.18.0.1:44640');
        expect(line).toEqual({
            ts: '2026/10/24 23:58:12',
            level: 'INF',
            message: '[HLS] [session f1e17dfe] created by 172.18.0.1:44640',
            raw: '2026/10/24 23:58:12 INF [HLS] [session f1e17dfe] created by 172.18.0.1:44640',
        });
    });

    it('parst INF-Zeile mit - als Datums-Trennzeichen', () => {
        const line = parseLine('2026-10-24 23:58:12 INF [HLS] [session f1e17dfe] created by 172.18.0.1:44640');
        expect(line.level).toBe('INF');
        expect(line.message).toBe('[HLS] [session f1e17dfe] created by 172.18.0.1:44640');
    });

    it('parst WAR-Zeile (MediaMTX-Level)', () => {
        const line = parseLine('2026-10-25 00:03:41 WAR [HLS] [muxer two] segment duration changed');
        expect(line.level).toBe('WAR');
        expect(line.message).toBe('[HLS] [muxer two] segment duration changed');
    });

    it('parst ERR- und DBG-Zeilen', () => {
        expect(parseLine('2026-10-25 00:00:00 ERR [core] boom').level).toBe('ERR');
        expect(parseLine('2026-10-25 00:00:00 DBG [core] detail').level).toBe('DBG');
    });

    it('liefert null für Zeilen ohne Level-Match (Fortsetzung)', () => {
        expect(parseLine('    at foo (bar.js:1:1)')).toBeNull();
        expect(parseLine('kein format')).toBeNull();
    });
});

describe('LogTailService', () => {
    it('Mehrzeilen: Zeile ohne Level-Match wird an die vorherige angehängt (update)', () => {
        const svc = makeService();
        const events = [];
        svc.addListener((line, kind) => events.push({ kind, line }));

        svc.handleData('2026-10-25 00:00:00 ERR [core] panic: boom\n');
        svc.handleData('    at foo (bar.js:1:1)\n');

        expect(svc.getHistory()).toHaveLength(1);
        expect(svc.getHistory()[0].message).toBe('[core] panic: boom\n    at foo (bar.js:1:1)');
        expect(events.map((e) => e.kind)).toEqual(['line', 'update']);
        expect(events[1].line.message).toBe('[core] panic: boom\n    at foo (bar.js:1:1)');
    });

    it('Zeile ohne Level-Match ohne Vorgänger → raw-Zeile (ts/level null)', () => {
        const svc = makeService();
        svc.handleData('orphan line\n');
        expect(svc.getHistory()).toEqual([{ ts: null, level: null, message: 'orphan line', raw: 'orphan line' }]);
    });

    it('Ring-Buffer: > maxBuffer Zeilen → älteste werden verworfen', () => {
        const svc = makeService({ maxBuffer: 3 });
        for (let i = 1; i <= 5; i++) {
            svc.handleData(`2026-10-25 00:00:0${i} INF [core] line ${i}\n`);
        }
        const history = svc.getHistory();
        expect(history).toHaveLength(3);
        expect(history.map((l) => l.message)).toEqual(['[core] line 3', '[core] line 4', '[core] line 5']);
    });

    it('Broadcast: Listener bekommt jede push()-Zeile', () => {
        const svc = makeService();
        const seen = [];
        svc.addListener((line) => seen.push(line));

        svc.handleData('2026-10-25 00:00:01 INF [core] a\n2026-10-25 00:00:02 INF [core] b\n');

        expect(seen).toHaveLength(2);
        expect(seen[0].message).toBe('[core] a');
        expect(seen[1].message).toBe('[core] b');
    });

    it('Partial-Puffering: Chunk ohne abschließendes \\n → erst bei nächstem Chunk emittiert', () => {
        const svc = makeService();
        const seen = [];
        svc.addListener((line) => seen.push(line));

        svc.handleData('2026-10-25 00:00:01 INF [core] par');
        expect(seen).toHaveLength(0);

        svc.handleData('tial\n');
        expect(seen).toHaveLength(1);
        expect(seen[0].message).toBe('[core] partial');
    });

    it('Unsubscribe-Funktion entfernt den Listener', () => {
        const svc = makeService();
        const seen = [];
        const unsubscribe = svc.addListener((line) => seen.push(line));
        unsubscribe();

        svc.handleData('2026-10-25 00:00:01 INF [core] a\n');

        expect(seen).toHaveLength(0);
        expect(svc.getHistory()).toHaveLength(1);
    });

    it('resolveLogPath: leer → null, gesetzt → absoluter Pfad', () => {
        const off = makeService();
        expect(off.resolveLogPath()).toBeNull();

        const on = new LogTailService({ mediamtxLogPath: '../data/mediamtx/mediamtx.log' }, noopLogger);
        expect(on.resolveLogPath()).toMatch(/data\/mediamtx\/mediamtx\.log$/);
    });

    it('start() ohne Pfad → kein Prozess (no-op)', () => {
        const svc = makeService();
        svc.start();
        expect(svc.proc).toBeNull();
    });
});
