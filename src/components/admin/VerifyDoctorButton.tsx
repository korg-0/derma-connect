'use client';

import { useState, useTransition } from 'react';
import { verifyDoctor } from '@/app/actions/admin';

export default function VerifyDoctorButton({ doctorId }: { doctorId: string }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = () => {
    startTransition(async () => {
      setErrorMsg('');
      
      const result = await verifyDoctor(doctorId);

      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setSuccess(true);
      }
    });
  };

  return (
    <div>
      <button 
        onClick={handleVerify} 
        disabled={isPending || success}
        style={{ 
          padding: '8px 16px', 
          background: '#16a34a', 
          color: 'white', 
          border: 'none', 
          borderRadius: 6, 
          cursor: isPending || success ? 'not-allowed' : 'pointer', 
          fontSize: 14 
        }}
      >
        {isPending ? 'Approving...' : success ? '✓ Approved' : 'Approve Doctor'}
      </button>
      {errorMsg && <p style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{errorMsg}</p>}
    </div>
  );
}