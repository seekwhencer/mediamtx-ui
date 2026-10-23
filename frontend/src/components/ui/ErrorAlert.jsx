import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

export default function ErrorAlert({ error, title }) {
  const { t } = useTranslation();
  const titleText = title ?? t('common.error');
  const msg = error?.message || (typeof error === 'string' ? error : t('common.unknownError'));
  const code = error?.code;
  const status = error?.status;
  const meta = [code, status ? `HTTP ${status}` : null].filter(Boolean).join(' · ');

  return (
    <div className="ui-erroralert" role="alert">
      <AlertTriangle size={18} className="ui-erroralert__icon" />
      <div className="ui-erroralert__content">
        <strong>{titleText}</strong>
        <span>{msg}</span>
        {meta && <code className="ui-erroralert__meta">{meta}</code>}
      </div>
    </div>
  );
}
