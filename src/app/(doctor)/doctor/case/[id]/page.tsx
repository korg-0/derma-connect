export const unstable_instant = false;

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import PrescriptionForm from '@/components/doctor/PrescriptionForm';
import GenerateMeetLink from '@/components/doctor/GenerateMeetLink';
import ConsultationChat from '@/components/chat/ConsultationChat';

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch consultation — must belong to this doctor (RLS also enforces)
  const { data: consultation } = await supabase
    .from('consultations')
    .select('*')
    .eq('id', id)
    .eq('doctor_id', user.id)
    .single();

  if (!consultation) notFound();

  // Patient profile
  const { data: patient } = await supabase
    .from('profiles')
    .select('id, full_name, date_of_birth, gender, email, phone')
    .eq('id', consultation.patient_id)
    .single();

  // Medical history
  const { data: history } = await supabase
    .from('medical_history')
    .select('*')
    .eq('patient_id', consultation.patient_id)
    .maybeSingle();

  // Images with signed URLs
  const { data: images } = await supabase
    .from('consultation_images')
    .select('id, storage_path')
    .eq('consultation_id', id);

  const imagesWithUrls = await Promise.all(
    (images || []).map(async (img) => {
      const { data } = await supabase.storage
        .from('skin-images')
        .createSignedUrl(img.storage_path, 3600);
      return { id: img.id, url: data?.signedUrl || null };
    })
  );

  // Existing prescription?
  const { data: prescription } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('consultation_id', id)
    .maybeSingle();

  return (
    <div style={{ maxWidth: 900 }}>


      <h1 style={{ marginTop: 16 }}>Case: {patient?.full_name}</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Case ID: <code>{consultation.id}</code> · Status: <strong>{consultation.status}</strong>
      </p>

      <section style={{ marginBottom: 24 }}>
        <h2>Patient</h2>
        <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 6 }}>
          <p style={{ margin: 0 }}><strong>{patient?.full_name}</strong></p>
          {patient?.date_of_birth && <p style={{ margin: '4px 0' }}>DOB: {patient.date_of_birth}</p>}
          {patient?.gender && <p style={{ margin: '4px 0' }}>Gender: {patient.gender}</p>}
          {patient?.email && <p style={{ margin: '4px 0' }}>Email: {patient.email}</p>}
          {patient?.phone && <p style={{ margin: '4px 0' }}>Phone: {patient.phone}</p>}
        </div>
      </section>

      {history && (
        <section style={{ marginBottom: 24 }}>
          <h2>Medical History</h2>
          <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 6 }}>
            {history.allergies?.length > 0 && <p><strong>Allergies:</strong> {history.allergies.join(', ')}</p>}
            {history.current_medications?.length > 0 && <p><strong>Current Medications:</strong> {history.current_medications.join(', ')}</p>}
            {history.past_conditions?.length > 0 && <p><strong>Past Conditions:</strong> {history.past_conditions.join(', ')}</p>}
            {history.notes && <p><strong>Notes:</strong> {history.notes}</p>}
          </div>
        </section>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2>Symptoms</h2>
        <p style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: 12, borderRadius: 6 }}>
          {consultation.symptoms_text}
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Images ({imagesWithUrls.length})</h2>
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
      </section>

      <section style={{ marginTop: 40 }}>
  <h2>Communication</h2>
  <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
    Send a message to the patient.
  </p>
  <ConsultationChat 
    consultationId={consultation.id} 
    currentUserId={user.id} 
  />
</section>

      <section style={{ marginBottom: 24 }}>
        <h2>Video Consultation</h2>
        <GenerateMeetLink 
          consultationId={consultation.id} 
          existingLink={consultation.meeting_link} 
        />
      </section>
      

      {prescription ? (
        <section>
          <h2>Prescription (Issued)</h2>
          <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 6 }}>
            <ul>
              {(prescription.medications as any[]).map((med, i) => (
                <li key={i}>
                  <strong>{med.name}</strong> — {med.dosage}, {med.frequency} for {med.duration}
                </li>
              ))}
            </ul>
            {prescription.instructions && <p><strong>Instructions:</strong> {prescription.instructions}</p>}
          </div>
        </section>
      ) : (
        <section>
          <h2>Issue Prescription</h2>
          <PrescriptionForm
            consultationId={id}
            doctorId={user.id}
            patientId={consultation.patient_id}
          />
        </section>
      )}
    </div>
  );
}