import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { useAutoHide } from '../../hooks/useAutoHide';

const VIEW_MODES = ['single', 'grid', 'pip'];

/**
 * Theatre top bar (THEATRE.md §6.3 + PLAN_THEATRE_EXTEND.md §6):
 * - left: exit button (← + Text)
 * - center: View-Switcher (Segmented-Control: Single / Grid / PiP)
 * - right: current path name, mute/unmute toggle, fullscreen toggle
 * - Buttons: Icon + Text (Desktop), nur Text + kleiner (Mobile ≤768px, Icon ausgeblendet)
 * - auto-hide: 3 s ohne Mausbewegung → opacity 0; Maus/Hover → sichtbar;
 *   hidden = pointer-events none (blockiert nie)
 */
export default function TheatreTopBar({ viewMode, onViewModeChange, muted, onMuteToggle, activePath, onExit }) {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 6.3 — Fullscreen state via the fullscreenchange event.
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // 6.4 — Auto-hide logic (shared hook: timer + visibility).
  const { visible, show, scheduleHide } = useAutoHide();

  // 6.3 — Fullscreen on document.documentElement (icon via fullscreenchange).
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
        <ArrowLeft size={16} className="theatre-topbar__btn-icon" aria-hidden="true" />
        <span className="theatre-topbar__btn-label">{t('pages.theatre.back')}</span>
      </button>

      <div
        className="theatre-topbar__viewswitcher"
        role="tablist"
        aria-label={t('pages.theatre.viewModeAria')}
      >
        {VIEW_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={viewMode === mode}
            className={`theatre-topbar__viewbtn${viewMode === mode ? ' is-active' : ''}`}
            onClick={() => onViewModeChange(mode)}
          >
            {t(`pages.theatre.view${mode.charAt(0).toUpperCase()}${mode.slice(1)}`)}
          </button>
        ))}
      </div>

      <div className="theatre-topbar__right">
        {activePath && <span className="theatre-topbar__path">{activePath}</span>}

        <button
          type="button"
          className="theatre-topbar__btn"
          onClick={onMuteToggle}
          aria-label={muted ? t('pages.theatre.unmute') : t('pages.theatre.mute')}
          aria-pressed={muted}
          title={muted ? t('pages.theatre.unmute') : t('pages.theatre.mute')}
        >
          {muted ? (
            <VolumeX size={16} className="theatre-topbar__btn-icon" aria-hidden="true" />
          ) : (
            <Volume2 size={16} className="theatre-topbar__btn-icon" aria-hidden="true" />
          )}
          <span className="theatre-topbar__btn-label">
            {muted ? t('pages.theatre.unmute') : t('pages.theatre.mute')}
          </span>
        </button>

        <button
          type="button"
          className="theatre-topbar__btn"
          onClick={handleFullscreenToggle}
          aria-label={isFullscreen ? t('pages.theatre.exitFullscreen') : t('pages.theatre.fullscreen')}
          aria-pressed={isFullscreen}
          title={isFullscreen ? t('pages.theatre.exitFullscreen') : t('pages.theatre.fullscreen')}
        >
          {isFullscreen ? (
            <Minimize size={16} className="theatre-topbar__btn-icon" aria-hidden="true" />
          ) : (
            <Maximize size={16} className="theatre-topbar__btn-icon" aria-hidden="true" />
          )}
          <span className="theatre-topbar__btn-label">
            {isFullscreen ? t('pages.theatre.exitFullscreen') : t('pages.theatre.fullscreen')}
          </span>
        </button>
      </div>
    </header>
  );
}
