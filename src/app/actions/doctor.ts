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
  
  // 1. Get the consultation to find the slot_id
  const { data: consultation } = await supabase
    .from('consultations')
    .select('slot_id')
    .eq('id', consultationId)
    .single();

  // 2. Free up the slot if it exists
  if (consultation?.slot_id) {
    await supabase
      .from('doctor_slots')
      .update({ is_booked: false })
      .eq('id', consultation.slot_id);
  }

  // 3. Mark consultation as cancelled
  const { error } = await supabase
    .from('consultations')
    .update({ status: 'cancelled', slot_id: null, doctor_id: null })
    .eq('id', consultationId);

  if (error) {
    console.error("Database Error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath(`/doctor/case/${consultationId}`);
  revalidatePath('/doctor/availability');
  return { success: true };
}
export async function deleteDoctorSlot(slotId: string) {
  const supabase = await createClient();
  
  // First, verify the slot is not booked (safety check)
  const { data: slot } = await supabase
    .from('doctor_slots')
    .select('is_booked')
    .eq('id', slotId)
    .single();

  if (slot?.is_booked) {
    return { success: false, error: 'Cannot delete a slot that is already booked by a patient.' };
  }

  // Delete the slot
  const { error } = await supabase
    .from('doctor_slots')
    .delete()
    .eq('id', slotId);

  if (error) {
    console.error("Failed to delete slot:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath('/doctor/availability');
  return { success: true };
}
export async function rescheduleConsultation(
  consultationId: string,
  oldSlotId: string,
  newSlotId: string
) {
  const supabase = await createClient();

  // 1. Verify the new slot is actually available
  const { data: newSlot } = await supabase
    .from('doctor_slots')
    .select('is_booked, doctor_id')
    .eq('id', newSlotId)
    .single();

  if (!newSlot || newSlot.is_booked) {
    return { success: false, error: 'The new slot is no longer available.' };
  }

  // 2. Free up the old slot
  await supabase
    .from('doctor_slots')
    .update({ is_booked: false })
    .eq('id', oldSlotId);

  // 3. Book the new slot
  await supabase
    .from('doctor_slots')
    .update({ is_booked: true })
    .eq('id', newSlotId);

  // 4. Update the consultation to point to the new slot
  const { error } = await supabase
    .from('consultations')
    .update({ slot_id: newSlotId })
    .eq('id', consultationId);

  if (error) {
    return { success: false, error: error.message };
  }

  // 5. Refresh the relevant pages
  revalidatePath('/dashboard');
  revalidatePath('/doctor/dashboard/cases');
  revalidatePath(`/consult/${consultationId}`);
  
  return { success: true };
}

export async function rejectConsultationRequest(consultationId: string, slotId: string) {
  const supabase = await createClient();

  // 1. Revert consultation to pending and remove doctor
  await supabase
    .from('consultations')
    .update({ status: 'pending', doctor_id: null, slot_id: null })
    .eq('id', consultationId);

  // 2. Free up the slot (just in case)
  await supabase
    .from('doctor_slots')
    .update({ is_booked: false })
    .eq('id', slotId);

  revalidatePath('/doctor/availability');
  return { success: true };
}