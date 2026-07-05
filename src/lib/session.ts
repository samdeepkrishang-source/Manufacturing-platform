import { cookies } from 'next/headers';
import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'default-apexops-super-secret-key-1234567890';

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

export async function createSession(userId: string) {
  const expiresAt = Date.now() + 12 * 60 * 60 * 1000; // 12 hours
  const payloadObj = { userId, expiresAt };
  const payloadStr = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
  const signature = sign(payloadStr);
  const token = `${payloadStr}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('session');
  if (!cookie) return null;

  const parts = cookie.value.split('.');
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;
  const expectedSignature = sign(payloadStr);
  if (signature !== expectedSignature) return null;

  try {
    const payloadObj = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf-8'));
    if (Date.now() > payloadObj.expiresAt) return null;
    return { userId: payloadObj.userId };
  } catch {
    return null;
  }
}

import prisma from '@/lib/db';
import { User } from '@prisma/client';

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  return await prisma.user.findUnique({
    where: { id: session.userId },
  });
}
