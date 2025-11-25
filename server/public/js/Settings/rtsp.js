import Setting from "./setting.js";
import DataProxy from "../data_proxy.js";

export default class RTSPSettings extends Setting {
    constructor(settings) {
        super();
        this.settings = settings;
        this.config = this.settings.config;
        this.source = this.config.general;
        this.fields = [
            'rtsp',
            'rtspTransports',
            'rtspEncryption',
            'rtspAddress',
            'rtspsAddress',
            'rtpAddress',
            'rtcpAddress',
            'multicastIPRange',
            'multicastRTPPort',
            'multicastRTCPPort',
            'srtpAddress',
            'srtcpAddress',
            'multicastSRTPPort',
            'multicastSRTCPPort',
            'rtspServerKey',
            'rtspServerCert',
            'rtspAuthMethods',
        ];

        // set the data
        this.setFields();

        return this.data;
    }
}