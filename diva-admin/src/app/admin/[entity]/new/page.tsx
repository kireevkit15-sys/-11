import { notFound } from 'next/navigation';
import { getClientEntity } from '@/lib/entities';
import { EntityForm } from '@/components/entity-form';

export default async function EntityNewPage({
  params,
}: {
  params: Promise<{ entity: string }>;
}) {
  const { entity: slug } = await params;
  const entity = getClientEntity(slug);
  if (!entity) notFound();
  return <EntityForm entity={entity} />;
}
