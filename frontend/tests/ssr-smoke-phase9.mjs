// SSR-Smoke-Test Phase 9: Settings-Page + App-Settings-Store + Base-URL-Auflösung.
// Settings-Page rendert ohne JS-Fehler (Pending/Error/Data), Store + apiBaseUrl-Override funktionieren.
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

async function load(mod) {
  const m = await vite.ssrLoadModule(mod);
  return m.default;
}

function check(label, cond, detail = '') {
  if (cond) {
    console.log(`OK   ${label}`);
  } else {
    failures++;
    console.log(`FAIL ${label} ${detail}`);
  }
}

function freshClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
}

async function renderPage(pageMod, { queryClient = null, route = '/settings', routePath = null } = {}) {
  const Page = await load(pageMod);
  const { MemoryRouter, Route, Routes } = await vite.ssrLoadModule('react-router-dom');
  const Layout = await load('/src/components/layout/Layout.jsx');

  const qc = queryClient || freshClient();
  const path = routePath || route;
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

// ===== 1) App-Settings-Store (localStorage in Node nicht verfügbar → In-Memory) =====
{
  const { getAppSettings, setAppSettings, APP_SETTINGS_DEFAULTS } = await vite.ssrLoadModule('/src/services/appSettings.js');

  check('defaults', APP_SETTINGS_DEFAULTS.theme === 'dark' && APP_SETTINGS_DEFAULTS.autoRefreshMs === 10000 && APP_SETTINGS_DEFAULTS.itemsPerPage === 100);

  setAppSettings({ theme: 'light', autoRefreshMs: 5000 });
  check('set/get theme', getAppSettings().theme === 'light');
  check('set/get autoRefreshMs', getAppSettings().autoRefreshMs === 5000);
  check('unveränderte Keys bleiben', getAppSettings().itemsPerPage === 100);

  setAppSettings({ theme: 'dark' });
  check('reset theme', getAppSettings().theme === 'dark');
}

// ===== 2) api/client.js: Base-URL-Auflösung pro Request + localApi =====
{
  const { getAppSettings, setAppSettings } = await vite.ssrLoadModule('/src/services/appSettings.js');
  const clientMod = await vite.ssrLoadModule('/src/api/client.js');
  const client = clientMod.default;
  const { api, localApi } = clientMod;

  // Adapter-Mock: Request abfangen, Response liefern.
  let lastConfig = null;
  client.defaults.adapter = async (config) => {
    lastConfig = config;
    return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
  };

  // Default: /v3
  setAppSettings({ apiBaseUrl: '' });
  await api.get('/info');
  check('api default baseURL /v3', lastConfig.baseURL === '/v3', `got ${lastConfig.baseURL}`);

  // Override aus App-Settings wirkt sofort (pro Request), Trailing-Slash wird gestrippt
  setAppSettings({ apiBaseUrl: 'http://override.test:9997/' });
  await api.get('/info');
  check('apiBaseUrl-Override wirkt sofort', lastConfig.baseURL === 'http://override.test:9997', `got ${lastConfig.baseURL}`);

  // localApi: gleicher Origin (leere baseURL)
  await localApi.get('/api/settings');
  check('localApi baseURL leer', lastConfig.baseURL === '', `got ${JSON.stringify(lastConfig.baseURL)}`);

  // Interceptor liefert res.data
  const res = await api.get('/info');
  check('Interceptor liefert res.data', res.ok === true);

  // Fehler-Mapping
  client.defaults.adapter = async (config) => {
    const err = new Error('Request failed with status code 400');
    err.config = config;
    err.response = { status: 400, data: { error: 'serverPort muss eine Ganzzahl zwischen 1 und 65535 sein', code: 'invalid_settings' } };
    throw err;
  };
  let mapped = null;
  try {
    await localApi.patch('/api/settings', { serverPort: 0 });
  } catch (e) {
    mapped = e;
  }
  check('Fehler-Mapping code', mapped?.code === 'invalid_settings', `got ${mapped?.code}`);
  check('Fehler-Mapping status', mapped?.status === 400);
}

// ===== 3) Settings-Page: Pending-State =====
{
  try {
    const html = await renderPage('/src/components/pages/Settings.jsx');
    check('pending /settings', html.includes('Einstellungen') && html.includes('ui-spinner'), `len=${html.length}`);
  } catch (e) {
    failures++;
    console.log(`FAIL pending /settings: ${e.message}`);
  }
}

// ===== 4) Settings-Page: Error-State (Server-Query im Error-Zustand) =====
{
  const qc = freshClient();
  const err = new Error('serverPort muss eine Ganzzahl zwischen 1 und 65535 sein');
  err.code = 'invalid_settings';
  err.status = 400;
  const entry = qc.getQueryCache().build(qc, { queryKey: ['settings'], queryFn: async () => { throw err; } });
  entry.setState({ status: 'error', error: err, data: undefined });
  try {
    const html = await renderPage('/src/components/pages/Settings.jsx', { queryClient: qc });
    check('error /settings', html.includes('ui-erroralert') && html.includes('invalid_settings'));
  } catch (e) {
    failures++;
    console.log(`FAIL error /settings: ${e.message}`);
  }
}

// ===== 5) Settings-Page: Data-State (Formulare + Restart-Badges + Token maskiert) =====
{
  const qc = freshClient();
  qc.setQueryData(['settings'], {
    serverPort: 3000,
    verbose: false,
    mediamtxBaseUrl: 'http://localhost:9997',
    mediamtxAuthToken: '••••oken',
    bridgePrefix: '/v3',
    bridgeTimeout: 10000,
    runtimeKeys: ['verbose', 'mediamtxBaseUrl', 'mediamtxAuthToken', 'bridgeTimeout'],
    restartKeys: ['serverPort', 'bridgePrefix'],
  });
  try {
    const html = await renderPage('/src/components/pages/Settings.jsx', { queryClient: qc });
    const must = [
      'Einstellungen',
      'Server',
      'Server Port',
      'Verbose Logging',
      'MediaMTX Base URL',
      'MediaMTX Auth Token',
      'Bridge Prefix',
      'Bridge Timeout (ms)',
      'Restart required',
      'API Base URL',
      'Theme',
      'Auto-Refresh (ms, 0 = aus)',
      'Items Per Page',
      'Server speichern',
      'App speichern',
      '••••oken',
    ];
    const missing = must.filter((s) => !html.includes(s));
    check('data /settings', missing.length === 0, `missing ${JSON.stringify(missing)}`);
  } catch (e) {
    failures++;
    console.log(`FAIL data /settings: ${e.message}`);
  }
}

// ===== 6) App mit /settings-Route + Sidebar-Eintrag =====
{
  const App = await load('/src/App.jsx');
  const { MemoryRouter } = await vite.ssrLoadModule('react-router-dom');
  const tree = React.createElement(
    QueryClientProvider,
    { client: freshClient() },
    React.createElement(MemoryRouter, { initialEntries: ['/settings'] }, React.createElement(App))
  );
  const html = renderToString(tree);
  const must = ['Einstellungen', 'Settings', 'Einstellungen'];
  const missing = must.filter((s) => !html.includes(s));
  check('App /settings + Sidebar', missing.length === 0, `missing ${JSON.stringify(missing)}`);
}

await vite.close();
console.log(failures === 0 ? '\nALL SMOKE TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
