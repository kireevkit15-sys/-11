/**
 * ServicesSection — Server Component
 *
 * Загружает данные из CMS (Strapi) и передаёт их в клиентский компонент.
 * Все данные услуг хранятся в CMS, включая FSI (Фонд Содействия Инновациям).
 */

import { Rocket, Buildings, Lightning, Trophy } from '@phosphor-icons/react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { getServices } from '@/lib/cms'
import { ServicesSectionClient, type LocalService } from './services-client'
import { SectionEyebrow } from '@/components/sections/section-eyebrow'
import { FadeIn } from '@/components/motion/fade-in'

// ---------------------------------------------------------------------------
// Fallback данные — используются когда CMS недоступен
// ---------------------------------------------------------------------------
const fallbackNormalServices: LocalService[] = [
  {
    title: 'Бухгалтерия для АУСН',
    price: '5 900',
    perUnit: '₽ / мес',
    icon: Lightning,
    items: [
      'Расчёт по страховым взносам',
      '6-НДФЛ',
      'Персонифицированные сведения',
      'Отчёт СЗВ-СТАЖ за 2023 год в составе ЕФС-1',
      'Отчёт 4-ФСС в составе ЕФС-1',
      'Отчёт СЗВ-ТД в составе ЕФС-1',
      'Подготовка документов и отчётов по военскому учёту',
      'Статистический отчёт в Росстат',
      'Отчёт об обработке персональных данных в РКН',
    ],
    isFsi: false,
  },
  {
    title: 'Бухгалтерия для УСН',
    price: '7 900',
    perUnit: '₽ / мес',
    icon: Rocket,
    items: [
      'Декларация по УСН',
      'Бухгалтерская отчётность',
      'Расчёт по страховым взносам',
      '6-НДФЛ',
      'Персонифицированные сведения',
      'Отчёт СЗВ-СТАЖ за 2023 год в составе ЕФС-1',
      'Отчёт 4-ФСС в составе ЕФС-1',
      'Отчёт СЗВ-ТД в составе ЕФС-1',
      'Подготовка документов и отчётов по военскому учёту',
      'Статистический отчёт в Росстат',
      'Отчёт об обработке персональных данных в РКН',
    ],
    isFsi: false,
  },
  {
    title: 'Бухгалтерия для ОСН',
    price: '8 900',
    perUnit: '₽ / мес',
    icon: Buildings,
    items: [
      'Бухгалтерская отчётность',
      'Декларация по НДС',
      'Декларация по налогу на прибыль',
      'Декларация по налогу на имущество',
      'Расчёт по страховым взносам',
      '6-НДФЛ',
      'Персонифицированные сведения',
      'Отчёт СЗВ-СТАЖ за 2023 год в составе ЕФС-1',
      'Отчёт 4-ФСС в составе ЕФС-1',
      'Отчёт СЗВ-ТД в составе ЕФС-1',
      'Подготовка документов и отчётов по военскому учёту',
      'Статистический отчёт в Росстат',
      'Отчёт об обработке персональных данных в РКН',
    ],
    isFsi: false,
  },
]

const fallbackFsiService = {
  title: 'Отчёты по Студенческому стартапу и Старт 1',
  price: '35 000',
  fsiPrice: '35 000',
  perUnit: '₽ / грант',
  icon: Trophy,
  items: [
    'Подготовка договора с ФСИ',
    'Подготовка финансового отчёта',
    'Оформление технического отчёта',
    'Разработка бизнес-плана',
    'Заполнение отчёта о развитии стартапа',
    'Подготовка карты РИД',
    'Исправление всех замечаний кураторов',
  ],
  isFsi: true as const,
}

// ---------------------------------------------------------------------------
// Конвертация данных из CMS в локальный формат
// ---------------------------------------------------------------------------
type CmsService = Awaited<ReturnType<typeof getServices>>[0]

function getIconForTaxSystem(taxSystem: string): PhosphorIcon {
  switch (taxSystem) {
    case 'ФСИ':
      return Trophy
    case 'УСН-Д':
    case 'УСН-ДР':
      return Rocket
    case 'ОСН':
      return Buildings
    default:
      return Lightning
  }
}

function convertCmsService(service: CmsService): LocalService {
  const attrs = service.attributes
  const isFsi = attrs.tax_system === 'ФСИ'

  return {
    title: attrs.title,
    price: attrs.base_price?.toLocaleString('ru-RU') || '0',
    perUnit: isFsi ? '₽ / грант' : '₽ / мес',
    icon: getIconForTaxSystem(attrs.tax_system),
    items: attrs.includes || [],
    isFsi,
  }
}

// ---------------------------------------------------------------------------
// Server Component — главный экспорт
// ---------------------------------------------------------------------------
export async function ServicesSection() {
  // Загружаем данные из CMS
  const cmsServices = await getServices()

  // Разделяем услуги на обычные и FSI
  const convertedServices = cmsServices.map(convertCmsService)
  const normalServices = convertedServices.filter((s) => !s.isFsi)
  const fsiServiceRaw = convertedServices.find((s) => s.isFsi)

  // Используем данные из CMS или fallback для FSI
  const fsiService = fsiServiceRaw
    ? {
        ...fsiServiceRaw,
        isFsi: true as const,
        fsiPrice: fsiServiceRaw.price,
      }
    : fallbackFsiService

  // Если нет обычных услуг — используем fallback
  const finalNormalServices =
    normalServices.length > 0 ? normalServices : fallbackNormalServices

  return (
    <div className="relative isolate overflow-hidden bg-aurora-dark text-white noise-overlay">
      {/* Тонкая точечная сетка */}
      <div
        className="pointer-events-none absolute inset-0 pattern-dot-grid-dark opacity-50"
        aria-hidden
      />

      {/* Soft violet blob top-left */}
      <div
        className="blob blob-soft"
        style={{
          top: '5%',
          left: '-5%',
          width: '600px',
          height: '600px',
          opacity: 0.35,
        }}
        aria-hidden
      />
      {/* Coral blob bottom-right */}
      <div
        className="blob blob-coral"
        style={{
          bottom: '5%',
          right: '-8%',
          width: '550px',
          height: '550px',
          opacity: 0.22,
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-32 sm:px-6 sm:py-40">
        {/* ────────── Header ────────── */}
        <FadeIn className="flex max-w-3xl flex-col gap-5">
          <SectionEyebrow variant="dark" number="02">
            Наши услуги
          </SectionEyebrow>

          <h2 className="font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl md:text-7xl">
            Бухгалтерия под систему
            <br />
            налогообложения —
            <br />
            <span className="font-serif-accent italic text-brand-soft">
              прозрачный
            </span>{' '}
            перечень работ
          </h2>

          <p className="max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">
            Состав отчётов и работ для каждой системы — как они есть. Точную
            стоимость рассчитаем под количество операций и сотрудников на
            30-минутной консультации.{' '}
            <span className="hidden font-mono text-[13px] uppercase tracking-[0.18em] text-brand-soft sm:inline">
              наведите на карточку — пролистайте детали
            </span>
            <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-brand-soft sm:hidden">
              раскройте карточку — покажем весь перечень
            </span>
          </p>
        </FadeIn>

        {/* ────────── Cards Grid ────────── */}
        <ServicesSectionClient
          normalServices={finalNormalServices}
          fsiService={fsiService}
        />
      </div>
    </div>
  )
}
