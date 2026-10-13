export const unstable_instant = false;

import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import SlotManager from '@/components/doctor/SlotManager';

export default async function AvailabilityPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];
  const { data: slots } = await supabase
    .from('doctor_slots')
    .select('id, slot_date, start_time, end_time, is_booked')
    .eq('doctor_id', user.id)
    .gte('slot_date', today)
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true });

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/doctor/dashboard" style={{ color: '#666' }}>
        ← Back to Dashboard
      </Link>
      <h1 style={{ marginTop: 16 }}>Manage Availability</h1>

      <SlotManager doctorId={user.id} />

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
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                background: slot.is_booked ? '#f3f4f6' : 'white',
              }}
            >
              <span>
                <strong>{slot.slot_date}</strong> — {slot.start_time} to {slot.end_time}
              </span>
              <span style={{ fontSize: 12, color: '#666' }}>
                {slot.is_booked ? 'Booked' : 'Available'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}