import { Header } from '@/components/sections/header'
import { HeroSection } from '@/components/sections/hero'
import { TrustStrip } from '@/components/sections/trust-strip'
import { ServicesSection } from '@/components/sections/services'
import { TeamCarousel } from '@/components/sections/team-carousel'
import { CasesMarquee } from '@/components/sections/cases'
import { TestimonialsSection } from '@/components/sections/testimonials'
import { ContentSection } from '@/components/sections/content'
import { FaqSection } from '@/components/sections/faq'
import { Footer } from '@/components/sections/footer'
import { getServerTeamMembers } from '@/lib/server-cms'

// Загружаем команду на сервере (RSC) напрямую из БД.
// Это исключает HTTP-цикл `/api/content/team-members`, который
// в RSC ломался из-за relative URL и неверного NEXT_PUBLIC_SITE_URL.
// Сейчас: SSR → БД → реальные карточки, без skeleton и без race.
export default async function Home() {
  const members = await getServerTeamMembers()

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
        <FaqSection />
      </main>
      <Footer />
    </>
  )
}
