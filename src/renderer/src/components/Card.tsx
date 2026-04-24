import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={[
        'rounded-card border border-border bg-surface/60 shadow-sm',
        className
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={[
        'flex items-center justify-between border-b border-border px-5 py-3',
        className
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export function CardBody({ className = '', children, ...rest }: CardProps) {
  return (
    <div {...rest} className={['px-5 py-4', className].join(' ')}>
      {children}
    </div>
  )
}
