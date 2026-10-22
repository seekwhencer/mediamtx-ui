// SSR-Smoke-Test Phase 7: Config-Pages rendern ohne JS-Fehler.
// Pending-State (Spinner) + Error-State (ErrorAlert statt Crash) + Data-State (Formular).
import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import React from 'react';
import path from 'node:path';
// WICHTIG: react-query per Node-ESM importen (nicht ssrLoadModule).
// Die Pages werden von Vite externalisiert → Node-ESM-Instanz.
// ssrLoadModule würde eine zweite Instanz erzeugen → "No QueryClient set".
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const nm = path.resolve(process.cwd(), 'node_modules');

const vite = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  resolve: {
    alias: [
      // Vite-8-SSR löst die CJS-Entry (node-Kondition) auf → auf ESM-Builds aliasen.
      { find: 'react-router/dom', replacement: path.join(nm, 'react-router/dist/development/dom-export.mjs') },
      { find: 'react-router-dom', replacement: path.join(nm, 'react-router-dom/dist/index.mjs') },
      { find: 'react-router', replacement: path.join(nm, 'react-router/dist/development/index.mjs') },
    ],
  },
});

let failures = 0;

// Phase 9: itemsPerPage kommt jetzt aus den App-Settings (Default 100).
// Für diese Regression-Tests auf 25 pinnen (Query-Keys sind mit 25 seeded).
const { setAppSettings } = await vite.ssrLoadModule('/src/services/appSettings.js');
setAppSettings({ itemsPerPage: 25 });

async function load(mod) {
  const m = await vite.ssrLoadModule(mod);
  return m.default;
}

async function renderPage(pageMod, { queryClient = null, route = '/', routePath = null } = {}) {
  const Page = await load(pageMod);
  const { MemoryRouter, Route, Routes } = await vite.ssrLoadModule('react-router-dom');
  const Layout = await load('/src/components/layout/Layout.jsx');

  // retryOnMount: false → seeded Error-State bleibt sichtbar (sonst optimistisches Pending).
  const qc = queryClient || new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
  const path = routePath || (route === '/' ? '/' : route);
  const tree = React.createElement(
    QueryClientProvider,
    { client: qc },
    React.createElement(
      MemoryRouter,
      { initialEntries: [route] },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, { element: React.createElement(Layout) },
          React.createElement(Route, { path, element: React.createElement(Page) })
        )
      )
    )
  );
  return renderToString(tree);
}

function check(label, html, mustContain) {
  const missing = mustContain.filter((s) => !html.includes(s));
  if (missing.length) {
    failures++;
    console.log(`FAIL ${label}: missing ${JSON.stringify(missing)}`);
  } else {
    console.log(`OK   ${label} (${html.length} bytes)`);
  }
}

// [mod, route (URL), routePath (Router-Pfad, für :name-Params), title (Array von Suchstrings)]
// Titel mit dynamischem Namen: React-SSR setzt zwischen Text + Ausdruck ein <!-- -->,
// daher statischer Teil und Name getrennt prüfen.
const PAGES = [
  ['/src/components/pages/ConfigGlobal.jsx', '/config/global', null, ['Globale Konfiguration']],
  ['/src/components/pages/ConfigPathDefaults.jsx', '/config/path-defaults', null, ['Path Defaults']],
  ['/src/components/pages/InternalUsers.jsx', '/config/internal-users', null, ['Interne Benutzer']],
  ['/src/components/pages/ConfigPaths.jsx', '/config/paths', null, ['Pfad-Konfigurationen']],
  ['/src/components/pages/ConfigPathDetail.jsx', '/config/paths/cam1', '/config/paths/:name', ['Pfad-Konfiguration:', 'cam1']],
];

// 1) Pending-State (kein MediaMTX, Query läuft) → Spinner, kein Crash
for (const [mod, route, routePath, title] of PAGES) {
  try {
    const html = await renderPage(mod, { route, routePath });
    check(`pending ${route}`, html, [...title, 'ui-spinner']);
  } catch (e) {
    failures++;
    console.log(`FAIL pending ${route}: ${e.message}`);
  }
}

// 2) Error-State (Query im Error-Zustand) → ErrorAlert statt Crash
async function errorClient(queryKey, message = 'MediaMTX unreachable', code = 'upstream_unreachable') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
  const err = new Error(message);
  err.code = code;
  err.status = 502;
  const cache = qc.getQueryCache();
  const entry = cache.build(qc, { queryKey, queryFn: async () => { throw err; } });
  entry.setState({ status: 'error', error: err, data: undefined });
  return qc;
}

// Listen-Pages: useListQuery hängt [page, itemsPerPage] = [0, 25] an den Query-Key.
const ERROR_CASES = [
  ['/src/components/pages/ConfigGlobal.jsx', '/config/global', null, ['config', 'global'], ['Globale Konfiguration']],
  ['/src/components/pages/ConfigPathDefaults.jsx', '/config/path-defaults', null, ['config', 'path-defaults'], ['Path Defaults']],
  ['/src/components/pages/InternalUsers.jsx', '/config/internal-users', null, ['config', 'internal-users', 0, 25], ['Interne Benutzer']],
  ['/src/components/pages/ConfigPaths.jsx', '/config/paths', null, ['config', 'paths', 0, 25], ['Pfad-Konfigurationen']],
  ['/src/components/pages/ConfigPathDetail.jsx', '/config/paths/cam1', '/config/paths/:name', ['config', 'paths', 'cam1'], ['Pfad-Konfiguration:', 'cam1']],
];

