import express from "express";

export default class AuthRoutes {
    constructor(server) {
        this.server = server;
        this.app = this.server.app;
        this.auth = this.app.auth;

        this.router = express.Router();
        this.csrfProtection = this.server.csrfProtection;

        // get CSRF token
        this.router.get("/csrf", this.csrfProtection, (req, res) => {
            res.json({csrfToken: req.csrfToken()});
        });

        // login
        this.router.post("/login", this.csrfProtection, async (req, res) => {

            if (!await this.auth.login(req, res))
                return res.sendStatus(401);

            res.json({
                login: true,
                session: req.session
            });
        });

        // logout
        this.router.post("/logout", this.csrfProtection, (req, res) => {
            this.auth.logout(req, res);
        });

        //
        this.router.get("/status", (req, res) => {
            res.json({
                session: process.env.NODE_ENV !== "production" ? req.session : null,
                headers: req.headers
            });
        });
    }
}