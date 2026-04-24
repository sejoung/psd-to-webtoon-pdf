export interface EmbedOption {
  format: 'jpeg' | 'png'
  /** JPEG 전용. 60–100. 기본 95. */
  quality?: number
}

export interface PageSizeOption {
  mode: 'auto' | 'fixed-width'
  /** mode === 'fixed-width'일 때만 사용. 픽셀. */
  width?: number
  /** fixed-width인데 원본이 더 좁을 때 확대 방지 (Sharp withoutEnlargement) */
  withoutEnlargement?: boolean
}

export interface MergeOptions {
  embed: EmbedOption
  pageSize: PageSizeOption
  /** 페이지 사이에 삽입할 빈 공간(픽셀). 기본 0. */
  pageGapPx: number
  /** 개별 PSD 실패 시 전략. */
  onError: 'skip' | 'abort'
}

export interface MergeRequest {
  /** UUIDv4. 취소·진행률 매칭용. */
  jobId: string
  /** 사용자가 정한 순서 (절대 경로). */
  filePaths: string[]
  /** 사용자가 선택한 저장 경로. */
  outputPath: string
  options: MergeOptions
}

export type MergePhase =
  | 'init'
  | 'parse'
  | 'encode'
  | 'write'
  | 'finalize'
  | 'done'
  | 'cancelled'
  | 'error'

export interface MergeProgress {
  jobId: string
  phase: MergePhase
  /** 1-based. */
  currentIndex: number
  totalCount: number
  currentFileName?: string
  /** phase === 'error'일 때 메시지. */
  errorMessage?: string
  /** 누적 스킵 인덱스 (onError='skip'). */
  skippedIndices?: number[]
}

export interface MergeResult {
  outputPath: string
  pageCount: number
  skippedIndices: number[]
  elapsedMs: number
  fileSizeBytes: number
}

export const DEFAULT_MERGE_OPTIONS: MergeOptions = {
  embed: { format: 'jpeg', quality: 95 },
  pageSize: { mode: 'auto' },
  pageGapPx: 0,
  onError: 'skip'
}
