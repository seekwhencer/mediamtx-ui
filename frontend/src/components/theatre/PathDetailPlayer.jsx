import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Loader2, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { useHlsPlayer } from '../../hooks/useHlsPlayer';
import { buildHlsUrl } from '../../utils/buildHlsUrl';
import { useAppSettings } from '../../services/appSettings';
import RecordingBadge from '../ui/RecordingBadge';

/**
 * Player für die Path-Detail-Ansicht: genau EIN Stream (der aktuelle Pfad), 16:9.
 * - Autoplay (muted) nur wenn App-Setting `autoplayPathDetail` aktiv ist.
 * - Sonst: Play-Button → Stream startet (muted), Mute-Toggle zum Aufdrehen.
 * - Wiederverwendet useHlsPlayer (gleicher Lebenszyklus wie im Theater).
 */
export default function PathDetailPlayer({ name, online, recording }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const settings = useAppSettings();
  const autoplay = !!settings.autoplayPathDetail;

  const [started, setStarted] = useState(autoplay);
  const [muted, setMuted] = useState(true);

  const url = started ? buildHlsUrl(name) : null;
  const { status, supported, errorKind } = useHlsPlayer(videoRef, url);

  // Mute-Prop auf das <video> anwenden.
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);

  // Setting zur Laufzeit auf true → Stream starten (falls noch nicht).
  useEffect(() => {
    if (autoplay) setStarted(true);
  }, [autoplay]);

  const handlePlay = () => {
    const video = videoRef.current;
    if (video) video.muted = true;
    if (started) {
      // Retry nach Fehler: erst reset (url → null), dann neu starten.
      setStarted(false);
      setTimeout(() => setStarted(true), 0);
    } else {
      setStarted(true);
    }
  };

  const errorMessage =
    errorKind === 'offline'
      ? t('pages.runtimePathDetail.streamOffline')
      : errorKind === 'cors'
        ? t('pages.runtimePathDetail.streamCors')
        : t('pages.runtimePathDetail.streamError');

  return (
    <div className="detail-player">
      <video ref={videoRef} className="detail-player__video" playsInline />

      {recording !== undefined && (
        <span className="detail-player__rec" aria-hidden="true">
          <RecordingBadge record={recording} online={online} compact />
        </span>
      )}

      {!supported && (
        <div className="detail-player__overlay" role="alert">
          <AlertTriangle size={24} />
          <span className="detail-player__error-text">{t('pages.theatre.hlsUnsupported')}</span>
        </div>
      )}

      {supported && (!started || status === 'error') && (
        <button
          type="button"
          className="detail-player__play"
          onClick={handlePlay}
          aria-label={t('pages.runtimePathDetail.play', { name })}
        >
          <Play size={34} fill="currentColor" />
        </button>
      )}

      {supported && started && status === 'loading' && (
        <div className="detail-player__overlay" aria-hidden="true">
          <Loader2 size={26} className="detail-player__spinner" />
        </div>
      )}

      {supported && started && status === 'error' && (
        <div className="detail-player__overlay detail-player__overlay--error" role="alert">
          <AlertTriangle size={24} />
          <span className="detail-player__error-text">{errorMessage}</span>
        </div>
      )}

      {started && (
        <button
          type="button"
          className="detail-player__mute"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? t('pages.theatre.unmute') : t('pages.theatre.mute')}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
}
