import { useTranslation } from 'react-i18next'
import { bg, type Dict } from '../i18n/bg'
import { en } from '../i18n/en'

const DICTS: Record<string, Dict> = { bg, en }

/**
 * Речникът се взима директно, не през ключове — така TypeScript пази текстовете
 * и грешно име на низ не стига до продукция.
 */
export function useD(): { d: Dict; lang: 'bg' | 'en' } {
  const { i18n } = useTranslation()
  const lang = i18n.language?.toLowerCase().startsWith('en') ? 'en' : 'bg'
  return { d: DICTS[lang], lang }
}
