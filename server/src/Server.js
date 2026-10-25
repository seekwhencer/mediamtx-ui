import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import { Router } from './Router/index.js';

/**
 * Main server class
 * 
 */
export class Server {
    /**
     * @param {object} config - Configuration object
     * @param {Logger} [logger] - Logger instance
     */
    constructor(config, logger) {
        this.config = config;
        this.label = '[Server]';
        this.logger = logger || { log: () => {}, error: () => {} };

        // create
        this.app = express();
        this.httpServer = createHttpServer(this.app);

        // security headers on every response (covers all routes, 404 and 500 handlers)
        this.app.use((req, res, next) => {
            res.setHeader('X-Frame-Options', 'DENY');

            if (process.env.NODE_ENV === 'production') {
                res.setHeader("Content-Security-Policy", "default-src 'self'");
            }
            res.setHeader('X-Content-Type-Options', 'nosniff');
            next();
        });
   }

    /**
     * Starts the HTTP server 
     * Registers signal handlers for clean shutdown.
     * @returns {Promise<void>}
     */
    async start() {
        // append the routes
        this.router = new Router(this.config, this.httpServer, this.logger);
        await this.router.define();
        this.app.use(this.router.router);

        // 404
        this.app.use((req, res) => {
            res.status(404).json({ error: 'Not found', status: 'error', code: 'not_found' });
        });

        // 500 (zentraler Error-Handler)
        this.app.use((error, req, res, next) => {
            const status = error.status || 500;
            const code = error.code || 'internal_error';
            if (status >= 500) {
                this.logger.error(this.label, 'Error', { error: error.message, code });
            }
            res.status(status).json({ error: error.message, status: 'error', code });
        });

        this.httpServer.listen(this.config.serverPort, () => {
            this.logger.log(this.label,`Server running on port ${this.config.serverPort}`);
        });

        const shutdown = async () => {
            this.logger.log(this.label, 'Shutting down...');
            this.router?.logsWs?.close(); // WS-Clients terminate (sonst hängt httpServer.close())
            this.router?.tailService?.stop(); // tail-Child-Process SIGTERM
            this.httpServer.close(() => process.exit(0));
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

        // something goes wrong ;)
        process.on('unhandledRejection', (reason) => {
            this.logger.error(this.label, 'Unhandled Rejection', { reason: reason?.message, ...reason });
        });
    }

}
