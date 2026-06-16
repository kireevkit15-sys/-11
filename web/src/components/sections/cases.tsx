'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

import { FadeIn } from '@/components/motion/fade-in'
import { SectionEyebrow } from '@/components/sections/section-eyebrow'
import { getCaseStudies, type CaseStudy } from '@/lib/cms'

// ─────────────────────────────────────────────────────────────────────────────
// Performance constants
// ─────────────────────────────────────────────────────────────────────────────
const RAF_THROTTLE = 32 // 30fps is enough for scroll-driven animation
const REDUCED_BLUR = 14 // was 20px — reduced further for performance
const PANEL_FADE   = 0.25 // seconds, was 0.45s

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

type CaseItem = {
  initials: string
  name: string
  niche: string
  did: string
  metric: string
  metricLabel: string
}

// Fallback — используется если CMS недоступна
// Кейсы отражают типичные результаты работы ДИВА: гранты ФСИ, бухгалтерия для стартапов
const fallbackCases: CaseItem[] = [
  { initials: 'НБ', name: 'NeuroBio',    niche: 'Биотех',           did: 'Поставили учёт с нуля, сопроводили этап «Старт-1» ФСИ',           metric: '4 млн ₽',  metricLabel: 'грант защищён' },
  { initials: 'ИТ', name: 'ITStartup',  niche: 'IT-аккредитация',   did: 'Получили IT-аккредитацию, перевели на льготную ставку',           metric: '0%',        metricLabel: 'налог на прибыль' },
  { initials: 'СТ', name: 'СтартапТомск', niche: 'ФСИ Старт',        did: 'Подготовили заявку на «Старт-1», прошли экспертизу с первого раза', metric: '8 млн ₽', metricLabel: 'грант получен' },
  { initials: 'УС', name: 'УмнаяСистема', niche: 'УСН',             did: 'Оптимизировали налоговую нагрузку при переходе с ОСН на УСН',    metric: '-23%',      metricLabel: 'налоги снижены' },
  { initials: 'ЭК', name: 'ЭкоТех',      niche: 'Экспорт',           did: 'Настроили валютный контроль для экспортных контрактов',          metric: '12 стран',  metricLabel: 'рынков СНГ и ЕАЭС' },
  { initials: 'СК', name: 'СтудКвест',   niche: 'Студенческий стартап', did: 'Оформили документы для программы «Студенческий стартап» ФСИ',  metric: '500 тыс ₽', metricLabel: 'грант одобрен' },
  { initials: 'МА', name: 'МедАналитика', niche: 'MedTech',          did: 'Закрыли 2 года бухгалтерии, подготовили отчётность для инвестора', metric: '2,4 млн ₽', metricLabel: 'возврат НДС' },
  { initials: 'РТ', name: 'РоботоТех',    niche: 'Робототехника',    did: 'Сопроводили грант «Развитие-НТИ» от заявки до отчёта',         metric: '20 млн ₽',  metricLabel: 'грант освоен' },
  { initials: 'БП', name: 'БизнесПлюс',  niche: 'ОСН',              did: 'Перевели на ОСН, настроили КУДиР и управленческую отчётность',   metric: 'x3',        metricLabel: 'скорость закрытия' },
  { initials: 'АУ', name: 'АУСН-Старт',  niche: 'АУСН',             did: 'Первое сопровождение стартапа на АУСН - от регистрации до отчёта', metric: '100%',     metricLabel: 'без штрафов' },
]

// ─── Конвертация CMS CaseStudy → CaseItem ────────────────────────────────────
// Берём первые 10 кейсов, генерируем initials из названия

