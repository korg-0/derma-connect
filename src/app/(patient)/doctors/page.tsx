
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function DoctorsPage() {
  const supabase = await createClient();

  const { data: doctors } = await supabase
    .from('profiles')
    .select('id, full_name, qualifications, specializations, experience_years, consultation_fee, average_rating, total_ratings, bio')
    .eq('role', 'doctor')
    .eq('verified', true)
    .order('average_rating', { ascending: false });

  return (
    <div style={{ maxWidth: 900 }}>
      <Link href="/dashboard" style={{ color: '#666' }}>
        ← Back to Dashboard
      </Link>

      <h1 style={{ marginTop: 16 }}>Dermatologists</h1>

      {(!doctors || doctors.length === 0) && (
        <p style={{ color: '#666' }}>No verified dermatologists available yet.</p>
      )}

      <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
        {doctors?.map((doc) => (
          <div
            key={doc.id}
            style={{
              padding: 20,
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              background: 'white',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, marginBottom: 4 }}>{doc.full_name}</h2>
                <p style={{ color: '#666', margin: 0, fontSize: 14 }}>
                  {doc.qualifications}
                </p>
                <p style={{ color: '#666', margin: '8px 0 0', fontSize: 14 }}>
                  {doc.experience_years} years experience
                  {doc.average_rating > 0 && (
                    <> · ⭐ {doc.average_rating} ({doc.total_ratings} reviews)</>
                  )}
                </p>
                {doc.specializations && doc.specializations.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {doc.specializations.map((spec: string) => (
                      <span
                        key={spec}
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          background: '#eff6ff',
                          color: '#1e40af',
                          borderRadius: 999,
                        }}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', marginLeft: 16 }}>
                <div style={{ fontSize: 20, fontWeight: 600 }}>₹{doc.consultation_fee}</div>
                <Link
                  href={`/doctors/${doc.id}`}
                  style={{
                    display: 'inline-block',
                    marginTop: 12,
                    padding: '8px 16px',
                    background: '#0070f3',
                    color: 'white',
                    borderRadius: 6,
                    textDecoration: 'none',
                    fontSize: 14,
                  }}
                >
                  Book
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
