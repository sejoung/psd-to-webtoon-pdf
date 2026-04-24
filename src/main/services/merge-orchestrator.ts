import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'
import type { WebContents } from 'electron'
import type { MergeProgress, MergeRequest, MergeResult } from '../../shared/types/index'

const __dirname = dirname(fileURLToPath(import.meta.url))

const activeWorkers = new Map<string, Worker>()

interface WorkerMessage {
  type: 'progress' | 'done' | 'error'
  payload: unknown
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

export function runMerge(req: MergeRequest, sender: WebContents): Promise<MergeResult> {
  return new Promise<MergeResult>((resolve, reject) => {
    let workerPath: string
    try {
      workerPath = resolveWorkerPath()
    } catch (err) {
      reject(err)
      return
    }

    const worker = new Worker(workerPath, { workerData: req })
    activeWorkers.set(req.jobId, worker)

    let resolved = false
    let result: MergeResult | null = null

    worker.on('message', (msg: WorkerMessage) => {
      if (msg.type === 'progress') {
        if (!sender.isDestroyed()) {
          sender.send('merge-progress', msg.payload as MergeProgress)
        }
      } else if (msg.type === 'done') {
        result = msg.payload as MergeResult
      } else if (msg.type === 'error') {
        resolved = true
        reject(new Error(msg.payload as string))
      }
    })

    worker.on('error', (err) => {
      resolved = true
      reject(err)
    })

    worker.on('exit', (code) => {
      activeWorkers.delete(req.jobId)
      if (resolved) return
      if (result) {
        resolve(result)
      } else if (code !== 0) {
        // §10 #12: 워커 segfault 등 비정상 종료 (try/catch로 잡히지 않는 native crash)
        reject(
          new Error(
            `Merge worker exited unexpectedly (code ${code}). 처리 중 오류가 발생했습니다 — 더 적은 파일이나 낮은 품질로 다시 시도해 주세요.`
          )
        )
      } else {
        reject(new Error('Merge worker finished without producing a result'))
      }
    })
  })
}

export function cancelMerge(jobId: string): boolean {
  const w = activeWorkers.get(jobId)
  if (!w) return false
  w.postMessage({ type: 'cancel' })
  return true
}

export function isMergeActive(jobId: string): boolean {
  return activeWorkers.has(jobId)
}
