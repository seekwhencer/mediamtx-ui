import { useTranslation } from 'react-i18next';
import Badge from './Badge';

/**
 * Aufnahme-Status eines Pfades (3 Zustände + unknown).
 *
 * @param {boolean}  record   - Config-Wert (record: true/false). undefined → unknown.
 * @param {boolean}  [online] - Runtime-Online-Status (optional; verfeinert rec vs. armed).
 * @param {boolean}  [compact]- true → nur farbiger Punkt (Theater-Tiles), false → Badge mit Text.
 */
export default function RecordingBadge({ record, online, compact = false }) {
  const { t } = useTranslation();

  let state;
  if (record === true && online === true) state = 'rec';
  else if (record === true && online === false) state = 'armed';
  else if (record === false) state = 'off';
  else state = 'unknown';

  const cfg = {
    rec:     { color: 'red',   label: t('recording.rec'),  pulse: true,  aria: t('recording.ariaActive') },
    armed:   { color: 'amber', label: t('recording.armed'), pulse: false, aria: t('recording.ariaArmed') },
    off:     { color: 'gray',  label: t('recording.off'),  pulse: false, aria: t('recording.ariaOff') },
    unknown: { color: 'gray',  label: '–',                 pulse: false, aria: t('recording.ariaUnknown') },
  }[state];

  if (compact) {
    return (
      <span
        className={`rec-dot rec-dot--${state}${cfg.pulse ? ' rec-dot--pulse' : ''}`}
        role="img"
        aria-label={cfg.aria}
      />
    );
  }

  return (
    <span title={cfg.aria}>
      <Badge color={cfg.color} className={cfg.pulse ? 'rec-badge--pulse' : ''}>
        {cfg.pulse && <span className="rec-badge__dot" aria-hidden="true" />}
        {cfg.label}
      </Badge>
    </span>
  );
}
