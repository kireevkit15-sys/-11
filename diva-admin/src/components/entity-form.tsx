'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import type { ClientEntity, FieldConfig } from '@/lib/entities';
import { EntityPreview, hasPreview } from '@/components/previews/registry';
import { ImageField } from '@/components/image-field';
import { useToast } from '@/components/providers';

type FormState = Record<string, string | boolean | string[]>;

function emptyValue(field: FieldConfig): string | boolean | string[] {
  if (field.type === 'list') return [];
  if (field.type === 'checkbox') return false;
  return '';
}

function toFormValue(field: FieldConfig, raw: unknown): string | boolean | string[] {
  if (field.type === 'list') return Array.isArray(raw) ? raw.map(String) : [];
  if (field.type === 'json') {
    if (raw === null || raw === undefined || raw === '') return '';
    return typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
  }
  if (field.type === 'checkbox') return Boolean(raw);
  if (field.type === 'date') {
    if (!raw) return '';
    const d = new Date(String(raw));
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }
  return raw === null || raw === undefined ? '' : String(raw);
}

export function EntityForm({ entity, id }: { entity: ClientEntity; id?: string }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(id);

  // Группировка полей по секциям (FieldConfig.group), порядок сохраняется.
  const fieldGroups = useMemo(() => {
    const order: string[] = [];
    const byGroup: Record<string, FieldConfig[]> = {};
    for (const f of entity.fields) {
      const g = f.group || 'Основное';
      if (!byGroup[g]) {
        byGroup[g] = [];
        order.push(g);
      }
      byGroup[g].push(f);
    }
    return order.map((name) => ({ name, fields: byGroup[name] }));
  }, [entity.fields]);
  const [form, setForm] = useState<FormState>(() => {
    const init: FormState = {};
    for (const f of entity.fields) init[f.name] = emptyValue(f);
    return init;
  });
  const [newListItem, setNewListItem] = useState<Record<string, string>>({});
  const [isFetching, setIsFetching] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const loadRecord = useCallback(async () => {
    if (!id) return;
    setIsFetching(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/${entity.slug}/${id}`);
      const data = await res.json();
      if (res.ok && data.data) {
        const next: FormState = {};
        for (const f of entity.fields) next[f.name] = toFormValue(f, data.data[f.name]);
        setForm(next);
      } else {
        setLoadError(data.error || 'Не удалось загрузить запись');
      }
    } catch {
      setLoadError('Не удалось загрузить запись');
    } finally {
      setIsFetching(false);
    }
  }, [entity.slug, entity.fields, id]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const set = (name: string, value: string | boolean | string[]) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const addListItem = (name: string) => {
    const val = (newListItem[name] || '').trim();
    if (!val) return;
    set(name, [...((form[name] as string[]) || []), val]);
    setNewListItem((p) => ({ ...p, [name]: '' }));
  };

  const removeListItem = (name: string, idx: number) => {
    set(name, ((form[name] as string[]) || []).filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/${entity.slug}/${id}` : `/api/${entity.slug}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Не удалось сохранить');
      }
      toast('success', isEdit ? 'Изменения сохранены' : 'Запись создана');
      router.push(`/admin/${entity.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сервера');
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  // Не показываем пустую форму при ошибке загрузки — иначе сохранение затрёт запись
  if (isEdit && loadError) {
    return (
      <div className="max-w-xl">
        <Link
          href={`/admin/${entity.slug}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> К списку
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <p className="font-medium">Не удалось загрузить запись</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/admin/${entity.slug}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="w-4 h-4" /> К списку
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6 dark:text-slate-100">
        {isEdit ? `Редактирование: ${entity.label}` : `Новый объект: ${entity.label}`}
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="w-full xl:max-w-2xl xl:flex-1 bg-white rounded-xl border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-8">
          {fieldGroups.map((grp) => (
            <div key={grp.name} className="space-y-5">
              {fieldGroups.length > 1 && (
                <h3 className="border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  {grp.name}
                </h3>
              )}
              {grp.fields.map((field) => (
            <div key={field.name}>
              {field.type !== 'checkbox' && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-200">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
              )}

              {field.type === 'textarea' || field.type === 'json' ? (
                <textarea
                  value={form[field.name] as string}
                  onChange={(e) => set(field.name, e.target.value)}
                  rows={field.type === 'json' ? 8 : 4}
                  placeholder={field.placeholder}
                  className={`w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500${field.type === 'json' ? ' font-mono text-xs' : ''}`}
                />
              ) : field.type === 'select' ? (
                <select
                  value={form[field.name] as string}
                  onChange={(e) => set(field.name, e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                >
                  <option value="">— выберите —</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[field.name] as boolean}
                    onChange={(e) => set(field.name, e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{field.label}</span>
                </label>
              ) : field.type === 'list' ? (
                <div className="space-y-2">
                  {((form[field.name] as string[]) || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex-1 px-4 py-2 bg-slate-50 rounded-lg text-sm dark:bg-slate-800/60 dark:text-slate-200">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeListItem(field.name, i)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newListItem[field.name] || ''}
                      onChange={(e) => setNewListItem((p) => ({ ...p, [field.name]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addListItem(field.name);
                        }
                      }}
                      placeholder="Добавить пункт…"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => addListItem(field.name)}
                      className="p-2 border border-slate-300 rounded-xl hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : field.type === 'image' ? (
                <ImageField
                  value={form[field.name] as string}
                  onChange={(v) => set(field.name, v)}
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  value={form[field.name] as string}
                  onChange={(e) => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                />
              )}

              {field.help && <p className="text-xs text-slate-400 mt-1 dark:text-slate-500">{field.help}</p>}
            </div>
              ))}
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl font-medium hover:from-brand-700 hover:to-brand-800 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSubmitting ? 'Сохранение…' : 'Сохранить'}
            </button>
            <Link
              href={`/admin/${entity.slug}`}
              className="px-6 py-2.5 border border-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Отмена
            </Link>
          </div>
        </form>
        </div>

        {hasPreview(entity.slug) && (
          <div className="w-full xl:w-[460px] xl:shrink-0 xl:sticky xl:top-6">
            <EntityPreview slug={entity.slug} values={form} excludeId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
