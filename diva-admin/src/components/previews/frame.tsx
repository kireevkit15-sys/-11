/**
 * Тёмный «фрейм сайта» — фон под превью, имитирующий aurora-dark секцию сайта.
 * Используется всеми превью, чтобы карточки выглядели как на боевом сайте.
 */

export function PreviewFrame({
  children,
  label = 'Так это будет на сайте',
  padded = true,
}: {
  children: React.ReactNode;
  label?: string;
  padded?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <div
        className={`relative overflow-hidden ${padded ? 'p-6' : ''}`}
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 0%, #211a3e 0%, #14102a 45%, #0f0b1e 100%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #fb923c, transparent 70%)' }}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
