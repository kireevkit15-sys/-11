'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ClientEntity, ColumnConfig } from '@/lib/entities';
import { useToast, useConfirm } from '@/components/providers';

type Row = { id: string } & Record<string, unknown>;

const PAGE_SIZE = 12;

const SYSTEM_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at']);

function renderCell(row: Row, col: ColumnConfig) {
  const value = row[col.key];
  if (col.kind === 'bool') {
    return value ? <span className="text-emerald-600 dark:text-emerald-400">✓</span> : <span className="text-slate-300 dark:text-slate-500">—</span>;
  }
  if (col.kind === 'badge') {
    if (value === null || value === undefined || value === '') return <span className="text-slate-300 dark:text-slate-500">—</span>;
    return (
      <span className="inline-flex rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
        {String(value)}
      </span>
    );
  }
  if (col.kind === 'number') {
    if (value === null || value === undefined) return <span className="text-slate-300 dark:text-slate-500">—</span>;
    return <span className="text-slate-600 dark:text-slate-400">{Number(value).toLocaleString('ru-RU')}</span>;
  }
  const text = value === null || value === undefined ? '' : String(value);
  return <span className="text-slate-700 dark:text-slate-200">{text.length > 60 ? text.slice(0, 60) + '…' : text}</span>;
}

/** Одна строка таблицы. В режиме DnD оборачивается в sortable. */
function EntityRow({
  item,
  idx,
  entity,
  imageField,
  draggable,
  deletingId,
  onDelete,
}: {
  item: Row;
  idx: number;
  entity: ClientEntity;
  imageField: string | undefined;
  draggable: boolean;
  deletingId: string | null;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !draggable });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-slate-100 transition-colors last:border-0 hover:bg-brand-50/30 dark:border-slate-800 dark:hover:bg-brand-950/40 ${
        idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/60' : ''
      } ${isDragging ? 'relative z-10 bg-white shadow-lg dark:bg-slate-900' : ''}`}
    >
      {draggable && (
        <td className="w-10 px-2 py-3">
          <button
            type="button"
            className="cursor-grab touch-none rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing dark:text-slate-500 dark:hover:bg-slate-800"
            aria-label="Перетащить для сортировки"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </td>
      )}
      {imageField && (
        <td className="px-4 py-3">
          {item[imageField] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(item[imageField])}
              alt=""
              className="h-10 w-10 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
          )}
        </td>
      )}
      {entity.columns.map((col) => (
        <td key={col.key} className="px-6 py-4 align-top">
          {renderCell(item, col)}
        </td>
      ))}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/${entity.slug}/${item.id}`}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
            title="Редактировать"
            aria-label="Редактировать"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          {!entity.singleton && (
            <button
              onClick={() => onDelete(item.id)}
              disabled={deletingId === item.id}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              title="Удалить"
              aria-label="Удалить"
            >
              {deletingId === item.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function EntityList({ entity }: { entity: ClientEntity }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const imageField = useMemo(
    () => entity.fields.find((f) => f.type === 'image')?.name,
    [entity.fields],
  );

  const hasSortOrder = useMemo(
    () => entity.fields.some((f) => f.name === 'sortOrder'),
    [entity.fields],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/${entity.slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setItems(data.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, [entity.slug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: `Удалить «${entity.label}»?`,
      message: 'Действие необратимо. Запись будет удалена навсегда.',
      confirmText: 'Удалить',
      danger: true,
    });
    if (!ok) return;
    // Сохраняем удаляемую строку для возможности отмены.
    const removed = items.find((x) => x.id === id);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/${entity.slug}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Не удалось удалить');
      }
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast(
        'success',
        'Запись удалена',
        removed
          ? {
              label: 'Отменить',
              onClick: () => void restoreRow(removed),
            }
          : undefined,
      );
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Ошибка удаления');
    } finally {
      setDeletingId(null);
    }
  };

  /** Восстанавливает удалённую строку: пересоздаёт её через POST. */
  const restoreRow = async (removed: Row) => {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(removed)) {
      if (SYSTEM_FIELDS.has(k)) continue;
      payload[k] = v;
    }
    try {
      const res = await fetch(`/api/${entity.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось восстановить');
      await load();
      toast('success', 'Восстановлено');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Ошибка восстановления');
    }
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    const keys = [entity.titleField, ...entity.columns.map((c) => c.key)];
    return items.filter((row) =>
      keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)),
    );
  }, [items, query, entity.titleField, entity.columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av ?? '').localeCompare(String(bv ?? ''), 'ru');
    });
    if (sortDir === 'desc') arr.reverse();
    return arr;
  }, [filtered, sortKey, sortDir]);

  // DnD активен только когда список показан «как есть»: есть sortOrder,
  // нет поиска и кастомной сортировки, не singleton. В этом режиме
  // видимый порядок совпадает с порядком в БД, поэтому пагинацию отключаем
  // и показываем все элементы — чтобы отправлять полный порядок id.
  const dndEnabled = hasSortOrder && !entity.singleton && sortKey === null && !query.trim();

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const effectivePage = dndEnabled ? 1 : page;
  const pageItems = dndEnabled
    ? sorted
    : sorted.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);
  const showAdd = !(entity.singleton && items.length >= 1);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((x) => x.id === active.id);
    const newIndex = items.findIndex((x) => x.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const prev = items;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next); // оптимистично

    const ids = next.map((x) => x.id);
    void (async () => {
      try {
        const res = await fetch(`/api/${entity.slug}/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Не удалось сохранить порядок');
        }
      } catch (e) {
        setItems(prev); // откат
        toast('error', e instanceof Error ? e.message : 'Ошибка сортировки');
      }
    })();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin" className="mb-1 inline-block text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            ← Дашборд
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{entity.labelPlural}</h1>
          {!isLoading && (
            <p className="mt-0.5 text-sm text-slate-400 dark:text-slate-500">
              {items.length} {items.length === 1 ? 'запись' : 'записей'}
            </p>
          )}
        </div>
        {showAdd && (
          <Link
            href={`/admin/${entity.slug}/new`}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 font-medium text-white transition-all hover:from-brand-700 hover:to-brand-800"
          >
            <Plus className="h-5 w-5" /> Добавить
          </Link>
        )}
      </div>

      {/* Поиск */}
      {items.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Поиск…"
            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
          />
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
            <Inbox className="h-7 w-7" />
          </div>
          <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">Здесь пока пусто</p>
          <p className="mb-5 text-sm text-slate-400 dark:text-slate-500">Добавьте первую запись в раздел «{entity.labelPlural}»</p>
          {showAdd && (
            <Link
              href={`/admin/${entity.slug}/new`}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 font-medium text-white hover:from-brand-700 hover:to-brand-800"
            >
              <Plus className="h-5 w-5" /> Добавить
            </Link>
          )}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Ничего не найдено по запросу «{query}»
        </div>
      ) : (
        <>
          {dndEnabled && (
            <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">
              Перетаскивайте строки за «ручку» слева, чтобы изменить порядок.
            </p>
          )}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                      {dndEnabled && <th className="w-10 px-2 py-3" />}
                      {imageField && <th className="w-16 px-4 py-3" />}
                      {entity.columns.map((col) => {
                        const active = sortKey === col.key;
                        return (
                          <th key={col.key} className="px-6 py-3 text-left">
                            <button
                              onClick={() => toggleSort(col.key)}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-300"
                            >
                              {col.label}
                              {active &&
                                (sortDir === 'asc' ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ))}
                            </button>
                          </th>
                        );
                      })}
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext
                      items={pageItems.map((x) => x.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {pageItems.map((item, idx) => (
                        <EntityRow
                          key={item.id}
                          item={item}
                          idx={idx}
                          entity={entity}
                          imageField={imageField}
                          draggable={dndEnabled}
                          deletingId={deletingId}
                          onDelete={handleDelete}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </DndContext>
            </div>
          </div>

          {/* Пагинация (в режиме DnD отключена — показаны все элементы) */}
          {!dndEnabled && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Стр. {page} из {totalPages} · всего {sorted.length}
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
