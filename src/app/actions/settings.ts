'use server';

import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export interface SettingsState {
  success?: boolean;
  error: string | null;
}

export async function updateSettingsAction(prevState: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Unauthorized session.' };
  }

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const companyName = formData.get('companyName') as string;

  if (!firstName || !lastName || !companyName) {
    return { error: 'All fields are required.' };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { firstName, lastName, companyName }
    });
    revalidatePath('/dashboard');
    return { success: true, error: null };
  } catch (err) {
    console.error('Update settings error:', err);
    return { error: 'Failed to update settings.' };
  }
}
