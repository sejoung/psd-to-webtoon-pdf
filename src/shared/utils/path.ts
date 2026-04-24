/**
 * 절대/상대 경로에서 파일명만 뽑기.
 * 윈도우(\\)/유닉스(/) 구분자 모두 처리. node:path 의존 없음 — renderer/main 공용.
 */
export function basenameFromPath(path: string): string {
  if (!path) return ''
  const normalized = path.replace(/\\/g, '/')
  const stripped = normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
  const idx = stripped.lastIndexOf('/')
  return idx === -1 ? stripped : stripped.slice(idx + 1)
}

export function extensionOf(path: string): string {
  const base = basenameFromPath(path)
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return ''
  return base.slice(dot + 1).toLowerCase()
}
