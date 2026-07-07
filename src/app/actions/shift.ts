'use server';

import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';

const SHIFT_HOURS: Record<string, string[]> = {
  Day: ["07:00 - 08:00", "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00"],
  Swing: ["15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00", "20:00 - 21:00", "21:00 - 22:00", "22:00 - 23:00"],
  Night: ["23:00 - 00:00", "00:00 - 01:00", "01:00 - 02:00", "02:00 - 03:00", "03:00 - 04:00", "04:00 - 05:00", "05:00 - 06:00", "06:00 - 07:00"]
};

export interface ActionResponse {
  success: boolean;
  error: string | null;
}

export async function startShiftAction(shiftName: string): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized session." };
    }

    const hours = SHIFT_HOURS[shiftName] || SHIFT_HOURS.Day;

    await prisma.shiftRun.create({
      data: {
        userId: user.id,
        shiftName,
        status: 'ACTIVE',
        productionLogs: {
          create: hours.map(hour => ({
            hourLabel: hour,
            targetQty: 100,
            actualQty: 0,
            scrapQty: 0,
          }))
        }
      }
    });

    revalidatePath('/dashboard');
    return { success: true, error: null };
  } catch (err) {
    console.error('Error starting shift:', err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to initialize shift." };
  }
}

export async function updateProductionLogAction(
  logId: string,
  data: { actualQty: number; scrapQty: number; comments: string | null }
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized session." };
    }

    await prisma.productionLog.update({
      where: { id: logId },
      data: {
        actualQty: data.actualQty,
        scrapQty: data.scrapQty,
        comments: data.comments,
      }
    });

    revalidatePath('/dashboard');
    return { success: true, error: null };
  } catch (err) {
    console.error('Error updating production log:', err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to save production log." };
  }
}

export async function logDowntimeAction(
  shiftRunId: string,
  machineId: string,
  reasonCategory: string,
  notes: string | null
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized session." };
    }

    await prisma.downtimeEvent.create({
      data: {
        shiftRunId,
        machineId,
        reasonCategory,
        startedAt: new Date(),
        notes,
      }
    });

    revalidatePath('/dashboard');
    return { success: true, error: null };
  } catch (err) {
    console.error('Error logging downtime:', err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to log machine breakdown." };
  }
}

export async function resolveDowntimeAction(eventId: string): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized session." };
    }

    await prisma.downtimeEvent.update({
      where: { id: eventId },
      data: {
        endedAt: new Date(),
      }
    });

    revalidatePath('/dashboard');
    return { success: true, error: null };
  } catch (err) {
    console.error('Error resolving downtime:', err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to resolve breakdown." };
  }
}

export async function completeShiftAction(shiftRunId: string): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized session." };
    }

    await prisma.shiftRun.update({
      where: { id: shiftRunId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
      }
    });

    revalidatePath('/dashboard');
    return { success: true, error: null };
  } catch (err) {
    console.error('Error completing shift:', err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to complete shift." };
  }
}
