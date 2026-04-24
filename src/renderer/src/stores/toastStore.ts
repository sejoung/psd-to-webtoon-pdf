import { create } from 'zustand'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  /** 자동 사라짐(ms). 0이면 수동 닫기 전용. 기본 4500. */
  durationMs: number
}

interface ToastState {
  toasts: Toast[]
}

interface ToastActions {
  push: (input: {
    message: string
    variant?: ToastVariant
    durationMs?: number
  }) => string
  dismiss: (id: string) => void
  clear: () => void
}

let counter = 0
function nextId(): string {
  counter += 1
  return `t_${Date.now().toString(36)}_${counter}`
}

export const useToastStore = create<ToastState & ToastActions>((set, get) => ({
  toasts: [],

  push: ({ message, variant = 'info', durationMs = 4500 }) => {
    const id = nextId()
    set({ toasts: [...get().toasts, { id, message, variant, durationMs }] })
    return id
  },

  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  clear: () => set({ toasts: [] })
}))
