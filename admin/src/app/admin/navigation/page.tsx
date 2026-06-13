import { EntityListPage } from '@/components/EntityListPage';
import { Navigation } from 'lucide-react';

export default function NavigationPage() {
  return (
    <EntityListPage
      entity="navigation"
      entityLabel="Навигация"
      entityKey="label"
      icon={<Navigation className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
    />
  );
}