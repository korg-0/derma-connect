import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { type, version } = await req.json();

    const supabase = await createClient();
    
    // Insert the consent log
    const { error } = await supabase.from('consent_log').insert({
      user_id: user.id,
      consent_type: type,
      granted: true,
      version: version,
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}