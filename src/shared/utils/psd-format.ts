/**
 * PSD/PSB 매직 바이트 검사.
 *
 * Adobe Photoshop File Formats Specification:
 *   bytes 0-3 : signature  '8BPS' (0x38 0x42 0x50 0x53)
 *   bytes 4-5 : version    1 = PSD, 2 = PSB
 *
 * PSB(Photoshop Big)는 30,000 픽셀 초과 / 2GB 초과 시 사용되는 변형 포맷.
 * ag-psd가 일부 PSB는 부분 지원하지만 안정성이 낮아 v0.1에선 사전 거부.
 */

export type PsdKind = 'psd' | 'psb' | 'unknown'

const SIGNATURE = 0x38425053 // '8BPS'

export function detectPsdKind(buf: Buffer | Uint8Array): PsdKind {
  if (buf.length < 6) return 'unknown'
  // big-endian 4 bytes
  const sig =
    ((buf[0] ?? 0) << 24) | ((buf[1] ?? 0) << 16) | ((buf[2] ?? 0) << 8) | (buf[3] ?? 0)
  // unsigned 변환
  const sigU32 = sig >>> 0
  if (sigU32 !== SIGNATURE) return 'unknown'

  const version = ((buf[4] ?? 0) << 8) | (buf[5] ?? 0)
  if (version === 1) return 'psd'
  if (version === 2) return 'psb'
  return 'unknown'
}
