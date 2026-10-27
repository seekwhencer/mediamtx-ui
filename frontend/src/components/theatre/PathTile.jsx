import { useTranslation } from 'react-i18next';
import { Video, Play, Loader2 } from 'lucide-react';
import RecordingBadge from '../ui/RecordingBadge';

export default function PathTile({ name, online, recording, active, loading, error, onClick }) {
  const { t } = useTranslation();
  const classes = [
    'theatre-tile',
    active ? 'is-active' : '',
    loading ? 'is-loading' : '',
    error ? 'is-error' : '',
    !online ? 'is-offline' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // 9.3 — Accessible name: path name + online status (dot is purely visual).
  const status = online ? t('common.online') : t('common.offline');

  return (
    <button
      type="button"
      className={classes}
      data-path={name}
      onClick={onClick}
      aria-pressed={active}
      aria-label={t('pages.theatre.tileAria', { name, status })}
    >
      <span className="theatre-tile__dot" aria-hidden="true" />
      {recording !== undefined && (
        <span className="theatre-tile__rec" aria-hidden="true">
          <RecordingBadge record={recording} online={online} compact />
        </span>
      )}
      <span className="theatre-tile__body">
        <span className="theatre-tile__icon" aria-hidden="true">
          <Video size={22} strokeWidth={1.8} />
        </span>
        <span className="theatre-tile__name">{name}</span>
      </span>
      {loading && (
        <span className="theatre-tile__overlay" aria-hidden="true">
          <Loader2 size={22} className="theatre-tile__spinner" />
        </span>
      )}
      {active && !loading && (
        <span className="theatre-tile__overlay" aria-hidden="true">
          <Play size={30} fill="currentColor" />
        </span>
      )}
    </button>
  );
}
