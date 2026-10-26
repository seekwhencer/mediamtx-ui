import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = process.env.OUT_DIR || '.docs/screenshots';
const VIEWPORT = { width: 1700, height: 1200 };
const ZOOM = '1.25'; // "zoom in twice": 100% -> 110% -> 125%

// Left navigation, in sidebar order.
const NAV = [
  { path: '/theatre', slug: 'theatre' },
  { path: '/', slug: 'dashboard' },
  { path: '/config/global', slug: 'global' },
  { path: '/config/internal-users', slug: 'internal-users' },
  { path: '/config/paths', slug: 'paths' },
  { path: '/config/path-defaults', slug: 'path-defaults' },
  { path: '/paths', slug: 'runtime-paths' },
  { path: '/hls', slug: 'hls' },
  { path: '/rtsp', slug: 'rtsp' },
  { path: '/rtmp', slug: 'rtmp' },
  { path: '/srt', slug: 'srt' },
  { path: '/webrtc', slug: 'webrtc' },
  { path: '/moq', slug: 'moq' },
  { path: '/metrics', slug: 'metrics' },
  { path: '/logs', slug: 'logs' },
  { path: '/recordings', slug: 'recordings' },
  { path: '/settings', slug: 'settings' },
];

// Pages that get the extra "click all subnav buttons" screenshot.
const SUBNAV_PAGES = [
  { path: '/config/global', slug: 'global' },
  { path: '/config/path-defaults', slug: 'path-defaults' },
];

const log = (...a) => console.log('[shot]', ...a);

async function goto(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
}

async function setTheme(page, theme) {
  // Settings -> App card -> open all groups -> Theme select -> Save.
  await goto(page, BASE + '/settings');
  await page.waitForSelector('.ui-card .formbuilder__subnav button', { state: 'attached', timeout: 20000 });
  const appCard = page.locator('.ui-card').filter({ has: page.locator('#fb-theme') });
  const btns = appCard.locator('.formbuilder__subnav button');
  const n = await btns.count();
  for (let i = 0; i < n; i++) {
    await btns.nth(i).click();
    await page.waitForTimeout(120);
  }
  await page.waitForSelector('#fb-theme', { state: 'visible', timeout: 10000 });
  await page.selectOption('#fb-theme', theme);
  await page.waitForTimeout(300);
  await appCard.locator('button[type="submit"]').click();
  await page.waitForTimeout(700);
  const applied = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  log(`theme requested=${theme} applied=${applied}`);
  if (applied !== theme) throw new Error(`Theme not applied: wanted ${theme}, got ${applied}`);
}

async function shootPage(page, theme, item) {
  await goto(page, BASE + item.path);
  await page.waitForSelector('.layout__sidebar, .page__title, main, body', { timeout: 15000 });
  await page.waitForTimeout(900);
  const file = path.join(OUT, `${theme}_${item.slug}.png`);
  await page.screenshot({ path: file });
  log('page', file);
}

async function shootSubnav(page, theme, item) {
  await goto(page, BASE + item.path);
  await page.waitForSelector('.formbuilder__subnav button', { state: 'attached', timeout: 20000 });
  const btns = page.locator('.formbuilder__subnav button');
  const n = await btns.count();
  log(`subnav ${item.slug}: ${n} buttons`);
  for (let i = 0; i < n; i++) {
    await btns.nth(i).click();
    await page.waitForTimeout(220);
  }
  await page.waitForTimeout(500);
  const file = path.join(OUT, `${theme}_${item.slug}_subnav.png`);
  await page.screenshot({ path: file });
  log('subnav', file);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });

  // Apply "zoom in twice" (CSS zoom 1.25) on every new document automatically.
  await context.addInitScript((z) => {
    const apply = () => { document.documentElement.style.zoom = z; };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
    else apply();
  }, ZOOM);

  const page = await context.newPage();

  // Verify zoom is applied.
  await goto(page, BASE + '/');
  await page.waitForTimeout(500);
  const zoomCheck = await page.evaluate(() => getComputedStyle(document.documentElement).zoom);
  log(`zoom check: rootZoom=${zoomCheck} (expected ${ZOOM})`);
  if (zoomCheck !== ZOOM) throw new Error(`Zoom not applied: got ${zoomCheck}, expected ${ZOOM}`);

  // ---- Pass 1: light theme ----
  log('=== PASS 1 (light) ===');
  await setTheme(page, 'light');
  for (const item of NAV) await shootPage(page, 'light', item);
  for (const item of SUBNAV_PAGES) await shootSubnav(page, 'light', item);

  // ---- Pass 2: dark theme ----
  log('=== PASS 2 (dark) ===');
  await setTheme(page, 'dark');
  for (const item of NAV) await shootPage(page, 'dark', item);
  for (const item of SUBNAV_PAGES) await shootSubnav(page, 'dark', item);

  await browser.close();

  const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.png')).sort();
  fs.writeFileSync(path.join(OUT, 'manifest.txt'), files.join('\n') + '\n');
  log(`DONE. ${files.length} screenshots in ${OUT}`);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
