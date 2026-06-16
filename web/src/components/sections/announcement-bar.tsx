'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight,
  Lightning,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { getAnnouncementMessages } from '@/lib/cms'

type Message = {
  Icon: PhosphorIcon
  text: string
  cta?: string
  href?: string
}

const FALLBACK_MESSAGES: Message[] = [
  {
    Icon: Lightning,
    text: 'Чек-лист грантополучателя ФСИ + календарь дедлайнов 2026',
    cta: 'Скачать',
    href: '#lead-magnet',
  },
  {
    Icon: Lightning,
    text: '5 лет специализации · 780 клиентов · 94% остаются после консультации',
    cta: 'Все цифры',
    href: '#trust',
  },
  {
    Icon: Lightning,
    text: 'Бесплатная консультация — узнайте стоимость за 30 минут',
    cta: 'Записаться',
    href: '#consultation',
  },
]

const ROTATION_MS = 7000

/**
 * Тонкая полоска-объявление над основным хедером.
 * Ротирует сообщения каждые 7 сек с fade.
 * Тёмный фиолетовый фон — даёт «голос бренду» и контраст с лавандовой шапкой ниже.
 */
export function AnnouncementBar() {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [messages, setMessages] = useState<Message[]>(FALLBACK_MESSAGES)

  useEffect(() => {
    getAnnouncementMessages()
      .then((rows) => {
        const visible = rows.filter((r) => r.available !== false)
        if (visible.length > 0) {
          setMessages(
            visible.map((r) => ({
              Icon: Lightning,
              text: r.message ?? '',
              cta: r.ctaText ?? undefined,
              href: r.href ?? undefined,
            })),
          )
          setIndex(0)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length)
    }, ROTATION_MS)
    return () => clearInterval(id)
  }, [reduced, messages.length])

  const current = messages[index]
  if (!current) return null
  const { Icon, text, cta, href } = current

  return (
    <div className="relative isolate overflow-hidden bg-brand-deep text-white">
      {/* Тонкий subtle accent line снизу для разделения */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

      <div className="mx-auto flex min-h-12 max-w-7xl items-center justify-center gap-2 px-3 py-2 sm:h-9 sm:min-h-0 sm:gap-3 sm:px-6 sm:py-0">
        <Icon weight="duotone" className="h-3.5 w-3.5 shrink-0 text-brand-accent" />

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:flex-none sm:gap-3 sm:truncate"
          >
            <span className="min-w-0 flex-1 text-balance font-mono text-[11px] font-semibold leading-snug tracking-wide text-white/88 sm:flex-none sm:truncate sm:text-xs">
              {text}
            </span>
            {cta && href && (
              <a
                href={href}
                className="group inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border border-brand-accent/25 bg-brand-accent/10 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent transition hover:text-white sm:min-h-0 sm:border-0 sm:bg-transparent sm:px-0 sm:text-[11px] sm:tracking-[0.18em]"
              >
                {cta}
                <ArrowRight
                  weight="bold"
                  className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                />
              </a>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Точки-индикаторы */}
        <div className="hidden items-center gap-1.5 sm:flex">
          {messages.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Сообщение ${i + 1}`}
              className={`h-1 rounded-full transition-all ${
                i === index ? 'w-4 bg-brand-accent' : 'w-1 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
