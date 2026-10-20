import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import de from './locales/de.json';
import it from './locales/it.json';

const LANG_KEY = 'mtxui.lang';
const SUPPORTED = ['en', 'de', 'it'];

function detectLng() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch {
    // localStorage nicht verfügbar (z. B. Private Mode) → weiter mit Navigator
  }
  const nav = (typeof navigator !== 'undefined' && navigator.language) || '';
  const navLc = nav.toLowerCase();
  if (navLc.startsWith('de')) return 'de';
  if (navLc.startsWith('it')) return 'it';
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    it: { translation: it },
  },
  lng: detectLng(),
  fallbackLng: 'en',
  supportedLngs: SUPPORTED,
  interpolation: {
    escapeValue: false, // React escaped bereits (XSS)
  },
  react: {
    useSuspense: false, // Ressourcen sind synchron im Bundle → kein Suspense nötig
  },
});

// Sprache persistieren, damit der Umschalter über Reloads erhalten bleibt.
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANG_KEY, lng);
  } catch {
    // ignorieren
  }
});

export default i18n;
