import express from "express";

export default class ConfigRoutes {
    constructor(routes) {
        this.routes = routes;
        this.server = this.routes.server;
        this.app = this.server.app;
        this.config = this.app.config;

        this.router = express.Router();
        this.router.use(express.json({limit: "10mb"}));

        // get config YAML
        this.router.get('/config', async (req, res) => {
            const yml = await this.config.getYaml();
            await this.config.writeYaml();
            return res.status(200).send(yml);
        });
    }
}