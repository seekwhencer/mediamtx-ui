// SSR-Smoke-Test THEATRE Phase 8: Error-States & Edge-Cases.
// 8.1 Offline-Tile-State (Render) · 8.2 Fehlerklassifikation (CORS/offline/network)
// 8.3 Tile-Strip mit 20 Mock-Pfaden (Render + data-path für Auto-Scroll)
// 8.4 buildHlsUrl mit Sonderzeichen (/, #, Umlaute)
import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import React from 'react';
import path from 'node:path';
// WICHTIG: react-query per Node-ESM importen (nicht ssrLoadModule).
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const nm = path.resolve(process.cwd(), 'node_modules');

// hls.js-Support-Check in Node: MSE-Stub, damit supported=true und der Tile-Strip rendert.
globalThis.self = globalThis;
globalThis.MediaSource = class MediaSource {
  static isTypeSupported() {
    return true;
  }
};

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

function check(label, cond, detail = '') {
  if (cond) {
    console.log(`OK   ${label}`);
  } else {
    failures++;
    console.log(`FAIL ${label} ${detail}`);
  }
}

async function load(mod) {
  const m = await vite.ssrLoadModule(mod);
  return m.default;
}

// i18n-Initialisierung (Singleton), damit t() übersetzte Strings liefert.
await vite.ssrLoadModule('/src/i18n.js');

// 8.4 — buildHlsUrl: Sonderzeichen (/ # Umlaute) → encodeURIComponent hält.
{
  const { setAppSettings } = await vite.ssrLoadModule('/src/services/appSettings.js');
  setAppSettings({ hlsBaseUrl: 'http://localhost:8888/' });
  const { buildHlsUrl } = await vite.ssrLoadModule('/src/utils/buildHlsUrl.js');
  check('8.4 slash', buildHlsUrl('cam/1') === 'http://localhost:8888/cam%2F1/index.m3u8', buildHlsUrl('cam/1'));
  check('8.4 hash', buildHlsUrl('a#b') === 'http://localhost:8888/a%23b/index.m3u8', buildHlsUrl('a#b'));
  check('8.4 umlaut', buildHlsUrl('straße') === 'http://localhost:8888/stra%C3%9Fe/index.m3u8', buildHlsUrl('straße'));
}

// 8.2 — Fehlerklassifikation (hls.js-Error-Data-Form: response.code = HTTP-Status).
{
  const mod = await vite.ssrLoadModule('/src/hooks/useHlsPlayer.js');
  check('8.2 404 → offline', mod.classifyNetworkError({ response: { code: 404 } }) === 'offline');
  check('8.2 no response → cors', mod.classifyNetworkError({}) === 'cors');
  check('8.2 500 → network', mod.classifyNetworkError({ response: { code: 500 } }) === 'network');
}

// 8.1 + 8.3 — Theatre-Render: 20 Mock-Pfade (inkl. Sonderzeichen), 1 offline.
{
  const items = Array.from({ length: 20 }, (_, i) => ({
    name: i === 0 ? 'cam/1#ä' : `cam-${i}`,
    online: i !== 5,
  }));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
  qc.setQueryData(['paths', 0, 500], { itemCount: 20, pageCount: 1, items });

  const Theatre = await load('/src/components/pages/Theatre.jsx');
  const { MemoryRouter, Route, Routes } = await vite.ssrLoadModule('react-router-dom');
  const tree = React.createElement(
    QueryClientProvider,
    { client: qc },
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/theatre'] },
      React.createElement(Routes, null, React.createElement(Route, { path: '/theatre', element: React.createElement(Theatre) }))
    )
  );
  const html = renderToString(tree);

  // Nur Tile-Buttons zählen (nicht theatre-tile__dot/__body/…): Leerzeichen oder Quote nach dem Prefix.
  const tileCount = (html.match(/class="theatre-tile( |")/g) || []).length;
  check('8.3 20 tiles', tileCount === 20, `got ${tileCount}`);
  check('8.3 data-path', html.includes('data-path="cam/1#ä"'), 'missing data-path for special-char path');
  check('8.1 offline tile', /class="theatre-tile[^"]*is-offline/.test(html), 'no is-offline tile');
  check('8.1 selectPath hint', html.includes('Select a path below to start the stream'), 'missing selectPath hint');
}

await vite.close();
console.log(failures === 0 ? '\nALL THEATRE SMOKE TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
