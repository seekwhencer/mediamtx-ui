// SSR-Smoke-Test Phase 8: Runtime-Pages + Recordings rendern ohne JS-Fehler.
// Pending-State (Spinner) + Error-State (ErrorAlert statt Crash) + Data-State (Tabellen, Badges, JSON-Blöcke).
import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import React from 'react';
import path from 'node:path';
// WICHTIG: react-query per Node-ESM importen (nicht ssrLoadModule).
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const nm = path.resolve(process.cwd(), 'node_modules');

const vite = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  resolve: {
    alias: [
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

function freshClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
}

async function errorClient(queryKey, message = 'MediaMTX unreachable', code = 'upstream_unreachable') {
  const qc = freshClient();
  const err = new Error(message);
  err.code = code;
  err.status = 502;
  const entry = qc.getQueryCache().build(qc, { queryKey, queryFn: async () => { throw err; } });
  entry.setState({ status: 'error', error: err, data: undefined });
  return qc;
}

// [mod, route (URL), routePath (Router-Pfad), title (Suchstrings)]
const PAGES = [
  ['/src/components/pages/RuntimePaths.jsx', '/paths', null, ['Laufzeit-Pfade']],
  ['/src/components/pages/RuntimePathDetail.jsx', '/paths/cam1', '/paths/:name', ['Pfad:', 'cam1']],
  ['/src/components/pages/HLS.jsx', '/hls', null, ['HLS', 'Muxer', 'Sessions']],
  ['/src/components/pages/RTSP.jsx', '/rtsp', null, ['RTSP / RTSPS', 'RTSP', 'RTSPS']],
  ['/src/components/pages/RTMP.jsx', '/rtmp', null, ['RTMP / RTMPS', 'RTMP', 'RTMPS']],
  ['/src/components/pages/SRT.jsx', '/srt', null, ['SRT']],
  ['/src/components/pages/WebRTC.jsx', '/webrtc', null, ['WebRTC']],
  ['/src/components/pages/MoQ.jsx', '/moq', null, ['MoQ']],
  ['/src/components/pages/Recordings.jsx', '/recordings', null, ['Recordings']],
];

// 1) Pending-State (kein MediaMTX, Queries laufen) → Spinner, kein Crash
for (const [mod, route, routePath, title] of PAGES) {
  try {
    const html = await renderPage(mod, { route, routePath });
    check(`pending ${route}`, html, [...title, 'ui-spinner']);
  } catch (e) {
    failures++;
    console.log(`FAIL pending ${route}: ${e.message}`);
  }
}

// 2) Error-State (primäre Query im Error-Zustand) → ErrorAlert statt Crash
const ERROR_CASES = [
  ['/src/components/pages/RuntimePaths.jsx', '/paths', null, ['paths', 0, 25], ['Laufzeit-Pfade']],
  ['/src/components/pages/RuntimePathDetail.jsx', '/paths/cam1', '/paths/:name', ['paths', 'cam1'], ['Pfad:', 'cam1']],
  ['/src/components/pages/HLS.jsx', '/hls', null, ['hls', 'muxers', 0, 25], ['HLS']],
  ['/src/components/pages/RTSP.jsx', '/rtsp', null, ['rtsp', 'conns', 0, 25], ['RTSP / RTSPS']],
  ['/src/components/pages/RTMP.jsx', '/rtmp', null, ['rtmp', 'conns', 0, 25], ['RTMP / RTMPS']],
  ['/src/components/pages/SRT.jsx', '/srt', null, ['srt', 'conns', 0, 25], ['SRT']],
  ['/src/components/pages/WebRTC.jsx', '/webrtc', null, ['webrtc', 'sessions', 0, 25], ['WebRTC']],
  ['/src/components/pages/MoQ.jsx', '/moq', null, ['moq', 'sessions', 0, 25], ['MoQ']],
  ['/src/components/pages/Recordings.jsx', '/recordings', null, ['recordings', 0, 25], ['Recordings']],
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

// 3) Data-State: RuntimePaths-Tabelle
{
  const qc = freshClient();
  qc.setQueryData(['paths', 0, 25], {
    itemCount: 1,
    pageCount: 1,
    items: [
      {
        name: 'cam1',
        online: true,
        available: true,
        source: { type: 'rtspSource', id: 'abc123' },
        readers: [{ type: 'hlsSession', id: 'r1' }, { type: 'rtmpConn', id: 'r2' }],
      },
    ],
  });
  try {
    const html = await renderPage('/src/components/pages/RuntimePaths.jsx', { route: '/paths', queryClient: qc });
    check('data /paths', html, ['cam1', 'online', 'available', 'RTSP Source', '2']);
  } catch (e) {
    failures++;
    console.log(`FAIL data /paths: ${e.message}`);
  }
}

// 4) Data-State: RuntimePathDetail (Source, Readers, Tracks + codecProps, Forward-Dests, Static Source)
{
  const qc = freshClient();
  qc.setQueryData(['paths', 'cam1'], {
    name: 'cam1',
    confName: 'cam1',
    online: true,
    onlineTime: '2026-10-20T00:00:00Z',
    available: true,
    availableTime: '2026-10-20T00:00:01Z',
    inboundBytes: 1024,
    inboundFramesInError: 0,
    outboundBytes: 2048,
    source: { type: 'rtspSource', id: 'abc123' },
    readers: [{ type: 'hlsSession', id: 'r1' }],
    tracks2: [{ codec: 'H264', codecProps: { profile: 'high', level: '4.1' } }],
  });
  qc.setQueryData(['paths', 'forward-dests', 'cam1', 0, 100], {
    itemCount: 1,
    pageCount: 1,
    items: [
      {
        id: 'f1f1f1f1-0000-0000-0000-000000000000',
        created: '2026-10-20T00:00:00Z',
        pos: 1,
        state: 'forwarding',
        type: 'rtmp',
        lastError: '',
        outboundBytes: 4096,
        typeSpecific: { dest: 'rtmp://out.example.com/live' },
      },
    ],
  });
  qc.setQueryData(['paths', 'static-sources', 'cam1'], {
    created: '2026-10-20T00:00:00Z',
    state: 'running',
    type: 'rtmpSource',
    lastError: '',
    typeSpecific: { dest: 'rtmp://in.example.com/live' },
  });
  try {
    const html = await renderPage('/src/components/pages/RuntimePathDetail.jsx', {
      route: '/paths/cam1',
      routePath: '/paths/:name',
      queryClient: qc,
    });
    check('data /paths/cam1', html, [
      'online',
      'available',
      'RTSP Source',
      'HLS Session',
      'H264',
      'codecProps',
      '&quot;profile&quot;', // React-SSR escapet Anführungszeichen in Text-Knoten
      'Forwarding',
      'f1f1f1f1',
      'Running',
      'typeSpecific',
      'rtmp://in.example.com/live',
    ]);
  } catch (e) {
    failures++;
    console.log(`FAIL data /paths/cam1: ${e.message}`);
  }
}

// 5) Data-State: HLS (Muxer + Sessions + Kick)
{
  const qc = freshClient();
  qc.setQueryData(['hls', 'muxers', 0, 25], {
    itemCount: 1,
    pageCount: 1,
    items: [
      { path: 'cam1', created: '2026-10-20T00:00:00Z', lastRequest: '2026-10-20T00:05:00Z', outboundBytes: 1000, outboundFramesDiscarded: 0 },
    ],
  });
  qc.setQueryData(['hls', 'sessions', 0, 25], {
    itemCount: 1,
    pageCount: 1,
    items: [
      {
        id: '11111111-2222-3333-4444-555555555555',
        created: '2026-10-20T00:00:00Z',
        path: 'cam1',
        remoteAddr: '127.0.0.1:50000',
        user: 'admin',
        userAgent: 'curl/8.0',
        isCDN: false,
        outboundBytes: 2000,
      },
    ],
  });
  try {
    const html = await renderPage('/src/components/pages/HLS.jsx', { route: '/hls', queryClient: qc });
    check('data /hls', html, ['Muxer', 'Sessions', 'cam1', '127.0.0.1:50000', 'admin', 'curl/8.0', 'Kick', '11111111']);
  } catch (e) {
    failures++;
    console.log(`FAIL data /hls: ${e.message}`);
  }
}

// 6) Data-State: RTSP + RTSPS (Conns + Sessions + Kick)
{
  const qc = freshClient();
  qc.setQueryData(['rtsp', 'conns', 0, 25], {
    itemCount: 1,
    pageCount: 1,
    items: [
      { id: 'c1c1c1c1-0000-0000-0000-000000000000', created: '2026-10-20T00:00:00Z', remoteAddr: '10.0.0.1:554', session: 's1s1s1s1-0000-0000-0000-000000000000', tunnel: '', inboundBytes: 10, outboundBytes: 20 },
    ],
  });
  qc.setQueryData(['rtsp', 'sessions', 0, 25], {
    itemCount: 1,
    pageCount: 1,
    items: [
      { id: 's1s1s1s1-0000-0000-0000-000000000000', created: '2026-10-20T00:00:00Z', path: 'cam1', remoteAddr: '10.0.0.1:554', user: 'admin', state: 'read', transport: 'udp', inboundBytes: 10, outboundBytes: 20 },
    ],
  });
  qc.setQueryData(['rtsps', 'conns', 0, 25], { itemCount: 0, pageCount: 1, items: [] });
  qc.setQueryData(['rtsps', 'sessions', 0, 25], { itemCount: 0, pageCount: 1, items: [] });
  try {
    const html = await renderPage('/src/components/pages/RTSP.jsx', { route: '/rtsp', queryClient: qc });
    check('data /rtsp', html, ['RTSP', 'RTSPS', 'Connections', 'Sessions', '10.0.0.1:554', 'Read', 'UDP', 'Kick', 'c1c1c1c1']);
  } catch (e) {
    failures++;
    console.log(`FAIL data /rtsp: ${e.message}`);
  }
}

// 7) Data-State: RTMP + RTMPS (Conns + Kick)
{
  const qc = freshClient();
  qc.setQueryData(['rtmp', 'conns', 0, 25], {
    itemCount: 1,
    pageCount: 1,
    items: [
      { id: 'c2c2c2c2-0000-0000-0000-000000000000', created: '2026-10-20T00:00:00Z', path: 'cam1', remoteAddr: '10.0.0.2:1935', user: 'admin', state: 'publish', inboundBytes: 10, outboundBytes: 20 },
    ],
  });
  qc.setQueryData(['rtmps', 'conns', 0, 25], { itemCount: 0, pageCount: 1, items: [] });
  try {
    const html = await renderPage('/src/components/pages/RTMP.jsx', { route: '/rtmp', queryClient: qc });
    check('data /rtmp', html, ['RTMP', 'RTMPS', 'cam1', '10.0.0.2:1935', 'Publish', 'Kick', 'c2c2c2c2']);
  } catch (e) {
    failures++;
    console.log(`FAIL data /rtmp: ${e.message}`);
  }
}

// 8) Data-State: SRT (Conns + Kick + Stats-Button)
{
  const qc = freshClient();
  qc.setQueryData(['srt', 'conns', 0, 25], {
    itemCount: 1,
    pageCount: 1,
    items: [
      { id: 'c3c3c3c3-0000-0000-0000-000000000000', created: '2026-10-20T00:00:00Z', path: 'cam1', remoteAddr: '10.0.0.3:9000', user: '', state: 'idle', inboundBytes: 10, outboundBytes: 20, rtt: '10ms', packetsLost: 3 },
    ],
  });
  try {
    const html = await renderPage('/src/components/pages/SRT.jsx', { route: '/srt', queryClient: qc });
    check('data /srt', html, ['SRT', 'cam1', '10.0.0.3:9000', 'Idle', 'Stats', 'Kick', 'c3c3c3c3']);
  } catch (e) {
    failures++;
    console.log(`FAIL data /srt: ${e.message}`);
  }
}

// 9) Data-State: WebRTC (Sessions + Kick)
{
  const qc = freshClient();
  qc.setQueryData(['webrtc', 'sessions', 0, 25], {
    itemCount: 1,
    pageCount: 1,
    items: [
      { id: 'w1w1w1w1-0000-0000-0000-000000000000', created: '2026-10-20T00:00:00Z', path: 'cam1', remoteAddr: '10.0.0.4:5000', user: 'admin', state: 'read', localCandidate: 'udp:1.2.3.4:5000', remoteCandidate: 'udp:5.6.7.8:6000', inboundBytes: 10, outboundBytes: 20 },
    ],
  });
  try {
    const html = await renderPage('/src/components/pages/WebRTC.jsx', { route: '/webrtc', queryClient: qc });
    check('data /webrtc', html, ['WebRTC', 'cam1', 'Read', 'udp:1.2.3.4:5000', 'udp:5.6.7.8:6000', 'Kick', 'w1w1w1w1']);
  } catch (e) {
    failures++;
    console.log(`FAIL data /webrtc: ${e.message}`);
  }
}

// 10) Data-State: MoQ (Sessions + Kick)
{
  const qc = freshClient();
  qc.setQueryData(['moq', 'sessions', 0, 25], {
    itemCount: 1,
    pageCount: 1,
    items: [
      { id: 'm1m1m1m1-0000-0000-0000-000000000000', created: '2026-10-20T00:00:00Z', path: 'cam1', remoteAddr: '10.0.0.5:443', userAgent: 'moq-client', state: 'publish', version: 'moqt-19', transport: 'quic', inboundBytes: 10, outboundBytes: 20 },
    ],
  });
  try {
    const html = await renderPage('/src/components/pages/MoQ.jsx', { route: '/moq', queryClient: qc });
    check('data /moq', html, ['MoQ', 'cam1', 'Publish', 'MOQT-19', 'quic', 'Kick', 'm1m1m1m1']);
  } catch (e) {
    failures++;
    console.log(`FAIL data /moq: ${e.message}`);
  }
}

// 11) Data-State: Recordings (Liste + segments.length)
{
  const qc = freshClient();
  qc.setQueryData(['recordings', 0, 25], {
    itemCount: 1,
    pageCount: 1,
    items: [
      { name: 'cam1', segments: [{ start: '2026-10-20T00:00:00Z' }, { start: '2026-10-20T00:01:00Z' }] },
    ],
  });
  try {
    const html = await renderPage('/src/components/pages/Recordings.jsx', { route: '/recordings', queryClient: qc });
    check('data /recordings', html, ['Recordings', 'cam1', 'Segments']);
  } catch (e) {
    failures++;
    console.log(`FAIL data /recordings: ${e.message}`);
  }
}

await vite.close();
console.log(failures === 0 ? '\nALL SMOKE TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
