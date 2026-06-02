import { Header } from '@/components/sections/header'
import { Footer } from '@/components/sections/footer'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-clip">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
