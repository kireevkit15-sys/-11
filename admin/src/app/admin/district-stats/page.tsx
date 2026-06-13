import { EntityListPage } from '@/components/EntityListPage';
import { Map } from 'lucide-react';

export default function DistrictStatsPage() {
  return (
    <EntityListPage
      entity="district-stats"
      entityLabel="Округа"
      entityKey="shortName"
      icon={<Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
    />
  );
}