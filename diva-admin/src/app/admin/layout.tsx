import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { AdminProviders } from '@/components/providers';
import { ENTITY_LIST } from '@/lib/entities';
import { currentUser } from '@/lib/api-helpers';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/login');

  return (
    <AdminProviders>
      <AdminShell
        nav={ENTITY_LIST}
        user={{ name: user.name, email: user.email, role: user.role }}
      >
        {children}
      </AdminShell>
    </AdminProviders>
  );
}
