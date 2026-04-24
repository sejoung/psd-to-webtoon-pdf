import { makeT } from '@renderer/i18n/useT'
import { formatDuration, phaseLabel } from '@renderer/utils/format-duration'
import { describe, expect, it } from 'vitest'

const tKo = makeT('ko')
const tEn = makeT('en')

describe('formatDuration (ko)', () => {
  it('0~59초', () => {
    expect(formatDuration(0, tKo)).toBe('0초')
    expect(formatDuration(15_000, tKo)).toBe('15초')
    expect(formatDuration(59_499, tKo)).toBe('59초')
  })

  it('1~59분', () => {
    expect(formatDuration(60_000, tKo)).toBe('1분')
    expect(formatDuration(75_000, tKo)).toBe('1분 15초')
    expect(formatDuration(3_540_000, tKo)).toBe('59분')
  })

  it('1시간 이상', () => {
    expect(formatDuration(3_600_000, tKo)).toBe('1시간 0분')
    expect(formatDuration(3_900_000, tKo)).toBe('1시간 5분')
    expect(formatDuration(7_260_000, tKo)).toBe('2시간 1분')
  })

  it('비정상 입력', () => {
    expect(formatDuration(Number.NaN, tKo)).toBe('—')
    expect(formatDuration(-1, tKo)).toBe('—')
  })
})

describe('formatDuration (en)', () => {
  it('영어 라벨', () => {
    expect(formatDuration(15_000, tEn)).toBe('15s')
    expect(formatDuration(60_000, tEn)).toBe('1m')
    expect(formatDuration(75_000, tEn)).toBe('1m 15s')
    expect(formatDuration(3_900_000, tEn)).toBe('1h 5m')
  })
})

describe('phaseLabel', () => {
  it('알려진 phase는 한국어 라벨', () => {
    expect(phaseLabel('parse', tKo)).toBe('PSD 분석')
    expect(phaseLabel('encode', tKo)).toBe('이미지 인코딩')
    expect(phaseLabel('done', tKo)).toBe('완료')
    expect(phaseLabel('cancelled', tKo)).toBe('취소됨')
  })

  it('영어 라벨', () => {
    expect(phaseLabel('parse', tEn)).toBe('Parsing PSD')
    expect(phaseLabel('done', tEn)).toBe('Done')
  })

  it('미지의 phase는 그대로 반환', () => {
    expect(phaseLabel('mystery-phase', tKo)).toBe('mystery-phase')
  })
})
