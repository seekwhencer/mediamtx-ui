export const NAV_SECTIONS = [
  {
    label: 'Übersicht',
    items: [{ to: '/', label: 'Dashboard', end: true }],
  },
  {
    label: 'Konfiguration',
    items: [
      { to: '/config/global', label: 'Global' },
      { to: '/config/internal-users', label: 'Interne Benutzer' },
      { to: '/config/paths', label: 'Pfade' },
      { to: '/config/path-defaults', label: 'Path Defaults' }
    ],
  },
  {
    label: 'Laufzeit',
    items: [
      { to: '/paths', label: 'Pfade' },
      { to: '/hls', label: 'HLS' },
      { to: '/rtsp', label: 'RTSP' },
      { to: '/rtmp', label: 'RTMP' },
      { to: '/srt', label: 'SRT' },
      { to: '/webrtc', label: 'WebRTC' },
      { to: '/moq', label: 'MoQ' },
    ],
  },
  {
    label: 'Aufnahmen',
    items: [{ to: '/recordings', label: 'Recordings' }],
  },
  {
    label: 'Einstellungen',
    items: [{ to: '/settings', label: 'Settings' }],
  },
];

export function titleForPath(pathname) {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
        return item.label;
      }
    }
  }
  return 'Nicht gefunden';
}
