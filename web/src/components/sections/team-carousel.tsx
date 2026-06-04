'use client'

import { useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useInView,
} from 'motion/react'

import { FadeIn } from '@/components/motion/fade-in'
import { CountUp } from '@/components/motion/count-up'
import { SectionEyebrow } from '@/components/sections/section-eyebrow'

// ─────────────────────────────────────────────────────────────────────────────
// Data — реальные данные из docx «Сотрудлники Дива.docx», 2026-05-18
// Павла Бантьева в файле нет — оставлен с инициалами, фото запросим отдельно.
// ─────────────────────────────────────────────────────────────────────────────

type Member = {
  initials: string
  name: string
  role: string
  stat: string
  statLabel: string
  photo?: string
  isFounder?: boolean
  details?: {
    education?: string
    specialization?: string
    quote?: string
    about?: string
    certificates?: string[]
  }
}

type TeamGroupId = 'accounting' | 'fsi-consultants'

type TeamGroup = {
  num: string
  id: TeamGroupId
  label: string
  description: string
  members: Member[]
}

const teamGroups: TeamGroup[] = [
  {
    num: '01',
    id: 'accounting',
    label: 'Бухгалтерия',
    description: 'Закреплённый личный бухгалтер для каждого клиента',
    members: [
      {
        initials: 'ПБ',
        name: 'Павел Бантьев',
        role: 'Основатель и директор',
        stat: '488',
        statLabel: 'проектов',
        isFounder: true,
        photo: '/team/bantiev-pavel.jpg',
        details: {
          about: '5 лет работы с грантами ФСИ. Знаем каждый этап изнутри.',
        },
      },
      {
        initials: 'ОЧ',
        name: 'Ольга Чекаленко',
        role: 'Главный бухгалтер',
        stat: '12 лет',
        statLabel: 'опыта',
        photo: '/team/chekalenko-olga.png',
        details: {
          education:
            'Бакалавр по направлению «Менеджмент» (профиль «Производственный менеджмент»), Национальный исследовательский Томский политехнический университет.',
          specialization:
            'Главный бухгалтер с опытом работы 12 лет, из них 5 лет — главным бухгалтером. До этого — бухгалтер по материальным запасам и банку.',
          about:
            'Оперативно решаю сложные задачи, подстраиваюсь под частые изменения законодательства, взаимодействую с контролирующими органами и нахожу ответ на любой, даже очень сложный вопрос. Работа доставляет мне большое удовольствие — приятно видеть, как дело клиента растёт и развивается, и понимать, что в этом есть и мой вклад.',
        },
      },
      {
        initials: 'ПА',
        name: 'Петрова Альбина',
        role: 'Бухгалтер · НМА и IT-аккредитация',
        stat: '5 лет',
        statLabel: 'опыта',
        photo: '/team/petrova-albina.png',
        details: {
          education:
            'Алтайский государственный университет. Множество курсов повышения квалификации.',
          specialization:
            'Специализация — работа с нематериальными активами. Помимо бухгалтерского и налогового учёта занимается получением IT-аккредитации в стартапах клиентов.',
        },
      },
      {
        initials: 'ОН',
        name: 'Новикова Ольга',
        role: 'Бухгалтер · оптимизация налогов',
        stat: '26 лет',
        statLabel: 'общий стаж',
        photo: '/team/novikova-olga.png',
        details: {
          education:
            'Московский государственный университет коммерции (1995–2000), управление предприятием. Алтайский государственный технический университет им. И. И. Ползунова (2004), оценка стоимости бизнеса. Государственный университет по землеустройству (2012), оценочная деятельность.',
          specialization:
            'Бухгалтер широкого профиля. Помимо серийного бухгалтерского учёта в стартапах, специализируется на оптимизации налоговой нагрузки клиентов.',
          about: 'Общий стаж 26 лет, профильный — 10 лет.',
        },
      },
      {
        initials: 'МН',
        name: 'Назимова Майя',
        role: 'Бухгалтер',
        stat: '2023',
        statLabel: 'в команде с',
        photo: '/team/nazimova-maya.png',
        details: {
          education:
            'Томский политехнический университет, «Бизнес-аналитика и бухгалтерский учёт». Удостоверение о повышении квалификации бухгалтера, 2023.',
          about:
            'Знания по специальности я применяла в работе с финансами всю жизнь, а в профессиональную бухгалтерию пришла после получения удостоверения о повышении квалификации в 2023 году — и сразу в команду «Дива».',
        },
      },
      {
        initials: 'ВТ',
        name: 'Титаева Валентина',
        role: 'Бухгалтер · финансовая отчётность',
        stat: '4 года',
        statLabel: 'опыта',
        photo: '/team/titaeva-valentina.png',
        details: {
          education:
            'Бакалавр по направлению «Менеджмент» (профиль «Производственный менеджмент»), Национальный исследовательский Томский политехнический университет. Курсы: бухгалтерский учёт и аудит, финансовый менеджмент.',
          specialization:
            'Разработала систему финансовой отчётности по торговым точкам для томского бренда одежды Daisyknit. Принимала участие в разработке системы нормирования труда для сети ресторанов «Дыхание Вока».',
          quote:
            'Бухгалтер — это не тот, кто считает чужие деньги, а тот, кто не даёт их потерять.',
        },
      },
      {
        initials: 'ТЗ',
        name: 'Зубарева Татьяна',
        role: 'Бухгалтер · автоматизация учёта',
        stat: '3 года',
        statLabel: 'опыта',
        photo: '/team/zubareva-tatiana.png',
        details: {
          education:
            'Высшее экономическое, ФГАОУ ВУ «Национальный исследовательский Томский политехнический университет». Магистратура по направлению «Цифровая экономика и финансы» (в процессе).',
          about:
            'Люблю обеспечивать порядок в финансах так, чтобы клиенты не отвлекались на рутину. Оказываю помощь в любых ситуациях — не люблю бездействие. Умею оперативно вникать в любые, даже малознакомые области учёта.',
          quote: 'Доверяй, но проверяй. А лучше — пересчитай!',
          certificates: [
            'Сертификат участника практической конференции «План Бухгалтера» от Контура',
            'Сертификат участника 20-го юбилейного Всероссийского конкурса по «1С: Бухгалтерия 8»',
          ],
        },
      },
      {
        initials: 'КМ',
        name: 'Мордвинова Кристина',
        role: 'Бухгалтер · воинский учёт',
        stat: '8 лет',
        statLabel: 'опыта',
        photo: '/team/mordvinova-kristina.png',
        details: {
          education:
            'Бакалавриат — ТУСУР, экономический факультет. Магистратура — Томский экономико-юридический институт, бухгалтерский учёт на предприятии.',
          specialization:
            'Бухгалтер широкого профиля. Специализируется на воинском учёте организаций.',
        },
      },
      {
        initials: 'МИ',
        name: 'Исакова Мария',
        role: 'Бухгалтер · автоматизация',
        stat: '9 лет',
        statLabel: 'опыта',
        photo: '/team/isakova-maria.png',
        details: {
          education:
            'Казанский федеральный университет, управление бизнесом. КФУ, курсы повышения квалификации — бухгалтерский учёт на предприятии.',
          specialization:
            'Специализируется на автоматизации процессов бухгалтерского учёта.',
        },
      },
    ],
  },
  {
    num: '02',
    id: 'fsi-consultants',
    label: 'Консультанты по грантам ФСИ',
    description:
      'Сопровождение программ «Студенческий стартап», «Старт» и других конкурсов Фонда содействия инновациям',
    members: [
      {
        initials: 'ДБ',
        name: 'Белоусова Диана',
        role: 'Консультант · «Студенческий стартап»',
        stat: '4 года',
        statLabel: 'опыта',
        photo: '/team/belousova-diana.jpeg',
        details: {
          education:
            'ТУСУР, высшее по специальности «Управление качеством». Диплом о профессиональной переподготовке ТУСУР — «Информационная безопасность. Техническая защита конфиденциальной информации». Удостоверение о повышении квалификации БГТУ ВОЕНМЕХ — «Технологическое предпринимательство и бизнес-планирование».',
          about:
            'Живу по принципу «лучше попробовать, чем ничего не сделать и пожалеть». Мне нравится бросать себе вызовы и видеть, как растут мои границы возможностей. В работе ставлю качество выше скорости. В свободное время люблю путешествия, музыку и творческие занятия.',
          quote: 'Качество важнее спешки.',
        },
      },
      {
        initials: 'АМ',
        name: 'Мазюк Алина',
        role: 'Консультант · «Студенческий стартап»',
        stat: '15 лет',
        statLabel: 'общий стаж',
        photo: '/team/mazyuk-alina.jpeg',
        details: {
          education:
            'Психология — НОУ ВО «Московский социально-педагогический институт» и ЧОУ ВО «Восточная экономико-юридическая гуманитарная академия». Повышение квалификации в ТУСУР («Защита персональных данных», «Система ДПО организации») и СГТУ им. Гагарина («Технологии продвижения в социальных цифровых медиа»).',
          specialization:
            'Общий стаж 15 лет, профильный по работе с ФСИ — 5 лет. 12-летний опыт работы в университете по программам дополнительного образования.',
          about:
            'По образованию — психолог. Последние 5 лет оказываю помощь в подготовке отчётности по грантам ФСИ. Мне интересна работа, связанная с общением, расширением круга контактов среди творческих и неординарных людей, и участие в проектах, которые сами по себе — нестандартные и увлекательные.',
          quote:
            'Студенты дают идеи. Фонд даёт деньги. Мы — спокойствие. Работает.',
        },
      },
      {
        initials: 'ПЗ',
        name: 'Золотухина Полина',
        role: 'Консультант · «Старт»',
        stat: '5 лет',
        statLabel: 'общий стаж',
        photo: '/team/zolotukhina-polina.png',
        details: {
          education:
            'Бакалавриат ФГАОУ ВУ «Национальный исследовательский Томский политехнический университет», направление «Экономика». Магистратура по направлению «Цифровая экономика и финансы».',
          specialization:
            'Общий опыт работы 5 лет, профильный по работе с грантами ФСИ — 3 года.',
        },
      },
    ],
  },
]

