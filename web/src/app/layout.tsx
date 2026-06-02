import type { Metadata } from 'next'
import './globals.css'
import './debug.css'
import { cn } from '@/lib/utils'

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
    <html lang="ru" suppressHydrationWarning className="dark">
      <body className="min-h-full flex flex-col font-sans bg-[var(--brand-ink)] text-[var(--foreground)]">{children}</body>
    </html>
  )
}