import { useTranslation } from 'react-i18next';
import { useListQuery } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useKick } from '../../hooks/useKick';
import { useProtocolEnabled } from '../../hooks/useProtocolEnabled';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { formatBytes } from '../../utils/formatBytes';
import { formatDate } from '../../utils/formatDate';
import { enumLabel } from '../../utils/constants';
import DataTable from '../tables/DataTable';
import Badge from '../ui/Badge';
import KickButton from '../ui/KickButton';
import ProtocolDisabledNotice from '../ui/ProtocolDisabledNotice';
import ProtocolConfigForm from '../forms/ProtocolConfigForm';

export default function MoQ() {
  const { t } = useTranslation();
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();
  const enabled = useProtocolEnabled('moq');

  const sessions = useListQuery(QUERY_KEYS.moqSessions, (p) => api.get('/moq/sessions/list', p), {
    page,
    itemsPerPage,
    refetchInterval,
    enabled,
  });
  const kick = useKick('/moq/sessions/kick', [QUERY_KEYS.moqSessions]);

  const columns = [
    { key: 'id', label: t('pages.moq.id'), render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'created', label: t('pages.moq.created'), render: (row) => formatDate(row.created) },
    { key: 'path', label: t('pages.moq.path') },
    { key: 'remoteAddr', label: t('pages.moq.remoteAddr') },
    { key: 'userAgent', label: t('pages.moq.userAgent'), render: (row) => row.userAgent || '–' },
    { key: 'state', label: t('pages.moq.state'), render: (row) => <Badge value={row.state}>{enumLabel('moqSessionState', row.state, t)}</Badge> },
    { key: 'version', label: t('pages.moq.version'), render: (row) => enumLabel('moqVersion', row.version, t) },
    { key: 'transport', label: t('pages.moq.transport'), render: (row) => row.transport || '–' },
    { key: 'inboundBytes', label: t('pages.moq.inbound'), render: (row) => formatBytes(row.inboundBytes) },
    { key: 'outboundBytes', label: t('pages.moq.outbound'), render: (row) => formatBytes(row.outboundBytes) },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (row) => (
        <div className="rowactions" onClick={(e) => e.stopPropagation()}>
          <KickButton onKick={() => kick.mutate(row.id)} loading={kick.isPending} />
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.moq.title')}</h2>
          <p className="page__subtitle">{t('pages.moq.subtitle')}</p>
        </div>
      </header>

      <ProtocolConfigForm protocol="moq" />

      {enabled ? (
        <DataTable
          columns={columns}
          data={sessions.data?.items}
          loading={sessions.isPending}
          error={sessions.error}
          pagination={{
            page,
            pageCount: sessions.data?.pageCount ?? 1,
            itemsPerPage,
            itemCount: sessions.data?.itemCount,
            onPageChange: setPage,
            onItemsPerPageChange: (n) => {
              setItemsPerPage(n);
              setPage(0);
            },
          }}
          emptyMessage={t('pages.moq.noSessions')}
        />
      ) : (
        <ProtocolDisabledNotice protocol="MoQ" />
      )}
    </div>
  );
}
