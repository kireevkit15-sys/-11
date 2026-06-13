import Link from 'next/link';
import {
  Briefcase,
  MessageSquare,
  Users,
  FileText,
  Star,
  BookOpen,
  Video,
  BarChart3,
  Megaphone,
} from 'lucide-react';

const teamItems = [
  { label: 'Команда', href: '/admin/team-members', icon: Users },
  { label: 'Отзывы', href: '/admin/reviews', icon: Star },
];

const contentItems = [
  { label: 'Кейсы', href: '/admin/case-studies', icon: FileText },
  { label: 'Статьи', href: '/admin/articles', icon: BookOpen },
  { label: 'Видео', href: '/admin/videos', icon: Video },
];

const settingsItems = [
  { label: 'Статистика', href: '/admin/site-statistics', icon: BarChart3 },
  { label: 'Округа', href: '/admin/district-stats', icon: BarChart3 },
  { label: 'Навигация', href: '/admin/navigation', icon: FileText },
  { label: 'Соцсети', href: '/admin/social-links', icon: Star },
  { label: 'Доверие', href: '/admin/trust-pillars', icon: Star },
  { label: 'Дедлайны ФСИ', href: '/admin/fsi-deadlines', icon: BarChart3 },
  { label: 'Глоссарий', href: '/admin/glossary', icon: BookOpen },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Main Content */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Контент</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <DashboardCard href="/admin/services" icon={Briefcase} label="Услуги" />
          <DashboardCard href="/admin/faqs" icon={MessageSquare} label="FAQ" />
          <DashboardCard href="/admin/announcements" icon={Megaphone} label="Объявления" />
          {contentItems.map((item) => (
            <DashboardCard key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </div>
      </section>

      {/* Team */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Команда</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {teamItems.map((item) => (
            <DashboardCard key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </div>
      </section>

      {/* Settings */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Настройки</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {settingsItems.map((item) => (
            <DashboardCard key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardCard({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all"
    >
      <Icon className="w-8 h-8 text-violet-600 mb-2" />
      <span className="text-sm font-medium text-gray-700 text-center">{label}</span>
    </Link>
  );
}
