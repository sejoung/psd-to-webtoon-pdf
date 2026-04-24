export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const totalSec = Math.round(ms / 1000)
  if (totalSec < 60) return `${totalSec}초`
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (min < 60) return sec > 0 ? `${min}분 ${sec}초` : `${min}분`
  const hr = Math.floor(min / 60)
  const remMin = min % 60
  return `${hr}시간 ${remMin}분`
}

export function phaseLabel(phase: string): string {
  switch (phase) {
    case 'init':
      return '준비 중'
    case 'parse':
      return 'PSD 분석'
    case 'encode':
      return '이미지 인코딩'
    case 'write':
      return 'PDF 페이지 작성'
    case 'finalize':
      return '마무리'
    case 'done':
      return '완료'
    case 'cancelled':
      return '취소됨'
    case 'error':
      return '오류'
    default:
      return phase
  }
}
