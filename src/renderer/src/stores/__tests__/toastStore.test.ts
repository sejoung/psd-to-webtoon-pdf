import { beforeEach, describe, expect, it } from 'vitest'
import { useToastStore } from '../toastStore'

beforeEach(() => useToastStore.getState().clear())

describe('toastStore', () => {
  it('push: 토스트 추가 + 고유 id 반환', () => {
    const id1 = useToastStore.getState().push({ message: 'hello' })
    const id2 = useToastStore.getState().push({ message: 'world' })
    expect(id1).not.toBe(id2)

    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(2)
    expect(toasts[0]?.message).toBe('hello')
    expect(toasts[1]?.message).toBe('world')
  })

  it('기본 variant=info, durationMs=4500', () => {
    useToastStore.getState().push({ message: 'x' })
    const t = useToastStore.getState().toasts[0]
    expect(t?.variant).toBe('info')
    expect(t?.durationMs).toBe(4500)
  })

  it('명시 variant/duration 적용', () => {
    useToastStore
      .getState()
      .push({ message: 'err', variant: 'error', durationMs: 10_000 })
    const t = useToastStore.getState().toasts[0]
    expect(t?.variant).toBe('error')
    expect(t?.durationMs).toBe(10_000)
  })

  it('dismiss: 특정 id만 제거', () => {
    const id = useToastStore.getState().push({ message: 'a' })
    useToastStore.getState().push({ message: 'b' })
    useToastStore.getState().dismiss(id)
    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0]?.message).toBe('b')
  })

  it('clear: 전체 비움', () => {
    useToastStore.getState().push({ message: 'a' })
    useToastStore.getState().push({ message: 'b' })
    useToastStore.getState().clear()
    expect(useToastStore.getState().toasts).toEqual([])
  })
})
