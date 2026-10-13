'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface MedicalHistory {
  id?: string;
  allergies: string[];
  current_medications: string[];
  past_conditions: string[];
  surgeries: string[];
  family_history: string;
  notes: string;
}

export default function MedicalHistoryForm({
  patientId,
  initial,
}: {
  patientId: string;
  initial: MedicalHistory | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  // Use comma-separated text inputs for list fields — simpler UX than tag inputs
  const [allergies, setAllergies] = useState((initial?.allergies || []).join(', '));
  const [medications, setMedications] = useState((initial?.current_medications || []).join(', '));
  const [conditions, setConditions] = useState((initial?.past_conditions || []).join(', '));
  const [surgeries, setSurgeries] = useState((initial?.surgeries || []).join(', '));
  const [familyHistory, setFamilyHistory] = useState(initial?.family_history || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseList = (text: string): string[] =>
    text
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    setSaved(false);

    const payload = {
      patient_id: patientId,
      allergies: parseList(allergies),
      current_medications: parseList(medications),
      past_conditions: parseList(conditions),
      surgeries: parseList(surgeries),
      family_history: familyHistory.trim(),
      notes: notes.trim(),
      updated_at: new Date().toISOString(),
    };

    // Upsert — insert if new, update if exists
    const { error } = await supabase
      .from('medical_history')
      .upsert(payload, { onConflict: 'patient_id' });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    router.refresh();

    // Hide the "saved" toast after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          Allergies
        </label>
        <input
          type="text"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="e.g., penicillin, latex (comma-separated)"
          style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
          Separate multiple entries with commas.
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          Current Medications
        </label>
        <input
          type="text"
          value={medications}
          onChange={(e) => setMedications(e.target.value)}
          placeholder="e.g., metformin 500mg, vitamin D (comma-separated)"
          style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          Past Conditions
        </label>
        <input
          type="text"
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          placeholder="e.g., eczema, asthma (comma-separated)"
          style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          Past Surgeries
        </label>
        <input
          type="text"
          value={surgeries}
          onChange={(e) => setSurgeries(e.target.value)}
          placeholder="e.g., appendix 2020 (comma-separated)"
          style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          Family History
        </label>
        <textarea
          value={familyHistory}
          onChange={(e) => setFamilyHistory(e.target.value)}
          placeholder="Any hereditary conditions relevant to skin health (e.g., psoriasis, melanoma)"
          rows={3}
          style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else your dermatologist should know"
          rows={3}
          style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 24px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: saving ? 'wait' : 'pointer',
            fontSize: 15,
          }}
        >
          {saving ? 'Saving...' : 'Save History'}
        </button>

        {saved && <span style={{ color: '#16a34a', fontSize: 14 }}>✓ Saved</span>}
      </div>

      {error && (
        <p style={{ color: 'red', marginTop: 12 }}>{error}</p>
      )}
    </div>
  );
}