import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

// MediaMTX-Zeile: "JJJJ/MM/TT HH:MM:SS LEVEL message" (Trennzeichen / oder -)
// Levels: DBG, INF, WAR, ERR, FTL (WRN als Fallback für andere Logger).
const LINE_RE = /^(\d{4}[/-]\d{2}[/-]\d{2} \d{2}:\d{2}:\d{2})\s+(DBG|INF|WAR|WRN|ERR|FTL)\s+([\s\S]*)$/;

/**
 * Parst eine MediaMTX-Logzeile.
 * @param {string} raw
 * @returns {{ ts: string, level: string, message: string, raw: string } | null} null = kein Level-Match (Fortsetzung)
 */
function parseLine(raw) {
    const m = LINE_RE.exec(raw);
    if (!m) return null;
    return { ts: m[1], level: m[2], message: m[3], raw };
}

/**
 * Verwaltet EINEN permanenten `tail -f`-Prozess auf der MediaMTX-Log-Datei.
 * Parst stdout, hält einen Ring-Buffer (History) und broadcastet an Listener.
 */
class LogTailService {
    /**
     * @param {object} config
     * @param {Logger} [logger]
     * @param {{ maxBuffer?: number, restartDelayMs?: number }} [opts]
     */
    constructor(config, logger, { maxBuffer = 1000, restartDelayMs = 2000 } = {}) {
        this.config = config;
        this.label = '[LogTailService]';
        this.logger = logger || { log: () => {}, error: () => {} };
        this.maxBuffer = maxBuffer;
        this.restartDelayMs = restartDelayMs;

        this.proc = null;
        this.buffer = [];          // Ring-Buffer: letzte maxBuffer Zeilen (History)
        this.listeners = new Set(); // (line, kind) => void — WebSocket-Clients
        this.partial = '';          // unvollständige Zeile (Chunk-Grenze)
        this.stopped = false;
        this.restartTimer = null;
    }

    /** Log-Pfad (relativ zum CWD) oder null, wenn nicht konfiguriert. */
    resolveLogPath() {
        const p = this.config?.mediamtxLogPath;
        return p ? resolve(p) : null;
    }

    /** Startet den tail-Prozess (no-op, wenn kein Pfad konfiguriert). */
    start() {
        const logPath = this.resolveLogPath();
        if (!logPath) {
            this.logger.log(this.label, 'mediamtxLogPath nicht gesetzt — Log-Tail deaktiviert');
            return;
        }
        if (this.proc) return; // bereits aktiv
        this.stopped = false;
        this.spawnTail(logPath, /* withHistory */ true);
    }

    /** Spawnt `tail -n 500 -f` (mit History) bzw. `tail -f` (Restart, ohne History). */
    spawnTail(logPath, withHistory) {
        const args = withHistory ? ['-n', '500', '-f', logPath] : ['-f', logPath];
        this.proc = spawn('tail', args, { stdio: ['ignore', 'pipe', 'pipe'] });
        this.proc.stdout.setEncoding('utf8');
        this.proc.stdout.on('data', (chunk) => this.handleData(chunk));
        this.proc.stderr.on('data', (chunk) => {
            const msg = chunk.toString().trim();
            if (msg) this.logger.error(this.label, `tail stderr: ${msg}`);
        });
        this.proc.on('error', (err) => {
            this.logger.error(this.label, `tail spawn error: ${err.message}`);
        });
        this.proc.on('exit', (code, signal) => {
            this.logger.log(this.label, `tail exited (code=${code}, signal=${signal})`);
            if (!this.stopped) {
                this.logger.log(this.label, `tail-Neustart in ${this.restartDelayMs} ms`);
                this.restartTimer = setTimeout(() => this.spawnTail(logPath, false), this.restartDelayMs);
            }
        });
        this.logger.log(this.label, `tail gestartet: tail ${args.join(' ')}`);
    }

    /** stdout-Chunk → Zeilen splitten (partial puffern) → parse → buffer + broadcast. */
    handleData(chunk) {
        this.partial += chunk;
        const parts = this.partial.split('\n');
        this.partial = parts.pop(); // letztes (ggf. unvollständiges) Stück behalten
        for (const raw of parts) {
            if (raw === '') continue;
            this.ingest(raw);
        }
    }

    /**
     * Eine vollständige Zeile aufnehmen.
     * - Level-Match → neue Zeile (push).
     * - Kein Match  → Fortsetzung (Stacktrace etc.): letzte Zeile erweitern (update).
     */
    ingest(raw) {
        const parsed = parseLine(raw);
        if (parsed) {
            this.push(parsed);
            return;
        }
        if (this.buffer.length > 0) {
            const last = this.buffer[this.buffer.length - 1];
            const updated = { ...last, message: `${last.message}\n${raw}`, raw: `${last.raw}\n${raw}` };
            this.buffer[this.buffer.length - 1] = updated;
            this.emit(updated, 'update');
            return;
        }
        this.push({ ts: null, level: null, message: raw, raw });
    }

    /** Zeile in den Ring-Buffer legen + an alle Listener broadcasten. */
    push(line) {
        this.buffer.push(line);
        if (this.buffer.length > this.maxBuffer) this.buffer.shift();
        this.emit(line, 'line');
    }

    /** An alle Listener broadcasten (Fehler pro Listener isoliert). */
    emit(line, kind) {
        for (const listener of this.listeners) {
            try {
                listener(line, kind);
            } catch (err) {
                this.logger.error(this.label, `broadcast fehlgeschlagen: ${err.message}`);
            }
        }
    }

    /** History (Kopie des Ring-Buffers) für neue Clients. */
    getHistory() {
        return this.buffer.slice();
    }

    /** Listener abonnieren. Gibt eine Unsubscribe-Funktion zurück. */
    addListener(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    /** tail-Prozess stoppen (beim Server-Shutdown). */
    stop() {
        this.stopped = true;
        if (this.restartTimer) clearTimeout(this.restartTimer);
        if (this.proc) {
            this.proc.kill('SIGTERM');
            this.proc = null;
        }
        this.listeners.clear();
    }
}

export { LogTailService, parseLine };
