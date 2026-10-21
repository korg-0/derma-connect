'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { anonymizePatientAccount } from '@/app/actions/patient';

export default function DeleteAccountButton({ patientId }: { patientId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you absolutely sure? This will anonymize your profile and log you out.')) return;
    
    setLoading(true);
    
    // 1. Anonymize the database record
    const res = await anonymizePatientAccount(patientId);
    
    if (res.success) {
      // 2. Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = '/login';
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{ padding: '10px 20px', background: '#991b1b', color: 'white', border: 'none', borderRadius: 6, cursor: loading ? 'wait' : 'pointer', fontWeight: 600 }}
    >
      {loading ? 'Processing...' : 'Delete My Account'}
    </button>
  );
}