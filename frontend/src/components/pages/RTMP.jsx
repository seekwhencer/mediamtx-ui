import { useListQuery } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useKick } from '../../hooks/useKick';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { formatBytes } from '../../utils/formatBytes';
import { formatDate } from '../../utils/formatDate';
import { enumLabel } from '../../utils/constants';
import DataTable from '../tables/DataTable';
import Badge from '../ui/Badge';
import KickButton from '../ui/KickButton';

function RTMPSection({ base }) {
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();

  const conns = useListQuery(QUERY_KEYS[`${base}Conns`], (p) => api.get(`/${base}/conns/list`, p), {
    page,
    itemsPerPage,
    refetchInterval,
  });
  const kick = useKick(`/${base}/conns/kick`, [QUERY_KEYS[`${base}Conns`]]);

  const columns = [
    { key: 'id', label: 'ID', render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'created', label: 'Created', render: (row) => formatDate(row.created) },
    { key: 'path', label: 'Path' },
    { key: 'remoteAddr', label: 'Remote Addr' },
    { key: 'user', label: 'User', render: (row) => row.user || '–' },
    { key: 'state', label: 'State', render: (row) => <Badge value={row.state}>{enumLabel('rtmpConnState', row.state)}</Badge> },
    { key: 'inboundBytes', label: 'Inbound', render: (row) => formatBytes(row.inboundBytes) },
    { key: 'outboundBytes', label: 'Outbound', render: (row) => formatBytes(row.outboundBytes) },
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
    <DataTable
      columns={columns}
      data={conns.data?.items}
      loading={conns.isPending}
      error={conns.error}
      pagination={{
        page,
        pageCount: conns.data?.pageCount ?? 1,
        itemsPerPage,
        itemCount: conns.data?.itemCount,
        onPageChange: setPage,
        onItemsPerPageChange: (n) => {
          setItemsPerPage(n);
          setPage(0);
        },
      }}
      emptyMessage={`No ${base.toUpperCase()} connections`}
    />
  );
}

export default function RTMP() {
  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">RTMP</h2>
          <p className="page__subtitle">Connections (Kick) — Auto-Refresh alle 10 s.</p>
        </div>
      </header>

      <RTMPSection base="rtmp" />
    </div>
  );
}
