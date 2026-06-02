'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion, useReducedMotion } from 'motion/react'
import {
  ShieldCheck,
  ChartLineUp,
  Clock,
  HandHeart,
  Compass,
  Lightning,
  CaretLeft,
  CaretRight,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { CountUp } from '@/components/motion/count-up'
import { SectionEyebrow } from '@/components/sections/section-eyebrow'
import { RussiaConstellation } from '@/components/sections/russia-constellation'

type Stat = {
  to: number
  suffix?: string
  prefix?: string
  label: string
  caption: string
}

const stats: Stat[] = [
  {
    to: 780,
    suffix: '+',
    label: 'стартапов сопровождали',
    caption: 'Технологические компании во всех 8 федеральных округах России',
  },
  {
    to: 460,
    label: 'стартапов в работе сейчас',
    caption: 'Активные клиенты на бухгалтерском и грантовом сопровождении',
  },
  {
    to: 1100,
    suffix: '+',
    label: 'бесплатных консультаций',
    caption: 'Провели для стартаперов по ФСИ, открытию ООО и отчётности',
  },
]

// ---------------------------------------------------------------------------
// Pillars экспертизы — тексты дословно с сайта-референса (accounting-diva3d.ru)
// ---------------------------------------------------------------------------
type Pillar = {
  num: string
  title: string
  text: string
  icon: PhosphorIcon
  /** HSL hue для уникальной aurora-подсветки на фоне */
  hueA: number
  hueB: number
}

const pillars: Pillar[] = [
  {
    num: '01',
    title: 'Надёжность',
    text: 'Наша компания помогает стартапам управлять своими финансами с учётом всех законодательных норм и правил. Мы разрабатываем индивидуальные стратегии для оптимизации налогов и улучшения финансовой устойчивости вашего бизнеса.',
    icon: ShieldCheck,
    hueA: 250, // deep violet
    hueB: 25,
  },
  {
    num: '02',
    title: 'Безопасный рост',
    text: 'Доверьте нам ведение бухгалтерии, чтобы освободить время и ресурсы для развития вашего стартапа. Мы обеспечим надёжный бухгалтерский учёт в вашей компании.',
    icon: ChartLineUp,
    hueA: 270,
    hueB: 18,
  },
  {
    num: '03',
    title: 'Поддержка',
    text: 'Наши менеджеры и бухгалтеры всегда готовы помочь вам по любому вопросу, связанному с ведением бухгалтерского учёта или работой с Фондом содействия инновациям.',
    icon: Clock,
    hueA: 290, // magenta-violet
    hueB: 35,
  },
  {
    num: '04',
    title: 'Сопровождение для стартапов',
    text: 'Мы понимаем уникальные потребности стартапов и предоставляем специализированные бухгалтерские услуги, чтобы обеспечить надёжное и эффективное управление развивающейся компанией.',
    icon: HandHeart,
    hueA: 230,
    hueB: 12,
  },
  {
    num: '05',
    title: 'Стратегическая навигация',
    text: 'Наши бухгалтеры не только ведут учёт, но и предоставляют стратегические советы по улучшению финансовой эффективности вашего стартапа. Мы поможем вам принимать обоснованные финансовые решения.',
    icon: Compass,
    hueA: 215,
    hueB: 28,
  },
  {
    num: '06',
    title: 'Развитие',
    text: 'Большинство наших клиентов — молодые люди, стремящиеся к новым знаниям, поэтому наши бухгалтеры не только выполняют все задачи по учёту, но и объясняют принципы работы компании и основы бухгалтерии.',
    icon: Lightning,
    hueA: 260,
    hueB: 20,
  },
]

export function TrustStrip() {
  const reduced = useReducedMotion()

  return (
    <section
      id="trust"
      className="relative isolate overflow-visible bg-aurora-dark noise-overlay text-white bleed-dark-up bleed-dark-down"
    >
      {/* ────────── Внутренний слой с overflow:hidden для блобов ────────── */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Soft drifting violet blob */}
        <div
          className="blob blob-soft"
          style={{ top: '15%', left: '5%', width: '500px', height: '500px' }}
          aria-hidden
        />
        {/* Coral blob — bottom right */}
        <div
          className="blob blob-coral"
          style={{ bottom: '10%', right: '5%', width: '400px', height: '400px' }}
          aria-hidden
        />
        {/* Pattern overlay — звёздная сетка */}
        <div className="absolute inset-0 pattern-dot-grid-dark opacity-50" aria-hidden />
      </div>

      {/* ────────── Контент ────────── */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-28 sm:py-36">
        {/* HEADER BLOCK */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-16 flex max-w-3xl flex-col items-center gap-6 text-center sm:mb-20"
        >
          <SectionEyebrow number="01" variant="dark" align="center">
            Цифры за 4 года работы
          </SectionEyebrow>
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] glow-text-violet sm:text-5xl md:text-6xl">
            <span>780 проектов,</span>
            <br />
            <span className="font-serif-accent italic text-brand-soft">доверие</span> фондов
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/55">
            Работаем с 2021 года. 1 000+ финансовых отчётов, 900+ технических, 74 патента.
          </p>
        </motion.div>

        {/* STAT GRID */}
        <div className="grid gap-8 sm:grid-cols-3 sm:gap-12">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
              className="relative flex flex-col gap-3"
            >
              <span className="font-display text-5xl font-extrabold leading-none tracking-[-0.04em] tabular-nums-display sm:text-6xl md:text-7xl lg:text-8xl bg-gradient-to-br from-white via-white to-brand-soft bg-clip-text text-transparent glow-text-violet">
                <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
              </span>
              <div className="font-display text-base font-semibold text-white sm:text-lg">
                {s.label}
              </div>
              <div className="max-w-xs text-sm leading-relaxed text-white/55">{s.caption}</div>
            </motion.div>
          ))}
        </div>

        {/* ────────── Экспертиза — горизонтальная карусель с wheel-to-x ────────── */}
        <ExpertiseCarousel reduced={!!reduced} />

        {/* ────────── Карта федеральных округов ────────── */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-24 sm:mt-28"
        >
          <div className="mb-10 max-w-3xl">
            <SectionEyebrow number="01c" variant="dark">
              География клиентов
            </SectionEyebrow>
            <h3 className="mt-4 font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.035em] glow-text-violet sm:text-4xl md:text-5xl">
              Работаем со стартапами{' '}
              <span className="font-serif-accent italic text-brand-soft">во всех 8</span>{' '}
              федеральных округах
            </h3>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/55">
              780 технологических компаний от Калининграда до Владивостока. Наведите курсор на округ — узнайте число клиентов и крупнейший город.
            </p>
          </div>

          <RussiaConstellation />
        </motion.div>
      </div>
    </section>
  )
}

