/**
 * Глобальный loading-стейт для публичного сайта.
 * Показывается при Suspense при навигации/загрузке RSC.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600"
        aria-label="Загрузка"
      />
      <p className="text-sm text-slate-500">Загрузка…</p>
    </div>
  );
}
