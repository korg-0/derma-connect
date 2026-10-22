import { NextRequest, NextResponse } from 'next/server';
import { requireVerifiedDoctor } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const user = await requireVerifiedDoctor();
    const { consultationId } = await req.json();

    const supabase = await createClient();

    // Verify doctor owns this consultation
    const { data: consultation } = await supabase
      .from('consultations')
      .select('id, doctor_id')
      .eq('id', consultationId)
      .eq('doctor_id', user.id)
      .single();

    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found or not yours' }, { status: 404 });
    }

    // Get doctor's refresh token
    const { data: tokenRow } = await supabase
      .from('google_tokens')
      .select('refresh_token')
      .eq('doctor_id', user.id)
      .single();

    if (!tokenRow) {
      return NextResponse.json({ error: 'Google account not connected' }, { status: 400 });
    }

    // Get fresh access token
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: tokenRow.refresh_token,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
      }),
    });

    const { access_token } = await refreshRes.json();

    if (!access_token) {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
    }

    // Create meeting space
    const meetRes = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const space = await meetRes.json();

    if (!meetRes.ok) {
      return NextResponse.json({ error: space.error?.message || 'Failed to create space' }, { status: 500 });
    }

    // Save link to consultation
    await supabase
      .from('consultations')
      .update({ meeting_link: space.meetingUri })
      .eq('id', consultationId);

    return NextResponse.json({ link: space.meetingUri });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
