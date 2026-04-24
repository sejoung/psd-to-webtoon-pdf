import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-accent text-text-primary hover:bg-accent-hover focus-visible:ring-accent/60',
  secondary:
    'bg-surface text-text-primary border border-border hover:border-text-secondary focus-visible:ring-text-secondary/40',
  danger:
    'bg-error/10 text-error border border-error/30 hover:bg-error/20 focus-visible:ring-error/40',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface focus-visible:ring-text-secondary/40'
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2'
}

export function Button({
  variant = 'secondary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      className={[
        'inline-flex select-none items-center justify-center rounded-card font-medium',
        'transition-colors focus:outline-none focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      ].join(' ')}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}
