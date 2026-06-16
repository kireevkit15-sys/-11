'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CaretLeft, CaretRight, Quotes, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/motion/fade-in'
import { SectionEyebrow } from '@/components/sections/section-eyebrow'
import { getReviews, type Review } from '@/lib/cms'

// ─── Data ────────────────────────────────────────────────────────────────────

type Testimonial = {
  name: string
  vkUrl: string
  avatarUrl: string
  text: string
}

// Fallback — используется если CMS недоступна
const fallbackTestimonials: Testimonial[] = [
  {
    name: 'Владимир Кудзоев',
    vkUrl: 'https://vk.com/99vkudzoev',
    avatarUrl: 'https://vk.com/99vkudzoev',
    text: 'Хочу оставить отзыв по работе с организацией Дива. Особенно доволен консультацией бухгалтеров и менеджеров, ведением бухгалтерского и налогового учёта, а также помощью с отчётом и сопровождением в ФСИ. Отчёт с фондом полностью закрыт, было множество нюансов, которые мы быстро решали. Спасибо за эффективную работу!',
  },
  {
    name: 'Эльбрус Тулатов',
    vkUrl: 'https://vk.com/id188387297',
    avatarUrl: 'https://vk.com/id188387297',
    text: 'Хочу поделиться своим опытом работы с компанией Дива — я очень доволен их услугами. С первых дней работы мне было сложно разобраться в некоторых бухгалтерских нюансах, и тогда на помощь пришла Майя. Самый добрый, отзывчивый и надёжный бухгалтер. Без помощи Дивы мне было бы крайне тяжело. Всем рекомендую!',
  },
  {
    name: 'Артём Старов',
    vkUrl: 'https://vk.com/artemniceman',
    avatarUrl: 'https://vk.com/artemniceman',
    text: 'Удалось поработать с «Дивой» в рамках студенческого стартапа — не ожидал такой поддержки. Речь идёт не только про бухгалтерскую поддержку, но и о помощи с сопроводительной документацией. Сделали всё «под ключ». В момент закрытия гранта была паника, но сотрудники «Дива» успокоили и быстро помогли решить проблему.',
  },
  {
    name: 'Наиля Рахимова',
    vkUrl: 'https://vk.com/rakhimova.nailya',
    avatarUrl: 'https://vk.com/rakhimova.nailya',
    text: 'В Диве вам ответят молниеносно — и менеджеры, и бухгалтеры. Майя — сотрудник на вес золота. Отвечала ВСЕГДА, будь то утро или поздний вечер. Я находилась заграницей, у меня сломалась ЭЦП, а восстановить дистанционно не получалось. Майя подсказала как договориться с Фондом и сдать отчётность в бумажном виде. Разве кто-то сейчас будет ТАК помогать?',
  },
  {
    name: 'Елена Шувалова',
    vkUrl: 'https://vk.com/id144336949',
    avatarUrl: 'https://vk.com/id144336949',
    text: 'Работаю с компанией Дива с момента получения гранта — более года. Могу оставить только хорошие слова обо всех участниках команды. Благодарю за чёткое и своевременное ведение документооборота, отчётности, сдачи всех требуемых документов. Большая благодарность бухгалтеру Марии, специалисту Диане и руководителю Павлу Бантьеву.',
  },
  {
    name: 'Денис Петрухин',
    vkUrl: 'https://vk.com/id604671455',
    avatarUrl: 'https://vk.com/id604671455',
    text: 'Хочу отметить высокий профессионализм менеджера Алины и бухгалтера Майи, которые мгновенно реагировали на запросы. Вся отчётность, подготовка документов и корректировки выполнялись грамотно без задержек. Условия сотрудничества были прозрачны, тарифы — понятными. Рекомендую тем, кто ищет надёжного партнёра в части бухгалтерии стартапов.',
  },
  {
    name: 'Алиса Давлетбаева',
    vkUrl: 'https://vk.com/alisa.davletbaeva',
    avatarUrl: 'https://vk.com/alisa.davletbaeva',
    text: 'За всё время сотрудничества я чувствовала спокойствие и уверенность в том, что все вопросы закрываются вовремя. Майя не просто отвечала на вопросы, а подробно объясняла все нюансы, заранее предупреждала о важных моментах. Бухгалтерия — это не формальное «ведение отчётности», а реальная поддержка и партнёрство. Именно такой опыт я получила здесь.',
  },
  {
    name: 'Анастасия Гисматуллина',
    vkUrl: 'https://vk.com/id147303053',
    avatarUrl: 'https://vk.com/id147303053',
    text: 'Я начала сотрудничество после победы в студенческом стартапе и с самого начала осталась очень довольна. Специалисты компании всегда были на связи, оперативно помогали решать вопросы и подробно объясняли все нюансы. За всё время сотрудничества у меня не возникло ни единого нарекания — только положительный опыт.',
  },
]

