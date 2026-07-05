import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const initialUser = {
    firstName: user.firstName,
    lastName: user.lastName,
    companyName: user.companyName,
  };

  return <SettingsForm initialUser={initialUser} />;
}
