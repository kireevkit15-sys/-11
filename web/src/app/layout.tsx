import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Сайт ДИВА — бухгалтерия для стартапов и отчётность ФСИ',
  description:
    'Бесплатная консультация по бухгалтерии для стартапов и грантополучателей ФСИ. 5 лет специализации, 780 клиентов.',
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