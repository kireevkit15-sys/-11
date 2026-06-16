import { notFound } from 'next/navigation';
import { getClientEntity } from '@/lib/entities';
import { EntityList } from '@/components/entity-list';

export default async function EntityListPage({
  params,
}: {
  params: Promise<{ entity: string }>;
}) {
  const { entity: slug } = await params;
  const entity = getClientEntity(slug);
  if (!entity) notFound();
  return <EntityList entity={entity} />;
}
