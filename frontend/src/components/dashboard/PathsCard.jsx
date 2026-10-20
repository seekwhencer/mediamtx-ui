import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import ErrorAlert from '../ui/ErrorAlert';

export default function PathsCard({ data, loading, error }) {
  const { t } = useTranslation();
  const items = data?.items ?? [];
  const online = items.filter((p) => p.online).length;
  const available = items.filter((p) => p.available).length;

  return (
    <Card
      title={t('dashboard.paths')}
      actions={<Link className="ui-link" to="/paths">{t('dashboard.allPaths')}</Link>}
    >
      {error ? (
        <ErrorAlert error={error} title={t('dashboard.pathsNotReachable')} />
      ) : loading ? (
        <Spinner size="sm" label={t('dashboard.pathsLoading')} />
      ) : (
        <div className="paths-card__stats">
          <div className="paths-card__stat">
            <span className="paths-card__value">{data?.itemCount ?? '–'}</span>
            <span className="paths-card__label">{t('dashboard.totalPaths')}</span>
          </div>
          <div className="paths-card__stat">
            <span className="paths-card__value">{online}</span>
            <span className="paths-card__label">{t('common.online')}</span>
          </div>
          <div className="paths-card__stat">
            <span className="paths-card__value">{available}</span>
            <span className="paths-card__label">{t('common.available')}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
