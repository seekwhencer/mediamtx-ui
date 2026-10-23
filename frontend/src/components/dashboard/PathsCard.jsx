import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import ErrorAlert from '../ui/ErrorAlert';
import DataTable from '../tables/DataTable';
import Badge from '../ui/Badge';
import { enumLabel } from '../../utils/constants';

export default function PathsCard({ data, loading, error }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = data?.items ?? [];
  const online = items.filter((p) => p.online).length;
  const available = items.filter((p) => p.available).length;

  const columns = [
    { key: 'name', label: t('pages.runtimePaths.name') },
    {
      key: 'online',
      label: t('pages.runtimePaths.online'),
      render: (row) => <Badge value={row.online ? 'online' : 'offline'}>{row.online ? t('common.online') : t('common.offline')}</Badge>,
    },
    {
      key: 'available',
      label: t('pages.runtimePaths.available'),
      render: (row) => (
        <Badge value={row.available ? 'available' : 'unavailable'}>{row.available ? t('common.available') : t('common.unavailable')}</Badge>
      ),
    },
    { key: 'source.type', label: t('pages.runtimePaths.sourceType'), render: (row) => (row.source ? enumLabel('pathSourceType', row.source.type, t) : '–') },
    { key: 'readers', label: t('pages.runtimePaths.readers'), render: (row) => (Array.isArray(row.readers) ? row.readers.length : 0) },
  ];

  return (
    <Card
      title={t('dashboard.paths')}
      icon={Activity}
      actions={
        <Link className="ui-link ui-link--icon" to="/paths">
          {t('dashboard.allPaths')}
          <ArrowRight size={14} />
        </Link>
      }
    >
      {error ? (
        <ErrorAlert error={error} title={t('dashboard.pathsNotReachable')} />
      ) : loading ? (
        <Spinner size="sm" label={t('dashboard.pathsLoading')} />
      ) : (
        <>
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
          <div className="paths-card__paths-list">
            <DataTable
              columns={columns}
              data={items}
              onRowClick={(row) => navigate(`/paths/${encodeURIComponent(row.name)}`)}
              emptyMessage={t('pages.runtimePaths.noActivePaths')}
            />
          </div>
        </>
      )}
    </Card>
  );
}
