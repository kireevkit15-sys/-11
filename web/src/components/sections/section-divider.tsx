'use client'

import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

type Variant = 'soft-curve' | 'organic' | 'gentle-wave'
type Position = 'top' | 'bottom'

type SectionDividerProps = {
  /** 'top' = SVG растёт ВВЕРХ из секции (кривая поверх соседа сверху).
   *  'bottom' = SVG растёт ВНИЗ из секции. */
  position: Position
  /** CSS-цвет заливки. Передавайте цвет ТЕКУЩЕЙ секции, чтобы она «вылезала» в соседнюю. */
  fill?: string
  variant?: Variant
  /** Декоративные точки-орнамент в цвете акцента. */
  decorated?: boolean
  className?: string
}

/**
 * Высоты подобраны так, чтобы кривая была заметной, но не «волной из 2010-х».
 * На мобильных меньше — иначе съедает контент.
 */
const PATHS: Record<Variant, string> = {
  // Мягкая асимметричная кривая — лёгкий «холм» сместён вправо
  'soft-curve':
    'M0,55 C220,90 420,30 640,40 C820,48 980,72 1200,28 L1200,100 L0,100 Z',
  // Более органичная — двойной перегиб, вдохновлено Stripe
  organic:
    'M0,40 C160,80 320,20 500,50 C680,80 820,30 1000,55 C1100,68 1160,40 1200,55 L1200,100 L0,100 Z',
  // Едва заметная волна для тонких переходов между «своими» секциями
  'gentle-wave':
    'M0,55 C300,75 600,35 900,55 C1050,65 1150,45 1200,55 L1200,100 L0,100 Z',
}

const ORNAMENT_DOTS = [
  { cx: '12%', cy: '22%', r: 4, color: '#FB923C', delay: 0 },
  { cx: '28%', cy: '60%', r: 2.5, color: '#A78BFA', delay: 0.4 },
  { cx: '54%', cy: '18%', r: 3, color: '#6366F1', delay: 0.8 },
  { cx: '76%', cy: '50%', r: 2, color: '#FB923C', delay: 1.2 },
  { cx: '88%', cy: '28%', r: 3.5, color: '#A78BFA', delay: 1.6 },
] as const

export function SectionDivider({
  position,
  fill = 'currentColor',
  variant = 'soft-curve',
  decorated = false,
  className,
}: SectionDividerProps) {
  const reduced = useReducedMotion()
  const isTop = position === 'top'

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 z-10 overflow-hidden',
        // Контейнер выходит ЗА пределы секции на свою высоту,
        // поэтому кривая визуально вторгается в соседнюю секцию.
        isTop ? '-top-12 h-12 sm:-top-20 sm:h-20' : '-bottom-12 h-12 sm:-bottom-20 sm:h-20',
        className,
      )}
    >
      <svg
        viewBox="0 0 1200 100"
        preserveAspectRatio="none"
        className={cn('h-full w-full', isTop ? 'scale-y-[-1]' : '')}
      >
        <defs>
          {/* Лёгкая внутренняя тень на кривой — даёт глубину */}
          <linearGradient id={`shade-${position}-${variant}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.06)" />
            <stop offset="20%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>

        <path d={PATHS[variant]} fill={fill} />
        <path d={PATHS[variant]} fill={`url(#shade-${position}-${variant})`} />

        {decorated && (
          <g>
            {ORNAMENT_DOTS.map((d, i) =>
              reduced ? (
                <circle
                  key={i}
                  cx={d.cx}
                  cy={d.cy}
                  r={d.r}
                  fill={d.color}
                  opacity={0.6}
                />
              ) : (
                <motion.circle
                  key={i}
                  cx={d.cx}
                  cy={d.cy}
                  r={d.r}
                  fill={d.color}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{
                    opacity: [0.35, 0.75, 0.35],
                    scale: [0.85, 1.15, 0.85],
                    y: [0, -3, 0],
                  }}
                  transition={{
                    duration: 4 + i * 0.3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: d.delay,
                  }}
                />
              ),
            )}
          </g>
        )}
      </svg>
    </div>
  )
}
