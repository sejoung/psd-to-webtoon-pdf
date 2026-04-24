import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useEffect } from 'react'
import type { Toast, ToastVariant } from '../stores/toastStore'
import { useToastStore } from '../stores/toastStore'

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  info: 'border-border bg-surface text-text-primary',
  success: 'border-success/40 bg-success/10 text-text-primary',
  warning: 'border-warning/40 bg-warning/10 text-text-primary',
  error: 'border-error/40 bg-error/10 text-text-primary'
}

const ICONS: Record<ToastVariant, React.ComponentType<{ size?: number }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle
}

const ICON_COLOR: Record<ToastVariant, string> = {
  info: 'text-text-secondary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error'
}

function ToastRow({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss)
  const Icon = ICONS[toast.variant]

  useEffect(() => {
    if (toast.durationMs <= 0) return
    const t = setTimeout(() => dismiss(toast.id), toast.durationMs)
    return () => clearTimeout(t)
  }, [toast.id, toast.durationMs, dismiss])

  return (
    <div
      role="status"
      className={[
        'pointer-events-auto flex w-80 items-start gap-3 rounded-card border px-4 py-3 shadow-lg',
        'animate-in fade-in slide-in-from-bottom-2',
        VARIANT_CLASSES[toast.variant]
      ].join(' ')}
    >
      <span className={ICON_COLOR[toast.variant]}>
        <Icon size={18} />
      </span>
      <p className="flex-1 text-sm leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="text-text-secondary hover:text-text-primary"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-6">
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} />
      ))}
    </div>
  )
}
