import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PowerOff } from 'lucide-react';

export default function ProtocolDisabledNotice({ protocol }) {
  const { t } = useTranslation();
  return (
    <div className="protocol-disabled-notice">
      <PowerOff size={22} className="protocol-disabled-notice__icon" />
      <div className="protocol-disabled-notice__body">
        <strong>{t('pages.protocolDisabled.title', { protocol })}</strong>
        <p>{t('pages.protocolDisabled.hint')}</p>
        <Link className="ui-link" to="/config/global">
          {t('pages.protocolDisabled.enableLink')}
        </Link>
      </div>
    </div>
  );
}
