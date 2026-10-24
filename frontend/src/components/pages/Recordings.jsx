import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Trash2, Maximize, X } from 'lucide-react';
import { buildPlaybackUrl } from '../../utils/buildPlaybackUrl';
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
  const { t } = useTranslation();
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();
  const refetchInterval = useAutoRefresh();
  const [detailName, setDetailName] = useState(null);
  const [detailFallback, setDetailFallback] = useState(null);
  const [playingSegment, setPlayingSegment] = useState(null);
  const videoRef = useRef(null);

  const list = useListQuery(QUERY_KEYS.recordings, (p) => api.get('/recordings/list', p), {
    page,
    itemsPerPage,
    refetchInterval,
  });

  const deleteSegment = useMutationWithInvalidate(
    (v) => api.delete('/recordings/segments/delete', { path: v.name, start: v.start }),
    [QUERY_KEYS.recordings]
  );

  // Derive the detail from the live list (stays current after segment delete), fallback = clicked row.
  const detail = useMemo(() => {
    if (!detailName) return null;
    const live = (list.data?.items || []).find((r) => r.name === detailName);
    return live ?? detailFallback;
  }, [detailName, list.data, detailFallback]);

  const playUrl = useMemo(() => {
    if (!playingSegment || !detail) return null;
    return buildPlaybackUrl({ path: detail.name, start: playingSegment.start });
  }, [playingSegment, detail]);

  const closeDetail = () => {
    setPlayingSegment(null);
    setDetailName(null);
    setDetailFallback(null);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else video.requestFullscreen().catch(() => {});
  };

  const columns = [
    { key: 'name', label: t('pages.recordings.name') },
    { key: 'segments', label: t('pages.recordings.segments'), render: (row) => (Array.isArray(row.segments) ? row.segments.length : 0) },
  ];

  const segments = detail && Array.isArray(detail.segments) ? detail.segments : [];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.recordings.title')}</h2>
          <p className="page__subtitle">{t('pages.recordings.subtitle')}</p>
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
        emptyMessage={t('pages.recordings.noRecordings')}
      />

      <Modal
        title={t('pages.recordings.recording', { name: detail?.name ?? '' })}
        isOpen={!!detail}
        onClose={closeDetail}
      >
        {detail && (
          <div className="formdialog">
            {playUrl ? (
              <div className="recording-player">
                <video ref={videoRef} src={playUrl} controls playsInline className="recording-player__video" />
                <div className="recording-player__actions">
                  <Button variant="ghost" size="sm" icon={Maximize} onClick={toggleFullscreen}>
                    {t('pages.recordings.fullscreen')}
                  </Button>
                  <Button variant="ghost" size="sm" icon={X} onClick={() => setPlayingSegment(null)}>
                    {t('pages.recordings.stop')}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="formdialog__hint">{t('pages.recordings.playerHint')}</p>
            )}

            {segments.length ? (
              <ul className="segmentlist">
                {segments.map((seg) => (
                  <li key={seg.start}>
                    <span className="segmentlist__start">{formatDate(seg.start)}</span>
                    <div className="segmentlist__actions">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Play}
                        onClick={() => setPlayingSegment(seg)}
                      >
                        {t('pages.recordings.play')}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        loading={deleteSegment.isPending}
                        onClick={() => deleteSegment.mutate({ name: detail.name, start: seg.start })}
                      >
                        {t('pages.recordings.delete')}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="formdialog__hint">{t('pages.recordings.noSegments')}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
