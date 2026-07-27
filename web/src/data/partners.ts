/**
 * DIVA — Partners Data (Static Fallback)
 *
 * Данные о командах и партнёрах.
 * Используется как fallback когда API недоступен.
 */

export type Partner = {
  id: string;
  name: string;
  role: string;
  company: string;
  logoUrl?: string | null;
  bio: string;
  skills: string[];
  links: {
    github?: string;
    portfolio?: string;
    vk?: string;
    telegram?: string;
  };
  contact: string;
  badge: 'team' | 'client';
  hue: number;
  available: boolean;
  featured?: boolean;
  category: 'fullstack' | 'mobile' | 'ai' | 'devops' | 'design' | 'other';
  /**
   * Множественные категории для фильтров на /announcements.
   * Строки из фиксированного списка `partnerTags` ниже
   * («Разработка сайтов», «Разработка мобильных приложений» и т.д.).
   * Партнёр может принадлежать нескольким категориям. Пустой массив —
   * партнёр виден только во «все» и ни в одном фильтре.
   */
  categories?: string[];
}

export const partners: Partner[] = [
  {
    id: 'syntax-labs',
    name: 'Syntax Labs',
    role: 'Product Development Team · 8+ инженеров',
    company: 'Syntax Labs',
    bio: 'Полный цикл разработки продуктов: от идеи до продакшена. Web, mobile, AI/ML, DevOps, дизайн-системы. Строим SaaS, финтех, b2b-платформы и Telegram-боты. Next.js App Router, React Native, Python/FastAPI, Go, PostgreSQL, Kubernetes — всё под ключ.',
    skills: ['Next.js', 'React Native', 'Python / AI', 'Go / Node.js', 'Kubernetes', 'Design Systems'],
    links: {
      github: 'https://github.com/syntaxlabs',
      telegram: 'https://t.me/kitafun',
    },
    contact: '@kitafun',
    badge: 'team',
    hue: 240,
    available: true,
    featured: true,
    category: 'fullstack',
    categories: ['Разработка сайтов', 'Разработка мобильных приложений', 'Разработка ботов и ассистентов', 'Машинное обучение и нейросети'],
  },
];

export const partnerTags = [
  'Разработка сайтов',
  'Разработка мобильных приложений',
  'Разработка ботов и ассистентов',
  'Машинное обучение и нейросети',
  'Разработка игр',
  'Разработка специализированного ПО',
  '3D-моделирование и прототипирование',
  'Промышленный дизайн',
  'Инжиниринг и reverse-engineering',
  'Приборостроение',
  'Разработка электроники и схемотехника',
  'Химическая технология',
  'Энергетика',
  'Медицина',
  'Маркетинг',
  'SMM-продвижение',
  'Бизнес-анализ',
  'Регистрация РИД',
] as const;
