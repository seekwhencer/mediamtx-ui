import {existsSync, readdirSync, mkdirSync, unlinkSync} from "fs";
import fs from 'fs-extra';
import path from "path";

import Events from './EventEmitter.js';
import DataProxy from './DataProxy.js';
import Video from './Video.js';

export default class Streams extends Events {
    constructor(app) {
        super();

        this.app = app;
        this.publicDir = this.app.publicDir;
        this.dataDir = this.app.dataDir;

        if (!existsSync(this.dataDir)) mkdirSync(this.dataDir, {recursive: true});

        this.data = new DataProxy({}, this);

        this.on('loaded', () => {});
    }

    async run() {
        await this.load();
    }

    async load() {
        console.log(`LOAD FROM DATA DIR `.padEnd(30, '.'), this.dataDir);
        const files = readdirSync(this.dataDir).filter(f => f.endsWith(".json"));
        for (const f of files) {
            const id = path.basename(f, ".json");
            const raw = await fs.readFile(path.join(this.dataDir, f));
            let data = JSON.parse(raw);
            data = {
                ...{
                    id: id,
                    file_name: f.toLowerCase(),
                }, ...data
            };
            this.data[id] = new Video(data, this);
            this.data[id].run();
        }

        this.emit('loaded');
        return Promise.resolve(true);
    }

    async cleanup() {
        this.data.keys().forEach((key) => this.data[key].kill());
    }
}