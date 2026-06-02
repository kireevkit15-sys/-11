'use client'

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, type RefObject } from 'react'

type HeroFigureProps = {
  className?: string
  /**
   * Куда вешать слушатель курсора. Если не передан — слушаем себя.
   * Передавая ref на секцию-родителя, получаем параллакс по всей hero-области,
   * а не только над самой фигуркой.
   */
  pointerTarget?: RefObject<HTMLElement | null>
}

/**
 * Декоративная фигурка героя — псевдо-3D эффект.
 *   1. Halo-glow позади (warm coral → violet)
 *   2. Picture с AVIF / WebP / PNG fallback
 *   3. Бесконечный float (Y-боб + микро-наклон)
 *   4. Параллакс: rotateX/Y + translate + лёгкий scale, спружиненный
 *   5. Drop-shadow для эффекта парения
 *
 * Уважает prefers-reduced-motion.
 */
export function HeroFigure({ className, pointerTarget }: HeroFigureProps) {
  const reduced = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)

  const px = useMotionValue(0)
  const py = useMotionValue(0)

  // Single spring for parallax — was 2 springs × 2 axes
  const sx = useSpring(px, { stiffness: 140, damping: 14, mass: 0.5 })
  const sy = useSpring(py, { stiffness: 140, damping: 14, mass: 0.5 })

  // Single transform instead of 5 separate — collapses 5 motion hooks to 2
  const rotateY = useTransform(sx, [-1, 1], [-18, 18])
  const rotateX = useTransform(sy, [-1, 1], [12, -12])
  const scale   = useTransform(sy, [-1, 1], [1.03, 0.97])

  useEffect(() => {
    if (reduced) return
    if (!pointerTarget?.current) return
    const target = pointerTarget.current

    const onMove = (e: PointerEvent) => {
      const r = target.getBoundingClientRect()
      px.set(((e.clientX - r.left) / r.width - 0.5) * 2)
      py.set(((e.clientY - r.top) / r.height - 0.5) * 2)
    }
    const onLeave = () => { px.set(0); py.set(0) }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerleave', onLeave)
    return () => {
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerleave', onLeave)
    }
  }, [pointerTarget, reduced, px, py])

  return (
    <div
      ref={wrapRef}
      className={`relative isolate aspect-square w-full ${className ?? ''}`}
      style={{ perspective: 1400 }}
      aria-hidden
    >
      {/* Halo-glow: opacity-only pulse — GPU-composited, no repaint */}
      <motion.div
        aria-hidden
        animate={reduced ? undefined : { opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 5.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' }}
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(circle at 50% 55%, rgba(251, 146, 60, 0.36) 0%, rgba(167, 139, 250, 0.30) 35%, transparent 65%)',
          filter: 'blur(50px)',
        }}
      />

      {/* OUTER: parallax tilt — single layer, no nesting */}
      <motion.div
        style={{
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          scale: reduced ? 1 : scale,
          transformStyle: 'preserve-3d',
        }}
        className="relative h-full w-full"
      >
        {/* INNER: idle float — CSS class instead of JS animate prop */}
        <div className={reduced ? 'hero-figure-idle' : 'hero-figure-idle'}>
          <picture>
            <source srcSet="/hero/diva-figure.avif" type="image/avif" />
            <source srcSet="/hero/diva-figure.webp" type="image/webp" />
            <img
              src="/hero/diva-figure.png"
              alt=""
              width={1600}
              height={1627}
              draggable={false}
              decoding="async"
              fetchPriority="high"
              className="h-full w-full object-contain select-none"
              style={{
                filter: 'drop-shadow(0 40px 60px rgba(76, 29, 149, 0.45)) drop-shadow(0 16px 28px rgba(15, 11, 30, 0.35))',
              }}
            />
          </picture>
        </div>
      </motion.div>
    </div>
  )
}
