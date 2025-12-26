import express from "express";

export default class AuthRoutes {
    constructor(server) {
        this.server = server;
        this.app = this.server.app;

        this.router = express.Router();
        this.csrfProtection = this.server.csrfProtection;

        // get CSRF token
        this.router.get("/csrf", this.csrfProtection, (req, res) => {
            res.json({csrfToken: req.csrfToken()});
        });

        // login
        this.router.post("/login", this.csrfProtection, async (req, res) => {
            const {email, password} = req.body;

            const user = {};
            if (!user) return res.sendStatus(401);

            const ok = true; //await bcrypt.compare(password, user.passwordHash);
            if (!ok) return res.sendStatus(401);

            req.session.userId = user.id;
            res.sendStatus(204);
        });

        // logout
        this.router.post("/logout", this.csrfProtection, (req, res) => {
            req.session.destroy(err => {
                if (err) return res.sendStatus(500);

                res.clearCookie("sid", {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/"
                });

                res.sendStatus(204);
            });
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