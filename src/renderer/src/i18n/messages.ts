/**
 * i18n 메시지 사전.
 *
 * 키 네이밍: `<area>.<purpose>`. 인터폴레이션은 `{name}` placeholder.
 *
 * 워커/main process의 에러 메시지는 한국어 그대로 두며 (사용자 한국어 선호),
 * v0.2에서 에러 코드 → renderer i18n 매핑 도입 예정. 지금은 ActionBar/Toast가
 * 워커가 보낸 한국어 message 문자열을 그대로 표시.
 */
export type Locale = 'ko' | 'en'
export const SUPPORTED_LOCALES: Locale[] = ['ko', 'en']

const ko = {
  'header.subtitle': '여러 PSD를 한 권의 PDF로 묶기',
  'header.toggleLocale': '언어 전환',

  'dropzone.dragHere': 'PSD 파일을 드래그해서 여기에 놓으세요',
  'dropzone.minOneHint': '한 개부터 시작할 수 있어요',
  'dropzone.currentCount': '(현재 {count}개)',
  'dropzone.selectButton': '파일 선택',
  'dropzone.ignoredNonPsd': 'PSD가 아닌 {count}개 파일을 무시했습니다',

  'fileList.title': '파일',
  'fileList.addButton': '추가',
  'fileList.empty': '추가된 파일이 없습니다',
  'fileList.duplicateSkipped': '중복된 {count}개 파일은 건너뛰었습니다',
  'fileList.aria.add': '파일 추가',
  'fileList.aria.moveUp': '위로 이동',
  'fileList.aria.moveDown': '아래로 이동',
  'fileList.aria.remove': '제거',

  'options.title': '옵션',
  'options.embed.label': '임베드 포맷',
  'options.embed.jpeg': 'JPEG',
  'options.embed.png': 'PNG (무손실)',
  'options.size.label': '페이지 크기',
  'options.size.auto': '자동 (원본 크기 유지)',
  'options.size.fixedWidth': '고정 너비',
  'options.size.withoutEnlargement': '원본보다 작을 땐 확대하지 않기',
  'options.size.unitPx': 'px',
  'options.gap.label': '페이지 간 여백',
  'options.gap.hint': 'px (페이지 사이 흰 공간)',
  'options.errorPolicy.label': '오류 발생 시',
  'options.errorPolicy.skip': '계속 진행 (실패 파일 건너뛰기)',
  'options.errorPolicy.abort': '중단',

  'actions.clear': '목록 비우기',
  'actions.start': 'PDF 생성',

  'toast.cancelled': '병합이 취소되었습니다',
  'toast.failed': '병합 실패: {message}',
  'toast.over4gb':
    '결과 PDF가 4GB를 초과합니다. 일부 PDF 뷰어에서 열리지 않을 수 있어요.',

  'progress.title': '병합 중…',
  'progress.position': '{total}개 중 {current}번째 처리 중',
  'progress.currentFile': '현재 파일: ',
  'progress.elapsed': '경과 {duration}',
  'progress.remaining': '예상 남은 시간 {duration}',
  'progress.skippedCount': '{count}개 스킵됨',
  'progress.cancel': '취소',

  'completion.title': '병합 완료',
  'completion.statPages': '페이지',
  'completion.statSize': '크기',
  'completion.statElapsed': '소요',
  'completion.skippedLabel': '⚠ 스킵된 파일',
  'completion.skippedMore': ' 외 {count}개',
  'completion.savedAt': '저장 위치',
  'completion.openPdf': 'PDF 열기',
  'completion.showInFolder': '폴더에서 보기',
  'completion.startOver': '처음으로',

  'error.title': '병합 실패',
  'error.unknown': '알 수 없는 오류가 발생했습니다.',
  'error.checkLogs': '자세한 내용은 로그 파일을 확인하세요.',
  'error.openLogFolder': '로그 폴더 열기',
  'error.retry': '다시 시도',

  // Worker phase 라벨
  'phase.init': '준비 중',
  'phase.parse': 'PSD 분석',
  'phase.encode': '이미지 인코딩',
  'phase.write': 'PDF 페이지 작성',
  'phase.finalize': '마무리',
  'phase.done': '완료',
  'phase.cancelled': '취소됨',
  'phase.error': '오류',

  // duration 단위
  'duration.seconds': '{n}초',
  'duration.minutesOnly': '{m}분',
  'duration.minutesSeconds': '{m}분 {s}초',
  'duration.hoursMinutes': '{h}시간 {m}분'
} as const

