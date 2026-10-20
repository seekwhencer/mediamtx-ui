import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import ErrorAlert from '../ui/ErrorAlert';
import { formatDate } from '../../utils/formatDate';

export default function InfoCard({ info, loading, error }) {
  const { t } = useTranslation();

  return (
    <Card title={t('dashboard.instance')}>
      {error ? (
        <ErrorAlert error={error} title={t('dashboard.instanceNotReachable')} />
      ) : loading ? (
        <Spinner size="sm" label={t('dashboard.instanceLoading')} />
      ) : (
        <dl className="info-card__rows">
          <div className="info-card__row">
            <dt>{t('dashboard.version')}</dt>
            <dd>{info?.version ?? '–'}</dd>
          </div>
          <div className="info-card__row">
            <dt>{t('dashboard.started')}</dt>
            <dd>{formatDate(info?.started)}</dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
