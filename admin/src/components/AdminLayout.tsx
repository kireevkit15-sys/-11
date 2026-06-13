'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Users,
  Star,
  FileText,
  BookOpen,
  Video,
  BarChart3,
  Megaphone,
  Map,
  Navigation,
  Link2,
  Shield,
  Calendar,
  LogOut,
  ChevronRight,
  Settings,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Услуги', href: '/admin/services', icon: Briefcase },
  { label: 'FAQ', href: '/admin/faqs', icon: MessageSquare },
  { label: 'Команда', href: '/admin/team-members', icon: Users },
  { label: 'Отзывы', href: '/admin/reviews', icon: Star },
  { label: 'Статьи', href: '/admin/articles', icon: BookOpen },
  { label: 'Видео', href: '/admin/videos', icon: Video },
  { label: 'Объявления', href: '/admin/announcements', icon: Megaphone },
  { label: 'Статистика', href: '/admin/statistics', icon: BarChart3 },
  { label: 'Кейсы', href: '/admin/case-studies', icon: FileText },
  { label: 'Округа', href: '/admin/districts', icon: Map },
  { label: 'Навигация', href: '/admin/navigation', icon: Navigation },
  { label: 'Соцсети', href: '/admin/social-links', icon: Link2 },
  { label: 'Доверие', href: '/admin/trust', icon: Shield },
  { label: 'Дедлайны ФСИ', href: '/admin/fsi-deadlines', icon: Calendar },
  { label: 'Глоссарий', href: '/admin/glossary', icon: BookOpen },
  { label: 'Настройки', href: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#0f0f23] text-white flex flex-col fixed left-0 top-0 bottom-0 z-50">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-orange-400 flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
              Д
            </div>
            <div>
              <div className="font-semibold text-lg tracking-tight">Diva Admin</div>
              <div className="text-xs text-white/40">Content Management</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
                      ${isActive(item.href)
                        ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-500/25'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive(item.href) && (
                      <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <div className="px-4 py-2 text-xs text-white/30">
            v1.0.0
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
