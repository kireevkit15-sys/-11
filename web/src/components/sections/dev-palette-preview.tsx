import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/motion/fade-in'

const swatches = [
  { label: 'Primary', cssVar: '--brand-primary', className: 'bg-brand-primary text-brand-primary-foreground' },
  { label: 'Accent', cssVar: '--brand-accent', className: 'bg-brand-accent text-brand-accent-foreground' },
  { label: 'Secondary', cssVar: '--brand-secondary', className: 'bg-brand-secondary text-brand-secondary-foreground' },
  { label: 'Soft', cssVar: '--brand-soft', className: 'bg-brand-soft text-foreground border border-border' },
] as const

const fonts = [
  { label: 'Display · Manrope', className: 'font-display text-3xl font-extrabold tracking-tight', sample: 'Бухгалтерия 2026' },
  { label: 'Body · Inter', className: 'font-sans text-base', sample: 'Возьмём отчётность по грантам ФСИ' },
  { label: 'Mono · JetBrains', className: 'font-mono text-sm uppercase tracking-wider', sample: '94% conversion' },
] as const

/**
 * Технический preview — для команды и заказчика, чтобы видеть текущие токены.
 * Удалим перед публикацией.
 */
export function DevPalettePreview() {
  return (
    <section className="border-t border-border bg-mesh-soft">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6">
        <FadeIn className="flex flex-col gap-2">
          <Badge
            variant="outline"
            className="self-start border-primary/20 bg-white/70 font-mono text-[10px] uppercase tracking-[0.2em] text-primary backdrop-blur-sm"
          >
            dev preview · удалим перед запуском
          </Badge>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Палитра «Тёплый эксперт» · Pilot-like
          </h2>
          <p className="text-sm text-muted-foreground">
            Эта секция временная — нужна, чтобы видеть, как живут токены и шрифты. Подробнее в{' '}
            <code className="font-mono text-xs text-primary">docs/08-references.md</code>.
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map((s) => (
            <div key={s.label} className="flex flex-col gap-2">
              <div className={`flex h-20 items-center justify-center rounded-md text-sm font-medium ${s.className}`}>
                {s.label}
              </div>
              <code className="font-mono text-xs text-muted-foreground">{s.cssVar}</code>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {fonts.map((f) => (
            <div key={f.label} className="flex flex-col gap-2 rounded-md border border-border bg-white/70 p-4 backdrop-blur-sm">
              <code className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {f.label}
              </code>
              <div className={f.className}>{f.sample}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
