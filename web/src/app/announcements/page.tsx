'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { Sparkle, TelegramLogo } from '@phosphor-icons/react'

import { FadeIn } from '@/components/motion/fade-in'
import { SectionEyebrow } from '@/components/sections/section-eyebrow'
import { AnnouncementCard } from '@/components/sections/announcement-card'
import { partners as staticPartners, partnerTags as staticTags } from '@/data/partners'
import type { Partner } from '@/data/partners'
import { cn } from '@/lib/utils'

// Fetch partners from our API
async function fetchPartners(): Promise<Partner[]> {
  try {
    const res = await fetch('/api/content/partners', {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error('API error')
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

// CTA блок с бегущим огнём и анимированной кнопкой
function CtaBlock() {
  const reduced = useReducedMotion()
  const borderRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLDivElement>(null)
  const angleRef = useRef(0)
  const btnAngleRef = useRef(0)
  const rafRef = useRef<number>(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (reduced) return
    const border = borderRef.current
    const btn = btnRef.current
    if (!border || !btn) return
    const tick = () => {
      angleRef.current = (angleRef.current + 0.4) % 360
      btnAngleRef.current = (btnAngleRef.current + (hovered ? 3 : 1)) % 360
      const a = angleRef.current
      const b = btnAngleRef.current
      border.style.background = `conic-gradient(from ${a}deg, rgba(124,58,237,0.8) 0%, rgba(167,139,250,0.5) 15%, rgba(251,146,60,0.6) 30%, rgba(124,58,237,0.8) 45%, rgba(10,6,18,0.95) 52%, rgba(10,6,18,0.95) 78%, rgba(124,58,237,0.8) 100%)`
      btn.style.background = hovered
        ? `conic-gradient(from ${b}deg, #FB923C 0%, #FBBF24 20%, #F97316 40%, #FB923C 60%, #EA580C 80%, #FB923C 100%)`
        : `conic-gradient(from ${b}deg, rgba(251,146,60,0.9) 0%, rgba(251,191,36,0.7) 25%, rgba(249,115,22,0.9) 50%, rgba(251,146,60,0.9) 100%)`
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [hovered, reduced])

  return (
    <div ref={borderRef} className="relative rounded-3xl p-[2px]"
      style={{ background: 'rgba(124,58,237,0.3)' }}>
      {/* Inner container */}
      <div className="relative overflow-hidden rounded-[22px] p-10 sm:p-12"
        style={{
          background: 'linear-gradient(135deg, rgba(8,4,16,0.98) 0%, rgba(16,8,32,0.96) 100%)',
          backdropFilter: 'blur(32px)',
        }}>
        {/* Aurora */}
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 65% 70% at 15% 50%, rgba(124,58,237,0.22) 0%, transparent 60%), radial-gradient(ellipse 55% 60% at 85% 50%, rgba(251,146,60,0.14) 0%, transparent 55%)' }} />
        {/* Scan line */}
        {!reduced && (
          <motion.div aria-hidden className="pointer-events-none absolute left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.4) 40%, rgba(251,146,60,0.3) 60%, transparent)' }}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} />
        )}

        <div className="relative z-10 flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
          {/* Text */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                animate={reduced ? undefined : { opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }} />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400/70">Открыто для клиентов ДИВА</span>
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
              style={{ textShadow: '0 0 40px rgba(167,139,250,0.25)' }}>
              Вы клиент ДИВА?
            </h2>
            <p className="max-w-sm text-sm text-white/45">
              Разместите объявление о своей команде — бесплатно, за 24 часа
            </p>
          </div>

          {/* Button block */}
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {/* Button with RAF fire border */}
            <div ref={btnRef} className="rounded-2xl p-[2px]"
              style={{ background: 'rgba(251,146,60,0.6)' }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}>
              <a
                href="https://t.me/diva_accounting"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-2.5 overflow-hidden rounded-[14px] px-7 py-3.5 text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, rgba(251,100,20,0.95), rgba(234,88,12,0.98))' }}
              >
                {/* Shimmer */}
                {!reduced && (
                  <motion.span
                    className="pointer-events-none absolute inset-0 -skew-x-12"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.2 }}
                  />
                )}
                <TelegramLogo size={18} weight="fill" className="relative z-10" />
                <span className="relative z-10">Написать в Telegram</span>
                <motion.span
                  className="relative z-10"
                  animate={hovered ? { x: [0, 4, 0] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >→</motion.span>
              </a>
            </div>
            <p className="font-mono text-[10px] text-white/25">
              Пн–СБ 08:00–18:00 МСК · публикуем за 24 ч
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// HUD-терминал с печатающимся текстом
const HUD_LINES = [
  { prefix: '>', text: 'Инициализация базы специалистов...', color: 'text-brand-soft/70', delay: 0 },
  { prefix: '✓', text: '1 команда загружена', color: 'text-emerald-400', delay: 700 },
  { prefix: '>', text: 'Поиск: Full-stack · Mobile · AI', color: 'text-white/60', delay: 1400 },
  { prefix: '●', text: 'Syntax Labs — доступна', color: 'text-emerald-400', delay: 2100 },
  { prefix: '>', text: 'Стек: Next.js · React Native · Go', color: 'text-brand-soft/70', delay: 2800 },
  { prefix: '✓', text: 'Статус: Открыта к проектам', color: 'text-[#FB923C]', delay: 3500 },
]

const SKILLS = ['Next.js', 'React Native', 'Python / AI', 'Go / Node.js', 'Kubernetes', 'Design Systems']

function HudTerminal() {
  const [visibleLines, setVisibleLines] = useState<number[]>([])
  const [typingIdx, setTypingIdx] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [progress, setProgress] = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  const [activeSkill, setActiveSkill] = useState<number | null>(null)

  useEffect(() => {
    // Прогресс-бар
    const prog = setInterval(() => setProgress(p => Math.min(p + 2, 100)), 40)
    setTimeout(() => clearInterval(prog), 2000)

    const timers: ReturnType<typeof setTimeout>[] = []
    HUD_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => {
        setVisibleLines(prev => [...prev, i])
        setTypingIdx(i)
        setTypedText('')
      }, line.delay))
    })
    timers.push(setTimeout(() => setShowProfile(true), 4200))
    return () => { timers.forEach(clearTimeout); clearInterval(prog) }
  }, [])

  useEffect(() => {
    const line = HUD_LINES[typingIdx]
    if (!line || typedText.length >= line.text.length) return
    const t = setTimeout(() => setTypedText(line.text.slice(0, typedText.length + 1)), 25)
    return () => clearTimeout(t)
  }, [typingIdx, typedText])

  // Skill highlight loop
  useEffect(() => {
    if (!showProfile) return
    let i = 0
    const t = setInterval(() => { setActiveSkill(i % SKILLS.length); i++ }, 600)
    return () => clearInterval(t)
  }, [showProfile])

  return (
    <motion.div
      initial={{ opacity: 0, x: 24, y: -10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="absolute hidden lg:flex lg:flex-col"
      style={{
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '380px',
        background: 'linear-gradient(160deg, rgba(8,4,16,0.96) 0%, rgba(18,10,36,0.94) 100%)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(167,139,250,0.18)',
        borderRadius: '18px',
        boxShadow: '0 0 60px rgba(124,58,237,0.20), 0 0 120px rgba(124,58,237,0.08), inset 0 1px 0 rgba(167,139,250,0.18)',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {/* Neon top accent line */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.8) 40%, rgba(251,146,60,0.6) 70%, transparent)', flexShrink: 0 }} />

      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3" style={{ flexShrink: 0 }}>
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/25">diva_search.exe</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[9px] text-white/20">v2.4.1</span>
          <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-3 pb-1" style={{ flexShrink: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest">Загрузка базы</span>
          <span className="font-mono text-[9px] text-brand-soft/50">{progress}%</span>
        </div>
        <div className="h-[3px] w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7C3AED, #A78BFA, #FB923C)', width: `${progress}%` }}
            transition={{ duration: 0.1 }} />
        </div>
      </div>

      {/* Terminal lines */}
      <div className="flex flex-col gap-1.5 px-5 py-3" style={{ flexShrink: 0 }}>
        {HUD_LINES.map((line, i) => (
          <AnimatePresence key={i}>
            {visibleLines.includes(i) && (
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }} className="flex items-start gap-2">
                <span className={cn('font-mono text-[11px] shrink-0 mt-px w-3 text-center', line.color)}>{line.prefix}</span>
                <span className="font-mono text-[11px] text-white/65 leading-relaxed">
                  {i === typingIdx ? typedText : line.text}
                  {i === typingIdx && typedText.length < line.text.length && (
                    <motion.span className="inline-block w-[5px] h-[10px] bg-brand-soft/80 ml-0.5 align-middle"
                      animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
                  )}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/[0.06]" style={{ flexShrink: 0 }} />

      {/* Found profile block */}
      <AnimatePresence>
        {showProfile && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="px-5 py-4" style={{ flexShrink: 0 }}>
            <div className="mb-3 flex items-center gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-brand-soft/50">Найден профиль</span>
              <div className="flex-1 h-px bg-brand-soft/10" />
            </div>
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, hsl(240,65%,45%), hsl(280,70%,55%))', boxShadow: '0 0 20px rgba(124,58,237,0.5)' }}>
                SL
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A0612]" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white">Syntax Labs</p>
                <p className="font-mono text-[10px] text-white/40">Full-stack команда · @kitafun</p>
              </div>
              <div className="ml-auto rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5">
                <span className="font-mono text-[9px] text-emerald-400">● online</span>
              </div>
            </div>
            {/* Skills */}
            <div className="flex flex-wrap gap-1.5">
              {SKILLS.map((s, i) => (
                <motion.span key={s}
                  animate={activeSkill === i ? { borderColor: 'rgba(167,139,250,0.6)', color: 'rgba(167,139,250,1)', boxShadow: '0 0 10px rgba(167,139,250,0.3)' } : { borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', boxShadow: 'none' }}
                  transition={{ duration: 0.3 }}
                  className="rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {s}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom command line */}
      <div className="mt-auto border-t border-white/[0.06] px-5 py-3" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-brand-soft/40">{'>'}</span>
          <span className="font-mono text-[10px] text-white/20">connect --team=syntax-labs</span>
          <motion.span className="ml-1 inline-block h-[9px] w-[5px] bg-brand-soft/50"
            animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
        </div>
      </div>

      {/* Bottom neon line */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(251,146,60,0.4) 50%, transparent)', flexShrink: 0 }} />
    </motion.div>
  )
}

// RAF-анимация неонового ореола вокруг робота
function RobotNeonRing() {
  const reduced = useReducedMotion()
  const ringRef = useRef<HTMLDivElement>(null)
  const angleRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (reduced) return
    const el = ringRef.current
    if (!el) return
    const tick = () => {
      angleRef.current = (angleRef.current + 0.5) % 360
      const a = angleRef.current
      el.style.background = `conic-gradient(from ${a}deg, rgba(167,139,250,0) 0%, rgba(167,139,250,0.8) 15%, rgba(251,146,60,0.6) 30%, rgba(124,58,237,0.9) 45%, rgba(167,139,250,0) 55%, rgba(167,139,250,0) 100%)`
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [reduced])

  return (
    <div
      ref={ringRef}
      aria-hidden
      className="absolute"
      style={{
        inset: '-3px',
        borderRadius: '50%',
        filter: 'blur(18px)',
        opacity: 0.7,
      }}
    />
  )
}

export default function AnnouncementsPage() {
  const reduced = useReducedMotion()
  const [activeCategory] = useState<Partner['category'] | 'all'>('all')
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const [cmsPartners, setCmsPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch partners from our API
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const data = await fetchPartners()
      setCmsPartners(data)
      setIsLoading(false)
    }
    load()
  }, [])

  // Use API data if available, fallback to static data
  const partnersData = cmsPartners.length > 0 ? cmsPartners : staticPartners
  const partnerTagsData = staticTags

  const visibleTags = tagsExpanded ? partnerTagsData : partnerTagsData.slice(0, 8)
  const hiddenTagsCount = partnerTagsData.length - visibleTags.length

  const filtered = useMemo(() => {
    return partnersData.filter((a) => {
      return activeCategory === 'all' || a.category === activeCategory
    })
  }, [partnersData, activeCategory])

  // Show all partners from API (or just featured if loading)
  const visiblePartners = isLoading ? filtered.filter((item) => item.id === 'syntax-labs') : filtered
  const showLoadingCard = (activeCategory === 'all' || activeCategory === 'fullstack') && !isLoading

  return (
    <div className="relative min-h-screen noise-overlay -mt-[80px] pt-[80px] sm:-mt-[88px] sm:pt-[88px]" style={{ backgroundColor: 'var(--brand-ink)' }}>
      {/* Full-cover dark bg to prevent any gaps near header */}
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundColor: 'var(--brand-ink)', zIndex: -1 }} />
      {/* Плавный градиент под шапкой — скрывает зазор */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 right-0 top-0 z-40"
        style={{
          height: '100px',
          background: 'linear-gradient(to bottom, #0A0612 0%, #0A0612 55%, transparent 100%)',
        }}
      />
      {/* Aurora blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-[500px] w-[500px] rounded-full bg-[#FB923C]/12 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* Robot — абсолютный, левая половина, от шапки */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-8 block h-[360px] w-full overflow-hidden lg:hidden"
        style={{ zIndex: 1 }}
      >
        <div
          className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-brand-soft/20 blur-3xl"
        />
        <motion.img
          src="/announcements/robot.png"
          alt=""
          className="absolute left-1/2 top-0 h-[310px] w-[310px] -translate-x-1/2 select-none object-contain opacity-58"
          style={{
            mixBlendMode: 'screen',
            filter: 'drop-shadow(0 0 24px rgba(167,139,250,0.34)) brightness(1.05)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 64%, transparent 96%)',
            maskImage: 'linear-gradient(to bottom, black 0%, black 64%, transparent 96%)',
          }}
        />
      </div>

      {/* Robot — абсолютный, левая половина, от шапки */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 hidden lg:block"
        style={{ width: '58%', top: '-64px', height: 'calc(100vh + 64px)', zIndex: 1 }}
      >
        {/* Halo glow */}
        <motion.div
          aria-hidden
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.04, 1] }}
          transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
          className="absolute"
          style={{
            inset: '10% 0 20% 0',
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(251,146,60,0.35) 0%, rgba(167,139,250,0.28) 40%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Вращающийся neon ring */}
        <div aria-hidden className="absolute" style={{ left: '15%', right: '15%', top: '15%', bottom: '25%' }}>
          <RobotNeonRing />
        </div>
        {/* Scan-line */}
        <motion.div
          aria-hidden
          className="absolute left-0 right-0 h-[1.5px]"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.7) 40%, rgba(251,146,60,0.5) 60%, transparent 100%)' }}
          animate={{ top: ['5%', '90%', '5%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        {/* Robot image — плавное растворение снизу через несколько слоёв */}
        <motion.img
          src="/announcements/robot.png"
          alt=""
          className="absolute left-0 w-full select-none"
          style={{
            top: 0,
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center top',
            mixBlendMode: 'screen',
            filter: 'drop-shadow(0 0 120px rgba(167,139,250,0.85)) drop-shadow(0 0 60px rgba(251,146,60,0.50)) brightness(1.15)',
            WebkitMaskImage: `
              linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.5) 82%, transparent 92%),
              linear-gradient(to right, black 50%, transparent 92%)
            `,
            maskImage: `
              linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.5) 82%, transparent 92%),
              linear-gradient(to right, black 50%, transparent 92%)
            `,
            WebkitMaskComposite: 'source-in',
            maskComposite: 'intersect',
          }}
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* 3D perspective grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-[-10%] right-[-10%] h-[50%]"
        style={{ perspective: '900px', perspectiveOrigin: '50% 0%', zIndex: 0 }}
      >
        <div
          style={{
            width: '100%', height: '100%',
            transform: 'rotateX(72deg)',
            backgroundImage: [
              'linear-gradient(rgba(124,58,237,0.15) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(124,58,237,0.15) 1px, transparent 1px)',
            ].join(','),
            backgroundSize: '80px 80px',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 28%, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 28%, black 70%, transparent 100%)',
          }}
        />
      </div>

      {/* Star particles */}
      {[
        { left: '8%', top: '12%' }, { left: '23%', top: '5%' },
        { left: '45%', top: '18%' }, { left: '67%', top: '8%' },
        { left: '82%', top: '22%' }, { left: '15%', top: '38%' },
        { left: '55%', top: '42%' }, { left: '90%', top: '35%' },
      ].map((pos, i) => (
        <div key={i} aria-hidden className="star-particle pointer-events-none absolute"
          style={{ left: pos.left, top: pos.top, width: 2, height: 2, animationDelay: `${i * 0.7}s` }} />
      ))}

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" style={{ zIndex: 2 }}>
        {/* Hero — заголовок на всю ширину + HUD терминал справа */}
        <FadeIn>
          <section className="relative pb-0" style={{ marginTop: '0' }}>
            <HudTerminal />
            <div className="flex flex-col gap-4 lg:max-w-[55%]">
              <SectionEyebrow number="01" variant="dark">Партнёры и команды</SectionEyebrow>
              <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.035em] text-white md:text-6xl">
                Специалисты,{' '}
                <span className="font-serif-accent italic text-brand-soft">готовые к работе</span>
              </h1>
              <p className="text-base text-white/60" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>Команды стартапов ДИВА открыты для контрактных проектов</p>
                            <div className="flex items-center gap-2">
                <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
                <span className="font-mono text-[10px] text-white/50" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>{partnersData.length} команд · обновлено сегодня</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60"
                    style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                  >
                    {tag}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setTagsExpanded((value) => !value)}
                  className="rounded-full border border-brand-soft/30 bg-brand-soft/12 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-soft transition hover:border-brand-soft/50 hover:bg-brand-soft/18"
                  style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                >
                  {tagsExpanded ? 'Свернуть' : `Ещё ${hiddenTagsCount}`}
                </button>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* Все карточки снизу после робота */}
        <motion.section
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 pb-8 sm:mt-10 lg:mt-12"
        >
          {visiblePartners.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.025] px-6 py-16 text-center">
              <Sparkle size={40} weight="duotone" className="text-white/20" />
              <p className="text-sm text-white/40">Ничего не найдено.</p>
            </div>
          ) : (
            <motion.div
              key={activeCategory}
              layout
              className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3"
              transition={{ layout: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {visiblePartners.map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={reduced ? false : { opacity: 0, y: 18, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0, y: -10, scale: 0.985 }}
                    transition={{
                      duration: 0.42,
                      delay: reduced ? 0 : Math.min(i * 0.045, 0.24),
                      ease: [0.22, 1, 0.36, 1],
                      layout: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                    }}
                    className={cn(item.featured && 'sm:col-span-2 lg:col-span-2')}
                  >
                    <AnnouncementCard item={item} featured={item.featured} />
                  </motion.div>
                ))}

                {showLoadingCard && (
                  <motion.div
                    key="loading-more"
                    layout
                    initial={reduced ? false : { opacity: 0, y: 18, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0, y: -10, scale: 0.985 }}
                    transition={{
                      duration: 0.42,
                      delay: reduced ? 0 : Math.min(visiblePartners.length * 0.045, 0.28),
                      ease: [0.22, 1, 0.36, 1],
                      layout: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                    }}
                    className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 py-12 text-center"
                  >
                    <div className="relative flex h-12 w-12 items-center justify-center">
                      <div
                        className="announcement-loading-spinner absolute inset-0 rounded-full border-2 border-transparent"
                        style={{ borderTopColor: 'rgba(167,139,250,0.9)', borderRightColor: 'rgba(167,139,250,0.28)' }}
                      />
                      <div
                        className="announcement-loading-spinner-reverse absolute inset-2 rounded-full border border-transparent"
                        style={{ borderTopColor: 'rgba(251,146,60,0.68)' }}
                      />
                      <motion.span
                        className="h-1.5 w-1.5 rounded-full bg-brand-soft"
                        animate={reduced ? undefined : { opacity: [1, 0.35, 1], scale: [1, 1.16, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                    <div>
                      <p className="font-display text-[15px] font-semibold text-white/70">Подбираем новых исполнителей</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/25">Анкеты добавляются постепенно</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.section>

        {/* CTA */}
        <FadeIn>
          <section className="mt-16 pb-24">
            <CtaBlock />
          </section>
        </FadeIn>
      </div>
    </div>
  )
}

