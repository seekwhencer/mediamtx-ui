import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
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
  const { t } = useTranslation();
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
    { key: 'id', label: t('pages.runtimePathDetail.id'), render: (row) => <code className="mono">{String(row.id).slice(0, 8)}…</code> },
    { key: 'type', label: t('pages.runtimePathDetail.type'), render: (row) => enumLabel('forwardDestType', row.type, t) },
    { key: 'state', label: t('pages.runtimePathDetail.state'), render: (row) => <Badge value={row.state}>{enumLabel('forwardDestState', row.state, t)}</Badge> },
    { key: 'outboundBytes', label: t('pages.runtimePathDetail.outbound'), render: (row) => formatBytes(row.outboundBytes) },
    { key: 'lastError', label: t('pages.runtimePathDetail.lastError'), render: (row) => row.lastError || '–' },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (row) => (
        <div className="rowactions" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setFwdDetail(row)}>
            {t('pages.runtimePathDetail.details')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.runtimePathDetail.title', { name })}</h2>
          <p className="page__subtitle">{t('pages.runtimePathDetail.subtitle')}</p>
        </div>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/paths')}>
          {t('pages.runtimePathDetail.back')}
        </Button>
      </header>

      {path.error ? (
        <ErrorAlert error={path.error} title={t('pages.runtimePathDetail.pathNotLoaded')} />
      ) : path.isPending ? (
        <div className="table__loading">
          <Spinner />
        </div>
      ) : (
        <>
          <DetailSection title={t('pages.runtimePathDetail.status')}>
            <div className="detail__badges">
              <Badge value={p.online ? 'online' : 'offline'}>{p.online ? t('common.online') : t('common.offline')}</Badge>
              <Badge value={p.available ? 'available' : 'unavailable'}>{p.available ? t('common.available') : t('common.unavailable')}</Badge>
            </div>
            <dl className="detail__rows">
              <div className="detail__row">
                <dt>{t('pages.runtimePathDetail.confName')}</dt>
                <dd>{p.confName || '–'}</dd>
              </div>
              <div className="detail__row">
                <dt>{t('pages.runtimePathDetail.onlineSince')}</dt>
                <dd>{formatDate(p.onlineTime)}</dd>
              </div>
              <div className="detail__row">
                <dt>{t('pages.runtimePathDetail.availableSince')}</dt>
                <dd>{formatDate(p.availableTime)}</dd>
              </div>
              <div className="detail__row">
                <dt>{t('pages.runtimePathDetail.inboundBytes')}</dt>
                <dd>{formatBytes(p.inboundBytes)}</dd>
              </div>
              <div className="detail__row">
                <dt>{t('pages.runtimePathDetail.outboundBytes')}</dt>
                <dd>{formatBytes(p.outboundBytes)}</dd>
              </div>
              <div className="detail__row">
                <dt>{t('pages.runtimePathDetail.inboundFramesInError')}</dt>
                <dd>{p.inboundFramesInError ?? 0}</dd>
              </div>
            </dl>
          </DetailSection>

          <DetailSection title={t('pages.runtimePathDetail.source')}>
            {p.source ? (
              <dl className="detail__rows">
                <div className="detail__row">
                  <dt>{t('pages.runtimePathDetail.type')}</dt>
                  <dd>{enumLabel('pathSourceType', p.source.type, t)}</dd>
                </div>
                <div className="detail__row">
                  <dt>{t('pages.runtimePathDetail.id')}</dt>
                  <dd>{p.source.id || '–'}</dd>
                </div>
              </dl>
            ) : (
              <p className="detail__hint">{t('pages.runtimePathDetail.noSource')}</p>
            )}
          </DetailSection>

          <DetailSection title={t('pages.runtimePathDetail.readers', { count: readers.length })}>
            {readers.length ? (
              <ul className="readerlist">
                {readers.map((r, i) => (
                  <li key={r.id ?? i}>
                    <Badge color="blue">{enumLabel('pathReaderType', r.type, t)}</Badge>
                    <code className="mono">{r.id}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail__hint">{t('pages.runtimePathDetail.noReaders')}</p>
            )}
          </DetailSection>

          <DetailSection title={t('pages.runtimePathDetail.tracks', { count: tracks.length })}>
            {tracks.length ? (
              <div className="tracklist">
                {tracks.map((tr, i) => (
                  <div className="track" key={i}>
                    <Badge color="blue">{tr.codec}</Badge>
                    <JsonBlock data={tr.codecProps} title={t('pages.runtimePathDetail.codecProps')} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="detail__hint">{t('pages.runtimePathDetail.noTracks')}</p>
            )}
          </DetailSection>

          <DetailSection title={t('pages.runtimePathDetail.forwardDestinations')}>
            <DataTable
              columns={fwdColumns}
              data={forwardDests.data?.items}
              loading={forwardDests.isPending}
              error={forwardDests.error}
              emptyMessage={t('pages.runtimePathDetail.noForwardDests')}
            />
          </DetailSection>

          <DetailSection title={t('pages.runtimePathDetail.staticSource')}>
            {staticSource.error ? (
              staticSource.error.status === 404 ? (
                <p className="detail__hint">{t('pages.runtimePathDetail.noStaticSource')}</p>
              ) : (
                <ErrorAlert error={staticSource.error} title={t('pages.runtimePathDetail.staticSourceNotLoaded')} />
              )
            ) : staticSource.isPending ? (
              <Spinner size="sm" label={t('pages.runtimePathDetail.loading')} />
            ) : (
              <>
                <dl className="detail__rows">
                  <div className="detail__row">
                    <dt>{t('pages.runtimePathDetail.created')}</dt>
                    <dd>{formatDate(staticSource.data.created)}</dd>
                  </div>
                  <div className="detail__row">
                    <dt>{t('pages.runtimePathDetail.state')}</dt>
                    <dd>
                      <Badge value={staticSource.data.state}>{enumLabel('staticSourceState', staticSource.data.state, t)}</Badge>
                    </dd>
                  </div>
                  <div className="detail__row">
                    <dt>{t('pages.runtimePathDetail.type')}</dt>
                    <dd>{enumLabel('pathSourceType', staticSource.data.type, t)}</dd>
                  </div>
                  <div className="detail__row">
                    <dt>{t('pages.runtimePathDetail.lastError')}</dt>
                    <dd>{staticSource.data.lastError || '–'}</dd>
                  </div>
                </dl>
                <JsonBlock data={staticSource.data.typeSpecific} title={t('pages.runtimePathDetail.typeSpecific')} />
              </>
            )}
          </DetailSection>
        </>
      )}

      <Modal
        title={t('pages.runtimePathDetail.forwardDest', { id: fwdDetail ? String(fwdDetail.id).slice(0, 8) : '' })}
        isOpen={!!fwdDetail}
        onClose={() => setFwdDetail(null)}
      >
        {fwdDetail && (
          <div className="formdialog">
            <JsonBlock data={fwdDetail.typeSpecific} title={t('pages.runtimePathDetail.typeSpecific')} />
            <JsonBlock data={fwdDetail} title={t('pages.runtimePathDetail.forwardDestFull')} />
          </div>
        )}
      </Modal>
    </div>
  );
}
