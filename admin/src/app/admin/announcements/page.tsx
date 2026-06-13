import { EntityListPage } from '@/components/EntityListPage';
import { Megaphone } from 'lucide-react';

export default function AnnouncementsPage() {
  return (
    <EntityListPage
      entity="announcements"
      entityLabel="Объявления"
      entityKey="title"
      icon={<Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
    />
  );
}