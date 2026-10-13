import { createClient } from '@/lib/supabase/server';

export default async function ReviewsList({ doctorId }: { doctorId: string }) {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from('ratings')
    .select('id, rating, review_text, created_at, patient_id')
    .eq('doctor_id', doctorId)
    .not('review_text', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!reviews || reviews.length === 0) {
    return (
      <p style={{ color: '#666', fontSize: 14 }}>
        No written reviews yet.
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {reviews.map((r) => (
        <div
          key={r.id}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            background: 'white',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ color: '#f59e0b', fontSize: 18 }}>
              {'★'.repeat(r.rating)}
              <span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - r.rating)}</span>
            </div>
            <span style={{ fontSize: 12, color: '#999' }}>
              {new Date(r.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 14 }}>
            {r.review_text}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#999' }}>
            — Anonymous Patient
          </p>
        </div>
      ))}
    </div>
  );
}