export const unstable_instant = false;

import { createClient } from '@/lib/supabase/server';
import RevokeDoctorButton from '@/components/admin/RevokeDoctorButton';

export default async function AllDoctorsPage() {
  const supabase = await createClient();
  const { data: doctors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'doctor')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 style={{ marginBottom: 8, fontSize: 28 }}>All Doctors</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Manage all registered dermatologists on the platform.</p>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>Name</th>
              <th style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>Email</th>
              <th style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>Status</th>
              <th style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {doctors?.map(doc => (
              <tr key={doc.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 16, fontSize: 14 }}>{doc.full_name}</td>
                <td style={{ padding: 16, fontSize: 14 }}>{doc.email}</td>
                <td style={{ padding: 16, fontSize: 14 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, background: doc.verified ? '#d1fae5' : '#fef3c7', color: doc.verified ? '#065f46' : '#92400e' }}>
                    {doc.verified ? 'Verified' : 'Pending / Revoked'}
                  </span>
                </td>
                <td style={{ padding: 16, fontSize: 14 }}>
                  {doc.verified && <RevokeDoctorButton doctorId={doc.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}