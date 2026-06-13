import { EntityListPage } from '@/components/EntityListPage';
import { Shield } from 'lucide-react';

export default function TrustPillarsPage() {
  return (
    <EntityListPage
      entity="trust-pillars"
      entityLabel="Доверие"
      entityKey="title"
      icon={<Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
    />
  );
}