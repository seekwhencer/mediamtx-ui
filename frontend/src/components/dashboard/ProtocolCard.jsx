import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import ErrorAlert from '../ui/ErrorAlert';

export default function ProtocolCard({ title, to, metrics, error }) {
  const { t } = useTranslation();
  const loading = metrics.some((m) => m.loading);

  return (
    <Card
      title={title}
      actions={to && <Link className="ui-link" to={to}>{t('common.detailsArrow')}</Link>}
    >
      {error ? (
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
