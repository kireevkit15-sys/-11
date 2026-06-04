'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import Image from 'next/image'
import type { ReactElement } from 'react'
import { motion, useReducedMotion, useInView } from 'motion/react'
import { Play, ArrowUpRight } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/motion/fade-in'
import { SectionEyebrow } from '@/components/sections/section-eyebrow'
import { ContentVideoDialog } from './content-video-dialog'

// ============================================================================
// TYPES
// ============================================================================

export type VideoItem = {
  id: string
  channel: 'youtube' | 'rutube' | 'vkvideo'
  videoId: string
  cover: string
  coverAlt: string
  title: string
  description: string
  views: string
  duration: string
}

type SocialLink = {
  id: string
  label: string
  href: string
  followers: string
  icon: 'vk' | 'tg' | 'youtube' | 'rutube'
}

// ============================================================================
// DATA
// ============================================================================

const videos: VideoItem[] = [
  {
    id: 'v1',
    channel: 'youtube',
    videoId: '3vvjytkHV3s',
    cover: 'https://i.ytimg.com/vi/3vvjytkHV3s/maxresdefault.jpg',
    coverAlt: 'Приветствие основателя ДИВА',
    title: 'О компании ДИВА — бухгалтерия для стартапов',
    description: 'Приветственное видео от основателя: чем занимается ДИВА и почему мы специализируемся на ФСИ.',
    views: '1200',
    duration: '0:58',
  },
  {
    id: 'v2',
    channel: 'youtube',
    videoId: '8wd_Wjk_GKI',
    cover: 'https://i.ytimg.com/vi/8wd_Wjk_GKI/maxresdefault.jpg',
    coverAlt: 'Все шаги студенческого стартапа',
    title: 'Все шаги для успешного выполнения студенческого стартапа',
    description: 'Пошаговый разбор: от подписания договора с ФСИ до закрытия отчётности.',
    views: '3400',
    duration: '1:02',
  },
  {
    id: 'v3',
    channel: 'youtube',
    videoId: 'IhXATjZh-Kg',
    cover: 'https://i.ytimg.com/vi/IhXATjZh-Kg/maxresdefault.jpg',
    coverAlt: 'Где найти деньги на развитие проекта',
    title: 'Где ещё найти деньги на проект после студенческого стартапа',
    description: 'Три направления для привлечения финансирования, которые работают на практике.',
    views: '2800',
    duration: '0:55',
  },
  {
    id: 'v4',
    channel: 'youtube',
    videoId: 'dULyMhgdsLo',
    cover: 'https://i.ytimg.com/vi/dULyMhgdsLo/maxresdefault.jpg',
    coverAlt: 'Почему с бухгалтером проще',
    title: 'Почему с бухгалтером проще, чем с автоматизированными сервисами',
    description: 'Живой бухгалтер снимает риски и берёт на себя ответственность — сервисы этого не делают.',
    views: '1900',
    duration: '0:52',
  },
  {
    id: 'v5',
    channel: 'youtube',
    videoId: 'Z3Rlm9J_wSQ',
    cover: 'https://i.ytimg.com/vi/Z3Rlm9J_wSQ/maxresdefault.jpg',
    coverAlt: 'Военский учёт организации',
    title: 'Что такое военский учёт организации и как с ним работать',
    description: 'Разбираем обязанности ООО по военскому учёту: документы, сроки, ответственность.',
    views: '2100',
    duration: '0:59',
  },
  {
    id: 'v6',
    channel: 'youtube',
    videoId: 'DGB5BeL9ESk',
    cover: 'https://i.ytimg.com/vi/DGB5BeL9ESk/maxresdefault.jpg',
    coverAlt: 'Бизнес-план для студенческого стартапа',
    title: 'Что такое бизнес-план для студенческого стартапа и из чего он состоит',
    description: 'Структура бизнес-плана для гранта ФСИ: что проверяют кураторы и как не получить замечания.',
    views: '2600',
    duration: '1:05',
  },
  {
    id: 'v7',
    channel: 'youtube',
    videoId: 'jFu5iLw1W1A',
    cover: 'https://i.ytimg.com/vi/jFu5iLw1W1A/maxresdefault.jpg',
    coverAlt: 'Популярные вопросы по ФСИ',
    title: 'Популярные вопросы по работе с ФСИ — отвечает эксперт ДИВА',
    description: 'Разбираем самые частые вопросы грантополучателей: отчётность, договор, финансирование.',
    views: '5200',
    duration: '31:48',
  },
]

