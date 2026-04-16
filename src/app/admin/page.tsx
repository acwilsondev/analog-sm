import { getServerSession } from 'next-auth';
import { authOptions } from '@/shell/auth';
import { redirect } from 'next/navigation';
import prisma from '@/shell/db/client';
import AdminUserRow from './AdminUserRow';
import AdminSettingsPanel from './AdminSettingsPanel';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== 'ADMIN') redirect('/');

  const [users, registrationSetting] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true },
      orderBy: { username: 'asc' },
    }),
    prisma.globalSetting.findUnique({ where: { key: 'registrations_open' } }),
  ]);

  const registrationsOpen = registrationSetting?.value !== 'false';

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <AdminSettingsPanel registrationsOpen={registrationsOpen} />

      <section>
        <h2 className="text-lg font-semibold mb-4">Users ({users.length})</h2>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Username</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Role</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: { id: string; username: string; email: string; role: string }) => (
                <AdminUserRow
                  key={user.id}
                  user={user}
                  currentUserId={(session!.user as any).id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
