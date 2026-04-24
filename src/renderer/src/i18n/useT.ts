import { useMemo } from 'react'
import { useLocaleStore } from '../stores/localeStore'
import { dict, format, type Locale, type MessageKey } from './messages'

export type Translate = (
  key: MessageKey,
  params?: Record<string, string | number>
) => string

/**
 * 현재 locale 기준으로 메시지를 반환하는 함수를 돌려준다.
 * 컴포넌트가 locale 변화에 따라 자동으로 re-render되도록 zustand selector 사용.
 */
export function useT(): Translate {
  const locale = useLocaleStore((s) => s.locale)

  return useMemo(() => makeT(locale), [locale])
}

/** React 외부(예: utils 함수에서 직접)에서 한 번 호출하는 용도. */
export function makeT(locale: Locale): Translate {
  return (key, params) => {
    const template = dict[locale][key] ?? dict.ko[key] ?? key
    return format(template, params)
  }
}

export function useLocale(): Locale {
  return useLocaleStore((s) => s.locale)
}
