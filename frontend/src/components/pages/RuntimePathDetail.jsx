import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useListQuery } from '../../hooks/useApi';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { formatBytes } from '../../utils/formatBytes';
import { formatDate } from '../../utils/formatDate';
import { enumLabel } from '../../utils/constants';
import DataTable from '../tables/DataTable';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import ErrorAlert from '../ui/ErrorAlert';
import JsonBlock from '../ui/JsonBlock';

function DetailSection({ title, children }) {
  return (
    <section className="detail">
      <h3 className="detail__title">{title}</h3>
      {children}
    </section>
  );
}

export default function RuntimePathDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [fwdDetail, setFwdDetail] = useState(null);
  const refetchInterval = useAutoRefresh();

  const path = useQuery({
    queryKey: QUERY_KEYS.runtimePath(name),
    queryFn: () => api.get(`/paths/get/${encodeURIComponent(name)}`),
    refetchInterval,
    retry: false,
  });

  const forwardDests = useListQuery(
    QUERY_KEYS.forwardDests(name),
    (p) => api.get('/paths/forward-dests/list', { path: name, ...p }),
    { refetchInterval }
  );

  const staticSource = useQuery({
    queryKey: QUERY_KEYS.staticSource(name),
    queryFn: () => api.get(`/paths/static-sources/get/${encodeURIComponent(name)}`),
    refetchInterval,
    retry: false,
  });

  const p = path.data;
  const tracks = Array.isArray(p?.tracks2) ? p.tracks2 : [];
  const readers = Array.isArray(p?.readers) ? p.readers : [];

  const fwdColumns = [
    { key: 'id', label: 'ID', render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'type', label: 'Type', render: (row) => enumLabel('forwardDestType', row.type) },
    { key: 'state', label: 'State', render: (row) => <Badge value={row.state}>{enumLabel('forwardDestState', row.state)}</Badge> },
    { key: 'outboundBytes', label: 'Outbound', render: (row) => formatBytes(row.outboundBytes) },
    { key: 'lastError', label: 'Last Error', render: (row) => row.lastError || '–' },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (row) => (
        <div className="rowactions" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setFwdDetail(row)}>
            Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">Pfad: {name}</h2>
          <p className="page__subtitle">Laufzeit-Details: Source, Readers, Tracks, Forward-Destinations, Static Source.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/paths')}>
          ← Back
        </Button>
      </header>

      {path.error ? (
        <ErrorAlert error={path.error} title="Pfad nicht geladen" />
      ) : path.isPending ? (
        <div className="table__loading">
          <Spinner />
        </div>
      ) : (
        <>
          <DetailSection title="Status">
            <div className="detail__badges">
              <Badge value={p.online ? 'online' : 'offline'}>{p.online ? 'online' : 'offline'}</Badge>
              <Badge value={p.available ? 'available' : 'unavailable'}>{p.available ? 'available' : 'unavailable'}</Badge>
            </div>
            <dl className="detail__rows">
              <div className="detail__row">
                <dt>Conf Name</dt>
                <dd>{p.confName || '–'}</dd>
              </div>
              <div className="detail__row">
                <dt>Online Since</dt>
                <dd>{formatDate(p.onlineTime)}</dd>
              </div>
              <div className="detail__row">
                <dt>Available Since</dt>
                <dd>{formatDate(p.availableTime)}</dd>
              </div>
              <div className="detail__row">
                <dt>Inbound Bytes</dt>
                <dd>{formatBytes(p.inboundBytes)}</dd>
              </div>
              <div className="detail__row">
                <dt>Outbound Bytes</dt>
                <dd>{formatBytes(p.outboundBytes)}</dd>
              </div>
              <div className="detail__row">
                <dt>Inbound Frames in Error</dt>
                <dd>{p.inboundFramesInError ?? 0}</dd>
              </div>
            </dl>
          </DetailSection>

          <DetailSection title="Source">
            {p.source ? (
              <dl className="detail__rows">
                <div className="detail__row">
                  <dt>Type</dt>
                  <dd>{enumLabel('pathSourceType', p.source.type)}</dd>
                </div>
                <div className="detail__row">
                  <dt>ID</dt>
                  <dd>{p.source.id || '–'}</dd>
                </div>
              </dl>
            ) : (
              <p className="detail__hint">Keine Source (no source).</p>
            )}
          </DetailSection>

          <DetailSection title={`Readers (${readers.length})`}>
            {readers.length ? (
              <ul className="readerlist">
                {readers.map((r, i) => (
                  <li key={r.id ?? i}>
                    <Badge color="blue">{enumLabel('pathReaderType', r.type)}</Badge>
                    <code className="mono">{r.id}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail__hint">Keine Readers (no readers).</p>
            )}
          </DetailSection>

          <DetailSection title={`Tracks (${tracks.length})`}>
            {tracks.length ? (
              <div className="tracklist">
                {tracks.map((t, i) => (
                  <div className="track" key={i}>
                    <Badge color="blue">{t.codec}</Badge>
                    <JsonBlock data={t.codecProps} title="codecProps" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="detail__hint">Keine Tracks (no tracks).</p>
            )}
          </DetailSection>

          <DetailSection title="Forward Destinations">
            <DataTable
              columns={fwdColumns}
              data={forwardDests.data?.items}
              loading={forwardDests.isPending}
              error={forwardDests.error}
              emptyMessage="No forward destinations"
            />
          </DetailSection>

          <DetailSection title="Static Source">
            {staticSource.error ? (
              staticSource.error.status === 404 ? (
                <p className="detail__hint">Keine Static Source für diesen Pfad (not available).</p>
              ) : (
                <ErrorAlert error={staticSource.error} title="Static Source nicht geladen" />
              )
            ) : staticSource.isPending ? (
              <Spinner size="sm" label="Lädt…" />
            ) : (
              <>
                <dl className="detail__rows">
                  <div className="detail__row">
                    <dt>Created</dt>
                    <dd>{formatDate(staticSource.data.created)}</dd>
                  </div>
                  <div className="detail__row">
                    <dt>State</dt>
                    <dd>
                      <Badge value={staticSource.data.state}>{enumLabel('staticSourceState', staticSource.data.state)}</Badge>
                    </dd>
                  </div>
                  <div className="detail__row">
                    <dt>Type</dt>
                    <dd>{enumLabel('pathSourceType', staticSource.data.type)}</dd>
                  </div>
                  <div className="detail__row">
                    <dt>Last Error</dt>
                    <dd>{staticSource.data.lastError || '–'}</dd>
                  </div>
                </dl>
                <JsonBlock data={staticSource.data.typeSpecific} title="typeSpecific" />
              </>
            )}
          </DetailSection>
        </>
      )}

      <Modal
        title={`Forward Destination: ${fwdDetail ? String(fwdDetail.id).slice(0, 8) : ''}`}
        isOpen={!!fwdDetail}
        onClose={() => setFwdDetail(null)}
      >
        {fwdDetail && (
          <div className="formdialog">
            <JsonBlock data={fwdDetail.typeSpecific} title="typeSpecific" />
            <JsonBlock data={fwdDetail} title="ForwardDest" />
          </div>
        )}
      </Modal>
    </div>
  );
}
