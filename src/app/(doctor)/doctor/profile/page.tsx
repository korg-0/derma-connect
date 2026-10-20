export const unstable_instant = false;

import Link from 'next/link';
import { requireUser, getProfile } from '@/lib/auth';
import DoctorProfileForm from '@/components/doctor/DoctorProfileForm';

export default async function DoctorProfilePage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/doctor/dashboard" style={{ color: '#666' }}>← Back to Dashboard</Link>
      <h1 style={{ marginTop: 16 }}>My Professional Profile</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Keep this up to date. This information is shown to patients once you are verified.</p>
      
      {!profile?.verified && (
        <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8, marginBottom: 24, border: '1px solid #f59e0b' }}>
          <strong>Status: Pending Verification</strong>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>Please complete your profile below. An administrator will review your credentials and approve your account.</p>
        </div>
      )}
      
      <DoctorProfileForm initialData={profile} userId={user.id} />
    </div>
  );
}