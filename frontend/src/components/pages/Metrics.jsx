import { useTranslation } from 'react-i18next';
import { Radio, Video, MonitorPlay, SatelliteDish, Wifi, Boxes } from 'lucide-react';
import { useMetrics } from '../../hooks/useMetrics';
import MetricCard from '../metrics/MetricCard';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ErrorAlert from '../ui/ErrorAlert';
import Spinner from '../ui/Spinner';
import DataTable from '../tables/DataTable';
import { formatBytes } from '../../utils/formatBytes';

const PROTOCOLS = [
  { key: 'hls', icon: Radio },
  { key: 'rtsp', icon: Video },
  { key: 'rtmp', icon: MonitorPlay },
  { key: 'srt', icon: SatelliteDish },
  { key: 'webrtc', icon: Wifi },
  { key: 'moq', icon: Boxes },
];

// Zeilen pro Protokoll — datengetrieben (nur vorhandene Felder).
function protocolRows(p, t) {
  const rows = [];
  if (p?.muxers != null) rows.push({ label: t('pages.metrics.protocols.muxers'), value: p.muxers });
  if (p?.conns != null) rows.push({ label: t('pages.metrics.protocols.conns'), value: p.conns });
  if (p?.sessions != null) rows.push({ label: t('pages.metrics.protocols.sessions'), value: p.sessions });
  if (p?.inboundBytes != null) rows.push({ label: t('pages.metrics.protocols.inbound'), value: formatBytes(p.inboundBytes) });
  if (p?.outboundBytes != null) rows.push({ label: t('pages.metrics.protocols.outbound'), value: formatBytes(p.outboundBytes) });
  return rows;
}

export default function Metrics() {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = useMetrics();

  const totals = data?.totals;
  const protocols = data?.protocols;
  const paths = data?.paths ?? [];
  const forwardDests = data?.forwardDests ?? [];
  const isEmpty = !!data && paths.length === 0 && forwardDests.length === 0;

  const pathColumns = [
    { key: 'name', label: t('pages.metrics.paths.name') },
    { key: 'state', label: t('pages.metrics.paths.state'), render: (row) => <Badge value={row.state}>{row.state}</Badge> },
    { key: 'readers', label: t('pages.metrics.paths.readers') },
    { key: 'inboundBytes', label: t('pages.metrics.paths.inbound'), render: (row) => formatBytes(row.inboundBytes) },
    { key: 'outboundBytes', label: t('pages.metrics.paths.outbound'), render: (row) => formatBytes(row.outboundBytes) },
    { key: 'inboundFramesInError', label: t('pages.metrics.paths.framesInError') },
  ];

  const forwardColumns = [
    { key: 'id', label: t('pages.metrics.forward.id') },
    { key: 'path', label: t('pages.metrics.forward.path') },
    { key: 'type', label: t('pages.metrics.forward.type') },
    { key: 'state', label: t('pages.metrics.forward.state'), render: (row) => <Badge value={row.state}>{row.state}</Badge> },
    { key: 'outboundBytes', label: t('pages.metrics.forward.outbound'), render: (row) => formatBytes(row.outboundBytes) },
  ];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.metrics.title')}</h2>
          <p className="page__subtitle">{t('pages.metrics.subtitle')}</p>
        </div>
      </header>

      {isPending && !data ? (
        <div className="table__loading">
          <Spinner label={t('pages.metrics.loading')} />
        </div>
      ) : (
        <>
          {isError && <ErrorAlert error={error} title={t('pages.metrics.error')} />}

          {isEmpty ? (
            <div className="metrics__empty">{t('pages.metrics.empty')}</div>
          ) : (
            <div className={isError ? 'metrics__sections metrics__stale' : 'metrics__sections'}>
              <section className="metrics__section">
                <h3 className="metrics__section-title">{t('pages.metrics.totals.title')}</h3>
                <div className="card-grid">
                  <MetricCard label={t('pages.metrics.totals.pathsOnline')} value={totals?.pathsOnline ?? '–'} />
                  <MetricCard label={t('pages.metrics.totals.readers')} value={totals?.readers ?? '–'} />
                  <MetricCard
                    label={t('pages.metrics.totals.inbound')}
                    value={formatBytes(totals?.inboundBytes)}
                    sub={`${formatBytes(totals?.inboundBytesPerSec)} ${t('pages.metrics.totals.perSec')}`}
                  />
                  <MetricCard
                    label={t('pages.metrics.totals.outbound')}
                    value={formatBytes(totals?.outboundBytes)}
                    sub={`${formatBytes(totals?.outboundBytesPerSec)} ${t('pages.metrics.totals.perSec')}`}
                  />
                  <MetricCard label={t('pages.metrics.totals.framesInError')} value={totals?.inboundFramesInError ?? '–'} />
                </div>
              </section>

              <section className="metrics__section">
                <h3 className="metrics__section-title">{t('pages.metrics.protocols.title')}</h3>
                <div className="card-grid">
                  {PROTOCOLS.map(({ key, icon: Icon }) => (
                    <Card key={key} title={t(`pages.metrics.protocols.${key}`)} icon={Icon}>
                      <ul className="metric-list">
                        {protocolRows(protocols?.[key], t).map((r) => (
                          <li key={r.label}>
                            <span className="metric-list__label">{r.label}</span>
                            <span className="metric-list__value">{r.value}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="metrics__section">
                <h3 className="metrics__section-title">{t('pages.metrics.paths.title')}</h3>
                <Card>
                  <DataTable columns={pathColumns} data={paths} emptyMessage={t('pages.metrics.paths.noPaths')} />
                </Card>
              </section>

              <section className="metrics__section">
                <h3 className="metrics__section-title">{t('pages.metrics.forward.title')}</h3>
                <Card>
                  <DataTable columns={forwardColumns} data={forwardDests} emptyMessage={t('pages.metrics.forward.noDests')} />
                </Card>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
