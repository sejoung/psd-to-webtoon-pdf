import type { CSSProperties } from 'react'
import { ActionBar } from '../components/ActionBar'
import { CompletionCard } from '../components/CompletionCard'
import { DropZone } from '../components/DropZone'
import { ErrorCard } from '../components/ErrorCard'
import { FileList } from '../components/FileList'
import { LocaleToggle } from '../components/LocaleToggle'
import { OptionsPanel } from '../components/OptionsPanel'
import { ProgressOverlay } from '../components/ProgressOverlay'
import { Toaster } from '../components/Toaster'
import { useGlobalErrorLogger } from '../hooks/useGlobalErrorLogger'
import { useMergeProgressBridge } from '../hooks/useMergeProgressBridge'
import { useT } from '../i18n/useT'
import { useMergeStore } from '../stores/mergeStore'

const isMac = window.api.platform === 'darwin'

const dragStyle = { WebkitAppRegion: 'drag' } as CSSProperties

export function MergePage() {
  useMergeProgressBridge()
  useGlobalErrorLogger()

  const phase = useMergeStore((s) => s.phase)
  const fileCount = useMergeStore((s) => s.files.length)
  const t = useT()

  const showDropZone = fileCount === 0

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-bg text-text-primary">
      <header
        style={dragStyle}
        className={[
          'flex select-none items-center justify-between border-b border-border py-3',
          isMac ? 'pl-24 pr-6' : 'px-6'
        ].join(' ')}
      >
        <div className="flex items-baseline gap-3">
          <h1 className="text-sm font-semibold tracking-tight">PSD → PDF</h1>
          <span className="text-xs text-text-secondary">{t('header.subtitle')}</span>
        </div>
        <LocaleToggle />
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        {showDropZone ? (
          <div className="flex-1 p-6">
            <DropZone />
          </div>
        ) : (
          <>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-6 lg:grid-cols-[1fr_360px]">
              <FileList />
              <div className="overflow-y-auto">
                <OptionsPanel />
              </div>
            </div>
            <ActionBar />
          </>
        )}
      </main>

      {phase === 'merging' && <ProgressOverlay />}
      {phase === 'completed' && <CompletionCard />}
      {phase === 'error' && <ErrorCard />}

      <Toaster />
    </div>
  )
}
