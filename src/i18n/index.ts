import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { bg } from './bg'
import { en } from './en'

export const LANGS = ['bg', 'en'] as const
export type Lang = (typeof LANGS)[number]

const STORAGE_KEY = 'dulbina.lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'bg' || saved === 'en') return saved
  } catch {
    /* private mode */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'bg'
  return nav.toLowerCase().startsWith('bg') ? 'bg' : 'bg'
}

void i18n.use(initReactI18next).init({
  resources: {
    bg: { translation: bg },
    en: { translation: en },
  },
  lng: initialLang(),
  fallbackLng: 'bg',
  interpolation: { escapeValue: false },
  returnObjects: true,
})

function applyLang(lang: string) {
  if (typeof document === 'undefined') return
  const dict = lang === 'en' ? en : bg
  document.documentElement.lang = lang
  document.title = dict.meta.title
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', dict.meta.description)
  document
    .querySelector('meta[property="og:locale"]')
    ?.setAttribute('content', lang === 'en' ? 'en_GB' : 'bg_BG')
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* private mode */
  }
}

applyLang(i18n.language)
i18n.on('languageChanged', applyLang)

export function toggleLang() {
  void i18n.changeLanguage(i18n.language === 'bg' ? 'en' : 'bg')
}

export default i18n
