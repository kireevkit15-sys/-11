'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { Megaphone, ArrowRight } from '@phosphor-icons/react'

import { FadeIn } from '@/components/motion/fade-in'
import { SectionEyebrow } from '@/components/sections/section-eyebrow'
import { getAvailableAnnouncements, getMediaUrl, type Announcement } from '@/lib/cms'

// ─── Fallback (если API недоступен) ────────────────────────────────────────────

const FALLBACK: Announcement[] = [
  {
    id: 'fb-1',
    title: 'Бесплатная консультация',
    content: '30 минут с экспертом по бухгалтерии и ФСИ — без обязательств. Разберём вашу ситуацию, подскажем оптимальный тариф.',
    key: 'free-consultation',
    category: 'Консультация',
    badge: 'new',
    hue: 200,
    available: true,
    featured: true,
    sortOrder: 1,
    imageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as Announcement,
]

// ─── Card ──────────────────────────────────────────────────────────────────────

function AnnouncementTile({ item, index }: { item: Announcement; index: number }) {
  const reduced = useReducedMotion()
  const hue = item.hue ?? 200
  const accent = `hsl(${hue}, 72%, 58%)`
  const accentDim = `hsl(${hue}, 55%, 32%)`
  const accentFaint = `hsla(${hue}, 72%, 58%, 0.18)`
  const imageUrl = getMediaUrl(item.imageUrl)
  const initial = item.title.charAt(0).toUpperCase()

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.24), ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(160deg, rgba(15,11,30,0.92) 0%, rgba(10,6,20,0.94) 100%)',
        border: `1px solid ${accentFaint}`,
        boxShadow: `0 0 0 1px ${accentFaint}, 0 18px 40px -28px ${accent}80`,
      }}
    >
      {/* Photo / Cover */}
      <div
        className="relative aspect-[16/9] w-full overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accentDim}, hsl(${(hue + 60) % 360},55%,28%))` }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center font-display text-7xl font-extrabold text-white/90"
            style={{ textShadow: `0 4px 32px ${accent}80` }}
          >
            {initial}
          </div>
        )}

        {/* Top rim */}
        <div aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent} 50%, transparent)` }} />

        {/* Bottom shadow for text readability */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: 'linear-gradient(to top, rgba(10,6,20,0.7), transparent)' }} />

        {/* Category badge */}
        {item.category && (
          <span
            className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur"
            style={{ boxShadow: `0 0 0 1px ${accentFaint}` }}
          >
            {item.category}
          </span>
        )}

        {item.featured && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white"
            style={{ background: `${accent}30`, boxShadow: `0 0 0 1px ${accent}80, 0 0 18px ${accent}60` }}>
            <Megaphone size={10} weight="fill" />
            Топ
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-lg font-extrabold leading-tight text-white">
          {item.title}
        </h3>
        <p className="text-sm leading-[1.65] text-white/55 line-clamp-3">
          {item.content}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3"
          style={{ borderTop: `1px solid ${accentFaint}` }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
            {item.key}
          </span>
          <a
            href="#lead-magnet"
            className="group/link inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors"
            style={{ color: accent }}
          >
            Подробнее
            <ArrowRight size={12} weight="bold" className="transition-transform group-hover/link:translate-x-0.5" />
          </a>
        </div>
      </div>
    </motion.article>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function AnnouncementsSection() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    getAvailableAnnouncements()
      .then((data) => {
        if (cancelled) return
        if (data.length > 0) setItems(data)
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  // Не показывать секцию, если ничего не пришло и нечего показывать
  if (loaded && items.length === 0) {
    // Используем fallback чтобы пользователь видел разметку
    setItems(FALLBACK)
  }

  if (items.length === 0) return null

  return (
    <section
      id="announcements"
      className="relative isolate overflow-hidden bg-aurora-dark noise-overlay text-white"
    >
      {/* Decorative blobs */}
      <div className="blob blob-soft pointer-events-none absolute" style={{ top: '8%', left: '-6%', width: 460, height: 460, opacity: 0.28 }} aria-hidden />
      <div className="blob blob-coral pointer-events-none absolute" style={{ bottom: '4%', right: '-4%', width: 380, height: 380, opacity: 0.18 }} aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <FadeIn className="mb-12 flex flex-col gap-5 sm:mb-14">
          <SectionEyebrow number="04a" variant="dark">Объявления</SectionEyebrow>
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl">
              Что нового{' '}
              <span className="font-serif-accent italic text-brand-soft">у ДИВА</span>
            </h2>
            <p className="max-w-2xl text-base text-white/55">
              Бесплатные консультации, акции, набор команд — все актуальные предложения в одном месте.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <AnnouncementTile key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
