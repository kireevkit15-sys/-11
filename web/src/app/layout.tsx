import type { Metadata } from 'next'
import { Inter, Onest, JetBrains_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

// Body font — Inter (нейтральный sans с отличной кириллицей)
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

// Display font — Onest (modern Russian-designed, премиум B2B/tech-feel,
// первоклассная Cyrillic-поддержка, более характерный, чем Manrope).
// Используется в h1, h2 секций и в брендовом логотипе.
const onest = Onest({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

// Editorial-серif — Instrument Serif для одного-двух italic-акцентных слов
// (premium-приём Stripe/Pilot — серифный контраст к sans)
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

// Mono — для технических акцентов (eyebrow, бейджи, цифры калькулятора)
const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Сайт ДИВА — бухгалтерия для стартапов и отчётность ФСИ',
  description:
    'Бесплатная консультация по бухгалтерии для стартапов и грантополучателей ФСИ. 5 лет специализации, 488 клиентов.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ru"
      className={cn(
        'h-full',
        'antialiased',
        inter.variable,
        onest.variable,
        instrumentSerif.variable,
        mono.variable,
      )}
    >
      <body className="min-h-full flex flex-col font-sans bg-[var(--brand-ink)]">{children}</body>
    </html>
  )
}
