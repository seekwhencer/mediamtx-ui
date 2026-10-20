import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Loads and manages server configuration from environment variables and a config.json file.
 */
class Config {
    /** @type {Record<string, string | number>} */
    static defaults = {
        serverPort: 3000,
        verbose: false,
        mediamtxBaseUrl: 'http://localhost:9997',
        mediamtxAuthToken: '',
        mediamtxApiVersion: 'v3',
        mediamtxBridgeTimeout: 10000,
        mediamtxConfigPath: ''
    };

    /** Keys, die ohne Restart angewendet werden können. */
    static runtimeKeys = ['verbose', 'mediamtxBaseUrl', 'mediamtxAuthToken', 'mediamtxBridgeTimeout', 'mediamtxConfigPath'];
    /** Keys, die erst nach einem Restart wirksam werden. */
    static restartKeys = ['serverPort', 'mediamtxApiVersion'];

    constructor(env = process.env, logger) {
        this.env = env;
        this.configPath = this.resolvePath();
        this.label = '[Config]';
        this.logger = logger || { log: () => {}, error: () => {} };

        const loadedDefaults =
            existsSync(this.configPath)
                ? JSON.parse(readFileSync(this.configPath, 'utf8'))
                : null;

        this.defaults = loadedDefaults ?? this.buildDefaults();

        this.serverPort = parseInt(env.SERVER_PORT, 10) || this.defaults.serverPort;
        this.verbose = env.VERBOSE === 'true' || this.defaults.verbose;
        this.mediamtxBaseUrl = env.MEDIAMTX_BASE_URL || this.defaults.mediamtxBaseUrl;
        this.mediamtxAuthToken = env.MEDIAMTX_AUTH_TOKEN || this.defaults.mediamtxAuthToken || '';
        this.mediamtxApiVersion = env.MEDIAMTX_API_VERSION || this.defaults.mediamtxApiVersion || 'v3';
        this.mediamtxBridgeTimeout = parseInt(env.MEDIAMTX_BRIDGE_TIMEOUT, 10) || this.defaults.mediamtxBridgeTimeout || 10000;
        this.mediamtxConfigPath = env.MEDIAMTX_CONFIG_PATH || this.defaults.mediamtxConfigPath || '';
    }

    /**
     * Resolves the path to the configuration file.
     * @returns {string}
     */
    resolvePath() {
        return this.env.CONFIG_PATH || join(__dirname, '..', 'config.json');
    }

    /**
     * Creates a defaults object from environment variables or static default values.
     * @returns {Record<string, string | number>}
     */
    buildDefaults() {
        return {
            serverPort: parseInt(this.env.SERVER_PORT, 10) || Config.defaults.serverPort,
            verbose: this.env.VERBOSE === 'true' || Config.defaults.verbose,
            mediamtxBaseUrl: this.env.MEDIAMTX_BASE_URL || Config.defaults.mediamtxBaseUrl,
            mediamtxAuthToken: this.env.MEDIAMTX_AUTH_TOKEN || Config.defaults.mediamtxAuthToken || '',
            mediamtxApiVersion: this.env.MEDIAMTX_API_VERSION || Config.defaults.mediamtxApiVersion || 'v3',
            mediamtxBridgeTimeout: parseInt(this.env.MEDIAMTX_BRIDGE_TIMEOUT, 10) || Config.defaults.mediamtxBridgeTimeout || 10000,
            mediamtxConfigPath: this.env.MEDIAMTX_CONFIG_PATH || Config.defaults.mediamtxConfigPath || ''
        };
    }

    /**
     * Writes the default configuration file explicitly.
     * Intended to be invoked by a separate setup step (e.g. CLI flag --init-config).
     */
    saveDefaults() {
        writeFileSync(
            this.configPath,
            JSON.stringify(this.buildDefaults(), null, 4),
            'utf8'
        );
    }

    /**
     * Liefert die aktuellen Settings für die UI.
     * Secrets werden maskiert — der echte Token wird nie zurückgegeben.
     * @returns {Record<string, unknown>}
     */
    getSettings() {
        return {
            serverPort: this.serverPort,
            verbose: this.verbose,
            mediamtxBaseUrl: this.mediamtxBaseUrl,
            mediamtxAuthToken: this.maskSecret(this.mediamtxAuthToken),
            mediamtxApiVersion: this.mediamtxApiVersion,
            mediamtxBridgeTimeout: this.mediamtxBridgeTimeout,
            mediamtxConfigPath: this.mediamtxConfigPath,
            runtimeKeys: Config.runtimeKeys,
            restartKeys: Config.restartKeys
        };
    }

