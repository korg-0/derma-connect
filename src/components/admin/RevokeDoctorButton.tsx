'use client';

import { useState, useTransition } from 'react';
import { revokeDoctor } from '@/app/actions/admin';

export default function RevokeDoctorButton({ doctorId }: { doctorId: string }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const handleRevoke = () => {
    if (!confirm('Are you sure you want to revoke this doctor? They will immediately disappear from the patient catalogue and cannot take new consultations.')) return;
    
    startTransition(async () => {
      await revokeDoctor(doctorId);
      setSuccess(true);
    });
  };

  return (
    <button 
      onClick={handleRevoke} 
      disabled={isPending || success}
      style={{ padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
    >
      {isPending ? 'Revoking...' : success ? 'Revoked' : 'Revoke Access'}
    </button>
  );
}