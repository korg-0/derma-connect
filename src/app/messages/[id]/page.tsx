export const unstable_instant = false;

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import ConsultationChat from '@/components/chat/ConsultationChat';

export default async function ChatRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch consultation and verify access
  const { data: consultation, error } = await supabase
    .from('consultations')
    .select('id, patient_id, doctor_id')
    .eq('id', id)
    .maybeSingle();

  if (error || !consultation) notFound();
  if (consultation.patient_id !== user.id && consultation.doctor_id !== user.id) notFound();

  return (
    <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <Link href="/messages" style={{ color: '#666', marginBottom: 16, display: 'inline-block' }}>
        ← Back to Messages
      </Link>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <ConsultationChat consultationId={id} currentUserId={user.id} />
      </div>
    </div>
  );
}