import { useEffect, useState } from 'react'

export interface DroppedFile {
  /** Electron WebUtils.getPathForFile 결과. 절대 경로. */
  path: string
}

interface UseFileDropOptions {
  onDrop: (paths: string[]) => void
  /** 허용 확장자 (소문자, 점 없음). */
  allowedExtensions: readonly string[]
  /** 무시된(허용 안 된) 파일 수. UI에서 토스트 표시 등에 사용. */
  onRejected?: (count: number) => void
}

interface UseFileDropResult {
  /** 현재 드래그 오버 중인지. 시각적 강조용. */
  isOver: boolean
  /** 드래그 이벤트 바인딩. 컨테이너 div 등에 spread. */
  bind: {
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
}

/**
 * Electron 환경에서 OS 파일 드롭을 처리.
 * 브라우저의 `File.path`(deprecated)가 아닌 `webUtils.getPathForFile`을 통해
 * preload에서 노출된 경로 추출 함수가 필요. 여기서는 `window.api.getPathForFile`이
 * 없을 경우 `(file as any).path`로 폴백 (Electron 30+에서도 일정 기간 호환).
 */
export function useFileDrop({
  onDrop,
  allowedExtensions,
  onRejected
}: UseFileDropOptions): UseFileDropResult {
  const [isOver, setIsOver] = useState(false)

  useEffect(() => {
    // 윈도우 전체에서 파일 드롭이 페이지 navigation으로 처리되는 것을 방지
    const prevent = (e: DragEvent): void => {
      e.preventDefault()
    }
    window.addEventListener('dragover', prevent)
    window.addEventListener('drop', prevent)
    return () => {
      window.removeEventListener('dragover', prevent)
      window.removeEventListener('drop', prevent)
    }
  }, [])

  const allowed = new Set(allowedExtensions.map((e) => e.toLowerCase()))

  function extOf(name: string): string {
    const dot = name.lastIndexOf('.')
    return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase()
  }

  return {
    isOver,
    bind: {
      onDragOver: (e) => {
        e.preventDefault()
        if (!isOver) setIsOver(true)
      },
      onDragLeave: (e) => {
        e.preventDefault()
        setIsOver(false)
      },
      onDrop: (e) => {
        e.preventDefault()
        setIsOver(false)

        const files = Array.from(e.dataTransfer.files)
        const paths: string[] = []
        let rejected = 0

        for (const f of files) {
          if (!allowed.has(extOf(f.name))) {
            rejected += 1
            continue
          }
          // Electron 32+ sandboxed renderer: webUtils.getPathForFile 경유 (preload 노출)
          const p = window.api.getPathForFile(f)
          if (p) paths.push(p)
          else rejected += 1
        }

        if (paths.length > 0) onDrop(paths)
        if (rejected > 0 && onRejected) onRejected(rejected)
      }
    }
  }
}
