'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowRight, Buildings, CaretDown, EnvelopeSimple, Lightning,
  List, PhoneCall, Rocket, TelegramLogo, Trophy, Users, X,
  ChatCircleDots, Star, FileText,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ConsultModal } from '@/components/sections/consult-modal'

// ─── Стиль жидкого чёрного стекла для дропдаунов ─────────────────────────────
const glassDropdown: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(30,20,60,0.97) 0%, rgba(10,7,22,0.99) 100%)',
  backdropFilter: 'blur(48px) saturate(200%)',
  WebkitBackdropFilter: 'blur(48px) saturate(200%)',
  boxShadow: [
    'inset 0 1px 0 rgba(167,139,250,0.25)',
    'inset 0 0 0 1px rgba(167,139,250,0.10)',
    '0 32px 80px -12px rgba(0,0,0,0.85)',
    '0 0 60px rgba(124,58,237,0.25)',
  ].join(', '),
  border: '1px solid rgba(167,139,250,0.18)',
}

// ─── Данные ───────────────────────────────────────────────────────────────────

const services = [
  { Icon: Lightning, title: 'АУСН', price: '5 900 ₽/мес', desc: 'Автоматизированная упрощённая система', href: '/#services', highlighted: false },
  { Icon: Rocket,    title: 'УСН',  price: '7 900 ₽/мес', desc: 'Для IT и продуктовых стартапов',        href: '/#services', highlighted: false },
  { Icon: Buildings, title: 'ОСН',  price: '8 900 ₽/мес', desc: 'НДС, импорт, крупные контракты',        href: '/#services', highlighted: false },
  { Icon: Trophy,    title: 'Отчётность ФСИ', price: '35 000 ₽ за грант', desc: 'Студенческий стартап, Старт 1 — под ключ', href: '/#services', highlighted: true },
] as const

const navLinks = [
  { label: 'Услуги',       href: '/#services',       sectionId: 'services', hasMega: 'services' as const },
  { label: 'О нас',        href: '/#trust',           sectionId: 'trust',    hasMega: 'about' as const },
  { label: 'Блог',         href: '/#content',         sectionId: 'content' },
  { label: 'Объявления',   href: '/announcements',    sectionId: '' },
  { label: 'FAQ',          href: '/#faq',             sectionId: 'faq' },
]

