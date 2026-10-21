'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LegalConsent from '@/components/legal/LegalConsent';

export default function MockPaymentButton({ consultationId }: { consultationId: string }) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handlePay = async () => {
    if (!consentGiven) return;
    
    setLoading(true);

    // 1. Log the payment consent
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('consent_log').insert({
        user_id: user.id,
        consent_type: 'payment_terms',
        granted: true,
        version: '1.0'
      });
    }

    // 2. Simulate payment processing (Replace with Razorpay/Stripe later)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 3. Update status to scheduled
    await supabase
      .from('consultations')
      .update({ status: 'scheduled' })
      .eq('id', consultationId);

    router.refresh();
    setLoading(false);
  };

  return (
    <div>
      <LegalConsent context="booking" onConsentChange={setConsentGiven} />
      
      <button 
        onClick={handlePay} 
        disabled={!consentGiven || loading}
        style={{
          padding: '10px 24px',
          background: consentGiven ? '#0070f3' : '#9ca3af',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: (!consentGiven || loading) ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: 16,
          marginTop: 8
        }}
      >
        {loading ? 'Processing Payment...' : 'Pay & Confirm'}
      </button>
    </div>
  );
}