'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  PaperPlaneTilt,
  ChatCircleDots,
  YoutubeLogo,
  TelegramLogo,
  EnvelopeSimple,
  PhoneCall,
  MapPin,
  ShieldCheck,
  ArrowRight,
} from '@phosphor-icons/react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import type { FormEvent, ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FadeIn } from '@/components/motion/fade-in'
import { SectionEyebrow } from '@/components/sections/section-eyebrow'
import { ConsultModal } from '@/components/sections/consult-modal'

type FooterLink = { label: string; href: string }

const servicesLinks: FooterLink[] = [
  { label: 'УСН', href: '#services' },
  { label: 'ОСН', href: '#services' },
  { label: 'АУСН / ПСН', href: '#services' },
  { label: 'Отчётность ФСИ', href: '#services' },
  { label: 'Регистрация ООО', href: '#services' },
]

const companyLinks: FooterLink[] = [
  { label: 'О нас', href: '#about' },
  { label: 'Команда', href: '#team' },
  { label: 'Кейсы', href: '#cases' },
  { label: 'Блог', href: '#' },
  { label: 'Контакты', href: '#contacts' },
]

const docsLinks: FooterLink[] = [
  { label: 'Политика конфиденциальности', href: '#privacy' },
  { label: 'Согласие на обработку ПДн', href: '#consent' },
  { label: 'Публичная оферта', href: '#offer' },
]

const socials: { name: string; href: string; Icon: PhosphorIcon }[] = [
  { name: 'ВКонтакте', href: 'https://vk.com/ac_diva', Icon: ChatCircleDots },
  { name: 'Telegram', href: 'https://t.me/diva_accounting', Icon: TelegramLogo },
  { name: 'YouTube', href: 'https://youtube.com/channel/UCLDax7nGHf8K1AiP23Z00sA', Icon: YoutubeLogo },
]

