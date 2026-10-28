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
import DataTable from '../tables/DataTable';
import Badge from '../ui/Badge';
import Tabs from '../ui/Tabs';
import KickButton from '../ui/KickButton';
import ProtocolDisabledNotice from '../ui/ProtocolDisabledNotice';

export default function HLS() {
  const { t } = useTranslation();
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();
  const enabled = useProtocolEnabled('hls');

  const muxers = useListQuery(QUERY_KEYS.hlsMuxers, (p) => api.get('/hls/muxers/list', p), {
    page,
    itemsPerPage,
    refetchInterval,
    enabled,
  });
  const sessions = useListQuery(QUERY_KEYS.hlsSessions, (p) => api.get('/hls/sessions/list', p), {
    page,
    itemsPerPage,
    refetchInterval,
    enabled,
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
    { key: 'path', label: t('pages.hls.path') },
    { key: 'created', label: t('pages.hls.created'), render: (row) => formatDate(row.created) },
    { key: 'lastRequest', label: t('pages.hls.lastRequest'), render: (row) => formatDate(row.lastRequest) },
    { key: 'outboundBytes', label: t('pages.hls.outbound'), render: (row) => formatBytes(row.outboundBytes) },
    { key: 'outboundFramesDiscarded', label: t('pages.hls.framesDiscarded'), render: (row) => row.outboundFramesDiscarded ?? 0 },
  ];

  const sessionColumns = [
    { key: 'id', label: t('pages.hls.id'), render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'created', label: t('pages.hls.created'), render: (row) => formatDate(row.created) },
    { key: 'path', label: t('pages.hls.path') },
    { key: 'remoteAddr', label: t('pages.hls.remoteAddr') },
    { key: 'user', label: t('pages.hls.user'), render: (row) => row.user || '–' },
    { key: 'userAgent', label: t('pages.hls.userAgent'), render: (row) => row.userAgent || '–' },
    {
      key: 'isCDN',
      label: t('pages.hls.cdn'),
      render: (row) => <Badge color={row.isCDN ? 'blue' : 'gray'}>{row.isCDN ? t('common.yes') : t('common.no')}</Badge>,
    },
    { key: 'outboundBytes', label: t('pages.hls.outbound'), render: (row) => formatBytes(row.outboundBytes) },
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
          <h2 className="page__title">{t('pages.hls.title')}</h2>
          <p className="page__subtitle">{t('pages.hls.subtitle')}</p>
        </div>
      </header>

      {enabled ? (
        <Tabs
          items={[
            {
              id: 'muxers',
              label: t('pages.hls.muxers'),
              content: (
                <DataTable
                  columns={muxerColumns}
                  data={muxers.data?.items}
                  loading={muxers.isPending}
                  error={muxers.error}
                  pagination={pagination}
                  emptyMessage={t('pages.hls.noMuxers')}
                />
              ),
            },
            {
              id: 'sessions',
              label: t('pages.hls.sessions'),
              content: (
                <DataTable
                  columns={sessionColumns}
                  data={sessions.data?.items}
                  loading={sessions.isPending}
                  error={sessions.error}
                  pagination={pagination}
                  emptyMessage={t('pages.hls.noSessions')}
                />
              ),
            },
          ]}
        />
      ) : (
        <ProtocolDisabledNotice protocol="HLS" />
      )}
    </div>
  );
}
