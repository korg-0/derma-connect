'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function cancelPrescription(prescriptionId: string, consultationId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('prescriptions')
    .update({ status: 'cancelled' })
    .eq('id', prescriptionId);

  if (error) {
    console.error("Database Error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath(`/doctor/case/${consultationId}`);
  return { success: true };
}

export async function cancelConsultation(consultationId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('consultations')
    .update({ status: 'cancelled' })
    .eq('id', consultationId);

  if (error) {
    console.error("Database Error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath(`/doctor/case/${consultationId}`);
  return { success: true };
}