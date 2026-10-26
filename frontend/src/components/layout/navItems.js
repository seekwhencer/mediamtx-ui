import {
  Clapperboard, LayoutDashboard, Settings2, Users, FolderTree,
  SlidersHorizontal, Activity, Radio, Video, MonitorPlay,
  SatelliteDish, Wifi, Boxes, HardDrive, Settings, ScrollText, Gauge,
} from 'lucide-react';

// Navigation: labelKey = i18n-Key (siehe locales/*.json).
export const NAV_SECTIONS = [
  {
    labelKey: 'nav.overview',
    items: [
      { to: '/', labelKey: 'nav.dashboard', end: true, icon: LayoutDashboard },
      { to: '/theatre', labelKey: 'nav.theatre', icon: Clapperboard },
      { to: '/paths', labelKey: 'nav.paths', icon: Activity },
      { to: '/recordings', labelKey: 'nav.recordings', icon: HardDrive }
    ],
  },
  {
    labelKey: 'nav.configuration',
    items: [
      { to: '/config/global', labelKey: 'nav.global', icon: Settings2 },
      { to: '/config/internal-users', labelKey: 'nav.internalUsers', icon: Users },
      { to: '/config/paths', labelKey: 'nav.paths', icon: FolderTree },
      { to: '/config/path-defaults', labelKey: 'nav.pathDefaults', icon: SlidersHorizontal },
    ],
  },
  {
    labelKey: 'nav.runtime',
    items: [
      { to: '/hls', labelKey: 'nav.hls', icon: Radio },
      { to: '/rtsp', labelKey: 'nav.rtsp', icon: Video },
      { to: '/rtmp', labelKey: 'nav.rtmp', icon: MonitorPlay },
      { to: '/srt', labelKey: 'nav.srt', icon: SatelliteDish },
      { to: '/webrtc', labelKey: 'nav.webrtc', icon: Wifi },
      { to: '/moq', labelKey: 'nav.moq', icon: Boxes },
      { to: '/metrics', labelKey: 'nav.metrics', icon: Gauge },
      { to: '/logs', labelKey: 'nav.logs', icon: ScrollText },
    ],
  },
  {
    labelKey: 'nav.ui',
    items: [{ to: '/settings', labelKey: 'nav.settings', icon: Settings }],
  },
];

// Liefert den i18n-Key des Seiten-Titels für eine Pfad-URL.
export function titleKeyForPath(pathname) {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
        return item.labelKey;
      }
    }
  }
  return 'common.notFound';
}
