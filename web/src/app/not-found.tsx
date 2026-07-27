/**
 * 404 для публичного сайта.
 *
 * 'use client' — чтобы Next.js не пытался prerender-ить как server-component
 * (на 15.5+ возникала ошибка `Objects are not valid as a React child`
 * при статической генерации /404, связанная с алиасами @/db в server-side
 * бандле). Client component не вовлекается в prerender.
 */
'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-slate-100 p-4">
        <svg
          className="h-8 w-8 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900">
        Страница не найдена
      </h2>
      <p className="max-w-md text-sm text-slate-500">
        Возможно, страница была перемещена или удалена.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        На главную
      </Link>
    </div>
  );
}
