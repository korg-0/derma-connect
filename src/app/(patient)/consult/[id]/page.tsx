export const unstable_instant = false;

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import RatingForm from '@/components/patient/RatingForm';
import ConsultationChat from '@/components/chat/ConsultationChat';

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch consultation
  const { data: consultation, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('id', id)
    .eq('patient_id', user.id)
    .single();

  if (error || !consultation) {
    notFound();
  }

  // Fetch images for this consultation
  const { data: images } = await supabase
    .from('consultation_images')
    .select('id, storage_path')
    .eq('consultation_id', id);

  // Get signed URLs for the images (private bucket)
  const imagesWithUrls = await Promise.all(
    (images || []).map(async (img) => {
      const { data } = await supabase.storage
        .from('skin-images')
        .createSignedUrl(img.storage_path, 3600);
      return { id: img.id, url: data?.signedUrl || null };
    })
  );

  // Fetch prescription if it exists
  const { data: prescription } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('consultation_id', id)
    .maybeSingle();


  // Check if patient already rated this consultation
const { data: existingRating } = await supabase
  .from('ratings')
  .select('id, rating, review_text')
  .eq('consultation_id', id)
  .maybeSingle();

  // Fetch assigned doctor if any
  const doctor = consultation.doctor_id
    ? (
        await supabase
          .from('profiles')
          .select('id, full_name, specializations')
          .eq('id', consultation.doctor_id)
          .single()
      ).data
    : null;

  return (
    <div style={{ maxWidth: 800 }}>

      <h1 style={{ marginTop: 16 }}>Consultation</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Case ID: <code>{consultation.id}</code>
      </p>

      <div
        style={{
          padding: 12,
          background: statusColor(consultation.status),
          borderRadius: 6,
          display: 'inline-block',
          marginBottom: 20,
        }}
      >
        Status: <strong>{consultation.status}</strong>
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2>Symptoms</h2>
        <p style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: 12, borderRadius: 6 }}>
          {consultation.symptoms_text}
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Images ({imagesWithUrls.length})</h2>
        {imagesWithUrls.length === 0 ? (
          <p style={{ color: '#666' }}>No images attached.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {imagesWithUrls.map((img) => (
              <div key={img.id} style={{ border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
                {img.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.url} alt="Skin condition" style={{ width: '100%', display: 'block' }} />
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>Failed to load</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {doctor ? (
        <section style={{ marginBottom: 24 }}>
          <h2>Assigned Dermatologist</h2>
          <p>
            <strong>{doctor.full_name}</strong>
            {doctor.specializations && (
              <span style={{ color: '#666' }}> — {doctor.specializations.join(', ')}</span>
            )}
          </p>
        </section>
      ) : (
        <section style={{ marginBottom: 24 }}>
          <h2>Next Steps</h2>
          <p style={{ color: '#666' }}>
            No dermatologist assigned yet. Book a consultation slot to proceed.
          </p>
          <Link
            href="/doctors"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#0070f3',
              color: 'white',
              borderRadius: 6,
              textDecoration: 'none',
              marginTop: 8,
            }}
          >
            Browse Dermatologists
          </Link>
        </section>
      )}

      {consultation.meeting_link && (
        <section style={{ marginBottom: 24 }}>
          <h2>Video Consultation</h2>
          <p style={{ color: '#666', fontSize: 14 }}>
            Your doctor has generated a meeting link for this consultation.
          </p>
          <a
            href={consultation.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#16a34a', // Green button
              color: 'white',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Join Google Meet
          </a>
        </section>
      )}

        {consultation.doctor_id && (
  <section style={{ marginTop: 40 }}>
    <h2>Communication</h2>
    <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
      Send a message to your dermatologist.
    </p>
    <ConsultationChat 
      consultationId={consultation.id} 
      currentUserId={user.id} 
    />
  </section>
)}

      {prescription && (
        <section style={{ marginBottom: 24 }}>
          <h2>Prescription</h2>
          <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 6 }}>
            <ul style={{ marginTop: 0 }}>
              {(prescription.medications as any[]).map((med, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <strong>{med.name}</strong>
                  {med.dosage && ` — ${med.dosage}`}
                  {med.frequency && `, ${med.frequency}`}
                  {med.duration && ` for ${med.duration}`}
                </li>
              ))}
            </ul>
            {prescription.instructions && (
              <p style={{ marginBottom: 0 }}>
                <strong>Instructions:</strong> {prescription.instructions}
              </p>
            )}
          </div>
        </section>
      )}
      {consultation.status === 'completed' && consultation.doctor_id && (
  <section style={{ marginTop: 32 }}>
    {!existingRating ? (
      <RatingForm
        consultationId={consultation.id}
        doctorId={consultation.doctor_id}
        patientId={user.id}
      />
    ) : (
      <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Your Rating</h3>
        <div style={{ color: '#f59e0b', fontSize: 24 }}>
          {'★'.repeat(existingRating.rating)}
          <span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - existingRating.rating)}</span>
        </div>
        {existingRating.review_text && (
          <p style={{ margin: '8px 0 0', fontStyle: 'italic' }}>
            "{existingRating.review_text}"
          </p>
        )}
      </div>
    )}
  </section>
)}
    </div>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#fef3c7';
    case 'scheduled':
      return '#dbeafe';
    case 'in_progress':
      return '#e0e7ff';
    case 'completed':
      return '#d1fae5';
    case 'cancelled':
      return '#fee2e2';
    default:
      return '#f3f4f6';
  }
}