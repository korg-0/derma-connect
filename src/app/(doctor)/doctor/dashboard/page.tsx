import Link from 'next/link';
import { requireUser, getProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function DoctorDashboard() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const supabase = await createClient();

  // Get counts for dashboard
  const { data: pendingCases } = await supabase.from('consultations').select('id').eq('doctor_id', user.id).eq('status', 'pending');
  const { data: scheduledCases } = await supabase.from('consultations').select('id').eq('doctor_id', user.id).eq('status', 'scheduled');

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Welcome, Dr. {profile?.full_name || 'Doctor'}.</h1>
      <p style={{ fontSize: 18, color: '#666', marginBottom: 40 }}>Here is an overview of your practice today.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
        <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, color: '#666', fontSize: 14, textTransform: 'uppercase' }}>New Cases</h3>
          <p style={{ margin: '8px 0 0', fontSize: 36, fontWeight: 700, color: '#0070f3' }}>{pendingCases?.length || 0}</p>
        </div>
        <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, color: '#666', fontSize: 14, textTransform: 'uppercase' }}>Scheduled Consultations</h3>
          <p style={{ margin: '8px 0 0', fontSize: 36, fontWeight: 700, color: '#16a34a' }}>{scheduledCases?.length || 0}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <Link href="/doctor/dashboard/cases" style={{ flex: 1, padding: 20, background: '#0070f3', color: 'white', borderRadius: 8, textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>
          View All My Cases
        </Link>
        <Link href="/doctor/availability" style={{ flex: 1, padding: 20, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, textDecoration: 'none', textAlign: 'center', color: '#333', fontWeight: 600 }}>
          Manage Availability
        </Link>
      </div>
    </div>
  );
}