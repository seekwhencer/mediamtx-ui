import express from 'express';

/**
 * Server-eigene Settings-Endpunkte (nicht an MediaMTX proxied).
 * GET   /api/settings → aktuelle Settings (Secrets maskiert)
 * PATCH /api/settings → Partial-Patch anwenden + persistieren
 */
class SettingsRouter {
    /**
     * @param {Config} config
     * @param {Logger} [logger]
     */
    constructor(config, logger) {
        this.config = config;
        this.label = '[SettingsRouter]';
        this.logger = logger || { log: () => {}, error: () => {} };
        this.router = express.Router();
        this.applier = null; // wird vom Router gesetzt, sobald die Bridge existiert

        this.router.get('/api/settings', this.handleGet.bind(this));
        this.router.patch('/api/settings', this.handlePatch.bind(this));
    }

    /** Wird vom Router aufgerufen, wenn die Bridge verfügbar ist. */
    setApplier(fn) {
        this.applier = fn;
    }

    handleGet(req, res) {
        res.status(200).json({ success: true, data: this.config.getSettings() });
    }

    handlePatch(req, res) {
        try {
            const result = this.config.updateSettings(req.body || {});
            if (this.applier) this.applier();
            this.logger.log(this.label,
                `Settings updated: applied=[${result.applied.join(', ')}] restart=[${result.restartRequired.join(', ')}]`);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            const status = err.status || 500;
            this.logger.error(this.label, `Settings update failed: ${err.message}`);
            res.status(status).json({ success: false, error: err.message, code: err.code || 'internal_error' });
        }
    }
}

export { SettingsRouter };
