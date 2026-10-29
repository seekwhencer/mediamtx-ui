import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, PowerOff } from 'lucide-react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import ErrorAlert from '../ui/ErrorAlert';

export default function ProtocolCard({ title, to, metrics, error, icon: Icon, disabled, pending }) {
  const { t } = useTranslation();
  const loading = !disabled && metrics.some((m) => m.loading);

  return (
    <Card
      title={title}
      icon={Icon}
      className={disabled && !pending ? 'ui-card--disabled' : ''}
      actions={to && (
        <Link className="ui-link ui-link--icon" to={to}>
          {t('common.detailsArrow')}
          <ArrowRight size={14} />
        </Link>
      )}
    >
      {pending ? (
        <Spinner size="sm" label={t('dashboard.loading', { title })} />
      ) : disabled ? (
        <div className="protocol-card__disabled">
          <PowerOff size={16} className="protocol-card__disabled-icon" />
          <span>{t('dashboard.disabled')}</span>
        </div>
      ) : error ? (
        <ErrorAlert error={error} title={t('dashboard.notReachable', { title })} />
      ) : loading ? (
        <Spinner size="sm" label={t('dashboard.loading', { title })} />
      ) : (
        <ul className="protocol-card__metrics">
          {metrics.map((m) => (
            <li key={m.label}>
              <span className="protocol-card__label">{m.label}</span>
              <span className="protocol-card__value">{m.value ?? '–'}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
