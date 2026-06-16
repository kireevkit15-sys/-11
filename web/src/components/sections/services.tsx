/**
 * ServicesSection — Server Component
 *
 * Загружает данные из CMS (Strapi) и передаёт в клиентский компонент.
 * Иконки из @phosphor-icons/react требуют 'use client' — передаём имена,
 * а маппинг в компоненты происходит в services-client.tsx.
 */

import { getServices, type Service } from '@/lib/cms'
import { ServicesSectionClient, type IconName, type LocalService } from './services-client'

// ---------------------------------------------------------------------------
// Fallback данные — используются когда CMS недоступен
// ---------------------------------------------------------------------------
const fallbackNormalServices: LocalService[] = [
  {
    title: 'Бухгалтерия для АУСН',
    price: '5 900',
    perUnit: '₽ / мес',
    icon: 'Lightning' as IconName,
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
    icon: 'Rocket' as IconName,
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
    icon: 'Buildings' as IconName,
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

const fallbackFsiService: LocalService & { fsiPrice: string } = {
  title: 'Отчёты по Студенческому стартапу и Старт 1',
  price: '35 000',
  fsiPrice: '35 000',
  perUnit: '₽ / грант',
  icon: 'Trophy' as IconName,
  items: [
    'Подготовка договора с ФСИ',
    'Подготовка финансового отчёта',
    'Оформление технического отчёта',
    'Разработка бизнес-плана',
    'Заполнение отчёта о развитии стартапа',
    'Подготовка карты РИД',
    'Исправление всех замечаний кураторов',
  ],
  isFsi: true,
}

// ---------------------------------------------------------------------------
// Конвертация данных из CMS в локальный формат
// ---------------------------------------------------------------------------

const ICON_BY_TAX_SYSTEM: Record<string, IconName> = {
  'ФСИ': 'Trophy',
  'УСН-Д': 'Rocket',
  'УСН-ДР': 'Rocket',
  'ОСН': 'Buildings',
  'АУСН': 'Lightning',
}

function getIconForTaxSystem(taxSystem: string): IconName {
  return ICON_BY_TAX_SYSTEM[taxSystem] ?? 'Lightning'
}

function convertCmsService(service: Service): LocalService {
  // Strapi v5: данные приходят напрямую без .attributes
  const isFsi = service.taxSystem === 'ФСИ'

  return {
    title: service.title,
    price: service.basePrice?.toLocaleString('ru-RU') || '0',
    perUnit: isFsi ? '₽ / грант' : '₽ / мес',
    icon: getIconForTaxSystem(service.taxSystem),
    items: service.includes || [],
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
        isFsi: true,
        fsiPrice: fsiServiceRaw.price,
      }
    : fallbackFsiService

  // Если нет обычных услуг — используем fallback
  const finalNormalServices =
    normalServices.length > 0 ? normalServices : fallbackNormalServices

  return (
    <section id="services" className="relative isolate overflow-hidden bg-aurora-dark text-white noise-overlay">
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
        {/* ────────── Header (Server-rendered) ────────── */}
        <div className="flex max-w-3xl flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-soft/60">02</span>
            <span className="h-px flex-1 bg-white/10" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-soft/60">Наши услуги</span>
          </div>

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
        </div>

        {/* ────────── Cards Grid ────────── */}
        <ServicesSectionClient
          normalServices={finalNormalServices}
          fsiService={fsiService}
        />
      </div>
    </section>
  )
}