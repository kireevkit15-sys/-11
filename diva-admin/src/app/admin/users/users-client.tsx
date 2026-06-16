'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Inbox,
  ShieldCheck,
  X,
  KeyRound,
} from 'lucide-react';
import { useToast, useConfirm } from '@/components/providers';
import type { AdminRole } from '@/lib/auth';

// Метки ролей заданы локально: '@/lib/rbac' тянет server-only код в клиентский бандл.
const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  editor: 'Редактор',
  viewer: 'Наблюдатель',
};

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  requirePasswordChange: boolean;
  createdAt: string;
}

const ROLE_OPTIONS: AdminRole[] = ['admin', 'editor', 'viewer'];

const ROLE_BADGE: Record<AdminRole, string> = {
  admin: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  editor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  viewer: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type FormMode = { kind: 'create' } | { kind: 'edit'; user: AdminUserRow };

export function UsersClient({ currentUserId }: { currentUserId: string }) {
  const toast = useToast();
  const confirm = useConfirm();

  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setItems(data.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (user: AdminUserRow) => {
    const ok = await confirm({
      title: 'Удалить пользователя?',
      message: `Учётная запись «${user.email}» будет удалена навсегда. Действие необратимо.`,
      confirmText: 'Удалить',
      danger: true,
    });
    if (!ok) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Не удалось удалить');
      }
      setItems((prev) => prev.filter((x) => x.id !== user.id));
      toast('success', 'Пользователь удалён');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Ошибка удаления');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    setFormMode(null);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin" className="mb-1 inline-block text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            ← Дашборд
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Пользователи</h1>
              {!isLoading && (
                <p className="mt-0.5 text-sm text-slate-400 dark:text-slate-500">
                  {items.length} {items.length === 1 ? 'администратор' : 'администраторов'}
                </p>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setFormMode({ kind: 'create' })}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 font-medium text-white transition-all hover:from-brand-700 hover:to-brand-800"
        >
          <Plus className="h-5 w-5" /> Добавить пользователя
        </button>
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
          <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">Здесь пока пусто</p>
          <p className="mb-5 text-sm text-slate-400 dark:text-slate-500">Добавьте первого пользователя админ-панели</p>
          <button
            onClick={() => setFormMode({ kind: 'create' })}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 font-medium text-white hover:from-brand-700 hover:to-brand-800"
          >
            <Plus className="h-5 w-5" /> Добавить пользователя
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Имя</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Роль</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Создан</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-100 transition-colors last:border-0 hover:bg-brand-50/30 dark:border-slate-800 dark:hover:bg-brand-950/40 ${
                      idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/60' : ''
                    }`}
                  >
                    <td className="px-6 py-4 align-middle">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{item.email}</span>
                      {item.id === currentUserId && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">вы</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle text-slate-700 dark:text-slate-200">{item.name}</td>
                    <td className="px-6 py-4 align-middle">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_BADGE[item.role]}`}>
                        {ROLE_LABELS[item.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-slate-600 dark:text-slate-400">{formatDate(item.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setFormMode({ kind: 'edit', user: item })}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                          title="Редактировать"
                          aria-label="Редактировать"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id || item.id === currentUserId}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                          title={item.id === currentUserId ? 'Нельзя удалить себя' : 'Удалить'}
                          aria-label="Удалить"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formMode && (
        <UserFormModal
          mode={formMode}
          currentUserId={currentUserId}
          onClose={() => setFormMode(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function UserFormModal({
  mode,
  currentUserId,
  onClose,
  onSaved,
}: {
  mode: FormMode;
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const isEdit = mode.kind === 'edit';
  const editing = isEdit ? mode.user : null;
  const isSelf = editing?.id === currentUserId;

  const [email, setEmail] = useState(editing?.email ?? '');
  const [name, setName] = useState(editing?.name ?? '');
  const [role, setRole] = useState<AdminRole>(editing?.role ?? 'editor');
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(!isEdit);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      let res: Response;
      if (isEdit && editing) {
        const body: Record<string, unknown> = { name, role };
        if (showPasswordField && password) body.password = password;
        res = await fetch(`/api/users/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, role, password }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось сохранить');
      toast('success', isEdit ? 'Пользователь обновлён' : 'Пользователь создан');
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка сервера');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="animate-overlay-in absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="animate-dialog-in relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="mb-5 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Редактировать пользователя' : 'Новый пользователь'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{formError}</div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={!isEdit}
              disabled={isEdit}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:disabled:bg-slate-800/60 dark:disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Роль</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              disabled={isSelf}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:disabled:bg-slate-800/60 dark:disabled:text-slate-500"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            {isSelf && (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Нельзя изменить собственную роль</p>
            )}
          </div>

          {isEdit ? (
            showPasswordField ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Новый пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  placeholder="Минимум 8 символов: A-Z, a-z, 0-9"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                />
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  При следующем входе пользователь должен будет сменить пароль.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPasswordField(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <KeyRound className="h-4 w-4" /> Сбросить пароль
              </button>
            )
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Минимум 8 символов: A-Z, a-z, 0-9"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2 text-sm font-semibold text-white hover:from-brand-700 hover:to-brand-800 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
