import Setting from "./setting.js";
import DataProxy from "../data_proxy.js";

export default class WebRTCSettings extends Setting {
    constructor(settings) {
        super();
        this.settings = settings;
        this.config = this.settings.config;
        this.source = this.config.general;
        this.fields = [
            'webrtc',
            'webrtcAddress',
            'webrtcEncryption',
            'webrtcServerKey',
            'webrtcServerCert',
            'webrtcAllowOrigins',
            'webrtcTrustedProxies',
            'webrtcLocalUDPAddress',
            'webrtcLocalTCPAddress',
            'webrtcIPsFromInterfaces',
            'webrtcIPsFromInterfacesList',
            'webrtcAdditionalHosts',
            'webrtcICEServers2',
            'webrtcHandshakeTimeout',
            'webrtcTrackGatherTimeout',
            'webrtcSTUNGatherTimeout',
        ];

        // set the data
        this.setFields();

        return this.data;
    }
}