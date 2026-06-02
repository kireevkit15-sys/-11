import { cn } from '@/lib/utils'

type Props = {
  /** Опциональный нумерованный префикс — "01", "02". Editorial-приём. */
  number?: string
  /** Подпись — короткое слово или 2-3 слова. Будет в КАПС mono. */
  children: React.ReactNode
  align?: 'left' | 'center'
  /** Контраст: light для светлого фона, dark для тёмного. */
  variant?: 'light' | 'dark'
  className?: string
}

/**
 * Editorial section header — единый паттерн для всех секций.
 * Тонкая линия (24px) + опц. номер + uppercase mono в primary.
 *
 * Заменяет «капсулу с искрой» (выглядела детски):
 *   ❌ <Badge>✨ Услуги</Badge>
 *   ✓ <SectionEyebrow number="01">Услуги</SectionEyebrow>
 */
export function SectionEyebrow({
  number,
  children,
  align = 'left',
  variant = 'light',
  className,
}: Props) {
  const isDark = variant === 'dark'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-3',
        align === 'center' && 'mx-auto',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn('h-px w-10', isDark ? 'bg-brand-soft' : 'bg-primary')}
      />
      {number && (
        <span
          className={cn(
            'font-mono text-[11px] font-medium tabular-nums-display',
            isDark ? 'text-white/45' : 'text-muted-foreground',
          )}
        >
          {number}
        </span>
      )}
      <span
        className={cn(
          'font-mono text-[11px] font-semibold uppercase tracking-[0.22em]',
          isDark ? 'text-brand-soft' : 'text-primary',
        )}
      >
        {children}
      </span>
    </div>
  )
}
