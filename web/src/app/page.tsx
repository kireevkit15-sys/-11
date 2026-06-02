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

export default function Home() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip bg-background text-foreground">
        <HeroSection />
        <TrustStrip />
        <ServicesSection />
        <TeamCarousel />
        <CasesMarquee />
        <TestimonialsSection />
        <ContentSection />
        <FaqSection />
      </main>
      <Footer />
    </>
  )
}
