
import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';

export default async function PatientLayout({ children }: { children: React.ReactNode }) {

  const user = await getUser();
  if (!user) redirect('/login');
  
  const profile = await getProfile(user.id);
  
  // Redirect admins to their portal
  if (profile?.role === 'admin') redirect('/admin'); 
  
  // Redirect doctors to their portal
  if (profile && profile.role !== 'patient') redirect('/doctor/dashboard');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa' }}>
      <Sidebar role="patient" />
      <main style={{ marginLeft: 260, flex: 1, padding: 40 }}>
        {children}
      </main>
    </div>
  );
}