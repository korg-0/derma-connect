'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function BookSlotButton({
  slotId,
  consultationId,
  doctorId,
}: {
  slotId: string;
  consultationId: string;
  doctorId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const handleBook = async () => {
    setError(null);
    setLoading(true);

    // 1. Mark slot as booked
    const { error: slotError } = await supabase
      .from('doctor_slots')
      .update({ is_booked: true })
      .eq('id', slotId);

    if (slotError) {
      setError(slotError.message);
      setLoading(false);
      return;
    }

    // 2. Update consultation
    const { error: consultError } = await supabase
      .from('consultations')
      .update({
        doctor_id: doctorId,
        slot_id: slotId,
        status: 'scheduled',
      })
      .eq('id', consultationId);

    if (consultError) {
      setError(consultError.message);
      setLoading(false);
      return;
    }

    // 3. Send Email Notification
    try {
      // Fetch doctor and patient details for the email
      const { data: doctor } = await supabase.from('profiles').select('full_name, email').eq('id', doctorId).single();
      const { data: patient } = await supabase.from('profiles').select('full_name').eq('id', (await supabase.auth.getUser()).data.user?.id).single();

      if (doctor && patient) {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'booking',
            to: doctor.email,
            doctorName: doctor.full_name,
            patientName: patient.full_name,
          }),
        });
      }
    } catch (err) {
      console.error('Failed to trigger email:', err);
    }

    // 4. Redirect
    router.push(`/consult/${consultationId}`);
    router.refresh();
  };

  return (
    <div>
      <button
        onClick={handleBook}
        disabled={loading}
        style={{
          padding: '8px 16px',
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Booking...' : 'Book'}
      </button>
      {error && <p style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}