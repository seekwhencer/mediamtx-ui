import {MediamtxConfig} from './MediamtxConfig.js';
import MediamtxProxy from './MediamtxProxy.js';

export default class MediaMTX {
    constructor(app) {
        this.app = app;
        // Proxy Mediamtx API
        this.apiUrlBase = `http://mediamtx:9997/v3`;

        // Mediamtx configuration management
        this.config = new MediamtxConfig(this);


        this.proxy = new MediamtxProxy(this, {
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

    }

    async getYaml() {
        return await this.config.getYaml();
    }

    async writeYaml() {
        return await this.config.writeYaml();
    }

}