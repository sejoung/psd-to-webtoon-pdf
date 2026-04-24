import type { CSSProperties } from 'react'
import { DropZone } from '../components/DropZone'
import { useMergeStore } from '../stores/mergeStore'

const isMac = window.api.platform === 'darwin'

// 헤더를 윈도우 드래그 영역으로 사용. -webkit-app-region은 비표준이라 캐스팅 필요.
const dragStyle = { WebkitAppRegion: 'drag' } as CSSProperties

export function MergePage() {
  const phase = useMergeStore((s) => s.phase)
  const fileCount = useMergeStore((s) => s.files.length)

  return (
    <div className="flex h-screen w-screen flex-col bg-bg text-text-primary">
      <header
        style={dragStyle}
        className={[
          'flex select-none items-center justify-between border-b border-border py-3',
          // macOS hiddenInset 신호등 자리(약 78px) 확보
          isMac ? 'pl-24 pr-6' : 'px-6'
        ].join(' ')}
      >
        <div className="flex items-baseline gap-3">
          <h1 className="text-sm font-semibold tracking-tight">PSD → PDF</h1>
          <span className="text-xs text-text-secondary">
            여러 PSD를 한 권의 PDF로 묶기
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        {phase === 'idle' || fileCount === 0 ? (
          <DropZone />
        ) : (
          <div className="flex h-full items-center justify-center text-text-secondary">
            파일 목록 UI는 Phase 3에서 추가됩니다 (현재 {fileCount}개 추가됨)
          </div>
        )}
      </main>
    </div>
  )
}
