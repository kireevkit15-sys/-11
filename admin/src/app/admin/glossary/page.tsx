import { EntityListPage } from '@/components/EntityListPage';
import { BookOpen } from 'lucide-react';

export default function GlossaryPage() {
  return (
    <EntityListPage
      entity="glossary"
      entityLabel="Глоссарий"
      entityKey="term"
      icon={<BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
    />
  );
}