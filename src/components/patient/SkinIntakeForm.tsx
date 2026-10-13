'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SkinIntakeForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [symptoms, setSymptoms] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files).slice(0, 5));
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { data: consultation, error: consultError } = await supabase
        .from('consultations')
        .insert({ patient_id: patientId, symptoms_text: symptoms, status: 'pending' })
        .select('id')
        .single();

      if (consultError || !consultation) throw new Error(consultError?.message);

      const consultationId = consultation.id;

      for (const file of files) {
        const ext = file.name.split('.').pop();
        const storagePath = `${patientId}/${consultationId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('skin-images')
          .upload(storagePath, file);

        if (uploadError) throw new Error(uploadError.message);

        const { error: imageError } = await supabase
          .from('consultation_images')
          .insert({ consultation_id: consultationId, storage_path: storagePath });

        if (imageError) throw new Error(imageError.message);
      }

      router.push(`/consult/${consultationId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>Describe Your Skin Condition</h2>

      <label style={{ display: 'block', marginBottom: 8 }}>Symptoms</label>
      <textarea
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        placeholder="Describe what you're experiencing..."
        rows={5}
        style={{ width: '100%', padding: 8, marginBottom: 16 }}
      />

      <label style={{ display: 'block', marginBottom: 8 }}>Upload Photos (max 5)</label>
      <input type="file" accept="image/*" multiple onChange={handleFileChange} />
      <p style={{ fontSize: 12, color: '#666' }}>Use good lighting, keep the area in focus.</p>

      <button
        onClick={handleSubmit}
        disabled={!symptoms.trim() || files.length === 0 || submitting}
        style={{ marginTop: 16, padding: '10px 20px' }}
      >
        {submitting ? 'Submitting...' : 'Submit for Review'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 16 }}>{error}</p>}
    </div>
  );
}