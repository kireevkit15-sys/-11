'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Search,
  Inbox,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AuditRow {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  ip: string | null;
  createdAt: string;
}

const PAGE_SIZE = 25;

/** Стиль бейджа по типу действия. */
const ACTION_STYLES: Record<string, string> = {
  login: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  logout: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  login_failed: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  password_change: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
};

const DEFAULT_ACTION_STYLE = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

function actionBadge(action: string) {
  const cls = ACTION_STYLES[action] ?? DEFAULT_ACTION_STYLE;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {action}
    </span>
  );
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('ru-RU');
}

export function AuditList() {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setItems(Array.isArray(data.data) ? (data.data as AuditRow[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Уникальные значения для фильтров — собираем из загруженных данных.
  const actionOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.action))).sort((a, b) => a.localeCompare(b, 'ru')),
    [items],
  );
  const entityOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.entity))).sort((a, b) => a.localeCompare(b, 'ru')),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((row) => {
      if (actionFilter && row.action !== actionFilter) return false;
      if (entityFilter && row.entity !== entityFilter) return false;
      if (!q) return true;
      return [
        row.action,
        row.entity,
        row.entityId ?? '',
        row.actorName ?? '',
        row.actorEmail ?? '',
        row.ip ?? '',
      ].some((v) => v.toLowerCase().includes(q));
    });
  }, [items, query, actionFilter, entityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="mb-1 inline-block text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          ← Дашборд
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Журнал действий</h1>
        {!isLoading && (
          <p className="mt-0.5 text-sm text-slate-400 dark:text-slate-500">
            {filtered.length} {filtered.length === 1 ? 'запись' : 'записей'}
          </p>
        )}
      </div>

      {/* Фильтры */}
      {items.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              placeholder="Поиск…"
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              resetPage();
            }}
            className="rounded-xl border border-slate-300 py-2 pl-3 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          >
            <option value="">Все действия</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              resetPage();
            }}
            className="rounded-xl border border-slate-300 py-2 pl-3 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          >
            <option value="">Все сущности</option>
            {entityOptions.map((en) => (
              <option key={en} value={en}>
                {en}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12 dark:border-slate-700 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-950/40 dark:text-brand-300">
            <ScrollText className="h-7 w-7" />
          </div>
          <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">Журнал пуст</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Действия в админ-панели пока не записаны</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <Inbox className="h-7 w-7" />
          </div>
          <p className="font-medium text-slate-700 dark:text-slate-200">Ничего не найдено</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Когда</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Кто</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Действие</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Сущность</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Объект</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((row, idx) => {
                    const actor = row.actorName || row.actorEmail;
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-slate-100 transition-colors last:border-0 hover:bg-brand-50/30 dark:border-slate-800 dark:hover:bg-brand-950/40 ${
                          idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/60' : ''
                        }`}
                      >
                        <td className="whitespace-nowrap px-6 py-4 align-top text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="px-6 py-4 align-top">
                          {actor ? (
                            <span className="text-sm text-slate-700 dark:text-slate-200">
                              {row.actorName ?? ''}
                              {row.actorName && row.actorEmail ? (
                                <span className="block text-xs text-slate-400 dark:text-slate-500">{row.actorEmail}</span>
                              ) : !row.actorName && row.actorEmail ? (
                                <span className="text-slate-700 dark:text-slate-200">{row.actorEmail}</span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">{actionBadge(row.action)}</td>
                        <td className="px-6 py-4 align-top text-sm text-slate-700 dark:text-slate-200">
                          {row.entity || <span className="text-slate-300 dark:text-slate-500">—</span>}
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-500 dark:text-slate-400">
                          {row.entityId ? (
                            <span className="font-mono text-xs">{row.entityId}</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Стр. {page} из {totalPages} · всего {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Назад"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Вперёд"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
