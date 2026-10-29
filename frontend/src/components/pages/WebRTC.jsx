import { useTranslation } from 'react-i18next';
import { useListQuery } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useKick } from '../../hooks/useKick';
import { useProtocolState } from '../../hooks/useProtocolEnabled';
import Spinner from '../ui/Spinner';
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

export default function WebRTC() {
  const { t } = useTranslation();
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();
  const { enabled, loading } = useProtocolState('webrtc');

  const sessions = useListQuery(QUERY_KEYS.webrtcSessions, (p) => api.get('/webrtc/sessions/list', p), {
    page,
    itemsPerPage,
    refetchInterval,
    enabled,
  });
  const kick = useKick('/webrtc/sessions/kick', [QUERY_KEYS.webrtcSessions]);

  const columns = [
    { key: 'id', label: t('pages.webrtc.id'), render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'created', label: t('pages.webrtc.created'), render: (row) => formatDate(row.created) },
    { key: 'path', label: t('pages.webrtc.path') },
    { key: 'remoteAddr', label: t('pages.webrtc.remoteAddr') },
    { key: 'user', label: t('pages.webrtc.user'), render: (row) => row.user || '–' },
    { key: 'state', label: t('pages.webrtc.state'), render: (row) => <Badge value={row.state}>{enumLabel('webrtcSessionState', row.state, t)}</Badge> },
    { key: 'localCandidate', label: t('pages.webrtc.localCandidate'), render: (row) => <code className="mono">{row.localCandidate || '–'}</code> },
    { key: 'remoteCandidate', label: t('pages.webrtc.remoteCandidate'), render: (row) => <code className="mono">{row.remoteCandidate || '–'}</code> },
    { key: 'inboundBytes', label: t('pages.webrtc.inbound'), render: (row) => formatBytes(row.inboundBytes) },
    { key: 'outboundBytes', label: t('pages.webrtc.outbound'), render: (row) => formatBytes(row.outboundBytes) },
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
          <h2 className="page__title">{t('pages.webrtc.title')}</h2>
          <p className="page__subtitle">{t('pages.webrtc.subtitle')}</p>
        </div>
      </header>

      <ProtocolConfigForm protocol="webrtc" />

      {loading ? (
        <Spinner size="md" label={t('common.loading')} />
      ) : enabled ? (
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
          emptyMessage={t('pages.webrtc.noSessions')}
        />
      ) : (
        <ProtocolDisabledNotice protocol="WebRTC" />
      )}
    </div>
  );
}
