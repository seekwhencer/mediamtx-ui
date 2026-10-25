import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_LINES = 2000;
const RECONNECT_MS = 2000;

/**
 * WebSocket-Client für den Live-Log-Stream (/logs).
 * Liefert: lines (Puffer), connected, error, clear().
 *
 * Protokoll:
 *   { type: 'history', data: [line, …] } — einmalig auf Connect
 *   { type: 'line',    data: line }      — pro neuer Zeile
 *   { type: 'update',  data: line }      — letzte Zeile ersetzt (Mehrzeilen-Fortsetzung)
 */
export function useLogStream({ enabled = true } = {}) {
    const [lines, setLines] = useState([]);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!enabled) return;
        let closed = false;

        const append = (incoming) => {
            setLines((prev) => {
                const next = [...prev, ...incoming];
                return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
            });
        };

        function connect() {
            const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const ws = new WebSocket(`${proto}://${window.location.host}/logs`);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                setError(null);
                setLines([]); // frischer Start: History folgt direkt (kein Duplikat nach Reconnect)
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'history') setLines(msg.data || []);
                    else if (msg.type === 'line') append([msg.data]);
                    else if (msg.type === 'update') {
                        setLines((prev) => (prev.length > 0 ? [...prev.slice(0, -1), msg.data] : prev));
                    }
                } catch { /* malformed → ignorieren */ }
            };

            ws.onclose = () => {
                setConnected(false);
                if (!closed) timerRef.current = setTimeout(connect, RECONNECT_MS);
            };

            ws.onerror = () => setError(new Error('WebSocket-Fehler'));
        }

        connect();

        return () => {
            closed = true;
            clearTimeout(timerRef.current);
            wsRef.current?.close();
        };
    }, [enabled]);

    const clear = useCallback(() => setLines([]), []);

    return { lines, connected, error, clear };
}
