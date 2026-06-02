import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type Size = 'xs' | 'sm' | 'md' | 'lg'
type Variant = 'tint' | 'primary' | 'glass-light' | 'glass-dark' | 'ghost-dark'

const sizeMap: Record<Size, string> = {
  xs: 'h-7 w-7 rounded-lg',
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-12 w-12 rounded-xl',
}

const variantMap: Record<Variant, string> = {
  tint: 'bg-brand-tint text-primary',
  primary: 'bg-primary text-primary-foreground shadow-md shadow-primary/20',
  'glass-light': 'bg-white/70 text-primary backdrop-blur-sm border border-primary/15',
  'glass-dark':
    'bg-white/[0.06] text-brand-soft backdrop-blur-md border border-white/15',
  'ghost-dark': 'bg-transparent text-white/70',
}

type IconTileProps = {
  children: ReactNode
  size?: Size
  variant?: Variant
  className?: string
}

/**
 * Унифицированный контейнер для иконок (Phosphor duotone).
 * Используется в header, footer, services, calculator — везде, где нужен
 * консистентный стеклянный/тонкий квадрат вокруг иконки.
 */
export function IconTile({
  children,
  size = 'md',
  variant = 'tint',
  className,
}: IconTileProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition',
        sizeMap[size],
        variantMap[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
