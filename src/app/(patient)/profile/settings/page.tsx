import DeleteAccountButton from '@/components/patient/DeleteAccountButton';

export default async function SettingsPage() {
  return (
    <div style={{ maxWidth: 600 }}>
      <h1>Account Settings</h1>
      
      <div style={{ marginTop: 40, padding: 24, border: '1px solid #fee2e2', borderRadius: 8 }}>
        <h2 style={{ color: '#991b1b', marginTop: 0 }}>Delete Account</h2>
        <p style={{ color: '#666', fontSize: 14 }}>
          This permanently deletes your patient login and its profile, medical history, consultations,
          prescriptions, consent records, and uploaded consultation images. A one-way digest of a
          confirmed email address is retained only to prevent that address from being registered again.
        </p>
        <DeleteAccountButton />
      </div>
    </div>
  );
}
