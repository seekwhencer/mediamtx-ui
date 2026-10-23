import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppSettings } from './services/appSettings';
import { applyPrimaryHue } from './utils/primaryColor';
import Layout from './components/layout/Layout';
import Dashboard from './components/pages/Dashboard';
import ConfigGlobal from './components/pages/ConfigGlobal';
import ConfigPathDefaults from './components/pages/ConfigPathDefaults';
import InternalUsers from './components/pages/InternalUsers';
import InternalUserDetail from './components/pages/InternalUserDetail';
import ConfigPaths from './components/pages/ConfigPaths';
import ConfigPathDetail from './components/pages/ConfigPathDetail';
import RuntimePaths from './components/pages/RuntimePaths';
import RuntimePathDetail from './components/pages/RuntimePathDetail';
import HLS from './components/pages/HLS';
import RTSP from './components/pages/RTSP';
import RTMP from './components/pages/RTMP';
import SRT from './components/pages/SRT';
import WebRTC from './components/pages/WebRTC';
import MoQ from './components/pages/MoQ';
import Recordings from './components/pages/Recordings';
import Settings from './components/pages/Settings';
import Theatre from './components/pages/Theatre';
import NotFound from './components/pages/NotFound';

export default function App() {
  const { theme, primaryHue } = useAppSettings();

  // Theme (dark/light) via data-theme — reagiert auf Änderungen ohne Reload.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Primary-Farbton: ersetzt :root --color-primary (Sättigung + Helligkeit fix).
  useEffect(() => {
    applyPrimaryHue(primaryHue);
  }, [primaryHue]);

  return (
    <Routes>
      {/* Theater: echte Fullscreen-Oberfläche — bewusst außerhalb der Layout-Gruppe (kein Sidebar/TopBar). */}
      <Route path="theatre" element={<Theatre />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="config/global" element={<ConfigGlobal />} />
        <Route path="config/path-defaults" element={<ConfigPathDefaults />} />
        <Route path="config/internal-users" element={<InternalUsers />} />
        <Route path="config/internal-users/:id" element={<InternalUserDetail />} />
        <Route path="config/paths" element={<ConfigPaths />} />
        <Route path="config/paths/:name" element={<ConfigPathDetail />} />
        <Route path="paths" element={<RuntimePaths />} />
        <Route path="paths/:name" element={<RuntimePathDetail />} />
        <Route path="hls" element={<HLS />} />
        <Route path="rtsp" element={<RTSP />} />
        <Route path="rtmp" element={<RTMP />} />
        <Route path="srt" element={<SRT />} />
        <Route path="webrtc" element={<WebRTC />} />
        <Route path="moq" element={<MoQ />} />
        <Route path="recordings" element={<Recordings />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
