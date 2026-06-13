import { EntityListPage } from '@/components/EntityListPage';
import { FileText } from 'lucide-react';

export default function CaseStudiesPage() {
  return (
    <EntityListPage
      entity="case-studies"
      entityLabel="Кейсы"
      entityKey="title"
      icon={<FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
    />
  );
}