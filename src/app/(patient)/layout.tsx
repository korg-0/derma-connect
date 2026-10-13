import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/auth';
import SignOutButton from '@/components/auth/SignOutButton';
export const unstable_instant = false;
export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect('/login');

  const profile = await getProfile(user.id);
  if (profile && profile.role !== 'patient') redirect('/doctor/dashboard');

  return (
    <div>
      <nav style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
        <span>DermaConnect — {profile?.full_name || user.email}</span>
        <SignOutButton />
      </nav>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}