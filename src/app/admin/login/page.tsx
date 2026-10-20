'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    // Try to fetch the role from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle(); // Use maybeSingle to prevent 500 errors if missing

    if (profileError) {
      console.error("Database error fetching profile:", profileError);
    }

    // Check the profile role OR the auth metadata role
    const userRole = profile?.role || data.user.user_metadata?.role;

    if (userRole !== 'admin') {
      await supabase.auth.signOut();
      setError('Access denied. You do not have administrator privileges.');
      setLoading(false);
      return;
    }

    router.push('/admin/dashboard');
    router.refresh();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111827' }}>
      <form onSubmit={handleSubmit} style={{ width: 360, padding: 40, background: '#1f2937', borderRadius: 12, border: '1px solid #374151' }}>
        <h1 style={{ color: 'white', textAlign: 'center', marginTop: 0, marginBottom: 8 }}>Admin Portal</h1>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin Email" required style={{ display: 'block', width: '100%', padding: 12, marginBottom: 12, background: '#374151', border: 'none', borderRadius: 6, color: 'white' }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required style={{ display: 'block', width: '100%', padding: 12, marginBottom: 16, background: '#374151', border: 'none', borderRadius: 6, color: 'white' }} />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: '#60a5fa', color: '#111827', border: 'none', borderRadius: 6, fontWeight: 600 }}>
          {loading ? 'Authenticating...' : 'Secure Login'}
        </button>
        {error && <p style={{ color: '#f87171', marginTop: 16, fontSize: 14, textAlign: 'center' }}>{error}</p>}
      </form>
    </div>
  );
}
