import MediamtxProxy from "./MediamtxProxy.js";

export default class MediamtxMetricsProxy extends MediamtxProxy {
    constructor(...args) {
        super(...args);

        this.routes = [
            'GET /',
        ];

        this.router = this.express.Router();
        this._register();
    }
}