
import { createClient } from '@/lib/supabase/server';
import VerifyDoctorButton from '@/components/admin/VerifyDoctorButton';


export default async function AdminDashboard() {
  const supabase = await createClient();
  
  const { data: pendingDoctors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'doctor')
    .eq('verified', false)
    .order('created_at', { ascending: true });

  return (
    <div>
      <h1 style={{ marginBottom: 8, fontSize: 28 }}>Doctor Verifications</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Review credentials and approve doctors.</p>

      {(!pendingDoctors || pendingDoctors.length === 0) ? (
        <div style={{ padding: 40, background: 'white', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#16a34a' }}>All caught up!</h3>
          <p style={{ color: '#666', margin: '8px 0 0' }}>No pending applications.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pendingDoctors.map(doc => (
            <div key={doc.id} style={{ padding: 24, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}>
              <h3 style={{ margin: '0 0 8px', color: '#111827' }}>{doc.full_name}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 14, marginBottom: 16 }}>
                <p style={{ margin: 0 }}><strong>Email:</strong> {doc.email}</p>
                <p style={{ margin: 0 }}><strong>Phone:</strong> {doc.phone || 'Not provided'}</p>
                <p style={{ margin: 0 }}><strong>Qualifications:</strong> {doc.qualifications || 'Not provided'}</p>
                <p style={{ margin: 0 }}><strong>Reg Number:</strong> {doc.registration_number || 'Not provided'}</p>
                <p style={{ margin: 0 }}><strong>Experience:</strong> {doc.experience_years ? `${doc.experience_years} years` : 'Not provided'}</p>
                <p style={{ margin: 0 }}><strong>Consultation Fee:</strong> {doc.consultation_fee ? `₹${doc.consultation_fee}` : 'Not provided'}</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>Specializations:</strong>
                {doc.specializations && doc.specializations.length > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {doc.specializations.map((spec: string) => (
                      <span key={spec} style={{ fontSize: 12, padding: '4px 10px', background: '#eff6ff', color: '#1e40af', borderRadius: 999 }}>
                        {spec}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 14, color: '#666' }}>None listed</span>
                )}
              </div>

              {doc.bio && (
                <div style={{ marginBottom: 16 }}>
                  <strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>Bio:</strong>
                  <p style={{ margin: 0, fontSize: 14, color: '#4b5563', fontStyle: 'italic', background: '#f9f9f9', padding: 12, borderRadius: 6 }}>
                    "{doc.bio}"
                  </p>
                </div>
              )}
              
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 12 }}>
                <VerifyDoctorButton doctorId={doc.id} />
                
                <button style={{ padding: '8px 16px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
