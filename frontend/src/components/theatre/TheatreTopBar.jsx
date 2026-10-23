import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

// 6.4 — Auto-Hide: 3 s ohne Mausbewegung → Bar ausgeblendet.
const HIDE_DELAY_MS = 3000;

/**
 * Theatre-Top-Bar (THEATRE.md §6.3):
 * - links: Exit-Button (←) → onExit (navigate(-1) → Unmount → Stream stoppt)
 * - rechts: aktueller Pfadname, Mute/Unmute-Toggle, Fullscreen-Toggle
 * - Auto-Hide: 3 s ohne Mausbewegung opacity 0; Maus/Hover → sichtbar;
 *   ausgeblendet = pointer-events none (blockiert nie die Interaktion)
 */
export default function TheatreTopBar({ videoRef, activePath, onExit }) {
  const { t } = useTranslation();
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);
  const hideTimerRef = useRef(null);

  // 6.2 — Icon mit echtem Video-State synchronisieren (z. B. Autoplay-Block).
  useEffect(() => {
    const video = videoRef.current;
    if (video) setMuted(video.muted);
  }, [videoRef]);

  // 6.3 — Fullscreen-State via fullscreenchange-Event.
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // 6.4 — Auto-Hide-Logik (Timer + Sichtbarkeit, Ref gegen unnötige Renders).
  const show = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (!visibleRef.current) {
      visibleRef.current = true;
      setVisible(true);
    }
  }, []);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      visibleRef.current = false;
      setVisible(false);
    }, HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    const onActivity = () => {
      show();
      scheduleHide();
    };
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('touchstart', onActivity);
    window.addEventListener('keydown', onActivity);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('touchstart', onActivity);
      window.removeEventListener('keydown', onActivity);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [show, scheduleHide]);

  // 6.2 — Mute/Unmute: wirkt sofort auf dem <video>, Icon wechselt.
  const handleMuteToggle = () => {
    const next = !muted;
    setMuted(next);
    const video = videoRef.current;
    if (video) video.muted = next;
  };

  // 6.3 — Fullscreen auf document.documentElement (Icon via fullscreenchange).
  const handleFullscreenToggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <header
      className={`theatre-topbar${visible ? '' : ' is-hidden'}`}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
    >
      <button
        type="button"
        className="theatre-topbar__btn"
        onClick={onExit}
        aria-label={t('pages.theatre.back')}
        title={t('pages.theatre.back')}
      >
        <ArrowLeft size={20} />
      </button>

      <div className="theatre-topbar__right">
        {activePath && <span className="theatre-topbar__path">{activePath}</span>}

        <button
          type="button"
          className="theatre-topbar__btn"
          onClick={handleMuteToggle}
          aria-label={muted ? t('pages.theatre.unmute') : t('pages.theatre.mute')}
          aria-pressed={muted}
          title={muted ? t('pages.theatre.unmute') : t('pages.theatre.mute')}
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <button
          type="button"
          className="theatre-topbar__btn"
          onClick={handleFullscreenToggle}
          aria-label={isFullscreen ? t('pages.theatre.exitFullscreen') : t('pages.theatre.fullscreen')}
          aria-pressed={isFullscreen}
          title={isFullscreen ? t('pages.theatre.exitFullscreen') : t('pages.theatre.fullscreen')}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>
    </header>
  );
}