for (const [mod, route, routePath, key, title] of ERROR_CASES) {
  try {
    const qc = await errorClient(key);
    const html = await renderPage(mod, { route, routePath, queryClient: qc });
    check(`error ${route}`, html, [...title, 'ui-erroralert', 'upstream_unreachable']);
  } catch (e) {
    failures++;
    console.log(`FAIL error ${route}: ${e.message}`);
  }
}

// 3) Data-State: GlobalConfigForm mit geladenem GlobalConf → Formular mit Gruppen
{
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
  qc.setQueryData(['config', 'global'], {
    api: true,
    apiAddress: ':9997',
    logLevel: 'info',
    hls: true,
    hlsSegmentDuration: '1s',
    hlsVariant: 'fmp4',
    rtspTransports: ['udp', 'tcp'],
    webrtcICEServers2: [{ url: 'stun:stun.l.google.com:19302', username: '', password: '', clientOnly: false }],
    record: true, // deprecated-Feld aus dem geladenen Objekt → muss ausgeblendet bleiben
  });
  try {
    const html = await renderPage('/src/components/pages/ConfigGlobal.jsx', { route: '/config/global', queryClient: qc });
    check('data /config/global', html, [
      'formbuilder',
      'General',
      'Authentication',
      'HLS',
      'WebRTC',
      'stun:stun.l.google.com:19302',
      'fmp4',
    ]);
    if (html.includes('Record Delete After') || html.includes('recordDeleteAfter')) {
      failures++;
      console.log('FAIL data /config/global: deprecated-Feld sichtbar');
    } else {
      console.log('OK   deprecated-Felder ausgeblendet');
    }
  } catch (e) {
    failures++;
    console.log(`FAIL data /config/global: ${e.message}`);
  }
}

// 4) Data-State: PathConf-Formular (Path Defaults) mit Slidern + ListEditor
{
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
  qc.setQueryData(['config', 'path-defaults'], {
    source: 'rtsp://example.com/stream',
    maxReaders: 5,
    record: true,
    recordFormat: 'fmp4',
    rpiCameraBrightness: 50,
    rpiCameraEV: -2.5,
    forward: [{ dest: 'rtmp://out.example.com/live', destFingerprint: '', moqTransport: '', whipBearerToken: '' }],
    alwaysAvailableTracks: [{ codec: 'Opus', sampleRate: 48000, channelCount: 2, muLaw: false }],
  });
  try {
    const html = await renderPage('/src/components/pages/ConfigPathDefaults.jsx', { route: '/config/path-defaults', queryClient: qc });
    check('data /config/path-defaults', html, [
      'formbuilder',
      'rtsp://example.com/stream',
      'ui-slider',
      'listeditor',
      'rtmp://out.example.com/live',
      'Opus',
    ]);
  } catch (e) {
    failures++;
    console.log(`FAIL data /config/path-defaults: ${e.message}`);
  }
}

// 5) Data-State: InternalUsers-Tabelle mit Zeile + ConfigPaths-Tabelle mit Zeile
{
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
  qc.setQueryData(['config', 'internal-users', 0, 25], {
    itemCount: 1,
    pageCount: 1,
    items: [
      {
        id: '11111111-2222-3333-4444-555555555555',
        pos: 1,
        user: 'admin',
        pass: 'secret',
        ips: ['127.0.0.1'],
        permissions: [{ action: 'publish', path: 'cam1' }, { action: 'read', path: 'cam2' }],
      },
    ],
  });
  try {
    const html = await renderPage('/src/components/pages/InternalUsers.jsx', { route: '/config/internal-users', queryClient: qc });
    // React-SSR setzt zwischen benachbarten Text-Knoten ein <!-- --> → nur die ID prüfen.
    check('data /config/internal-users', html, ['admin', '127.0.0.1', 'publish:cam1', 'read:cam2', '11111111']);
  } catch (e) {
    failures++;
    console.log(`FAIL data /config/internal-users: ${e.message}`);
  }
}
{
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
  qc.setQueryData(['config', 'paths', 0, 25], {
    itemCount: 1,
    pageCount: 1,
    items: [
      {
        name: 'cam1',
        source: 'rtsp://in.example.com/stream',
        record: true,
        alwaysAvailable: false,
        forward: [{ dest: 'rtmp://out.example.com/live' }],
        maxReaders: 10,
      },
    ],
  });
  try {
    const html = await renderPage('/src/components/pages/ConfigPaths.jsx', { route: '/config/paths', queryClient: qc });
    check('data /config/paths', html, ['cam1', 'rtsp://in.example.com/stream', 'Edit', 'Replace', 'Delete']);
  } catch (e) {
    failures++;
    console.log(`FAIL data /config/paths: ${e.message}`);
  }
}

// 6) Data-State: ConfigPathDetail (Pfad-Name mit Sonderzeichen → encodeURIComponent)
{
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
  qc.setQueryData(['config', 'paths', 'cam 1/x'], { source: 'udp://:9000', maxReaders: 1 });
  try {
    // URL encodiert (wie im Browser, auch der Slash), react-router dekodiert den :name-Param.
    const html = await renderPage('/src/components/pages/ConfigPathDetail.jsx', {
      route: '/config/paths/cam%201%2Fx',
      routePath: '/config/paths/:name',
      queryClient: qc,
    });
    check('data /config/paths/cam 1/x', html, ['Pfad-Konfiguration:', 'cam 1/x', 'udp://:9000']);
  } catch (e) {
    failures++;
    console.log(`FAIL data /config/paths/cam 1/x: ${e.message}`);
  }
}

await vite.close();
console.log(failures === 0 ? '\nALL SMOKE TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
