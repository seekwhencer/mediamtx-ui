import Setting from "./setting.js";

export default class GeneralSettings extends Setting {
    constructor(settings) {
        super(settings);

        this.debug = true;
        this.config = this.settings.config;
        this.source = this.config.global;
        this.fields = [
            'logLevel',
            'logDestinations',
            'logFile',
            'sysLogPrefix',
            'readTimeout',
            'writeTimeout',
            'writeQueueSize',
            'udpMaxPayloadSize',
            'udpReadBufferSize',
            'runOnConnect',
            'runOnConnectRestart',
            'runOnDisconnect'
        ];

        this.nailed = [
            'logDestinations', 'logFile', 'sysLogPrefix'
        ]

        this.options = {
            'logLevel': ['debug', 'info', 'warn', 'error'],
            'logDestinations': ['stdout', 'file'] //, 'syslog'
        }

        // set the data
        this.setFields();

        return this.data;
    }

    action(action, prop, value) {
        super.action(action, prop, value);

        if (this.settings.created)
            this.settings.setGlobalConfig();

        this.settings.action(action, prop, value);
    }
}