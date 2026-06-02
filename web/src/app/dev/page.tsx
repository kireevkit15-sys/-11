import type { Metadata } from 'next'
import { DevPalettePreview } from '@/components/sections/dev-palette-preview'

export const metadata: Metadata = {
  title: 'Dev · палитра · ДИВА',
  description: 'Технический preview токенов и шрифтов. Не для публики.',
  robots: { index: false, follow: false },
}

/**
 * Внутренняя страница для разработки/дизайна:
 * показывает текущую палитру и шрифтовую систему.
 * НЕ должна попадать в основной user-flow.
 */
export default function DevPage() {
  return (
    <main className="min-h-screen bg-background">
      <DevPalettePreview />
    </main>
  )
}
