/**
 * Merge worker.
 *
 * 별도 worker_thread 안에서 실행되어 PSD를 한 장씩 디코딩 → Sharp로 인코딩 →
 * PDFKit 스트림으로 즉시 디스크에 flush 합니다.
 *
 * §3 함정 회피 포인트:
 * - §3.3: Sharp는 항상 Buffer 입력 + raw 옵션 (파일 경로 입력 금지)
 * - §3.4: PNG 한 페이지가 작으므로 libpng 한계 미도달
 * - §3.6: PDFKit 스트리밍 (pdf-lib 금지)
 * - §3.8: ag-psd canvas fallback 위해 @napi-rs/canvas 주입
 * - §3.9: 한 번에 한 PSD만 메모리에 보유 (순차 처리)
 * - §3.11: writeStream/파일 핸들 누수 방지 (try/finally + 부분 파일 삭제)
 */
import { createWriteStream, existsSync, statSync, unlinkSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { parentPort, workerData } from 'node:worker_threads'
import { createCanvas } from '@napi-rs/canvas'
import { initializeCanvas, readPsd } from 'ag-psd'
import PDFDocument from 'pdfkit'
import sharp from 'sharp'
import type { MergeProgress, MergeRequest, MergeResult } from '../../shared/types/index'
import { computePageSize } from '../../shared/utils/page-size'
import { extractRgba } from '../services/extract-rgba'

if (!parentPort) {
  throw new Error('merge.worker must run inside a worker_thread')
}

const port = parentPort
const req = workerData as MergeRequest

// §3.8: ag-psd가 composite 없는 PSD를 만나면 canvas로 재합성하므로 주입 필수.
// @napi-rs/canvas의 createCanvas 시그니처는 ag-psd가 기대하는 것과 호환.
initializeCanvas(createCanvas as unknown as Parameters<typeof initializeCanvas>[0])

// 워커 내부 libvips 스레드 수 제한 — 메모리 폭증 방지.
sharp.concurrency(1)

let cancelRequested = false
port.on('message', (msg: { type?: string }) => {
  if (msg?.type === 'cancel') cancelRequested = true
})

function sendProgress(p: MergeProgress): void {
  port.postMessage({ type: 'progress', payload: p })
}

function sendDone(result: MergeResult): void {
  port.postMessage({ type: 'done', payload: result })
}

function sendErrorMsg(message: string): void {
  port.postMessage({ type: 'error', payload: message })
}

async function processOne(
  index: number,
  filePath: string,
  doc: InstanceType<typeof PDFDocument>
): Promise<void> {
  const fileName = basename(filePath)
  // 한 이터레이션의 모든 임시 변수를 함수 스코프에 가두어 종료 시 GC 대상이 되도록.
  const fileBuf = await readFile(filePath)
  const psd = readPsd(fileBuf, {
    useImageData: true,
    skipLayerImageData: true,
    skipThumbnail: true
  })
  const { width, height } = psd
  const rgba = extractRgba(psd)

  sendProgress({
    jobId: req.jobId,
    phase: 'encode',
    currentIndex: index + 1,
    totalCount: req.filePaths.length,
    currentFileName: fileName
  })

  const [pageW, pageH] = computePageSize(width, height, req.options.pageSize)

  // §3.3: Sharp는 반드시 Buffer 입력 + raw 옵션. 파일 경로 입력은 raw 옵션이 무시됨.
  let pipeline = sharp(Buffer.from(rgba), {
    raw: { width, height, channels: 4 },
    limitInputPixels: false
  })

  if (req.options.pageSize.mode === 'fixed-width') {
    pipeline = pipeline.resize({
      width: pageW,
      withoutEnlargement: req.options.pageSize.withoutEnlargement ?? false
    })
  }

  let imageBuffer: Buffer
  if (req.options.embed.format === 'jpeg') {
    imageBuffer = await pipeline
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: req.options.embed.quality ?? 95, mozjpeg: true })
      .toBuffer()
  } else {
    imageBuffer = await pipeline.png({ compressionLevel: 3 }).toBuffer()
  }

  sendProgress({
    jobId: req.jobId,
    phase: 'write',
    currentIndex: index + 1,
    totalCount: req.filePaths.length,
    currentFileName: fileName
  })

  doc.addPage({ size: [pageW, pageH], margin: 0 })
  doc.image(imageBuffer, 0, 0, { width: pageW, height: pageH })

  if (req.options.pageGapPx > 0 && index < req.filePaths.length - 1) {
    doc.addPage({ size: [pageW, req.options.pageGapPx], margin: 0 })
  }
}

