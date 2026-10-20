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
import Tabs from '../ui/Tabs';
import KickButton from '../ui/KickButton';

function RTSPSection({ base }) {
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();

  const conns = useListQuery(QUERY_KEYS[`${base}Conns`], (p) => api.get(`/${base}/conns/list`, p), {
    page,
    itemsPerPage,
    refetchInterval,
  });
  const sessions = useListQuery(QUERY_KEYS[`${base}Sessions`], (p) => api.get(`/${base}/sessions/list`, p), {
    page,
    itemsPerPage,
    refetchInterval,
  });
  const kick = useKick(`/${base}/sessions/kick`, [QUERY_KEYS[`${base}Sessions`]]);

  const pagination = {
    page,
    pageCount: (conns.data?.pageCount ?? sessions.data?.pageCount) || 1,
    itemsPerPage,
    itemCount: conns.data?.itemCount ?? sessions.data?.itemCount,
    onPageChange: setPage,
    onItemsPerPageChange: (n) => {
      setItemsPerPage(n);
      setPage(0);
    },
  };

  const connColumns = [
    { key: 'id', label: 'ID', render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'created', label: 'Created', render: (row) => formatDate(row.created) },
    { key: 'remoteAddr', label: 'Remote Addr' },
    { key: 'session', label: 'Session', render: (row) => (row.session ? <code className="mono">{String(row.session).slice(0, 8)}…</code> : '–') },
    { key: 'tunnel', label: 'Tunnel', render: (row) => row.tunnel || '–' },
    { key: 'inboundBytes', label: 'Inbound', render: (row) => formatBytes(row.inboundBytes) },
    { key: 'outboundBytes', label: 'Outbound', render: (row) => formatBytes(row.outboundBytes) },
  ];

  const sessionColumns = [
    { key: 'id', label: 'ID', render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'created', label: 'Created', render: (row) => formatDate(row.created) },
    { key: 'path', label: 'Path' },
    { key: 'remoteAddr', label: 'Remote Addr' },
    { key: 'user', label: 'User', render: (row) => row.user || '–' },
    { key: 'state', label: 'State', render: (row) => <Badge value={row.state}>{enumLabel('rtspSessionState', row.state)}</Badge> },
    { key: 'transport', label: 'Transport', render: (row) => (row.transport ? enumLabel('rtspTransport', row.transport) : '–') },
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
    <Tabs
      items={[
        {
          id: 'conns',
          label: 'Connections',
          content: (
            <DataTable
              columns={connColumns}
              data={conns.data?.items}
              loading={conns.isPending}
              error={conns.error}
              pagination={pagination}
              emptyMessage={`No ${base.toUpperCase()} connections`}
            />
          ),
        },
        {
          id: 'sessions',
          label: 'Sessions',
          content: (
            <DataTable
              columns={sessionColumns}
              data={sessions.data?.items}
              loading={sessions.isPending}
              error={sessions.error}
              pagination={pagination}
              emptyMessage={`No ${base.toUpperCase()} sessions`}
            />
          ),
        },
      ]}
    />
  );
}

export default function RTSP() {
  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">RTSP</h2>
          <p className="page__subtitle">Connections & Sessions (Kick) — Auto-Refresh alle 10 s.</p>
        </div>
      </header>

      <RTSPSection base="rtsp" />
    </div>
  );
}
