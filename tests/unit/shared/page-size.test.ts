import { computePageSize } from '@shared/utils/page-size'
import { describe, expect, it } from 'vitest'

describe('computePageSize', () => {
  it('mode=auto → 원본 그대로', () => {
    expect(computePageSize(1200, 1600, { mode: 'auto' })).toEqual([1200, 1600])
  })

  it('mode=fixed-width → 종횡비 보존 리사이즈 (축소)', () => {
    const [w, h] = computePageSize(2000, 3000, { mode: 'fixed-width', width: 1000 })
    expect(w).toBe(1000)
    expect(h).toBe(1500)
  })

  it('mode=fixed-width → 확대 케이스도 비율 보존', () => {
    const [w, h] = computePageSize(500, 1000, { mode: 'fixed-width', width: 1000 })
    expect(w).toBe(1000)
    expect(h).toBe(2000)
  })

  it('withoutEnlargement=true: 원본보다 너비 클 때 원본 유지', () => {
    const [w, h] = computePageSize(500, 1000, {
      mode: 'fixed-width',
      width: 1000,
      withoutEnlargement: true
    })
    expect(w).toBe(500)
    expect(h).toBe(1000)
  })

  it('withoutEnlargement=true: 원본보다 작을 때는 그대로 축소', () => {
    const [w, h] = computePageSize(2000, 3000, {
      mode: 'fixed-width',
      width: 1000,
      withoutEnlargement: true
    })
    expect(w).toBe(1000)
    expect(h).toBe(1500)
  })

  it('비정상 옵션 (fixed-width 인데 width 없음) → 원본 반환', () => {
    expect(computePageSize(1000, 2000, { mode: 'fixed-width' })).toEqual([1000, 2000])
  })

  it('홀수 비율도 정수로 반올림', () => {
    const [, h] = computePageSize(7, 10, { mode: 'fixed-width', width: 100 })
    // 100/7 * 10 = 142.857... → 143
    expect(h).toBe(143)
  })
})
