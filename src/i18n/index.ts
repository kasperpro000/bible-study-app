import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import nl from './nl.json';

const savedLang = localStorage.getItem('berean_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      nl: { translation: nl }
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
