import { create } from 'zustand'
import { type Locale, SUPPORTED_LOCALES } from '../i18n/messages'

const STORAGE_KEY = 'psd-pdf:locale'

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(v)
}

/**
 * 기본은 영어 — 글로벌 사용자가 첫 실행 시 영어 UI로 시작.
 * 한국어 사용자는 헤더 토글로 ko 선택, 그 선택은 localStorage에 영구 저장됨.
 */
const DEFAULT_LOCALE: Locale = 'en'

function detectInitial(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    /* localStorage 접근 불가 (테스트 환경 등) */
  }
  return DEFAULT_LOCALE
}

interface LocaleStoreState {
  locale: Locale
}
interface LocaleStoreActions {
  setLocale: (l: Locale) => void
  toggleLocale: () => void
}

export const useLocaleStore = create<LocaleStoreState & LocaleStoreActions>(
  (set, get) => ({
    locale: detectInitial(),
    setLocale: (locale) => {
      try {
        localStorage.setItem(STORAGE_KEY, locale)
      } catch {
        /* ignore */
      }
      set({ locale })
    },
    toggleLocale: () => {
      const next: Locale = get().locale === 'ko' ? 'en' : 'ko'
      get().setLocale(next)
    }
  })
)
