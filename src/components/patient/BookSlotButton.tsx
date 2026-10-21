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

    // 1. Update consultation to pending_approval (DO NOT mark slot as booked yet)
    const { error: consultError } = await supabase
      .from('consultations')
      .update({
        doctor_id: doctorId,
        slot_id: slotId,
        status: 'pending_approval',
      })
      .eq('id', consultationId);

    if (consultError) {
      setError(consultError.message);
      setLoading(false);
      return;
    }

    // 2. Send Email Notification to Doctor
    try {
      const { data: doctor } = await supabase.from('profiles').select('full_name, email').eq('id', doctorId).maybeSingle();
      const { data: patient } = await supabase.from('profiles').select('full_name').eq('id', (await supabase.auth.getUser()).data.user?.id).maybeSingle();

      if (doctor && patient && doctor.email) {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'booking_request', // Changed from 'booking' to 'booking_request'
            to: doctor.email,
            doctorName: doctor.full_name,
            patientName: patient.full_name,
          }),
        });
      }
    } catch (err) {
      console.error('Failed to trigger email:', err);
    }

    // 3. Redirect to the consultation view so the patient sees "Awaiting Approval"
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
          background: '#f59e0b', // Changed to orange to signify a "Request"
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: loading ? 'wait' : 'pointer',
          fontWeight: 500
        }}
      >
        {loading ? 'Requesting...' : 'Request Slot'}
      </button>
      {error && <p style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}