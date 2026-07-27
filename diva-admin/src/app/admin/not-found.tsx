import Link from 'next/link';

/**
 * 404 для админ-панели. Показывается при несуществующих путях внутри /admin.
 * Отдельный от web/404, потому что здесь другая навигация.
 */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
        <svg
          className="h-8 w-8 text-slate-500 dark:text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Страница не найдена
      </h2>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
        Возможно, страница была удалена или вы перешли по устаревшей ссылке.
      </p>
      <Link
        href="/admin"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Вернуться на дашборд
      </Link>
    </div>
  );
}