const totalCount = teamGroups.reduce((acc, g) => acc + g.members.length, 0)

// ─────────────────────────────────────────────────────────────────────────────
// Photo gradients (для карточки без фото — Павел)
// ─────────────────────────────────────────────────────────────────────────────

// Палитра построена из var(--brand-primary | --brand-soft | --brand-accent)
// через color-mix — централизованная замена hardcoded rgba.
const photoGradients = [
  'linear-gradient(145deg, color-mix(in srgb, var(--brand-primary) 55%, transparent) 0%, color-mix(in srgb, var(--brand-primary) 35%, transparent) 50%, color-mix(in srgb, var(--brand-soft) 25%, transparent) 100%)',
  'linear-gradient(145deg, color-mix(in srgb, var(--brand-primary) 50%, transparent) 0%, color-mix(in srgb, var(--brand-primary) 30%, transparent) 60%, color-mix(in srgb, var(--brand-accent) 15%, transparent) 100%)',
  'linear-gradient(145deg, color-mix(in srgb, var(--brand-soft) 45%, transparent) 0%, color-mix(in srgb, var(--brand-primary) 40%, transparent) 55%, color-mix(in srgb, var(--brand-primary) 20%, transparent) 100%)',
]

// ─────────────────────────────────────────────────────────────────────────────
// Variants — кинематографичный stagger entrance
// ─────────────────────────────────────────────────────────────────────────────

