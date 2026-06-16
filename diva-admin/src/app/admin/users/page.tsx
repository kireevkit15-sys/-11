import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/api-helpers';
import { UsersClient } from './users-client';

export default async function UsersPage() {
  const user = await currentUser();
  if (!user) redirect('/login');
  // Раздел доступен только администраторам.
  if (user.role !== 'admin') redirect('/admin');

  return <UsersClient currentUserId={user.id} />;
}
