import { describe, expect, it } from 'vitest'
import { formatDuration, phaseLabel } from '../format-duration'

describe('formatDuration', () => {
  it('0~59초', () => {
    expect(formatDuration(0)).toBe('0초')
    expect(formatDuration(15_000)).toBe('15초')
    expect(formatDuration(59_499)).toBe('59초')
  })

  it('1~59분', () => {
    expect(formatDuration(60_000)).toBe('1분')
    expect(formatDuration(75_000)).toBe('1분 15초')
    expect(formatDuration(3_540_000)).toBe('59분')
  })

  it('1시간 이상', () => {
    expect(formatDuration(3_600_000)).toBe('1시간 0분')
    expect(formatDuration(3_900_000)).toBe('1시간 5분')
    expect(formatDuration(7_260_000)).toBe('2시간 1분')
  })

  it('비정상 입력', () => {
    expect(formatDuration(Number.NaN)).toBe('—')
    expect(formatDuration(-1)).toBe('—')
  })
})

describe('phaseLabel', () => {
  it('알려진 phase는 한국어 라벨', () => {
    expect(phaseLabel('parse')).toBe('PSD 분석')
    expect(phaseLabel('encode')).toBe('이미지 인코딩')
    expect(phaseLabel('done')).toBe('완료')
    expect(phaseLabel('cancelled')).toBe('취소됨')
  })

  it('미지의 phase는 그대로 반환', () => {
    expect(phaseLabel('mystery-phase')).toBe('mystery-phase')
  })
})
