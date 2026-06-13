import { EntityListPage } from '@/components/EntityListPage';
import { Calendar } from 'lucide-react';

export default function FsiDeadlinesPage() {
  return (
    <EntityListPage
      entity="fsi-deadlines"
      entityLabel="Дедлайны ФСИ"
      entityKey="title"
      icon={<Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
    />
  );
}