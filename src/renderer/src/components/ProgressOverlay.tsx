import { useEffect, useState } from 'react'
import { useT } from '../i18n/useT'
import { useMergeStore } from '../stores/mergeStore'
import { formatDuration, phaseLabel } from '../utils/format-duration'
import { Button } from './Button'

export function ProgressOverlay() {
  const progress = useMergeStore((s) => s.progress)
  const jobId = useMergeStore((s) => s.jobId)
  const totalFiles = useMergeStore((s) => s.files.length)
  const t = useT()

  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [])

  const total = progress?.totalCount ?? totalFiles
  const current = progress?.currentIndex ?? 0
  const ratio = total > 0 ? Math.min(1, current / total) : 0
  const percent = Math.floor(ratio * 100)

  const elapsedMs = now - startedAt
  const remainingMs = ratio > 0.05 ? Math.max(0, elapsedMs / ratio - elapsedMs) : null

  const skippedCount = progress?.skippedIndices?.length ?? 0
  const phase = progress?.phase ?? 'init'

  async function handleCancel(): Promise<void> {
    if (!jobId) return
    await window.api.cancelMerge(jobId)
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg/85 backdrop-blur">
      <div className="w-[480px] rounded-card border border-border bg-surface p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-text-primary">
          {t('progress.title')}
        </h2>
        <p className="mt-1 text-xs text-text-secondary">{phaseLabel(phase, t)}</p>

        <div className="mt-5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between text-xs text-text-secondary">
            <span>{t('progress.position', { current, total })}</span>
            <span className="tabular-nums">{percent}%</span>
          </div>
        </div>

        {progress?.currentFileName && (
          <p className="mt-4 truncate text-sm text-text-primary">
            <span className="text-text-secondary">{t('progress.currentFile')}</span>
            {progress.currentFileName}
          </p>
        )}

        <div className="mt-4 flex items-baseline gap-4 text-xs text-text-secondary">
          <span>{t('progress.elapsed', { duration: formatDuration(elapsedMs, t) })}</span>
          {remainingMs !== null && (
            <span>
              {t('progress.remaining', { duration: formatDuration(remainingMs, t) })}
            </span>
          )}
          {skippedCount > 0 && (
            <span className="text-warning">
              {t('progress.skippedCount', { count: skippedCount })}
            </span>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="danger" onClick={handleCancel}>
            {t('progress.cancel')}
          </Button>
        </div>
      </div>
    </div>
  )
}
