import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useListQuery } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { enumLabel } from '../../utils/constants';
import DataTable from '../tables/DataTable';
import Badge from '../ui/Badge';
import RecordButton from '../ui/RecordButton';
import { useRecordingMap } from '../../hooks/useRecordingMap';
import { useToggleRecord } from '../../hooks/useToggleRecord';

export default function RuntimePaths() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();
  const { isRecording } = useRecordingMap();
  const toggleRecord = useToggleRecord();
  const [toggling, setToggling] = useState(null);

  const list = useListQuery(QUERY_KEYS.runtimePaths, (p) => api.get('/paths/list', p), {
    page,
    itemsPerPage,
    refetchInterval,
  });

  const handleToggle = (row) => {
    const newRecord = !isRecording(row.confName);
    setToggling(row.confName);
    toggleRecord.mutate(
      { confName: row.confName, record: newRecord },
      {
        onSettled: () => setToggling(null),
        onError: (err) => console.error('Failed to toggle record:', err),
      }
    );
  };

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
    {
      key: 'record',
      label: t('pages.runtimePaths.record'),
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <RecordButton
            record={isRecording(row.confName)}
            onToggle={() => handleToggle(row)}
            loading={toggling === row.confName}
          />
        </div>
      ),
    },
    { key: 'source.type', label: t('pages.runtimePaths.sourceType'), render: (row) => (row.source ? enumLabel('pathSourceType', row.source.type, t) : '–') },
    { key: 'readers', label: t('pages.runtimePaths.readers'), render: (row) => (Array.isArray(row.readers) ? row.readers.length : 0) },
  ];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.runtimePaths.title')}</h2>
          <p className="page__subtitle">{t('pages.runtimePaths.subtitle')}</p>
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
        emptyMessage={t('pages.runtimePaths.noActivePaths')}
      />
    </div>
  );
}
