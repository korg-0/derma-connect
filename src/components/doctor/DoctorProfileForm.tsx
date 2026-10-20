'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DoctorProfileForm({ initialData, userId }: { initialData: any, userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [qualifications, setQualifications] = useState(initialData?.qualifications || '');
  const [registrationNumber, setRegistrationNumber] = useState(initialData?.registration_number || '');
  const [experienceYears, setExperienceYears] = useState(initialData?.experience_years?.toString() || '');
  const [consultationFee, setConsultationFee] = useState(initialData?.consultation_fee?.toString() || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('profiles').update({
      qualifications,
      registration_number: registrationNumber,
      experience_years: parseInt(experienceYears) || 0,
      consultation_fee: parseFloat(consultationFee) || 0,
      bio,
    }).eq('id', userId);
    
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Qualifications</label>
        <input type="text" value={qualifications} onChange={e => setQualifications(e.target.value)} placeholder="e.g. MBBS, MD (Dermatology)" style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Medical Registration Number</label>
        <input type="text" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} placeholder="e.g. NMC-12345" style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Experience (Years)</label>
          <input type="number" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Consultation Fee (₹)</label>
          <input type="number" value={consultationFee} onChange={e => setConsultationFee(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
        </div>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Professional Bio</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', background: '#0070f3', color: 'white', border: 'none', borderRadius: 6, cursor: saving ? 'wait' : 'pointer' }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {saved && <span style={{ color: 'green', fontSize: 14 }}>✓ Saved</span>}
      </div>
    </div>
  );
}