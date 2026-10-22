import { useTranslation } from 'react-i18next';

export default function PathTile({ name, online, active, loading, error, onClick }) {
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

  // 9.3 — Accessible Name: Pfadname + Online-Status (Dot ist nur visuell).
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
      <span className="theatre-tile__body">
        <span className="theatre-tile__icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="6" width="13" height="12" rx="2" />
            <path d="M15 10l7-3v10l-7-3" />
          </svg>
        </span>
        <span className="theatre-tile__name">{name}</span>
      </span>
      {loading && (
        <span className="theatre-tile__overlay" aria-hidden="true">
          <svg className="theatre-tile__spinner" viewBox="0 0 24 24" width="22" height="22" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="42"
              strokeDashoffset="14"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      {active && !loading && (
        <span className="theatre-tile__overlay" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      )}
    </button>
  );
}
