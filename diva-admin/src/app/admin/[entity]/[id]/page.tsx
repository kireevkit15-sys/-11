import { notFound } from 'next/navigation';
import { getClientEntity } from '@/lib/entities';
import { EntityForm } from '@/components/entity-form';

export default async function EntityEditPage({
  params,
}: {
  params: Promise<{ entity: string; id: string }>;
}) {
  const { entity: slug, id } = await params;
  const entity = getClientEntity(slug);
  if (!entity) notFound();
  return <EntityForm entity={entity} id={id} />;
}
