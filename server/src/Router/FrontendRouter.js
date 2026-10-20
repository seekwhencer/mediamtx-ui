import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Frontend router that serves static files and the Vite dev server.
 * In development mode, a Vite server is integrated as middleware.
 */
class FrontendRouter {
    /**
     * @param {Config} config - Configuration object
     * @param {import('node:http').Server} httpServer - HTTP server instance
     * @param {Logger} [logger] - Logger instance
     */
    constructor(config, httpServer, logger) {
        this.config = config;
        this.httpServer = httpServer;
        this.label = '[FrontendRouter]';
        this.logger = logger || { log: () => {}, error: () => {} };

        this.router = express.Router();
        this.router.use(express.json());

        this.projectRoot = this.resolveProjectRoot();
        this.uiDir = this.config?.uiDir || 'frontend';
        this.buildDir = path.resolve(this.projectRoot, this.config?.uiBuildDir || 'frontend/dist');
        this.viteServer = null;
    }

    /**
     * Resolves the project root (the directory containing the frontend app)
     * by walking up from this file until frontend/index.html is found.
     * @returns {string}
     */
    resolveProjectRoot() {
        let dir = __dirname;
        for (let i = 0; i < 6; i++) {
            if (fs.existsSync(path.join(dir, 'frontend', 'index.html'))) {
                return dir;
            }
            const parent = path.dirname(dir);
            if (parent === dir) break;
            dir = parent;
        }
        return path.resolve(__dirname, '..', '..', '..');
    }

    /**
     * True for paths the Vite dev server must handle itself (assets, modules,
     * internal endpoints). Everything else is an SPA route → index.html.
     * @param {string} url
     * @returns {boolean}
     */
    isAssetPath(url) {
        const p = (url || '').split('?')[0].split('#')[0];
        return (
            p.startsWith('/@') ||
            p.startsWith('/src/') ||
            p.startsWith('/node_modules/') ||
            p.startsWith('/@fs') ||
            p === '/favicon.ico' ||
            /\.[a-zA-Z0-9]{1,8}$/.test(p)
        );
    }

    /**
     * Initializes the frontend router: Vite dev server in development mode, static files in production mode.
     * @returns {Promise<void>}
     */
    async init() {

        if (process.env.NODE_ENV === 'development') {
            this.viteServer = await this.getViteServer();
            if (this.viteServer) {
                // SPA-Fallback: Deep-Links (z. B. /paths) liefern index.html statt 404.
                // Wird VOR der Vite-Middleware registriert; Asset-Pfade gehen an Vite.
                const serveIndex = async (req, res) => {
                    const indexPath = path.resolve(this.projectRoot, this.uiDir, 'index.html');
                    let html = fs.readFileSync(indexPath, 'utf-8');
                    html = await this.viteServer.transformIndexHtml(req.url, html);
                    res.send(html);
                };
                this.router.get('/', serveIndex);
                this.router.get('/*splat', (req, res, next) => {
                    if (this.isAssetPath(req.url)) return next();
                    serveIndex(req, res);
                });
                this.router.use(this.viteServer.middlewares);
            } else {
                this.router.get('/', (req, res) => {
                    const indexPath = path.resolve(this.projectRoot, this.uiDir, 'index.html');
                    res.sendFile(indexPath);
                });
            }
        } else {
            this.router.use(express.static(this.buildDir));
            this.router.get('/*splat', (req, res) => {
                res.sendFile(path.join(this.buildDir, 'index.html'));
            });
        }

    }

    /**
     * Starts a Vite dev server in middleware mode.
     * @returns {Promise<import('vite').ViteDevServer | null>}
     */
    async getViteServer() {
        try {
            const uiRoot = path.resolve(this.projectRoot, this.uiDir);
            const require = createRequire(path.join(uiRoot, 'package.json'));
            const vite = await import(require.resolve('vite'));
            return await vite.createServer({
                root: uiRoot,
                server: {
                    middlewareMode: true,
                    ws: this.httpServer ? { server: this.httpServer } : {}
                },
                appType: 'custom'
            });
        } catch (e) {
            this.logger.error(this.label, 'Vite dev server unavailable, falling back to static index.html', { error: e.message });
            return null;
        }
    }
}

export { FrontendRouter };
