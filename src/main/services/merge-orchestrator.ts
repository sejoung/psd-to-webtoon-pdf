import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'
import type { WebContents } from 'electron'
import type { MergeProgress, MergeRequest, MergeResult } from '../../shared/types/index'
import { workerLogger } from './logger'

const __dirname = dirname(fileURLToPath(import.meta.url))

const activeWorkers = new Map<string, Worker>()

interface WorkerMessage {
  type: 'progress' | 'done' | 'error'
  payload: unknown
}

export interface MergeWorkerHandle {
  promise: Promise<MergeResult>
  cancel: () => void
}

export interface SpawnMergeWorkerOptions {
  /** 명시 시 이 경로 사용 (테스트용). 미지정 시 빌드된 out/main/merge.worker.js를 자동 탐색. */
  workerPath?: string
  /** 진행률 이벤트 콜백. */
  onProgress?: (progress: MergeProgress) => void
}

/**
 * §3.10: 번들러가 코드 분할 시 __dirname이 entry가 아닌 chunk 위치를 가리킬 수 있음.
 * 후보 경로 배열로 fs.existsSync 검사 후 선택하는 방어적 패턴.
 */
function resolveWorkerPath(): string {
  const candidates = [
    join(__dirname, 'merge.worker.js'),
    join(__dirname, '../main/merge.worker.js'),
    join(__dirname, '..', 'merge.worker.js')
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  throw new Error(`merge.worker.js not found. Checked: ${candidates.join(', ')}`)
}

/**
 * 워커를 spawn하고 진행률/완료/에러를 처리.
 *
 * **핵심**: 'done' 메시지를 받는 즉시 promise를 resolve하고 worker.terminate()로 정리한다.
 * 워커 측의 `parentPort.on('message')` 리스너가 thread를 살아있게 잡아두기 때문에,
 * exit 이벤트만 기다리면 영원히 resolve되지 않는다. (이전 버그 원인)
 */
export function spawnMergeWorker(
  req: MergeRequest,
  options: SpawnMergeWorkerOptions = {}
): MergeWorkerHandle {
  const workerPath = options.workerPath ?? resolveWorkerPath()
  const worker = new Worker(workerPath, { workerData: req })
  activeWorkers.set(req.jobId, worker)

  let settled = false
  let resolveFn!: (r: MergeResult) => void
  let rejectFn!: (e: Error) => void
  const promise = new Promise<MergeResult>((res, rej) => {
    resolveFn = res
    rejectFn = rej
  })

  function resolveOnce(r: MergeResult): void {
    if (settled) return
    settled = true
    resolveFn(r)
    void worker.terminate()
  }

  function rejectOnce(err: Error): void {
    if (settled) return
    settled = true
    rejectFn(err)
    void worker.terminate()
  }

  workerLogger.info('merge started', {
    jobId: req.jobId,
    fileCount: req.filePaths.length,
    embed: req.options.embed,
    pageSize: req.options.pageSize,
    onError: req.options.onError
  })

  worker.on('message', (msg: WorkerMessage) => {
    if (msg.type === 'progress') {
      const p = msg.payload as MergeProgress
      if (p.phase === 'error' || p.errorMessage) {
        workerLogger.warn('progress error', p)
      }
      options.onProgress?.(p)
    } else if (msg.type === 'done') {
      const r = msg.payload as MergeResult
      workerLogger.info('merge done', {
        jobId: req.jobId,
        cancelled: r.cancelled === true,
        pageCount: r.pageCount,
        skipped: r.skippedIndices.length,
        elapsedMs: r.elapsedMs,
        fileSizeBytes: r.fileSizeBytes
      })
      resolveOnce(r)
    } else if (msg.type === 'error') {
      const message = String(msg.payload)
      workerLogger.error('merge worker reported error', { jobId: req.jobId, message })
      rejectOnce(new Error(message))
    }
  })

  worker.on('error', (err) => {
    workerLogger.error('worker uncaught error', { jobId: req.jobId, err })
    rejectOnce(err)
  })

  worker.on('exit', (code) => {
    activeWorkers.delete(req.jobId)
    if (settled) return
    if (code !== 0) {
      // §10 #12: 워커 segfault 등 native crash. try/catch로 잡히지 않음.
      workerLogger.error('worker exit non-zero', { jobId: req.jobId, code })
      rejectOnce(
        new Error(
          `Merge worker exited unexpectedly (code ${code}). 처리 중 오류가 발생했습니다 — 더 적은 파일이나 낮은 품질로 다시 시도해 주세요.`
        )
      )
    } else {
      workerLogger.error('worker exit without result', { jobId: req.jobId })
      rejectOnce(new Error('Merge worker exited without producing a result'))
    }
  })

  return {
    promise,
    cancel: () => {
      try {
        worker.postMessage({ type: 'cancel' })
      } catch {
        /* worker already terminated */
      }
    }
  }
}

export function runMerge(req: MergeRequest, sender: WebContents): Promise<MergeResult> {
  const handle = spawnMergeWorker(req, {
    onProgress: (p) => {
      if (!sender.isDestroyed()) {
        sender.send('merge-progress', p)
      }
    }
  })
  return handle.promise
}

export function cancelMerge(jobId: string): boolean {
  const w = activeWorkers.get(jobId)
  if (!w) return false
  try {
    w.postMessage({ type: 'cancel' })
    return true
  } catch {
    return false
  }
}

export function isMergeActive(jobId: string): boolean {
  return activeWorkers.has(jobId)
}
