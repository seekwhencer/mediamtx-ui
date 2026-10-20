import { useTranslation } from 'react-i18next';

export default function ErrorAlert({ error, title }) {
  const { t } = useTranslation();
  const titleText = title ?? t('common.error');
  const msg = error?.message || (typeof error === 'string' ? error : t('common.unknownError'));
  const code = error?.code;
  const status = error?.status;
  const meta = [code, status ? `HTTP ${status}` : null].filter(Boolean).join(' · ');

  return (
    <div className="ui-erroralert" role="alert">
      <strong>{titleText}</strong>
      <span>{msg}</span>
      {meta && <code className="ui-erroralert__meta">{meta}</code>}
    </div>
  );
}
