import { NextRequest, NextResponse } from 'next/server';
import { requireVerifiedDoctor } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const user = await requireVerifiedDoctor();
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/doctor/dashboard?error=no_code', request.url));
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.refresh_token) {
    return NextResponse.redirect(new URL('/doctor/dashboard?error=no_refresh_token', request.url));
  }

  // Store refresh token
  const supabase = await createClient();
  await supabase.from('google_tokens').upsert({
    doctor_id: user.id,
    refresh_token: tokens.refresh_token,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.redirect(new URL('/doctor/dashboard?connected=google', request.url));
}
