export const unstable_instant = false;

import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/auth';
import SignOutButton from '@/components/auth/SignOutButton';

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect('/login');

  const profile = await getProfile(user.id);
  if (profile && profile.role !== 'doctor') redirect('/dashboard');

  return (
    <div>
      <nav
        style={{
          padding: 16,
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>
          DermaConnect — Dr. {profile?.full_name || user.email}
        </span>
        <SignOutButton />
      </nav>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}