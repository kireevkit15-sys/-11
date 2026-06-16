'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Globe,
  FileText,
  Tag,
  Clock,
  MessageSquarePlus,
  Send,
} from 'lucide-react';
import { useToast } from '@/components/providers';
import { LEAD_STATUS_ORDER, statusMeta } from '../status';

interface Lead {
  id: string;
  name: string;
  contact: string;
  source: string | null;
  page: string | null;
  utm: Record<string, string> | null;
  status: string;
  notes: string | null;
  interactionAt: string | null;
  createdAt: string;
}

interface LeadNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
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

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</div>
        <div className="mt-0.5 break-words text-sm text-slate-800 dark:text-slate-200">{children}</div>
      </div>
    </div>
  );
}

export function LeadDetail({ id }: { id: string }) {
  const toast = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [savingStatus, setSavingStatus] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setLead(data.data.lead);
      setNotes(data.data.notes || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (status: string) => {
    if (!lead || status === lead.status) return;
    const prev = lead.status;
    setLead({ ...lead, status });
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось обновить статус');
      toast('success', 'Статус обновлён');
    } catch (e) {
      setLead((cur) => (cur ? { ...cur, status: prev } : cur));
      toast('error', e instanceof Error ? e.message : 'Ошибка обновления');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = noteText.trim();
    if (!text) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/leads/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось добавить заметку');
      setNotes((prev) => [...prev, data.data]);
      setNoteText('');
      toast('success', 'Заметка добавлена');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setAddingNote(false);
    }
  };

  const utmEntries = lead?.utm ? Object.entries(lead.utm).filter(([, v]) => v) : [];

  return (
    <div>
      <Link
        href="/admin/leads"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> К заявкам
      </Link>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12 dark:border-slate-700 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : error || !lead ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error || 'Заявка не найдена'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Карточка лида */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{lead.name}</h1>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta(lead.status).badge}`}
                  >
                    {statusMeta(lead.status).label}
                  </span>
                </div>
                <div className="w-full sm:w-auto">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Сменить статус
                  </label>
                  <div className="relative">
                    <select
                      value={lead.status}
                      disabled={savingStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2 pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 sm:w-48 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                    >
                      {LEAD_STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {statusMeta(s).label}
                        </option>
                      ))}
                    </select>
                    {savingStatus && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-600" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow icon={User} label="Имя">
                  {lead.name}
                </InfoRow>
                <InfoRow icon={Phone} label="Контакт">
                  {lead.contact}
                </InfoRow>
                <InfoRow icon={Tag} label="Источник">
                  {lead.source || <span className="text-slate-300 dark:text-slate-500">—</span>}
                </InfoRow>
                <InfoRow icon={Globe} label="Страница">
                  {lead.page || <span className="text-slate-300 dark:text-slate-500">—</span>}
                </InfoRow>
                <InfoRow icon={Clock} label="Создана">
                  {formatDate(lead.createdAt)}
                </InfoRow>
                <InfoRow icon={Clock} label="Последнее взаимодействие">
                  {formatDate(lead.interactionAt)}
                </InfoRow>
              </div>

              {/* UTM */}
              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">UTM-метки</div>
                {utmEntries.length === 0 ? (
                  <p className="text-sm text-slate-300 dark:text-slate-500">—</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {utmEntries.map(([k, v]) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <span className="font-medium text-slate-500 dark:text-slate-400">{k}:</span> {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {lead.notes && (
                <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    <FileText className="h-3.5 w-3.5" /> Сообщение из формы
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{lead.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Заметки (timeline) */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                <MessageSquarePlus className="h-5 w-5 text-brand-600" /> Заметки
              </h2>

              <form onSubmit={handleAddNote} className="mb-5">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="Добавить заметку…"
                  className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={addingNote || !noteText.trim()}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white transition-all hover:from-brand-700 hover:to-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingNote ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Добавить
                </button>
              </form>

              {notes.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">Заметок пока нет</p>
              ) : (
                <ol className="relative space-y-5 border-l border-slate-200 pl-5 dark:border-slate-700">
                  {notes.map((note) => (
                    <li key={note.id} className="relative">
                      <span className="absolute -left-[1.45rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500 dark:border-slate-900" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{note.author}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(note.createdAt)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{note.text}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
