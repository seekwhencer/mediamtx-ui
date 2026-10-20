import { useTranslation } from 'react-i18next';

export default function Spinner({ size = 'md', label, className = '' }) {
  const { t } = useTranslation();
  const text = label ?? t('common.loading');
  const classes = ['ui-spinner', size !== 'md' ? `ui-spinner--${size}` : '', className].filter(Boolean).join(' ');
  return (
    <span className={classes} role="status" aria-label={text}>
      <span className="ui-spinner__sr">{text}</span>
    </span>
  );
}
