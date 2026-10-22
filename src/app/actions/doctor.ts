'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireVerifiedDoctor } from '@/lib/auth';
import { requireUser } from '@/lib/auth';

export async function cancelPrescription(prescriptionId: string, consultationId: string) {
  await requireVerifiedDoctor();
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
  await requireVerifiedDoctor();
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
  await requireVerifiedDoctor();
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
  const user = await requireUser();
  const supabase = await createClient();

  // Patients may reschedule only their own consultation to another open slot
  // belonging to the same currently verified doctor.
  const { data: consultation } = await supabase
    .from('consultations')
    .select('doctor_id, patient_id, slot_id')
    .eq('id', consultationId)
    .eq('patient_id', user.id)
    .single();

  if (!consultation || consultation.slot_id !== oldSlotId || !consultation.doctor_id) {
    return { success: false, error: 'Consultation not found or cannot be rescheduled.' };
  }

  // Verify the new slot is open and belongs to the same verified doctor.
  const { data: newSlot } = await supabase
    .from('doctor_slots')
    .select('is_booked, doctor_id')
    .eq('id', newSlotId)
    .eq('doctor_id', consultation.doctor_id)
    .single();

  if (!newSlot || newSlot.is_booked) {
    return { success: false, error: 'The new slot is no longer available.' };
  }

  // Changing the consultation slot is enough; only the verified doctor may
  // accept the request and mark the slot as booked.
  const { error } = await supabase
    .from('consultations')
    .update({ slot_id: newSlotId })
    .eq('id', consultationId)
    .eq('patient_id', user.id)
    .eq('slot_id', oldSlotId);

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
  await requireVerifiedDoctor();
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
