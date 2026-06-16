'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, CheckCircle, Moon, PhoneCall, Sun, SunHorizon, TelegramLogo, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const TIMES = [
  { id: 'morning', label: 'Утром',   sub: '09–12', Icon: SunHorizon },
  { id: 'day',     label: 'Днём',    sub: '12–17', Icon: Sun },
  { id: 'evening', label: 'Вечером', sub: '17–20', Icon: Moon },
] as const
type TimeId = typeof TIMES[number]['id']

export function ConsultModal({ onClose }: { onClose: () => void }) {
  const reduced = useReducedMotion()
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [time, setTime] = useState<TimeId | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop — opacity only, no blur to avoid jank */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 cursor-pointer"
        style={{ background: 'rgba(4,2,14,0.82)' }}
        onClick={onClose}
      />

      <motion.div
        initial={reduced ? undefined : { opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        className="relative z-10 flex w-full max-w-[780px] overflow-hidden rounded-[32px] text-white"
        style={{
          background: 'linear-gradient(135deg, #0e0820 0%, #07041a 100%)',
          boxShadow: '0 0 0 1px rgba(124,58,237,0.18), 0 48px 120px -20px rgba(0,0,0,0.95), 0 0 120px rgba(124,58,237,0.12)',
        }}
      >
        {/* ── LEFT PANEL ── */}
        <div
          className="relative hidden w-[280px] shrink-0 flex-col justify-between overflow-hidden p-8 md:flex"
          style={{
            background: 'linear-gradient(160deg, rgba(124,58,237,0.22) 0%, rgba(79,46,180,0.08) 60%, rgba(251,146,60,0.06) 100%)',
            borderRight: '1px solid rgba(124,58,237,0.15)',
          }}
        >
          {/* Glow orb */}
          <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 65%)' }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.20) 0%, transparent 65%)' }} />

          <div className="relative">
            {/* Logo mark */}
            <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', boxShadow: '0 8px 24px rgba(124,58,237,0.45)' }}>
              <span className="font-display text-lg font-black text-white">Д</span>
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-accent">Бесплатно · 30 минут</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold leading-[1.15] tracking-tight">
              Консультация<br />
              <span style={{ color: 'rgba(167,139,250,0.9)' }}>с экспертом</span>
            </h2>
            <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Разберём систему налогообложения, этап гранта ФСИ и закроем все вопросы.
            </p>
          </div>

          {/* Stats */}
          <div className="relative flex flex-col gap-4">
            {[
              { val: '94%', label: 'остаются клиентами' },
              { val: '780+', label: 'стартапов в работе' },
              { val: '5 лет', label: 'на рынке' },
            ].map(({ val, label }) => (
              <div key={val} className="flex items-baseline gap-2">
                <span className="font-display text-xl font-black" style={{ color: 'rgba(251,146,60,0.9)' }}>{val}</span>
                <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="relative flex flex-1 flex-col">
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full transition"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <X weight="bold" className="h-3.5 w-3.5 text-white/50" />
          </button>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5 p-8 pt-10"
              >
                {/* Mobile-only header */}
                <div className="md:hidden">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-accent">Бесплатно · 30 минут</p>
                  <h2 className="mt-2 font-display text-xl font-extrabold">Записаться на консультацию</h2>
                </div>

                {/* Desktop header */}
                <div className="hidden md:block">
                  <h3 className="font-display text-[17px] font-bold" style={{ color: 'rgba(255,255,255,0.55)' }}>Оставьте заявку</h3>
                  <p className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.30)' }}>Свяжемся в течение рабочего дня</p>
                </div>

                {/* Inputs */}
                <div className="flex flex-col gap-3">
                  {[
                    { type: 'text',  placeholder: 'Ваше имя',              value: name,  onChange: setName,  autoComplete: 'name' },
                    { type: 'tel',   placeholder: 'Телефон или Telegram',   value: phone, onChange: setPhone, autoComplete: 'tel' },
                  ].map(({ type, placeholder, value, onChange, autoComplete }) => (
                    <input
                      key={placeholder}
                      type={type}
                      placeholder={placeholder}
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      required
                      autoComplete={autoComplete}
                      className="h-12 w-full rounded-2xl px-4 text-[14px] text-white outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        caretColor: '#A78BFA',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.border = '1px solid rgba(167,139,250,0.5)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.09)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                  ))}
                </div>

                {/* Time picker */}
                <div>
                  <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                    Удобное время
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {TIMES.map(({ id, label, sub, Icon }) => {
                      const active = time === id
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setTime(id)}
                          className="flex flex-col items-center gap-1.5 rounded-2xl py-3.5 transition-all duration-200"
                          style={{
                            background: active ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
                            border: active ? '1px solid rgba(167,139,250,0.45)' : '1px solid rgba(255,255,255,0.07)',
                            boxShadow: active ? '0 0 20px rgba(124,58,237,0.15), inset 0 1px 0 rgba(167,139,250,0.15)' : 'none',
                          }}
                        >
                          <Icon weight="duotone" className="h-5 w-5" style={{ color: active ? '#A78BFA' : 'rgba(255,255,255,0.35)' }} />
                          <span className="font-display text-[13px] font-bold" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                            {label}
                          </span>
                          <span className="font-mono text-[10px]" style={{ color: active ? 'rgba(167,139,250,0.65)' : 'rgba(255,255,255,0.22)' }}>
                            {sub}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault()
                    const trimmedName = name.trim()
                    const trimmedPhone = phone.trim()
                    if (loading) return
                    if (!trimmedName || !trimmedPhone) {
                      setError('Заполните имя и контакт для связи.')
                      return
                    }

                    setLoading(true)
                    setError('')
                    try {
                      const res = await fetch('/api/leads', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: trimmedName,
                          contact: trimmedPhone,
                          source: 'site',
                          page: window.location.pathname,
                          utm: { preferred_time: time ?? '' },
                        }),
                      })

                      if (!res.ok) throw new Error('lead-submit-failed')
                      setSent(true)
                    } catch {
                      setError('Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  aria-busy={loading}
                  className={cn(
                    'group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl font-display text-[14px] font-semibold text-white transition-all',
                    loading && 'cursor-wait opacity-70',
                  )}
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                    boxShadow: '0 8px 32px rgba(124,58,237,0.45)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,58,237,0.60)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.45)' }}
                >
                  <span className="relative z-10">{loading ? 'Отправляем...' : 'Записаться'}</span>
                  <ArrowRight weight="bold" className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>

                {error && (
                  <p className="-mt-2 rounded-2xl border border-brand-accent/25 bg-brand-accent/10 px-4 py-3 text-[12px] leading-relaxed text-brand-accent">
                    {error}
                  </p>
                )}

                {/* Contacts */}
                <div className="flex items-center gap-4 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.28)' }}>
                  <a href="tel:+79966366971" className="flex items-center gap-1.5 font-mono text-[11px] transition hover:text-white/60">
                    <PhoneCall weight="duotone" className="h-3.5 w-3.5" />
                    +7 996 636-69-71
                  </a>
                  <span className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.10)' }} />
                  <a href="https://t.me/diva_accounting" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-mono text-[11px] transition hover:text-white/60">
                    <TelegramLogo weight="duotone" className="h-3.5 w-3.5" />
                    @diva_accounting
                  </a>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-1 flex-col items-center justify-center gap-5 p-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)' }}
                >
                  <CheckCircle weight="duotone" className="h-9 w-9 text-brand-accent" />
                </motion.div>
                <div>
                  <h2 className="font-display text-xl font-extrabold">Заявка принята!</h2>
                  <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Свяжемся в течение рабочего дня.<br />Пн–СБ 08:00–18:00 МСК.
                  </p>
                </div>
                <button type="button" onClick={onClose}
                  className="font-mono text-[11px] uppercase tracking-[0.18em] transition hover:text-white/60"
                  style={{ color: 'rgba(255,255,255,0.30)' }}>
                  Закрыть
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
