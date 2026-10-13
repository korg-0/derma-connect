'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SlotManager({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    setCreating(true);

    const { error } = await supabase.from('doctor_slots').insert({
      doctor_id: doctorId,
      slot_date: date,
      start_time: startTime,
      end_time: endTime,
    });

    if (error) {
      setError(error.message);
    } else {
      setDate('');
      setStartTime('');
      setEndTime('');
      router.refresh();
    }
    setCreating(false);
  };

  return (
    <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Add a Slot</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          style={{ padding: 8 }}
        />
      </div>
      <button
        onClick={handleCreate}
        disabled={!date || !startTime || !endTime || creating}
        style={{ padding: '8px 16px', background: '#0070f3', color: 'white', border: 'none', borderRadius: 6 }}
      >
        {creating ? 'Adding...' : 'Add Slot'}
      </button>
      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
    </div>
  );
}