import { requireUser } from '@/lib/auth';
import DeleteAccountButton from '@/components/patient/DeleteAccountButton';

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div style={{ maxWidth: 600 }}>
      <h1>Account Settings</h1>
      
      <div style={{ marginTop: 40, padding: 24, border: '1px solid #fee2e2', borderRadius: 8 }}>
        <h2 style={{ color: '#991b1b', marginTop: 0 }}>Delete Account</h2>
        <p style={{ color: '#666', fontSize: 14 }}>
          Under the DPDP Act, you have the right to request erasure of your personal data. 
          Deleting your account will remove your name, email, and phone number from our system.
          <br/><br/>
          <strong>Note:</strong> Your medical records (consultations, images, prescriptions) will be kept 
          for legal retention purposes (3 years) but will be fully anonymized.
        </p>
        <DeleteAccountButton patientId={user.id} />
      </div>
    </div>
  );
}
