// Roundness: --radius-factor skaliert alle Eckenradien (s. variables.css).
//
// WICHTIG: RADIUS_BASE_FACTOR muss mit --radius-factor in
// frontend/src/style/variables.css synchron bleiben (dort die Vorlage).
// RADIUS_BASE_PX muss mit dem Basiswert von --radius dort synchron bleiben.

const RADIUS_BASE_FACTOR = 0.7;
const RADIUS_BASE_PX = 10; // --radius: calc(10px * var(--radius-factor))

// Initialwert für den Roundness-Slider (Faktor aus der Basis-Vorlage).
export function defaultRadiusFactor() {
  return RADIUS_BASE_FACTOR;
}

// Radius für einen Faktor-Wert (Basis 10px). Für Live-Vorschau.
export function radiusForFactor(factor) {
  const f = Number(factor);
  if (!Number.isFinite(f)) return null;
  return `${(RADIUS_BASE_PX * f).toFixed(1)}px`;
}

// Setzt :root --radius-factor. Alle --radius-* Variablen folgen automatisch.
export function applyRadiusFactor(factor) {
  if (typeof document === 'undefined') return;
  const f = Number(factor);
  if (!Number.isFinite(f)) return;
  document.documentElement.style.setProperty('--radius-factor', String(f));
}
