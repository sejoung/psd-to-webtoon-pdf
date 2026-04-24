import { ArrowRight, Trash2 } from 'lucide-react'
import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useMergeStore } from '../stores/mergeStore'
import { useToastStore } from '../stores/toastStore'
import { Button } from './Button'

function defaultPdfName(firstName: string | undefined, count: number): string {
  if (!firstName) return 'merged.pdf'
  const stem = firstName.replace(/\.psd$/i, '')
  if (count <= 1) return `${stem}.pdf`
  return `${stem}_${count}pages.pdf`
}

export function ActionBar() {
  const files = useMergeStore((s) => s.files)
  const options = useMergeStore((s) => s.options)
  const setPhase = useMergeStore((s) => s.setPhase)
  const setJobId = useMergeStore((s) => s.setJobId)
  const setResult = useMergeStore((s) => s.setResult)
  const setError = useMergeStore((s) => s.setError)
  const clearFiles = useMergeStore((s) => s.clearFiles)
  const pushToast = useToastStore((s) => s.push)

  const canStart = files.length >= 1

  const handleStart = useCallback(async () => {
    if (!canStart) return
    const defaultName = defaultPdfName(files[0]?.name, files.length)
    const outputPath = await window.api.selectOutputPdf({ defaultName })
    if (!outputPath) return

    const jobId = uuidv4()
    setJobId(jobId)
    setError(null)
    setResult(null)
    setPhase('merging')

    try {
      const result = await window.api.startMerge({
        jobId,
        filePaths: files.map((f) => f.path),
        outputPath,
        options
      })
      setResult(result)
      if (result.cancelled) {
        setPhase('cancelled')
        pushToast({
          message: '병합이 취소되었습니다',
          variant: 'info',
          durationMs: 3500
        })
      } else {
        setPhase('completed')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setPhase('error')
      pushToast({ message: `병합 실패: ${message}`, variant: 'error', durationMs: 6000 })
    }
  }, [canStart, files, options, setError, setJobId, setPhase, setResult, pushToast])

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border bg-bg/80 px-6 py-4">
      <Button
        variant="ghost"
        leftIcon={<Trash2 size={14} />}
        onClick={clearFiles}
        disabled={files.length === 0}
      >
        목록 비우기
      </Button>
      <Button
        variant="primary"
        rightIcon={<ArrowRight size={16} />}
        onClick={handleStart}
        disabled={!canStart}
      >
        PDF 생성
      </Button>
    </div>
  )
}
