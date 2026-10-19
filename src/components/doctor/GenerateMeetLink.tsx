'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateMeetLink({
  consultationId,
  existingLink,
}: {
  consultationId: string;
  existingLink: string | null;
}) {
  const router = useRouter();
  const [link, setLink] = useState(existingLink);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);

    const res = await fetch('/api/meet/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error === 'Google account not connected') {
        window.location.href = '/api/google/auth';
        return;
      }
      setError(data.error);
    } else {
      setLink(data.link);
      router.refresh();
    }
    setLoading(false);
  };

  if (link) {
    return (
      <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8 }}>
        <p style={{ margin: 0, fontWeight: 500 }}>Meeting Link Ready</p>
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3' }}>
          {link}
        </a>
        <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          Share this with the patient. It's a persistent room for this consultation.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading}
        style={{ padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: 6 }}
      >
        {loading ? 'Generating...' : 'Generate Google Meet Link'}
      </button>
      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
    </div>
  );
}