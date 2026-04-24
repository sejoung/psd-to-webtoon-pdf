import { DEFAULT_MERGE_OPTIONS } from '@shared/types/index'
import { beforeEach, describe, expect, it } from 'vitest'
import { type FileEntry, makeFileEntry, useMergeStore } from '../mergeStore'

function reset(): void {
  useMergeStore.setState(
    {
      files: [],
      options: DEFAULT_MERGE_OPTIONS,
      phase: 'idle',
      jobId: null,
      progress: null,
      result: null,
      errorMessage: null
    },
    false
  )
}

function entries(...paths: string[]): FileEntry[] {
  return paths.map((p) => makeFileEntry(p, 1024))
}

beforeEach(reset)

describe('makeFileEntry', () => {
  it('경로에서 basename 추출 + size 보존', () => {
    expect(makeFileEntry('/Users/x/foo.psd', 4096)).toEqual({
      path: '/Users/x/foo.psd',
      name: 'foo.psd',
      size: 4096
    })
  })

  it('size=null 허용 (stat 실패 케이스)', () => {
    expect(makeFileEntry('/x/y.psd', null).size).toBeNull()
  })
})

describe('mergeStore — initial state', () => {
  it('기본 상태는 idle + 빈 목록', () => {
    const s = useMergeStore.getState()
    expect(s.files).toEqual([])
    expect(s.phase).toBe('idle')
    expect(s.options).toEqual(DEFAULT_MERGE_OPTIONS)
    expect(s.jobId).toBeNull()
    expect(s.result).toBeNull()
  })
})

describe('mergeStore.addFiles', () => {
  it('1개 추가 → phase가 configuring으로 (1개부터 유효)', () => {
    useMergeStore.getState().addFiles(entries('/a/001.psd'))
    expect(useMergeStore.getState().files).toHaveLength(1)
    expect(useMergeStore.getState().phase).toBe('configuring')
  })

  it('자연정렬 적용 (010 < 002가 아니라 002 < 010)', () => {
    useMergeStore.getState().addFiles(entries('/a/010.psd', '/a/001.psd', '/a/002.psd'))
    expect(useMergeStore.getState().files.map((f) => f.name)).toEqual([
      '001.psd',
      '002.psd',
      '010.psd'
    ])
  })

  it('동일 경로 중복은 제거 (§10 #3)', () => {
    useMergeStore.getState().addFiles(entries('/a/x.psd', '/a/y.psd', '/a/x.psd'))
    expect(useMergeStore.getState().files).toHaveLength(2)
  })

  it('연속 호출 시 누적 + 다시 정렬', () => {
    const s = useMergeStore.getState()
    s.addFiles(entries('/a/003.psd', '/a/001.psd'))
    s.addFiles(entries('/a/002.psd'))
    expect(useMergeStore.getState().files.map((f) => f.name)).toEqual([
      '001.psd',
      '002.psd',
      '003.psd'
    ])
  })

  it('빈 배열 추가는 phase를 바꾸지 않음', () => {
    useMergeStore.getState().addFiles([])
    expect(useMergeStore.getState().phase).toBe('idle')
  })
})

describe('mergeStore.removeFile', () => {
  it('마지막 파일을 제거하면 phase=idle', () => {
    const s = useMergeStore.getState()
    s.addFiles(entries('/a/x.psd'))
    expect(useMergeStore.getState().phase).toBe('configuring')
    s.removeFile('/a/x.psd')
    expect(useMergeStore.getState().files).toEqual([])
    expect(useMergeStore.getState().phase).toBe('idle')
  })

  it('일부만 제거하면 phase=configuring 유지', () => {
    const s = useMergeStore.getState()
    s.addFiles(entries('/a/1.psd', '/a/2.psd'))
    s.removeFile('/a/1.psd')
    expect(useMergeStore.getState().files).toHaveLength(1)
    expect(useMergeStore.getState().phase).toBe('configuring')
  })

  it('없는 경로 제거는 무해', () => {
    const s = useMergeStore.getState()
    s.addFiles(entries('/a/x.psd'))
    s.removeFile('/missing/y.psd')
    expect(useMergeStore.getState().files).toHaveLength(1)
  })
})

