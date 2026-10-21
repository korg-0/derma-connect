'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ApproveRequestButton({ consultationId, slotId }: { consultationId: string, slotId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

      const handleApprove = async () => {
      setLoading(true);

      // 1. Mark slot as booked
      await supabase.from('doctor_slots').update({ is_booked: true }).eq('id', slotId);

      // 2. Update consultation status AND record the time
      await supabase
        .from('consultations')
        .update({ 
          status: 'approved_awaiting_payment',
          approved_at: new Date().toISOString() 
        })
        .eq('id', consultationId);

      router.refresh();
    };

  return (
    <button 
      onClick={handleApprove} 
      disabled={loading}
      style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: loading ? 'wait' : 'pointer', fontWeight: 500 }}
    >
      {loading ? 'Approving...' : 'Approve Request'}
    </button>
  );
}