import {parse, stringify} from 'yaml';
import {ensureFile, outputFile, move} from 'fs-extra';

export default class Config {
    constructor(app) {
        this.app = app;
        this.apiUrlBase = `http://mediamtxui:3000/mediamtx`;
        this.configFilename = 'mediamtx.yml';
        this.configPath = `../config`;
        this.configBackupPath = `../config/backup`;
    }

    async getYaml() {
        const globalConfig = await this.getConfig();
        const paths = await this.getPaths();
        const pathDefaults = await this.getPathDefaults();

        const pathObj = {};
        paths.items.forEach(p => pathObj[p.name] = p);

        const config = {...globalConfig, pathDefaults, paths: pathObj};
        const yml = stringify(config);

        return yml;
    }

    /**
     * Rotate the YAML configuration file to create a backup.
     * @returns {Promise<void>}
     */
    async rotateYaml() {
        const configFilePath = `${this.configPath}/${this.configFilename}`;

        const exists = await ensureFile(configFilePath);
        if (exists)
            return;

        const timestamp = new Date().toISOString().replace("T", "_").replace(/:/g, "-").slice(0, 19);
        const backupFilePath = `${this.configBackupPath}/${timestamp}.yml`;
        await move(configFilePath, backupFilePath);
    }

    /**
     * Write the current configuration to the YAML file.
     * @returns {Promise<void>}
     */
    async writeYaml() {
        const configFilePath = `${this.configPath}/${this.configFilename}`;
        const yml = await this.getYaml();

        await this.rotateYaml();
        await outputFile(configFilePath, yml);
    }

    /**
     * Fetch the global configuration from the MediaMTX API.
     * @returns {Promise<any>}
     */
    async getConfig() {
        try {
            const url = `${this.apiUrlBase}/config/global/get`;
            const res = await fetch(url);
            return await res.json();
            //return JSON.parse(text.trim());
        } catch (err) {
            console.error('Fetch failed:', err);
            throw err;
        }
    }

    /**
     * Fetch the list of paths from the MediaMTX API.
     * @returns {Promise<any>}
     */
    async getPaths() {
        try {
            const url = `${this.apiUrlBase}/config/paths/list`;
            const res = await fetch(url);
            return await res.json();
            //return JSON.parse(text.trim());
        } catch (err) {
            console.error('Fetch failed:', err);
            throw err;
        }
    }

    /**
     * Fetch the path defaults from the MediaMTX API.
     * @returns {Promise<any>}
     */
    async getPathDefaults() {
        try {
            const url = `${this.apiUrlBase}/config/pathdefaults/get`;
            const res = await fetch(url);
            return await res.json();
            //return JSON.parse(text.trim());
        } catch (err) {
            console.error('Fetch failed:', err);
            throw err;
        }
    }
}