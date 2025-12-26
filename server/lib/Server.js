import express from "express";
import session from "express-session";
import csrf from "csurf";

import Events from './EventEmitter.js';
import Routes from "./Routes/index.js";
import AuthRoutes from "./Routes/Auth.js";

export default class Server extends Events {
    constructor(app) {
        super();

        this.app = app;
        this.mediamtx = this.app.mediamtx;
        this.publicDir = this.app.publicDir;
        this.dataDir = this.app.dataDir;

        this.port = process.env.SERVER_PORT || 3000;

        this.engine = express();
        this.engine.use(express.json());
        this.engine.use(express.static(this.publicDir));

        this.csrfProtection = csrf();

        this.engine.set("trust proxy", 1);

        // session cookie
        this.engine.use(session({
            name: "sid",
            secret: process.env.SESSION_SECRET || 'hossadiewaldfee',
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/"
            }
        }));

        // authentication
        this.authRoutes = new AuthRoutes(this);
        this.engine.use('/auth', this.authRoutes.router);

        // Mediamtx API Proxy
        this.engine.use('/mediamtx', this.mediamtx.proxy.router);

        // API routes
        this.routes = new Routes(this);
        this.engine.use('/api', this.routes.router);
    }

    async run() {
        await this.engine.listen(this.port, () => {
            console.log(`SERVER IS RUNNING ON PORT `.padEnd(30, '.'), this.port);
        });
    }
}
