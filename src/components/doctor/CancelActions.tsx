'use client';

import { useState, useTransition } from 'react';
import { cancelPrescription, cancelConsultation } from '@/app/actions/doctor';

export function CancelPrescriptionButton({ prescriptionId, consultationId }: { prescriptionId: string, consultationId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!confirm('Are you sure you want to cancel this prescription? It will be marked as void, but kept in the medical record.')) return;
    
    startTransition(async () => {
      const res = await cancelPrescription(prescriptionId, consultationId);
      if (res.success) {
        // Force a full page reload to guarantee the UI updates
        window.location.reload(); 
      }
    });
  };

  return (
    <button 
      onClick={handleCancel} 
      disabled={isPending}
      style={{ padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, fontSize: 12, cursor: isPending ? 'wait' : 'pointer', marginTop: 12 }}
    >
      {isPending ? 'Cancelling...' : 'Cancel Prescription'}
    </button>
  );
}

export function CancelConsultationButton({ consultationId }: { consultationId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!confirm('Are you sure you want to cancel this entire consultation? This cannot be undone.')) return;
    
    startTransition(async () => {
      const res = await cancelConsultation(consultationId);
      if (res.success) {
        window.location.reload(); // Force a full page reload
      }
    });
  };

  return (
    <button 
      onClick={handleCancel} 
      disabled={isPending}
      style={{ padding: '8px 16px', background: '#991b1b', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, cursor: isPending ? 'wait' : 'pointer' }}
    >
      {isPending ? 'Cancelling...' : 'Cancel Consultation'}
    </button>
  );
}