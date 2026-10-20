

import { Config } from './src/Config.js';
import { Server } from './src/Server.js';
import { Logger } from './src/Logger.js';

class App {
    constructor(config = new Config()) {
        this.config = config;
        this.label = '[App]';
        this.logger = new Logger({ verbose: config.verbose });
        this.server = new Server(this.config, this.logger);
    }

    async run() {
        return this.server.start();
    }
}

if (process.argv.includes('--init-config')) {
    new Config().saveDefaults();
    const logger = new Logger({ verbose: process.env.VERBOSE === 'true' });
    logger.log('[App]', 'Defaults written to config.json.');
    process.exit(0);
}

new App().run();

export { App };
