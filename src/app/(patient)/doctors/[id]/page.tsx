export const unstable_instant = false;

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import BookSlotButton from '@/components/patient/BookSlotButton';
import ReviewsList from '@/components/doctor/ReviewsList';

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const supabase = await createClient();

  const { data: doctor } = await supabase
    .from('profiles')
    .select('id, full_name, qualifications, specializations, experience_years, consultation_fee, average_rating, total_ratings, bio')
    .eq('id', id)
    .eq('role', 'doctor')
    .eq('verified', true)
    .single();

  if (!doctor) notFound();

  // Fetch available slots (future dates only, not booked)
  const today = new Date().toISOString().split('T')[0];
  const { data: slots } = await supabase
    .from('doctor_slots')
    .select('id, slot_date, start_time, end_time')
    .eq('doctor_id', id)
    .eq('is_booked', false)
    .gte('slot_date', today)
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true });

  // Fetch the patient's pending consultation (if any) — to associate booking
  const user = await requireUser();
  const { data: pendingConsultation } = await supabase
    .from('consultations')
    .select('id')
    .eq('patient_id', user.id)
    .in('status', ['pending', 'scheduled'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/doctors" style={{ color: '#666' }}>
        ← All Doctors
      </Link>

      <h1 style={{ marginTop: 16 }}>{doctor.full_name}</h1>
      <p style={{ color: '#666' }}>{doctor.qualifications}</p>

      <div style={{ display: 'flex', gap: 24, marginTop: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Experience</div>
          <div style={{ fontWeight: 600 }}>{doctor.experience_years} years</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Fee</div>
          <div style={{ fontWeight: 600 }}>₹{doctor.consultation_fee}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#666' }}>Rating</div>
          <div style={{ fontWeight: 600 }}>
            {doctor.average_rating > 0 ? `${doctor.average_rating} / 5` : '—'}
            {doctor.total_ratings > 0 && (
              <span style={{ color: '#666', fontWeight: 400 }}> ({doctor.total_ratings})</span>
            )}
          </div>
        </div>
      </div>

      {doctor.specializations && doctor.specializations.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          {doctor.specializations.map((spec: string) => (
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

      {doctor.bio && (
        <section style={{ marginBottom: 24 }}>
          <h2>About</h2>
          <p>{doctor.bio}</p>
        </section>
      )}

      <section>
        <h2>Available Slots</h2>
        {!pendingConsultation && (
          <p style={{ color: '#b91c1c', background: '#fef2f2', padding: 12, borderRadius: 6 }}>
            You need to submit a consultation first. <Link href="/consult/new">Start one here</Link>.
          </p>
        )}

        {pendingConsultation && (!slots || slots.length === 0) && (
          <p style={{ color: '#666' }}>No available slots at the moment.</p>
        )}

        {pendingConsultation && slots && slots.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {slots.map((slot) => (
              <div
                key={slot.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                }}
              >
                <div>
                  <strong>{slot.slot_date}</strong> — {slot.start_time} to {slot.end_time}
                </div>
                <BookSlotButton
                  slotId={slot.id}
                  consultationId={pendingConsultation.id}
                  doctorId={doctor.id}
                />
              </div>
            ))}
          </div>
        )}
      </section>
      <section style={{ marginTop: 40 }}>
  <h2>Patient Reviews</h2>
  <ReviewsList doctorId={doctor.id} />
</section>
    </div>
  );
}