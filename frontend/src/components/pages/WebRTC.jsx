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

export default function WebRTC() {
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();

  const sessions = useListQuery(QUERY_KEYS.webrtcSessions, (p) => api.get('/webrtc/sessions/list', p), {
    page,
    itemsPerPage,
    refetchInterval,
  });
  const kick = useKick('/webrtc/sessions/kick', [QUERY_KEYS.webrtcSessions]);

  const columns = [
    { key: 'id', label: 'ID', render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'created', label: 'Created', render: (row) => formatDate(row.created) },
    { key: 'path', label: 'Path' },
    { key: 'remoteAddr', label: 'Remote Addr' },
    { key: 'user', label: 'User', render: (row) => row.user || '–' },
    { key: 'state', label: 'State', render: (row) => <Badge value={row.state}>{enumLabel('webrtcSessionState', row.state)}</Badge> },
    { key: 'localCandidate', label: 'Local Candidate', render: (row) => <code className="mono">{row.localCandidate || '–'}</code> },
    { key: 'remoteCandidate', label: 'Remote Candidate', render: (row) => <code className="mono">{row.remoteCandidate || '–'}</code> },
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
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">WebRTC</h2>
          <p className="page__subtitle">Sessions (Kick) — Auto-Refresh alle 10 s.</p>
        </div>
      </header>

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
        emptyMessage="No WebRTC sessions"
      />
    </div>
  );
}
