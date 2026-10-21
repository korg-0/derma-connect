
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function PatientHistoryPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch all consultations for this patient
  const { data: consultations } = await supabase
    .from('consultations')
    .select(`
      id, 
      symptoms_text, 
      status, 
      created_at, 
      scheduled_at,
      profiles!consultations_doctor_id_fkey (full_name)
    `)
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/dashboard" style={{ color: '#666' }}>
        ← Back to Dashboard
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>My Consultations</h1>
        <Link
          href="/consult/new"
          style={{
            padding: '8px 16px',
            background: '#0070f3',
            color: 'white',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          + New Consultation
        </Link>
      </div>

      {(!consultations || consultations.length === 0) && (
        <p style={{ color: '#666' }}>You haven't submitted any consultations yet.</p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {consultations?.map((c) => {
          // TypeScript needs a little help with the joined profile object
          const doctorName = Array.isArray(c.profiles) 
            ? c.profiles[0]?.full_name 
            : (c.profiles as any)?.full_name;

          return (
            <Link
              key={c.id}
              href={`/consult/${c.id}`}
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
                <strong>
                  {doctorName ? `Dr. ${doctorName}` : 'Unassigned'}
                </strong>
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
                {c.symptoms_text.length > 100
                  ? c.symptoms_text.slice(0, 100) + '...'
                  : c.symptoms_text}
              </p>
              <p style={{ color: '#999', fontSize: 12, marginTop: 12 }}>
                Submitted: {new Date(c.created_at).toLocaleDateString()}
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
