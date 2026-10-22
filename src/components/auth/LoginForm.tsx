'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

    useEffect(() => {
    // Ensure the loading state is reset when the page mounts
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const dest = profile?.role === 'doctor' ? '/doctor/dashboard' : '/dashboard';
      router.push(dest);
      router.refresh();
    };

  return (
    <form onSubmit={handleSubmit} style={{ width: 320, padding: 24 }}>
      <h1 style={{ marginBottom: 20 }}>Sign In</h1>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        style={{ display: 'block', width: '100%', padding: 10, marginBottom: 12 }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        style={{ display: 'block', width: '100%', padding: 10, marginBottom: 12 }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{ width: '100%', padding: 10 }}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' }}>
          Don't have an account? <a href="/signup" style={{ color: '#0070f3', textDecoration: 'none' }}>Sign up</a>
        </p>
    </form>
  );
}
