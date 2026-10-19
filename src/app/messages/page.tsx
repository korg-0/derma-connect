export const unstable_instant = false;

import Link from 'next/link';
import { requireUser, getProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function MessagesHub() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const supabase = await createClient();

  const isDoctor = profile?.role === 'doctor';

  // Fetch active consultations to find chat partners
  const { data: consultations } = await supabase
    .from('consultations')
    .select(`
      id,
      patient_id,
      doctor_id,
      profiles!consultations_patient_id_fkey (full_name),
      doctor_profile:profiles!consultations_doctor_id_fkey (full_name)
    `)
    .or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`)
    .not(isDoctor ? 'doctor_id' : 'patient_id', 'is', null)
    .order('created_at', { ascending: false });

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ marginBottom: 24 }}>Messages</h1>
      
      {(!consultations || consultations.length === 0) && (
        <p style={{ color: '#666' }}>No conversations yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {consultations?.map((c) => {
          const otherParty = isDoctor 
            ? (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles)?.full_name || 'Patient'
            : (Array.isArray(c.doctor_profile) ? c.doctor_profile[0] : c.doctor_profile)?.full_name || 'Doctor';

          return (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0070f3', fontWeight: 'bold' }}>
                {otherParty[0]}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>{isDoctor ? otherParty : `Dr. ${otherParty}`}</h3>
                <p style={{ margin: 0, fontSize: 14, color: '#666' }}>Consultation #{c.id.split('-')[0]}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}