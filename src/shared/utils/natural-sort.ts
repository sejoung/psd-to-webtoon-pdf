/**
 * 파일명 자연정렬 비교자.
 * "001.psd" < "002.psd" < "010.psd" 처럼 숫자 부분을 수치로 비교.
 * `Intl.Collator`의 `numeric` 옵션 사용 — 로케일 인지 + 빠름.
 */
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base'
})

export function compareNatural(a: string, b: string): number {
  return collator.compare(a, b)
}

export function naturalSort<T>(items: T[], pick: (item: T) => string): T[] {
  return [...items].sort((x, y) => compareNatural(pick(x), pick(y)))
}
