export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 40, lineHeight: 1.6 }}>
      <h1>Privacy Notice (DPDP Act, 2023)</h1>
      <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
      
      <h2>1. What data we collect (Specific & Informed)</h2>
      <p>To provide telemedicine services, DermaConnect collects the following <strong>Sensitive Health Data</strong>:</p>
      <ul>
        <li><strong>Identity:</strong> Name, Email, Phone Number, Date of Birth.</li>
        <li><strong>Clinical:</strong> Photographs of your skin, symptom descriptions, medical history, and prescriptions.</li>
      </ul>

      <h2>2. Why we process it (Purpose Limitation)</h2>
      <p>Your data is processed <strong>solely</strong> for:</p>
      <ul>
        <li>Enabling a registered dermatologist to review your condition and issue a prescription.</li>
        <li>Facilitating video consultations and secure chat.</li>
        <li>Legal compliance (retaining medical records for 3 years).</li>
      </ul>

      <h2>3. Who we share it with</h2>
      <p>Your data is shared <strong>only</strong> with the specific doctor you book, and our secure infrastructure providers (Supabase for storage). We never sell your data.</p>

      <h2>4. Your Rights (Data Principal Rights)</h2>
      <p>You have the right to access, correct, or <strong>erase</strong> your data. You can withdraw consent at any time via your Account Settings. Note: Erasure will anonymize your profile, but clinical records may be retained as required by medical law.</p>

      <h2>5. Grievance Officer</h2>
      <p>For any privacy concerns, contact: <strong>grievance@dermaconnect.me</strong></p>
    </div>
  );
}