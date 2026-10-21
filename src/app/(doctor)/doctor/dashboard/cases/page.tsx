
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function DoctorCasesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch consultations assigned to this doctor
  const { data: consultations } = await supabase
    .from('consultations')
    .select('id, patient_id, symptoms_text, status, created_at')
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch patient names
  const patientIds = [...new Set((consultations || []).map((c) => c.patient_id))];
  const { data: patients } = patientIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', patientIds)
    : { data: [] };

  const patientMap = new Map((patients || []).map((p) => [p.id, p]));

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ marginBottom: 24 }}>My Cases</h1>

      {(!consultations || consultations.length === 0) && (
        <p style={{ color: '#666' }}>No cases assigned yet. Patients will appear here once they book a slot with you.</p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {consultations?.map((c) => {
          const patient = patientMap.get(c.patient_id);
          return (
            <Link
              key={c.id}
              href={`/doctor/case/${c.id}`}
              style={{
                display: 'block',
                padding: 16,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                background: 'white',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>{patient?.full_name || 'Unknown Patient'}</strong>
                <span
                  style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: statusColor(c.status),
                  }}
                >
                  {c.status}
                </span>
              </div>
              <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
                {c.symptoms_text.length > 120
                  ? c.symptoms_text.slice(0, 120) + '...'
                  : c.symptoms_text}
              </p>
              <p style={{ color: '#999', fontSize: 12, marginTop: 12 }}>
                {new Date(c.created_at).toLocaleDateString()}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case 'pending': return '#fef3c7';
    case 'scheduled': return '#dbeafe';
    case 'in_progress': return '#e0e7ff';
    case 'completed': return '#d1fae5';
    case 'cancelled': return '#fee2e2';
    default: return '#f3f4f6';
  }
}
