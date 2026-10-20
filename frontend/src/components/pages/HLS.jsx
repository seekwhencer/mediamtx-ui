import { useListQuery } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useKick } from '../../hooks/useKick';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { formatBytes } from '../../utils/formatBytes';
import { formatDate } from '../../utils/formatDate';
import DataTable from '../tables/DataTable';
import Badge from '../ui/Badge';
import Tabs from '../ui/Tabs';
import KickButton from '../ui/KickButton';

export default function HLS() {
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();

  const muxers = useListQuery(QUERY_KEYS.hlsMuxers, (p) => api.get('/hls/muxers/list', p), {
    page,
    itemsPerPage,
    refetchInterval,
  });
  const sessions = useListQuery(QUERY_KEYS.hlsSessions, (p) => api.get('/hls/sessions/list', p), {
    page,
    itemsPerPage,
    refetchInterval,
  });
  const kick = useKick('/hls/sessions/kick', [QUERY_KEYS.hlsSessions]);

  const pagination = {
    page,
    pageCount: (muxers.data?.pageCount ?? sessions.data?.pageCount) || 1,
    itemsPerPage,
    itemCount: muxers.data?.itemCount ?? sessions.data?.itemCount,
    onPageChange: setPage,
    onItemsPerPageChange: (n) => {
      setItemsPerPage(n);
      setPage(0);
    },
  };

  const muxerColumns = [
    { key: 'path', label: 'Path' },
    { key: 'created', label: 'Created', render: (row) => formatDate(row.created) },
    { key: 'lastRequest', label: 'Last Request', render: (row) => formatDate(row.lastRequest) },
    { key: 'outboundBytes', label: 'Outbound', render: (row) => formatBytes(row.outboundBytes) },
    { key: 'outboundFramesDiscarded', label: 'Frames Discarded', render: (row) => row.outboundFramesDiscarded ?? 0 },
  ];

  const sessionColumns = [
    { key: 'id', label: 'ID', render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'created', label: 'Created', render: (row) => formatDate(row.created) },
    { key: 'path', label: 'Path' },
    { key: 'remoteAddr', label: 'Remote Addr' },
    { key: 'user', label: 'User', render: (row) => row.user || '–' },
    { key: 'userAgent', label: 'User Agent', render: (row) => row.userAgent || '–' },
    {
      key: 'isCDN',
      label: 'CDN',
      render: (row) => <Badge color={row.isCDN ? 'blue' : 'gray'}>{row.isCDN ? 'yes' : 'no'}</Badge>,
    },
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
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">HLS</h2>
          <p className="page__subtitle">Muxer & Sessions — Auto-Refresh alle 10 s.</p>
        </div>
      </header>

      <Tabs
        items={[
          {
            id: 'muxers',
            label: 'Muxer',
            content: (
              <DataTable
                columns={muxerColumns}
                data={muxers.data?.items}
                loading={muxers.isPending}
                error={muxers.error}
                pagination={pagination}
                emptyMessage="No HLS muxers"
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
                emptyMessage="No HLS sessions"
              />
            ),
          },
        ]}
      />
    </div>
  );
}