    /**
     * Maskiert ein Secret: `••••` + letzte 4 Zeichen.
     * @param {string} value
     * @returns {string}
     */
    maskSecret(value) {
        if (!value) return '';
        return value.length <= 4 ? '••••' : `••••${value.slice(-4)}`;
    }

    /**
     * Validiert ein vollständiges Settings-Objekt.
     * @param {Record<string, unknown>} s
     * @returns {string[]} Fehlerliste (leer = gültig)
     */
    validateSettings(s) {
        const errors = [];
        if (!Number.isInteger(s.serverPort) || s.serverPort < 1 || s.serverPort > 65535)
            errors.push('serverPort muss eine Ganzzahl zwischen 1 und 65535 sein');
        if (typeof s.verbose !== 'boolean')
            errors.push('verbose muss ein Boolean sein');
        try {
            const url = new URL(s.mediamtxBaseUrl);
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad protocol');
        } catch {
            errors.push('mediamtxBaseUrl muss eine gültige http(s)-URL sein');
        }
        if (typeof s.mediamtxAuthToken !== 'string')
            errors.push('mediamtxAuthToken muss ein String sein');
        if (typeof s.mediamtxApiVersion !== 'string'
            || s.mediamtxApiVersion.length === 0
            || s.mediamtxApiVersion.startsWith('/'))
            errors.push('mediamtxApiVersion darf nicht mit "/" beginnen');
        if (!Number.isInteger(s.mediamtxBridgeTimeout) || s.mediamtxBridgeTimeout < 1000)
            errors.push('mediamtxBridgeTimeout muss eine Ganzzahl >= 1000 (ms) sein');
        if (typeof s.mediamtxConfigPath !== 'string')
            errors.push('mediamtxConfigPath muss ein String sein');
        return errors;
    }

    /**
     * Wendet einen Partial-Patch an: validieren → mergen → persistieren → klassifizieren.
     * @param {Record<string, unknown>} patch
     * @returns {{ applied: string[], restartRequired: string[] }}
     */
    updateSettings(patch) {
        const current = {
            serverPort: this.serverPort,
            verbose: this.verbose,
            mediamtxBaseUrl: this.mediamtxBaseUrl,
            mediamtxAuthToken: this.mediamtxAuthToken,
            mediamtxApiVersion: this.mediamtxApiVersion,
            mediamtxBridgeTimeout: this.mediamtxBridgeTimeout,
            mediamtxConfigPath: this.mediamtxConfigPath
        };

        const next = { ...current, ...patch };

        // Token-Regel:
        //   '' (leer)          → Token wird gelöscht
        //   '••••…' (maskiert) → unverändert (UI schickt den maskierten Wert zurück)
        //   sonst              → neuer Token
        if (typeof next.mediamtxAuthToken === 'string' && next.mediamtxAuthToken.startsWith('••••')) {
            next.mediamtxAuthToken = current.mediamtxAuthToken;
        }

        const errors = this.validateSettings(next);
        if (errors.length > 0) {
            const err = new Error(errors.join('; '));
            err.status = 400;
            err.code = 'invalid_settings';
            throw err;
        }

        // Runtime-State aktualisieren
        this.serverPort = next.serverPort;
        this.verbose = next.verbose;
        this.mediamtxBaseUrl = next.mediamtxBaseUrl.replace(/\/+$/, '');
        this.mediamtxAuthToken = next.mediamtxAuthToken;
        this.mediamtxApiVersion = next.mediamtxApiVersion;
        this.mediamtxBridgeTimeout = next.mediamtxBridgeTimeout;
        this.mediamtxConfigPath = next.mediamtxConfigPath;

        // Persistieren (config.json)
        this.persist();

        const changed = Object.keys(patch).filter((k) => current[k] !== next[k]);
        return {
            applied: changed.filter((k) => Config.runtimeKeys.includes(k)),
            restartRequired: changed.filter((k) => Config.restartKeys.includes(k))
        };
    }

    /** Schreibt die aktuellen Settings nach config.json. */
    persist() {
        writeFileSync(
            this.configPath,
            JSON.stringify({
                serverPort: this.serverPort,
                verbose: this.verbose,
                mediamtxBaseUrl: this.mediamtxBaseUrl,
                mediamtxAuthToken: this.mediamtxAuthToken,
                mediamtxApiVersion: this.mediamtxApiVersion,
                mediamtxBridgeTimeout: this.mediamtxBridgeTimeout,
                mediamtxConfigPath: this.mediamtxConfigPath
            }, null, 4),
            'utf8'
        );
    }
}

export { Config };
