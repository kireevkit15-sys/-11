'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type FadeInProps = {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}

/**
 * Лёгкая обёртка для секций — мягкий fade + slide-up при появлении в viewport.
 * Триггерится один раз. Уважает prefers-reduced-motion.
 */
export function FadeIn({ children, delay = 0, y = 24, className }: FadeInProps) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
