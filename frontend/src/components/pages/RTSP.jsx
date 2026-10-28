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
import { enumLabel } from '../../utils/constants';
import DataTable from '../tables/DataTable';
import Badge from '../ui/Badge';
import Tabs from '../ui/Tabs';
import KickButton from '../ui/KickButton';
import ProtocolDisabledNotice from '../ui/ProtocolDisabledNotice';

function RTSPSection({ base }) {
  const { t } = useTranslation();
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();
  const enabled = useProtocolEnabled(base);

  const conns = useListQuery(QUERY_KEYS[`${base}Conns`], (p) => api.get(`/${base}/conns/list`, p), {
    page,
    itemsPerPage,
    refetchInterval,
    enabled,
  });
  const sessions = useListQuery(QUERY_KEYS[`${base}Sessions`], (p) => api.get(`/${base}/sessions/list`, p), {
    page,
    itemsPerPage,
    refetchInterval,
    enabled,
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
    { key: 'id', label: t('pages.rtsp.id'), render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'created', label: t('pages.rtsp.created'), render: (row) => formatDate(row.created) },
    { key: 'remoteAddr', label: t('pages.rtsp.remoteAddr') },
    { key: 'session', label: t('pages.rtsp.session'), render: (row) => (row.session ? <code className="mono">{String(row.session).slice(0, 8)}…</code> : '–') },
    { key: 'tunnel', label: t('pages.rtsp.tunnel'), render: (row) => row.tunnel || '–' },
    { key: 'inboundBytes', label: t('pages.rtsp.inbound'), render: (row) => formatBytes(row.inboundBytes) },
    { key: 'outboundBytes', label: t('pages.rtsp.outbound'), render: (row) => formatBytes(row.outboundBytes) },
  ];

  const sessionColumns = [
    { key: 'id', label: t('pages.rtsp.id'), render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'created', label: t('pages.rtsp.created'), render: (row) => formatDate(row.created) },
    { key: 'path', label: t('pages.rtsp.path') },
    { key: 'remoteAddr', label: t('pages.rtsp.remoteAddr') },
    { key: 'user', label: t('pages.rtsp.user'), render: (row) => row.user || '–' },
    { key: 'state', label: t('pages.rtsp.state'), render: (row) => <Badge value={row.state}>{enumLabel('rtspSessionState', row.state, t)}</Badge> },
    { key: 'transport', label: t('pages.rtsp.transport'), render: (row) => (row.transport ? enumLabel('rtspTransport', row.transport, t) : '–') },
    { key: 'inboundBytes', label: t('pages.rtsp.inbound'), render: (row) => formatBytes(row.inboundBytes) },
    { key: 'outboundBytes', label: t('pages.rtsp.outbound'), render: (row) => formatBytes(row.outboundBytes) },
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

  return enabled ? (
    <Tabs
      items={[
        {
          id: 'conns',
          label: t('pages.rtsp.connections'),
          content: (
            <DataTable
              columns={connColumns}
              data={conns.data?.items}
              loading={conns.isPending}
              error={conns.error}
              pagination={pagination}
              emptyMessage={t('pages.rtsp.noConnections', { proto: base.toUpperCase() })}
            />
          ),
        },
        {
          id: 'sessions',
          label: t('pages.rtsp.sessions'),
          content: (
            <DataTable
              columns={sessionColumns}
              data={sessions.data?.items}
              loading={sessions.isPending}
              error={sessions.error}
              pagination={pagination}
              emptyMessage={t('pages.rtsp.noSessions', { proto: base.toUpperCase() })}
            />
          ),
        },
      ]}
    />
  ) : (
    <ProtocolDisabledNotice protocol={base.toUpperCase()} />
  );
}

export default function RTSP() {
  const { t } = useTranslation();
  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.rtsp.title')}</h2>
          <p className="page__subtitle">{t('pages.rtsp.subtitle')}</p>
        </div>
      </header>

      <RTSPSection base="rtsp" />
    </div>
  );
}
