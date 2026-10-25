
import express from 'express';
import { FrontendRouter } from './FrontendRouter.js';
import { SettingsRouter } from './SettingsRouter.js';
import { MediaMTXBridge } from '../MediaMTXBridge.js';
import { MediaMTXConfigStore } from '../MediaMTXConfigStore.js';
import { LogTailService } from '../LogTailService.js';
import { LogsWebSocket } from '../LogsWebSocket.js';

/**
 * Main router class that aggregates all server routes.
 * Order is mandatory: /health → Settings → MediaMTXBridge → FrontendRouter (catch-all last).
 */
class Router {
    /**
     * @param {Config} config - Configuration object
     * @param {import('node:http').Server} httpServer - HTTP server instance
     * @param {Logger} [logger] - Logger instance
     */
    constructor(config, httpServer, logger) {
        this.config = config;
        this.httpServer = httpServer;
        this.label = '[Router]';
        this.logger = logger || { log: () => {}, error: () => {} };

        this.router = express.Router();
        this.router.use(express.json());
    }

    /**
     * Defines all routes in the required order:
     * 1. /health (before the frontend catch-all)
     * 2. SettingsRouter (server-eigene Endpunkte)
     * 3. MediaMTXBridge (agnostic proxy, before the frontend)
     * 4. FrontendRouter (catch-all, MUST come last)
     * @returns {Promise<void>}
     */
    async define() {

        // 1. Health
        this.router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

        // 1b. Log-Monitor: tail-Child-Process + WebSocket (/logs).
        //     Kein Express-Route — der WebSocket hängt direkt am httpServer.
        this.tailService = new LogTailService(this.config, this.logger);
        this.logsWs = new LogsWebSocket(this.httpServer, this.tailService, this.logger);
        this.tailService.start(); // no-op, wenn mediamtxLogPath leer

        // 2. Settings (server-eigene Endpunkte)
        this.settingsRouter = new SettingsRouter(this.config, this.logger);
        this.router.use(this.settingsRouter.router);

        // 3. MediaMTX-Bridge (agnostischer Proxy) — VOR dem Frontend.
        this.bridge = new MediaMTXBridge(this.config, this.logger);
        this.router.use(`/${this.config.mediamtxApiVersion || 'v3'}`, this.bridge.router());

        // 3b. Config-Store: persistiert die MediaMTX-Config nach erfolgreichen Config-Mutationen.
        this.configStore = new MediaMTXConfigStore(this.config, this.logger, () => this.bridge.client);
        this.bridge.onConfigMutated = () => this.configStore.save();

        // 4. Runtime-Anwendung verdrahten (Bridge muss existieren)
        this.settingsRouter.setApplier(() => {
            this.bridge.applyConfig(this.config);
            this.logger.setVerbose(this.config.verbose);
        });

        // 5. Frontend (Catch-all, MUSS zuletzt kommen)
        const frontendRouter = new FrontendRouter(this.config, this.httpServer, this.logger);
        await frontendRouter.init();
        this.router.use('/', frontendRouter.router);
    }
}

export { Router };
