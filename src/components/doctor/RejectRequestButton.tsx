'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { rejectConsultationRequest } from '@/app/actions/doctor';

export default function RejectRequestButton({ consultationId, slotId }: { consultationId: string, slotId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this request? The patient will be notified and the slot will remain open.')) return;
    setLoading(true);
    await rejectConsultationRequest(consultationId, slotId);
    router.refresh();
  };

  return (
    <button 
      onClick={handleReject} 
      disabled={loading}
      style={{ padding: '8px 16px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, cursor: loading ? 'wait' : 'pointer', fontWeight: 500, marginLeft: 8 }}
    >
      {loading ? 'Rejecting...' : 'Reject Request'}
    </button>
  );
}