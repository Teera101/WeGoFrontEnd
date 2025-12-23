// i18n scaffold
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    common: {
      explore_title: 'Explore Activities',
      create_title: 'Create Activity',
      profile_title: 'Your Profile'
    }
  },
  th: {
    common: {
      explore_title: 'สำรวจกิจกรรม',
      create_title: 'สร้างกิจกรรม',
      profile_title: 'โปรไฟล์ของคุณ'
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;