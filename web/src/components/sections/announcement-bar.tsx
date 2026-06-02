'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight,
  Lightning,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

type Message = {
  Icon: PhosphorIcon
  text: string
  cta?: string
  href?: string
}

const MESSAGES: Message[] = [
  {
    Icon: Lightning,
    text: 'Чек-лист грантополучателя ФСИ + календарь дедлайнов 2026',
    cta: 'Скачать',
    href: '#lead-magnet',
  },
  {
    Icon: Lightning,
    text: '5 лет специализации · 488 клиентов · 94% остаются после консультации',
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

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length)
    }, ROTATION_MS)
    return () => clearInterval(id)
  }, [reduced])

  const current = MESSAGES[index]
  if (!current) return null
  const { Icon, text, cta, href } = current

  return (
    <div className="relative isolate overflow-hidden bg-brand-deep text-white">
      {/* Тонкий subtle accent line снизу для разделения */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-3 px-4 sm:px-6">
        <Icon weight="duotone" className="h-3.5 w-3.5 shrink-0 text-brand-accent" />

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 truncate"
          >
            <span className="truncate font-mono text-[11px] font-medium tracking-wide text-white/85 sm:text-xs">
              {text}
            </span>
            {cta && href && (
              <a
                href={href}
                className="group inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-accent transition hover:text-white"
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
          {MESSAGES.map((_, i) => (
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
