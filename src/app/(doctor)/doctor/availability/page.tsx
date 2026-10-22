
import DeleteSlotButton from '@/components/doctor/DeleteSlotButton';
import ApproveRequestButton from '@/components/doctor/ApproveRequestButton';
import RejectRequestButton from '@/components/doctor/RejectRequestButton';
import Link from 'next/link';
import { requireVerifiedDoctor } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import SlotManager from '@/components/doctor/SlotManager';

export default async function AvailabilityPage() {
  const user = await requireVerifiedDoctor();
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];
  
  // 1. Fetch upcoming slots
  const { data: slots } = await supabase
    .from('doctor_slots')
    .select('id, slot_date, start_time, end_time, is_booked')
    .eq('doctor_id', user.id)
    .gte('slot_date', today)
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true });

  // 2. Fetch consultations pending approval for this doctor
  const { data: pendingRequests } = await supabase
    .from('consultations')
    .select(`
      id, symptoms_text, slot_id, patient_id,
      doctor_slots (slot_date, start_time, end_time),
      profiles!consultations_patient_id_fkey (full_name)
    `)
    .eq('doctor_id', user.id)
    .eq('status', 'pending_approval');

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/doctor/dashboard" style={{ color: '#666' }}>
        ← Back to Dashboard
      </Link>
      <h1 style={{ marginTop: 16 }}>Manage Availability</h1>

      <SlotManager doctorId={user.id} />

      {/* --- PENDING REQUESTS SECTION --- */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div style={{ marginTop: 40, marginBottom: 40 }}>
          <h2 style={{ color: '#d97706', marginBottom: 16 }}>Pending Booking Requests</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {pendingRequests.map(req => {
              const patientName = Array.isArray(req.profiles) ? req.profiles[0]?.full_name : (req.profiles as any)?.full_name;
              const slot = Array.isArray(req.doctor_slots) ? req.doctor_slots[0] : (req.doctor_slots as any);
              
              return (
                <div key={req.id} style={{ padding: 16, border: '1px solid #fcd34d', background: '#fffbeb', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{patientName}</strong> requested <strong>{slot?.slot_date} at {slot?.start_time}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>Symptoms: {req.symptoms_text.substring(0, 50)}...</p>
                  </div>
                  <ApproveRequestButton consultationId={req.id} slotId={req.slot_id} />
                  <RejectRequestButton consultationId={req.id} slotId={req.slot_id} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- UPCOMING SLOTS SECTION --- */}
      <h2 style={{ marginTop: 32 }}>Upcoming Slots</h2>
      {(!slots || slots.length === 0) ? (
        <p style={{ color: '#666' }}>No upcoming slots. Add one above.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {slots.map((slot) => (
            <div
              key={slot.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                background: slot.is_booked ? '#f3f4f6' : 'white',
              }}
            >
              <div>
                <strong>{slot.slot_date}</strong> — {slot.start_time} to {slot.end_time}
                {slot.is_booked && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#16a34a', fontWeight: 600, background: '#d1fae5', padding: '2px 8px', borderRadius: 999 }}>
                    Booked
                  </span>
                )}
              </div>
              
              {!slot.is_booked && (
                <DeleteSlotButton slotId={slot.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
