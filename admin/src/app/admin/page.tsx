/**
 * Diva Admin - Dashboard Page
 */

import Link from 'next/link';
import {
  Briefcase,
  MessageSquare,
  Users,
  Star,
  BookOpen,
  Video,
  Megaphone,
  FileText,
  BarChart3,
  Map,
  Navigation,
  Link2,
  Shield,
  Calendar,
  ArrowRight,
  Plus,
  Handshake,
} from 'lucide-react';

const contentCards = [
  { label: 'Services', href: '/admin/services', icon: Briefcase, color: 'violet' },
  { label: 'FAQ', href: '/admin/faqs', icon: MessageSquare, color: 'blue' },
  { label: 'Team', href: '/admin/team-members', icon: Users, color: 'emerald' },
  { label: 'Partners', href: '/admin/partners', icon: Handshake, color: 'orange' },
  { label: 'Reviews', href: '/admin/reviews', icon: Star, color: 'amber' },
  { label: 'Articles', href: '/admin/articles', icon: BookOpen, color: 'indigo' },
  { label: 'Videos', href: '/admin/videos', icon: Video, color: 'red' },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone, color: 'rose' },
  { label: 'Case Studies', href: '/admin/case-studies', icon: FileText, color: 'orange' },
];

const settingsCards = [
  { label: 'Statistics', href: '/admin/statistics', icon: BarChart3, color: 'cyan' },
  { label: 'Districts', href: '/admin/districts', icon: Map, color: 'teal' },
  { label: 'Navigation', href: '/admin/navigation', icon: Navigation, color: 'purple' },
  { label: 'Social Links', href: '/admin/social-links', icon: Link2, color: 'pink' },
  { label: 'Trust Pillars', href: '/admin/trust', icon: Shield, color: 'violet' },
  { label: 'FSI Deadlines', href: '/admin/fsi-deadlines', icon: Calendar, color: 'orange' },
  { label: 'Glossary', href: '/admin/glossary', icon: BookOpen, color: 'gray' },
];

const colorMap: Record<string, { bg: string; icon: string; hover: string }> = {
  violet: { bg: 'bg-violet-100', icon: 'text-violet-600', hover: 'hover:border-violet-300' },
  blue: { bg: 'bg-blue-100', icon: 'text-blue-600', hover: 'hover:border-blue-300' },
  emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600', hover: 'hover:border-emerald-300' },
  amber: { bg: 'bg-amber-100', icon: 'text-amber-600', hover: 'hover:border-amber-300' },
  indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600', hover: 'hover:border-indigo-300' },
  red: { bg: 'bg-red-100', icon: 'text-red-600', hover: 'hover:border-red-300' },
  rose: { bg: 'bg-rose-100', icon: 'text-rose-600', hover: 'hover:border-rose-300' },
  orange: { bg: 'bg-orange-100', icon: 'text-orange-600', hover: 'hover:border-orange-300' },
  cyan: { bg: 'bg-cyan-100', icon: 'text-cyan-600', hover: 'hover:border-cyan-300' },
  teal: { bg: 'bg-teal-100', icon: 'text-teal-600', hover: 'hover:border-teal-300' },
  purple: { bg: 'bg-purple-100', icon: 'text-purple-600', hover: 'hover:border-purple-300' },
  pink: { bg: 'bg-pink-100', icon: 'text-pink-600', hover: 'hover:border-pink-300' },
  gray: { bg: 'bg-gray-100', icon: 'text-gray-600', hover: 'hover:border-gray-300' },
};

function DashboardCard({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: any;
  label: string;
  color: string;
}) {
  const colors = colorMap[color] || colorMap.gray;

  return (
    <Link
      href={href}
      className={`
        group bg-white rounded-xl border border-gray-200 p-5
        ${colors.hover} hover:shadow-lg transition-all duration-200
        flex flex-col gap-3
      `}
    >
      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.icon} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900">{label}</span>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your website content</p>
        </div>
        <Link
          href="/admin/services/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white rounded-lg font-medium transition-all shadow-lg shadow-violet-500/25"
        >
          <Plus className="w-5 h-5" />
          New Service
        </Link>
      </div>

      {/* Content Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Content Management</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {contentCards.map((card) => (
            <DashboardCard key={card.href} {...card} />
          ))}
        </div>
      </section>

      {/* Settings Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Settings & Configuration</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {settingsCards.map((card) => (
            <DashboardCard key={card.href} {...card} />
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/services/new"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            + Service
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
            + Team Member
          </Link>
          <Link
            href="/admin/partners/new"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            + Partner
          </Link>
          <Link
            href="/admin/articles/new"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            + Article
          </Link>
        </div>
      </section>
    </div>
  );
}
