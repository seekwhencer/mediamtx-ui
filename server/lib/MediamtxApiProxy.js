import MediamtxProxy from "./MediamtxProxy.js";

export default class MediamtxApiProxy extends MediamtxProxy {
    constructor(...args) {
        super(...args);

        this.routes = [
            'GET /info',
            'POST /auth/jwks/refresh',

            'GET /config/global/get',
            'PATCH /config/global/patch',
            'GET /config/pathdefaults/get',
            'PATCH /config/pathdefaults/patch',

            'GET /config/paths/list',
            'GET /config/paths/get/:name',
            'POST /config/paths/add/:name',
            'PATCH /config/paths/patch/:name',
            'POST /config/paths/replace/:name',
            'DELETE /config/paths/delete/:name',

            'GET /hlsmuxers/list',
            'GET /hlsmuxers/get/:name',

            'GET /paths/list',
            'GET /paths/get/:name',

            'GET /rtspconns/list',
            'GET /rtspconns/get/:id',

            'GET /rtspsessions/list',
            'GET /rtspsessions/get/:id',
            'POST /rtspsessions/kick/:id'
        ];

        this.router = this.express.Router();
        this._register();

    }
}