const SMOOTH_EASE = [0.16, 1, 0.3, 1] as const
const FAST_EASE = [0.4, 0, 1, 1] as const

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

const cardVariant = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.94,
    filter: 'blur(8px)',
    rotateX: 6,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    rotateX: 0,
    transition: { duration: 0.85, ease: SMOOTH_EASE },
  },
}

// «Луч на герое»: неактивные карточки в группе приглушаются, когда открыта другая
const dimmedStyle = {
  opacity: 0.42,
  scale: 0.97,
  filter: 'blur(2px)',
}
const focusedStyle = { opacity: 1, scale: 1, filter: 'blur(0px)' }

// ─────────────────────────────────────────────────────────────────────────────
// MemberCard — карточка с раскрытием детали по клику
// ─────────────────────────────────────────────────────────────────────────────

function MemberCard({
  member,
  memberId,
  index,
  isOpen,
  isAnyOpen,
  onToggle,
  cardRootRef,
}: {
  member: Member
  memberId: string
  index: number
  isOpen: boolean
  isAnyOpen: boolean
  onToggle: () => void
  cardRootRef?: (el: HTMLElement | null) => void
}) {
  const reduced = useReducedMotion()
  const tiltRef = useRef<HTMLDivElement>(null)
  const num = String(index + 1).padStart(2, '0')
  const gradient = photoGradients[index % photoGradients.length]
  const hasPhoto = !!member.photo
  const hasDetails = !!member.details
  const isFounder = !!member.isFounder

  const targetTilt = useRef({ x: 0, y: 0 })
  const currentTilt = useRef({ x: 0, y: 0 })
  const rafId = useRef<number>(0)
  const isHovered = useRef(false)

  function animateTilt() {
    const el = tiltRef.current
    if (!el) return
    const t = targetTilt.current
    const c = currentTilt.current
    c.x += (t.x - c.x) * 0.12
    c.y += (t.y - c.y) * 0.12
    el.style.transform = `perspective(700px) rotateX(${-c.y}deg) rotateY(${c.x}deg)`
    if (isHovered.current || Math.abs(t.x - c.x) > 0.01 || Math.abs(t.y - c.y) > 0.01) {
      rafId.current = requestAnimationFrame(animateTilt)
    } else {
      c.x = 0; c.y = 0
      el.style.transform = ''
    }
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduced || isOpen) return
      const el = tiltRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      targetTilt.current.x = ((e.clientX - r.left) / r.width - 0.5) * 6
      targetTilt.current.y = ((e.clientY - r.top) / r.height - 0.5) * 6
      if (!isHovered.current) {
        isHovered.current = true
        cancelAnimationFrame(rafId.current)
        rafId.current = requestAnimationFrame(animateTilt)
      }
    },
    [reduced, isOpen],
  )

  const handleMouseLeave = useCallback(() => {
    isHovered.current = false
    targetTilt.current.x = 0
    targetTilt.current.y = 0
    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(animateTilt)
  }, [])

  // «Луч на герое»: затемняем все карточки группы, кроме активной
  const dimAnimate = reduced
    ? undefined
    : isAnyOpen && !isOpen
      ? dimmedStyle
      : focusedStyle

  // Dim уходит мягче (длиннее + с задержкой) при возвращении в норму
  const dimTransition = isAnyOpen
    ? { duration: 0.45, ease: SMOOTH_EASE, delay: index * 0.012 }
    : { duration: 0.6, ease: SMOOTH_EASE, delay: 0.15 + index * 0.025 }

  return (
    <motion.article
      ref={cardRootRef}
      data-member-id={memberId}
      variants={reduced ? undefined : cardVariant}
      animate={dimAnimate}
      transition={dimTransition}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div
        ref={tiltRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group h-full"
        style={{
          willChange: 'transform',
          borderRadius: 18,
        }}
      >
        <button
          type="button"
          onClick={hasDetails ? onToggle : undefined}
          aria-expanded={isOpen}
          aria-disabled={!hasDetails}
          className="block w-full h-full text-left"
          style={{ cursor: hasDetails ? 'pointer' : 'default' }}
        >
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 18,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: isFounder
                ? 'color-mix(in srgb, var(--brand-primary) 12%, transparent)'
                : 'color-mix(in srgb, var(--brand-primary) 7%, transparent)',
              backdropFilter: 'blur(24px) saturate(190%) brightness(110%)',
              WebkitBackdropFilter: 'blur(24px) saturate(190%) brightness(110%)',
              border: isOpen
                ? '1px solid color-mix(in srgb, var(--brand-soft) 40%, transparent)'
                : isFounder
                  ? '1px solid color-mix(in srgb, var(--brand-soft) 22%, transparent)'
                  : '1px solid color-mix(in srgb, var(--brand-soft) 12%, transparent)',
              boxShadow: [
                'inset 0 1.5px 0 rgba(255,255,255,0.12)',
                isOpen
                  ? '0 16px 56px color-mix(in srgb, var(--brand-primary) 38%, transparent)'
                  : '0 8px 36px rgba(0,0,0,0.40)',
              ].join(', '),
              transition: 'box-shadow 0.6s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {/* Активная коралловая полоска слева — выезжает сверху, уезжает вверх при закрытии */}
            <motion.div
              aria-hidden
              initial={false}
              animate={{
                scaleY: isOpen ? 1 : isFounder ? 1 : 0,
                opacity: isOpen ? 1 : isFounder ? 0.85 : 0,
              }}
              transition={{
                duration: isOpen ? 0.55 : 0.4,
                ease: SMOOTH_EASE,
              }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: 3,
                transformOrigin: isOpen ? 'top' : 'bottom',
                background: 'var(--brand-accent)',
                boxShadow:
                  '0 0 20px color-mix(in srgb, var(--brand-accent) 60%, transparent)',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />

            {/* Specular rim */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: 'rgba(255,255,255,0.16)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            {/* Hover glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: isFounder
                  ? 'radial-gradient(ellipse 80% 50% at 15% 55%, color-mix(in srgb, var(--brand-accent) 9%, transparent) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse 80% 70% at 25% 20%, color-mix(in srgb, var(--brand-primary) 14%, transparent) 0%, transparent 70%)',
              }}
            />

            <div className="flex h-full flex-col">
              {/* Photo area — portrait 4:5 + ken-burns при isOpen */}
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4 / 5',
                  overflow: 'hidden',
                  borderRadius: '16px 16px 0 0',
                  flexShrink: 0,
                }}
              >
                {hasPhoto ? (
                  <motion.div
                    animate={{
                      scale: reduced ? 1 : isOpen ? 1.06 : 1,
                      x: reduced ? 0 : isOpen ? -4 : 0,
                      y: reduced ? 0 : isOpen ? -3 : 0,
                    }}
                    transition={{
                      duration: isOpen ? 6 : 0.7,
                      ease: SMOOTH_EASE,
                    }}
                    style={{ position: 'absolute', inset: 0 }}
                  >
                    <Image
                      src={member.photo!}
                      alt={member.name}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      style={{
                        objectFit: 'cover',
                        objectPosition: 'center top',
                      }}
                    />
                  </motion.div>
                ) : (
                  <>
                    <div
                      style={{ position: 'absolute', inset: 0, background: gradient }}
                    />
                    <div
                      aria-hidden
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                          'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                          fontWeight: 900,
                          letterSpacing: '-0.04em',
                          color: 'rgba(255,255,255,0.16)',
                          userSelect: 'none',
                        }}
                      >
                        {member.initials}
                      </span>
                    </div>
                  </>
                )}

                {/* Founder badge */}
                {isFounder && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 8,
                      color: '#fff',
                      fontWeight: 700,
                      background:
                        'color-mix(in srgb, var(--brand-accent) 90%, transparent)',
                      padding: '3px 8px',
                      borderRadius: 5,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      backdropFilter: 'blur(8px)',
                      boxShadow:
                        '0 2px 12px color-mix(in srgb, var(--brand-accent) 45%, transparent)',
                      zIndex: 2,
                    }}
                  >
                    Основатель
                  </div>
                )}

                {/* Number badge — только у Founder, у остальных убран как визуальный шум */}
                {isFounder && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 8,
                      color: 'rgba(255,255,255,0.50)',
                      fontWeight: 500,
                      background: 'rgba(0,0,0,0.32)',
                      padding: '2px 6px',
                      borderRadius: 5,
                      backdropFilter: 'blur(8px)',
                      zIndex: 2,
                    }}
                  >
                    {num}
                  </div>
                )}

                {/* Bottom gradient fade */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background:
                      'linear-gradient(to top, color-mix(in srgb, var(--brand-ink) 75%, transparent) 0%, transparent 100%)',
                  }}
                />
              </div>

              {/* Info area — компактнее */}
              <div
                style={{
                  padding: '12px 14px 14px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.2rem',
                      fontWeight: 900,
                      color: '#fff',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {member.stat}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.20em',
                      color:
                        'color-mix(in srgb, var(--brand-soft) 50%, transparent)',
                      marginTop: 2,
                    }}
                  >
                    {member.statLabel}
                  </div>
                </div>

                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.92)',
                      letterSpacing: '-0.01em',
                      marginBottom: 3,
                      lineHeight: 1.2,
                    }}
                  >
                    {member.name}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 8.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.18em',
                      color:
                        'color-mix(in srgb, var(--brand-accent) 72%, transparent)',
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                  >
                    {member.role}
                  </p>
                </div>

                {hasDetails && (
                  <div
                    aria-hidden
                    className="font-mono text-[8.5px] uppercase tracking-[0.20em] text-white/35 transition-colors group-hover:text-brand-soft/80"
                    style={{ marginTop: 2 }}
                  >
                    {isOpen ? '— свернуть' : 'подробнее →'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </button>
      </div>
    </motion.article>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MemberDetailPanel — фазированный enter/exit + max-height со скроллом
// ─────────────────────────────────────────────────────────────────────────────

const SMOOTH_OUT = [0.22, 1, 0.36, 1] as const

// Контейнер просто координирует stagger детских полей.
// Высота больше не анимируется — панель — overlay поверх grid.
const detailContainerVariants = {
  open: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.15,
    },
  },
  collapsed: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1 as const,
    },
  },
}

