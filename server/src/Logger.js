class Logger {
    constructor({ verbose } = {}) {
        this.verbose = verbose ?? process.env.VERBOSE === 'true';
    }

    log(label, ...args) {
        if (this.verbose) {
            console.log(`${label} ${args.join(' ')}`);
        }
    }

    error(label, ...args) {
        console.error(`${label} ${args.join(' ')}`);
    }

    setVerbose(verbose) {
        this.verbose = verbose;
    }
}

export { Logger };
