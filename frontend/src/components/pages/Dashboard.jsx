import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useListQuery } from '../../hooks/useApi';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import InfoCard from '../dashboard/InfoCard';
import ProtocolCard from '../dashboard/ProtocolCard';
import PathsCard from '../dashboard/PathsCard';
import QuickLinks from '../dashboard/QuickLinks';

export default function Dashboard() {
  const refetchInterval = useAutoRefresh();

  const info = useQuery({
    queryKey: QUERY_KEYS.info,
    queryFn: () => api.get('/info'),
    refetchInterval,
    retry: false,
  });

  const hlsMuxers = useListQuery(QUERY_KEYS.hlsMuxers, (p) => api.get('/hls/muxers/list', p), { refetchInterval });
  const hlsSessions = useListQuery(QUERY_KEYS.hlsSessions, (p) => api.get('/hls/sessions/list', p), { refetchInterval });
  const rtspConns = useListQuery(QUERY_KEYS.rtspConns, (p) => api.get('/rtsp/conns/list', p), { refetchInterval });
  const rtspSessions = useListQuery(QUERY_KEYS.rtspSessions, (p) => api.get('/rtsp/sessions/list', p), { refetchInterval });
  const rtmpConns = useListQuery(QUERY_KEYS.rtmpConns, (p) => api.get('/rtmp/conns/list', p), { refetchInterval });
  const srtConns = useListQuery(QUERY_KEYS.srtConns, (p) => api.get('/srt/conns/list', p), { refetchInterval });
  const webrtcSessions = useListQuery(QUERY_KEYS.webrtcSessions, (p) => api.get('/webrtc/sessions/list', p), { refetchInterval });
  const moqSessions = useListQuery(QUERY_KEYS.moqSessions, (p) => api.get('/moq/sessions/list', p), { refetchInterval });
  const paths = useListQuery(QUERY_KEYS.runtimePaths, (p) => api.get('/paths/list', p), { refetchInterval });

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">Dashboard</h2>
          <p className="page__subtitle">Übersicht: Protokolle, Instanz, Pfade — Auto-Refresh alle 10 s.</p>
        </div>
      </header>

      <InfoCard info={info.data} loading={info.isPending} error={info.error} />

      <section className="dashboard__section">
        <h3 className="dashboard__section-title">Protokolle</h3>
        <div className="card-grid">
          <ProtocolCard
            title="HLS"
            to="/hls"
            error={hlsMuxers.error || hlsSessions.error}
            metrics={[
              { label: 'Muxer', value: hlsMuxers.data?.itemCount, loading: hlsMuxers.isPending },
              { label: 'Sessions', value: hlsSessions.data?.itemCount, loading: hlsSessions.isPending },
            ]}
          />
          <ProtocolCard
            title="RTSP"
            to="/rtsp"
            error={rtspConns.error || rtspSessions.error}
            metrics={[
              { label: 'Conns', value: rtspConns.data?.itemCount, loading: rtspConns.isPending },
              { label: 'Sessions', value: rtspSessions.data?.itemCount, loading: rtspSessions.isPending },
            ]}
          />
          <ProtocolCard
            title="RTMP"
            to="/rtmp"
            error={rtmpConns.error}
            metrics={[{ label: 'Conns', value: rtmpConns.data?.itemCount, loading: rtmpConns.isPending }]}
          />
          <ProtocolCard
            title="SRT"
            to="/srt"
            error={srtConns.error}
            metrics={[{ label: 'Conns', value: srtConns.data?.itemCount, loading: srtConns.isPending }]}
          />
          <ProtocolCard
            title="WebRTC"
            to="/webrtc"
            error={webrtcSessions.error}
            metrics={[{ label: 'Sessions', value: webrtcSessions.data?.itemCount, loading: webrtcSessions.isPending }]}
          />
          <ProtocolCard
            title="MoQ"
            to="/moq"
            error={moqSessions.error}
            metrics={[{ label: 'Sessions', value: moqSessions.data?.itemCount, loading: moqSessions.isPending }]}
          />
        </div>
      </section>

      <PathsCard data={paths.data} loading={paths.isPending} error={paths.error} />

      <QuickLinks />
    </div>
  );
}
