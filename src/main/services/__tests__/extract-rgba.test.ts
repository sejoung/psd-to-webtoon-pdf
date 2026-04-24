import { createCanvas } from '@napi-rs/canvas'
import { initializeCanvas, readPsd, writePsd } from 'ag-psd'
import { describe, expect, it } from 'vitest'
import { extractRgba } from '../extract-rgba'

initializeCanvas(createCanvas as unknown as Parameters<typeof initializeCanvas>[0])

function buildPsdWithComposite(
  width: number,
  height: number,
  rgb: [number, number, number]
): ReturnType<typeof readPsd> {
  const data = new Uint8Array(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgb[0]
    data[i + 1] = rgb[1]
    data[i + 2] = rgb[2]
    data[i + 3] = 255
  }
  const buf = writePsd({
    width,
    height,
    imageData: { width, height, data }
  } as Parameters<typeof writePsd>[0])
  return readPsd(Buffer.from(buf), { useImageData: true })
}

describe('extractRgba', () => {
  it('1순위: psd.imageData 사용 → 픽셀 정확히 복원 (빨강)', () => {
    const psd = buildPsdWithComposite(10, 8, [255, 0, 0])
    const out = extractRgba(psd)
    expect(out.length).toBe(10 * 8 * 4)
    // 첫 픽셀 RGBA = (255, 0, 0, 255)
    expect(out[0]).toBe(255)
    expect(out[1]).toBe(0)
    expect(out[2]).toBe(0)
    expect(out[3]).toBe(255)
    // 마지막 픽셀도
    expect(out[out.length - 4]).toBe(255)
    expect(out[out.length - 3]).toBe(0)
  })

  it('녹색 단색 PSD 정확히 복원', () => {
    const psd = buildPsdWithComposite(4, 4, [0, 255, 0])
    const out = extractRgba(psd)
    for (let i = 0; i < out.length; i += 4) {
      expect(out[i]).toBe(0)
      expect(out[i + 1]).toBe(255)
      expect(out[i + 2]).toBe(0)
      expect(out[i + 3]).toBe(255)
    }
  })

  it('canvas fallback: imageData 없는 분기 (mock)', () => {
    const width = 3
    const height = 2
    const expected = width * height * 4
    const fakeData = new Uint8Array(expected)
    fakeData.fill(128)

    const fakePsd = {
      width,
      height,
      canvas: {
        getContext: () => ({
          getImageData: () => ({ data: fakeData })
        })
      }
    } as unknown as ReturnType<typeof readPsd>

    const out = extractRgba(fakePsd)
    expect(out.length).toBe(expected)
    expect(Array.from(out.slice(0, 4))).toEqual([128, 128, 128, 128])
  })

  it('imageData도 canvas도 없으면 throw (§3.8 안내)', () => {
    const fakePsd = { width: 2, height: 2 } as unknown as ReturnType<typeof readPsd>
    expect(() => extractRgba(fakePsd)).toThrowError(/no composite image data/i)
  })

  it('imageData가 너무 짧으면 canvas fallback으로 진행 (불완전 데이터 거부)', () => {
    // imageData.data가 width*height*4보다 작으면 imageData 분기를 건너뛰어야 함
    const width = 4
    const height = 4
    const fakePsd = {
      width,
      height,
      imageData: { data: new Uint8Array(8) }, // 너무 짧음
      canvas: {
        getContext: () => ({
          getImageData: () => ({ data: new Uint8Array(width * height * 4).fill(50) })
        })
      }
    } as unknown as ReturnType<typeof readPsd>

    const out = extractRgba(fakePsd)
    expect(out[0]).toBe(50) // canvas로부터 채워짐
  })
})
