import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(__dirname, 'badges.html');
const OUT = path.join(__dirname, 'badges');
const SCALE = 2; // 2x für scharfe badges

const log = (...a) => console.log('[shot_badges]', ...a);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: SCALE,
  });
  const page = await context.newPage();

  await page.goto('file://' + HTML, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Fonts müssen geladen sein, sonst rendert der Text im Fallback-Font.
  await page.evaluate(() => document.fonts.ready);

  // Seitenhintergrund transparent machen, damit die PNGs keinen Seitenhintergrund
  // enthalten (sonst wäre die dunkle body-Farbe in den abgerundeten Ecken sichtbar).
  await page.addStyleTag({ content: 'html, body { background: transparent !important; }' });
  await page.waitForTimeout(100);

  const badges = page.locator('.badge');
  const count = await badges.count();
  if (count === 0) throw new Error('Keine .badge-Elemente gefunden');
  log(`gefunden: ${count} badges`);

  for (let i = 0; i < count; i++) {
    const badge = badges.nth(i);
    const name = (await badge.getAttribute('data-name')) || `badge-${i}`;
    const file = path.join(OUT, `${name}.png`);
    // omitBackground: true -> transparenter Hintergrund statt Weiß.
    await badge.screenshot({ path: file, omitBackground: true });
    log(name, path.relative(process.cwd(), file));
  }

  await browser.close();

  const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.png')).sort();
  fs.writeFileSync(path.join(OUT, 'manifest.txt'), files.join('\n') + '\n');
  log(`DONE. ${files.length} badge(s) in ${OUT}`);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
