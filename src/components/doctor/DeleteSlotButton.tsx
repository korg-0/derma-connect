'use client';

import { useState, useTransition } from 'react';
import { deleteDoctorSlot } from '@/app/actions/doctor';

export default function DeleteSlotButton({ slotId }: { slotId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this slot?')) return;
    
    startTransition(async () => {
      const res = await deleteDoctorSlot(slotId);
      if (!res.success) {
        setError(res.error || 'Failed to delete');
      }
    });
  };

  return (
    <div style={{ textAlign: 'right' }}>
      <button
        onClick={handleDelete}
        disabled={isPending}
        style={{
          padding: '4px 10px',
          background: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #f87171',
          borderRadius: 4,
          fontSize: 12,
          cursor: isPending ? 'not-allowed' : 'pointer',
        }}
      >
        {isPending ? 'Deleting...' : 'Delete'}
      </button>
      {error && <p style={{ color: 'red', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
}