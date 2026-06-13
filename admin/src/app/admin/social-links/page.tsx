import { EntityListPage } from '@/components/EntityListPage';
import { Link2 } from 'lucide-react';

export default function SocialLinksPage() {
  return (
    <EntityListPage
      entity="social-links"
      entityLabel="Соцсети"
      entityKey="label"
      icon={<Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
    />
  );
}