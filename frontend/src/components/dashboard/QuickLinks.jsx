import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import Card from '../ui/Card';

const LINKS = [
  { to: '/config/global', labelKey: 'dashboard.globalConfig' },
  { to: '/config/path-defaults', labelKey: 'dashboard.pathDefaults' },
  { to: '/config/internal-users', labelKey: 'dashboard.internalUsers' },
  { to: '/config/paths', labelKey: 'dashboard.pathConfigs' },
];

export default function QuickLinks() {
  const { t } = useTranslation();

  return (
    <Card title={t('dashboard.quickAccess')} icon={Zap}>
      <ul className="quicklinks">
        {LINKS.map((l) => (
          <li key={l.to}>
            <Link className="ui-link" to={l.to}>
              {t(l.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
