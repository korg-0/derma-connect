import { redirect } from 'next/navigation';
import { requireUser, getProfile } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  if (!profile || profile.role !== 'admin') {
    redirect('/admin/login'); 
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      <AdminSidebar />
      <main style={{ marginLeft: 260, flex: 1, padding: 40 }}>{children}</main>
    </div>
  );
}
