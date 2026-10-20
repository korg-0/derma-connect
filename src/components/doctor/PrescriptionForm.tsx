'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export default function PrescriptionForm({
  consultationId,
  doctorId,
  patientId,
}: {
  consultationId: string;
  doctorId: string;
  patientId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '' },
  ]);
  const [instructions, setInstructions] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMed = (i: number, field: keyof Medication, value: string) => {
    const next = [...medications];
    next[i][field] = value;
    setMedications(next);
  };

  const addMed = () =>
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);

  const removeMed = (i: number) =>
    setMedications(medications.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      // 1. Insert prescription
      const { error: prescError } = await supabase.from('prescriptions').insert({
        consultation_id: consultationId,
        doctor_id: doctorId,
        patient_id: patientId,
        medications: medications.filter((m) => m.name.trim()),
        instructions,
      });

      if (prescError) throw new Error(prescError.message);

      // 2. Update consultation status to completed + save diagnosis
            // 2. Update consultation status to completed + save diagnosis
      const { error: consultError } = await supabase
        .from('consultations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          diagnosis,
        })
        .eq('id', consultationId);

      if (consultError) throw new Error(consultError.message);

      // 3. Send Email Notification to Patient
      try {
        // Change to maybeSingle()
        const { data: patient } = await supabase.from('profiles').select('full_name, email').eq('id', patientId).maybeSingle();
        const { data: doctor } = await supabase.from('profiles').select('full_name').eq('id', doctorId).maybeSingle();

        if (patient && patient.email && doctor) {
          console.log("Sending email to:", patient.email); // Debug log
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'prescription',
              to: patient.email,
              doctorName: doctor.full_name,
              patientName: patient.full_name,
              consultationUrl: `${window.location.origin}/consult/${consultationId}`,
            }),
          });
        } else {
          console.error("Missing patient or doctor data for email", { patient, doctor });
        }
      } catch (err) {
        console.error('Failed to trigger prescription email:', err);
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const valid = medications.some((m) => m.name.trim());

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Diagnosis</label>
        <input
          type="text"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="e.g., Contact dermatitis"
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      {medications.map((med, i) => (
        <div
          key={i}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>Medication {i + 1}</strong>
            {medications.length > 1 && (
              <button
                onClick={() => removeMed(i)}
                style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}
              >
                Remove
              </button>
            )}
          </div>
          <input
            type="text"
            value={med.name}
            onChange={(e) => updateMed(i, 'name', e.target.value)}
            placeholder="Medication name (generic)"
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <input
              type="text"
              value={med.dosage}
              onChange={(e) => updateMed(i, 'dosage', e.target.value)}
              placeholder="Dosage"
              style={{ padding: 8 }}
            />
            <input
              type="text"
              value={med.frequency}
              onChange={(e) => updateMed(i, 'frequency', e.target.value)}
              placeholder="Frequency"
              style={{ padding: 8 }}
            />
            <input
              type="text"
              value={med.duration}
              onChange={(e) => updateMed(i, 'duration', e.target.value)}
              placeholder="Duration"
              style={{ padding: 8 }}
            />
          </div>
        </div>
      ))}

      <button
        onClick={addMed}
        style={{ marginBottom: 16, padding: '6px 12px' }}
      >
        + Add Medication
      </button>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Additional Instructions</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          placeholder="Application instructions, precautions, follow-up advice..."
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!valid || submitting}
        style={{ padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6 }}
      >
        {submitting ? 'Issuing...' : 'Issue Prescription'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
    </div>
  );
}