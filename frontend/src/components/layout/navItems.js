// Navigation: labelKey = i18n-Key (siehe locales/*.json).
export const NAV_SECTIONS = [
  {
    labelKey: 'nav.theatre',
    items: [{ to: '/theatre', labelKey: 'nav.theatre' }],
  },
  {
    labelKey: 'nav.overview',
    items: [{ to: '/', labelKey: 'nav.dashboard', end: true }],
  },
  {
    labelKey: 'nav.configuration',
    items: [
      { to: '/config/global', labelKey: 'nav.global' },
      { to: '/config/internal-users', labelKey: 'nav.internalUsers' },
      { to: '/config/paths', labelKey: 'nav.paths' },
      { to: '/config/path-defaults', labelKey: 'nav.pathDefaults' },
    ],
  },
  {
    labelKey: 'nav.runtime',
    items: [
      { to: '/paths', labelKey: 'nav.paths' },
      { to: '/hls', labelKey: 'nav.hls' },
      { to: '/rtsp', labelKey: 'nav.rtsp' },
      { to: '/rtmp', labelKey: 'nav.rtmp' },
      { to: '/srt', labelKey: 'nav.srt' },
      { to: '/webrtc', labelKey: 'nav.webrtc' },
      { to: '/moq', labelKey: 'nav.moq' },
    ],
  },
  {
    labelKey: 'nav.recordings',
    items: [{ to: '/recordings', labelKey: 'nav.recordings' }],
  },
  {
    labelKey: 'nav.settings',
    items: [{ to: '/settings', labelKey: 'nav.settings' }],
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
