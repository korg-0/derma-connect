import Link from 'next/link';
import { requireUser, getProfile } from '@/lib/auth';

export default async function PatientDashboard() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Welcome back, {profile?.full_name || 'Patient'}.</h1>
      <p style={{ fontSize: 18, color: '#666', marginBottom: 40 }}>
        Facing skin problems? Connect with our verified medical experts today.
      </p>

      <div style={{ background: 'white', padding: 32, borderRadius: 12, border: '1px solid #e5e7eb', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Need a new assessment?</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>Upload a photo of your skin condition and get a consultation.</p>
        <Link 
          href="/consult/new" 
          style={{ display: 'inline-block', padding: '12px 32px', background: '#0070f3', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 16, fontWeight: 600 }}
        >
          Start New Consultation
        </Link>
      </div>
    </div>
  );
}