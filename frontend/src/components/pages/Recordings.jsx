import { useMemo, useState } from 'react';
import { useListQuery, useMutationWithInvalidate } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { formatDate } from '../../utils/formatDate';
import DataTable from '../tables/DataTable';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function Recordings() {
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();
  const [detailName, setDetailName] = useState(null);
  const [detailFallback, setDetailFallback] = useState(null);

  const list = useListQuery(QUERY_KEYS.recordings, (p) => api.get('/recordings/list', p), {
    page,
    itemsPerPage,
    refetchInterval,
  });

  const deleteSegment = useMutationWithInvalidate(
    (v) => api.delete('/recordings/segments/delete', { path: v.name, start: v.start }),
    [QUERY_KEYS.recordings]
  );

  // Detail aus der Live-Liste ableiten (bleibt nach Segment-Delete aktuell), Fallback = geklickte Zeile.
  const detail = useMemo(() => {
    if (!detailName) return null;
    const live = (list.data?.items || []).find((r) => r.name === detailName);
    return live ?? detailFallback;
  }, [detailName, list.data, detailFallback]);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'segments', label: 'Segments', render: (row) => (Array.isArray(row.segments) ? row.segments.length : 0) },
  ];

  const segments = detail && Array.isArray(detail.segments) ? detail.segments : [];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">Recordings</h2>
          <p className="page__subtitle">Aufnahmen + Segmente (Delete) — Auto-Refresh alle 10 s.</p>
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
        onRowClick={(row) => {
          setDetailName(row.name);
          setDetailFallback(row);
        }}
        emptyMessage="No recordings"
      />

      <Modal
        title={`Recording: ${detail?.name ?? ''}`}
        isOpen={!!detail}
        onClose={() => {
          setDetailName(null);
          setDetailFallback(null);
        }}
      >
        {detail && (
          <div className="formdialog">
            {segments.length ? (
              <ul className="segmentlist">
                {segments.map((seg) => (
                  <li key={seg.start}>
                    <span className="segmentlist__start">{formatDate(seg.start)}</span>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={deleteSegment.isPending}
                      onClick={() => deleteSegment.mutate({ name: detail.name, start: seg.start })}
                    >
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="formdialog__hint">Keine Segmente (no segments).</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
