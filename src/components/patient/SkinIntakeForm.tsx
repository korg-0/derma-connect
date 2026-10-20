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

  const [consentGiven, setConsentGiven] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files).slice(0, 5));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!consentGiven) {
      setError('You must agree to the Privacy Policy and provide consent before submitting.');
      return;
    }
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

      try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'health_data_processing', version: '1.0' }),
      });
    } catch (err) {
      console.error('Failed to log consent:', err);
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

            {/* Add this block right before the <button> */}
      <div style={{ marginTop: 24, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <input 
          type="checkbox" 
          id="consent" 
          checked={consentGiven} 
          onChange={(e) => setConsentGiven(e.target.checked)}
          style={{ marginTop: 4, width: 16, height: 16 }}
        />
        <label htmlFor="consent" style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.4 }}>
          I consent to DermaConnect processing my medical images and health data for the purpose of this consultation. I have read the <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', textDecoration: 'underline' }}>Privacy Policy</a>.
        </label>
      </div>

            <button
        onClick={handleSubmit}
        disabled={!symptoms.trim() || files.length === 0 || submitting}
        style={{ 
          padding: '10px 20px', 
          // Make it visually clear it's disabled if consent isn't given, but still clickable to show the error
          background: (!symptoms.trim() || files.length === 0) ? '#ccc' : (consentGiven ? '#0070f3' : '#f59e0b'), 
          color: 'white', 
          border: 'none', 
          borderRadius: 6, 
          width: '100%',
          cursor: (!symptoms.trim() || files.length === 0 || submitting) ? 'not-allowed' : 'pointer'
        }}
      >
        {submitting ? 'Submitting...' : 'Submit for Review'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 16 }}>{error}</p>}
    </div>
  );
}