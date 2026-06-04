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
  category: 'fullstack'
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
]

export const categories: { value: Announcement['category'] | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'fullstack', label: 'Fullstack' },
]
