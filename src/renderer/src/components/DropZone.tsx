import { FilePlus2, Inbox } from 'lucide-react'
import { useCallback } from 'react'
import { useFileDrop } from '../hooks/useFileDrop'
import { makeFileEntry, useMergeStore } from '../stores/mergeStore'

const ALLOWED = ['psd'] as const

export function DropZone() {
  const addFiles = useMergeStore((s) => s.addFiles)
  const fileCount = useMergeStore((s) => s.files.length)

  const ingestPaths = useCallback(
    async (paths: string[]) => {
      if (paths.length === 0) return
      const stats = await window.api.statFiles(paths)
      addFiles(stats.map((s) => makeFileEntry(s.path, s.size)))
    },
    [addFiles]
  )

  const { isOver, bind } = useFileDrop({
    onDrop: ingestPaths,
    allowedExtensions: ALLOWED
  })

  const handleClickAdd = useCallback(async () => {
    const paths = await window.api.selectPsdFiles()
    await ingestPaths(paths)
  }, [ingestPaths])

  return (
    <div
      {...bind}
      className={[
        'flex h-full w-full flex-col items-center justify-center',
        'rounded-card border-2 border-dashed transition-colors',
        isOver
          ? 'border-accent bg-accent/5'
          : 'border-border bg-surface/40 hover:border-text-secondary'
      ].join(' ')}
    >
      <Inbox
        className={isOver ? 'text-accent' : 'text-text-secondary'}
        size={56}
        strokeWidth={1.25}
      />
      <p className="mt-6 text-base font-medium text-text-primary">
        PSD 파일을 드래그해서 여기에 놓으세요
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        한 개부터 시작할 수 있어요
        {fileCount > 0 && ` (현재 ${fileCount}개)`}
      </p>

      <button
        type="button"
        onClick={handleClickAdd}
        className={[
          'mt-8 inline-flex items-center gap-2 rounded-card px-4 py-2',
          'bg-accent text-text-primary text-sm font-medium',
          'transition-colors hover:bg-accent-hover',
          'focus:outline-none focus:ring-2 focus:ring-accent/60'
        ].join(' ')}
      >
        <FilePlus2 size={16} />
        파일 선택
      </button>
    </div>
  )
}
