// Primary-Farbe: nur der Farbton (Hue) ist einstellbar.
// Sättigung + Helligkeit sind FIX und werden aus der Basisfarbe abgeleitet.
//
// WICHTIG: PRIMARY_BASE_HEX muss mit --color-primary in
// frontend/src/style/variables.css synchron bleiben (dort die Vorlage).

const PRIMARY_BASE_HEX = '#4a9fe6';

// Hex → HSL. Gibt { h: 0-360, s: 0-100, l: 0-100 } zurück.
function hexToHsl(hex) {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return { h: Math.round(hue), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Fixe Sättigung + Helligkeit (aus der Basisfarbe) + Initial-Hue.
export const PRIMARY_BASE_HSL = hexToHsl(PRIMARY_BASE_HEX);

// Initialwert für den Hue-Slider (Farbton der Basisfarbe).
export function defaultPrimaryHue() {
  return PRIMARY_BASE_HSL.h;
}

// Farbe für einen Hue-Wert (Sättigung + Helligkeit fix). Für Live-Vorschau.
export function primaryColorForHue(hue) {
  const h = Math.round(Number(hue));
  if (!Number.isFinite(h)) return null;
  const { s, l } = PRIMARY_BASE_HSL;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// Setzt :root --color-primary auf hsl(hue, fixS%, fixL%).
// Sättigung + Helligkeit bleiben dabei unverändert.
export function applyPrimaryHue(hue) {
  if (typeof document === 'undefined') return;
  const color = primaryColorForHue(hue);
  if (!color) return;
  document.documentElement.style.setProperty('--color-primary', color);
}
