import type { readPsd } from 'ag-psd'

/**
 * ag-psd로 파싱한 PSD에서 RGBA 픽셀 바이트를 뽑는다.
 *
 * 1순위: `psd.imageData` — `useImageData: true` 옵션 + composite 데이터 보유 시 채워짐.
 * 2순위: `psd.canvas` — composite가 없어 ag-psd가 레이어로부터 재합성한 경우.
 *        Node 환경에선 `initializeCanvas(createCanvas)` 가 선행돼야 canvas가 생성됨 (§3.8).
 *
 * 둘 다 없으면 throw — 호출 측의 onError 정책에 따라 skip 또는 abort.
 */

interface ImageDataLike {
  data: { length: number; subarray(start: number, end: number): ArrayLike<number> }
}

interface CanvasLike {
  getContext(type: '2d'): {
    getImageData(
      x: number,
      y: number,
      w: number,
      h: number
    ): { data: { length: number; subarray(s: number, e: number): ArrayLike<number> } }
  }
}

export function extractRgba(psd: ReturnType<typeof readPsd>): Uint8Array {
  const { width, height } = psd
  const expected = width * height * 4

  const imageData = (psd as { imageData?: ImageDataLike }).imageData
  if (imageData && imageData.data.length >= expected) {
    const out = new Uint8Array(expected)
    out.set(imageData.data.subarray(0, expected) as ArrayLike<number>)
    return out
  }

  const canvas = (psd as { canvas?: CanvasLike }).canvas
  if (canvas && typeof canvas.getContext === 'function') {
    const ctx = canvas.getContext('2d')
    const img = ctx.getImageData(0, 0, width, height)
    const out = new Uint8Array(expected)
    out.set(img.data.subarray(0, expected) as ArrayLike<number>)
    return out
  }

  throw new Error('PSD has no composite image data and no reconstructable canvas (§3.8)')
}
