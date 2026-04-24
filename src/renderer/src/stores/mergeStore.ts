import type { MergeOptions, MergeProgress, MergeResult } from '@shared/types/index'
import { DEFAULT_MERGE_OPTIONS } from '@shared/types/index'
import { compareNatural } from '@shared/utils/natural-sort'
import { basenameFromPath } from '@shared/utils/path'
import { create } from 'zustand'

export type MergePhase =
  | 'idle'
  | 'configuring'
  | 'merging'
  | 'completed'
  | 'cancelled'
  | 'error'

export interface FileEntry {
  path: string
  name: string
  size: number | null
}

interface MergeStoreState {
  files: FileEntry[]
  options: MergeOptions
  phase: MergePhase
  jobId: string | null
  progress: MergeProgress | null
  result: MergeResult | null
  errorMessage: string | null
}

interface MergeStoreActions {
  addFiles: (entries: FileEntry[]) => void
  removeFile: (path: string) => void
  moveUp: (index: number) => void
  moveDown: (index: number) => void
  clearFiles: () => void
  setOptions: (patch: Partial<MergeOptions>) => void
  setPhase: (phase: MergePhase) => void
  setJobId: (jobId: string | null) => void
  setProgress: (progress: MergeProgress | null) => void
  setResult: (result: MergeResult | null) => void
  setError: (message: string | null) => void
  resetSession: () => void
}

const initialState: MergeStoreState = {
  files: [],
  options: DEFAULT_MERGE_OPTIONS,
  phase: 'idle',
  jobId: null,
  progress: null,
  result: null,
  errorMessage: null
}

function deriveBasename(path: string): string {
  return basenameFromPath(path)
}

function dedupeAndSort(entries: FileEntry[]): FileEntry[] {
  const seen = new Set<string>()
  const unique: FileEntry[] = []
  for (const e of entries) {
    if (seen.has(e.path)) continue
    seen.add(e.path)
    unique.push(e)
  }
  return unique.sort((a, b) => compareNatural(a.name, b.name))
}

export const useMergeStore = create<MergeStoreState & MergeStoreActions>((set, get) => ({
  ...initialState,

  addFiles: (entries) => {
    const normalized = entries.map((e) => ({
      path: e.path,
      name: e.name || deriveBasename(e.path),
      size: e.size
    }))
    const merged = dedupeAndSort([...get().files, ...normalized])
    set({
      files: merged,
      phase: merged.length >= 1 ? 'configuring' : get().phase
    })
  },

  removeFile: (path) => {
    const remaining = get().files.filter((f) => f.path !== path)
    set({
      files: remaining,
      phase: remaining.length >= 1 ? 'configuring' : 'idle'
    })
  },

  moveUp: (index) => {
    if (index <= 0) return
    const next = [...get().files]
    const tmp = next[index - 1]
    const cur = next[index]
    if (!tmp || !cur) return
    next[index - 1] = cur
    next[index] = tmp
    set({ files: next })
  },

  moveDown: (index) => {
    const files = get().files
    if (index < 0 || index >= files.length - 1) return
    const next = [...files]
    const cur = next[index]
    const after = next[index + 1]
    if (!cur || !after) return
    next[index] = after
    next[index + 1] = cur
    set({ files: next })
  },

  clearFiles: () => set({ files: [], phase: 'idle' }),

  setOptions: (patch) => set({ options: { ...get().options, ...patch } }),

  setPhase: (phase) => set({ phase }),
  setJobId: (jobId) => set({ jobId }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ result }),
  setError: (errorMessage) => set({ errorMessage }),

  resetSession: () =>
    set({
      phase: get().files.length >= 1 ? 'configuring' : 'idle',
      jobId: null,
      progress: null,
      result: null,
      errorMessage: null
    })
}))

export function makeFileEntry(path: string, size: number | null): FileEntry {
  return { path, name: deriveBasename(path), size }
}
