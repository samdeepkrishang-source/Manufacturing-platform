'use server';

import prisma from '@/lib/db';
import { verifyPassword } from '@/lib/auth-utils';
import { createSession, deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export interface AuthState {
  error: string | null;
}

export async function loginAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  let redirectNeeded = false;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: 'Invalid email or password.' };
    }

    const isValid = verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return { error: 'Invalid email or password.' };
    }

    await createSession(user.id);
    redirectNeeded = true;
  } catch (err) {
    // If it's a redirect error, rethrow it so Next.js handles the redirect
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('Login action error:', err);
    return { error: 'An unexpected database error occurred.' };
  }

  // Redirect must be called outside the try/catch block
  if (redirectNeeded) {
    redirect('/dashboard');
  }

  return { error: null };
}

export async function logoutAction() {
  await deleteSession();
  redirect('/login');
}
