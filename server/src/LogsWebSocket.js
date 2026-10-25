import { WebSocketServer } from 'ws';

/**
 * WebSocket-Server für den Live-Log-Stream, Endpunkt /logs.
 *
 * Läuft im noServer-Modus: er hängt NICHT direkt am httpServer und registriert
 * keinen eigenen upgrade-Listener. Das upgrade-Event wird zentral im Router
 * geroutet (Router.setupUpgradeRouting). So stört er Vites HMR-WebSocket nicht
 * (ein an den Server gebundener ws-Server würde fremde Upgrades mit 400 abbrechen).
 *
 * Protokoll (JSON):
 *   Server → Client:
 *     { type: 'history', data: [line, …] }  — einmalig auf Connect
 *     { type: 'line',    data: line }       — pro neuer Zeile
 *     { type: 'update',  data: line }       — letzte Zeile ersetzt (Mehrzeilen-Fortsetzung)
 *   line = { ts, level, message, raw }
 */
class LogsWebSocket {
    /**
     * @param {import('node:http').Server} httpServer - Referenz auf den HTTP-Server (Upgrade-Routing erfolgt zentral im Router)
     * @param {LogTailService} tailService
     * @param {Logger} [logger]
     */
    constructor(httpServer, tailService, logger) {
        this.label = '[LogsWebSocket]';
        this.logger = logger || { log: () => {}, error: () => {} };
        this.tailService = tailService;
        this.wss = new WebSocketServer({ noServer: true });
        this.wss.on('connection', (ws) => this.onConnection(ws));
        this.wss.on('error', (err) => this.logger.error(this.label, `wss error: ${err.message}`));
    }

    onConnection(ws) {
        this.logger.log(this.label, `Client verbunden (${this.wss.clients.size} aktiv)`);

        // 1) History senden (Ring-Buffer des tail-Service).
        const history = this.tailService.getHistory();
        ws.send(JSON.stringify({ type: 'history', data: history }));

        // 2) Auf neue Zeilen subscribe.
        const unsubscribe = this.tailService.addListener((line, kind) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: kind, data: line }));
            }
        });

        const cleanup = () => {
            unsubscribe();
            this.logger.log(this.label, `Client getrennt (${this.wss.clients.size} aktiv)`);
        };
        ws.on('close', cleanup);
        ws.on('error', cleanup);
    }

    /**
     * Beendet alle verbundenen Clients und schließt den WebSocket-Server.
     * Wichtig beim Shutdown: httpServer.close() wartet auf offene Sockets —
     * ohne terminate() würde der Prozess hängen bleiben.
     */
    close() {
        for (const client of this.wss.clients) {
            client.terminate();
        }
        this.wss.close();
    }
}

export { LogsWebSocket };
