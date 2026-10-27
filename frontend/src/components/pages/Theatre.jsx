import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useListQuery } from '../../hooks/useApi';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useAutoHide } from '../../hooks/useAutoHide';
import { useHlsPlayer } from '../../hooks/useHlsPlayer';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { buildHlsUrl } from '../../utils/buildHlsUrl';
import PathTile from '../theatre/PathTile';
import StreamPlayer from '../theatre/StreamPlayer';
import TheatreTopBar from '../theatre/TheatreTopBar';

// Centered hint/empty state over the (black) video background.
function EmptyState({ title, text }) {
  return (
    <div className="theatre__empty">
      {title && <h2 className="theatre__empty-title">{title}</h2>}
      <p className="theatre__empty-text">{text}</p>
    </div>
  );
}

export default function Theatre() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const stripRef = useRef(null);
  const [activePath, setActivePath] = useState(null);
  const [viewMode, setViewMode] = useState('single');
  const [muted, setMuted] = useState(false);
  const [focusedPath, setFocusedPath] = useState(null);

  // 4.1 — All paths (online + offline), auto-refresh enabled.
  const refetchInterval = useAutoRefresh();
  const list = useListQuery(QUERY_KEYS.runtimePaths, (p) => api.get('/paths/list', p), {
    itemsPerPage: 500,
    refetchInterval,
  });
  const items = list.data?.items ?? [];

  // 4.4 — HLS base URL configured? (buildHlsUrl returns '' without a base)
  const hlsConfigured = buildHlsUrl('probe') !== '';

  // 6.4 — Tile-Strip auto-hide (same behavior as the top bar).
  const { visible: stripVisible, show: showStrip, scheduleHide: scheduleStripHide } = useAutoHide();

  // 4.3 — useHlsPlayer wiring: activePath → URL, otherwise null (stop).
  // Only active in single view; grid/pip use their own StreamPlayer instances.
  // 8.2 — errorKind: 'none' | 'offline' | 'cors' | 'network' (clear error message).
  const { status, supported, errorKind } = useHlsPlayer(
    videoRef,
    viewMode === 'single' && activePath ? buildHlsUrl(activePath) : null
  );

  // 8.3 — Active tile stays visible: scroll the strip on activePath change (single view).
  useEffect(() => {
    if (!activePath || !stripRef.current) return;
    const tile = Array.from(stripRef.current.children).find(
      (el) => el instanceof HTMLElement && el.dataset.path === activePath
    );
    if (tile) tile.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activePath]);

  // 7.3 — Tile navigation only possible in single view when the tile strip is rendered.
  const canInteract = viewMode === 'single' && supported && hlsConfigured && !list.isError && items.length > 0;

  // 4.2 — Click: inactive → start · active → stop · other → switch.
  const handleTileClick = (name) => {
    setActivePath((prev) => (prev === name ? null : name));
  };

  // 6.1 — Exit: navigate(-1) → unmount → stream stops (useHlsPlayer destroy).
  const handleExit = () => navigate(-1);

  // Mute toggle (all views).
  const handleMuteToggle = () => {
    setMuted((prev) => !prev);
  };

  // View-mode change: grid/pip start muted (autoplay policy); pip picks a focused path.
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'grid' || mode === 'pip') {
      setMuted(true);
      if (mode === 'pip' && !focusedPath) {
        setFocusedPath(activePath || items.find((it) => it.online)?.name || items[0]?.name || null);
      }
    } else if (mode === 'single' && focusedPath) {
      setActivePath(focusedPath);
    }
  };

  // 7.2 + 7.3 — Keyboard (THEATRE.md §6.4), single view only:
  // - Esc: context-dependent → fullscreen active? exit : stop stream.
  // - ←/→: jump to previous/next tile (wrap-around), only with tiles.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else if (viewMode === 'single') {
          setActivePath(null);
        }
        return;
      }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && canInteract) {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        setActivePath((prev) => {
          if (prev === null) {
            return dir === 1 ? items[0].name : items[items.length - 1].name;
          }
          const idx = items.findIndex((it) => it.name === prev);
          if (idx === -1) return prev;
          const next = (idx + dir + items.length) % items.length;
          return items[next].name;
        });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [canInteract, items, viewMode]);

  // 4.4 — Empty states (foreground). Order: most fundamental restriction first.
  let content;
  if (!supported) {
    content = <EmptyState title={t('pages.theatre.title')} text={t('pages.theatre.hlsUnsupported')} />;
  } else if (!hlsConfigured) {
    content = <EmptyState title={t('pages.theatre.title')} text={t('pages.theatre.hlsNotConfigured')} />;
  } else if (list.isError) {
    content = <EmptyState title={t('pages.theatre.title')} text={t('common.loadFailed')} />;
  } else if (list.isPending && items.length === 0) {
    content = <EmptyState text={t('common.loading')} />;
  } else if (items.length === 0) {
    content = <EmptyState title={t('pages.theatre.title')} text={t('pages.theatre.noPaths')} />;
  } else if (viewMode === 'grid') {
    // Grid-View: alle Streams gleichzeitig, Grid-Abmessungen basierend auf Stream-Anzahl.
    const n = items.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    content = (
      <div
        className="theatre-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
      >
        {items.map((item) => (
          <StreamPlayer key={item.name} name={item.name} online={item.online} muted={muted} />
        ))}
      </div>
    );
  } else if (viewMode === 'pip') {
    // PiP-View: ein Stream groß (focused), die anderen klein (Klick → promote).
    const focused = focusedPath || items[0]?.name;
    const focusedItem = items.find((it) => it.name === focused);
    content = (
      <div className="theatre-pip">
        <div className="theatre-pip__main">
          <StreamPlayer name={focused} online={focusedItem?.online} muted={muted} focused />
        </div>
        <div className="theatre-pip__thumbs">
          {items
            .filter((it) => it.name !== focused)
            .map((item) => (
              <StreamPlayer
                key={item.name}
                name={item.name}
                online={item.online}
                muted={muted}
                onClick={() => setFocusedPath(item.name)}
              />
            ))}
        </div>
      </div>
    );
  } else {
    // Single-View (unverändert): hint/error + tile strip (foreground).
    content = (
      <>
        {activePath && status === 'error' && (
          <div className="theatre__error" role="alert">
            {errorKind === 'cors'
              ? t('pages.theatre.errorCors')
              : errorKind === 'offline'
                ? t('pages.theatre.errorOffline')
                : t('pages.theatre.streamError')}
            : {activePath}
          </div>
        )}

        {!activePath && (
          <div className="theatre__hint">
            <p className="theatre__hint-text">{t('pages.theatre.selectPath')}</p>
          </div>
        )}

        {/* 9.3 — Tile strip as a named group for screen readers. */}
        <div
          className={`theatre-strip${stripVisible ? '' : ' is-hidden'}`}
          ref={stripRef}
          aria-label={t('pages.theatre.stripAria')}
          onMouseEnter={showStrip}
          onMouseLeave={scheduleStripHide}
        >
          {items.map((item) => (
            <PathTile
              key={item.name}
              name={item.name}
              online={item.online}
              active={activePath === item.name}
              loading={activePath === item.name && status === 'loading'}
              error={activePath === item.name && status === 'error'}
              onClick={() => handleTileClick(item.name)}
            />
          ))}
        </div>
      </>
    );
  }

  // Video (background, single view) + top bar + content.
  // <video> bleibt immer gemountet (useHlsPlayer-Lebenszyklus), in grid/pip via CSS ausgeblendet.
  return (
    <div className="theatre">
      <video ref={videoRef} className={`theatre__video${viewMode !== 'single' ? ' is-hidden' : ''}`} playsInline />
      <TheatreTopBar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        muted={muted}
        onMuteToggle={handleMuteToggle}
        activePath={activePath}
        onExit={handleExit}
      />
      {content}
    </div>
  );
}
