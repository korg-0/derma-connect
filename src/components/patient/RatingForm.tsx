'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RatingForm({
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
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    const { error } = await supabase.from('ratings').insert({
      consultation_id: consultationId,
      doctor_id: doctorId,
      patient_id: patientId,
      rating,
      review_text: review.trim() || null,
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    router.refresh();
  };

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 20,
        background: '#fafafa',
      }}
    >
      <h3 style={{ marginTop: 0 }}>Rate Your Consultation</h3>
      <p style={{ color: '#666', fontSize: 14, marginTop: 0 }}>
        Your feedback helps other patients find good dermatologists.
      </p>

      <div
        style={{ display: 'flex', gap: 4, fontSize: 32, marginBottom: 16, userSelect: 'none' }}
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            style={{
              cursor: 'pointer',
              color: (hovered || rating) >= star ? '#f59e0b' : '#d1d5db',
              transition: 'color 0.1s',
            }}
          >
            ★
          </span>
        ))}
      </div>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Share details about your experience (optional)"
        rows={4}
        style={{
          width: '100%',
          padding: 10,
          border: '1px solid #d1d5db',
          borderRadius: 6,
          marginBottom: 12,
          fontFamily: 'inherit',
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        style={{
          padding: '10px 24px',
          background: rating === 0 ? '#9ca3af' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: rating === 0 || submitting ? 'not-allowed' : 'pointer',
          fontSize: 15,
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
    </div>
  );
}