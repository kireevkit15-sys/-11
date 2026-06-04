'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { CaretDown } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/motion/fade-in'
import { SectionEyebrow } from '@/components/sections/section-eyebrow'

// ---------------------------------------------------------------------------
// Data
// Ответы построены строго на фактах с сайта-референса (accounting-diva3d.ru):
// — система налогообложения, программы ФСИ, оплата со 2-го этапа гранта,
// — 5-этапный процесс, поддержка 12/6, 488 клиентов в 8 ФО, 9 лет опыта
// и существующих данных проекта (тарифы из services.tsx). Без выдумок.
// ---------------------------------------------------------------------------

type QA = { q: string; a: string }
type FaqGroup = {
  num: string
  id: string
  label: string
  questions: QA[]
}

const faqGroups: FaqGroup[] = [
  {
    num: '01',
    id: 'pricing',
    label: 'Тарифы и оплата',
    questions: [
      {
        q: 'Сколько стоит обслуживание?',
        a: 'Зависит от системы налогообложения: АУСН — 5 900 ₽/мес, УСН — 7 900 ₽/мес, ОСН — 8 900 ₽/мес. Сопровождение отчётности по «Студенческому стартапу» или «Старт 1» — 35 000 ₽ за весь грант. Полный состав работ — в блоке «Наши услуги» выше.',
      },
      {
        q: 'Как формируется конечная стоимость?',
        a: 'Тарифы фиксированные — цена зависит только от системы налогообложения и наличия сопровождения ФСИ. Скрытых надбавок нет, состав работ открыт, всё фиксируется в договоре.',
      },
      {
        q: 'Можно ли поменять тариф позже?',
        a: 'Да. Если бизнес растёт и АУСН становится тесно — переводим на УСН или ОСН вместе с переходным периодом. Если, наоборот, обороты упали — опускаемся на упрощённый режим. Перевод оформляется одним обращением.',
      },
    ],
  },
  {
    num: '02',
    id: 'fsi',
    label: 'Гранты ФСИ',
    questions: [
      {
        q: 'Какие программы ФСИ вы сопровождаете?',
        a: 'Основные программы Фонда содействия инновациям: «Студенческий стартап», «Старт-1», ЦТ, ИИ, СТ. Стоимость сопровождения — 35 000 ₽ за весь грант. Эксперты компании сами были победителями конкурсов ФСИ — знаем процесс изнутри, не по методичкам.',
      },
      {
        q: 'Когда начинается оплата при работе с грантом?',
        a: 'Оплата стартует со 2-го этапа гранта. На первом этапе деньги нужны на разработку, а не на бухгалтерию. Первый этап — финансовый и промежуточный технический отчёт — сопровождаем до получения транша на 2-й этап.',
      },
      {
        q: 'Что если ФСИ не принял отчёт?',
        a: 'Дорабатываем замечания кураторов до полного принятия — это входит в стоимость. За 4 года работы мы сопроводили 780 стартапов: типичные замечания знаем заранее и стараемся их не допускать.',
      },
    ],
  },
  {
    num: '03',
    id: 'process',
    label: 'Процесс работы',
    questions: [
      {
        q: 'С чего начинается сотрудничество?',
        a: 'Бесплатная консультация — разбираем вашу ситуацию, систему налогообложения, этап гранта. Два формата: если есть конкретные вопросы — эксперт разбирает их и даёт прикладные материалы; если вопросов нет — проводим презентацию всего пути на год. После — подписываем договор и принимаем дела.',
      },
      {
        q: 'Кто будет моим бухгалтером?',
        a: 'Закреплённый личный бухгалтер из команды, не «отдел сопровождения». В команде 12 специалистов: бухгалтеры с опытом от 3 до 26 лет и консультанты по программам ФСИ с профильным опытом от 3 лет. Все эксперты имеют прикладной опыт работы с ФСИ.',
      },
      {
        q: 'Как с вами связываться?',
        a: 'Телефон +7 996 636-69-71 (Пн–СБ 08:00–18:00 МСК), email diva.consulting.b@gmail.com, Telegram @diva_accounting. Срочные вопросы по дедлайнам ФСИ — в приоритете.',
      },
    ],
  },
  {
    num: '04',
    id: 'guarantees',
    label: 'Гарантии и данные',
    questions: [
      {
        q: 'Как защищены мои данные?',
        a: 'Работаем по 152-ФЗ «О персональных данных». Документы передаются через защищённый электронный документооборот, доступ к данным компании имеет только закреплённый за вами бухгалтер.',
      },
      {
        q: 'Гарантия по сданным отчётам ФСИ',
        a: 'Отчёт сопровождается до момента полного принятия экспертизой Фонда. Если куратор возвращает с замечаниями — дорабатываем без доплат. Это часть тарифа, а не extra-услуга.',
      },
      {
        q: 'Что если я уйду через месяц?',
        a: 'Договор расторгается одним обращением — без штрафов и удержаний. Передаём все данные, акты и доступы для следующего бухгалтера.',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------
// Гарантированно определён — массив выше всегда непустой.
const FIRST_GROUP = faqGroups[0]!

export function FaqSection() {
  const reduced = useReducedMotion()
  const [activeGroupId, setActiveGroupId] = useState(FIRST_GROUP.id)
  const [openIdx, setOpenIdx] = useState<number>(0)

  const activeGroup: FaqGroup =
    faqGroups.find((g) => g.id === activeGroupId) ?? FIRST_GROUP

  const handleGroupChange = (id: string) => {
    setActiveGroupId(id)
    setOpenIdx(0)
  }

  return (
    <section
      id="faq"
      className="relative isolate overflow-hidden bg-aurora-dark text-white noise-overlay"
    >
      {/* Декор */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="blob blob-soft"
          style={{
            top: '-5%',
            right: '-5%',
            width: '500px',
            height: '500px',
            opacity: 0.30,
          }}
          aria-hidden
        />
        <div
          className="blob blob-coral"
          style={{
            bottom: '5%',
            left: '-8%',
            width: '450px',
            height: '450px',
            opacity: 0.20,
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 pattern-dot-grid-dark opacity-50"
          aria-hidden
        />

        {/* ─── Holographic ribbon — слева, с пульсирующим glow (2s) ─── */}
        <div
          aria-hidden
          className="absolute hidden xl:block"
          style={{
            left: '-7%',
            top: '32%',
            width: '520px',
            height: '520px',
          }}
        >
          {/* Glow-ореол: радиальный градиент с цветами ленты, дышит */}
          <div
            className="holo-glow-2s absolute"
            style={{
              inset: '-22%',
              background:
                'radial-gradient(circle at 50% 50%, rgba(167,139,250,0.55) 0%, rgba(236,72,153,0.32) 28%, rgba(34,211,238,0.16) 52%, transparent 72%)',
              filter: 'blur(48px)',
              mixBlendMode: 'screen',
            }}
          />

          {/* Сама 3D-лента — синхронный микропульс */}
          <Image
            src="/faq/holo-ribbon.webp"
            alt=""
            width={520}
            height={520}
            quality={92}
            priority={false}
            className="holo-pulse-2s relative h-full w-full select-none object-contain"
            style={{ filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.45))' }}
          />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
        {/* Header */}
        <FadeIn className="relative max-w-3xl">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 opacity-55 sm:hidden">
            <Image
              src="/faq/holo-ribbon.webp"
              alt=""
              width={128}
              height={128}
              sizes="128px"
              className="h-full w-full rotate-12 object-contain"
              style={{ filter: 'drop-shadow(0 12px 24px rgba(124,58,237,0.35))' }}
            />
          </div>
          <SectionEyebrow number="05" variant="dark">
            Вопросы и ответы
          </SectionEyebrow>
          <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] glow-text-violet sm:text-5xl md:text-6xl">
            Ответим на главное —{' '}
            <span className="font-serif-accent italic text-brand-soft">
              ещё до встречи
            </span>
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/65">
            Если вашего вопроса здесь нет — задайте его на бесплатной
            30-минутной консультации.
          </p>
        </FadeIn>

        {/* Layout */}
        <div className="mt-16 grid grid-cols-1 gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-12">
          {/* ── LEFT: navigator ── */}
          <aside className="lg:col-span-4">
            {/* Mobile: горизонтальные chips */}
            <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:hidden">
              {faqGroups.map((g) => {
                const isActive = activeGroupId === g.id
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleGroupChange(g.id)}
                    className={cn(
                      'min-h-11 shrink-0 rounded-full border px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] transition-all duration-300',
                      isActive
                        ? 'border-brand-soft/60 bg-brand-soft/15 text-brand-soft shadow-[0_0_18px_rgba(167,139,250,0.4)]'
                        : 'border-white/10 bg-white/[0.03] text-white/55 hover:text-white',
                    )}
                  >
                    {g.num} · {g.label}
                  </button>
                )
              })}
            </div>

            {/* Desktop: editorial вертикальный навигатор */}
            <div className="sticky top-24 hidden flex-col gap-1 lg:flex">
              {faqGroups.map((g) => {
                const isActive = activeGroupId === g.id
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleGroupChange(g.id)}
                    className={cn(
                      'group relative flex items-baseline gap-4 border-l-2 py-4 pl-6 text-left transition-all duration-300',
                      isActive
                        ? 'border-brand-soft text-white'
                        : 'border-white/10 text-white/40 hover:border-brand-soft/40 hover:text-white/80',
                    )}
                    style={
                      isActive
                        ? {
                            boxShadow:
                              'inset 2px 0 18px -4px rgba(167,139,250,0.45)',
                          }
                        : undefined
                    }
                  >
                    <span
                      className={cn(
                        'font-mono text-[11px] font-bold tabular-nums-display tracking-[0.22em] transition-colors',
                        isActive ? 'text-brand-accent' : 'text-white/30',
                      )}
                    >
                      {g.num}
                    </span>
                    <span className="font-display text-xl font-extrabold tracking-tight sm:text-[22px]">
                      {g.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* ── RIGHT: accordion ── */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeGroup.id}
                initial={reduced ? false : 'hidden'}
                animate="visible"
                exit={reduced ? undefined : 'exit'}
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.26,
                      ease: [0.22, 1, 0.36, 1],
                      staggerChildren: 0.045,
                      delayChildren: 0.03,
                    },
                  },
                  exit: {
                    opacity: 0,
                    y: -4,
                    transition: {
                      duration: 0.16,
                      ease: [0.4, 0, 0.6, 1],
                    },
                  },
                }}
                className="flex flex-col"
              >
                {activeGroup.questions.map((qa, i) => (
                  <motion.div
                    key={qa.q}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.34,
                          ease: [0.22, 1, 0.36, 1],
                        },
                      },
                      exit: {
                        opacity: 0,
                        y: -4,
                        transition: {
                          duration: 0.14,
                          ease: [0.4, 0, 1, 1],
                        },
                      },
                    }}
                  >
                    <FaqItem
                      qa={qa}
                      index={i}
                      total={activeGroup.questions.length}
                      isOpen={openIdx === i}
                      onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Bottom hint */}
            <div className="mt-10 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">
              <span>Не нашли свой вопрос?</span>
              <a
                href="#contact"
                className="text-brand-soft underline-offset-4 transition hover:text-white hover:underline"
              >
                спросите на консультации →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// FaqItem — один аккордеон-элемент с editorial-typography
// ---------------------------------------------------------------------------
function FaqItem({
  qa,
  index,
  total,
  isOpen,
  onToggle,
}: {
  qa: QA
  index: number
  total: number
  isOpen: boolean
  onToggle: () => void
}) {
  const reduced = useReducedMotion()

  return (
    <div
      className={cn(
        'border-b transition-colors duration-300',
        isOpen ? 'border-brand-soft/45' : 'border-white/10',
      )}
    >
      {/* Q-row — grid с тремя колонками для выравнивания ответа под вопросом */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="group grid w-full grid-cols-[58px_1fr_24px] items-start gap-3 py-6 text-left sm:grid-cols-[80px_1fr_28px] sm:gap-5"
      >
        <span
          className={cn(
            'pt-1.5 font-mono text-[10px] font-bold tabular-nums-display tracking-[0.22em] transition-colors duration-300',
            isOpen ? 'text-brand-accent' : 'text-white/35',
          )}
        >
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span
          className={cn(
            'font-display text-lg font-extrabold leading-tight tracking-tight transition-colors duration-300 sm:text-xl md:text-[22px]',
            isOpen
              ? 'text-white [text-shadow:0_0_18px_rgba(167,139,250,0.30)]'
              : 'text-white/85 group-hover:text-white',
          )}
        >
          {qa.q}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? -180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'flex shrink-0 items-center justify-center pt-1 transition-colors duration-300',
            isOpen
              ? 'text-brand-soft'
              : 'text-white/40 group-hover:text-brand-soft/85',
          )}
        >
          <CaretDown weight="bold" className="h-4 w-4" />
        </motion.span>
      </button>

      {/* A-row — двухфазное раскрытие:
          1. Контейнер растёт по height (spring — органичная физика)
          2. Текст ответа въезжает с лёгким y-offset чуть позже */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.2, ease: 'easeOut' },
            }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-[40px_1fr_24px] gap-2 sm:grid-cols-[80px_1fr_28px] sm:gap-5">
              <span aria-hidden />
              <motion.p
                initial={reduced ? false : { y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduced ? undefined : { y: 2, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="pb-7 pr-1 text-[15px] leading-relaxed text-white/72 sm:text-base sm:leading-[1.65]"
              >
                {qa.a}
              </motion.p>
              <span aria-hidden />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
