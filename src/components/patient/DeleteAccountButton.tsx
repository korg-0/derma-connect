'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { deleteOwnPatientAccount } from '@/app/actions/account';

export default function DeleteAccountButton() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Permanently delete your patient account, profile, medical history, consultations, prescriptions, consent records, and uploaded consultation images? This cannot be undone.')) return;
    
    setLoading(true);
    
    try {
      const res = await deleteOwnPatientAccount();
      if (!res.success) {
        alert(res.error);
        setLoading(false);
        return;
      }

      await supabase.auth.signOut({ scope: 'local' });
      window.location.replace('/login?account_deleted=1');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Account deletion could not be completed.');
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
