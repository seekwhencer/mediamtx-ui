/**
 * generate an argon2 hash for a password:
 *
 * node generate_auth.js
 *
 */

import {readJson, readJsonSync, writeJson} from "fs-extra/esm";
import argon2 from "argon2"

export default class Auth {
    constructor(app) {
        this.label = this.constructor.name.toUpperCase();
        this.app = app;
        this.configFilePath = '../config/auth.json';
        this.auth = readJsonSync(this.configFilePath);
    }

    async readAuth() {
        const auth = await readJson(this.configFilePath);
        console.log(auth);
    }

    async writeAuth(auth) {
        await writeJson(this.configFilePath, auth, {spaces: 2});
        this.auth = auth;
    }

    async login(req, res) {
        const {username, password} = req.body;

        if (!username || !password)
            return false;

        if (!await argon2.verify(this.auth.username, username))
            return false;

        if (!await argon2.verify(this.auth.password, password))
            return false;

        req.session.isAuthenticated = true;
        return true;
    }


    async logout(req, res) {
        if (!req.session.isAuthenticated)
            return;

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
    }
}