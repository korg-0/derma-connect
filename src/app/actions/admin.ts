'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function verifyDoctor(doctorId: string) {
  const supabase = await createClient();
  await supabase.from('profiles').update({ verified: true }).eq('id', doctorId);
  revalidatePath('/admin/dashboard');
  revalidatePath('/doctors'); 
  return { success: true };
}

export async function revokeDoctor(doctorId: string) {
  const supabase = await createClient();
  await supabase.from('profiles').update({ verified: false }).eq('id', doctorId);
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/dashboard/doctors');
  revalidatePath('/doctors'); 
  return { success: true };
}