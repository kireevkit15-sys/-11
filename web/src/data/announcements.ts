export type Announcement = {
  id: string
  name: string
  role: string
  company: string
  bio: string
  skills: string[]
  links: {
    github?: string
    portfolio?: string
    vk?: string
    telegram?: string
  }
  contact: string
  badge: 'team' | 'client'
  hue: number
  available: boolean
  featured?: boolean
  category: 'fullstack' | 'frontend' | 'backend' | 'design' | 'ai' | 'analytics'
}

export const announcements: Announcement[] = [
  {
    id: 'diva-alexey',
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
  },
  {
    id: 'diva-marina',
    name: 'Марина Соколова',
    role: 'Senior Frontend Engineer',
    company: 'ДИВА',
    bio: 'Отвечаю за UI/UX и компонентную систему ДИВА. Фокус на доступности, анимациях и производительности. Люблю превращать дизайн-макеты в живой код.',
    skills: ['React', 'TypeScript', 'Framer Motion', 'Figma', 'Storybook', 'Vitest'],
    links: {
      github: 'https://github.com/msokolova-ui',
      portfolio: 'https://msokolova.design',
      telegram: 'https://t.me/msokolova_ui',
    },
    contact: '@msokolova_ui',
    badge: 'team',
    hue: 300,
    available: true,
    category: 'frontend',
  },
  {
    id: 'diva-dmitry',
    name: 'Дмитрий Казаков',
    role: 'AI/ML Engineer',
    company: 'ДИВА',
    bio: 'Разрабатываю AI-функции платформы: автоматизация бухгалтерских задач, NLP-парсинг документов, Telegram-бот на LangChain. Python + FastAPI + OpenAI API.',
    skills: ['Python', 'FastAPI', 'LangChain', 'OpenAI API', 'PostgreSQL', 'Redis'],
    links: {
      github: 'https://github.com/dkazakov-ai',
      telegram: 'https://t.me/dkazakov_ai',
    },
    contact: '@dkazakov_ai',
    badge: 'team',
    hue: 0,
    available: true,
    category: 'ai',
  },
  {
    id: 'client-ivan',
    name: 'Иван Петров',
    role: 'Backend Developer',
    company: 'Freelance',
    bio: 'Разрабатываю REST и GraphQL API на Node.js и Go. Опыт с микросервисами, очередями сообщений (Kafka, RabbitMQ) и облачными деплоями на AWS и Yandex Cloud.',
    skills: ['Node.js', 'Go', 'GraphQL', 'Kafka', 'AWS', 'Kubernetes'],
    links: {
      github: 'https://github.com/ipetrov-backend',
      telegram: 'https://t.me/ipetrov_dev',
    },
    contact: '@ipetrov_dev',
    badge: 'client',
    hue: 60,
    available: true,
    category: 'backend',
  },
  {
    id: 'client-olga',
    name: 'Ольга Нестерова',
    role: 'Product Designer',
    company: 'Freelance',
    bio: 'Проектирую интерфейсы для финтех и b2b продуктов. UX-исследования, прототипирование в Figma, дизайн-системы. Работала с командами в Тинькофф и Контуре.',
    skills: ['Figma', 'UX Research', 'Design Systems', 'Prototyping', 'Accessibility'],
    links: {
      portfolio: 'https://onesterova.design',
      telegram: 'https://t.me/onesterova_design',
    },
    contact: '@onesterova_design',
    badge: 'client',
    hue: 120,
    available: true,
    category: 'design',
  },
  {
    id: 'client-sergey',
    name: 'Сергей Лебедев',
    role: 'Data Analyst',
    company: 'Freelance',
    bio: 'Аналитика данных для стартапов и малого бизнеса: дашборды в Metabase и Superset, SQL-оптимизация, построение воронок и когортный анализ. Помогаю принимать решения на основе данных.',
    skills: ['SQL', 'Python', 'Metabase', 'dbt', 'ClickHouse', 'Tableau'],
    links: {
      github: 'https://github.com/slebedev-data',
      telegram: 'https://t.me/slebedev_data',
    },
    contact: '@slebedev_data',
    badge: 'client',
    hue: 180,
    available: true,
    category: 'analytics',
  },
]

export const categories: { value: Announcement['category'] | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'fullstack', label: 'Fullstack' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'design', label: 'Дизайн' },
  { value: 'ai', label: 'AI / ML' },
  { value: 'analytics', label: 'Аналитика' },
]
