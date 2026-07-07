'use server';

import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import OpenAI from 'openai';
import { ProductionLog, DowntimeEvent, Machine, User, ShiftRun } from '@prisma/client';
import { ActionResponse } from './shift';

export interface ShiftRunMetrics {
  totalTarget: number;
  totalActual: number;
  totalScrap: number;
  totalDowntimeMinutes: number;
}

export type ShiftRunWithRelations = ShiftRun & {
  user: User;
  productionLogs: ProductionLog[];
  downtimeEvents: (DowntimeEvent & { machine: Machine })[];
};

function generateFallbackSummary(shiftRun: ShiftRunWithRelations, metrics: ShiftRunMetrics): string {
  const oee = ((metrics.totalActual / (metrics.totalTarget || 1)) * 100).toFixed(1);
  const yieldRate = metrics.totalActual > 0 
    ? (((metrics.totalActual - metrics.totalScrap) / metrics.totalActual) * 100).toFixed(1)
    : '100';

  const downtimeSummaries = shiftRun.downtimeEvents.map((e: DowntimeEvent & { machine: Machine }) => {
    const duration = Math.round(((e.endedAt ? new Date(e.endedAt).getTime() : Date.now()) - new Date(e.startedAt).getTime()) / 60000);
    return `*   **${e.machine.name}** was down for **${duration} mins** due to **${e.reasonCategory}**. Status: ${e.endedAt ? 'Resolved' : 'Active / Unresolved'}. Notes: ${e.notes || 'None'}`;
  }).join('\n');

  const hourlyIssues = shiftRun.productionLogs
    .filter((l: ProductionLog) => l.actualQty < l.targetQty)
    .map((l: ProductionLog) => `*   **Hour ${l.hourLabel}**: Produced **${l.actualQty}/${l.targetQty}** parts (Scrap: ${l.scrapQty}). Reason: ${l.comments || 'No explanation provided'}`)
    .join('\n');

  return `# Shift Handover Report: ${shiftRun.shiftName} Shift

*Note: This report was generated using the local algorithmic summary engine (API key not configured).*

## 1. Executive Summary
The **${shiftRun.shiftName}** shift completed on **${new Date(shiftRun.date).toLocaleDateString()}**. 
*   **Total Output:** ${metrics.totalActual} / ${metrics.totalTarget} target parts (${oee}% Target Completion).
*   **Quality Performance:** ${metrics.totalScrap} scrap parts registered (${yieldRate}% clean yield).
*   **Operational Status:** The line experienced ${shiftRun.downtimeEvents.length} machine breakdowns totaling ${metrics.totalDowntimeMinutes} minutes.

## 2. Production Performance Details
The shift started within expectations, but experienced target deficits during specific windows:
${hourlyIssues || 'All hourly slots met or exceeded target numbers.'}

## 3. Downtime & Equipment Logs
${downtimeSummaries || 'Equipment operated continuously with zero logged breakdowns.'}

## 4. Next Shift Action Items
*   [ ] Monitor lines for recurring issues logged during the shift.
*   [ ] Ensure incoming raw materials are staged at the work stations.
*   [ ] ${shiftRun.downtimeEvents.some((e: DowntimeEvent) => !e.endedAt) ? '⚠️ **CRITICAL:** Coordinate with maintenance to resolve the active breakdown.' : 'Confirm all systems are running at standard cycle times.'}
`;
}