const detailContentWrapperVariants = {
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: SMOOTH_OUT,
      delay: 0.1,
    },
  },
  collapsed: {
    opacity: 0,
    y: -10,
    scale: 0.985,
    filter: 'blur(6px)',
    transition: {
      duration: 0.35,
      ease: FAST_EASE,
    },
  },
}

const detailRowVariants = {
  open: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: SMOOTH_OUT },
  },
  collapsed: {
    opacity: 0,
    x: -14,
    filter: 'blur(4px)',
    transition: { duration: 0.25, ease: FAST_EASE },
  },
}

function MemberDetailPanel({ member }: { member: Member }) {
  if (!member.details) return null
  const d = member.details

  return (
    <motion.div
      key={member.name}
      initial="collapsed"
      animate="open"
      exit="collapsed"
      variants={detailContainerVariants}
    >
      <motion.div variants={detailContentWrapperVariants}>
        <div
          style={{
            position: 'relative',
            padding: '16px 18px',
            borderRadius: 14,
            background:
              'color-mix(in srgb, var(--brand-ink) 88%, transparent)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border:
              '1px solid color-mix(in srgb, var(--brand-soft) 22%, transparent)',
            boxShadow: [
              'inset 0 1px 0 rgba(255,255,255,0.10)',
              '0 28px 70px rgba(0,0,0,0.55)',
              '0 0 0 1px color-mix(in srgb, var(--brand-primary) 25%, transparent)',
              '0 0 80px color-mix(in srgb, var(--brand-primary) 22%, transparent)',
            ].join(', '),
          }}
        >
          {/* Контент панели */}
          <div className="diva-detail-scroll">
            <div className="grid gap-4 md:grid-cols-2 md:gap-x-8 md:gap-y-4">
              <motion.div
                variants={detailRowVariants}
                className="flex flex-col gap-1.5 md:col-span-2"
              >
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-soft/70">
                  {member.role}
                </span>
                <h3 className="font-display text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
                  {member.name}
                </h3>
              </motion.div>

              {d.quote && (
                <motion.blockquote
                  variants={detailRowVariants}
                  className="md:col-span-2"
                >
                  <p
                    className="font-serif-accent text-base italic leading-relaxed text-brand-soft sm:text-lg"
                    style={{
                      borderLeft:
                        '2px solid color-mix(in srgb, var(--brand-accent) 70%, transparent)',
                      paddingLeft: 16,
                    }}
                  >
                    «{d.quote}»
                  </p>
                </motion.blockquote>
              )}

              {d.specialization && (
                <DetailRow label="Специализация">{d.specialization}</DetailRow>
              )}

              {d.education && (
                <DetailRow label="Образование">{d.education}</DetailRow>
              )}

              {d.about && (
                <motion.div
                  variants={detailRowVariants}
                  className="md:col-span-2 flex flex-col gap-1.5"
                >
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-soft/70">
                    О себе
                  </span>
                  <p className="text-[14px] leading-relaxed text-white/72">
                    {d.about}
                  </p>
                </motion.div>
              )}

              {d.certificates && d.certificates.length > 0 && (
                <motion.div
                  variants={detailRowVariants}
                  className="md:col-span-2 flex flex-col gap-1.5"
                >
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-soft/70">
                    Сертификаты
                  </span>
                  <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-relaxed text-white/72">
                    {d.certificates.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      variants={detailRowVariants}
      className="flex flex-col gap-1.5"
    >
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-soft/70">
        {label}
      </span>
      <div className="text-[14px] leading-relaxed text-white/72">
        {children}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Group block
// ─────────────────────────────────────────────────────────────────────────────

function GroupBlock({
  group,
  startIndex,
  openId,
  onToggle,
}: {
  group: TeamGroup
  startIndex: number
  openId: string | null
  onToggle: (id: string) => void
}) {
  const reduced = useReducedMotion()
  const gridRef = useRef<HTMLDivElement>(null)
  const inView = useInView(gridRef, { once: true, amount: 0.05 })

  const activeMemberId =
    openId !== null && openId.startsWith(group.id + '-') ? openId : null
  const activeIndex = activeMemberId
    ? Number(activeMemberId.split('-').pop())
    : null
  const activeMember = activeIndex !== null ? group.members[activeIndex] : null

  return (
    <div className="flex flex-col gap-8">
      <FadeIn className="flex flex-col gap-3">
        <SectionEyebrow number={group.num} variant="dark">
          {group.label}
        </SectionEyebrow>
        <p className="max-w-2xl font-mono text-[12px] uppercase tracking-[0.18em] text-white/45">
          {group.description}
        </p>
      </FadeIn>

      <div className="relative">
        <motion.div
          ref={gridRef}
          variants={reduced ? undefined : container}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 items-stretch"
          style={{ perspective: '1200px' }}
        >
          {group.members.map((m, i) => {
            const memberId = `${group.id}-${i}`
            return (
              <MemberCard
                key={memberId}
                member={m}
                memberId={memberId}
                index={startIndex + i}
                isOpen={openId === memberId}
                isAnyOpen={openId !== null && openId.startsWith(group.id + '-')}
                onToggle={() => onToggle(memberId)}
              />
            )
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeMember?.details && (
            <motion.div
              key={activeMemberId}
              initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: SMOOTH_OUT } }}
              exit={{ opacity: 0, y: 8, filter: 'blur(6px)', transition: { duration: 0.28, ease: FAST_EASE } }}
              className="relative z-20 mt-4 lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:mt-0"
            >
              <MemberDetailPanel member={activeMember} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export function TeamCarousel() {
  const [openId, setOpenId] = useState<string | null>(null)

  const handleToggle = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  // Close on click anywhere outside a card
  const handleSectionClick = useCallback((e: React.MouseEvent) => {
    if (!openId) return
    const target = e.target as HTMLElement
    if (!target.closest('[data-member-id]')) setOpenId(null)
  }, [openId])

  const groupStartIndices = teamGroups.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1]! + teamGroups[i - 1]!.members.length)
    return acc
  }, [])

  return (
    <section
      id="team"
      onClick={handleSectionClick}
      className="relative isolate overflow-visible bg-brand-ink noise-overlay"
    >
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-12%',
            width: '58vw',
            height: '58vw',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, color-mix(in srgb, var(--brand-primary) 22%, transparent) 0%, transparent 65%)',
            filter: 'blur(90px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0%',
            right: '-8%',
            width: '40vw',
            height: '40vw',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, color-mix(in srgb, var(--brand-accent) 11%, transparent) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 sm:py-40">
        {/* Header */}
        <FadeIn className="mb-20 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4">
            <SectionEyebrow number="03" variant="dark">
              Команда экспертов
            </SectionEyebrow>
            <h2 className="font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl md:text-6xl">
              За проектом стоят{' '}
              <span className="font-serif-accent italic text-brand-soft">
                конкретные люди
              </span>
              <br className="hidden md:block" />
              <span className="text-white/45"> — а не «отдел»</span>
            </h2>
          </div>

          <div
            className="flex flex-col items-start gap-1 lg:items-end"
            aria-label={`${totalCount} экспертов в команде`}
          >
            <span style={{ fontSize: 'clamp(4.5rem, 8vw, 7.5rem)' }}>
              <CountUp
                to={totalCount}
                duration={1.6}
                className="font-display font-black leading-none tracking-[-0.04em] text-white"
              />
            </span>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-soft/60">
              экспертов в команде
            </div>
          </div>
        </FadeIn>

        {/* Groups */}
        <div className="flex flex-col gap-20">
          {teamGroups.map((g, i) => (
            <GroupBlock
              key={g.id}
              group={g}
              startIndex={groupStartIndices[i]!}
              openId={openId}
              onToggle={handleToggle}
            />
          ))}
        </div>

        {/* Bottom strip */}
        <FadeIn
          delay={0.3}
          className="mt-16 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/28">
            Один контакт — вся экспертиза команды
          </p>
          <a
            href="#contacts"
            className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-7 py-3.5 font-display text-sm font-bold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-brand-accent/45"
          >
            Познакомиться →
          </a>
        </FadeIn>
      </div>
    </section>
  )
}