async function run(): Promise<void> {
  const start = Date.now()
  const { jobId, filePaths, outputPath, options } = req
  const totalCount = filePaths.length

  sendProgress({ jobId, phase: 'init', currentIndex: 0, totalCount })

  const doc = new PDFDocument({ autoFirstPage: false })
  const writeStream = createWriteStream(outputPath)
  doc.pipe(writeStream)

  const skipped: number[] = []

  try {
    for (let i = 0; i < filePaths.length; i++) {
      if (cancelRequested) break

      const filePath = filePaths[i]
      if (!filePath) continue
      const fileName = basename(filePath)

      sendProgress({
        jobId,
        phase: 'parse',
        currentIndex: i + 1,
        totalCount,
        currentFileName: fileName,
        skippedIndices: [...skipped]
      })

      try {
        await processOne(i, filePath, doc)
      } catch (err) {
        if (options.onError === 'abort') throw err
        skipped.push(i)
        const message = err instanceof Error ? err.message : String(err)
        sendProgress({
          jobId,
          phase: 'parse',
          currentIndex: i + 1,
          totalCount,
          currentFileName: fileName,
          errorMessage: `Skipped ${fileName}: ${message}`,
          skippedIndices: [...skipped]
        })
      }

      // libvips/PDFKit이 워커 스레드에서 정리될 시간을 줍니다. (§8.6)
      await new Promise<void>((r) => setImmediate(r))
    }

    if (cancelRequested) {
      doc.end()
      await new Promise<void>((resolve) => writeStream.on('close', () => resolve()))
      if (existsSync(outputPath)) {
        try {
          unlinkSync(outputPath)
        } catch {
          /* ignore */
        }
      }
      sendProgress({
        jobId,
        phase: 'cancelled',
        currentIndex: totalCount,
        totalCount,
        skippedIndices: skipped
      })
      sendDone({
        outputPath,
        pageCount: 0,
        skippedIndices: skipped,
        elapsedMs: Date.now() - start,
        fileSizeBytes: 0,
        cancelled: true
      })
      return
    }

    sendProgress({
      jobId,
      phase: 'finalize',
      currentIndex: totalCount,
      totalCount,
      skippedIndices: skipped
    })
    doc.end()
    await new Promise<void>((resolve) => writeStream.on('close', () => resolve()))

    const stat = statSync(outputPath)
    sendProgress({
      jobId,
      phase: 'done',
      currentIndex: totalCount,
      totalCount,
      skippedIndices: skipped
    })
    sendDone({
      outputPath,
      pageCount: filePaths.length - skipped.length,
      skippedIndices: skipped,
      elapsedMs: Date.now() - start,
      fileSizeBytes: stat.size
    })
  } catch (err) {
    // §3.11: 부분 파일 삭제로 사용자 혼동 방지
    try {
      writeStream.destroy()
    } catch {
      /* ignore */
    }
    if (existsSync(outputPath)) {
      try {
        unlinkSync(outputPath)
      } catch {
        /* ignore */
      }
    }
    const message = err instanceof Error ? err.message : String(err)
    sendProgress({
      jobId,
      phase: 'error',
      currentIndex: 0,
      totalCount,
      errorMessage: message,
      skippedIndices: skipped
    })
    sendErrorMsg(message)
  }
}

run().catch((err) => {
  const message = err instanceof Error ? err.message : String(err)
  sendErrorMsg(message)
})
