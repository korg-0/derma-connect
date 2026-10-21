'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { rescheduleConsultation } from '@/app/actions/doctor';
import { createClient } from '@/lib/supabase/client';

type AvailableSlot = {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
};

export default function RescheduleModal({
  consultationId,
  oldSlotId,
  doctorId,
  onClose,
}: {
  consultationId: string;
  oldSlotId: string;
  doctorId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSlots() {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from('doctor_slots')
        .select('id, slot_date, start_time, end_time')
        .eq('doctor_id', doctorId)
        .eq('is_booked', false)
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (!active) return;
      if (queryError) setError(queryError.message);
      setSlots((data ?? []) as AvailableSlot[]);
      setLoadingSlots(false);
    }

    void loadSlots();
    return () => {
      active = false;
    };
  }, [doctorId]);

  async function handleReschedule() {
    if (!selectedSlotId) return;
    setSaving(true);
    setError(null);

    const result = await rescheduleConsultation(consultationId, oldSlotId, selectedSlotId);
    if (!result.success) {
      setError(result.error ?? 'Could not reschedule the appointment.');
      setSaving(false);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <div
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background: 'rgba(17, 24, 39, 0.5)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-title"
        style={{ width: '100%', maxWidth: 440, padding: 24, borderRadius: 12, background: 'white' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <h2 id="reschedule-title" style={{ margin: 0 }}>Reschedule appointment</h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close reschedule dialog">
            ×
          </button>
        </div>

        <p style={{ color: '#666', fontSize: 14 }}>Choose an available time with your dermatologist.</p>

        {loadingSlots ? (
          <p>Loading available times…</p>
        ) : slots.length === 0 ? (
          <p>No available times right now.</p>
        ) : (
          <label style={{ display: 'grid', gap: 8, fontSize: 14 }}>
            Available times
            <select
              value={selectedSlotId}
              onChange={(event) => setSelectedSlotId(event.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
            >
              <option value="">Select a time</option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.slot_date} · {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                </option>
              ))}
            </select>
          </label>
        )}

        {error && <p role="alert" style={{ color: '#b91c1c', fontSize: 14 }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" onClick={handleReschedule} disabled={!selectedSlotId || saving || loadingSlots}>
            {saving ? 'Rescheduling…' : 'Confirm new time'}
          </button>
        </div>
      </section>
    </div>
  );
}
