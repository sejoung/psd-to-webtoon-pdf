import { detectPsdKind } from '@shared/utils/psd-format'
import { describe, expect, it } from 'vitest'

function withSignature(version: number, extra = 10): Buffer {
  const buf = Buffer.alloc(6 + extra)
  buf[0] = 0x38 // '8'
  buf[1] = 0x42 // 'B'
  buf[2] = 0x50 // 'P'
  buf[3] = 0x53 // 'S'
  buf.writeUInt16BE(version, 4)
  return buf
}

describe('detectPsdKind', () => {
  it('PSD 시그니처 + version=1', () => {
    expect(detectPsdKind(withSignature(1))).toBe('psd')
  })

  it('PSB 시그니처 + version=2', () => {
    expect(detectPsdKind(withSignature(2))).toBe('psb')
  })

  it('알 수 없는 version은 unknown', () => {
    expect(detectPsdKind(withSignature(0))).toBe('unknown')
    expect(detectPsdKind(withSignature(99))).toBe('unknown')
  })

  it('시그니처 불일치 → unknown (PNG)', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])
    expect(detectPsdKind(png)).toBe('unknown')
  })

  it('너무 짧은 입력 → unknown', () => {
    expect(detectPsdKind(Buffer.alloc(3))).toBe('unknown')
    expect(detectPsdKind(Buffer.alloc(0))).toBe('unknown')
  })

  it('Uint8Array 입력도 지원', () => {
    const u8 = new Uint8Array(withSignature(1))
    expect(detectPsdKind(u8)).toBe('psd')
  })
})
