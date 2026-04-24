/**
 * 워커 파이프라인 통합 테스트.
 *
 * 빌드된 `out/main/merge.worker.js`를 직접 spawn해서 합성 PSD → PDF 변환을 검증.
 * 실행 전 `npm run build` 필요. (`npm run test:integration` / `test:all`이 자동 처리)
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnMergeWorker } from '@main/services/merge-orchestrator'
import { createCanvas } from '@napi-rs/canvas'
import type { MergeRequest } from '@shared/types/index'
import { initializeCanvas, writePsd } from 'ag-psd'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')
const WORKER_PATH = resolve(ROOT, 'out/main/merge.worker.js')
const TMP = resolve(tmpdir(), `psd-pdf-it-${process.pid}`)

initializeCanvas(createCanvas as unknown as Parameters<typeof initializeCanvas>[0])

beforeAll(() => {
  if (!existsSync(WORKER_PATH)) {
    throw new Error(
      `Worker not built. Run "npm run build" first.\nExpected: ${WORKER_PATH}`
    )
  }
  rmSync(TMP, { recursive: true, force: true })
  mkdirSync(TMP, { recursive: true })
})

afterAll(() => {
  rmSync(TMP, { recursive: true, force: true })
})

function makeSyntheticPsd(
  width: number,
  height: number,
  rgb: [number, number, number]
): Buffer {
  const data = new Uint8Array(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgb[0]
    data[i + 1] = rgb[1]
    data[i + 2] = rgb[2]
    data[i + 3] = 255
  }
  const psd = {
    width,
    height,
    imageData: { width, height, data }
  } as Parameters<typeof writePsd>[0]
  return Buffer.from(writePsd(psd))
}

function defaultOptions(): MergeRequest['options'] {
  return {
    embed: { format: 'jpeg', quality: 80 },
    pageSize: { mode: 'auto' },
    pageGapPx: 0,
    onError: 'abort'
  }
}

function isPdf(filePath: string): boolean {
  if (!existsSync(filePath)) return false
  const head = readFileSync(filePath).subarray(0, 4)
  return head.toString('ascii') === '%PDF'
}

describe('merge-orchestrator (integration)', () => {
  it('단일 PSD → 1페이지 PDF (JPEG)', async () => {
    const psd = makeSyntheticPsd(200, 300, [255, 0, 0])
    const psdPath = resolve(TMP, 'red.psd')
    writeFileSync(psdPath, psd)

    const outputPath = resolve(TMP, 'red.pdf')
    const phasesSeen: string[] = []

    const handle = spawnMergeWorker(
      {
        jobId: 'it-1',
        filePaths: [psdPath],
        outputPath,
        options: defaultOptions()
      },
      {
        workerPath: WORKER_PATH,
        onProgress: (p) => phasesSeen.push(p.phase)
      }
    )

    const result = await handle.promise

    expect(result.cancelled).not.toBe(true)
    expect(result.pageCount).toBe(1)
    expect(result.skippedIndices).toEqual([])
    expect(result.fileSizeBytes).toBeGreaterThan(0)
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0)
    expect(isPdf(outputPath)).toBe(true)

    expect(phasesSeen).toContain('init')
    expect(phasesSeen).toContain('parse')
    expect(phasesSeen).toContain('encode')
    expect(phasesSeen).toContain('write')
    expect(phasesSeen).toContain('finalize')
    expect(phasesSeen).toContain('done')
  })

  it('두 PSD → 2페이지 PDF (PNG 무손실)', async () => {
    const p1 = resolve(TMP, '01.psd')
    const p2 = resolve(TMP, '02.psd')
    writeFileSync(p1, makeSyntheticPsd(150, 200, [255, 0, 0]))
    writeFileSync(p2, makeSyntheticPsd(150, 200, [0, 255, 0]))

    const outputPath = resolve(TMP, 'two.pdf')
    const result = await spawnMergeWorker(
      {
        jobId: 'it-2',
        filePaths: [p1, p2],
        outputPath,
        options: { ...defaultOptions(), embed: { format: 'png' } }
      },
      { workerPath: WORKER_PATH }
    ).promise

    expect(result.pageCount).toBe(2)
    expect(result.skippedIndices).toEqual([])
    expect(isPdf(outputPath)).toBe(true)
  })

  it('고정 너비 리사이즈 + 페이지 간 여백', async () => {
    const p = resolve(TMP, 'wide.psd')
    writeFileSync(p, makeSyntheticPsd(2000, 1000, [128, 128, 255]))

    const outputPath = resolve(TMP, 'resized.pdf')
    const result = await spawnMergeWorker(
      {
        jobId: 'it-3',
        filePaths: [p, p],
        outputPath,
        options: {
          embed: { format: 'jpeg', quality: 70 },
          pageSize: { mode: 'fixed-width', width: 800, withoutEnlargement: true },
          pageGapPx: 20,
          onError: 'abort'
        }
      },
      { workerPath: WORKER_PATH }
    ).promise

    expect(result.pageCount).toBe(2)
    expect(isPdf(outputPath)).toBe(true)
  })

  it('onError=skip: 잘못된 경로 스킵 + 정상 파일 처리', async () => {
    const valid = resolve(TMP, 'valid.psd')
    writeFileSync(valid, makeSyntheticPsd(80, 80, [0, 0, 255]))

    const outputPath = resolve(TMP, 'with-skip.pdf')
    const result = await spawnMergeWorker(
      {
        jobId: 'it-4',
        filePaths: ['/__nonexistent__/missing.psd', valid],
        outputPath,
        options: { ...defaultOptions(), onError: 'skip' }
      },
      { workerPath: WORKER_PATH }
    ).promise

    expect(result.skippedIndices).toEqual([0])
    expect(result.pageCount).toBe(1)
    expect(isPdf(outputPath)).toBe(true)
  })

  it('onError=abort: 잘못된 경로에서 throw + 부분 파일 삭제', async () => {
    const outputPath = resolve(TMP, 'aborted.pdf')

    await expect(
      spawnMergeWorker(
        {
          jobId: 'it-5',
          filePaths: ['/__nonexistent__/missing.psd'],
          outputPath,
          options: { ...defaultOptions(), onError: 'abort' }
        },
        { workerPath: WORKER_PATH }
      ).promise
    ).rejects.toThrow()

    expect(existsSync(outputPath)).toBe(false)
  })

  it('cancel: 처리 중 취소 → cancelled: true + 부분 파일 삭제', async () => {
    const paths: string[] = []
    for (let i = 0; i < 8; i++) {
      const p = resolve(TMP, `c${i}.psd`)
      writeFileSync(p, makeSyntheticPsd(800, 800, [i * 30, 100, 100]))
      paths.push(p)
    }

    const outputPath = resolve(TMP, 'cancelled.pdf')
    const handle = spawnMergeWorker(
      {
        jobId: 'it-6',
        filePaths: paths,
        outputPath,
        options: defaultOptions()
      },
      { workerPath: WORKER_PATH }
    )

    setTimeout(() => handle.cancel(), 80)

    const result = await handle.promise
    expect(result.cancelled).toBe(true)
    expect(existsSync(outputPath)).toBe(false)
  })

  it('promise가 적시에 resolve된다 (10초 안에) — worker exit 의존 회귀 방지', async () => {
    const p = resolve(TMP, 'quick.psd')
    writeFileSync(p, makeSyntheticPsd(100, 100, [200, 200, 0]))

    const start = Date.now()
    const result = await spawnMergeWorker(
      {
        jobId: 'it-7',
        filePaths: [p],
        outputPath: resolve(TMP, 'quick.pdf'),
        options: defaultOptions()
      },
      { workerPath: WORKER_PATH }
    ).promise

    const elapsed = Date.now() - start
    expect(result.pageCount).toBe(1)
    expect(elapsed).toBeLessThan(10_000)
  })
})
