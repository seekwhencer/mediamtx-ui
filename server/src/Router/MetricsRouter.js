import express from 'express';

/**
 * Server-eigener Metrics-Endpunkt (nicht an MediaMTX-API proxied).
 * GET /api/metrics → normalisierter Snapshot (PLAN_METRICS.md §3.2/§4.1)
 *
 * Fehler:
 *   502 { success: false, error, code: 'upstream_unreachable' }
 *   504 { success: false, error, code: 'upstream_timeout' }
 */
class MetricsRouter {
    /**
     * @param {MetricsService} metricsService
     * @param {Logger} [logger]
     */
    constructor(metricsService, logger) {
        this.metricsService = metricsService;
        this.label = '[MetricsRouter]';
        this.logger = logger || { log: () => {}, error: () => {} };
        this.router = express.Router();

        this.router.get('/api/metrics', this.handleGet.bind(this));
    }

    async handleGet(req, res) {
        try {
            const data = await this.metricsService.fetchSnapshot();
            res.status(200).json({ success: true, data });
        } catch (err) {
            const status = err.code === 'upstream_timeout' ? 504 : 502;
            this.logger.error(this.label, `GET /api/metrics -> ${status}: ${err.message}`);
            res.status(status).json({ success: false, error: err.message, code: err.code || 'upstream_unreachable' });
        }
    }
}

export { MetricsRouter };
