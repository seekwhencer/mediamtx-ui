import { useState } from 'react';
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
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import JsonBlock from '../ui/JsonBlock';
import KickButton from '../ui/KickButton';

export default function SRT() {
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();
  const [statsRow, setStatsRow] = useState(null);

  const conns = useListQuery(QUERY_KEYS.srtConns, (p) => api.get('/srt/conns/list', p), {
    page,
    itemsPerPage,
    refetchInterval,
  });
  const kick = useKick('/srt/conns/kick', [QUERY_KEYS.srtConns]);

  const columns = [
    { key: 'id', label: 'ID', render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'created', label: 'Created', render: (row) => formatDate(row.created) },
    { key: 'path', label: 'Path' },
    { key: 'remoteAddr', label: 'Remote Addr' },
    { key: 'user', label: 'User', render: (row) => row.user || '–' },
    { key: 'state', label: 'State', render: (row) => <Badge value={row.state}>{enumLabel('srtConnState', row.state)}</Badge> },
    { key: 'inboundBytes', label: 'Inbound', render: (row) => formatBytes(row.inboundBytes) },
    { key: 'outboundBytes', label: 'Outbound', render: (row) => formatBytes(row.outboundBytes) },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (row) => (
        <div className="rowactions" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setStatsRow(row)}>
            Stats
          </Button>
          <KickButton onKick={() => kick.mutate(row.id)} loading={kick.isPending} />
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">SRT</h2>
          <p className="page__subtitle">Connections (Kick) + SRT-Statistiken — Auto-Refresh alle 10 s.</p>
        </div>
      </header>

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
        emptyMessage="No SRT connections"
      />

      <Modal
        title={`SRT Stats: ${statsRow ? String(statsRow.id).slice(0, 8) : ''}`}
        isOpen={!!statsRow}
        onClose={() => setStatsRow(null)}
      >
        {statsRow && <JsonBlock data={statsRow} title="SRTConn (inkl. Statistiken)" />}
      </Modal>
    </div>
  );
}