const socialLinks: SocialLink[] = [
  { id: 'vk', label: 'ВКонтакте', href: 'https://vk.com/ac_diva', followers: '1840', icon: 'vk' },
  { id: 'tg', label: 'Telegram', href: 'https://t.me/diva_accounting', followers: '620', icon: 'tg' },
  { id: 'youtube', label: 'YouTube', href: 'https://youtube.com/channel/UCLDax7nGHf8K1AiP23Z00sA', followers: '1200', icon: 'youtube' },
  { id: 'rutube', label: 'RuTube', href: 'https://rutube.ru/channel/diva-accounting', followers: '340', icon: 'rutube' },
]

// ============================================================================
// CONFIG
// ============================================================================

const channelConfig: Record<string, { label: string; color: string }> = {
  youtube: { label: 'YouTube', color: '#EF4444' },
  rutube: { label: 'RuTube', color: '#3B82F6' },
  vkvideo: { label: 'VK Видео', color: '#4C6EF5' },
}

const iconColors: Record<string, { main: string; bg: string; glow: string }> = {
  vk: { main: '#0077FF', bg: 'rgba(0,119,255,0.15)', glow: 'rgba(0,119,255,0.4)' },
  tg: { main: '#26C4F0', bg: 'rgba(38,196,240,0.15)', glow: 'rgba(38,196,240,0.4)' },
  youtube: { main: '#EF4444', bg: 'rgba(239,68,68,0.15)', glow: 'rgba(239,68,68,0.4)' },
  rutube: { main: '#3B82F6', bg: 'rgba(59,130,246,0.15)', glow: 'rgba(59,130,246,0.4)' },
}

