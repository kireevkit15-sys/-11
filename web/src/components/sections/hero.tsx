'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { HeroFigure } from '@/components/motion/hero-figure'
import { ConsultModal } from '@/components/sections/consult-modal'

export function HeroSection() {
  const reduced = useReducedMotion()
  const ease = [0.22, 1, 0.36, 1] as const
  const springEase = [0.16, 1, 0.3, 1] as const
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section className="relative isolate -mt-[80px] flex min-h-[100svh] items-center overflow-hidden bg-aurora-dark noise-overlay sm:-mt-[88px]">
      {/* ───── Фигурка как backdrop: приподнята вверх под шапку, слегка растянута ───── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
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
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 pt-24 pb-16 text-center sm:gap-7 sm:px-6 sm:pt-36 sm:pb-24">
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
          className="font-display text-[32px] font-extrabold leading-[1.02] tracking-[-0.04em] text-white sm:text-[60px] md:text-[72px] lg:text-[80px]"
          style={{
            textShadow:
              '0 2px 24px rgba(15, 11, 30, 0.65), 0 0 40px rgba(15, 11, 30, 0.4)',
          }}
        >
          Завязли в отчётах?
          <br />
          Тогда{' '}
          <span
            className="font-serif-accent italic text-brand-soft"
            style={{
              textShadow:
                '0 0 30px rgba(167, 139, 250, 0.55), 0 0 60px rgba(124, 58, 237, 0.35)',
            }}
          >
            кто строит
          </span>
          <br />
          компанию?
        </motion.h1>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
          className="glass-card-dark max-w-2xl rounded-2xl px-5 py-3 text-lg leading-relaxed text-white/85 sm:text-xl"
        >
          Возьмём бухгалтерию и отчётность по грантам ФСИ. Бесплатная консультация — 30 минут с экспертом. Без обязательств.
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.25 }}
          className="mt-2 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-6"
        >
          <Button
            size="lg"
            onClick={() => setModalOpen(true)}
            className="h-12 bg-primary px-7 text-[15px] font-semibold shadow-lg shadow-primary/40 transition hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/55"
          >
            Записаться на консультацию
          </Button>
        </motion.div>

        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.35 }}
          className="glass-card-dark flex items-center gap-2 rounded-full px-3 py-1 text-xs text-white/70"
        >
          <span className="font-mono font-semibold text-brand-soft">94%</span>
          клиентов остаются после консультации
        </motion.p>
      </div>

      <AnimatePresence>
        {modalOpen && <ConsultModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </section>
  )
}
