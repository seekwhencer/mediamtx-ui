import express from "express";

export default class ConfigRoutes {
    constructor(routes) {
        this.routes = routes;
        this.server = this.routes.server;
        this.app = this.server.app;
        this.mediamtx = this.app.mediamtx;

        this.router = express.Router();
        this.router.use(express.json({limit: "10mb"}));

        // get config YAML
        this.router.get('/config', async (req, res) => {
            const yml = await this.mediamtx.getYaml();
            return res.status(200).send(yml);
        });

        // save config YAML to disk
        this.router.get('/config/save', async (req, res) => {
            try {
                await this.mediamtx.writeYaml();
                return res.status(200).send({status: 'ok'});
            } catch(e) {
                return res.status(200).send({error: e.message});
            }
        });
    }
}