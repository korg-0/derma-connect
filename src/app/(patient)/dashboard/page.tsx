import Link from 'next/link';
import { requireUser } from '@/lib/auth';
export const unstable_instant = false;
export default async function PatientDashboard() {
  const user = await requireUser();

  return (
    <div>
      <h1>Welcome</h1>
      <p>Signed in as {user.email}</p>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Link href="/consult/new" style={{ padding: '10px 20px', border: '1px solid #ccc' }}>
          New Consultation
        </Link>
        <Link href="/doctors" style={{ padding: '10px 20px', border: '1px solid #ccc' }}>
          Browse Doctors
        </Link>
        <Link href="/profile/history" style={{ padding: '10px 20px', border: '1px solid #ccc' }}>
          Medical History
        </Link>
      </div>
    </div>
  );
}