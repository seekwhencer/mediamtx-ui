import axios from 'axios';

/**
 * Holt Metriken vom MediaMTX-Metrics-Server (Prometheus-Text, Port 9998),
 * parst und normalisiert sie zu einem Snapshot (PLAN_METRICS.md §3.2).
 *
 * On-demand (kein eigener Poller): der Client ruft GET /api/metrics im
 * autoRefreshMs-Takt ab. Der Service hält nur `last`/`lastTs` in Memory,
 * um den Throughput (Bytes/s) aus der Delta zwischen zwei Abfragen zu
 * berechnen — MediaMTX liefert keine Bitrates direkt.
 */
class MetricsService {
    /**
     * @param {Config} config
     * @param {Logger} [logger]
     */
    constructor(config, logger) {
        this.config = config;
        this.label = '[MetricsService]';
        this.logger = logger || { log: () => {}, error: () => {} };
        this.last = null;   // letzter Snapshot (für Throughput)
        this.lastTs = 0;    // Zeitstempel letzter Snapshot (ms)
    }

    /**
     * Parst Prometheus-Text (Exposition Format) zu einer Serie-Map.
     * Reine Funktion — unit-testbar ohne I/O.
     *
     * - `#`-Kommentarzeilen und leere Zeilen werden ignoriert.
     * - Labels mit Sonderzeichen und Escapes (`\"`, `\\`, `\n`) werden
     *   korrekt entescapt.
     * - Serien ohne Labels (`up 1`) sind erlaubt.
     *
     * @param {string} text
     * @returns {Map<string, Array<{ labels: Record<string, string>, value: number }>>}
     */
    static parsePrometheus(text) {
        const series = new Map();
        for (const raw of String(text).split('\n')) {
            const line = raw.trim();
            if (!line || line.startsWith('#')) continue;
            const m = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{([^}]*)\})?\s+(.+)$/);
            if (!m) continue;
            const labels = {};
            if (m[3]) {
                const labelRe = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:[^"\\]|\\.)*)"/g;
                let lm;
                while ((lm = labelRe.exec(m[3])) !== null) {
                    labels[lm[1]] = lm[2]
                        .replace(/\\(\\|")/g, '$1')
                        .replace(/\\n/g, '\n');
                }
            }
            const value = parseFloat(m[4]);
            if (Number.isNaN(value)) continue;
            if (!series.has(m[1])) series.set(m[1], []);
            series.get(m[1]).push({ labels, value });
        }
        return series;
    }

    /**
     * Baut den normalisierten Snapshot (PLAN_METRICS.md §3.2) aus der
     * Serie-Map. Reine Funktion — unit-testbar ohne I/O.
     *
     * Throughput (Bytes/s) wird aus der Delta der Byte-Zähler zwischen
     * `prev` und `now` berechnet; ohne `prev` oder Δt <= 0 → 0.
     *
     * @param {Map<string, Array<{ labels: Record<string, string>, value: number }>>} series
     * @param {object|null} prev - vorheriger Snapshot (oder null)
     * @param {number} now - Zeitstempel in ms (Date.now())
     * @returns {object} Snapshot
     */
    static buildSnapshot(series, prev, now) {
        const sum = (name, pred) =>
            (series.get(name) || [])
                .filter((s) => !pred || pred(s.labels))
                .reduce((acc, s) => acc + s.value, 0);

        // Summe der Werte deckt beide MediaMTX-Formate ab:
        //   - pro-Entity-Einträge (jeder Wert 1, z. B. `hls_sessions{id=…} 1`)
        //   - globale Gauges (Wert = Anzahl, z. B. `hls_sessions 0`)
        const count = (name) => sum(name);

        // Byte-Metriken: Primärnamen bevorzugen, Fallback auf die
        // `*_bytes_received`/`*_bytes_sent`-Namen (ältere MediaMTX-Versionen,
        // z. B. SRT). Nie beide summieren — das wäre eine Doppelzählung.
        const bytes = (primary, fallback, pred) =>
            series.has(primary) ? sum(primary, pred) : sum(fallback, pred);

        // MediaMTX-Path-States: "ready"/"notReady" (aktuell),
        // "online" (Doku-Beispiel). Beides zählt als online.
        const ONLINE_STATES = new Set(['ready', 'online']);

        // ---------- Paths ----------

        const paths = [];
        for (const { labels, value } of series.get('paths') || []) {
            if (value !== 1) continue; // Wert 1 = aktueller State
            const name = labels.name;
            paths.push({
                name,
                state: labels.state,
                readers: sum('paths_readers', (l) => l.name === name),
                inboundBytes: bytes('paths_inbound_bytes', 'paths_bytes_received', (l) => l.name === name),
                outboundBytes: bytes('paths_outbound_bytes', 'paths_bytes_sent', (l) => l.name === name),
                inboundFramesInError: sum('paths_inbound_frames_in_error', (l) => l.name === name),
            });
        }

        // ---------- Totals ----------

        const inboundBytes = bytes('paths_inbound_bytes', 'paths_bytes_received');
        const outboundBytes = bytes('paths_outbound_bytes', 'paths_bytes_sent');
        const pathsOnline = (series.get('paths') || []).filter(
            (s) => s.value === 1 && ONLINE_STATES.has(s.labels.state)
        ).length;

        // Ein ready-Pfad ist verfügbar, ein notReady-Pfad nicht.
        const pathsAvailable = pathsOnline;

        const dt = prev && prev.ts ? (now - Date.parse(prev.ts)) / 1000 : 0;
        const prevInbound = prev && prev.totals ? prev.totals.inboundBytes : 0;
        const prevOutbound = prev && prev.totals ? prev.totals.outboundBytes : 0;
        const inboundBytesPerSec = dt > 0 ? Math.max(0, (inboundBytes - prevInbound) / dt) : 0;
        const outboundBytesPerSec = dt > 0 ? Math.max(0, (outboundBytes - prevOutbound) / dt) : 0;

        const totals = {
            pathsOnline,
            pathsAvailable,
            readers: sum('paths_readers'),
            inboundBytes,
            outboundBytes,
            inboundBytesPerSec,
            outboundBytesPerSec,
            inboundFramesInError: sum('paths_inbound_frames_in_error'),
        };

        // ---------- Protocols ----------

        const protocols = {
            hls: {
                muxers: count('hls_muxers'),
                sessions: count('hls_sessions'),
                outboundBytes: bytes('hls_sessions_outbound_bytes', 'hls_muxers_bytes_sent'),
            },
            rtsp: {
                conns: count('rtsp_conns'),
                sessions: count('rtsp_sessions'),
                inboundBytes: bytes('rtsp_conns_inbound_bytes', 'rtsp_conns_bytes_received'),
                outboundBytes: bytes('rtsp_conns_outbound_bytes', 'rtsp_conns_bytes_sent'),
            },
            rtmp: {
                conns: count('rtmp_conns'),
                inboundBytes: bytes('rtmp_conns_inbound_bytes', 'rtmp_conns_bytes_received'),
                outboundBytes: bytes('rtmp_conns_outbound_bytes', 'rtmp_conns_bytes_sent'),
            },
            srt: {
                conns: count('srt_conns'),
                inboundBytes: bytes('srt_conns_inbound_bytes', 'srt_conns_bytes_received'),
                outboundBytes: bytes('srt_conns_outbound_bytes', 'srt_conns_bytes_sent'),
            },
            webrtc: {
                sessions: count('webrtc_sessions'),
                inboundBytes: bytes('webrtc_sessions_inbound_bytes', 'webrtc_sessions_bytes_received'),
                outboundBytes: bytes('webrtc_sessions_outbound_bytes', 'webrtc_sessions_bytes_sent'),
            },
            moq: {
                sessions: count('moq_sessions'),
                inboundBytes: bytes('moq_sessions_inbound_bytes', 'moq_sessions_bytes_received'),
                outboundBytes: bytes('moq_sessions_outbound_bytes', 'moq_sessions_bytes_sent'),
            },
        };

        // ---------- Forward-Destinations (Join über id) ----------

        const destBytes = new Map(
            (series.get('forward_dests_outbound_bytes') || [])
                .filter((s) => s.labels.id)
                .map((s) => [s.labels.id, s.value])
        );
        const forwardDests = (series.get('forward_dests') || [])
            .filter((s) => s.labels.id)
            .map((s) => ({
                id: s.labels.id,
                path: s.labels.path,
                type: s.labels.type,
                state: s.labels.state,
                outboundBytes: destBytes.get(s.labels.id) || 0,
            }));

        return {
            ts: new Date(now).toISOString(),
            totals,
            paths,
            protocols,
            forwardDests,
        };
    }

    /**
     * Holt Metriken vom Upstream, parst, normalisiert, berechnet Throughput.
     *
     * @returns {Promise<object>} Snapshot
     * @throws {Error&{code:string}} `upstream_unreachable` (Netzwerk/HTTP-Fehler)
     *         oder `upstream_timeout` (Timeout)
     */
    async fetchSnapshot() {
        const baseURL = (this.config.mediamtxMetricsUrl || 'http://localhost:9998').replace(/\/+$/, '');
        const authToken = this.config.mediamtxAuthToken || '';
        const timeout = this.config.mediamtxBridgeTimeout || 10000;
        const url = `${baseURL}/metrics`;
        const started = Date.now();

        let res;
        try {
            res = await axios.get(url, {
                timeout,
                // Do NOT throw on 4xx/5xx — wir klassifizieren selbst.
                validateStatus: () => true,
                headers: {
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
            });
        } catch (err) {
            // Nur Netzwerk-/Timeout-Fehler landen hier (validateStatus: () => true).
            const isTimeout = err.code === 'ECONNABORTED'
                || err.code === 'ETIMEDOUT'
                || /timeout/i.test(err.message || '');
            const e = new Error(isTimeout
                ? 'MediaMTX metrics request timed out'
                : `MediaMTX metrics unreachable: ${err.message}`);
            e.code = isTimeout ? 'upstream_timeout' : 'upstream_unreachable';
            this.logger.error(this.label, `GET ${url} -> ${e.message}`);
            throw e;
        }

        if (res.status < 200 || res.status >= 300) {
            const e = new Error(`MediaMTX metrics unreachable: HTTP ${res.status}`);
            e.code = 'upstream_unreachable';
            this.logger.error(this.label, `GET ${url} -> HTTP ${res.status}`);
            throw e;
        }

        const series = MetricsService.parsePrometheus(typeof res.data === 'string' ? res.data : '');
        const now = Date.now();
        const snapshot = MetricsService.buildSnapshot(series, this.last, now);
        this.last = snapshot;
        this.lastTs = now;
        this.logger.log(this.label, `GET ${url} -> 200 (${Date.now() - started}ms)`);
        return snapshot;
    }
}

export { MetricsService };
