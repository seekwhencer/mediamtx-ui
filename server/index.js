import path from "path";

import Events from './lib/EventEmitter.js';
import MediaMTX from './lib/MediaMTX.js';
import Server from "./lib/Server.js";
import Streams from "./lib/Streams.js";
import Auth from "./lib/Auth.js";

export default class Main extends Events {
    constructor() {
        super();
        this.__dirname = process.cwd();
        this.dataDir = path.join(this.__dirname, "../data");
        this.publicDir = path.join(this.__dirname, "public");

        process.on('SIGINT', async () => {
            console.log('Stoppe…');
            await this.cleanup();
            process.exit(0);
        });

        this.auth = new Auth(this);
        this.mediamtx = new MediaMTX(this);
        this.streams = new Streams(this);
        this.server = new Server(this);

        this.streams.on('loaded', () => {
            console.log(`LOADED STREAMS `.padEnd(30, '.'), this.streams.data.length);
            console.log(`STREAMS `.padEnd(30, '.'), this.streams.data.keys());
        });
    }

    async run() {
        await this.server.run();
        await this.streams.run();
    }

    async cleanup() {
        await  this.streams.cleanup();
    }

}

const CameraApp = new Main();
CameraApp.run();