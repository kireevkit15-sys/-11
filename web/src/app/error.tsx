'use client';

/**
 * Глобальный error boundary для публичного сайта.
 * Показывается при любых необработанных ошибках в RSC-рендере.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-red-100 p-4">
        <svg
          className="h-8 w-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900">
        Что-то пошло не так
      </h2>
      <p className="max-w-md text-sm text-slate-500">
        Попробуйте перезагрузить страницу. Если ошибка повторяется — мы уже знаем о ней.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-slate-400">
          ID ошибки: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Попробовать снова
      </button>
    </div>
  );
}
