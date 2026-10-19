import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';

export async function GET() {
  await requireUser(); // Must be logged in

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/meetings.space.created',
    access_type: 'offline',
    prompt: 'consent', // Forces refresh token on every authorization
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}