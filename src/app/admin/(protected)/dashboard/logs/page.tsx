export const unstable_instant = false;

import { createClient } from '@/lib/supabase/server';

export default async function AuditLogsPage() {
  const supabase = await createClient();
  
  // Fetch consent logs and join with user profiles
  const { data: logs } = await supabase
    .from('consent_log')
    .select(`
      id, consent_type, granted, version, granted_at,
      user:profiles (email)
    `)
    .order('granted_at', { ascending: false });

  return (
    <div>
      <h1 style={{ marginBottom: 8, fontSize: 28 }}>Consent & Privacy Logs</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>DPDP Act compliance record of user consents.</p>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>User Email</th>
              <th style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>Consent Type</th>
              <th style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>Version</th>
              <th style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>Status</th>
              <th style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map(log => {
              const userEmail = Array.isArray(log.user) ? log.user[0]?.email : (log.user as any)?.email;
              return (
                <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 16, fontSize: 14 }}>{userEmail || 'Unknown'}</td>
                  <td style={{ padding: 16, fontSize: 14, textTransform: 'capitalize' }}>{log.consent_type}</td>
                  <td style={{ padding: 16, fontSize: 14 }}>v{log.version}</td>
                  <td style={{ padding: 16, fontSize: 14 }}>
                    <span style={{ color: log.granted ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                      {log.granted ? 'Granted' : 'Revoked'}
                    </span>
                  </td>
                  <td style={{ padding: 16, fontSize: 14 }}>{new Date(log.granted_at).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!logs || logs.length === 0) && <p style={{ padding: 24, textAlign: 'center', color: '#666' }}>No consent logs recorded yet.</p>}
      </div>
    </div>
  );
}