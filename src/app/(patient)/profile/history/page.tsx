
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import MedicalHistoryForm from '@/components/patient/MedicalHistoryForm';

export default async function MedicalHistoryPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: history } = await supabase
    .from('medical_history')
    .select('*')
    .eq('patient_id', user.id)
    .maybeSingle();

  return (
    <div>
      <Link href="/dashboard" style={{ color: '#666' }}>
        ← Back to Dashboard
      </Link>

      <h1 style={{ marginTop: 16 }}>Medical History</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        This information is shared with dermatologists you consult with. Keep it up to date.
      </p>

      <MedicalHistoryForm patientId={user.id} initial={history} />
    </div>
  );
}