const aboutLinks = [
  { Icon: Star,       label: 'Цифры и экспертиза', desc: '780 стартапов, 1100+ консультаций',  href: '/#trust' },
  { Icon: Users,      label: 'Команда',             desc: '12 специалистов с опытом от 3 лет', href: '/#team' },
  { Icon: ChatCircleDots, label: 'Отзывы клиентов', desc: 'Реальные отзывы из ВКонтакте',      href: '/#reviews' },
  { Icon: FileText,   label: 'Кейсы',               desc: 'Результаты работы со стартапами',   href: '/#cases' },
]

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const reduced = useReducedMotion()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]')
    if (!sections.length) return
    // Используем rootMargin чтобы секция считалась активной когда занимает центр экрана
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveSection(e.target.id)
        })
      },
      { threshold: 0, rootMargin: '-40% 0px -40% 0px' },
    )
    sections.forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenMenu(null); setMobileOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openDrop = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenMenu(id)
  }
  const scheduleDrop = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120)
  }

  return (
    <>
      <motion.header
        initial={reduced ? false : { y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none sticky top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4"
      >
        <div
          className="pointer-events-auto relative mx-auto grid w-[min(calc(100vw-24px),920px)] grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[36px] px-4 py-2.5 sm:gap-4 sm:px-5"
          style={{
            background: 'linear-gradient(165deg, rgba(48,36,86,0.55) 0%, rgba(22,16,42,0.72) 45%, rgba(8,5,18,0.88) 100%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            backdropFilter: 'blur(32px) saturate(180%)',
            boxShadow: [
              'inset 0 1.5px 0 0 rgba(255,255,255,0.24)',
              'inset 0 0 0 1px rgba(255,255,255,0.06)',
              'inset 0 -2px 6px -2px rgba(0,0,0,0.55)',
              '0 22px 60px -12px rgba(0,0,0,0.6)',
              '0 0 50px 0 rgba(124,58,237,0.18)',
            ].join(', '),
          }}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-brand-soft to-primary shadow-lg shadow-primary/30 ring-1 ring-white/30 transition group-hover:scale-105">
              <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
              <span className="absolute inset-0 flex items-center justify-center font-serif-accent text-2xl font-extrabold italic text-white">Д</span>
              <motion.span
                aria-hidden
                className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-brand-accent ring-2 ring-white"
                animate={reduced ? undefined : { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                transition={reduced ? undefined : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-2xl font-extrabold tracking-[-0.04em] text-white">ДИВА</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">бухгалтерия</span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden items-center justify-self-center gap-1.5 lg:flex">
            {navLinks.map(link => {
              const isAnchor = link.href.startsWith('/#')
              const isActive = isAnchor
                ? activeSection === link.sectionId
                : pathname === link.href
              const mega = 'hasMega' in link ? link.hasMega : undefined

              if (mega) {
                return (
                  <div key={link.href} className="relative" onMouseEnter={() => openDrop(mega)} onMouseLeave={scheduleDrop}>
                    <button
                      type="button"
                      onClick={() => setOpenMenu(v => v === mega ? null : mega)}
                      className={cn(
                        'relative flex items-center gap-1.5 rounded-full px-3.5 py-2 font-display text-[14px] font-semibold transition-all duration-200',
                        isActive
                          ? 'bg-brand-soft/15 text-brand-soft shadow-[0_0_16px_rgba(167,139,250,0.3)]'
                          : 'text-white/65 hover:bg-white/[0.07] hover:text-white',
                      )}
                    >
                      {link.label}
                      <CaretDown weight="bold" className={cn('h-3.5 w-3.5 transition-transform', isActive ? 'text-brand-soft/70' : 'text-white/40', openMenu === mega && 'rotate-180')} />
                    </button>

                    <AnimatePresence>
                      {openMenu === mega && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 overflow-hidden rounded-2xl p-4"
                          style={{ ...glassDropdown, width: mega === 'services' ? 580 : 440 }}
                          onMouseEnter={() => openDrop(mega)}
                          onMouseLeave={scheduleDrop}
                          role="menu"
                        >
                          {/* Top rim */}
                          <div className="pointer-events-none absolute left-8 right-8 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.6) 50%, transparent)' }} />

                          {mega === 'services' && (
                            <>
                              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-brand-soft/60">Тарифы на обслуживание</p>
                              <div className="grid grid-cols-2 gap-2">
                                {services.map(s => (
                                  <a
                                    key={s.title}
                                    href={s.href}
                                    role="menuitem"
                                    onClick={() => setOpenMenu(null)}
                                    className={cn(
                                      'group flex items-start gap-3 rounded-xl p-4 transition',
                                      s.highlighted
                                        ? 'bg-brand-accent/12 ring-1 ring-brand-accent/30 hover:bg-brand-accent/18'
                                        : 'bg-white/[0.04] hover:bg-white/[0.08]',
                                    )}
                                  >
                                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', s.highlighted ? 'bg-brand-accent/25 text-brand-accent' : 'bg-brand-soft/15 text-brand-soft')}>
                                      <s.Icon weight="duotone" className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-baseline gap-2">
                                        <span className="font-display text-[15px] font-bold text-white">{s.title}</span>
                                      </div>
                                      <span className={cn('font-mono text-[11px] font-semibold tabular-nums', s.highlighted ? 'text-brand-accent' : 'text-brand-soft')}>{s.price}</span>
                                      <p className="mt-0.5 text-[12px] text-white/50">{s.desc}</p>
                                    </div>
                                  </a>
                                ))}
                              </div>
                              <div className="mt-3 flex items-center justify-between border-t border-white/[0.10] pt-3">
                                <span className="font-mono text-[10px] text-white/35">4 системы налогообложения</span>
                                <a href="/#services" onClick={() => setOpenMenu(null)} className="group flex items-center gap-1.5 rounded-full bg-brand-soft/10 px-3 py-1.5 font-mono text-[11px] font-semibold text-brand-soft transition hover:bg-brand-soft/20 hover:text-white">
                                  Все тарифы <ArrowRight weight="bold" className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                                </a>
                              </div>
                            </>
                          )}

                          {mega === 'about' && (
                            <div className="flex flex-col gap-1">
                              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-brand-soft/60">О компании</p>
                              {aboutLinks.map(l => (
                                <a
                                  key={l.label}
                                  href={l.href}
                                  role="menuitem"
                                  onClick={() => setOpenMenu(null)}
                                  className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.07]"
                                >
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft/12 text-brand-soft transition group-hover:bg-brand-soft/20">
                                    <l.Icon weight="duotone" className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="font-display text-[15px] font-semibold text-white">{l.label}</p>
                                    <p className="text-[12px] text-white/50">{l.desc}</p>
                                  </div>
                                  <ArrowRight weight="bold" className="ml-auto h-4 w-4 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-brand-soft" />
                                </a>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              }

              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-full px-3.5 py-2 font-display text-[14px] font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-brand-soft/15 text-brand-soft shadow-[0_0_16px_rgba(167,139,250,0.3)]'
                      : 'text-white/65 hover:bg-white/[0.07] hover:text-white',
                  )}
                >
                  {link.label}
                </a>
              )
            })}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="group hidden h-10 items-center gap-2 rounded-full bg-primary px-5 font-display text-[14px] font-semibold text-white shadow-lg shadow-primary/40 transition hover:bg-primary/90 hover:shadow-primary/60 sm:flex"
            >
              Консультация
              <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:border-white/25 lg:hidden"
            >
              {mobileOpen ? <X weight="bold" className="h-5 w-5" /> : <List weight="bold" className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto absolute left-3 right-3 top-full mt-2 overflow-hidden rounded-2xl p-4"
              style={glassDropdown}
            >
              <div className="pointer-events-none absolute left-8 right-8 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.6) 50%, transparent)' }} />
              <div className="flex flex-col gap-0.5">
                {navLinks.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3 font-display text-sm font-medium text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="mt-3 border-t border-white/[0.08] pt-3 flex flex-col gap-2">
                <a href="tel:+79966366971" className="flex items-center gap-2 px-4 py-2 font-mono text-sm text-white/55 transition hover:text-white">
                  <PhoneCall weight="duotone" className="h-4 w-4 text-brand-soft" />
                  +7 996 636-69-71
                </a>
                <a href="https://t.me/diva_accounting" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 font-mono text-sm text-white/55 transition hover:text-white">
                  <TelegramLogo weight="duotone" className="h-4 w-4 text-brand-soft" />
                  @diva_accounting
                </a>
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); setModalOpen(true) }}
                  className="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-display text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Бесплатная консультация
                  <ArrowRight weight="bold" className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && <ConsultModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