describe('mergeStore.moveUp / moveDown', () => {
  beforeEach(() => {
    useMergeStore.getState().addFiles(entries('/a/01.psd', '/a/02.psd', '/a/03.psd'))
  })

  it('moveUp: 가운데 → 첫 자리', () => {
    useMergeStore.getState().moveUp(1)
    expect(useMergeStore.getState().files.map((f) => f.name)).toEqual([
      '02.psd',
      '01.psd',
      '03.psd'
    ])
  })

  it('moveUp: index=0이면 무동작', () => {
    useMergeStore.getState().moveUp(0)
    expect(useMergeStore.getState().files.map((f) => f.name)).toEqual([
      '01.psd',
      '02.psd',
      '03.psd'
    ])
  })

  it('moveDown: 가운데 → 마지막', () => {
    useMergeStore.getState().moveDown(1)
    expect(useMergeStore.getState().files.map((f) => f.name)).toEqual([
      '01.psd',
      '03.psd',
      '02.psd'
    ])
  })

  it('moveDown: 마지막이면 무동작', () => {
    useMergeStore.getState().moveDown(2)
    expect(useMergeStore.getState().files.map((f) => f.name)).toEqual([
      '01.psd',
      '02.psd',
      '03.psd'
    ])
  })

  it('범위 밖 인덱스는 무해', () => {
    useMergeStore.getState().moveUp(99)
    useMergeStore.getState().moveDown(-1)
    expect(useMergeStore.getState().files).toHaveLength(3)
  })
})

describe('mergeStore.clearFiles / resetSession', () => {
  it('clearFiles: 빈 목록 + phase=idle', () => {
    const s = useMergeStore.getState()
    s.addFiles(entries('/a/x.psd'))
    s.clearFiles()
    expect(useMergeStore.getState().files).toEqual([])
    expect(useMergeStore.getState().phase).toBe('idle')
  })

  it('resetSession: 진행/결과/에러 초기화하고 파일이 있으면 configuring 복원', () => {
    const s = useMergeStore.getState()
    s.addFiles(entries('/a/x.psd'))
    s.setPhase('completed')
    s.setJobId('abc')
    s.setResult({
      outputPath: '/out.pdf',
      pageCount: 1,
      skippedIndices: [],
      elapsedMs: 100,
      fileSizeBytes: 200
    })
    s.setError('boom')
    s.resetSession()

    const after = useMergeStore.getState()
    expect(after.phase).toBe('configuring')
    expect(after.jobId).toBeNull()
    expect(after.result).toBeNull()
    expect(after.errorMessage).toBeNull()
    // 파일 목록은 보존 (재시도 시 같은 파일들로 다시 시도 가능)
    expect(after.files).toHaveLength(1)
  })

  it('resetSession: 파일이 없으면 idle로 복원', () => {
    useMergeStore.getState().setPhase('completed')
    useMergeStore.getState().resetSession()
    expect(useMergeStore.getState().phase).toBe('idle')
  })
})

describe('mergeStore.setOptions', () => {
  it('partial merge: embed만 바꿔도 pageSize/pageGapPx 보존', () => {
    useMergeStore.getState().setOptions({ embed: { format: 'png' } })
    const after = useMergeStore.getState().options
    expect(after.embed).toEqual({ format: 'png' })
    expect(after.pageSize).toEqual(DEFAULT_MERGE_OPTIONS.pageSize)
    expect(after.pageGapPx).toBe(DEFAULT_MERGE_OPTIONS.pageGapPx)
  })

  it('연속 setOptions: 누적 적용', () => {
    const s = useMergeStore.getState()
    s.setOptions({ pageGapPx: 50 })
    s.setOptions({ onError: 'abort' })
    const after = useMergeStore.getState().options
    expect(after.pageGapPx).toBe(50)
    expect(after.onError).toBe('abort')
  })
})
