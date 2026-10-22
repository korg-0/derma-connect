import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getUser, getProfile } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';


export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/login');
  
  const profile = await getProfile(user.id);
  
  if (profile?.role === 'admin') redirect('/admin');
  if (profile && profile.role !== 'doctor') redirect('/dashboard');
  const currentPath = (await headers()).get('x-current-path');
  if (profile?.role === 'doctor' && !profile.verified && currentPath !== '/doctor/profile') {
    redirect('/doctor/profile?verification=pending');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa' }}>
      <Sidebar role="doctor" verified={Boolean(profile?.verified)} />
      <main style={{ marginLeft: 260, flex: 1, padding: 40 }}>
        {children}
      </main>
    </div>
  );
}
