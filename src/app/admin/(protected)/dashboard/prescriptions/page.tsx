
import { createClient } from '@/lib/supabase/server';

export default async function PrescriptionAuditPage() {
  const supabase = await createClient();
  // Join prescriptions with doctor profiles
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select(`
      id, medications, instructions, issued_at,
      doctor:profiles!prescriptions_doctor_id_fkey (full_name)
    `)
    .order('issued_at', { ascending: false });

  return (
    <div>
      <h1 style={{ marginBottom: 8, fontSize: 28 }}>Prescription Audit Log</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Immutable record of all prescriptions issued on the platform.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {prescriptions?.map(rx => {
          const docName = Array.isArray(rx.doctor) ? rx.doctor[0]?.full_name : (rx.doctor as any)?.full_name;
          return (
            <div key={rx.id} style={{ padding: 24, background: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <strong style={{ fontSize: 16 }}>Prescribed by Dr. {docName || 'Unknown'}</strong>
                <span style={{ fontSize: 14, color: '#666' }}>{new Date(rx.issued_at).toLocaleString()}</span>
              </div>
              <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>
                {(rx.medications as any[]).map((med, i) => (
                  <li key={i} style={{ fontSize: 14, marginBottom: 4 }}>
                    <strong>{med.name}</strong> — {med.dosage}, {med.frequency} for {med.duration}
                  </li>
                ))}
              </ul>
              {rx.instructions && <p style={{ margin: 0, fontSize: 14, fontStyle: 'italic', background: '#f9f9f9', padding: 12, borderRadius: 6 }}>Instructions: {rx.instructions}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
