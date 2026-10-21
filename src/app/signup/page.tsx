'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import LegalConsent from '@/components/legal/LegalConsent';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Create the auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    // 2. Check for errors FIRST
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // 3. Log consent (only if user was created)
    if (data.user) {
      // We use upsert or ignore errors in case RLS blocks it before email confirmation
      try {
        await supabase.from('consent_log').insert([
          { user_id: data.user.id, consent_type: 'terms_of_service', granted: true, version: '1.0' },
          { user_id: data.user.id, consent_type: 'privacy_policy', granted: true, version: '1.0' }
        ]);
      } catch (err) {
        console.error('Failed to log signup consent:', err);
        // We don't return here because the user is still created
      }
    }

    // 4. Handle email confirmation flow
    if (data.user && data.session === null) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    // 5. Handle auto-confirm flow (logged in immediately)
    if (data.session) {
      router.push(role === 'doctor' ? '/doctor/dashboard' : '/dashboard');
      router.refresh();
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <div style={{ maxWidth: 400, padding: 40, background: 'white', borderRadius: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <h2 style={{ marginTop: 0 }}>Check your email</h2>
          <p style={{ color: '#666' }}>We've sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account and sign in.</p>
          <Link href="/login" style={{ color: '#0070f3', marginTop: 16, display: 'inline-block' }}>Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
      <div style={{ width: '100%', maxWidth: 440, padding: 40, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <h1 style={{ marginTop: 0, marginBottom: 8, textAlign: 'center' }}>Create an account</h1>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: 24 }}>Join DermaConnect today.</p>

        {/* Role Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f3f4f6', padding: 4, borderRadius: 8 }}>
          <button
            type="button"
            onClick={() => setRole('patient')}
            style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
              background: role === 'patient' ? 'white' : 'transparent',
              fontWeight: role === 'patient' ? 600 : 400,
              boxShadow: role === 'patient' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            I am a Patient
          </button>
          <button
            type="button"
            onClick={() => setRole('doctor')}
            style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
              background: role === 'doctor' ? 'white' : 'transparent',
              fontWeight: role === 'doctor' ? 600 : 400,
              boxShadow: role === 'doctor' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            I am a Doctor
          </button>
        </div>

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={role === 'doctor' ? "Dr. Jane Smith" : "Jane Doe"}
              style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
            />
          </div>
          
          <LegalConsent context="signup" onConsentChange={setConsentGiven} />

          <button
            type="submit"
            disabled={loading || !consentGiven}
            style={{ width: '100%', padding: '12px 0', background: '#0070f3', color: 'white', border: 'none', borderRadius: 6, fontSize: 16, fontWeight: 500, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          {error && <p style={{ color: 'red', marginTop: 16, fontSize: 14 }}>{error}</p>}
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
          Already have an account? <Link href="/login" style={{ color: '#0070f3' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}