function getYouTubeThumbnailCandidates(videoId: string): string[] {
  return [
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/default.jpg`,
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  ]
}

function getVideoThumbnailCandidates(video: VideoItem): string[] {
  if (video.channel === 'youtube') return getYouTubeThumbnailCandidates(video.videoId)
  return [video.cover]
}

// ============================================================================
// SOCIAL ICONS — точные SVG из Layer_1.svg
// ============================================================================

const BRAND = {
  vk:      { color: '#0077FF', label: 'ВКонтакте' },
  tg:      { color: '#29B6F6', label: 'Telegram' },
  youtube: { color: '#FF0000', label: 'YouTube' },
  rutube:  { color: '#A544FF', label: 'RuTube' },
} as const

function SocialIcon({ id, size = 28 }: { id: string; size?: number }) {
  const b = BRAND[id as keyof typeof BRAND]
  if (!b) return null

  // Точные SVG из Layer_1.svg
  const icons: Record<string, ReactElement> = {
    vk: (
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <path fill="#0077FF" d="M25.217 22.402h-2.179c-0.825 0-1.080-0.656-2.562-2.158-1.291-1.25-1.862-1.418-2.179-1.418-0.445 0-0.572 0.127-0.572 0.741v1.968c0 0.53-0.169 0.847-1.566 0.847-2.818-0.189-5.24-1.726-6.646-3.966l-0.021-0.035c-1.632-2.027-2.835-4.47-3.43-7.142l-0.022-0.117c0-0.317 0.127-0.614 0.741-0.614h2.179c0.55 0 0.762 0.254 0.975 0.846 1.078 3.112 2.878 5.842 3.619 5.842 0.275 0 0.402-0.127 0.402-0.825v-3.219c-0.085-1.482-0.868-1.608-0.868-2.137 0.009-0.283 0.241-0.509 0.525-0.509 0.009 0 0.017 0 0.026 0.001l-0.001-0h3.429c0.466 0 0.635 0.254 0.635 0.804v4.34c0 0.465 0.212 0.635 0.339 0.635 0.275 0 0.509-0.17 1.016-0.677 1.054-1.287 1.955-2.759 2.642-4.346l0.046-0.12c0.145-0.363 0.493-0.615 0.9-0.615 0.019 0 0.037 0.001 0.056 0.002l-0.003-0h2.179c0.656 0 0.805 0.337 0.656 0.804-0.874 1.925-1.856 3.579-2.994 5.111l0.052-0.074c-0.232 0.381-0.317 0.55 0 0.975 0.232 0.317 0.995 0.973 1.503 1.566 0.735 0.727 1.351 1.573 1.816 2.507l0.025 0.055c0.212 0.612-0.106 0.93-0.72 0.93zM20.604 1.004h-9.207c-8.403 0-10.392 1.989-10.392 10.392v9.207c0 8.403 1.989 10.392 10.392 10.392h9.207c8.403 0 10.392-1.989 10.392-10.392v-9.207c0-8.403-2.011-10.392-10.392-10.392z"/>
      </svg>
    ),
    tg: (
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <path fill="#29B6F6" d="M88.723,12.142C76.419,17.238,23.661,39.091,9.084,45.047c-9.776,3.815-4.053,7.392-4.053,7.392    s8.345,2.861,15.499,5.007c7.153,2.146,10.968-0.238,10.968-0.238l33.62-22.652c11.922-8.107,9.061-1.431,6.199,1.431    c-6.199,6.2-16.452,15.975-25.036,23.844c-3.815,3.338-1.908,6.199-0.238,7.63c6.199,5.246,23.129,15.976,24.082,16.691    c5.037,3.566,14.945,8.699,16.452-2.146c0,0,5.961-37.435,5.961-37.435c1.908-12.637,3.815-24.321,4.053-27.659    C97.307,8.804,88.723,12.142,88.723,12.142z"/>
      </svg>
    ),
    youtube: (
      <svg viewBox="0 0 16 16" width={size} height={size}>
        <path fill="#FF0000" d="M14.712 4.633a1.754 1.754 0 00-1.234-1.234C12.382 3.11 8 3.11 8 3.11s-4.382 0-5.478.289c-.6.161-1.072.634-1.234 1.234C1 5.728 1 8 1 8s0 2.283.288 3.367c.162.6.635 1.073 1.234 1.234C3.618 12.89 8 12.89 8 12.89s4.382 0 5.478-.289a1.754 1.754 0 001.234-1.234C15 10.272 15 8 15 8s0-2.272-.288-3.367z"/>
        <path fill="#ffffff" d="M6.593 10.11l3.644-2.098-3.644-2.11v4.208z"/>
      </svg>
    ),
    rutube: (
      <svg viewBox="0 0 192 192" width={size} height={size}>
        <path fill="#ffffff" d="M128.689 47.57H20.396v116.843h30.141V126.4h57.756l26.352 38.013h33.75l-29.058-38.188c9.025-1.401 15.522-4.73 19.493-9.985 3.97-5.255 5.956-13.664 5.956-24.875v-8.759c0-6.657-.721-11.912-1.985-15.941-1.264-4.029-3.43-7.533-6.498-10.686-3.249-2.978-6.858-5.08-11.19-6.481-4.332-1.226-9.747-1.927-16.424-1.927zm-4.873 53.08H50.537V73.321h73.279c4.15 0 7.038.7 8.482 1.927 1.444 1.226 2.347 3.503 2.347 6.832v9.81c0 3.503-.903 5.78-2.347 7.006s-4.331 1.752-8.482 1.752z"/>
        <path fill="#F41240" d="M162.324 45.568c5.52 0 9.998-4.477 9.998-10s-4.478-10-9.998-10c-5.524 0-10.002 4.477-10.002 10s4.478 10 10.002 10z"/>
      </svg>
    ),
  }

  return icons[id] || null
}

// ============================================================================
// FALLING STARS — CSS-only, 60fps, infinite loop
// ============================================================================

const FALLING_STARS = [
  { x: 5,  dur: 10, delay: 0,    size: 2,   opacity: 0.8, drift: -1 },
  { x: 18, dur: 8,  delay: -3,  size: 1.5, opacity: 0.6, drift:  0.5 },
  { x: 32, dur: 12, delay: -6,  size: 2.5, opacity: 0.7, drift: -0.8 },
  { x: 48, dur: 9,  delay: -1,  size: 1,   opacity: 0.5, drift:  1.2 },
  { x: 62, dur: 11, delay: -5,  size: 2,   opacity: 0.8, drift: -0.6 },
  { x: 75, dur: 8,  delay: -8,  size: 1.5, opacity: 0.6, drift:  0.8 },
  { x: 88, dur: 10, delay: -2,  size: 2,   opacity: 0.7, drift: -1 },
]

function FallingStars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {FALLING_STARS.map((s, i) => (
        <div
          key={i}
          className="falling-star"
          style={{
            left: `${s.x}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
            '--drift': `${s.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// ============================================================================
// INTERACTIVE STAR FIELD (CSS-based for reliability)
// ============================================================================

// Pre-defined star positions — 8 stars (was 20), reduced for GPU
const STARS = [
  { x: 5, y: 15, size: 1.5, delay: 0, duration: 2.5 },
  { x: 25, y: 10, size: 2, delay: 0.5, duration: 3 },
  { x: 45, y: 45, size: 1.8, delay: 1, duration: 2.8 },
  { x: 65, y: 25, size: 1.7, delay: 1.5, duration: 2.6 },
  { x: 85, y: 20, size: 2.1, delay: 2, duration: 3.1 },
  { x: 15, y: 65, size: 1.6, delay: 0.6, duration: 2.9 },
  { x: 50, y: 85, size: 2, delay: 2.5, duration: 3.4 },
  { x: 75, y: 70, size: 1.7, delay: 1.8, duration: 2.6 },
]

// Pre-defined particle positions — 6 particles (was 12)
const PARTICLES = [
  { x: 20, y: 30, size: 3, delay: 0, duration: 20 },
  { x: 50, y: 60, size: 4, delay: -5, duration: 25 },
  { x: 80, y: 45, size: 2.5, delay: -10, duration: 18 },
  { x: 35, y: 80, size: 3.5, delay: -3, duration: 22 },
  { x: 65, y: 25, size: 2, delay: -8, duration: 28 },
  { x: 15, y: 55, size: 4, delay: -12, duration: 24 },
]

function StarField() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const lastMove = useRef(0)

  useEffect(() => {
    if (reduced || !sectionRef.current || !spotlightRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle to ~30fps
      if (e.timeStamp - lastMove.current < 33) return
      lastMove.current = e.timeStamp

      const rect = sectionRef.current!.getBoundingClientRect()
      spotlightRef.current!.style.left = `${e.clientX - rect.left}px`
      spotlightRef.current!.style.top = `${e.clientY - rect.top}px`
    }

    sectionRef.current.addEventListener('mousemove', handleMouseMove)
    return () => sectionRef.current?.removeEventListener('mousemove', handleMouseMove)
  }, [reduced])

  return (
    <div ref={sectionRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* SVG Constellation */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="constGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        <path d="M15,20 Q30,35 45,30 T75,45 T90,35" stroke="url(#constGrad)" strokeWidth="0.3" fill="none" />
        <path d="M20,60 Q40,50 55,65 T80,55" stroke="url(#constGrad)" strokeWidth="0.25" fill="none" />
        <path d="M10,40 Q25,45 35,55" stroke="url(#constGrad)" strokeWidth="0.2" fill="none" />
      </svg>

      {/* Stars */}
      {STARS.map((star, i) => (
        <div
          key={i}
          className="star-particle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}

      {/* Cursor spotlight */}
      {!reduced && (
        <div
          ref={spotlightRef}
          className="pointer-events-none absolute size-80 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// FLOATING PARTICLES
// ============================================================================

function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="floating-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// CURSOR TRAIL — pre-allocated DOM pool, no innerHTML
// Performance: ~60fps mousemove without DOM allocation
// ============================================================================

const TRAIL_POOL = 20

function CursorTrail() {
  const containerRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  // Create pool once, never recreate
  useEffect(() => {
    if (reduced || !containerRef.current) return

    const container = containerRef.current

    // Pre-create all trail dots — no innerHTML ever
    const dots: HTMLDivElement[] = []
    for (let i = 0; i < TRAIL_POOL; i++) {
      const dot = document.createElement('div')
      dot.style.cssText = `
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        transform: translate(-50%, -50%);
        will-change: left, top, opacity, width, height;
        background: radial-gradient(circle, rgba(167,139,250,0.5) 0%, transparent 70%);
        opacity: 0;
        transition: none;
      `
      container.appendChild(dot)
      dots.push(dot)
    }

    const points: { x: number; y: number; opacity: number; age: number }[] = []
    let animId = 0

    const handleMove = (e: MouseEvent) => {
      points.push({ x: e.clientX, y: e.clientY, opacity: 1, age: 0 })
      if (points.length > TRAIL_POOL * 2) points.splice(0, points.length - TRAIL_POOL * 2)
    }

    const animate = () => {
      // Age and fade points — mutable array, no TS issues in runtime
      for (let i = points.length - 1; i >= 0; i--) {
        const pt = points[i]!
        pt.age++
        pt.opacity = Math.max(0, pt.opacity - 0.05)
        if (pt.opacity <= 0) points.splice(i, 1)
      }

      // Update dots — direct style manipulation
      for (let i = 0; i < TRAIL_POOL; i++) {
        const p = points[i]
        const dot = dots[i]!
        if (p) {
          const size = 10 + p.opacity * 12
          dot.style.left = `${p.x}px`
          dot.style.top = `${p.y}px`
          dot.style.width = `${size}px`
          dot.style.height = `${size}px`
          dot.style.opacity = String(p.opacity)
        } else {
          dot.style.opacity = '0'
        }
      }

      animId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMove)
    animId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      cancelAnimationFrame(animId)
      dots.forEach(d => d.remove())
      dots.length = 0
      points.length = 0
    }
  }, [reduced])

  if (reduced) return null
  return <div ref={containerRef} className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden />
}

// ============================================================================
// ANIMATED COUNTER — RAF + textContent, no React re-renders per frame
// ============================================================================

function AnimatedCounter({ value, duration = 2000 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const reduced = useReducedMotion()
  const startedRef = useRef(false)

  useEffect(() => {
    if (!inView || reduced || startedRef.current) return
    startedRef.current = true

    const num = parseInt(value.replace(/\s/g, ''), 10)
    const start = Date.now()
    const el = ref.current
    if (!el) return

    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const current = Math.round(num * ease)
      // Direct DOM write — no setState, no re-render
      el.textContent = current.toLocaleString('ru-RU')
      if (p < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [inView, value, duration, reduced])

  // Set final value on mount if already in view
  const initial = reduced ? Number(value).toLocaleString('ru-RU') : '0'
  return <span ref={ref}>{initial}</span>
}

function VideoThumbnailFallback({ video }: { video: VideoItem }) {
  const words = video.title.split(' ').filter(Boolean).slice(0, 4).join(' ')

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#120A2D]">
      <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-primary/45 blur-3xl" />
      <div className="absolute -bottom-12 right-0 h-40 w-40 rounded-full bg-brand-accent/30 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(167,139,250,0.24),transparent_48%)]" />
      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 backdrop-blur-sm">
          <SocialIcon id="youtube" size={14} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">Видео</span>
        </div>
        <p className="max-w-[80%] font-display text-lg font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-xl">
          {words}
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// 3D TILT VIDEO CARD
// ============================================================================

function Video3DCard({ video, index, onPlay }: { video: VideoItem; index: number; onPlay: (v: VideoItem) => void }) {
  const reduced = useReducedMotion()
  const thumbnailCandidates = getVideoThumbnailCandidates(video)
  const [coverIndex, setCoverIndex] = useState(0)
  const coverSrc = thumbnailCandidates[coverIndex] ?? video.cover
  const coverFailed = coverIndex >= thumbnailCandidates.length
  const wrapRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const borderRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const angleRef = useRef(0)
  const rafRef = useRef<number>(0)

  // Бегущий огонь — RAF-анимация угла conic-gradient
  useEffect(() => {
    if (reduced) return
    const el = borderRef.current
    if (!el) return
    const tick = () => {
      angleRef.current = (angleRef.current + (hovered ? 2 : 0.6)) % 360
      const a = angleRef.current
      el.style.background = hovered
        ? `conic-gradient(from ${a}deg, #7C3AED 0%, #A78BFA 12%, #FB923C 25%, #7C3AED 38%, #0D0925 45%, #0D0925 75%, #7C3AED 100%)`
        : `conic-gradient(from ${a}deg, rgba(124,58,237,0.7) 0%, rgba(167,139,250,0.4) 15%, rgba(15,11,30,0.9) 35%, rgba(15,11,30,0.9) 70%, rgba(124,58,237,0.7) 100%)`
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [hovered, reduced])

  // 3D tilt + spotlight
  const onMove = useCallback((e: React.MouseEvent) => {
    if (!wrapRef.current || reduced) return
    const r = wrapRef.current.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width - 0.5) * 14
    const y = ((e.clientY - r.top) / r.height - 0.5) * -14
    wrapRef.current.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${y}deg) scale(1.02)`
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${e.clientX - r.left}px`
      spotlightRef.current.style.top = `${e.clientY - r.top}px`
      spotlightRef.current.style.opacity = '1'
    }
  }, [reduced])

  const onLeave = useCallback(() => {
    setHovered(false)
    if (wrapRef.current) wrapRef.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)'
    if (spotlightRef.current) spotlightRef.current.style.opacity = '0'
  }, [])

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col"
    >
      {/* Внешний glow — дышит */}
      <motion.div
        className="relative flex flex-col rounded-2xl"
        animate={reduced ? undefined : {
          boxShadow: hovered
            ? ['0 0 30px rgba(124,58,237,0.5)', '0 0 60px rgba(124,58,237,0.7)', '0 0 30px rgba(124,58,237,0.5)']
            : ['0 0 10px rgba(124,58,237,0.1)', '0 0 22px rgba(124,58,237,0.25)', '0 0 10px rgba(124,58,237,0.1)'],
        }}
        transition={{ duration: hovered ? 1.2 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Бегущий огонь — p-[2px] */}
        <div ref={borderRef} className="relative h-full rounded-2xl p-[2px]">
          {/* Карточка */}
          <div
            ref={wrapRef}
            onMouseMove={onMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={onLeave}
            onClick={() => onPlay(video)}
            onKeyDown={(e) => e.key === 'Enter' && onPlay(video)}
            role="button"
            tabIndex={0}
            aria-label={`Смотреть: ${video.title}`}
            className="relative flex h-full flex-col cursor-pointer overflow-hidden rounded-[14px] bg-[#0D0925]"
            style={{ transition: 'transform 0.15s ease', transformStyle: 'preserve-3d' }}
          >
            {/* Spotlight */}
            <div
              ref={spotlightRef}
              aria-hidden
              className="pointer-events-none absolute z-20 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(167,139,250,0.22) 0%, transparent 70%)',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
            />

            {/* Top rim */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 left-8 right-8 z-10 h-px"
              style={{
                background: hovered
                  ? 'linear-gradient(90deg, transparent, rgba(167,139,250,1) 50%, transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5) 50%, transparent)',
                transition: 'background 0.3s',
              }}
            />

            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden">
              {coverFailed ? (
                <VideoThumbnailFallback video={video} />
              ) : (
                <Image
                  src={coverSrc}
                  alt={video.coverAlt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                  style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.6s ease' }}
                  onError={() => setCoverIndex((current) => current + 1)}
                  onLoad={(event) => {
                    const isHighTier = coverSrc.includes('/maxresdefault.jpg') || coverSrc.includes('/sddefault.jpg')
                    const img = event.currentTarget

                    if (isHighTier && (img.naturalWidth <= 120 || img.naturalHeight <= 90)) {
                      setCoverIndex((current) => current + 1)
                    }
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0925] via-[#0D0925]/20 to-transparent" />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, transparent 60%)',
                  opacity: hovered ? 1 : 0,
                  transition: 'opacity 0.4s',
                }}
              />

              {/* Play */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={hovered
                    ? { scale: [1, 1.15, 1], boxShadow: ['0 0 0px rgba(167,139,250,0)', '0 0 50px rgba(167,139,250,0.8)', '0 0 20px rgba(167,139,250,0.4)'] }
                    : { scale: 1 }
                  }
                  transition={{ duration: 1.2, repeat: hovered ? Infinity : 0 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    background: 'rgba(124,58,237,0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1.5px solid rgba(167,139,250,0.7)',
                  }}
                >
                  <Play weight="fill" className="ml-0.5 h-6 w-6 text-white" />
                </motion.div>
              </div>

              {/* Badges */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm">
                  <SocialIcon id="youtube" size={14} />
                </div>
                <div className="rounded-full bg-black/60 px-2.5 py-0.5 backdrop-blur-sm">
                  <span className="font-mono text-[11px] font-medium text-white/90">{video.duration}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-1 flex-col p-4">
              <h3
                className="font-display text-sm font-bold leading-snug tracking-tight transition-colors duration-300"
                style={{ color: hovered ? '#A78BFA' : '#ffffff' }}
              >
                {video.title}
              </h3>

              {/* Progress line */}
              <div className="mt-auto pt-3">
                <motion.div
                  className="h-[1.5px] rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7C3AED, #FB923C)' }}
                  animate={{ width: hovered ? '100%' : '0%' }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// SOCIAL CARD
// ============================================================================

function SocialCard({ link, index }: { link: SocialLink; index: number }) {
  const reduced = useReducedMotion()
  const colors = iconColors[link.id]!

  return (
    <motion.a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? undefined : { y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Icon */}
      <motion.div
        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
        whileHover={{ boxShadow: `0 0 35px ${colors.glow}` }}
        style={{
          background: colors.bg,
          boxShadow: `0 0 0 1px ${colors.main}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        <div style={{ color: colors.main }}>
          <SocialIcon id={link.icon} size={32} />
        </div>
      </motion.div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-white sm:text-base">{link.label}</p>
        <div className="mt-1 flex items-baseline gap-1 sm:gap-2">
          <span className="font-mono text-base font-bold sm:text-xl" style={{ color: colors.main }}>
            <AnimatedCounter value={link.followers} />
          </span>
          <span className="font-mono text-[10px] text-white/50 sm:text-xs sm:ml-1">подписчиков</span>
        </div>
      </div>

      <div className="text-white/30 transition-colors group-hover:text-white">
        <ArrowUpRight weight="bold" className="h-5 w-5" />
      </div>
    </motion.a>
  )
}

// ============================================================================
// SECTION
// ============================================================================

export function ContentSection() {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null)

  return (
    <>
      <CursorTrail />

      <section id="content" className="relative overflow-hidden bg-[#0F0B1E] noise-overlay">
        <StarField />
        <FloatingParticles />
        <FallingStars />

        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-60 -right-60 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-600/20 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-orange-500/15 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute inset-0 top-0 z-10 h-48 bg-gradient-to-b from-[#0F0B1E]/60 to-transparent" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-28 sm:px-6 lg:py-48">
          {/* Header */}
          <div className="max-w-3xl">
            <FadeIn>
              <SectionEyebrow number="09" variant="dark">Полезный контент</SectionEyebrow>
              <h2 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-5xl md:text-6xl">
                <span className="text-white">Видео о ФСИ и бухгалтерии</span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-violet-300 to-orange-400 bg-clip-text text-transparent">
                  на своём канале
                </span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="mt-6 max-w-2xl text-lg text-white/55">
                Разбираем тонкости отчётности по грантам, выбираем систему налогообложения
                и отвечаем на вопросы бухгалтерии для стартапов.
              </p>
            </FadeIn>
          </div>

          {/* Video grid */}
          <div className="mt-16 grid grid-cols-1 items-stretch gap-8 sm:grid-cols-2 lg:mt-24 lg:grid-cols-3">
            {videos.slice(0, 6).map((v, i) => (
              <Video3DCard key={v.id} video={v} index={i} onPlay={setActiveVideo} />
            ))}
          </div>
          {/* Full-width featured video */}
          <div className="mt-8">
            <Video3DCard video={videos[6]!} index={6} onPlay={setActiveVideo} />
          </div>

          {/* Social section */}
          <FadeIn delay={0.4}>
            <div
              className="relative mt-24 overflow-hidden rounded-3xl p-px"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(167,139,250,0.2) 50%, rgba(251,146,60,0.3) 100%)' }}
            >
              <div
                className="rounded-[22px] p-8 sm:p-10"
                style={{ background: 'rgba(15,11,30,0.98)', backdropFilter: 'blur(40px)' }}
              >
                <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-2xl font-bold tracking-tight text-white">Следите за нами</h3>
                    <p className="mt-2 text-white/50">Видео, кейсы и новости ФСИ — в наших социальных сетях</p>
                  </div>

                  <div className="flex gap-3">
                    {(['vk', 'tg', 'youtube', 'rutube'] as const).map((id) => {
                      const c = { vk: '#0077FF', tg: '#26C4F0', youtube: '#EF4444', rutube: '#3B82F6' }
                      return (
                        <motion.a
                          key={id}
                          href={socialLinks.find(l => l.id === id)?.href || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.15, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex h-12 w-12 items-center justify-center rounded-xl"
                          style={{
                            background: `${c[id]}15`,
                            border: `1px solid ${c[id]}35`,
                            boxShadow: `0 0 20px ${c[id]}20`,
                          }}
                          aria-label={id}
                        >
                          <div style={{ color: c[id] }}><SocialIcon id={id} size={24} /></div>
                        </motion.a>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
                  {socialLinks.map((link, i) => (
                    <SocialCard key={link.id} link={link} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-40 bg-gradient-to-t from-[#0F0B1E] to-transparent" />
      </section>

      <ContentVideoDialog video={activeVideo} onClose={() => setActiveVideo(null)} />

      {/* CSS Animations — all moved to globals.css for proper deduplication */}
    </>
  )
}