import SkinIntakeForm from '@/components/patient/SkinIntakeForm';
import { requireUser } from '@/lib/auth';
export const unstable_instant = false;
export default async function NewConsultationPage() {
  const user = await requireUser();
  return <SkinIntakeForm patientId={user.id} />;
}