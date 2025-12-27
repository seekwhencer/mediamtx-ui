import {spawn} from "node:child_process";

import Events from './EventEmitter.js';
import DataProxy from './DataProxy.js';

export default class Video extends Events {
    constructor(data, streams) {
        super();
        this.streams = streams;

        this.debug = false;

        this.reconnect_delay = 2000;
        this.retry_probe_delay = 2000;
        this.bin = '/usr/local/bin/ffmpeg';


        this.name = null;               // just use: this.on('name',() => {});
        this.device = null
        this.input_format = null;
        this.rtsp_path = null;
        this.rtsp_host = null;
        this.rtsp_port = null;
        this.size = null;
        this.framerate = null;
        this.bitrate = null;

        this.overlay = "drawtext=fontfile=/path/to/font.ttf:text='%{localtime\\:%Y-%m-%d\\ %H\\\\\\:%M\\\\\\:%S}':x=10:y=10:fontsize=24:fontcolor=white:box=1:boxcolor=0x00000099";
        this.hide_overlay = true;

        this.data = new DataProxy({}, this);
        this.stats = new DataProxy({}, this, false); // dont lift props on this

        this.process = false;

        this.on('data', chunk => this.stat(chunk));
        //this.on('stat', () => console.log('VIDEO STATS', this.name, `FRAME ${this.stats.frame}`, `TIME ${this.stats.time}`, `SPEED ${this.stats.speed}`));

        this.on('disconnected', async () => {
            this.debug ? console.log('DISCONNECTED') : null;
            await new Promise(resolve => setTimeout(resolve, this.reconnect_delay));
            await this.run();
        });

        // get the data
        Object.keys(data).forEach((key) => this.data[key] = data[key]);
    }

    async run() {
        // endless check
        while (await this.probe() === false) {
            this.debug ? console.log('VIDEO RTSP URL NOT EXISTS:', this.rtsp_url) : null;
            await new Promise(resolve => setTimeout(resolve, this.retry_probe_delay));
        }

        let options = [
            '-hide_banner', '-f', 'v4l2',
            '-input_format', this.input_format,
            '-video_size', this.size,
            '-framerate', this.framerate,
            '-i', this.device];
        !this.hide_overlay ? options = [...options, '-vf', this.overlay] : null;
        options = [...options,
            '-c:v', 'h264_v4l2m2m', '-b:v', this.bitrate, '-tune', 'zerolatency', '-flags', 'low_delay',
            '-pix_fmt', 'yuv420p',
            '-g', this.framerate, '-keyint_min', this.framerate, '-r', this.framerate,
            '-max_muxing_queue_size', '4096',
            '-fflags', 'nobuffer', '-flush_packets', 0,
            '-f', 'rtsp', '-rtsp_transport', 'tcp',
            `${this.rtsp_url}`
        ];

        this.debug ? console.log('VIDEO SPAWN FFMPEG', this.name, options.join(' ')) : null;

        this.process = spawn(this.bin, options, {detached: false});

        this.process.on('error', () => this.kill());

        this.process.stdout.setEncoding('utf8');
        this.process.stderr.setEncoding('utf8');

        this.process.stdout.on('data', (chunk) => this.emit('data', chunk.trim()));
        this.process.stderr.on('data', (chunk) => this.emit('data', chunk.trim()));
        this.process.stderr.on('end', () => this.emit('disconnected'));

        this.process.on('exit', this.kill);
        this.process.on('SIGINT', () => this.kill(true));
        this.process.on('SIGTERM', () => this.kill(true));
    }

    async probe() {
        return new Promise((resolve, reject) => {
            const options = ['-v', 'warning', '-reconnect', 1, '-reconnect_streamed', 1, '-reconnect_delay_max', 1, '-rtsp_transport', 'tcp', this.rtsp_url];
            let stdout = '';
            let stderr = '';
            const proc = spawn('/usr/local/bin/ffprobe', options);

            proc.stdout.setEncoding('utf8');
            proc.stderr.setEncoding('utf8');

            proc.stdout.on('data', (chunk) => stdout += chunk);
            proc.stderr.on('data', (chunk) => stderr += chunk);

            proc.on('error', (code) => {
                //console.log('***', code);
            });

            proc.on('close', () => {
                this.debug ? console.log('####', stderr) : null;
                const checks = {
                    '404': "404 Not Found",
                    '400': "400 Bad Request",
                    '503': "Connection refused",
                    '502': "Name or service not known",
                    '666': "Option reconnect skipped"
                };

                let status = false;
                for (const [code, msg] of Object.entries(checks)) {
                    stderr.includes(msg) ? status = code : null;
                }
                this.debug ? console.log('VIDEO ERROR STATUS:', status, checks[status], this.rtsp_url) : null;

                if (status === '404') {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });

            //setTimeout(() => proc.kill(0), 5000);
        });
    }

    async kill(x = false) {
        if (!this.process)
            return;

        if (!this.process.pid)
            return;

        process.kill(this.process.pid, 'SIGKILL');
        x ? this.process.exit() : null;
    }

    stat(chunk) {
        const regex = /(\w+)=\s*([^\s]+)/g;
        let match;
        while ((match = regex.exec(chunk)) !== null) {
            const key = match[1];
            let value = match[2];

            // Typisierung
            if (/^\d+$/.test(value)) {
                value = Number(value);
            } else if (/^-?\d+\.\d+$/.test(value)) {
                value = Number(value);
            } else if (/^\d+(\.\d+)?x$/.test(value)) {
                value = Number(value.replace("x", ""));
            } else if (value === "N/A") {
                value = null;
            }

            this.stats[key] = value;
        }
        this.emit('stat');
    }

    get rtsp_url() {
        return `rtsp://${this.rtsp_host}:${this.rtsp_port}/${this.rtsp_path}`;
    }

    set rtsp_url(value) {
        ///
    }

}