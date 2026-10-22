import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useListQuery } from '../../hooks/useApi';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useHlsPlayer } from '../../hooks/useHlsPlayer';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { buildHlsUrl } from '../../utils/buildHlsUrl';
import PathTile from '../theatre/PathTile';
import TheatreTopBar from '../theatre/TheatreTopBar';

// Zentrierter Hinweis/Empty-State über dem (schwarzen) Video-Hintergrund.
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

  // 4.1 — Alle Pfade (online + offline), Auto-Refresh aktiv.
  const refetchInterval = useAutoRefresh();
  const list = useListQuery(QUERY_KEYS.runtimePaths, (p) => api.get('/paths/list', p), {
    itemsPerPage: 500,
    refetchInterval,
  });
  const items = list.data?.items ?? [];

  // 4.4 — HLS-Base-URL konfiguriert? (buildHlsUrl liefert '' ohne Base)
  const hlsConfigured = buildHlsUrl('probe') !== '';

  // 4.3 — useHlsPlayer-Verdrahtung: activePath → URL, sonst null (Stopp).
  // 8.2 — errorKind: 'none' | 'offline' | 'cors' | 'network' (klare Fehlermeldung).
  const { status, supported, errorKind } = useHlsPlayer(videoRef, activePath ? buildHlsUrl(activePath) : null);

  // 8.3 — Aktiver Tile bleibt sichtbar: bei activePath-Wechsel in den Strip scrollen.
  // dataset-Vergleich statt CSS-Selector → Sonderzeichen im Pfadnamen sind egal (8.4).
  useEffect(() => {
    if (!activePath || !stripRef.current) return;
    const tile = Array.from(stripRef.current.children).find(
      (el) => el instanceof HTMLElement && el.dataset.path === activePath
    );
    if (tile) tile.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activePath]);

  // 7.3 — Tile-Navigation nur möglich, wenn der Tile-Strip gerendert wird.
  const canInteract = supported && hlsConfigured && !list.isError && items.length > 0;

  // 4.2 — Klick: inaktiv → Start · aktiv → Stopp · anderer → Wechsel.
  const handleTileClick = (name) => {
    setActivePath((prev) => (prev === name ? null : name));
  };

  // 6.1 — Exit: navigate(-1) → Unmount → Stream stoppt (useHlsPlayer destroy).
  const handleExit = () => navigate(-1);

  // 7.2 + 7.3 — Keyboard (THEATRE.md §6.4):
  // - Esc: kontextabhängig → Fullscreen aktiv? verlassen : Stream stoppen.
  // - ←/→: zum vorherigen/nächsten Tile springen (Wrap-around), nur mit Tiles.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          setActivePath(null);
        }
        return;
      }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && canInteract) {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        setActivePath((prev) => {
          if (prev === null) {
            // Kein aktiver Pfad: → startet ersten, ← startet letzten.
            return dir === 1 ? items[0].name : items[items.length - 1].name;
          }
          const idx = items.findIndex((it) => it.name === prev);
          if (idx === -1) return prev; // aktiver Pfad nicht mehr in der Liste
          const next = (idx + dir + items.length) % items.length;
          return items[next].name;
        });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [canInteract, items]);

  // 4.4 — Empty-States (Vordergrund). Reihenfolge: fundamentalste Einschränkung zuerst.
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
  } else {
    // Normalfall: Hinweis/Fehler + Tile-Strip (Vordergrund).
    content = (
      <>
        {activePath && status === 'error' && (
          <div className="theatre__error" role="alert">
            {/* 8.2 — CORS/offline klar benennen, sonst generischer Stream-Fehler. */}
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

        {/* 9.3 — Tile-Strip als benannte Gruppe für Screenreader. */}
        <div className="theatre-strip" ref={stripRef} aria-label={t('pages.theatre.stripAria')}>
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

  // Video (Hintergrund) + Top-Bar (6.x) + Content (Empty-State oder Tiles).
  return (
    <div className="theatre">
      <video ref={videoRef} className="theatre__video" playsInline />
      <TheatreTopBar videoRef={videoRef} activePath={activePath} onExit={handleExit} />
      {content}
    </div>
  );
}
