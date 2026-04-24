import { useEffect } from 'react'

/**
 * 브라우저(Renderer) 측 글로벌 에러 / 미처리 Promise 거부를 main 로그 파일로 전송.
 * 앱 셸 마운트 시 한 번만 호출.
 */
export function useGlobalErrorLogger(): void {
  useEffect(() => {
    const onError = (e: ErrorEvent): void => {
      window.api.log('error', `window.onerror: ${e.message}`, {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error instanceof Error ? e.error.stack : undefined
      })
    }

    const onRejection = (e: PromiseRejectionEvent): void => {
      const reason = e.reason
      const message =
        reason instanceof Error ? reason.message : String(reason ?? 'unknown')
      window.api.log('error', `unhandledrejection: ${message}`, {
        stack: reason instanceof Error ? reason.stack : undefined
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
}
