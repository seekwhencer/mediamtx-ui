import express from "express";


import Events from './EventEmitter.js';

export default class Server extends Events {
    constructor(app) {
        super();

        this.app = app;
        this.publicDir = this.app.publicDir;
        this.dataDir = this.app.dataDir;
        this.port = process.env.PORT || 3000;

        this.engine = express();
        this.engine.use(express.json());
        this.engine.use(express.static(this.publicDir));
    }

    async run() {
        await this.engine.listen(this.port, () => {
            console.log(`SERVER IS RUNNING ON PORT `.padEnd(30, '.'), this.port);
        });
    }
}
