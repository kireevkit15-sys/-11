import Link from 'next/link';
import { db } from '@/lib/db';
import { count, eq } from 'drizzle-orm';
import { leads } from '@db/schema';
import { ENTITIES } from '@/lib/entities';
import { getLeadStats as getLeadAnalytics } from '@/lib/stats';
import { LEAD_STATUSES, LEAD_STATUS_ORDER, type LeadStatus } from '@/app/admin/leads/status';
import {
  ArrowRight,
  Briefcase,
  MessageSquare,
  Users,
  Star,
  FileText,
  BookOpen,
  BookText,
  Video,
  BarChart3,
  Megaphone,
  Map,
  Navigation,
  Link2,
  Shield,
  Calendar,
  Handshake,
  Sparkles,
  PanelBottom,
  Inbox,
  type LucideIcon,
} from 'lucide-react';

async function getLeadStats(): Promise<{ total: number; fresh: number }> {
  try {
    const [t] = await db.select({ c: count() }).from(leads);
    const [n] = await db.select({ c: count() }).from(leads).where(eq(leads.status, 'new'));
    return { total: Number(t?.c ?? 0), fresh: Number(n?.c ?? 0) };
  } catch {
    return { total: 0, fresh: 0 };
  }
}

const ICONS: Record<string, LucideIcon> = {
  Briefcase, MessageSquare, Users, Star, FileText, BookOpen, BookText, Video,
  BarChart3, Megaphone, Map, Navigation, Link2, Shield, Calendar, Handshake,
  Sparkles, PanelBottom,
};

const COLORS = [
  { bg: 'bg-brand-100 dark:bg-brand-500/15', text: 'text-brand-700 dark:text-brand-300' },
  { bg: 'bg-coral-100 dark:bg-coral-500/15', text: 'text-coral-600 dark:text-coral-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-blue-100 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-rose-100 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300' },
  { bg: 'bg-indigo-100 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-300' },
  { bg: 'bg-cyan-100 dark:bg-cyan-500/15', text: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-teal-100 dark:bg-teal-500/15', text: 'text-teal-700 dark:text-teal-300' },
  { bg: 'bg-purple-100 dark:bg-purple-500/15', text: 'text-purple-700 dark:text-purple-300' },
];

const GROUP_ORDER = ['Контент', 'Объявления', 'Сайт'];

// Цвета бар-полос воронки статусов (заливка горизонтальной полосы).
const STATUS_BAR_COLOR: Record<LeadStatus, string> = {
  new: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  converted: 'bg-emerald-500',
  lost: 'bg-slate-400',
  spam: 'bg-red-500',
};

// Подпись даты графика как DD.MM из строки YYYY-MM-DD.
function dayTick(day: string): string {
  const parts = day.split('-');
  return parts.length === 3 ? `${parts[2]}.${parts[1]}` : day;
}

async function getCounts(): Promise<Record<string, number>> {
  const entries = Object.values(ENTITIES).filter((e) => !e.hidden);
  const results = await Promise.all(
    entries.map(async (e) => {
      try {
        const [row] = await db.select({ c: count() }).from(e.table);
        return [e.slug, Number(row?.c ?? 0)] as const;
      } catch {
        return [e.slug, 0] as const;
      }
    }),
  );
  return Object.fromEntries(results);
}

export default async function DashboardPage() {
  const counts = await getCounts();
  const leadStats = await getLeadStats();
  const stats = await getLeadAnalytics();
  const entries = Object.values(ENTITIES).filter((e) => !e.hidden);

  // Воронка статусов: масштаб по максимальному count.
  const statusMax = Math.max(1, ...LEAD_STATUS_ORDER.map((s) => stats.leadsByStatus[s]));
  // График новых заявок: масштаб по максимальному дневному count.
  const dayMax = Math.max(1, ...stats.leadsByDay.map((d) => d.count));

  // Группируем по разделам в порядке меню
  const groups = GROUP_ORDER.map((g) => ({
    name: g,
    items: entries.filter((e) => (e.group ?? 'Контент') === g),
  })).filter((grp) => grp.items.length > 0);

  let colorIdx = 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Дашборд</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Управление контентом сайта ДИВА</p>
      </div>

      <Link
        href="/admin/leads"
        className="group mb-8 flex items-center gap-5 overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-600 to-brand-700 p-6 text-white shadow-lg shadow-brand-500/20 transition-all hover:shadow-xl"
      >
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Inbox className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">{leadStats.total}</span>
            {leadStats.fresh > 0 && (
              <span className="rounded-full bg-coral-500 px-2.5 py-0.5 text-xs font-semibold">
                {leadStats.fresh} новых
              </span>
            )}
          </div>
          <div className="mt-0.5 text-sm text-white/80">Заявки с форм сайта</div>
        </div>
        <ArrowRight className="h-5 w-5 text-white/70 transition-transform group-hover:translate-x-1" />
      </Link>

      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Аналитика</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Воронка статусов лидов */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <BarChart3 className="h-5 w-5 text-brand-600" />
              <h3 className="text-sm font-semibold">Воронка статусов заявок</h3>
            </div>
            <div className="mt-4 space-y-3">
              {LEAD_STATUS_ORDER.map((s) => {
                const value = stats.leadsByStatus[s];
                const pct = Math.round((value / statusMax) * 100);
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className="w-20 flex-shrink-0 text-sm text-slate-600 dark:text-slate-400">
                      {LEAD_STATUSES[s].label}
                    </div>
                    <div className="h-6 flex-1 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-md ${STATUS_BAR_COLOR[s]} transition-all`}
                        style={{ width: `${value > 0 ? Math.max(pct, 4) : 0}%` }}
                      />
                    </div>
                    <div className="w-8 flex-shrink-0 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Карточка конверсии */}
          <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-semibold">Конверсия в клиентов</h3>
            </div>
            <div className="mt-3 text-5xl font-bold text-emerald-600 dark:text-emerald-400">{stats.conversion}%</div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Доля заявок со статусом «Клиент» от общего числа.
            </p>
          </div>
        </div>

        {/* График новых заявок за 14 дней */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <BarChart3 className="h-5 w-5 text-coral-500" />
            <h3 className="text-sm font-semibold">Новые заявки за 14 дней</h3>
          </div>
          <div className="mt-5 flex h-40 items-end gap-2">
            {stats.leadsByDay.map((d, i) => {
              const heightPct = d.count > 0 ? Math.max((d.count / dayMax) * 100, 6) : 0;
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex h-full w-full items-end justify-center">
                    <div
                      className="w-full max-w-[28px] rounded-t-md bg-brand-500 transition-all group-hover:bg-brand-600"
                      style={{ height: `${heightPct}%` }}
                      title={`${dayTick(d.day)}: ${d.count}`}
                    />
                    {d.count > 0 && (
                      <span className="absolute -top-5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {d.count}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                    {i % 2 === 0 ? dayTick(d.day) : ' '}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="space-y-10">
        {groups.map((grp) => (
          <section key={grp.name}>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{grp.name}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {grp.items.map((e) => {
                const Icon = ICONS[e.icon] ?? FileText;
                const color = COLORS[colorIdx++ % COLORS.length];
                return (
                  <Link
                    key={e.slug}
                    href={`/admin/${e.slug}`}
                    className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color.bg} ${color.text}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-slate-500 dark:text-slate-500" />
                    </div>
                    <div className="mt-4">
                      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{counts[e.slug] ?? 0}</div>
                      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{e.labelPlural}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
