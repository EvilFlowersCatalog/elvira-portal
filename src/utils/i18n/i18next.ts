import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './lang/en'
import { sk } from './lang/sk'

i18next.use(initReactI18next).init({
  resources: { en, sk },
  lng: 'sk',
  fallbackLng: 'sk',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
})

export default i18next
