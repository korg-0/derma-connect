import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 40, fontFamily: 'sans-serif', lineHeight: 1.6 }}>
      <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', marginBottom: 20, display: 'inline-block' }}>
        ← Back to App
      </Link>
      
      <h1>Privacy Policy & Medical Consent</h1>
      <p style={{ color: '#666' }}>Last updated: October 2026</p>

      <h2>1. What data we collect</h2>
      <p>When you use DermaConnect, we collect the following sensitive health data:</p>
      <ul>
        <li>Photographs of your skin condition.</li>
        <li>Descriptions of your symptoms.</li>
        <li>Your medical history (allergies, medications, past conditions).</li>
        <li>Prescriptions issued by doctors.</li>
      </ul>

      <h2>2. How we use your data</h2>
      <p>Your data is used strictly for the purpose of facilitating a telemedicine consultation. It is shared <strong>only</strong> with the specific dermatologist you choose to consult with. We do not sell your data to third parties.</p>

      <h2>3. Your Rights under the DPDP Act</h2>
      <p>Under the Digital Personal Data Protection Act (2023), you have the right to:</p>
      <ul>
        <li>Access a copy of your medical records.</li>
        <li>Request the correction of inaccurate data.</li>
        <li>Request the erasure of your data (subject to medical retention laws).</li>
      </ul>

      <h2>4. Medical Disclaimer</h2>
      <p><strong>Telemedicine is not a substitute for an in-person emergency.</strong> If you are experiencing a life-threatening reaction (e.g., anaphylaxis), call emergency services immediately. The AI-assisted triage feature (if enabled) provides a preliminary assessment, not a formal medical diagnosis.</p>
    </div>
  );
}