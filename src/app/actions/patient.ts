'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function anonymizePatientAccount(patientId: string) {
  const supabase = await createClient();

  // 1. Anonymize the profile (remove PII)
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: 'Deleted Patient',
      email: null, // Or a placeholder like deleted-user-{id}@example.com
      phone: null,
      date_of_birth: null,
      gender: null,
    })
    .eq('id', patientId);

  if (error) {
    return { success: false, error: error.message };
  }

  // 2. Log the erasure in the audit log
  await supabase.from('audit_log').insert({
    user_id: patientId,
    action: 'account_erased',
    resource_type: 'profile',
    resource_id: patientId,
  });

  revalidatePath('/dashboard');
  return { success: true };
}