export async function generateHandoverAction(shiftRunId: string): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const shiftRun = await prisma.shiftRun.findUnique({
    where: { id: shiftRunId },
    include: {
      user: true,
      productionLogs: true,
      downtimeEvents: {
        include: { machine: true }
      }
    }
  });

  if (!shiftRun) throw new Error("Shift run not found");

  // Typecast shiftRun to ShiftRunWithRelations to safely access populated relations
  const typedShiftRun = shiftRun as unknown as ShiftRunWithRelations;

  // Calculate stats
  let totalTarget = 0;
  let totalActual = 0;
  let totalScrap = 0;
  let totalDowntimeMinutes = 0;

  typedShiftRun.productionLogs.forEach((l: ProductionLog) => {
    totalTarget += l.targetQty;
    totalActual += l.actualQty;
    totalScrap += l.scrapQty;
  });

  typedShiftRun.downtimeEvents.forEach((e: DowntimeEvent & { machine: Machine }) => {
    const end = e.endedAt ? new Date(e.endedAt) : new Date();
    const diffMins = Math.round((end.getTime() - new Date(e.startedAt).getTime()) / 60000);
    totalDowntimeMinutes += diffMins;
  });

  const metrics: ShiftRunMetrics = {
    totalTarget,
    totalActual,
    totalScrap,
    totalDowntimeMinutes
  };

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Generate fallback summary immediately
    const summary = generateFallbackSummary(typedShiftRun, metrics);
    
    // Save to handover database
    await prisma.shiftHandover.upsert({
      where: { shiftRunId },
      update: { aiSummary: summary },
      create: { shiftRunId, aiSummary: summary }
    });

    return summary;
  }

  // OpenAI connection
  try {
    const openai = new OpenAI({ apiKey });
    
    const hourlyLogsText = typedShiftRun.productionLogs.map((l: ProductionLog) => 
      `- ${l.hourLabel}: Produced ${l.actualQty}/${l.targetQty} parts, Scrap: ${l.scrapQty}. Note: ${l.comments || 'None'}`
    ).join('\n');

    const downtimeText = typedShiftRun.downtimeEvents.map((e: DowntimeEvent & { machine: Machine }) => {
      const status = e.endedAt ? 'Resolved' : 'Active / Still down';
      const duration = Math.round(((e.endedAt ? new Date(e.endedAt).getTime() : Date.now()) - new Date(e.startedAt).getTime()) / 60000);
      return `- Machine: ${e.machine.name}, Category: ${e.reasonCategory}, Duration: ${duration} mins, Status: ${status}, Notes: ${e.notes || 'None'}`
    }).join('\n');

    const promptData = `
Shift Details:
- Date: ${new Date(typedShiftRun.date).toLocaleDateString()}
- Shift: ${typedShiftRun.shiftName}
- Supervisor: ${typedShiftRun.user.firstName} ${typedShiftRun.user.lastName}

Metrics:
- Total Target: ${totalTarget}
- Total Actual: ${totalActual}
- Total Scrap: ${totalScrap}
- Net Yield: ${totalActual - totalScrap}
- Accumulated Downtime: ${totalDowntimeMinutes} minutes

Hourly Data:
${hourlyLogsText}

Breakdowns logged:
${downtimeText || 'None'}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert Production Director. Write a professional, concise Shift Handover Report in markdown.
Focus on explaining deviations from targets (e.g. why target was missed) and summarizing downtime events.
Use the following markdown structure:
# Shift Handover Report: [Shift Name] Shift
## 1. Executive Summary
## 2. Production Performance Details
## 3. Downtime & Equipment Logs
## 4. Next Shift Action Items`
        },
        {
          role: 'user',
          content: promptData
        }
      ],
      temperature: 0.3,
    });

    const summary = response.choices[0]?.message?.content || generateFallbackSummary(typedShiftRun, metrics);

    // Save to handover database
    await prisma.shiftHandover.upsert({
      where: { shiftRunId },
      update: { aiSummary: summary },
      create: { shiftRunId, aiSummary: summary }
    });

    return summary;
  } catch (err) {
    console.error('OpenAI generation error:', err);
    // Fallback to local generator
    const summary = generateFallbackSummary(typedShiftRun, metrics);
    await prisma.shiftHandover.upsert({
      where: { shiftRunId },
      update: { aiSummary: summary },
      create: { shiftRunId, aiSummary: summary }
    });
    return summary;
  }
}

export async function saveHandoverNotesAction(shiftRunId: string, notes: string): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized session." };

    await prisma.shiftHandover.update({
      where: { shiftRunId },
      data: {
        supervisorNotes: notes
      }
    });

    return { success: true, error: null };
  } catch (err) {
    console.error('Error saving handover notes:', err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to save supervisor notes." };
  }
}
