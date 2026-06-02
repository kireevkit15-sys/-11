'use client'

import { motion, useReducedMotion } from 'motion/react'
import {
  Rocket,
  Buildings,
  Lightning,
  Trophy,
  CheckCircle,
  ArrowRight,
  ArrowUpRight,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion/fade-in'
import { SectionEyebrow } from '@/components/sections/section-eyebrow'

// ---------------------------------------------------------------------------
// Types & data — состав работ дословно с сайта-референса (accounting-diva3d.ru,
// блок «Наши услуги»). Ничего не выдумываем.
// ---------------------------------------------------------------------------
type Service = {
  title: string
  price: string
  perUnit: string
  icon: PhosphorIcon
  items: string[]
}

const services: Service[] = [
  {
    title: 'Бухгалтерия для АУСН',
    price: '5 900',
    perUnit: '₽ / мес',
    icon: Lightning,
    items: [
      'Расчёт по страховым взносам',
      '6-НДФЛ',
      'Персонифицированные сведения',
      'Отчёт СЗВ-СТАЖ за 2023 год в составе ЕФС-1',
      'Отчёт 4-ФСС в составе ЕФС-1',
      'Отчёт СЗВ-ТД в составе ЕФС-1',
      'Подготовка документов и отчётов по военскому учёту',
      'Статистический отчёт в Росстат',
      'Отчёт об обработке персональных данных в РКН',
    ],
  },
  {
    title: 'Бухгалтерия для УСН',
    price: '7 900',
    perUnit: '₽ / мес',
    icon: Rocket,
    items: [
      'Декларация по УСН',
      'Бухгалтерская отчётность',
      'Расчёт по страховым взносам',
      '6-НДФЛ',
      'Персонифицированные сведения',
      'Отчёт СЗВ-СТАЖ за 2023 год в составе ЕФС-1',
      'Отчёт 4-ФСС в составе ЕФС-1',
      'Отчёт СЗВ-ТД в составе ЕФС-1',
      'Подготовка документов и отчётов по военскому учёту',
      'Статистический отчёт в Росстат',
      'Отчёт об обработке персональных данных в РКН',
    ],
  },
  {
    title: 'Бухгалтерия для ОСН',
    price: '8 900',
    perUnit: '₽ / мес',
    icon: Buildings,
    items: [
      'Бухгалтерская отчётность',
      'Декларация по НДС',
      'Декларация по налогу на прибыль',
      'Декларация по налогу на имущество',
      'Расчёт по страховым взносам',
      '6-НДФЛ',
      'Персонифицированные сведения',
      'Отчёт СЗВ-СТАЖ за 2023 год в составе ЕФС-1',
      'Отчёт 4-ФСС в составе ЕФС-1',
      'Отчёт СЗВ-ТД в составе ЕФС-1',
      'Подготовка документов и отчётов по военскому учёту',
      'Статистический отчёт в Росстат',
      'Отчёт об обработке персональных данных в РКН',
    ],
  },
]

const fsiItems: string[] = [
  'Подготовка договора с ФСИ',
  'Подготовка финансового отчёта',
  'Оформление технического отчёта',
  'Разработка бизнес-плана',
  'Заполнение отчёта о развитии стартапа',
  'Подготовка карты РИД',
  'Исправление всех замечаний кураторов',
]

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------
export function ServicesSection() {
  const reduced = !!useReducedMotion()

  return (
    <section
      id="services"
      className="relative isolate overflow-hidden bg-aurora-dark text-white noise-overlay"
    >
      {/* Тонкая точечная сетка */}
      <div
        className="pointer-events-none absolute inset-0 pattern-dot-grid-dark opacity-50"
        aria-hidden
      />

      {/* Soft violet blob top-left */}
      <div
        className="blob blob-soft"
        style={{
          top: '5%',
          left: '-5%',
          width: '600px',
          height: '600px',
          opacity: 0.35,
        }}
        aria-hidden
      />
      {/* Coral blob bottom-right */}
      <div
        className="blob blob-coral"
        style={{
          bottom: '5%',
          right: '-8%',
          width: '550px',
          height: '550px',
          opacity: 0.22,
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-32 sm:px-6 sm:py-40">
        {/* ────────── Header ────────── */}
        <FadeIn className="flex max-w-3xl flex-col gap-5">
          <SectionEyebrow variant="dark" number="02">
            Наши услуги
          </SectionEyebrow>

          <h2 className="font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl md:text-7xl">
            Бухгалтерия под систему
            <br />
            налогообложения —
            <br />
            <span className="font-serif-accent italic text-brand-soft">
              прозрачный
            </span>{' '}
            перечень работ
          </h2>

          <p className="max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">
            Состав отчётов и работ для каждой системы — как они есть. Точную
            стоимость рассчитаем под количество операций и сотрудников на
            30-минутной консультации.{' '}
            <span className="font-mono text-[13px] uppercase tracking-[0.18em] text-brand-soft">
              наведите на карточку — пролистайте детали
            </span>
          </p>
        </FadeIn>

        {/* ────────── Grid: 3 normal cards + 1 hero (FSI) ────────── */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12">
          {services.map((s, i) => (
            <NormalCard key={s.title} service={s} index={i} reduced={reduced} />
          ))}

          <FsiCard reduced={reduced} />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Normal card — accepts reduced motion as prop (avoids per-card hook call)
// ---------------------------------------------------------------------------
function NormalCard({ service, index, reduced }: { service: Service; index: number; reduced: boolean }) {
  const Icon = service.icon

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.08,
      }}
      className="group/card relative lg:col-span-4"
    >
      {/* Halo glow on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/0 via-brand-soft/0 to-brand-accent/0 opacity-0 blur-xl transition duration-500 group-hover/card:from-primary/40 group-hover/card:via-brand-soft/30 group-hover/card:to-brand-accent/20 group-hover/card:opacity-100"
      />

      <div className="relative flex flex-col rounded-3xl border border-white/[0.08] bg-white/[0.025] transition duration-300 group-hover/card:-translate-y-1 group-hover/card:border-brand-soft/40 group-hover/card:bg-white/[0.04] lg:h-[580px] lg:overflow-hidden">
        {/* Inner subtle gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] via-transparent to-transparent"
        />

        {/* ── HEADER ─────────────────────────────────── */}
        <div className="relative z-10 flex shrink-0 flex-col gap-3 px-5 pt-6 pb-4 sm:gap-5 sm:px-7 sm:pt-7 sm:pb-6">
          <div className="flex items-start justify-between gap-4">
            {/* Icon */}
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-brand-soft/10 text-brand-soft">
              <Icon weight="duotone" className="h-5 w-5" />
            </div>
            {/* Index */}
            <span className="font-mono text-[10px] font-medium tabular-nums-display tracking-[0.15em] text-white/40">
              {String(index + 1).padStart(2, '0')} / 04
            </span>
          </div>

          <h3 className="font-display text-2xl font-extrabold tracking-tight text-white">
            {service.title}
          </h3>

          {/* Price */}
          <div className="flex flex-col gap-1 border-t border-white/10 pt-3 sm:pt-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Стоимость
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xs text-white/55">от</span>
              <span className="font-display text-3xl font-extrabold tabular-nums-display tracking-[-0.03em] text-white sm:text-5xl">
                {service.price}
              </span>
              <span className="font-mono text-xs text-white/55 sm:text-sm">{service.perUnit}</span>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ─────────────────────── */}
        <div className="relative z-10 flex-1 lg:min-h-0">
          <div className="h-full px-5 pb-4 sm:px-7 sm:pb-6">
            <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">
              Перечень отчётов и работ
            </h4>
            <ul className="flex flex-col gap-2.5">
              {service.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[13px] leading-snug text-white/80"
                >
                  <CheckCircle
                    weight="duotone"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-soft"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── FOOTER CTA ────────────────────────────── */}
        <div className="relative z-10 shrink-0 border-t border-white/10 px-5 py-4 sm:px-7">
          <a
            href="#contact"
            className="group/link inline-flex items-center gap-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.15em] text-white transition hover:text-brand-soft"
          >
            Подробнее о тарифе
            <ArrowUpRight
              weight="duotone"
              className="h-3.5 w-3.5 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
            />
          </a>
        </div>
      </div>
    </motion.article>
  )
}

// ---------------------------------------------------------------------------
// FSI hero card — accepts reduced motion as prop
// ---------------------------------------------------------------------------
function FsiCard({ reduced }: { reduced: boolean }) {

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.32 }}
      className="group/card relative md:col-span-2 lg:col-span-12"
    >
      {/* Outer halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[36px] bg-gradient-to-br from-primary/35 via-brand-soft/25 to-brand-accent/25 opacity-70 blur-3xl transition duration-500 group-hover/card:opacity-100"
      />

      <div className="relative flex flex-col overflow-hidden rounded-3xl border border-brand-soft/25 bg-brand-ink shadow-2xl shadow-primary/30 transition duration-300 group-hover/card:-translate-y-1 group-hover/card:border-brand-soft/45">
        {/* Aurora overlay */}
        <div aria-hidden className="absolute inset-0 bg-aurora-dark opacity-65" />
        <div aria-hidden className="absolute inset-0 pattern-dot-grid-dark opacity-40" />
        {/* Coral fingerprint glow */}
        <div
          aria-hidden
          className="absolute hidden lg:block"
          style={{
            top: '10%',
            right: '32%',
            width: '420px',
            height: '420px',
            background:
              'radial-gradient(circle, rgba(251,146,60,0.35), rgba(251,146,60,0.10) 40%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="relative z-10 grid h-full grid-cols-1 gap-8 p-8 lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:p-10">
          {/* LEFT — title, price, CTA */}
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-start justify-between gap-4">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-brand-accent">
                наша специализация
              </span>
              <span className="font-mono text-[10px] font-medium tabular-nums-display tracking-[0.15em] text-white/40">
                04 / 04
              </span>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-brand-soft sm:h-12 sm:w-12">
              <Trophy weight="duotone" className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <h3 className="font-display text-2xl font-extrabold tracking-[-0.03em] text-white sm:text-3xl lg:text-4xl">
              Отчёты по{' '}
              <span className="font-serif-accent italic text-brand-soft">
                Студенческому
              </span>
              <br />
              стартапу и Старт 1
            </h3>

            {/* Price */}
            <div className="flex flex-col gap-1 border-t border-white/10 pt-4 sm:pt-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                Стоимость
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-sm text-white/50 sm:text-base">от</span>
                <span className="glow-text-violet font-display text-4xl font-extrabold tabular-nums-display tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                  35 000
                </span>
                <span className="font-mono text-sm text-white/50 sm:text-base">₽ / грант</span>
              </div>
            </div>

            <Button
              size="lg"
              className="group/btn h-12 w-full bg-brand-accent px-7 text-[15px] font-semibold text-brand-accent-foreground shadow-xl shadow-brand-accent/30 hover:bg-brand-accent/90 sm:w-auto lg:w-full"
            >
              Заказать сопровождение
              <ArrowRight
                weight="duotone"
                className="ml-1.5 h-4 w-4 transition-transform group-hover/btn:translate-x-1"
              />
            </Button>
          </div>

          {/* RIGHT — scrollable дословный перечень с референса */}
          <div className="relative border-t border-white/10 pt-4 sm:border-t-0 sm:pt-0">
            <div className="service-card-scroll h-full pr-1">
              <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">
                Перечень отчётов и работ
              </h4>
              <ul className="flex flex-col gap-2.5">
                {fsiItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[14px] leading-snug text-white/85"
                  >
                    <CheckCircle
                      weight="duotone"
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
