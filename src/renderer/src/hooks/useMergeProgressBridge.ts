import { useEffect } from 'react'
import { useMergeStore } from '../stores/mergeStore'

/**
 * main → renderer 의 `merge-progress` 이벤트를 구독해 mergeStore에 반영.
 * 앱 셸 마운트 시 한 번만 호출해야 함.
 */
export function useMergeProgressBridge(): void {
  const setProgress = useMergeStore((s) => s.setProgress)

  useEffect(() => {
    const unsubscribe = window.api.onMergeProgress((p) => {
      setProgress(p)
    })
    return unsubscribe
  }, [setProgress])
}
