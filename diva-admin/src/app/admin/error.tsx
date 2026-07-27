'use client';

import Link from 'next/link';

/**
 * Глобальный error boundary для админ-панели.
 * Next.js требует 'use client' для error.tsx. Логируем в console.error,
 * пользователю — дружелюбное сообщение и кнопка возврата.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
        <svg
          className="h-8 w-8 text-red-600 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Произошла ошибка
      </h2>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
        Не удалось загрузить страницу. Попробуйте перезагрузить или вернуться на дашборд.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-slate-400 dark:text-slate-500">
          ID ошибки: {error.digest}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Попробовать снова
        </button>
        <a
          href="/admin"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          На дашборд
        </a>
      </div>
    </div>
  );
}