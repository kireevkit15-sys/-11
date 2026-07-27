'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { GithubLogo, Globe, TelegramLogo, ArrowRight } from '@phosphor-icons/react'
import type { Partner } from '@/data/partners'
import { cn } from '@/lib/utils'

const CATEGORY_LABEL: Record<Partner['category'], string> = {
  fullstack: 'Full-stack',
  mobile: 'Mobile',
  ai: 'AI / ML',
  devops: 'DevOps',
  design: 'Design',
  other: 'Другое',
}

export function AnnouncementCard({ item }: { item: Partner; featured?: boolean }) {
  const reduced = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)   // трансформируемый — только для style.transform
  const wrapRef = useRef<HTMLDivElement>(null)    // нетрансформируемая обёртка — для rect
  const borderRef = useRef<HTMLDivElement>(null)
  const spotRef = useRef<HTMLDivElement>(null)
  const rectRef = useRef<DOMRect | null>(null)
  const rafRef = useRef<number>(0)
  const [hovered, setHovered] = useState(false)
  const [finePointer, setFinePointer] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(pointer: fine)')
    const update = () => setFinePointer(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  // Текущие и целевые значения для lerp — только refs, никакого state
  const cur = useRef({ rx: 0, ry: 0, sx: 50, sy: 50 })
  const tgt = useRef({ rx: 0, ry: 0, sx: 50, sy: 50 })

  const hsl = `hsl(${item.hue}, 72%, 58%)`
  const hslDim = `hsl(${item.hue}, 55%, 25%)`
  const hslDeep = `hsl(${item.hue}, 60%, 15%)`
  const hslSoft = `hsla(${item.hue}, 72%, 58%, 0.45)`
  const hslFaint = `hsla(${item.hue}, 72%, 58%, 0.18)`

  // Единый RAF только во время hover: 3D lerp + spotlight без постоянной нагрузки на список
  useEffect(() => {
    if (reduced || !finePointer || !hovered) return
    const card = cardRef.current
    const spot = spotRef.current
    if (!card) return
    const LERP = 0.14

    const tick = () => {
      cur.current.rx += (tgt.current.rx - cur.current.rx) * LERP
      cur.current.ry += (tgt.current.ry - cur.current.ry) * LERP
      cur.current.sx += (tgt.current.sx - cur.current.sx) * LERP
      cur.current.sy += (tgt.current.sy - cur.current.sy) * LERP

      card.style.transform = `perspective(1000px) rotateX(${cur.current.rx.toFixed(3)}deg) rotateY(${cur.current.ry.toFixed(3)}deg)`

      if (spot) {
        spot.style.background = `radial-gradient(circle 160px at ${cur.current.sx.toFixed(1)}% ${cur.current.sy.toFixed(1)}%, ${hsl}18 0%, transparent 70%)`
        spot.style.opacity = '1'
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [hovered, reduced, hsl, finePointer])

  const onEnter = useCallback(() => {
    if (!finePointer) return
    if (cardRef.current) rectRef.current = cardRef.current.getBoundingClientRect()
    setHovered(true)
  }, [finePointer])

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !finePointer) return
    // Берём rect с нетрансформируемой обёртки — без feedback loop
    const r = wrapRef.current?.getBoundingClientRect()
    if (!r) return
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    tgt.current.rx = y * -6
    tgt.current.ry = x * 6
    tgt.current.sx = (x + 0.5) * 100
    tgt.current.sy = (y + 0.5) * 100
  }, [reduced, finePointer])

  const onLeave = useCallback(() => {
    setHovered(false)
    tgt.current.rx = 0
    tgt.current.ry = 0
    tgt.current.sx = 50
    tgt.current.sy = 50
    cur.current.rx = 0
    cur.current.ry = 0
    cur.current.sx = 50
    cur.current.sy = 50
    if (cardRef.current) cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
    if (spotRef.current) spotRef.current.style.opacity = '0'
    rectRef.current = null
  }, [])

  const initials = item.name.split(' ').slice(0, 2).map(w => w[0]).join('')

  return (
    <motion.div
      className="flex h-full flex-col"
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={wrapRef}
        className="relative flex h-full flex-col rounded-2xl"
        onMouseMove={onMove}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        animate={reduced || !finePointer ? undefined : {
          boxShadow: hovered
            ? [`0 0 42px ${hsl}45`, `0 0 68px ${hsl}60`, `0 0 42px ${hsl}45`]
            : `0 0 22px ${hsl}16`,
        }}
        transition={{ duration: hovered ? 0.75 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Animated border */}
        <div
          ref={borderRef}
          className={cn('announcement-card-border relative flex h-full flex-col rounded-2xl p-[1.5px]', hovered && 'is-hovered')}
          style={{
            ['--card-hsl' as string]: hsl,
            ['--card-hsl-soft' as string]: hslSoft,
            ['--card-hsl-faint' as string]: hslFaint,
          }}
        >
          <div
            ref={cardRef}
            className="relative flex h-full flex-col overflow-hidden rounded-[13px]"
            style={{
              transformStyle: 'preserve-3d',
              background: 'rgba(10,6,20,0.99)',
              willChange: 'transform',
            }}
          >
            {/* ── TOP HERO ZONE ── */}
            <div
              className="relative flex flex-col items-center px-5 pt-6 pb-5 text-center"
              style={{
                background: `linear-gradient(160deg, ${hslDeep} 0%, rgba(10,6,20,0.6) 100%)`,
                borderBottom: `1px solid ${hsl}20`,
              }}
            >
              {/* Aurora in hero */}
              <div aria-hidden className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(ellipse 100% 80% at 50% 0%, ${hsl}22 0%, transparent 65%)` }} />

              {/* Top rim */}
              <div aria-hidden className="pointer-events-none absolute top-0 left-8 right-8 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${hsl}90 50%, transparent)` }} />

              {/* Scan line */}
              {!reduced && (
                <motion.div aria-hidden className="pointer-events-none absolute left-0 right-0 z-10 h-[1px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${hsl}80 40%, rgba(251,146,60,0.5) 60%, transparent)` }}
                  animate={hovered ? { top: ['0%', '100%'] } : { top: '0%' }}
                  transition={{ duration: 1.2, repeat: hovered ? Infinity : 0, ease: 'linear' }}
                />
              )}

              {item.id === 'syntax-labs' || item.name === 'Syntax Labs' ? (
                /* ── SYNTAX LABS: full-width logo hero ── */
                <div className="relative z-10 flex flex-col items-center w-full gap-3">
                  {/* Full logo: icon + SYNTAX LABS text */}
                  <svg
                    viewBox="0 0 1241 633"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto"
                    style={{
                      maxWidth: '100%',
                      filter: `drop-shadow(0 0 20px ${hsl}90) drop-shadow(0 0 40px ${hsl}50)`,
                    }}
                  >
                    <g transform="translate(0,633) scale(0.1,-0.1)" fill="white" stroke="none">
                      <path d="M8964 4170 c-52 -39 -70 -73 -57 -107 3 -10 55 -86 115 -170 59 -83 111 -159 114 -167 5 -14 -100 -171 -243 -362 l-24 -32 50 -36 c63 -44 94 -53 124 -33 13 8 68 77 122 152 91 127 100 136 112 119 8 -11 62 -85 120 -166 l106 -147 41 28 c107 75 106 91 -19 268 -54 76 -109 152 -122 169 l-23 30 136 189 c74 103 133 193 130 200 -7 19 -98 75 -122 75 -42 0 -54 -12 -141 -134 -48 -66 -94 -131 -103 -143 -17 -21 -19 -19 -134 143 -65 90 -121 164 -125 163 -3 0 -29 -18 -57 -39z"/>
                      <path d="M4731 4180 c-45 -11 -80 -38 -102 -80 -17 -31 -19 -60 -19 -257 l0 -223 280 0 280 0 0 -90 0 -90 -281 0 -282 0 6 -46 c5 -52 29 -89 77 -121 32 -22 40 -23 295 -23 255 0 263 1 295 23 74 50 75 52 78 313 l3 234 -280 0 -281 0 0 85 0 85 281 0 282 0 -5 49 c-6 56 -35 104 -81 129 -28 15 -65 17 -272 19 -132 1 -255 -2 -274 -7z"/>
                      <path d="M5617 4175 c-51 -18 -85 -51 -98 -94 -6 -21 -9 -103 -7 -198 3 -145 5 -164 24 -189 42 -57 69 -69 165 -72 l89 -4 0 -184 0 -184 95 0 95 0 0 184 0 184 89 4 c96 3 123 15 165 72 19 25 21 44 24 194 3 158 2 170 -20 212 -26 50 -62 75 -125 85 l-43 7 0 -186 0 -186 -185 0 -185 0 0 185 0 185 -22 0 c-13 -1 -40 -7 -61 -15z"/>
                      <path d="M6471 4180 c-46 -11 -83 -40 -103 -81 -16 -30 -18 -70 -18 -382 0 -301 2 -354 16 -383 23 -47 67 -76 125 -82 l49 -5 0 279 0 279 183 -277 182 -277 41 -1 c46 0 94 27 128 73 20 27 21 41 24 375 2 302 1 353 -14 390 -19 51 -68 87 -131 97 l-43 7 -2 -283 -3 -282 -185 279 c-102 153 -192 280 -200 281 -8 0 -30 -2 -49 -7z"/>
                      <path d="M8134 4181 c-50 -13 -91 -48 -109 -94 -14 -36 -15 -89 -13 -389 3 -332 4 -348 24 -374 33 -44 68 -66 118 -71 l46 -6 0 97 0 96 185 0 185 0 0 -96 0 -97 49 5 c58 6 103 35 125 83 15 31 16 76 14 394 -3 348 -4 361 -24 388 -12 15 -36 37 -55 48 -31 18 -54 20 -274 22 -132 1 -254 -2 -271 -6z m436 -371 l0 -180 -185 0 -185 0 0 180 0 180 185 0 185 0 0 -180z"/>
                      <path d="M7259 4157 c-40 -26 -69 -79 -69 -124 l0 -33 135 0 135 0 0 -375 0 -375 100 0 100 0 0 375 0 374 138 3 137 3 3 25 c4 38 -38 110 -78 131 -31 17 -61 19 -301 19 -260 0 -267 -1 -300 -23z"/>
                      <path d="M3465 3929 c-19 -5 -145 -124 -366 -345 -294 -294 -339 -343 -348 -379 -22 -87 -19 -90 337 -448 180 -181 339 -335 354 -343 35 -18 111 -18 146 0 15 8 174 162 354 343 360 362 362 364 338 453 -11 40 -48 81 -333 368 -207 207 -336 330 -363 342 -43 21 -71 24 -119 9z m335 -484 l275 -275 -280 -280 -280 -280 -280 280 -280 280 275 275 c151 151 279 275 285 275 6 0 134 -124 285 -275z"/>
                      <path d="M3482 3517 c-12 -13 -22 -32 -22 -43 0 -12 57 -77 145 -164 l145 -145 -145 -145 c-80 -80 -145 -152 -145 -160 0 -16 49 -70 64 -70 20 0 366 354 366 375 0 24 -347 375 -371 375 -8 0 -25 -10 -37 -23z"/>
                      <path d="M4705 3046 c-41 -18 -83 -69 -90 -109 -3 -18 -5 -185 -3 -372 3 -338 3 -340 26 -373 43 -60 69 -67 247 -67 142 0 164 2 194 20 49 29 73 67 79 124 l5 51 -182 0 -181 0 0 370 0 370 -32 0 c-18 -1 -47 -7 -63 -14z"/>
                      <path d="M5400 3042 c-19 -11 -45 -34 -58 -53 l-23 -33 3 -372 3 -373 34 -35 c34 -35 118 -65 141 -51 6 3 10 44 10 96 l0 89 180 0 179 0 3 -92 3 -93 42 2 c54 2 98 28 126 73 22 34 22 43 22 390 0 337 -1 357 -20 389 -11 19 -33 43 -48 55 -27 20 -42 21 -295 24 -245 2 -270 1 -302 -16z m470 -357 l0 -185 -180 0 -180 0 0 185 0 185 180 0 180 0 0 -185z"/>
                      <path d="M6245 3035 l-25 -24 0 -446 0 -445 95 0 95 0 0 470 0 470 -70 0 c-62 0 -74 -3 -95 -25z"/>
                      <path d="M7010 3038 c-18 -13 -43 -36 -54 -51 -20 -27 -21 -41 -21 -260 l0 -232 278 -3 277 -2 0 -85 0 -85 -280 0 -280 0 0 -33 c0 -52 39 -119 85 -145 39 -22 46 -22 307 -20 251 3 268 4 294 24 68 51 69 52 72 310 l3 234 -280 0 -281 0 0 90 0 90 280 0 280 0 0 38 c0 49 -37 111 -80 133 -31 17 -61 19 -301 19 -259 0 -267 -1 -299 -22z"/>
                      <path d="M6592 2408 l3 -283 76 0 c50 0 82 5 92 14 15 12 17 45 17 282 l0 269 -95 0 -95 0 2 -282z"/>
                    </g>
                  </svg>
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <span className="relative overflow-hidden rounded-full bg-violet-600/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300 ring-1 ring-violet-500/35">
                      {!reduced && (
                        <motion.span className="pointer-events-none absolute inset-0 -skew-x-12"
                          style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.45) 50%, transparent)' }}
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 3 }} />
                      )}
                      ✦ Команда ДИВА
                    </span>
                    {item.available && (
                      <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5"
                        style={{ background: 'rgba(16,185,129,0.1)', boxShadow: '0 0 0 1px rgba(16,185,129,0.25)' }}>
                        <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                          animate={reduced ? undefined : { opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }} />
                        <span className="font-mono text-[9px] font-semibold text-emerald-400">Доступен</span>
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[11px] tracking-wide text-center" style={{ color: `${hsl}cc` }}>{item.role}</p>
                  <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
                    style={{ background: `${hsl}15`, boxShadow: `0 0 0 1px ${hsl}30` }}>
                    <motion.span className="h-1.5 w-1.5 rounded-full"
                      style={{ background: hsl, boxShadow: `0 0 5px ${hsl}` }}
                      animate={reduced ? undefined : { opacity: [1, 0.4, 1], scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }} />
                    <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: hsl }}>Full-stack · Mobile · AI</span>
                  </div>
                </div>
              ) : (
                /* ── REGULAR CARD: badges + avatar + name ── */
                <>
                  <div className="relative z-10 mb-4 flex items-center gap-1.5 flex-wrap justify-center">
                    {item.badge === 'team' ? (
                      <span className="relative overflow-hidden rounded-full bg-violet-600/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300 ring-1 ring-violet-500/35">
                        {!reduced && (
                          <motion.span className="pointer-events-none absolute inset-0 -skew-x-12"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.45) 50%, transparent)' }}
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 3 }} />
                        )}
                        ✦ Команда ДИВА
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[9px] font-medium text-white/35 ring-1 ring-white/[0.08]">Клиент</span>
                    )}
                    {item.available && (
                      <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5"
                        style={{ background: 'rgba(16,185,129,0.1)', boxShadow: '0 0 0 1px rgba(16,185,129,0.25)' }}>
                        <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                          animate={reduced ? undefined : { opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }} />
                        <span className="font-mono text-[9px] font-semibold text-emerald-400">Доступен</span>
                      </span>
                    )}
                  </div>
                  <div className="relative z-10 mb-3">
                    {item.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.logoUrl}
                        alt={item.name}
                        className="h-16 w-16 rounded-2xl object-contain"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          boxShadow: `0 0 0 3px ${hsl}30, 0 0 32px ${hsl}40, inset 0 1px 0 rgba(255,255,255,0.25)`,
                        }}
                      />
                    ) : (
                    <motion.div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl font-display text-xl font-extrabold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${hslDim}, ${hsl})`,
                        boxShadow: `0 0 0 3px ${hsl}30, 0 0 32px ${hsl}40, inset 0 1px 0 rgba(255,255,255,0.25)`,
                      }}
                      animate={reduced ? undefined : {
                        boxShadow: hovered
                          ? [`0 0 0 3px ${hsl}60, 0 0 48px ${hsl}70, inset 0 1px 0 rgba(255,255,255,0.25)`]
                          : [`0 0 0 3px ${hsl}25, 0 0 24px ${hsl}35, inset 0 1px 0 rgba(255,255,255,0.2)`,
                             `0 0 0 3px ${hsl}45, 0 0 40px ${hsl}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                             `0 0 0 3px ${hsl}25, 0 0 24px ${hsl}35, inset 0 1px 0 rgba(255,255,255,0.2)`],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {initials}
                    </motion.div>
                    )}
                    {item.available && (
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-emerald-400"
                        style={{ borderColor: hslDeep }}>
                        <motion.span className="absolute inset-0 rounded-full bg-emerald-400"
                          animate={reduced ? undefined : { scale: [1, 2.2], opacity: [0.5, 0] }}
                          transition={{ duration: 1.6, repeat: Infinity }} />
                      </span>
                    )}
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-display text-[17px] font-extrabold tracking-tight text-white leading-tight">{item.name}</h3>
                    <p className="mt-0.5 font-mono text-[11px] tracking-wide" style={{ color: `${hsl}cc` }}>{item.role}</p>
                  </div>
                  <div className="relative z-10 mt-3 flex items-center gap-1.5 rounded-full px-3 py-1"
                    style={{ background: `${hsl}15`, boxShadow: `0 0 0 1px ${hsl}30` }}>
                    <motion.span className="h-1.5 w-1.5 rounded-full"
                      style={{ background: hsl, boxShadow: `0 0 5px ${hsl}` }}
                      animate={reduced ? undefined : { opacity: [1, 0.4, 1], scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }} />
                    <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: hsl }}>
                      {CATEGORY_LABEL[item.category]}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* ── BOTTOM CONTENT ZONE ── */}
            <div className="relative flex flex-1 flex-col gap-3 p-5">
              {/* Dynamic spotlight — управляется через RAF */}
              {!reduced && (
                <div
                  ref={spotRef}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-0"
                  style={{ opacity: 0, transition: 'opacity 0.3s' }}
                />
              )}

              {/* Bio */}
              <p className="relative z-10 text-[12px] leading-[1.7] text-white/50 line-clamp-3">{item.bio}</p>

              {/* Skills grid */}
              <div className="relative z-10 flex flex-wrap gap-1.5">
                {item.skills.slice(0, 6).map((skill, i) => (
                  <motion.span
                    key={skill}
                    className="rounded-lg px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider cursor-default"
                    style={i < 3 ? {
                      background: `${hsl}15`,
                      color: hsl,
                      boxShadow: `0 0 0 1px ${hsl}30`,
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.35)',
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.07)',
                    }}
                    whileHover={reduced ? undefined : {
                      scale: 1.08,
                      background: `${hsl}28`,
                      color: '#fff',
                      boxShadow: `0 0 14px ${hsl}50, 0 0 0 1px ${hsl}60`,
                    }}
                    transition={{ duration: 0.15 }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>

              <div className="flex-1" />

              {/* Footer */}
              <div className="relative z-10 flex items-center gap-2 pt-3"
                style={{ borderTop: `1px solid ${hsl}15` }}>
                {/* Social links */}
                <div className="flex items-center gap-0.5">
                  {item.links?.github && (
                    <motion.a href={item.links.github} target="_blank" rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      whileHover={reduced ? undefined : { scale: 1.15, color: '#fff', boxShadow: `0 0 12px ${hsl}50` }}
                      transition={{ duration: 0.15 }}>
                      <GithubLogo size={14} weight="duotone" />
                    </motion.a>
                  )}
                  {item.links?.portfolio && (
                    <motion.a href={item.links.portfolio} target="_blank" rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      whileHover={reduced ? undefined : { scale: 1.15, color: '#fff', boxShadow: `0 0 12px ${hsl}50` }}
                      transition={{ duration: 0.15 }}>
                      <Globe size={14} weight="duotone" />
                    </motion.a>
                  )}
                  {item.links?.telegram && (
                    <motion.a href={item.links.telegram} target="_blank" rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      whileHover={reduced ? undefined : { scale: 1.15, color: '#fff', boxShadow: `0 0 12px ${hsl}50` }}
                      transition={{ duration: 0.15 }}>
                      <TelegramLogo size={14} weight="duotone" />
                    </motion.a>
                  )}
                </div>

                <motion.a
                  href={item.links?.telegram ?? `https://t.me/${(item.contact ?? '').replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group ml-auto flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${hsl}25, ${hsl}15)`,
                    color: hsl,
                    boxShadow: `0 0 0 1px ${hsl}40, 0 4px 16px ${hsl}12`,
                  }}
                  whileHover={reduced ? undefined : {
                    scale: 1.04,
                    color: '#fff',
                    boxShadow: `0 0 0 1px ${hsl}80, 0 4px 28px ${hsl}40`,
                  }}
                  transition={{ duration: 0.18 }}
                >
                  Связаться
                  <ArrowRight size={13} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </motion.a>
              </div>
            </div>

            {/* Bottom progress line */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${hsl}, #FB923C, ${hsl})` }}
              animate={{ width: hovered ? '100%' : '0%' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