function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// Strapi v5: данные приходят напрямую без .attributes
function caseStudyToCaseItem(cs: CaseStudy): CaseItem {
  return {
    initials: getInitials(cs.title),
    name:     cs.title,
    niche:    cs.tags?.[0] || 'Стартап',
    did:      cs.task || cs.solution || 'Решена задача клиента',
    metric:   cs.result?.match(/^[\d\.\,×\-\s]+[^\s]{0,8}/)?.[0] || '—',
    metricLabel: 'результат',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3D-позиции карточек.
//
// Механика «warp-полёта»:
//   • Каждая карточка стартует на своей глубине baseZ (отрицательный = далеко).
//   • По мере скролла Z увеличивается (карточка летит к зрителю).
//   • Perspective автоматически масштабирует карточку: z → +300 ≈ ×1.5 размер.
//   • Opacity: плавно появляется из темноты (z < −600) и гаснет у камеры (z > +200).
//   • speed: у каждой карточки свой темп — ближние медленнее, дальние быстрее.
//
// Распределение:
//   Карточки 0-2  → уже видны при входе, уходят первыми
//   Карточки 3-6  → появляются в середине прокрутки
//   Карточки 7-9  → последние, остаются до конца
// ─────────────────────────────────────────────────────────────────────────────

const CARD_W       = 300
const TOTAL_Z      = 1200  // px, полный Z-путь при speed=1 за весь скролл

const placements = [
  // Видны сразу — уходят первыми
  { x:   80, y:  205, baseZ:  -130, speed: 0.70, ry:  4, rx: -4 },  // 0
  { x:  345, y:   30, baseZ:  -370, speed: 0.86, ry: -12, rx: -1 }, // 1
  { x: -135, y:   50, baseZ:  -560, speed: 0.96, ry:   5, rx: -2 }, // 2
  // Появляются на 15–35% скролла
  { x:  275, y:  145, baseZ:  -760, speed: 0.92, ry: -10, rx:  4 }, // 3
  { x: -385, y:  170, baseZ:  -920, speed: 1.12, ry:  11, rx:  2 }, // 4
  { x:  425, y: -150, baseZ: -1060, speed: 1.28, ry:  -8, rx:  5 }, // 5
  // Появляются на 50–70% скролла
  { x: -325, y:  -60, baseZ: -1210, speed: 1.16, ry:   7, rx: -2 }, // 6
  { x:  205, y:  105, baseZ: -1410, speed: 1.22, ry:  -9, rx: -3 }, // 7
  // Финальные — остаются до конца
  { x: -205, y: -195, baseZ: -1620, speed: 1.38, ry:  -5, rx:  7 }, // 8
  { x: -265, y:  -45, baseZ: -1820, speed: 1.30, ry:  13, rx:  1 }, // 9
] as const

type Placement = typeof placements[number]

// Opacity по Z: fade-in из тьмы, fade-out у камеры
function zOpacity(z: number): number {
  const fadein  = Math.max(0, Math.min(1, (z + 1000) / 400))  // 0 при z≤-1000, 1 при z≥-600
  const fadeout = Math.max(0, Math.min(1, 1 - (z - 200) / 200)) // 1 при z≤200, 0 при z≥400
  return fadein * fadeout
}

function cardTransform(x: number, y: number, z: number, ry: number, rx: number): string {
  return `translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateY(${ry}deg) rotateX(${rx}deg)`
}

// ─────────────────────────────────────────────────────────────────────────────
// Liquid Glass Card
//
// Физика стекла без декоративных градиентов:
//   • backdrop-filter blur(40px) saturate(220%) brightness(112%) — «мокрая» линза
//   • border: rgba(255,255,255,0.22) — видимый край стекла
//   • inset box-shadows — имитация толщины: верхний обод ловит свет, нижний в тени
//   • Specular highlight — 1px абсолютная полоска на топ-ободе (как блик на бокале)
//   • Cast shadow — стекло отбрасывает тяжёлую тень
//   • Все цвета — только белый, опакити, и существующие ambient glows позади
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Стили: жидкое стекло + неон (как glass-card-dark на hero)
//
// Стекло:  blur(40px) saturate(220%) + inset shadows (толщина стекла)
// Неон:    violet background tint + violet border + внешний glow
//          (те же rgba(124,58,237 / 167,139,250) что и в hero)
// ─────────────────────────────────────────────────────────────────────────────

// Reduced motion: use a flat "card" visual instead of glass (no blur, no inset shadows)
const glassStyle: React.CSSProperties = {
  position:     'relative',
  borderRadius: 18,
  overflow:     'hidden',
  // Violet-tinted glass — fallback solid bg for browsers without backdrop-filter support
  background:   'rgba(20, 12, 40, 0.85)',
  backdropFilter:        `blur(${REDUCED_BLUR}px) saturate(180%)`,
  WebkitBackdropFilter:  `blur(${REDUCED_BLUR}px) saturate(180%)`,
  // Violet border — same pattern as border-brand-soft/30 on hero
  border: '1px solid rgba(167,139,250,0.28)',
  boxShadow: [
    // Cast shadow — reduced complexity for performance
    '0 12px 32px rgba(0,0,0,0.50)',
    '0 3px 8px rgba(0,0,0,0.28)',
  ].join(', '),
  padding: '20px 22px 18px',
}

// Inset glass chip — border only (no box-shadow, paint-heavy)
const glassChipStyle: React.CSSProperties = {
  background: 'rgba(124,58,237,0.14)',
  border:     '1px solid rgba(167,139,250,0.28)',
}

function FloatingCard({ item, placement, cardRef, index }: {
  item: CaseItem
  placement: Placement
  cardRef: (el: HTMLDivElement | null) => void
  index: number
}) {
  const p = placement

  // Стагированные тайминги: каждая карточка живёт в своём ритме
  const floatDur  = 3.8 + (index % 4) * 0.7   // 3.8–6.5s
  const floatDel  = -(index * 0.55)             // отрицательный delay = уже в движении
  const glowDur   = 2.6 + (index % 5) * 0.5    // 2.6–4.6s
  const glowDel   = -(index * 0.4)
  const glintDur  = 6  + (index % 3) * 2.5     // 6s, 8.5s, 11s
  const glintDel  = -(index * 1.1)

  return (
    <div
      ref={cardRef}
      style={{
        position:           'absolute',
        left:               '50%',
        top:                '50%',
        width:              CARD_W,
        transform:          cardTransform(p.x, p.y, p.baseZ, p.ry, p.rx),
        opacity:            zOpacity(p.baseZ),
        backfaceVisibility: 'hidden', // GPU hint for 3D rotation
        // will-change: transform only — opacity handled via compositing
      }}
    >
      {/* ── Float wrapper: JS трогает только внешний div, CSS-анимация здесь ── */}
      <div style={{
        position:  'relative',
        animation: `cases-float ${floatDur}s ease-in-out ${floatDel}s infinite`,
      }}>

        {/* ── Glass card ── */}
        <div style={glassStyle}>

          {/* Specular rim */}
          <div aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'rgba(255,255,255,0.45)', pointerEvents: 'none',
          }} />

          {/* Caustic wash */}
          <div aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '38%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.055) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Glass glint — луч скользит по стеклу */}
          <div aria-hidden style={{
            position:     'absolute',
            top:          0, bottom: 0, left: 0,
            width:        '28%',
            background:   'linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)',
            animation:    `cases-glint ${glintDur}s ease-in-out ${glintDel}s infinite`,
            pointerEvents: 'none',
          }} />

          {/* Метрика */}
          <p style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '2.15rem',
            fontWeight:    900,
            lineHeight:    1,
            letterSpacing: '-0.04em',
            color:         'rgba(255,255,255,0.97)',
            textShadow:    '0 0 24px rgba(167,139,250,0.55), 0 0 48px rgba(124,58,237,0.30)',
          }}>
            {item.metric}
          </p>

          {/* Label с пульсирующей dot */}
          <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display:      'inline-block',
              width:        5, height: 5,
              borderRadius: '50%',
              background:   'rgba(167,139,250,0.95)',
              boxShadow:    '0 0 8px rgba(167,139,250,0.75)',
              flexShrink:   0,
              animation:    `cases-dot ${glowDur * 0.9}s ease-in-out ${glowDel}s infinite`,
            }} />
            <p style={{
              fontFamily:    'var(--font-mono, monospace)',
              fontSize:      9,
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              color:         'rgba(167,139,250,0.80)',
              fontWeight:    500,
            }}>
              {item.metricLabel}
            </p>
          </div>

          {/* Описание */}
          <p style={{
            marginTop:       16,
            fontSize:        13,
            lineHeight:      1.6,
            color:           'rgba(255,255,255,0.58)',
            display:         '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow:        'hidden',
          }}>
            {item.did}
          </p>

          {/* Разделитель */}
          <div style={{ marginTop: 16, height: 1, background: 'rgba(255,255,255,0.07)' }} />

          {/* Компания */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              ...glassChipStyle,
              width: 34, height: 34, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.82)' }}>
                {item.initials}
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, color: 'rgba(255,255,255,0.88)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.name}
              </p>
              <div style={{ ...glassChipStyle, display: 'inline-block', marginTop: 4, padding: '1px 6px', borderRadius: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.38)', fontWeight: 500 }}>
                  {item.niche}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop: 3D warp-полёт
//
// Архитектура:
//   fixed panel (overflow:hidden, bg)
//     perspective-wrapper (perspective:1200px) ← НЕ имеет overflow, чтобы не схлопнуть 3D
//       scene (transformStyle:preserve-3d, лёгкий camera-sway ±5°)
//         cards (translate3d индивидуальный Z на каждом кадре)
//
// Scroll handler обновляет Z каждой карточки и прозрачность — 0 реакта.
// ─────────────────────────────────────────────────────────────────────────────

function CasesScene({ cases }: { cases: CaseItem[] }) {
  const runwayRef = useRef<HTMLDivElement>(null)
  const panelRef  = useRef<HTMLDivElement>(null)
  const sceneRef  = useRef<HTMLDivElement>(null)
  const cardRefs  = useRef<(HTMLDivElement | null)[]>([])
  const reduced   = useReducedMotion()

  // Stable mutable state — avoids useState re-renders
  const bounds     = useRef({ top: 0, height: 0 })
  const prevY      = useRef(0)
  const prevProg   = useRef(-1) // prev progress to skip redundant DOM updates
  const passedEnd  = useRef(false)
  const reversing  = useRef(false)
  const skipRafId  = useRef(0)

  // Pre-compute placement data once — no recalc on frames
  const placementData = useRef(placements.map((p) => ({
    x: p.x, y: p.y, ry: p.ry, rx: p.rx, speed: p.speed, baseZ: p.baseZ,
  })))

  // ── smoothSkip defined FIRST so handleScroll can capture it ──
  const smoothSkip = useCallback((target: number, duration: number) => {
    skipRafId.current = 0
    const startY = window.scrollY
    const dist   = target - startY
    const t0     = performance.now()
    const tick   = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      window.scrollTo(0, startY + dist * e)
      if (p < 1) skipRafId.current = requestAnimationFrame(tick)
    }
    skipRafId.current = requestAnimationFrame(tick)
  }, [])

  // ── handleScroll reads smoothSkip from closure ──
  const handleScroll = useCallback((y: number) => {
    const panel = panelRef.current
    const scene = sceneRef.current
    if (!panel || !scene) return

    const top    = bounds.current.top
    const height = bounds.current.height
    const viewH  = window.innerHeight
    const endY   = top + height - viewH

    if (y >= endY)                         passedEnd.current = true
    if (y < top - viewH) { passedEnd.current = false; reversing.current = false }

    if (y > prevY.current && passedEnd.current && !reversing.current && y >= top && y < endY) {
      reversing.current = true
      passedEnd.current = false
      smoothSkip(Math.max(0, top - viewH), 400)
    }

    if (y > prevY.current && reversing.current) {
      cancelAnimationFrame(skipRafId.current)
      reversing.current = false
      passedEnd.current = true
    }
    prevY.current = y

    const active = y >= top && y < endY

    if (reversing.current && active) {
      panel.style.opacity       = '1'
      panel.style.pointerEvents = 'none'
      return
    }
    if (!active) reversing.current = false

    panel.style.opacity       = active ? '1' : '0'
    panel.style.pointerEvents = active ? 'auto' : 'none'
    if (!active || reduced) return

    const progress = (y - top) / (height - viewH)

    // Skip DOM update if progress delta is negligible (< 0.5%)
    const progScaled = (progress * 1000) | 0
    if (progScaled === prevProg.current) return
    prevProg.current = progScaled

    const rotY = 5 - progress * 10
    const rotX = -2 + progress * 4
    scene.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`

    const cards = cardRefs.current
    const data  = placementData.current
    for (let i = 0; i < placements.length; i++) {
      const card = cards[i]
      if (!card) continue
      const p = data[i]
      if (!p) continue
      const z = p.baseZ + progress * TOTAL_Z * p.speed
      card.style.transform = `translate(-50%,-50%) translate3d(${p.x}px,${p.y}px,${z}px) rotateY(${p.ry}deg) rotateX(${p.rx}deg)`
      card.style.opacity = String(zOpacity(z))
    }
  }, [reduced, smoothSkip])

  useEffect(() => {
    const measure = () => {
      const el = runwayRef.current
      if (!el) return
      bounds.current.top    = el.getBoundingClientRect().top + window.scrollY
      bounds.current.height = el.offsetHeight
    }
    measure()
    window.addEventListener('resize', measure, { passive: true })

    const onScroll = () => {
      rafId = requestAnimationFrame(tick)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    let rafId   = 0
    let lastY   = 0
    let lastRaf = 0
    let rafPaused = false

    const tick = (now: number) => {
      // Pause RAF loop when panel is not visible — saves CPU/battery
      if (rafPaused) {
        rafId = requestAnimationFrame(tick)
        return
      }
      if (now - lastRaf < RAF_THROTTLE) {
        rafId = requestAnimationFrame(tick)
        return
      }
      lastRaf = now
      const y = window.scrollY
      if (y !== lastY) {
        lastY = y
        handleScroll(y)
      }
      rafId = requestAnimationFrame(tick)
    }

    // Pause/resume based on panel visibility
    const panelObserver = new IntersectionObserver(
      (entries) => { if (entries[0]) rafPaused = !entries[0].isIntersecting },
      { threshold: 0.01 },
    )
    if (panelRef.current) panelObserver.observe(panelRef.current)

    handleScroll(window.scrollY)
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      panelObserver.disconnect()
    }
  }, [handleScroll])

  return (
    <>
      {/* 700 vh scroll runway */}
      <div ref={runwayRef} style={{ height: '700vh' }} />

      {/* Fixed full-screen panel */}
      <div
        ref={panelRef}
        style={{
          position:      'fixed',
          inset:         0,
          zIndex:        40,
          opacity:       0,
          pointerEvents: 'none',
          transition:    `opacity ${PANEL_FADE}s ease`,
          background:    'var(--brand-ink)',
          overflow:      'hidden',
        }}
      >
        {/* Ambient glows */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 75% 60% at 25% 55%, rgba(124,58,237,.24) 0%, transparent 65%)',
        }} />
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 50% 45% at 76% 48%, rgba(251,146,60,.13) 0%, transparent 62%)',
        }} />

        {/* 3D grid floor — плоский декор вне 3D-сцены */}
        <div aria-hidden style={{
          position: 'absolute', bottom: 0, left: '-10%', right: '-10%', height: '50%',
          perspective: '900px', perspectiveOrigin: '50% 0%', pointerEvents: 'none', zIndex: 1,
        }}>
          <div style={{
            width: '100%', height: '100%',
            transform: 'rotateX(72deg)',
            backgroundImage: [
              'linear-gradient(rgba(124,58,237,0.15) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(124,58,237,0.15) 1px, transparent 1px)',
            ].join(','),
            backgroundSize: '80px 80px',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 28%, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 28%, black 70%, transparent 100%)',
          }} />
        </div>

        {/* Holographic shape — focal background element, behind cards */}
        <div aria-hidden style={{
          position:        'absolute',
          inset:           0,
          zIndex:          2,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          pointerEvents:   'none',
        }}>
          {/* Shape wrapper — native size to avoid upscale blur */}
          <div style={{ position: 'relative', width: 'min(48vw, 427px)', flexShrink: 0 }}>
            {/* Static glow behind shape */}
            <div aria-hidden style={{
              position:      'absolute',
              inset:         '-35%',
              borderRadius:  '50%',
              background:    'radial-gradient(ellipse, rgba(167,139,250,0.75) 0%, rgba(124,58,237,0.40) 45%, transparent 70%)',
              filter:        'blur(55px)',
              opacity:       0.55,
              pointerEvents: 'none',
            }} />
            {/* Shape image — async decode, no animation, native resolution */}
            <img
              src="/cases/shape-3d.png"
              alt=""
              decoding="async"
              loading="lazy"
              fetchPriority="low"
              style={{
                width:         '100%',
                height:        'auto',
                display:       'block',
                opacity:       0.72,
                mixBlendMode:  'screen',
                transform:     'rotate(-4deg)',
                userSelect:    'none',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Perspective wrapper — отдельный от overflow:hidden родителя */}
        <div style={{
          position:          'absolute',
          inset:             0,
          perspective:       '1200px',
          perspectiveOrigin: '50% 45%',
          zIndex:            3,
        }}>
          {/* Scene — лёгкий camera-sway, карточки живут в preserve-3d */}
          <div
            ref={sceneRef}
            style={{
              position:       'absolute',
              inset:          0,
              transformStyle: 'preserve-3d',
              transform:      'rotateX(-2deg) rotateY(5deg)',
              willChange:     'transform',
            }}
          >
            {cases.map((item, i) => (
              <FloatingCard
                key={item.name + i}
                item={item}
                placement={placements[i]!}
                cardRef={el => { cardRefs.current[i] = el }}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Header — z:10, поверх карточек */}
        <div style={{
          position:      'absolute',
          top: 0, left: 0, right: 0,
          zIndex:        10,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           10,
          textAlign:     'center',
          paddingTop:    96,
          paddingLeft:   24,
          paddingRight:  24,
          paddingBottom: 60,
          background:    'linear-gradient(to bottom, var(--brand-ink) 0%, var(--brand-ink) 48%, transparent 100%)',
        }}>
          <SectionEyebrow number="04" align="center" variant="dark">Кейсы клиентов</SectionEyebrow>
          <h2 className="font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl md:text-6xl">
            Стартапы, которые уже{' '}
            <span className="font-serif-accent italic text-brand-soft">спят спокойно</span>
          </h2>
        </div>

        {/* Bottom fade */}
        <div aria-hidden style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%',
          zIndex: 5, pointerEvents: 'none',
          background: 'linear-gradient(to top, var(--brand-ink) 0%, transparent 100%)',
        }} />

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 28, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
        }}>
          <svg width="16" height="28" viewBox="0 0 16 28" fill="none" aria-hidden style={{ opacity: 0.28 }}>
            <rect x="1" y="1" width="14" height="26" rx="7" stroke="white" strokeWidth="1.5"/>
            <motion.rect x="6.5" y="5" width="3" height="6" rx="1.5" fill="white"
              animate={reduced ? undefined : { y: [5, 13, 5] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
          </svg>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/28">scroll</span>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile: two marquee rows
// ─────────────────────────────────────────────────────────────────────────────

function MarqueeRow({ items, direction, duration }: {
  items: readonly CaseItem[]
  direction: 'left' | 'right'
  duration: number
}) {
  const reduced = useReducedMotion()
  const anim    = direction === 'left' ? 'marquee-left' : 'marquee-right'
  const track   = [...items, ...items]

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-brand-ink to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-brand-ink to-transparent" />
      <div
        className="flex w-max gap-4"
        style={reduced ? undefined : { animation: `${anim} ${duration}s linear infinite`, willChange: 'transform' }}
      >
        {track.map((item, i) => (
          <div key={`${item.name}-${i}`} style={{ width: 'min(300px, 85vw)', flexShrink: 0 }}>
            <div style={{ ...glassStyle, padding: '18px 20px 16px' }}>
              {/* specular rim */}
              <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'rgba(255,255,255,0.42)', pointerEvents:'none' }} />
              <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:'35%', background:'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)', pointerEvents:'none' }} />

              <p style={{ fontFamily:'var(--font-display)', fontSize:'1.75rem', fontWeight:900, lineHeight:1, letterSpacing:'-0.04em', color:'rgba(255,255,255,0.97)', textShadow:'0 0 20px rgba(167,139,250,0.50), 0 0 40px rgba(124,58,237,0.25)' }}>{item.metric}</p>
              <div style={{ marginTop:4, display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:'rgba(167,139,250,0.95)', boxShadow:'0 0 8px rgba(167,139,250,0.75)', flexShrink:0 }} />
                <p style={{ fontFamily:'var(--font-mono,monospace)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.22em', color:'rgba(167,139,250,0.80)', fontWeight:500 }}>{item.metricLabel}</p>
              </div>
              <p style={{ marginTop:12, fontSize:12, lineHeight:1.6, color:'rgba(255,255,255,0.55)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.did}</p>
              <div style={{ marginTop:14, height:1, background:'rgba(255,255,255,0.07)' }} />
              <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ ...glassChipStyle, width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.82)' }}>{item.initials}</span>
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, lineHeight:1.2, color:'rgba(255,255,255,0.88)' }}>{item.name}</p>
                  <div style={{ ...glassChipStyle, display:'inline-block', marginTop:3, padding:'1px 5px', borderRadius:3 }}>
                    <span style={{ fontFamily:'var(--font-mono,monospace)', fontSize:8, textTransform:'uppercase', letterSpacing:'0.18em', color:'rgba(255,255,255,0.38)', fontWeight:500 }}>{item.niche}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export function CasesMarquee() {
  const [cases, setCases] = useState<CaseItem[]>([])

  // Загрузка данных из CMS
  useEffect(() => {
    getCaseStudies()
      .then(studies => {
        if (studies.length > 0) {
          setCases(studies.map(caseStudyToCaseItem))
        } else {
          setCases(fallbackCases)
        }
      })
      .catch(() => {
        setCases(fallbackCases)
      })
  }, [])

  // Не рендерим ничего пока данные не загрузились
  if (cases.length === 0) return null

  const half = Math.ceil(cases.length / 2)

  return (
    <section id="cases" className="relative isolate bg-brand-ink noise-overlay">

      {/* Mobile */}
      <div className="lg:hidden">
        <div className="px-4 pb-8 pt-32 text-center sm:px-6">
          <FadeIn className="flex flex-col items-center gap-4">
            <SectionEyebrow number="04" align="center" variant="dark">Кейсы клиентов</SectionEyebrow>
            <h2 className="font-display text-4xl font-extrabold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
              Стартапы, которые уже{' '}
              <span className="font-serif-accent italic text-brand-soft">спят спокойно</span>
            </h2>
            <p className="mt-2 max-w-xl text-base text-white/50 sm:text-lg">
              От первой проводки до защиты гранта — конкретная ниша, задача, результат.
            </p>
          </FadeIn>
        </div>
        <div className="flex flex-col gap-5 pb-32">
          <MarqueeRow items={cases.slice(0, half)} direction="left"  duration={50} />
          <MarqueeRow items={cases.slice(half)}    direction="right" duration={62} />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <CasesScene cases={cases} />
      </div>

    </section>
  )
}