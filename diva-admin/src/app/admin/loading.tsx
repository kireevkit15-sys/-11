/**
 * Глобальный loading-стейт для админ-панели.
 * Показывается Next.js при Suspense на навигации между страницами /admin.
 */
export default function AdminLoading() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 dark:border-slate-700"
        aria-label="Загрузка"
      />
      <p className="text-sm text-slate-500 dark:text-slate-400">Загрузка…</p>
    </div>
  );
}
