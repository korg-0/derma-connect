'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ConsultationChat({
  consultationId,
  currentUserId,
}: {
  consultationId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // 1. Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('consultation_id', consultationId)
        .order('created_at', { ascending: true });

      if (!error && data) setMessages(data);
      setLoading(false);
    };

    fetchMessages();
  }, [consultationId, supabase]);

  // 2. Subscribe to new messages (Realtime)
  useEffect(() => {
    const channel = supabase
      .channel(`chat_${consultationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `consultation_id=eq.${consultationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [consultationId, supabase]);

  // 3. Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    // Insert into database (Realtime will handle updating the UI for both parties)
    await supabase.from('messages').insert({
      consultation_id: consultationId,
      sender_id: currentUserId,
      content,
    });
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, display: 'flex', flexDirection: 'column', height: 400 }}>
      <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', background: '#f9f9f9', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Messages</h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <p style={{ color: '#999', fontSize: 14, textAlign: 'center' }}>Loading messages...</p>}
        
        {!loading && messages.length === 0 && (
          <p style={{ color: '#999', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            No messages yet. Send a message to start the conversation.
          </p>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: isMe ? '#0070f3' : '#f3f4f6',
                color: isMe ? 'white' : 'black',
                padding: '8px 12px',
                borderRadius: 12,
                borderBottomRightRadius: isMe ? 2 : 12,
                borderBottomLeftRadius: isMe ? 12 : 2,
              }}
            >
              <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              <span style={{ fontSize: 10, opacity: 0.7, display: 'block', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{ padding: '10px 16px', background: '#0070f3', color: 'white', border: 'none', borderRadius: 6, cursor: newMessage.trim() ? 'pointer' : 'not-allowed' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}