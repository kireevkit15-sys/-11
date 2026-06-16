'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Inbox, Inbox as InboxIcon } from 'lucide-react';
import { useToast } from '@/components/providers';
import { LEAD_STATUS_ORDER, statusMeta } from './status';

interface Lead {
  id: string;
  name: string;
  contact: string;
  source: string | null;
  status: string;
  createdAt: string;
}

type StatusFilter = 'all' | (typeof LEAD_STATUS_ORDER)[number];

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LeadsList() {
  const toast = useToast();
  const router = useRouter();
  const [items, setItems] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setItems(data.data || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки';
      setError(msg);
      toast('error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const s of LEAD_STATUS_ORDER) c[s] = 0;
    for (const it of items) c[it.status] = (c[it.status] ?? 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    let rows = items;
    if (statusFilter !== 'all') rows = rows.filter((r) => r.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.contact ?? '').toLowerCase().includes(q),
      );
    }
    return rows;
  }, [items, statusFilter, query]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          <InboxIcon className="h-6 w-6 text-brand-600" /> Заявки
        </h1>
        {!isLoading && (
          <p className="mt-0.5 text-sm text-slate-400 dark:text-slate-500">
            {items.length} {items.length === 1 ? 'заявка' : 'заявок'}
          </p>
        )}
      </div>

      {/* Фильтр по статусу */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', ...LEAD_STATUS_ORDER] as StatusFilter[]).map((s) => {
          const active = statusFilter === s;
          const label = s === 'all' ? 'Все' : statusMeta(s).label;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {label}
              <span className={`ml-1.5 ${active ? 'text-brand-100' : 'text-slate-400 dark:text-slate-500'}`}>
                {counts[s] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Поиск */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по имени или контакту…"
          className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12 dark:border-slate-700 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-950/40 dark:text-brand-300">
            <Inbox className="h-7 w-7" />
          </div>
          <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">Заявок пока нет</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Они появятся здесь после отправки форм на сайте</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Ничего не найдено
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Имя</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Контакт</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Источник</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Статус</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Дата</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, idx) => {
                  const meta = statusMeta(lead.status);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`/admin/leads/${lead.id}`)}
                      className={`cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-brand-50/30 dark:border-slate-800 dark:hover:bg-brand-950/40 ${
                        idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/60' : ''
                      }`}
                    >
                      <td className="px-6 py-4 align-top font-medium text-slate-800 dark:text-slate-100">{lead.name}</td>
                      <td className="px-6 py-4 align-top text-slate-700 dark:text-slate-200">{lead.contact}</td>
                      <td className="px-6 py-4 align-top text-slate-600 dark:text-slate-400">
                        {lead.source || <span className="text-slate-300 dark:text-slate-500">—</span>}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(lead.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