// ===========================================================================
// ExpertiseCarousel — Embla-каруcель с неоном.
// ---------------------------------------------------------------------------
// • Embla = battle-tested карусель: drag, swipe, snap, доступность из коробки.
// • Стрелки и точки вызывают emblaApi.scrollPrev/Next/scrollTo — это просто
//   и гарантированно работает.
// • Wheel-on-hover: вертикальное колесо листает по карточкам (throttle 220ms).
// • Активная карточка получает неон-пульсацию (CSS keyframes).
// ===========================================================================
function ExpertiseCarousel({ reduced }: { reduced: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: 'trimSnaps',
    skipSnaps: false,
    dragFree: false,
  })

  const [activeIdx, setActiveIdx] = useState(0)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  // Debounce Embla state updates — prevents re-render spam on fast swipes
  const updateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      if (updateTimer.current) return // Drop if previous update pending
      updateTimer.current = setTimeout(() => {
        updateTimer.current = null
        setActiveIdx(emblaApi.selectedScrollSnap())
        setCanPrev(emblaApi.canScrollPrev())
        setCanNext(emblaApi.canScrollNext())
      }, 50) // Max 20 updates/sec despite Embla firing at ~60fps
    }
    emblaApi.on('select', onSelect).on('reInit', onSelect)
    onSelect()
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
      if (updateTimer.current) clearTimeout(updateTimer.current)
    }
  }, [emblaApi])

  // Wheel-on-hover: vertical wheel → next/prev карточка с throttle.
  // На границах не перехватываем — пусть страница скроллится дальше.
  useEffect(() => {
    if (!emblaApi || reduced) return
    const root = emblaApi.rootNode()
    let lastTs = 0
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      const forward = e.deltaY > 0
      if (forward && !emblaApi.canScrollNext()) return
      if (!forward && !emblaApi.canScrollPrev()) return
      e.preventDefault()
      const now = Date.now()
      if (now - lastTs < 220) return
      lastTs = now
      if (forward) emblaApi.scrollNext()
      else emblaApi.scrollPrev()
    }
    root.addEventListener('wheel', onWheel, { passive: false })
    return () => root.removeEventListener('wheel', onWheel)
  }, [emblaApi, reduced])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback(
    (idx: number) => emblaApi?.scrollTo(idx),
    [emblaApi],
  )

  return (
    <div className="relative mt-24 sm:mt-28">
      {/* Header */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 flex max-w-3xl flex-col gap-4 sm:mb-12"
      >
        <SectionEyebrow number="01b" variant="dark">
          Экспертиза
        </SectionEyebrow>
        <h3 className="font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.035em] glow-text-violet sm:text-4xl md:text-5xl">
          Шесть принципов{' '}
          <span className="font-serif-accent italic text-brand-soft">
            нашей работы
          </span>
        </h3>
        <p className="max-w-2xl text-base leading-relaxed text-white/55">
          Не маркетинговые слоганы — то, как мы реально работаем со стартапами
          и грантополучателями ФСИ.{' '}
          <span className="hidden font-mono text-[12px] uppercase tracking-[0.18em] text-brand-soft md:inline">
            наведите → колесо листает карточки
          </span>
        </p>
      </motion.div>

      {/* Embla viewport + arrows + fade-masks */}
      <div
        className="relative"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%), linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%), linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
          WebkitMaskComposite: 'source-in',
        }}
      >
        <div ref={emblaRef} className="overflow-hidden">
          <div className="-ml-5 flex sm:-ml-6">
            {pillars.map((p, i) => (
              <div
                key={p.num}
                className="min-w-0 shrink-0 grow-0 basis-[88%] pl-5 sm:basis-[400px] sm:pl-6"
              >
                <PillarCard
                  pillar={p}
                  index={i}
                  total={pillars.length}
                  isActive={activeIdx === i}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Стрелка влево — neon hover */}
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canPrev}
          aria-label="Предыдущий принцип"
          className={cn(
            'absolute left-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-brand-ink/85 text-white backdrop-blur-md transition-all md:flex',
            canPrev
              ? 'hover:scale-110 hover:border-brand-soft/70 hover:bg-brand-ink hover:shadow-[0_0_28px_rgba(167,139,250,0.55)]'
              : 'cursor-not-allowed opacity-25',
          )}
        >
          <CaretLeft weight="bold" className="h-4 w-4" />
        </button>

        {/* Стрелка вправо — neon hover */}
        <button
          type="button"
          onClick={scrollNext}
          disabled={!canNext}
          aria-label="Следующий принцип"
          className={cn(
            'absolute right-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-brand-ink/85 text-white backdrop-blur-md transition-all md:flex',
            canNext
              ? 'hover:scale-110 hover:border-brand-soft/70 hover:bg-brand-ink hover:shadow-[0_0_28px_rgba(167,139,250,0.55)]'
              : 'cursor-not-allowed opacity-25',
          )}
        >
          <CaretRight weight="bold" className="h-4 w-4" />
        </button>
      </div>

      {/* Точки-индикаторы */}
      <div className="mt-7 flex items-center justify-center gap-2.5">
        {pillars.map((p, i) => (
          <button
            key={p.num}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`К принципу ${i + 1}`}
            className={cn(
              'h-2 rounded-full transition-all duration-400',
              activeIdx === i
                ? 'w-10 bg-brand-accent shadow-[0_0_14px_rgba(251,146,60,0.65)]'
                : 'w-2 bg-white/20 hover:bg-white/40',
            )}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PillarCard — neon-карточка с pulse-glow на активном состоянии
// ---------------------------------------------------------------------------
function PillarCard({
  pillar,
  index,
  total,
  isActive,
}: {
  pillar: Pillar
  index: number
  total: number
  isActive: boolean
}) {
  const Icon = pillar.icon

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.06,
      }}
      className={cn(
        'group relative flex h-[440px] flex-col p-7 transition-all duration-500 sm:h-[460px]',
        isActive
          ? 'neon-active scale-100 opacity-100'
          : 'scale-[0.94] opacity-60 hover:opacity-85',
      )}
      style={{
        borderRadius: 20,
        border: isActive
          ? '1px solid color-mix(in srgb, var(--brand-soft) 35%, transparent)'
          : '1px solid color-mix(in srgb, var(--brand-soft) 8%, transparent)',
        background: isActive
          ? `radial-gradient(ellipse 100% 80% at 30% 10%, hsla(${pillar.hueA}, 75%, 55%, 0.14), transparent 65%), radial-gradient(ellipse 80% 60% at 75% 90%, hsla(${pillar.hueB}, 85%, 60%, 0.08), transparent 65%)`
          : `radial-gradient(ellipse 90% 70% at 30% 10%, hsla(${pillar.hueA}, 70%, 50%, 0.06), transparent 70%)`,
        boxShadow: isActive
          ? '0 0 0 1px color-mix(in srgb, var(--brand-primary) 30%, transparent), 0 8px 40px color-mix(in srgb, var(--brand-primary) 25%, transparent)'
          : 'none',
        transition: 'box-shadow 0.5s ease, border-color 0.5s ease',
      }}
    >
      {/* Контурная цифра — пульсирует только на активной */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-3 -top-4 select-none font-display text-[160px] font-black leading-none tracking-[-0.06em] tabular-nums-display text-transparent transition-all duration-500',
          isActive && 'neon-digit',
        )}
        style={{ WebkitTextStroke: '1.5px rgba(167,139,250,0.18)' }}
      >
        {pillar.num}
      </span>

      {/* CONTENT */}
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-3">
          {/* Icon — на активной добавляется neon-glow */}
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-500',
              isActive
                ? 'border-brand-soft/45 bg-brand-soft/15 text-brand-soft shadow-[0_0_20px_rgba(167,139,250,0.40)]'
                : 'border-white/10 bg-brand-soft/8 text-brand-soft/85',
            )}
          >
            <Icon weight="duotone" className="h-5 w-5" />
          </div>
          <span
            className={cn(
              'font-mono text-[10px] font-bold uppercase tracking-[0.22em] transition-colors duration-500',
              isActive ? 'text-brand-accent' : 'text-brand-soft/55',
            )}
          >
            {pillar.num} / {String(total).padStart(2, '0')}
          </span>
        </div>

        {/* Title — на активной добавляется text-shadow glow */}
        <h4
          className={cn(
            'font-display text-2xl font-extrabold tracking-tight transition-all duration-500 sm:text-[26px]',
            isActive
              ? 'text-white [text-shadow:0_0_24px_rgba(167,139,250,0.35)]'
              : 'text-white/85',
          )}
        >
          {pillar.title}
        </h4>

        {/* Text */}
        <p
          className={cn(
            'mt-3 text-[14px] leading-relaxed transition-colors duration-500 sm:text-[15px]',
            isActive ? 'text-white/80' : 'text-white/55',
          )}
        >
          {pillar.text}
        </p>

        {/* Pull-quote только на «Развитии» */}
        {pillar.num === '06' && (
          <blockquote className="mt-auto border-l-2 border-brand-accent pl-3.5 pt-4">
            <p className="font-serif-accent text-base italic leading-snug text-white/90">
              «Подкрепляем эффективность разработок комфортным сервисом»
            </p>
          </blockquote>
        )}
      </div>
    </motion.article>
  )
}

// ---------------------------------------------------------------------------
// MobilePillar — простая стопка для < lg экранов
// ---------------------------------------------------------------------------
function MobilePillar({ pillar, index }: { pillar: Pillar; index: number }) {
  const Icon = pillar.icon

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
      className="relative overflow-hidden rounded-3xl p-7"
      style={{
        backgroundImage: `radial-gradient(ellipse 80% 60% at 20% 0%, hsla(${pillar.hueA}, 70%, 55%, 0.18), transparent 60%)`,
      }}
    >
      <span
        aria-hidden
        className="absolute -right-4 -top-4 select-none font-display text-[140px] font-black leading-none tracking-[-0.06em] tabular-nums-display text-transparent"
        style={{ WebkitTextStroke: '1px rgba(255,255,255,0.10)' }}
      >
        {pillar.num}
      </span>
      <div className="relative">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-brand-soft/10 text-brand-soft">
          <Icon weight="duotone" className="h-5 w-5" />
        </div>
        <h4 className="font-display text-2xl font-extrabold tracking-tight text-white">
          {pillar.title}
        </h4>
        <p className="mt-3 text-[15px] leading-relaxed text-white/70">{pillar.text}</p>
      </div>
    </motion.article>
  )
}
