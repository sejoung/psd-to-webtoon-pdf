import { formatBytes } from '@shared/utils/format-bytes'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { FileEntry } from '../stores/mergeStore'

interface FileRowProps {
  index: number
  file: FileEntry
  total: number
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onRemove: (path: string) => void
}

export function FileRow({
  index,
  file,
  total,
  onMoveUp,
  onMoveDown,
  onRemove
}: FileRowProps) {
  const isFirst = index === 0
  const isLast = index === total - 1

  return (
    <div className="group flex items-center gap-2 px-4 py-2 transition-colors hover:bg-surface">
      <span className="w-8 text-right text-xs tabular-nums text-text-secondary">
        {index + 1}
      </span>

      <div className="flex flex-shrink-0 gap-0.5">
        <button
          type="button"
          onClick={() => onMoveUp(index)}
          disabled={isFirst}
          aria-label="Move up"
          className="rounded p-1 text-text-secondary transition-colors hover:bg-bg hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(index)}
          disabled={isLast}
          aria-label="Move down"
          className="rounded p-1 text-text-secondary transition-colors hover:bg-bg hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-text-primary">{file.name}</span>
        <span className="truncate text-xs text-text-secondary">{file.path}</span>
      </div>

      <span className="flex-shrink-0 tabular-nums text-xs text-text-secondary">
        {file.size === null ? '—' : formatBytes(file.size)}
      </span>

      <button
        type="button"
        onClick={() => onRemove(file.path)}
        aria-label="Remove"
        className="rounded p-1 text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
      >
        <X size={14} />
      </button>
    </div>
  )
}
