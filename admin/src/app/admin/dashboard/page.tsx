import { db } from '@/lib/db';
import {
  services,
  faqs,
  teamMembers,
  caseStudies,
  reviews,
  articles,
  videos,
  siteStatistics,
  announcements,
} from '@/lib/schema';
import { AdminLayout } from '@/components/AdminLayout';
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
  ArrowRight,
} from 'lucide-react';

async function getCounts() {
  const [
    servicesCount,
    faqsCount,
    teamCount,
    casesCount,
    reviewsCount,
    articlesCount,
    videosCount,
    statsCount,
    announcementsCount,
  ] = await Promise.all([
    db.select().from(services),
    db.select().from(faqs),
    db.select().from(teamMembers),
    db.select().from(caseStudies),
    db.select().from(reviews),
    db.select().from(articles),
    db.select().from(videos),
    db.select().from(siteStatistics),
    db.select().from(announcements),
  ]);

  return {
    services: servicesCount.length,
    faqs: faqsCount.length,
    teamMembers: teamCount.length,
    caseStudies: casesCount.length,
    reviews: reviewsCount.length,
    articles: articlesCount.length,
    videos: videosCount.length,
    siteStatistics: statsCount.length,
    announcements: announcementsCount.length,
  };
}

const statCards = [
  { key: 'services', label: 'Услуги', icon: Briefcase, color: 'violet' },
  { key: 'faqs', label: 'FAQ', icon: MessageSquare, color: 'blue' },
  { key: 'teamMembers', label: 'Команда', icon: Users, color: 'emerald' },
  { key: 'caseStudies', label: 'Кейсы', icon: FileText, color: 'orange' },
  { key: 'reviews', label: 'Отзывы', icon: Star, color: 'amber' },
  { key: 'articles', label: 'Статьи', icon: BookOpen, color: 'indigo' },
  { key: 'videos', label: 'Видео', icon: Video, color: 'red' },
  { key: 'siteStatistics', label: 'Статистика', icon: BarChart3, color: 'cyan' },
  { key: 'announcements', label: 'Объявления', icon: Megaphone, color: 'rose' },
];

const colorClasses: Record<string, { bg: string; text: string }> = {
  violet: { bg: 'bg-violet-100', text: 'text-violet-700' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  red: { bg: 'bg-red-100', text: 'text-red-700' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-700' },
};

const hrefMap: Record<string, string> = {
  services: '/admin/services',
  faqs: '/admin/faqs',
  teamMembers: '/admin/team-members',
  caseStudies: '/admin/case-studies',
  reviews: '/admin/reviews',
  articles: '/admin/articles',
  videos: '/admin/videos',
  siteStatistics: '/admin/site-statistics',
  announcements: '/admin/announcements',
};

export default async function DashboardPage() {
  const counts = await getCounts();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const colors = colorClasses[card.color];
          const href = hrefMap[card.key];
          const count = counts[card.key as keyof typeof counts] ?? 0;

          return (
            <Link
              key={card.key}
              href={href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-gray-300 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-500 mt-1">{card.label}</div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl text-white">
        <h2 className="font-semibold text-lg mb-4">Быстрые действия</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/services/new"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            + Услуга
          </Link>
          <Link
            href="/admin/faqs/new"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            + FAQ
          </Link>
          <Link
            href="/admin/team-members/new"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            + Член команды
          </Link>
        </div>
      </div>
    </div>
  );
}
