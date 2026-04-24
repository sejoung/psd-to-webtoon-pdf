import { format } from '@renderer/i18n/messages'
import { makeT } from '@renderer/i18n/useT'
import { describe, expect, it } from 'vitest'

describe('format (interpolation)', () => {
  it('placeholder가 없으면 원본 그대로', () => {
    expect(format('hello world')).toBe('hello world')
  })

  it('단일 placeholder', () => {
    expect(format('count: {n}', { n: 5 })).toBe('count: 5')
  })

  it('다중 placeholder', () => {
    expect(format('{m}분 {s}초', { m: 1, s: 30 })).toBe('1분 30초')
  })

  it('미정의 placeholder는 원본 토큰 유지', () => {
    expect(format('{a} / {b}', { a: 1 })).toBe('1 / {b}')
  })
})

describe('makeT', () => {
  it('ko: 알려진 키', () => {
    const t = makeT('ko')
    expect(t('actions.start')).toBe('PDF 생성')
  })

  it('en: 알려진 키', () => {
    const t = makeT('en')
    expect(t('actions.start')).toBe('Generate PDF')
  })

  it('인터폴레이션 적용', () => {
    const t = makeT('en')
    expect(t('dropzone.currentCount', { count: 3 })).toBe('(3 added)')
  })
})
