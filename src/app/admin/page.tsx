import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/auth';

export default async function AdminRoot() {
  const user = await getUser();
  if (!user) redirect('/admin/login');
  
  const profile = await getProfile(user.id);
  if (profile?.role !== 'admin') redirect('/admin/login');

  redirect('/admin/dashboard');
}
