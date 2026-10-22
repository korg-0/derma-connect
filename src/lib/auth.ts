import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireVerifiedDoctor() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (profile?.role !== 'doctor') redirect('/dashboard');
  if (!profile.verified) redirect('/doctor/profile?verification=pending');
  return user;
}

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}
