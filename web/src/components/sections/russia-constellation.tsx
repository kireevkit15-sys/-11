'use client'

import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import {
  Anchor,
  Boat,
  Bridge,
  Buildings,
  CastleTurret,
  Factory,
  MapPin,
  MapTrifold,
  Mountains,
  Snowflake,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import data from '@/data/geo/russia-silhouette.json'
import {
  DISTRICTS,
  DISTRICT_ORDER,
  TOTAL_CLIENTS,
  getDistrictColor,
  type DistrictCode,
} from '@/data/clients-by-district'

/* ────────────────────────────────────────────────────────────
 *  Типы и константы
 * ──────────────────────────────────────────────────────────── */

type City = {
  code: string
  name: string
  x: number
  y: number
}

type TooltipPos = { x: number; y: number }

const CITIES = data.cities as ReadonlyArray<City>

/** Москва — корень всех network-линий. */
const MOSCOW: City = CITIES.find((c) => c.code === 'CFD') ?? {
  code: 'CFD',
  name: 'Москва',
  x: 263,
  y: 471,
}

/** Все города кроме Москвы — концы линий. */
const OTHER_CITIES = CITIES.filter((c) => c.code !== 'CFD')

/** Регионов в каждом округе — для tooltip. */
const REGION_COUNTS: Record<string, number> = {
  CFD: 17,
  NWFO: 10,
  SFO: 7,
  NCFD: 7,
  VFD: 14,
  UrFO: 6,
  SFD: 10,
  FEFO: 11,
}

/** Знаковая достопримечательность / символ каждого округа.
 *  Phosphor duotone — premium two-layer icons. */
const LANDMARK_ICONS: Record<DistrictCode, PhosphorIcon> = {
  CFD: CastleTurret,        // Москва — Кремль
  NWFO: Anchor,       // СПб — морская столица
  SFO: Boat,          // Ростов-на-Дону — порт на Дону
  NCFD: Mountains,    // Кавказ
  VFD: Buildings,     // Казань — городская агломерация
  UrFO: Factory,      // Урал — промышленность
  SFD: Snowflake,     // Сибирь
  FEFO: Bridge,       // Владивосток — Золотой мост
}

/** Краткое описание ландшафта округа — editorial микрокопия. */
const DISTRICT_BLURB: Record<DistrictCode, string> = {
  CFD: 'Историческое и финансовое сердце страны',
  NWFO: 'Балтика, Белое море и северная экспедиция',
  SFO: 'Чёрное море, Дон и Кубанская житница',
  NCFD: 'Горы Кавказа и курортный юг',
  VFD: 'Поволжье — индустрия, наука и нефтехимия',
  UrFO: 'Урал — металлургия и добыча',
  SFD: 'Сибирь — Алтай, Енисей и Байкал рядом',
  FEFO: 'Океан, мост и ворота в Азию',
}

/* ────────────────────────────────────────────────────────────
 *  Tooltip — премиум-карточка с прогресс-баром и иконками
 * ──────────────────────────────────────────────────────────── */

function ConstellationTooltip({
  code,
  pos,
}: {
  code: DistrictCode
  pos: TooltipPos
}) {
  const d = DISTRICTS[code]
  if (!d) return null
  const pct = TOTAL_CLIENTS ? (d.clients / TOTAL_CLIENTS) * 100 : 0
  const regionCount = REGION_COUNTS[code] ?? 0
  const Landmark = LANDMARK_ICONS[code]
  const blurb = DISTRICT_BLURB[code]
  // Editorial номер «8 ИЗ 8» — позиция округа в порядке.
  const positionIndex = DISTRICT_ORDER.indexOf(code) + 1
  const totalDistricts = DISTRICT_ORDER.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed z-50 -mt-4 w-[340px] -translate-x-1/2 -translate-y-full overflow-hidden rounded-[20px] border border-white/[0.08] bg-brand-ink/97 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* ═══ HERO: landmark icon + позиция/код ═══ */}
      <div className="relative overflow-hidden border-b border-white/[0.06] px-7 pb-5 pt-7">
        {/* Очень subtle угловое свечение цвета округа — единственный «brand cue» */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-[0.18] blur-3xl"
          style={{ backgroundColor: d.color }}
        />

        <div className="relative flex items-start justify-between">
          {/* Landmark icon — duotone, крупный, в цвете округа */}
          <Landmark
            weight="duotone"
            className="h-14 w-14"
            style={{ color: d.color }}
          />

          {/* Позиционная метка editorial */}
          <div className="flex flex-col items-end pt-1">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-white/35">
              {String(positionIndex).padStart(2, '0')} / {String(totalDistricts).padStart(2, '0')}
            </span>
            <span
              className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ color: d.color }}
            >
              {d.shortName}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="px-7 pb-6 pt-5">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.04, duration: 0.2 }}
          className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.22em] text-white/40"
        >
          Федеральный округ
        </motion.div>

        {/* Big editorial heading */}
        <motion.h4
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.25 }}
          className="mt-1 font-display text-[26px] font-extrabold leading-[1.05] tracking-[-0.025em] text-white"
        >
          {d.name}
        </motion.h4>

        {/* Editorial blurb */}
        {blurb && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.25 }}
            className="mt-2 font-serif-accent text-[13px] italic leading-snug text-white/55"
          >
            {blurb}
          </motion.p>
        )}

        {/* HUGE number — editorial hero */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3 }}
          className="mt-6 flex items-end justify-between gap-3"
        >
          <div className="flex items-baseline gap-2">
            <span
              className="font-display text-[64px] font-extrabold leading-none tabular-nums tracking-[-0.05em]"
              style={{ color: d.color }}
            >
              {d.clients}
            </span>
            <div className="flex flex-col pb-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">
                клиентов
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
                {pct.toFixed(1)}% от {TOTAL_CLIENTS}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Тонкая horizontal линия — editorial accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 h-px origin-left"
          style={{
            background: `linear-gradient(90deg, ${d.color}, transparent 70%)`,
          }}
        />

        {/* ═══ STATS — асимметричный 2-col grid ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.25 }}
          className="mt-5 grid grid-cols-2 gap-5"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <MapPin
                weight="duotone"
                className="h-3 w-3"
                style={{ color: d.color }}
              />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Столица
              </span>
            </div>
            <span className="mt-1 font-display text-[14px] font-bold leading-tight text-white">
              {d.capital}
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <MapTrifold
                weight="duotone"
                className="h-3 w-3"
                style={{ color: d.color }}
              />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Регионов
              </span>
            </div>
            <span className="mt-1 font-display text-[14px] font-bold leading-tight text-white">
              {regionCount}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────────────────
 *  Главный компонент: Constellation — лёгкая карта-метафора
 * ──────────────────────────────────────────────────────────── */

export function RussiaConstellation() {
  const reduced = useReducedMotion()
  const [hovered, setHovered] = useState<DistrictCode | null>(null)
  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null)

  const handleEnter = (code: string, e: ReactMouseEvent) => {
    setHovered(code as DistrictCode)
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  const handleMove = (e: ReactMouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  const handleLeave = () => {
    setHovered(null)
    setTooltipPos(null)
  }

  const vb = data.viewBox

  return (
    <div className="relative w-full">
      <svg
        viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Карта России — 8 федеральных округов с распределением клиентов"
        className="h-auto w-full"
        style={{ shapeRendering: 'geometricPrecision' }}
      >
        <defs>
          {/* Per-line linearGradient — Москва violet → city color */}
          {OTHER_CITIES.map((c) => (
            <linearGradient
              key={`line-${c.code}`}
              id={`line-${c.code}`}
              gradientUnits="userSpaceOnUse"
              x1={MOSCOW.x}
              y1={MOSCOW.y}
              x2={c.x}
              y2={c.y}
            >
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.95" />
              <stop
                offset="100%"
                stopColor={getDistrictColor(c.code)}
                stopOpacity="0.95"
              />
            </linearGradient>
          ))}

          {/* ── NEON FILTERS ── мягкое свечение для линий-границ ── */}
          <filter
            id="neon-glow-soft"
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <filter
            id="neon-glow-strong"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
        </defs>

        <style>{`
          @keyframes constellation-pulse {
            0%   { transform: scale(1); opacity: 0.7; }
            100% { transform: scale(3.2); opacity: 0; }
          }
          @keyframes neon-silhouette-breath {
            0%, 100% { opacity: 0.45; }
            50%      { opacity: 0.85; }
          }
          @keyframes neon-line-breath {
            0%, 100% { opacity: 0.30; }
            50%      { opacity: 0.55; }
          }
          .neon-silhouette-glow { animation: neon-silhouette-breath 4.8s ease-in-out infinite; }
          .neon-line-glow       { animation: neon-line-breath 5.2s ease-in-out infinite; }
        `}</style>

        {/* ════════ LAYER 1: SILHOUETTE — неоновая граница России ════════ */}
        {/* Двухслойная техника: размытый glow снизу + тонкая чёткая линия сверху */}

        {/* 1A. Glow — широкий blurred stroke, дышит */}
        <path
          className="neon-silhouette-glow"
          d={data.silhouettePath}
          fill="none"
          stroke="#A78BFA"
          strokeWidth={4}
          strokeLinejoin="round"
          filter="url(#neon-glow-strong)"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />

        {/* 1B. Sharp — тонкая яркая линия с лёгкой violet-заливкой */}
        <path
          d={data.silhouettePath}
          fill="rgba(167, 139, 250, 0.05)"
          stroke="rgba(220, 210, 255, 0.95)"
          strokeWidth={1.2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />

        {/* ════════ LAYER 2: NETWORK LINES — неон-лучи Москва → города ════════ */}

        {/* 2A. Glow слой — blurred, дышит, цветом города */}
        <g
          pointerEvents="none"
          filter="url(#neon-glow-soft)"
          className="neon-line-glow"
        >
          {OTHER_CITIES.map((c) => {
            const isActive = hovered === c.code || hovered === 'CFD'
            const cityColor = getDistrictColor(c.code)
            return (
              <line
                key={`glow-${c.code}`}
                x1={MOSCOW.x}
                y1={MOSCOW.y}
                x2={c.x}
                y2={c.y}
                stroke={cityColor}
                strokeWidth={isActive ? 3.2 : 1.8}
                strokeOpacity={isActive ? 0.85 : 0.45}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{
                  transition:
                    'stroke-width 240ms ease, stroke-opacity 240ms ease',
                }}
              />
            )
          })}
        </g>

        {/* 2B. Sharp слой — тонкая чёткая линия */}
        <g pointerEvents="none">
          {OTHER_CITIES.map((c) => {
            const isActive = hovered === c.code || hovered === 'CFD'
            const cityColor = getDistrictColor(c.code)
            return (
              <line
                key={c.code}
                x1={MOSCOW.x}
                y1={MOSCOW.y}
                x2={c.x}
                y2={c.y}
                stroke={cityColor}
                strokeWidth={isActive ? 1.4 : 0.9}
                strokeOpacity={isActive ? 0.95 : 0.55}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{
                  transition:
                    'stroke-width 240ms ease, stroke-opacity 240ms ease',
                }}
              />
            )
          })}
        </g>

        {/* ════════ LAYER 3: CITY MARKERS — Swiss-minimalism ════════ */}
        {/* Гайд из skill: «Single accent, minimal decoration, clear hierarchy».
            Каждый маркер — solid dot в цвете округа + чистый 2-line label.
            Без неона, без halo, без target-композиции. */}
        <g>
          {CITIES.map((c, idx) => {
            const meta = DISTRICTS[c.code as DistrictCode]
            const color = getDistrictColor(c.code)
            const isActive = hovered === c.code
            const isMoscow = c.code === 'CFD'
            const baseR = isMoscow ? 7 : 5
            const clients = meta?.clients ?? 0
            return (
              // Outer <g>: SVG transform для positioning (не трогаем).
              <g key={c.code} transform={`translate(${c.x}, ${c.y})`}>
                {/* Inner <g>: CSS transform для hover-scale.
                    Разделение outer/inner — иначе CSS scale перезатирает SVG translate
                    и все маркеры оказываются в (0,0). */}
                <g
                  style={{
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {/* 1. Pulse-ring — единственная анимация, очень тонкая */}
                  {!reduced && (
                    <circle
                      cx={0}
                      cy={0}
                      r={baseR}
                      fill="none"
                      stroke={color}
                      strokeWidth={1}
                      strokeOpacity={0.6}
                      style={{
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                        animation:
                          'constellation-pulse 2.8s ease-out infinite',
                        animationDelay: `${idx * 0.22}s`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* 2. Solid color dot — главный элемент, без glow */}
                  <circle
                    cx={0}
                    cy={0}
                    r={baseR}
                    fill={color}
                    stroke="rgba(255, 255, 255, 0.95)"
                    strokeWidth={isMoscow ? 2.5 : 1.8}
                  />

                  {/* 3. Hero-индикатор для Москвы — белая точка в центре */}
                  {isMoscow && (
                    <circle cx={0} cy={0} r={2} fill="#FFFFFF" />
                  )}
                </g>

                {/* ─── 2-line editorial label справа ─── */}
                <g
                  transform={`translate(${baseR + 8}, 0)`}
                  pointerEvents="none"
                >
                  {/* Line 1 — City name, display sans, tight */}
                  <text
                    x={0}
                    y={-2}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: isMoscow ? '13px' : '11px',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      fill: '#FFFFFF',
                    }}
                    paintOrder="stroke"
                    stroke="#0F0B1E"
                    strokeWidth={3.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  >
                    {c.name}
                  </text>
                  {/* Line 2 — short code + count, mono micro, faded */}
                  <text
                    x={0}
                    y={9}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      fill: 'rgba(255, 255, 255, 0.55)',
                    }}
                    paintOrder="stroke"
                    stroke="#0F0B1E"
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  >
                    {meta?.shortName ?? c.code} · {clients}
                  </text>
                </g>
              </g>
            )
          })}
        </g>

        {/* ════════ LAYER 4: HIT AREAS — невидимые круги для удобного hover ════════ */}
        <g>
          {CITIES.map((c) => {
            const meta = DISTRICTS[c.code as DistrictCode]
            const label = meta
              ? `${meta.name} ФО — ${meta.clients} клиентов`
              : c.name
            return (
              <circle
                key={`hit-${c.code}`}
                cx={c.x}
                cy={c.y}
                r={20}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => handleEnter(c.code, e)}
                onMouseMove={handleMove}
                onMouseLeave={handleLeave}
                onFocus={() => setHovered(c.code as DistrictCode)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                role="button"
                aria-label={label}
              />
            )
          })}
        </g>
      </svg>

      {/* ════════ LEGEND — Ticker tape с неон-границами ════════ */}
      {/* Верхняя/нижняя border — violet с лёгким glow.
          Вертикальные дивайдеры — neon-вспышка цвета округа на hover.
          Топовая color-линия каждой ячейки — всегда подсвечена. */}
      <div
        className="mt-8 grid grid-cols-3 overflow-hidden rounded-2xl border border-brand-soft/20 sm:mt-12 sm:grid-cols-9 sm:rounded-none sm:border-y sm:border-x-0 sm:border-brand-soft/25 [&>*]:border-l [&>*]:border-t [&>*]:border-brand-soft/15 [&>*:nth-child(-n+3)]:border-t-0 sm:[&>*]:border-t-0 sm:[&>*:first-child]:border-l-0"
        style={{
          boxShadow:
            '0 0 18px rgba(167,139,250,0.18), inset 0 0 0 1px rgba(167,139,250,0.06)',
        }}
      >
        {DISTRICT_ORDER.map((code) => {
          const d = DISTRICTS[code]
          if (!d) return null
          const isHovered = hovered === code
          const dimmed = hovered !== null && !isHovered
          return (
            <button
              key={code}
              type="button"
              onMouseEnter={() => setHovered(code)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(code)}
              onBlur={() => setHovered(null)}
              className={`group relative flex min-h-[72px] flex-col items-center justify-center gap-1 px-2 py-3 transition-colors sm:min-h-0 sm:gap-1.5 sm:py-3.5 ${
                isHovered ? 'bg-white/[0.04]' : ''
              }`}
              style={{
                opacity: dimmed ? 0.45 : 1,
                transition: 'opacity 240ms ease, background-color 240ms ease',
              }}
            >
              {/* Цветная топовая линия — всегда glow, на hover усиливается */}
              <span
                aria-hidden
                className="absolute left-0 right-0 top-0 h-px transition-all duration-300"
                style={{
                  backgroundColor: d.color,
                  opacity: isHovered ? 1 : 0.65,
                  boxShadow: isHovered
                    ? `0 0 12px ${d.color}, 0 1px 4px ${d.color}`
                    : `0 0 5px ${d.color}80`,
                }}
              />
              {/* Mono label сверху */}
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55 sm:text-[9px] sm:tracking-[0.2em]">
                {d.shortName}
              </span>
              {/* Display число снизу — крупное, в цвете округа */}
              <span
                className="font-display text-[18px] font-extrabold leading-none tabular-nums tracking-[-0.03em] transition-all duration-300 sm:text-[22px]"
                style={{
                  color: d.color,
                  textShadow: isHovered ? `0 0 14px ${d.color}80` : 'none',
                }}
              >
                {d.clients}
              </span>
            </button>
          )
        })}

        {/* ИТОГ — отдельная ячейка с коралловым неон-акцентом */}
        <div className="relative flex min-h-[72px] flex-col items-center justify-center gap-1 bg-white/[0.03] px-2 py-3 sm:min-h-0 sm:gap-1.5 sm:py-3.5">
          <span
            aria-hidden
            className="absolute left-0 right-0 top-0 h-px bg-brand-accent"
            style={{ boxShadow: '0 0 10px rgba(251,146,60,0.7), 0 1px 4px rgba(251,146,60,0.4)' }}
          />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60 sm:text-[9px] sm:tracking-[0.2em]">
            всего
          </span>
          <span
            className="font-display text-[18px] font-extrabold leading-none tabular-nums tracking-[-0.03em] text-white sm:text-[22px]"
            style={{ textShadow: '0 0 12px rgba(251,146,60,0.45)' }}
          >
            {TOTAL_CLIENTS}
          </span>
        </div>
      </div>

      {/* Тонкая editorial-подпись под legend */}
      <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">
        <span>8 федеральных округов</span>
        <span>сводная статистика</span>
      </div>

      {/* Cursor-following tooltip */}
      <AnimatePresence>
        {hovered && tooltipPos && (
          <ConstellationTooltip code={hovered} pos={tooltipPos} />
        )}
      </AnimatePresence>
    </div>
  )
}
