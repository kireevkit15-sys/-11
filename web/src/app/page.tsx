import { Header } from '@/components/sections/header'
import { HeroSection } from '@/components/sections/hero'
import { TrustStrip } from '@/components/sections/trust-strip'
import { ServicesSection } from '@/components/sections/services'
import { TeamCarousel } from '@/components/sections/team-carousel'
import { CasesMarquee } from '@/components/sections/cases'
import { TestimonialsSection } from '@/components/sections/testimonials'
import { ContentSection } from '@/components/sections/content'
import { FaqSection, type FaqGroup } from '@/components/sections/faq'
import { Footer } from '@/components/sections/footer'
import { getServerTeamMembers, getServerFaqs } from '@/lib/server-cms'

// Маппинг «slug из БД → красивый лейбл на сайте». Если категория новая —
// показываем её как есть. id группы — транслит категории, чтобы в DOM не
// попадала сырая кириллица (она ломается в URL/CSS-селекторах).
const FAQ_CATEGORY_LABEL: Record<string, string> = {
  'Цены и оплата': 'Тарифы и оплата',
  'ФСИ': 'Гранты ФСИ',
  'Бухгалтерия': 'Процесс работы',
  'О компании': 'Гарантии и данные',
}

// Транслитерация кириллицы → латиница для DOM id.
function slugify(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  }
  return input
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'group'
}

function buildFaqGroups(
  rows: { question: string; answer: string; category: string | null; sortOrder: number }[]
): FaqGroup[] {
  // Группируем по категории, сохраняя порядок sortOrder.
  const ordered: string[] = []
  const buckets = new Map<string, { q: string; a: string }[]>()
  for (const r of rows) {
    const cat = r.category || 'О компании'
    if (!buckets.has(cat)) {
      buckets.set(cat, [])
      ordered.push(cat)
    }
    buckets.get(cat)!.push({ q: r.question, a: r.answer })
  }

  return ordered
    .map((cat, i) => ({
      num: String(i + 1).padStart(2, '0'),
      id: slugify(cat),
      label: FAQ_CATEGORY_LABEL[cat] ?? cat,
      questions: buckets.get(cat) ?? [],
    }))
    .filter((g) => g.questions.length > 0)
}

export default async function Home() {
  const [members, faqRows] = await Promise.all([
    getServerTeamMembers(),
    getServerFaqs(),
  ])
  const faqGroups = buildFaqGroups(faqRows)

  return (
    <>
      <Header />
      <main className="overflow-x-clip bg-background text-foreground">
        <HeroSection />
        <TrustStrip />
        <ServicesSection />
        <TeamCarousel initialMembers={members} />
        <CasesMarquee />
        <TestimonialsSection />
        <ContentSection />
        <FaqSection groups={faqGroups} />
      </main>
      <Footer />
    </>
  )
}
