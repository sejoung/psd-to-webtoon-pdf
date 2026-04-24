import type { PageSizeOption } from '../types/index'

/**
 * PSD 원본 크기와 사용자 옵션을 받아 최종 페이지 크기를 산출.
 *
 * 규칙:
 * - mode === 'auto'      → 원본 그대로
 * - mode === 'fixed-width' → width 비율로 종횡비 보존하며 리사이즈
 * - withoutEnlargement이고 원본이 더 좁으면 원본 너비 유지 (확대 방지)
 */
export function computePageSize(
  origW: number,
  origH: number,
  opt: PageSizeOption
): [number, number] {
  if (opt.mode === 'auto') return [origW, origH]
  if (opt.mode === 'fixed-width' && opt.width) {
    const targetW = opt.withoutEnlargement && opt.width > origW ? origW : opt.width
    const ratio = targetW / origW
    return [Math.round(targetW), Math.round(origH * ratio)]
  }
  return [origW, origH]
}
