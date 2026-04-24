import type { MessageKey } from '../i18n/messages'
import type { Translate } from '../i18n/useT'

export function formatDuration(ms: number, t: Translate): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const totalSec = Math.round(ms / 1000)

  if (totalSec < 60) return t('duration.seconds', { n: totalSec })
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m < 60) {
    return s > 0
      ? t('duration.minutesSeconds', { m, s })
      : t('duration.minutesOnly', { m })
  }
  const h = Math.floor(m / 60)
  const remM = m % 60
  return t('duration.hoursMinutes', { h, m: remM })
}

const PHASE_KEYS: Record<string, MessageKey> = {
  init: 'phase.init',
  parse: 'phase.parse',
  encode: 'phase.encode',
  write: 'phase.write',
  finalize: 'phase.finalize',
  done: 'phase.done',
  cancelled: 'phase.cancelled',
  error: 'phase.error'
}

export function phaseLabel(phase: string, t: Translate): string {
  const key = PHASE_KEYS[phase]
  return key ? t(key) : phase
}
