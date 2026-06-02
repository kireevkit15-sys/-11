/**
 * Сводные данные по 8 федеральным округам.
 * Источник: внутренняя CRM ДИВА (780 клиентов суммарно).
 *
 * Используется для tooltip и legend на интерактивной карте регионов.
 * Каждый регион внутри округа окрашивается в цвет своего округа.
 */

export type DistrictCode = 'CFD' | 'NWFO' | 'SFO' | 'NCFD' | 'VFD' | 'UrFO' | 'SFD' | 'FEFO'

export type DistrictMeta = {
  code: DistrictCode
  shortName: string
  name: string
  capital: string
  clients: number
  color: string
}

export const DISTRICTS: Record<DistrictCode, DistrictMeta> = {
  CFD: {
    code: 'CFD',
    shortName: 'ЦФО',
    name: 'Центральный',
    capital: 'Москва',
    clients: 113,
    color: '#A78BFA',
  },
  NWFO: {
    code: 'NWFO',
    shortName: 'СЗФО',
    name: 'Северо-Западный',
    capital: 'Санкт-Петербург',
    clients: 144,
    color: '#F472B6',
  },
  SFO: {
    code: 'SFO',
    shortName: 'ЮФО',
    name: 'Южный',
    capital: 'Ростов-на-Дону',
    clients: 46,
    color: '#FB923C',
  },
  NCFD: {
    code: 'NCFD',
    shortName: 'СКФО',
    name: 'Северо-Кавказский',
    capital: 'Ставрополь',
    clients: 23,
    color: '#FBBF24',
  },
  VFD: {
    code: 'VFD',
    shortName: 'ПФО',
    name: 'Приволжский',
    capital: 'Казань',
    clients: 82,
    color: '#34D399',
  },
  UrFO: {
    code: 'UrFO',
    shortName: 'УрФО',
    name: 'Уральский',
    capital: 'Екатеринбург',
    clients: 112,
    color: '#38BDF8',
  },
  SFD: {
    code: 'SFD',
    shortName: 'СФО',
    name: 'Сибирский',
    capital: 'Новосибирск',
    clients: 147,
    color: '#818CF8',
  },
  FEFO: {
    code: 'FEFO',
    shortName: 'ДФО',
    name: 'Дальневосточный',
    capital: 'Владивосток',
    clients: 113,
    color: '#22D3EE',
  },
}

/** Порядок отрисовки округов в legend / для stagger entry-анимаций. */
export const DISTRICT_ORDER: DistrictCode[] = [
  'CFD',
  'NWFO',
  'SFO',
  'NCFD',
  'VFD',
  'UrFO',
  'SFD',
  'FEFO',
]

export const TOTAL_CLIENTS = Object.values(DISTRICTS).reduce(
  (sum, d) => sum + d.clients,
  0,
) // = 780

/** Helper: получить цвет округа по его коду (с fallback). */
export function getDistrictColor(code: string): string {
  return DISTRICTS[code as DistrictCode]?.color ?? '#A78BFA'
}

/** Helper: получить meta округа по его коду. */
export function getDistrict(code: string): DistrictMeta | null {
  return DISTRICTS[code as DistrictCode] ?? null
}
