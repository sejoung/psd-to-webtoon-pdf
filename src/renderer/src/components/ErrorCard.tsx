import { AlertTriangle, FolderOpen, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMergeStore } from '../stores/mergeStore'
import { Button } from './Button'

export function ErrorCard() {
  const errorMessage = useMergeStore((s) => s.errorMessage)
  const resetSession = useMergeStore((s) => s.resetSession)
  const [logPath, setLogPath] = useState<string | null>(null)

  useEffect(() => {
    window.api
      .getLogPath()
      .then(setLogPath)
      .catch(() => setLogPath(null))
  }, [])

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/85 backdrop-blur">
      <div className="w-[520px] rounded-card border border-error/40 bg-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-error" size={28} />
          <h2 className="text-lg font-semibold text-text-primary">병합 실패</h2>
        </div>

        <div className="mt-4 rounded-card border border-error/30 bg-error/5 px-3 py-3">
          <p className="text-sm text-text-primary">
            {errorMessage ?? '알 수 없는 오류가 발생했습니다.'}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-xs text-text-secondary">
            자세한 내용은 로그 파일을 확인하세요.
          </p>
          {logPath && (
            <p className="mt-1 break-all rounded-card border border-border bg-bg/60 px-3 py-2 font-mono text-xs text-text-primary">
              {logPath}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            leftIcon={<FolderOpen size={14} />}
            onClick={() => window.api.openLogFolder()}
          >
            로그 폴더 열기
          </Button>
          <Button
            variant="primary"
            leftIcon={<RotateCcw size={14} />}
            onClick={resetSession}
          >
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  )
}
