import { formatBytes } from '@shared/utils/format-bytes'
import { CheckCircle2, FolderOpen, RotateCcw } from 'lucide-react'
import { useEffect } from 'react'
import { useT } from '../i18n/useT'
import { useMergeStore } from '../stores/mergeStore'
import { useToastStore } from '../stores/toastStore'
import { formatDuration } from '../utils/format-duration'
import { Button } from './Button'

const FOUR_GB = 4 * 1024 * 1024 * 1024

export function CompletionCard() {
  const result = useMergeStore((s) => s.result)
  const files = useMergeStore((s) => s.files)
  const clearFiles = useMergeStore((s) => s.clearFiles)
  const resetSession = useMergeStore((s) => s.resetSession)
  const pushToast = useToastStore((s) => s.push)
  const t = useT()

  // §10 #13: 4GB 초과 시 일부 뷰어 호환성 경고
  useEffect(() => {
    if (result && result.fileSizeBytes > FOUR_GB) {
      pushToast({
        message: t('toast.over4gb'),
        variant: 'warning',
        durationMs: 8000
      })
    }
  }, [result, pushToast, t])

  if (!result) return null

  const skippedNames = (result.skippedIndices ?? [])
    .map((i) => files[i]?.name)
    .filter((n): n is string => Boolean(n))

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/85 backdrop-blur">
      <div className="w-[520px] rounded-card border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="text-success" size={28} />
          <h2 className="text-lg font-semibold text-text-primary">
            {t('completion.title')}
          </h2>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-card border border-border bg-bg/40 px-3 py-2">
            <dt className="text-xs text-text-secondary">{t('completion.statPages')}</dt>
            <dd className="mt-0.5 text-text-primary tabular-nums">{result.pageCount}</dd>
          </div>
          <div className="rounded-card border border-border bg-bg/40 px-3 py-2">
            <dt className="text-xs text-text-secondary">{t('completion.statSize')}</dt>
            <dd className="mt-0.5 text-text-primary tabular-nums">
              {formatBytes(result.fileSizeBytes)}
            </dd>
          </div>
          <div className="rounded-card border border-border bg-bg/40 px-3 py-2">
            <dt className="text-xs text-text-secondary">{t('completion.statElapsed')}</dt>
            <dd className="mt-0.5 text-text-primary tabular-nums">
              {formatDuration(result.elapsedMs, t)}
            </dd>
          </div>
        </dl>

        {skippedNames.length > 0 && (
          <p className="mt-4 rounded-card border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-text-primary">
            <span className="font-medium text-warning">
              {t('completion.skippedLabel')}
            </span>{' '}
            ({skippedNames.length}): {skippedNames.slice(0, 3).join(', ')}
            {skippedNames.length > 3 &&
              t('completion.skippedMore', { count: skippedNames.length - 3 })}
          </p>
        )}

        <div className="mt-5">
          <p className="text-xs text-text-secondary">{t('completion.savedAt')}</p>
          <p className="mt-1 break-all rounded-card border border-border bg-bg/60 px-3 py-2 font-mono text-xs text-text-primary">
            {result.outputPath}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => {
              clearFiles()
              resetSession()
            }}
          >
            {t('completion.startOver')}
          </Button>
          <Button
            variant="secondary"
            leftIcon={<FolderOpen size={14} />}
            onClick={() => window.api.showInFolder(result.outputPath)}
          >
            {t('completion.showInFolder')}
          </Button>
          <Button
            variant="primary"
            onClick={() => window.api.openPath(result.outputPath)}
          >
            {t('completion.openPdf')}
          </Button>
        </div>
      </div>
    </div>
  )
}
