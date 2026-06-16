'use client'

import { animate, useInView, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

type CountUpProps = {
  to: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

/**
 * Счётчик, который плавно отсчитывает 0 → to при первом появлении в viewport.
 * Используется в полосе доверия для метрик 780 / 5 / 94.
 */
export function CountUp({
  to,
  duration = 1.6,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: CountUpProps) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const motionValue = useMotionValue(reduced ? to : 0)
  // Track if animation has been started — prevents double-start
  const startedRef = useRef(false)

  useEffect(() => {
    if (!inView || reduced) return
    if (startedRef.current) return
    startedRef.current = true

    const el = ref.current
    if (!el) return

    const controls = animate(motionValue, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      // Direct DOM write — zero React re-renders during animation
      onUpdate: (v) => {
        el.textContent =
          prefix +
          v.toLocaleString('ru-RU', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }) +
          suffix
      },
    })
    return () => controls.stop()
  }, [inView, to, duration, motionValue, reduced, prefix, suffix, decimals])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {reduced
        ? to.toLocaleString('ru-RU', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : '0'}
      {suffix}
    </span>
  )
}
