import type { CSSProperties } from 'react'
import { useT } from '../i18n/useT'
import { useLocaleStore } from '../stores/localeStore'

const noDragStyle = { WebkitAppRegion: 'no-drag' } as CSSProperties

export function LocaleToggle() {
  const locale = useLocaleStore((s) => s.locale)
  const toggleLocale = useLocaleStore((s) => s.toggleLocale)
  const t = useT()

  return (
    <button
      type="button"
      style={noDragStyle}
      onClick={toggleLocale}
      aria-label={t('header.toggleLocale')}
      title={t('header.toggleLocale')}
      className={[
        'inline-flex h-7 items-center gap-1 rounded-card border border-border bg-surface',
        'px-2 text-xs font-medium text-text-secondary',
        'transition-colors hover:border-text-secondary hover:text-text-primary',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60'
      ].join(' ')}
    >
      <span className={locale === 'ko' ? 'text-text-primary' : ''}>KO</span>
      <span className="text-text-secondary/50">/</span>
      <span className={locale === 'en' ? 'text-text-primary' : ''}>EN</span>
    </button>
  )
}
