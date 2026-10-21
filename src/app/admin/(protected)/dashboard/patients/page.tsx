
import { createClient } from '@/lib/supabase/server';

export default async function AllPatientsPage() {
  const supabase = await createClient();
  const { data: patients } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'patient')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 style={{ marginBottom: 8, fontSize: 28 }}>All Patients</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Directory of all registered users.</p>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>Name</th>
              <th style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>Email</th>
              <th style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {patients?.map(patient => (
              <tr key={patient.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 16, fontSize: 14 }}>{patient.full_name || 'N/A'}</td>
                <td style={{ padding: 16, fontSize: 14 }}>{patient.email}</td>
                <td style={{ padding: 16, fontSize: 14 }}>{new Date(patient.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
