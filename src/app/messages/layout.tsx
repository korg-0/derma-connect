import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect('/login');
  
  const profile = await getProfile(user.id);
  if (profile?.role === 'doctor' && !profile.verified) {
    redirect('/doctor/profile?verification=pending');
  }
  const role = profile?.role === 'doctor' ? 'doctor' : 'patient';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa' }}>
      <Sidebar role={role} />
      <main style={{ marginLeft: 260, flex: 1, padding: 40 }}>
        {children}
      </main>
    </div>
  );
}
