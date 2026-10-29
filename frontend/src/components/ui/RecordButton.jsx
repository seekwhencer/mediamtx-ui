import { useTranslation } from 'react-i18next';

/**
 * Record-Toggle-Button für die Runtime-Path-Liste.
 *
 * Zeigt immer "REC". Aktiv (rot) wenn record=true, inaktiv (grau) wenn record=false/null.
 * Klick toggelt den record-Wert der Path-Config.
 *
 * @param {boolean|null} record   - Aktueller record-Wert (true/false/null).
 * @param {Function}     onToggle - Callback beim Klick.
 * @param {boolean}      [loading]  - Mutation läuft.
 * @param {boolean}      [disabled] - Button deaktiviert.
 */
export default function RecordButton({ record, onToggle, loading = false, disabled = false }) {
  const { t } = useTranslation();
  const active = record === true;

  return (
    <button
      type="button"
      className={`ui-badge ${active ? 'ui-badge--red rec-badge--pulse' : 'ui-badge--gray'} rec-btn${loading ? ' rec-btn--loading' : ''}`}
      onClick={onToggle}
      disabled={disabled || loading}
      aria-pressed={active}
      title={active ? t('recording.stop') : t('recording.start')}
    >
      {active && <span className="rec-badge__dot" aria-hidden="true" />}
      {t('recording.rec')}
    </button>
  );
}
