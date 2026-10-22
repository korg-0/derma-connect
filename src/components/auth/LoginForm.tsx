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
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

    useEffect(() => {
    // Ensure the loading state is reset when the page mounts
    setLoading(false);
    if (new URLSearchParams(window.location.search).get('error') === 'email_not_confirmed') {
      setError('Please confirm your email before signing in. Enter your address below to resend the link.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setNotice(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(/email not confirmed/i.test(error.message)
          ? 'Please confirm your email before signing in. You can resend the confirmation link below.'
          : error.message);
        setLoading(false);
        return;
      }

      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setError('Please confirm your email before signing in. You can resend the confirmation link below.');
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

  const resendConfirmation = async () => {
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    setError(null);
    setNotice(null);
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fdashboard`,
      },
    });
    if (error) setError(error.message);
    else setNotice('If this address has a pending account, a new confirmation link has been sent.');
    setResending(false);
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
      {email && <button type="button" onClick={resendConfirmation} disabled={resending} style={{ width: '100%', marginTop: 12, padding: 8 }}>
        {resending ? 'Sending...' : 'Resend confirmation email'}
      </button>}
      {notice && <p role="status" style={{ color: '#166534', marginTop: 12 }}>{notice}</p>}
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' }}>
          Don't have an account? <a href="/signup" style={{ color: '#0070f3', textDecoration: 'none' }}>Sign up</a>
        </p>
    </form>
  );
}
