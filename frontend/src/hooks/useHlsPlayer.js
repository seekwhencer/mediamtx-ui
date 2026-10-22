import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';

// Live-Stream-Config (THEATRE.md §5.3). LoadPolicies bewusst auf Defaults.
const HLS_CONFIG = {
  debug: false,
  capLevelToPlayerSize: true,
  liveSyncDurationCount: 3,
  maxBufferLength: 30,
  backBufferLength: 60,
};

const RECOVER_THROTTLE_MS = 5000;
const NATIVE_HLS_MIME = 'application/vnd.apple.mpegurl';
const MEDIA_ERR_DECODE = 3;

// 8.2 — Fatal Network-Error klassifizieren (THEATRE.md §10 CORS-Risiko):
// - HTTP 404 → Pfad offline / nicht vorhanden
// - keine Response → Browser hat blockiert (CORS) oder Host unerreichbar
// - sonst → generischer Netzwerkfehler
export function classifyNetworkError(data) {
  const code = data && data.response ? data.response.code : undefined;
  if (code === 404) return 'offline';
  if (code === undefined) return 'cors';
  return 'network';
}

/**
 * Kapselt den kompletten hls.js-Lebenszyklus für ein <video>-Element.
 * - url=null → kein Load (idle)
 * - url gesetzt → hls.js-Pfad (MSE) oder nativer Safari-Fallback
 * - Stream-Wechsel über loadSource auf derselben Instanz (nie 2 Instanzen)
 * - Unmount → destroy(), keine offenen HLS-Requests
 * @param {React.RefObject<HTMLVideoElement>} videoRef
 * @param {string | null} url
 * @returns {{ status: 'idle' | 'loading' | 'playing' | 'error', supported: boolean, errorKind: 'none' | 'offline' | 'cors' | 'network' }}
 */
export function useHlsPlayer(videoRef, url) {
  const [status, setStatus] = useState('idle');
  // 8.2 — Fehlerart für klare Meldungen (CORS vs. offline vs. Netzwerk).
  const [errorKind, setErrorKind] = useState('none');
  const hlsRef = useRef(null);
  const lastUrlRef = useRef(null);
  const lastRecoverAtRef = useRef(0);

  // Support-Check (THEATRE.md §5.1): hls.js (MSE) ODER nativer HLS (Safari/iOS).
  // Statisch (Browser-Umgebung) → useMemo([]), stabil über Renders.
  const supported = useMemo(() => {
    try {
      if (Hls.isSupported()) return true;
    } catch {
      // hls.js nicht verfügbar (z. B. SSR) → nur nativer Check
    }
    if (typeof document === 'undefined') return false;
    return document.createElement('video').canPlayType(NATIVE_HLS_MIME) !== '';
  }, []);

  // recoverMediaError mit 5-s-Throttle (verhindert Recovery-Loops).
  const recoverMedia = useCallback(() => {
    const now = Date.now();
    if (now - lastRecoverAtRef.current < RECOVER_THROTTLE_MS) return;
    lastRecoverAtRef.current = now;
    if (hlsRef.current) hlsRef.current.recoverMediaError();
  }, []);

  const handlePlaying = useCallback(() => setStatus('playing'), []);

  // video 'error': MEDIA_ERR_DECODE → Recovery (hls-Pfad); sonst (nativ) → error.
  const handleVideoError = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.error) return;
    if (video.error.code === MEDIA_ERR_DECODE && hlsRef.current) {
      recoverMedia();
      return;
    }
    if (!hlsRef.current) {
      // Nativ (Safari): Fehlerart nicht unterscheidbar → generisch.
      setErrorKind('network');
      setStatus('error');
    }
  }, [videoRef, recoverMedia]);

  // hls.js fatal Errors (THEATRE.md §5.4). Nicht-fatal: hls.js recovert selbst.
  const handleHlsError = useCallback((_event, data) => {
    if (!data.fatal) return;
    if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
      recoverMedia();
      return;
    }
    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
      // 8.1/8.2 — kein Retry-Loop; Fehlerart für die Meldung klassifizieren.
      setErrorKind(classifyNetworkError(data));
      setStatus('error');
      return;
    }
    // andere fatal Errors → Instanz verwerfen
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    lastUrlRef.current = null;
    setErrorKind('network');
    setStatus('error');
  }, [recoverMedia]);

  const detachVideoListeners = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.removeEventListener('error', handleVideoError);
    video.removeEventListener('playing', handlePlaying);
  }, [videoRef, handleVideoError, handlePlaying]);

  // Unmount: Instanz verwerfen + Listener entfernen → keine offenen HLS-Requests.
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      lastUrlRef.current = null;
      detachVideoListeners();
    };
  }, [detachVideoListeners]);

  // url-Handling: Start / Wechsel / Stopp.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Stopp: url=null → kein Load, zurück zu idle.
    if (url === null) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeAttribute('src');
      video.load();
      lastUrlRef.current = null;
      detachVideoListeners();
      setErrorKind('none');
      setStatus('idle');
      return;
    }

    const hlsSupported = Hls.isSupported();
    const nativeSupported = video.canPlayType(NATIVE_HLS_MIME) !== '';
    if (!hlsSupported && !nativeSupported) {
      setStatus('error');
      return;
    }

    // Bestehender Player: Wechsel (loadSource / src) statt neuer Instanz.
    const hasPlayer = hlsRef.current !== null || lastUrlRef.current !== null;
    if (hasPlayer) {
      if (lastUrlRef.current === url) return; // bereits aktiv
      if (hlsRef.current) {
        hlsRef.current.loadSource(url);
        video.play().catch(() => {}); // Autoplay-Block ignorieren
      } else {
        video.src = url;
        video.load();
        video.play().catch(() => {}); // Autoplay-Block ignorieren
      }
      lastUrlRef.current = url;
      setErrorKind('none');
      setStatus('loading');
      return;
    }

    // Start: hls.js-Pfad (MSE).
    if (hlsSupported) {
      const hls = new Hls(HLS_CONFIG);
      hlsRef.current = hls;
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {}); // Autoplay-Block ignorieren
      });
      hls.on(Hls.Events.ERROR, handleHlsError);
      video.addEventListener('error', handleVideoError);
      video.addEventListener('playing', handlePlaying);
      hls.loadSource(url);
      lastUrlRef.current = url;
      setErrorKind('none');
      setStatus('loading');
      return;
    }

    // Start: nativer HLS-Fallback (Safari/iOS).
    video.src = url;
    video.load();
    video.play().catch(() => {}); // Autoplay-Block ignorieren
    video.addEventListener('error', handleVideoError);
    video.addEventListener('playing', handlePlaying);
    lastUrlRef.current = url;
    setErrorKind('none');
    setStatus('loading');
  }, [url, videoRef, handleHlsError, handleVideoError, handlePlaying, detachVideoListeners]);

  return { status, supported, errorKind };
}