export function Footer() {
  const [modalOpen, setModalOpen] = useState(false)
  const [checklistEmail, setChecklistEmail] = useState('')
  const [checklistSubmitting, setChecklistSubmitting] = useState(false)
  const [checklistSent, setChecklistSent] = useState(false)
  const [checklistError, setChecklistError] = useState('')

  const handleChecklistSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = checklistEmail.trim()
    if (!email || checklistSubmitting) return

    setChecklistSubmitting(true)
    setChecklistError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Получатель чек-листа',
          contact: email,
          source: 'footer_checklist',
          page: window.location.pathname,
          utm: {
            lead_type: 'guide_checklist',
            guide: 'fsi_checklist_deadlines_2026',
          },
        }),
      })

      if (!res.ok) throw new Error('checklist-submit-failed')
      setChecklistSent(true)
    } catch {
      setChecklistError('Не удалось отправить email. Попробуйте ещё раз или напишите нам в Telegram.')
    } finally {
      setChecklistSubmitting(false)
    }
  }

  return (
    <>
    <footer>
      {/* ───── ZONE 1: большой CTA + newsletter ───── */}
      <section className="relative isolate overflow-hidden bg-aurora-dark py-28 text-white noise-overlay bleed-dark-up sm:py-36">
        {/* Декоративные слои: блоб-аурора + рука робота, тянущаяся к CTA */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Soft violet blob — за заголовком слева */}
          <div
            className="blob blob-soft"
            style={{
              top: '-10%',
              left: '-5%',
              width: '500px',
              height: '500px',
              opacity: 0.35,
            }}
          />

          {/* ── Рука робота: тянется указательным пальцем к "Записаться сейчас" ── */}
          <div
            className="footer-robot-hand absolute block opacity-25 md:opacity-100"
          >
            <Image
              src="/cta/robot-hand.webp"
              alt=""
              fill
              sizes="(min-width: 1280px) 940px, (min-width: 1024px) 62vw, 72vw"
              quality={92}
              className="select-none object-cover"
              style={{
                objectPosition: '60% 24%',
                mixBlendMode: 'screen',
                opacity: 0.95,
                WebkitMaskImage:
                  'radial-gradient(ellipse 60% 70% at 58% 32%, rgba(0,0,0,1) 22%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.3) 75%, transparent 95%), linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0.4) 70%, transparent 92%)',
                maskImage:
                  'radial-gradient(ellipse 60% 70% at 58% 32%, rgba(0,0,0,1) 22%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.3) 75%, transparent 95%), linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0.4) 70%, transparent 92%)',
                WebkitMaskComposite: 'source-in',
                maskComposite: 'intersect',
              }}
              priority={false}
            />
          </div>

          {/* Тёплое коралловое свечение у кончиков пальцев — усиливает «тянется к CTA» */}
          <div
            className="absolute hidden md:block"
            style={{
              top: '34%',
              right: '44%',
              width: '420px',
              height: '420px',
              background:
                'radial-gradient(circle, rgba(251,146,60,0.55), rgba(251,146,60,0.20) 35%, transparent 65%)',
              filter: 'blur(54px)',
              mixBlendMode: 'screen',
            }}
          />

          {/* Coral блоб снизу-справа — поддерживает тёплый тон руки */}
          <div
            className="blob blob-coral"
            style={{
              bottom: '-12%',
              right: '-6%',
              width: '480px',
              height: '480px',
              opacity: 0.28,
            }}
          />

          {/* Левый градиент-затемнитель: гарантирует читаемость заголовка поверх руки */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-brand-ink via-brand-ink/55 to-transparent md:block" />

          {/* Точечная сетка — атмосферная фактура поверх всего */}
          <div className="absolute inset-0 pattern-dot-grid-dark opacity-40" />
        </div>

        <div className="relative mx-auto grid max-w-5xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          {/* LEFT — большая CTA */}
          <FadeIn>
            <SectionEyebrow variant="dark">Готовы делегировать?</SectionEyebrow>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] glow-text-violet sm:text-5xl md:text-6xl">
              Бесплатная консультация —
              <br />
              <span className="font-serif-accent italic text-brand-soft">30 минут</span> с экспертом
              по ФСИ
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              Расскажем о ваших дедлайнах ФСИ, оценим оптимизацию налогов и ответим на ваши
              вопросы. Без обязательств.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 lg:ml-[28%]">
              <Button
                size="lg"
                onClick={() => setModalOpen(true)}
                className="group h-13 bg-white px-8 font-semibold text-brand-ink shadow-2xl shadow-black/30 hover:bg-white/90"
              >
                Записаться сейчас
                <ArrowRight weight="duotone" className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <a
                href="tel:+79966366971"
                className="font-mono text-sm font-semibold text-white/80 transition hover:text-white"
              >
                или +7 996 636-69-71
              </a>
            </div>
          </FadeIn>

          {/* RIGHT — newsletter + trust marks */}
          <FadeIn delay={0.15}>
            <div id="lead-magnet" className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-[28px] border border-brand-soft/20 bg-gradient-to-br from-brand-soft/25 via-white/5 to-brand-accent/20 p-3 opacity-80 rotate-6">
                <div className="h-full rounded-2xl border border-white/10 bg-brand-ink/70 p-3 shadow-2xl shadow-primary/30">
                  <div className="h-1.5 w-12 rounded-full bg-brand-accent/80" />
                  <div className="mt-3 space-y-1.5">
                    <div className="h-1 w-full rounded-full bg-white/30" />
                    <div className="h-1 w-4/5 rounded-full bg-white/20" />
                    <div className="h-1 w-3/5 rounded-full bg-brand-soft/35" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-1">
                    {Array.from({ length: 6 }).map((_, i) => <span key={i} className="h-3 rounded bg-white/10" />)}
                  </div>
                </div>
              </div>
              <SectionEyebrow variant="dark">Подписка</SectionEyebrow>
              <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-white">
                Чек-лист грантополучателя ФСИ + календарь дедлайнов 2026
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Получите бесплатно на email. Без спама — только пользу.
              </p>
              <form
                className="mt-5 flex flex-col gap-3"
                onSubmit={handleChecklistSubmit}
              >
                <Input
                  type="email"
                  required
                  value={checklistEmail}
                  onChange={(e) => {
                    setChecklistEmail(e.target.value)
                    setChecklistSent(false)
                    setChecklistError('')
                  }}
                  placeholder="email@company.com"
                  aria-label="Ваш email"
                  className="h-11 border-white/15 bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:border-brand-soft"
                />
                <Button
                  type="submit"
                  disabled={checklistSubmitting}
                  aria-busy={checklistSubmitting}
                  className="group h-11 bg-primary font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
                >
                  {checklistSubmitting ? 'Отправляем...' : checklistSent ? 'Заявка принята' : 'Получить чек-лист'}
                  <PaperPlaneTilt weight="duotone" className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
                {checklistSent && (
                  <p className="rounded-xl border border-brand-soft/25 bg-brand-soft/10 px-3 py-2 text-xs leading-relaxed text-brand-soft" role="status">
                    Email принят. Мы отправим чек-лист и увидим заявку в Telegram-боте.
                  </p>
                )}
                {checklistError && (
                  <p className="rounded-xl border border-brand-accent/25 bg-brand-accent/10 px-3 py-2 text-xs leading-relaxed text-brand-accent" role="alert">
                    {checklistError}
                  </p>
                )}
              </form>
            </div>

            {/* Trust marks под формой */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-white/55">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
                <ShieldCheck weight="duotone" className="h-3.5 w-3.5" /> 152-ФЗ
              </div>
              <div className="h-3 w-px bg-white/15" />
              <div className="font-mono text-[10px] uppercase tracking-[0.18em]">
                с 2021 года
              </div>
              <div className="h-3 w-px bg-white/15" />
              <div className="font-mono text-[10px] uppercase tracking-[0.18em]">
                780+ стартапов
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ───── ZONE 2: utility-футер (плотный 4-колоночный) ───── */}
      <section className="bg-brand-ink text-white/80">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          {/* Top row: brand + 3 nav columns */}
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            {/* BRAND COLUMN */}
            <div className="flex flex-col gap-5">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-xl font-extrabold text-primary-foreground shadow-lg shadow-primary/30">
                  Д
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-display text-xl font-extrabold tracking-tight text-white">
                    ДИВА
                  </span>
                  <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                    Бухгалтерия для стартапов
                  </span>
                </div>
              </Link>
              <p className="max-w-sm text-sm leading-relaxed text-white/55">
                Сопровождаем технологические компании по всей России. Специализация — гранты Фонда
                содействия инновациям.
              </p>
              {/* Socials grid */}
              <div className="flex items-center gap-2.5">
                {socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    aria-label={s.name}
                    className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition hover:scale-105 hover:border-primary/40 hover:bg-primary/15"
                  >
                    <s.Icon
                      weight="duotone"
                      className="h-4 w-4 text-white/60 transition group-hover:text-white"
                    />
                  </a>
                ))}
              </div>
              <a
                href="mailto:diva.consulting.b@gmail.com"
                className="inline-flex items-center gap-2 font-mono text-xs text-white/50 transition hover:text-white"
              >
                <EnvelopeSimple weight="duotone" className="h-3.5 w-3.5" />
                diva.consulting.b@gmail.com
              </a>
              <p className="font-mono text-[10px] text-white/35">Пн–СБ 08:00–18:00 МСК</p>
            </div>

            {/* COL 2 — Услуги */}
            <FooterColumn title="Услуги" links={servicesLinks} />

            {/* COL 3 — Компания */}
            <FooterColumn title="Компания" links={companyLinks} />

            {/* COL 4 — Документы + контакты */}
            <FooterColumn title="Документы" links={docsLinks}>
              <div className="mt-6 flex flex-col gap-2 text-xs text-white/55">
                <div className="flex items-center gap-2">
                  <PhoneCall weight="duotone" className="h-3 w-3 text-white/40" />
                  <a
                    href="tel:+79966366971"
                    className="font-mono transition hover:text-white"
                  >
                    +7 996 636-69-71
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneCall weight="duotone" className="h-3 w-3 text-white/40" />
                  <a
                    href="tel:+79832361691"
                    className="font-mono transition hover:text-white"
                  >
                    +7 983 236-16-91
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin weight="duotone" className="mt-0.5 h-3 w-3 shrink-0 text-white/40" />
                  <span>Томская обл., д. Барабинка, ул. Советская, д. 2А</span>
                </div>
              </div>
            </FooterColumn>
          </div>

          {/* Bottom bar */}
          <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[11px] text-white/40">
              © 2026 ООО «ДИВА БУХГАЛТЕРИЯ» · ИНН 7000014616 · ОГРН 1247000001841
            </p>
            <p className="font-mono text-[11px] text-white/40">
              Сделано с фокусом на ФСИ-гранты
            </p>
          </div>
        </div>
      </section>
    </footer>
      <AnimatePresence>
        {modalOpen && <ConsultModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

function FooterColumn({
  title,
  links,
  children,
}: {
  title: string
  links: FooterLink[]
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <h4 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-white">
        {title}
      </h4>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-sm text-white/55 transition hover:text-white"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      {children}
    </div>
  )
}