// ─── Конвертация CMS Review → Testimonial ────────────────────────────────────

// Strapi v5: данные приходят напрямую без .attributes
function reviewToTestimonial(review: Review): Testimonial {
  return {
    name: review.authorName,
    vkUrl: review.sourceUrl || 'https://vk.com',
    avatarUrl: 'https://vk.com/',
    text: review.text,
  }
}

// ─── Avatar — инициалы как fallback ──────────────────────────────────────────

function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  // Уникальный цвет по имени
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: `linear-gradient(135deg, hsl(${hue},65%,45%), hsl(${(hue + 40) % 360},70%,55%))`,
        boxShadow: `0 0 0 2px rgba(255,255,255,0.12), 0 0 20px hsl(${hue},65%,45%,0.4)`,
      }}
    >
      {initials}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function TestimonialCard({
  t,
  isActive,
  onReadFull,
}: {
  t: Testimonial
  isActive: boolean
  onReadFull: () => void
}) {
  const reduced = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const spotRef = useRef<HTMLDivElement>(null)
  const borderRef = useRef<HTMLDivElement>(null)
  const angleRef = useRef(0)
  const rafRef = useRef<number>(0)

  // Бегущий огонь по рамке
  useEffect(() => {
    if (reduced) return
    const el = borderRef.current
    if (!el) return
    const tick = () => {
      angleRef.current = (angleRef.current + (isActive ? 1.5 : 0.4)) % 360
      const a = angleRef.current
      el.style.background = isActive
        ? `conic-gradient(from ${a}deg, #7C3AED 0%, #A78BFA 15%, #FB923C 28%, #7C3AED 40%, #0F0B1E 48%, #0F0B1E 78%, #7C3AED 100%)`
        : `conic-gradient(from ${a}deg, rgba(124,58,237,0.5) 0%, rgba(167,139,250,0.25) 18%, rgba(15,11,30,0.95) 35%, rgba(15,11,30,0.95) 72%, rgba(124,58,237,0.5) 100%)`
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isActive, reduced])

  // Spotlight
  const onMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current || !spotRef.current || reduced) return
    const r = cardRef.current.getBoundingClientRect()
    spotRef.current.style.left = `${e.clientX - r.left}px`
    spotRef.current.style.top = `${e.clientY - r.top}px`
    spotRef.current.style.opacity = '1'
  }, [reduced])

  const onLeave = useCallback(() => {
    if (spotRef.current) spotRef.current.style.opacity = '0'
  }, [])

  return (
    <div className="h-full rounded-2xl">
      {/* Бегущая рамка */}
      <div ref={borderRef} className="h-full overflow-hidden rounded-2xl p-[2px]">
        <div
          ref={cardRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className={cn(
            'relative flex h-full flex-col overflow-hidden rounded-[14px] p-5 transition-all duration-500 sm:p-6',
            isActive
              ? 'bg-[rgba(124,58,237,0.12)]'
              : 'bg-[rgba(15,11,30,0.85)]',
          )}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[14px]"
            animate={reduced ? undefined : { opacity: isActive ? [0.45, 0.75, 0.45] : [0.12, 0.22, 0.12] }}
            transition={{ duration: isActive ? 1.8 : 3.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: isActive
                ? 'radial-gradient(circle at 50% 0%, rgba(167,139,250,0.34), transparent 42%), radial-gradient(circle at 100% 100%, rgba(251,146,60,0.22), transparent 38%)'
                : 'radial-gradient(circle at 50% 0%, rgba(167,139,250,0.16), transparent 44%)',
            }}
          />

          {/* Spotlight */}
          <div
            ref={spotRef}
            aria-hidden
            className="pointer-events-none absolute z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          />

          {/* Top rim */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-8 right-8 top-0 z-10 h-px transition-all duration-500"
            style={{
              background: isActive
                ? 'linear-gradient(90deg, transparent, rgba(167,139,250,1) 50%, transparent)'
                : 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4) 50%, transparent)',
            }}
          />

          {/* Caustic wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, transparent 100%)' }}
          />

          {/* Quote icon */}
          <div className="relative z-10 mb-4">
            <Quotes
              weight="fill"
              className={cn(
                'h-8 w-8 transition-colors duration-500',
                isActive ? 'text-brand-accent' : 'text-white/20',
              )}
            />
          </div>

          {/* Text */}
          <p className={cn(
            'relative z-10 min-h-0 flex-1 overflow-hidden text-sm leading-relaxed transition-colors duration-500 [mask-image:linear-gradient(to_bottom,#000_82%,transparent_100%)]',
            isActive ? 'text-white/90' : 'text-white/55',
          )}>
            {t.text}
          </p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onReadFull() }}
            className="relative z-10 mt-4 inline-flex min-h-10 items-center self-start rounded-full border border-white/10 bg-white/[0.04] px-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-brand-soft transition hover:border-brand-soft/40 hover:bg-brand-soft/10"
          >
            Читать полностью
          </button>

          {/* Divider */}
          <div
            className="relative z-10 my-5 h-px transition-all duration-500"
            style={{
              background: isActive
                ? 'linear-gradient(90deg, rgba(124,58,237,0.6), rgba(251,146,60,0.4), transparent)'
                : 'rgba(255,255,255,0.07)',
            }}
          />

          {/* Author */}
          <div className="relative z-10 flex items-center gap-3">
            <Avatar name={t.name} size={40} />
            <div className="min-w-0">
              <p className={cn(
                'font-display text-sm font-bold leading-tight transition-colors duration-500',
                isActive ? 'text-white' : 'text-white/70',
              )}>
                {t.name}
              </p>
              <a
                href={t.vkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35 transition hover:text-brand-soft"
              >
                ВКонтакте →
              </a>
            </div>

            {/* Stars */}
            <div className="ml-auto flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} viewBox="0 0 12 12" className={cn('h-3 w-3 transition-colors duration-500', isActive ? 'text-brand-accent' : 'text-white/20')} fill="currentColor">
                  <path d="M6 0l1.5 4H12L8.5 6.5 10 11 6 8.5 2 11l1.5-4.5L0 4h4.5z" />
                </svg>
              ))}
            </div>
          </div>

          {/* Progress line */}
          <motion.div
            className="relative z-10 mt-4 h-[1.5px] rounded-full"
            style={{ background: 'linear-gradient(90deg, #7C3AED, #FB923C)' }}
            animate={{ width: isActive ? '100%' : '0%' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function TestimonialsSection() {
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const [selected, setSelected] = useState<Testimonial | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const trackRef = useRef<HTMLDivElement>(null)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scrollRaf = useRef<number | null>(null)

  // Загрузка данных из CMS
  useEffect(() => {
    getReviews(8)
      .then(reviews => {
        if (reviews.length > 0) {
          setTestimonials(reviews.map(reviewToTestimonial))
        } else {
          setTestimonials(fallbackTestimonials)
        }
      })
      .catch(() => {
        setTestimonials(fallbackTestimonials)
      })
  }, [])

  const GAP = 20

  // Responsive card width: 380px on desktop, full-width on mobile
  const getCardWidth = () => {
    if (typeof window === 'undefined') return 380
    return Math.min(380, window.innerWidth - 32)
  }

  const scrollTo = useCallback((idx: number) => {
    setActive(idx)
    if (!trackRef.current) return
    const cardWidth = getCardWidth()
    const offset = idx * (cardWidth + GAP)
    trackRef.current.scrollTo({ left: offset, behavior: 'smooth' })
  }, [])

  const prev = useCallback(() => scrollTo(Math.max(0, active - 1)), [active, scrollTo])
  const next = useCallback(() => scrollTo(Math.min(testimonials.length - 1, active + 1)), [active, scrollTo])

  // Автопрокрутка
  useEffect(() => {
    if (reduced) return
    if (testimonials.length === 0) return
    autoRef.current = setInterval(() => {
      setActive(a => {
        const next = (a + 1) % testimonials.length
        if (trackRef.current) {
          const cardWidth = getCardWidth()
          trackRef.current.scrollTo({ left: next * (cardWidth + GAP), behavior: 'smooth' })
        }
        return next
      })
    }, 5000)
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [reduced, testimonials.length])

  const pauseAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current)
  }, [])

  const syncActiveFromScroll = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const cardWidth = getCardWidth()
    const idx = Math.round(el.scrollLeft / (cardWidth + GAP))
    const clamped = Math.max(0, Math.min(testimonials.length - 1, idx))
    setActive(prev => (prev === clamped ? prev : clamped))
  }, [testimonials.length])

  const onTrackScroll = useCallback(() => {
    pauseAuto()
    if (scrollRaf.current !== null) cancelAnimationFrame(scrollRaf.current)
    scrollRaf.current = requestAnimationFrame(syncActiveFromScroll)
  }, [pauseAuto, syncActiveFromScroll])

  useEffect(() => () => {
    if (scrollRaf.current !== null) cancelAnimationFrame(scrollRaf.current)
  }, [])

  // Не рендерим секцию пока данные грузятся
  if (testimonials.length === 0) {
    return null
  }

  return (
    <>
      <section id="reviews" className="relative isolate overflow-hidden bg-aurora-dark noise-overlay text-white">
      {/* Blobs */}
      <div className="blob blob-soft pointer-events-none absolute" style={{ top: '10%', left: '-5%', width: 500, height: 500, opacity: 0.3 }} aria-hidden />
      <div className="blob blob-coral pointer-events-none absolute" style={{ bottom: '5%', right: '-5%', width: 420, height: 420, opacity: 0.2 }} aria-hidden />
      <div className="pointer-events-none absolute inset-0 pattern-dot-grid-dark opacity-40" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
        {/* Header */}
        <FadeIn className="mb-14 flex flex-col gap-5 sm:mb-16">
          <SectionEyebrow number="04b" variant="dark">Отзывы клиентов</SectionEyebrow>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] glow-text-violet sm:text-5xl md:text-6xl">
              Говорят те,{' '}
              <span className="font-serif-accent italic text-brand-soft">кто уже работал</span>
            </h2>
            {/* Стрелки */}
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => { pauseAuto(); prev() }}
                disabled={active === 0}
                aria-label="Предыдущий отзыв"
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border transition-all',
                  active === 0
                    ? 'cursor-not-allowed border-white/10 text-white/20'
                    : 'border-white/20 text-white hover:border-brand-soft/60 hover:shadow-[0_0_20px_rgba(167,139,250,0.4)]',
                )}
              >
                <CaretLeft weight="bold" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => { pauseAuto(); next() }}
                disabled={active === testimonials.length - 1}
                aria-label="Следующий отзыв"
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border transition-all',
                  active === testimonials.length - 1
                    ? 'cursor-not-allowed border-white/10 text-white/20'
                    : 'border-white/20 text-white hover:border-brand-soft/60 hover:shadow-[0_0_20px_rgba(167,139,250,0.4)]',
                )}
              >
                <CaretRight weight="bold" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </FadeIn>

        {/* Карусель */}
        <div
          ref={trackRef}
          onMouseEnter={pauseAuto}
          onScroll={onTrackScroll}
          className="scrollbar-hide -mx-4 flex gap-5 overflow-x-auto px-4 sm:-mx-6 sm:px-6"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {testimonials.map((t, i) => (
            <div
              key={t.name + i}
              className="h-[430px] sm:h-[410px]"
              style={{ width: 'min(380px, calc(100vw - 32px))', minWidth: 'min(380px, calc(100vw - 32px))', scrollSnapAlign: 'start' }}
              onClick={() => { pauseAuto(); scrollTo(i) }}
            >
              <TestimonialCard t={t} isActive={active === i} onReadFull={() => { pauseAuto(); setSelected(t) }} />
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { pauseAuto(); scrollTo(i) }}
              aria-label={`Отзыв ${i + 1}`}
              className={cn(
                'h-2 rounded-full transition-all duration-400',
                active === i
                  ? 'w-8 bg-brand-accent shadow-[0_0_12px_rgba(251,146,60,0.6)]'
                  : 'w-2 bg-white/20 hover:bg-white/40',
              )}
            />
          ))}
        </div>

        {/* Ссылка на все отзывы */}
        <FadeIn delay={0.2} className="mt-10 flex justify-center">
          <a
            href="https://vk.com/topic-145844445_50993255"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-white/40 transition hover:text-brand-soft"
          >
            Все отзывы во ВКонтакте
            <CaretRight weight="bold" className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </a>
        </FadeIn>
      </div>
      </section>
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[220] flex items-end justify-center bg-black/70 p-3 text-white sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[82dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-brand-soft/25 bg-brand-ink p-5 shadow-2xl shadow-primary/40 sm:p-7"
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Закрыть отзыв"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:text-white"
              >
                <X weight="bold" className="h-4 w-4" />
              </button>
              <Quotes weight="fill" className="h-9 w-9 text-brand-accent" />
              <p className="mt-5 text-base leading-relaxed text-white/82 sm:text-lg">
                {selected.text}
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                <Avatar name={selected.name} size={44} />
                <div>
                  <p className="font-display text-base font-bold text-white">{selected.name}</p>
                  <a href={selected.vkUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-soft">
                    отзыв во ВКонтакте →
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
