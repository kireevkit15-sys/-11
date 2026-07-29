'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  LayoutDashboard,
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
  History,
  ShieldCheck,
  KeyRound,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommandPalette, type CommandItem } from '@/components/command-palette';
import { ThemeToggle } from '@/components/theme-toggle';

function openPalette() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
}

const ICONS: Record<string, LucideIcon> = {
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
};

export interface NavEntry {
  slug: string;
  label: string;
  icon: string;
  group?: string;
}

export function AdminShell({
  nav,
  user,
  children,
}: {
  nav: NavEntry[];
  user: { name: string; email: string; role: string } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (slug: string) => pathname === `/admin/${slug}` || pathname.startsWith(`/admin/${slug}/`);

  // Элементы для командной палитры ⌘K
  const commandItems: CommandItem[] = [
    { label: 'Дашборд', href: '/admin', group: 'Навигация', icon: 'LayoutDashboard' },
    ...nav.map((n) => ({ label: n.label, href: `/admin/${n.slug}`, group: 'Контент', icon: n.icon })),
    { label: 'Заявки', href: '/admin/leads', group: 'Система', icon: 'Inbox' },
    ...(user?.role === 'admin'
      ? [
          { label: 'Журнал', href: '/admin/audit', group: 'Система', icon: 'History' },
          { label: 'Пользователи', href: '/admin/users', group: 'Система', icon: 'ShieldCheck' },
        ]
      : []),
    { label: 'Сменить пароль', href: '/admin/change-password', group: 'Система', icon: 'KeyRound' },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-slate-950">
      <CommandPalette items={commandItems} />
      {/* Мобильная шапка с бургером */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Открыть меню"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold text-slate-800 dark:text-slate-100">DIVA Admin</span>
        <button
          onClick={openPalette}
          aria-label="Поиск (Ctrl+K)"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Затемнение под drawer на мобильных */}
      {open && (
        <div
          className="animate-overlay-in fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 flex w-64 flex-col bg-gradient-to-b from-deep-bg-1 to-deep-bg-3 text-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-coral-400 flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
              Д
            </div>
            <div>
              <div className="font-semibold text-lg tracking-tight">DIVA Admin</div>
              <div className="text-xs text-white/40">Управление контентом</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all',
                  pathname === '/admin'
                    ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-500/25'
                    : 'text-white/60 hover:text-white hover:bg-white/10',
                )}
              >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Дашборд</span>
                {pathname === '/admin' && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
              </Link>
            </li>
            {nav.map((item, i) => {
              const Icon = ICONS[item.icon] ?? FileText;
              const active = isActive(item.slug);
              const showGroup = item.group && item.group !== nav[i - 1]?.group;
              return (
                <li key={item.slug}>
                  {showGroup && (
                    <div className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                      {item.group}
                    </div>
                  )}
                  <Link
                    href={`/admin/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all',
                      active
                        ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-500/25'
                        : 'text-white/60 hover:text-white hover:bg-white/10',
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {active && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                  </Link>
                </li>
              );
            })}

            {/* Системные разделы */}
            <li>
              <div className="px-4 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                Система
              </div>
            </li>
            {[
              { slug: 'leads', label: 'Заявки', Icon: Inbox, adminOnly: false },
              { slug: 'audit', label: 'Журнал', Icon: History, adminOnly: true },
              { slug: 'users', label: 'Пользователи', Icon: ShieldCheck, adminOnly: true },
            ]
              .filter((s) => !s.adminOnly || user?.role === 'admin')
              .map((s) => {
                const active = isActive(s.slug);
                return (
                  <li key={s.slug}>
                    <Link
                      href={`/admin/${s.slug}`}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all',
                        active
                          ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-500/25'
                          : 'text-white/60 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <s.Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{s.label}</span>
                      {active && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          {user && (
            <div className="px-4 py-2">
              <div className="text-sm font-medium text-white/90 truncate">{user.name}</div>
              <div className="text-xs text-white/40 truncate">{user.email}</div>
            </div>
          )}
          <button
            onClick={openPalette}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Поиск</span>
            <kbd className="ml-auto rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/40">⌘K</kbd>
          </button>
          <ThemeToggle />
          <Link
            href="/admin/change-password"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
          >
            <KeyRound className="h-4 w-4" />
            <span className="text-sm">Сменить пароль</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Выйти</span>
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <div className="mx-auto max-w-7xl p-5 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
