import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useHlsPlayer } from '../../hooks/useHlsPlayer';
import { buildHlsUrl } from '../../utils/buildHlsUrl';

/**
 * Ein Stream: <video> + eigener useHlsPlayer + Status-Overlays + Name.
 * Wiederverwendbar in Grid- und PiP-View (pro Stream eine Instanz).
 * - muted default true (Browser-Autoplay-Policy erlaubt nur muted Autoplay).
 * - focused → CSS-Klasse is-focused (hervorhebender Rand).
 * - onClick → PiP-Mode: promote Stream (setzt focusedPath).
 */
export default function StreamPlayer({ name, online, muted = true, focused = false, onClick }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const url = buildHlsUrl(name);
  const { status } = useHlsPlayer(videoRef, url);

  // Mute-Prop auf das <video> anwenden.
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted, videoRef]);

  const classes = [
    'theatre-player',
    focused ? 'is-focused' : '',
    !online ? 'is-offline' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={t('pages.theatre.playerAria', { name, focused: focused ? t('pages.theatre.focused') : '' })}
    >
      <video ref={videoRef} className="theatre-player__video" playsInline />
      {status === 'loading' && (
        <div className="theatre-player__overlay" aria-hidden="true">
          <Loader2 size={24} className="theatre-player__spinner" />
        </div>
      )}
      {status === 'error' && (
        <div className="theatre-player__overlay theatre-player__overlay--error" role="alert">
          <AlertTriangle size={24} />
          <span className="theatre-player__error-text">{name}</span>
        </div>
      )}
      <span className="theatre-player__name">{name}</span>
    </div>
  );
}
