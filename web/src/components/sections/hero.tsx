'use client'

import { Fragment, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { HeroFigure } from '@/components/motion/hero-figure'
import { ConsultModal } from '@/components/sections/consult-modal'
import { getHeroConfig } from '@/lib/cms'

type HeroData = {
  headline: string
  subheadline: string
  ctaText: string
  badges: string[]
  statNumber: string
  statLabel: string
}

const FALLBACK_HERO: HeroData = {
  headline: 'Завязли в отчётах?\nТогда *кто строит*\nкомпанию?',
  subheadline:
    'Возьмём бухгалтерию и отчётность по грантам ФСИ. Бесплатная консультация — 30 минут с экспертом. Без обязательств.',
  ctaText: 'Записаться на консультацию',
  badges: ['30 минут', 'без обязательств', 'ФСИ и налоги'],
  statNumber: '94%',
  statLabel: 'остаются',
}

/** Рендер заголовка: переносы строк + *слово* как акцент. */
function renderHeadline(text: string) {
  const lines = text.split('\n')
  return lines.map((line, li) => {
    const parts = line.split(/(\*[^*]+\*)/g).filter(Boolean)
    return (
      <Fragment key={li}>
        {parts.map((part, pi) =>
          part.startsWith('*') && part.endsWith('*') ? (
            <span
              key={pi}
              className="font-serif-accent italic text-brand-soft"
              style={{
                textShadow:
                  '0 0 30px rgba(167, 139, 250, 0.55), 0 0 60px rgba(124, 58, 237, 0.35)',
              }}
            >
              {part.slice(1, -1)}
            </span>
          ) : (
            <Fragment key={pi}>{part}</Fragment>
          ),
        )}
        {li < lines.length - 1 && <br />}
      </Fragment>
    )
  })
}

export function HeroSection() {
  const reduced = useReducedMotion()
  const ease = [0.22, 1, 0.36, 1] as const
  const [modalOpen, setModalOpen] = useState(false)
  const [hero, setHero] = useState<HeroData>(FALLBACK_HERO)

  useEffect(() => {
    getHeroConfig()
      .then((cfg) => {
        if (cfg) {
          setHero({
            headline: cfg.headline || FALLBACK_HERO.headline,
            subheadline: cfg.subheadline || FALLBACK_HERO.subheadline,
            ctaText: cfg.ctaText || FALLBACK_HERO.ctaText,
            badges: Array.isArray(cfg.badges) && cfg.badges.length ? cfg.badges : FALLBACK_HERO.badges,
            statNumber: cfg.statNumber || FALLBACK_HERO.statNumber,
            statLabel: cfg.statLabel || FALLBACK_HERO.statLabel,
          })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <section className="relative isolate -mt-[80px] flex min-h-[100svh] items-center overflow-hidden bg-aurora-dark noise-overlay sm:-mt-[88px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[46%] justify-center sm:hidden"
      >
        <div className="relative w-[min(116vw,520px)] translate-y-[18%] opacity-70 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.78)_58%,transparent_100%)]">
          <HeroFigure />
        </div>
      </div>

      {/* ───── Фигурка как backdrop: приподнята вверх под шапку, слегка растянута ───── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 hidden justify-center sm:flex"
        style={{ height: '95%' }}
      >
        <div
          className="relative w-[min(112vw,1280px)] sm:w-[min(102vw,1380px)] lg:w-[min(94vw,1500px)]"
          style={{ transform: 'translateY(-16%) scaleX(1.08)' }}
        >
          <HeroFigure />
        </div>
      </div>

      {/* ───── Тёмный scrim под текстом — добавляет читаемости поверх ярких частей фигурки ───── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 60% at 50% 55%, rgba(15, 11, 30, 0.55) 0%, rgba(15, 11, 30, 0.30) 35%, transparent 75%)',
        }}
      />

      {/* ───── Контент ───── */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 pb-[42vh] pt-28 text-center sm:gap-7 sm:px-6 sm:pb-24 sm:pt-36">
        <motion.span
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="glass-card-dark inline-flex items-center gap-2 rounded-full border-brand-soft/30 px-3.5 py-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-soft shadow-[0_0_8px_rgba(167,139,250,0.7)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-soft">
            Бухгалтерия · ФСИ
          </span>
        </motion.span>

        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.05 }}
          className="font-display text-[34px] font-extrabold leading-[0.98] tracking-[-0.045em] text-white sm:text-[60px] md:text-[72px] lg:text-[80px]"
          style={{
            textShadow:
              '0 2px 24px rgba(15, 11, 30, 0.65), 0 0 40px rgba(15, 11, 30, 0.4)',
          }}
        >
          {renderHeadline(hero.headline)}
        </motion.h1>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
          className="glass-card-dark max-w-2xl rounded-2xl px-4 py-3 text-base leading-relaxed text-white/85 sm:px-5 sm:text-xl"
        >
          {hero.subheadline}
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.25 }}
          className="mt-1 flex w-full flex-col items-center gap-3 sm:mt-2 sm:w-auto sm:flex-row sm:justify-center sm:gap-6"
        >
          <Button
            size="lg"
            onClick={() => setModalOpen(true)}
            className="h-12 w-full max-w-[320px] bg-primary px-7 text-[15px] font-semibold shadow-lg shadow-primary/40 transition hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/55 sm:w-auto"
          >
            {hero.ctaText}
          </Button>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {hero.badges.map((item) => (
            <span key={item} className="glass-card-dark rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {item}
            </span>
          ))}
          <span className="glass-card-dark flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/70">
            <span className="font-mono font-semibold text-brand-soft">{hero.statNumber}</span>
            {hero.statLabel}
          </span>
        </motion.div>
      </div>

      <AnimatePresence>
        {modalOpen && <ConsultModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </section>
  )
}
