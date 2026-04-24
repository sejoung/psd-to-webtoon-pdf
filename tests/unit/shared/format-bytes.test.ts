import { formatBytes } from '@shared/utils/format-bytes'
import { describe, expect, it } from 'vitest'

describe('formatBytes', () => {
  it('0 → "0 B"', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('1023 → "1023 B" (B 단위는 소수점 없음)', () => {
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('1024 → "1.0 KB"', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
  })

  it('1MB / 1GB / 1TB 경계', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB')
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB')
  })

  it('소수점 자리수 옵션 적용', () => {
    expect(formatBytes(1024 * 1024 * 1.5, 2)).toBe('1.50 MB')
    expect(formatBytes(1024 * 1024 * 1.5, 0)).toBe('2 MB')
  })

  it('비정상 입력은 "—"', () => {
    expect(formatBytes(Number.NaN)).toBe('—')
    expect(formatBytes(-1)).toBe('—')
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('—')
  })
})
