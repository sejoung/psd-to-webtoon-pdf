import { describe, expect, it } from 'vitest'
import { compareNatural, naturalSort } from '../natural-sort'

describe('compareNatural', () => {
  it('정수 부분을 수치 비교 (001 < 002 < 010)', () => {
    expect(compareNatural('001.psd', '002.psd')).toBeLessThan(0)
    expect(compareNatural('010.psd', '009.psd')).toBeGreaterThan(0)
    expect(compareNatural('010.psd', '010.psd')).toBe(0)
  })

  it('자릿수 차이 (9 < 10 < 100)', () => {
    expect(compareNatural('9', '10')).toBeLessThan(0)
    expect(compareNatural('10', '100')).toBeLessThan(0)
    expect(compareNatural('100', '99')).toBeGreaterThan(0)
  })

  it('영문/숫자 혼합 prefix', () => {
    expect(compareNatural('chapter1.psd', 'chapter2.psd')).toBeLessThan(0)
    expect(compareNatural('chapter10.psd', 'chapter9.psd')).toBeGreaterThan(0)
    expect(compareNatural('chapter1_a.psd', 'chapter1_b.psd')).toBeLessThan(0)
  })

  it('대소문자 무시 (sensitivity: base)', () => {
    expect(compareNatural('A.psd', 'a.psd')).toBe(0)
    expect(compareNatural('Chapter1', 'CHAPTER2')).toBeLessThan(0)
  })

  it('빈 문자열 / 공백', () => {
    expect(compareNatural('', '')).toBe(0)
    expect(compareNatural('', 'a')).toBeLessThan(0)
    expect(compareNatural(' a', 'a')).not.toBe(0)
  })
})

describe('naturalSort', () => {
  it('객체 배열을 pick 함수로 정렬', () => {
    const items = [{ name: '010.psd' }, { name: '001.psd' }, { name: '002.psd' }]
    const sorted = naturalSort(items, (i) => i.name)
    expect(sorted.map((i) => i.name)).toEqual(['001.psd', '002.psd', '010.psd'])
  })

  it('원본 배열을 변경하지 않음 (immutable)', () => {
    const items = [{ name: 'b' }, { name: 'a' }]
    const sorted = naturalSort(items, (i) => i.name)
    expect(items.map((i) => i.name)).toEqual(['b', 'a'])
    expect(sorted.map((i) => i.name)).toEqual(['a', 'b'])
  })
})
