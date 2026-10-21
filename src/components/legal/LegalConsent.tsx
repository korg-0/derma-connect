'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LegalConsent({ 
  context, // 'signup', 'consultation', or 'booking'
  onConsentChange 
}: { 
  context: string;
  onConsentChange: (agreed: boolean) => void 
}) {
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgreed(e.target.checked);
    onConsentChange(e.target.checked);
  };

  return (
    <div style={{ marginTop: 20, marginBottom: 20, padding: 16, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 }}>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
        <input 
          type="checkbox" 
          checked={agreed} 
          onChange={handleChange}
          style={{ marginTop: 4, width: 18, height: 18 }} 
        />
        <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
          I have read and agree to the{' '}
          <Link href="/legal/privacy" target="_blank" style={{ color: '#0070f3', textDecoration: 'underline' }}>Privacy Notice</Link>,{' '}
          <Link href="/legal/terms" target="_blank" style={{ color: '#0070f3', textDecoration: 'underline' }}>Terms of Service</Link>, and{' '}
          <Link href="/legal/refunds" target="_blank" style={{ color: '#0070f3', textDecoration: 'underline' }}>Refund Policy</Link>.
          {context === 'consultation' && ' I consent to the processing of my medical images and health data for this consultation.'}
        </span>
      </label>
    </div>
  );
}