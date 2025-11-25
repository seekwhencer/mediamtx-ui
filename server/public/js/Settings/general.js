import Setting from "./setting.js";

export default class GeneralSettings extends Setting {
    constructor(settings) {
        super();
        this.settings = settings;
        this.config = this.settings.config;
        this.source = this.config.general;
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

        // set the data
        this.setFields();

        return this.data;
    }
}