import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './lang/en';
import { sk } from './lang/sk';

i18next.use(initReactI18next).init({
  resources: { en, sk },
  lng: 'sk',
  fallbackLng: 'sk',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
});

// Accessibility (WCAG 3.1.1 Language of Page): keep <html lang> in sync with the
// active UI language so assistive tech announces content in the correct language.
const syncHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined' && lng) {
    document.documentElement.setAttribute('lang', lng);
  }
};
syncHtmlLang(i18next.language);
i18next.on('languageChanged', syncHtmlLang);

export default i18next;
