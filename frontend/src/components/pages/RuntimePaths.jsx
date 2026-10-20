import { useNavigate } from 'react-router-dom';
import { useListQuery } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { enumLabel } from '../../utils/constants';
import DataTable from '../tables/DataTable';
import Badge from '../ui/Badge';

export default function RuntimePaths() {
  const navigate = useNavigate();
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();

  const list = useListQuery(QUERY_KEYS.runtimePaths, (p) => api.get('/paths/list', p), {
    page,
    itemsPerPage,
    refetchInterval,
  });

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'online',
      label: 'Online',
      render: (row) => <Badge value={row.online ? 'online' : 'offline'}>{row.online ? 'online' : 'offline'}</Badge>,
    },
    {
      key: 'available',
      label: 'Available',
      render: (row) => (
        <Badge value={row.available ? 'available' : 'unavailable'}>{row.available ? 'available' : 'unavailable'}</Badge>
      ),
    },
    { key: 'source.type', label: 'Source Type', render: (row) => (row.source ? enumLabel('pathSourceType', row.source.type) : '–') },
    { key: 'readers', label: 'Readers', render: (row) => (Array.isArray(row.readers) ? row.readers.length : 0) },
  ];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">Laufzeit-Pfade</h2>
          <p className="page__subtitle">Aktive Pfade: online/available, Source, Readers — Auto-Refresh alle 10 s.</p>
        </div>
      </header>

      <DataTable
        columns={columns}
        data={list.data?.items}
        loading={list.isPending}
        error={list.error}
        pagination={{
          page,
          pageCount: list.data?.pageCount ?? 1,
          itemsPerPage,
          itemCount: list.data?.itemCount,
          onPageChange: setPage,
          onItemsPerPageChange: (n) => {
            setItemsPerPage(n);
            setPage(0);
          },
        }}
        onRowClick={(row) => navigate(`/paths/${encodeURIComponent(row.name)}`)}
        emptyMessage="No active paths"
      />
    </div>
  );
}
