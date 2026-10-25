import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from 'node:http';
import WebSocket from 'ws';
import { LogTailService } from '../src/LogTailService.js';
import { LogsWebSocket } from '../src/LogsWebSocket.js';

const noopLogger = { log: () => {}, error: () => {} };

function makeLine(n) {
    return { ts: `2026-10-25 00:00:0${n}`, level: 'INF', message: `[core] line ${n}`, raw: `2026-10-25 00:00:0${n} INF [core] line ${n}` };
}

describe('LogsWebSocket', () => {
    let httpServer;
    let tailService;
    let logsWs;
    let port;

    beforeEach(async () => {
        httpServer = createServer();
        await new Promise((resolve) => httpServer.listen(0, resolve));
        port = httpServer.address().port;

        tailService = new LogTailService({ mediamtxLogPath: '' }, noopLogger);
        logsWs = new LogsWebSocket(httpServer, tailService, noopLogger);
    });

    afterEach(() => {
        tailService.stop();
        logsWs.wss.close();
        httpServer.close();
    });

    function connect() {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://127.0.0.1:${port}/logs`);
            const messages = [];
            ws.on('message', (data) => messages.push(JSON.parse(data.toString())));
            ws.on('open', () => resolve({ ws, messages }));
            ws.on('error', reject);
        });
    }

    it('Connect → Client erhält { type: "history", data: [...] }', async () => {
        tailService.push(makeLine(1));
        tailService.push(makeLine(2));

        const { ws, messages } = await connect();
        expect(messages[0].type).toBe('history');
        expect(messages[0].data).toHaveLength(2);
        expect(messages[0].data[0].message).toBe('[core] line 1');
        ws.close();
    });

    it('Live: tailService.push(line) → Client erhält { type: "line", data: line }', async () => {
        const { ws, messages } = await connect();
        expect(messages[0].type).toBe('history');

        tailService.push(makeLine(9));
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(messages[1]).toEqual({ type: 'line', data: makeLine(9) });
        ws.close();
    });

    it('Mehrzeilen: Fortsetzung → Client erhält { type: "update", data: line }', async () => {
        tailService.push(makeLine(1));

        const { ws, messages } = await connect();
        expect(messages[0].type).toBe('history');

        tailService.handleData('    at foo (bar.js:1:1)\n');
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(messages[1].type).toBe('update');
        expect(messages[1].data.message).toBe('[core] line 1\n    at foo (bar.js:1:1)');
        ws.close();
    });

    it('Disconnect: ws.close() → Listener wird unsubscribed (kein Leak)', async () => {
        const { ws } = await connect();
        expect(tailService.listeners.size).toBe(1);

        ws.close();
        await new Promise((resolve) => ws.on('close', resolve));
        await new Promise((resolve) => setTimeout(resolve, 50)); // server-seitiges cleanup-Event

        expect(tailService.listeners.size).toBe(0);
    });

    it('close(): verbundene Clients werden terminated (Shutdown ohne Hängenbleiben)', async () => {
        const { ws } = await connect();
        expect(tailService.listeners.size).toBe(1);

        logsWs.close();

        await new Promise((resolve) => {
            ws.on('close', resolve);
            setTimeout(resolve, 500); // Fallback, falls close-Event ausbleibt
        });

        expect(tailService.listeners.size).toBe(0);
    });

    it('Mehrere Clients: jeder bekommt History + Live-Stream', async () => {
        tailService.push(makeLine(1));

        const a = await connect();
        const b = await connect();

        tailService.push(makeLine(2));
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(a.messages.filter((m) => m.type === 'line')).toHaveLength(1);
        expect(b.messages.filter((m) => m.type === 'line')).toHaveLength(1);
        expect(b.messages[0].type).toBe('history');
        expect(b.messages[0].data[0].message).toBe('[core] line 1');

        a.ws.close();
        b.ws.close();
    });
});