const en: Record<keyof typeof ko, string> = {
  'header.subtitle': 'Bundle multiple PSDs into one PDF',
  'header.toggleLocale': 'Switch language',

  'dropzone.dragHere': 'Drag and drop PSD files here',
  'dropzone.minOneHint': 'Start with as little as one file',
  'dropzone.currentCount': '({count} added)',
  'dropzone.selectButton': 'Select files',
  'dropzone.ignoredNonPsd': 'Ignored {count} non-PSD file(s)',

  'fileList.title': 'Files',
  'fileList.addButton': 'Add',
  'fileList.empty': 'No files added',
  'fileList.duplicateSkipped': 'Skipped {count} duplicate file(s)',
  'fileList.aria.add': 'Add files',
  'fileList.aria.moveUp': 'Move up',
  'fileList.aria.moveDown': 'Move down',
  'fileList.aria.remove': 'Remove',

  'options.title': 'Options',
  'options.embed.label': 'Embed format',
  'options.embed.jpeg': 'JPEG',
  'options.embed.png': 'PNG (lossless)',
  'options.size.label': 'Page size',
  'options.size.auto': 'Auto (keep original size)',
  'options.size.fixedWidth': 'Fixed width',
  'options.size.withoutEnlargement': "Don't enlarge if narrower than original",
  'options.size.unitPx': 'px',
  'options.gap.label': 'Page gap',
  'options.gap.hint': 'px (white space between pages)',
  'options.errorPolicy.label': 'On error',
  'options.errorPolicy.skip': 'Continue (skip failed files)',
  'options.errorPolicy.abort': 'Abort',

  'actions.clear': 'Clear list',
  'actions.start': 'Generate PDF',

  'toast.cancelled': 'Merge cancelled',
  'toast.failed': 'Merge failed: {message}',
  'toast.over4gb': 'The output PDF exceeds 4 GB. Some PDF viewers may fail to open it.',

  'progress.title': 'Merging…',
  'progress.position': 'Processing {current} of {total}',
  'progress.currentFile': 'Current file: ',
  'progress.elapsed': 'Elapsed {duration}',
  'progress.remaining': 'Remaining ~{duration}',
  'progress.skippedCount': '{count} skipped',
  'progress.cancel': 'Cancel',

  'completion.title': 'Merge complete',
  'completion.statPages': 'Pages',
  'completion.statSize': 'Size',
  'completion.statElapsed': 'Elapsed',
  'completion.skippedLabel': '⚠ Skipped files',
  'completion.skippedMore': ' and {count} more',
  'completion.savedAt': 'Saved at',
  'completion.openPdf': 'Open PDF',
  'completion.showInFolder': 'Show in folder',
  'completion.startOver': 'Start over',

  'error.title': 'Merge failed',
  'error.unknown': 'An unknown error occurred.',
  'error.checkLogs': 'Check the log file for details.',
  'error.openLogFolder': 'Open log folder',
  'error.retry': 'Retry',

  'phase.init': 'Initializing',
  'phase.parse': 'Parsing PSD',
  'phase.encode': 'Encoding image',
  'phase.write': 'Writing PDF page',
  'phase.finalize': 'Finalizing',
  'phase.done': 'Done',
  'phase.cancelled': 'Cancelled',
  'phase.error': 'Error',

  'duration.seconds': '{n}s',
  'duration.minutesOnly': '{m}m',
  'duration.minutesSeconds': '{m}m {s}s',
  'duration.hoursMinutes': '{h}h {m}m'
}

export const dict = { ko, en } as const
export type MessageKey = keyof typeof ko

export function format(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = params[k]
    return v === undefined ? `{${k}}` : String(v)
  })
}
