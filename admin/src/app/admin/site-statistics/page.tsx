import { EntityListPage } from '@/components/EntityListPage';
import { BarChart3 } from 'lucide-react';

export default function SiteStatisticsPage() {
  return (
    <EntityListPage
      entity="site-statistics"
      entityLabel="Статистика"
      entityKey="label"
      icon={<BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
    />
  );
}