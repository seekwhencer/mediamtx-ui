import {MediamtxConfig} from './MediamtxConfig.js';
import MediamtxApiProxy from './MediamtxApiProxy.js';
import MediamtxMetricsProxy from "./MediamtxMetricsProxy.js";

export default class MediaMTX {
    constructor(app) {
        this.app = app;

        // Proxy Mediamtx API
        this.apiUrlBase = this.app.mediamtxApiUrlBase;
        this.metricsUrlBase = this.app.mediamtxMetricsUrlBase;

        // Mediamtx configuration management
        this.config = new MediamtxConfig(this);

        this.proxy = new MediamtxApiProxy(this, {
            targetBaseUrl: this.apiUrlBase,
            apiUser: false,
            apiPassword: false,

            // optional: eigene Auth (JWT, API-Key, whatever)
            beforeProxy: (req, res) => {
                /*if (req.headers["x-api-key"] !== "meinkey") {
                    res.status(401).json({ error: "Unauthorized" });
                    return false;
                }*/
                return true;
            }
        });

        this.metrics = new MediamtxMetricsProxy(this, {
            targetBaseUrl: this.metricsUrlBase,
            apiUser: false,
            apiPassword: false,

            // optional: eigene Auth (JWT, API-Key, whatever)
            beforeProxy: (req, res) => {
                /*if (req.headers["x-api-key"] !== "meinkey") {
                    res.status(401).json({ error: "Unauthorized" });
                    return false;
                }*/
                return true;
            }
        });



    }

    async getYaml() {
        return await this.config.getYaml();
    }

    async writeYaml() {
        return await this.config.writeYaml();
    }

}