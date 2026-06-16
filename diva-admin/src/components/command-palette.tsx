'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Inbox,
  History,
  ShieldCheck,
  FileText,
  Megaphone,
  Star,
  MessageSquare,
  Video,
  BarChart3,
  Sparkles,
  PanelBottom,
  KeyRound,
  Search,
  CornerDownLeft,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommandItem {
  label: string;
  href: string;
  group?: string;
  icon?: string;
}

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Briefcase,
  Users,
  Inbox,
  History,
  ShieldCheck,
  FileText,
  Megaphone,
  Star,
  MessageSquare,
  Video,
  BarChart3,
  Sparkles,
  PanelBottom,
  KeyRound,
  Search,
};

const UNGROUPED = '__ungrouped__';

export function CommandPalette({ items }: { items: CommandItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Глобальный хоткей открытия/закрытия
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Сброс состояния при открытии
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  // Плоский отфильтрованный список (порядок = порядок отображения)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.label.toLowerCase().includes(q));
  }, [items, query]);

  // Сгруппированный для рендера, с сохранением плоского индекса
  const groups = useMemo(() => {
    const map = new Map<string, { item: CommandItem; index: number }[]>();
    filtered.forEach((item, index) => {
      const key = item.group ?? UNGROUPED;
      const arr = map.get(key);
      if (arr) arr.push({ item, index });
      else map.set(key, [{ item, index }]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Удерживаем активный индекс в пределах списка
  useEffect(() => {
    setActive((a) => (filtered.length === 0 ? 0 : Math.min(a, filtered.length - 1)));
  }, [filtered.length]);

  // Прокрутка к активному пункту
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const go = useCallback(
    (item: CommandItem | undefined) => {
      if (!item) return;
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (filtered.length === 0 ? 0 : (a + 1) % filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (filtered.length === 0 ? 0 : (a - 1 + filtered.length) % filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(filtered[active]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="animate-overlay-in absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Командная палитра"
        className="animate-dialog-in relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        {/* Поле поиска */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
          <Search className="h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Поиск раздела…"
            className="flex-1 bg-transparent py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <kbd className="hidden flex-shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
            esc
          </kbd>
        </div>

        {/* Список результатов */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400 dark:text-slate-500">Ничего не найдено</div>
          ) : (
            groups.map(([groupKey, entries]) => (
              <div key={groupKey} className="mb-1 last:mb-0">
                {groupKey !== UNGROUPED && (
                  <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    {groupKey}
                  </div>
                )}
                <ul>
                  {entries.map(({ item, index }) => {
                    const Icon = (item.icon && ICONS[item.icon]) || Search;
                    const isActive = index === active;
                    return (
                      <li key={`${item.href}-${index}`}>
                        <button
                          type="button"
                          data-index={index}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => go(item)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                            isActive
                              ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-sm shadow-brand-500/25'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
                          )}
                        >
                          <Icon className={cn('h-[18px] w-[18px] flex-shrink-0', isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500')} />
                          <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                          {isActive && <CornerDownLeft className="h-4 w-4 flex-shrink-0 opacity-70" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* Подсказка */}
        <div className="flex items-center justify-center gap-1 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
          ↑↓ навигация · ↵ выбрать · esc закрыть
        </div>
      </div>
    </div>
  );
}
