import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import StartShiftPanel from '@/components/dashboard/StartShiftPanel';
import ProductionBoard from '@/components/dashboard/ProductionBoard';
import DowntimePanel from '@/components/dashboard/DowntimePanel';
import HandoverPanel from '@/components/dashboard/HandoverPanel';
import styles from './dashboard.module.css';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Find active shift run
  const activeShift = await prisma.shiftRun.findFirst({
    where: {
      userId: user.id,
      status: 'ACTIVE',
    },
    include: {
      productionLogs: {
        orderBy: { hourLabel: 'asc' }
      },
      downtimeEvents: {
        include: { machine: true },
        orderBy: { startedAt: 'desc' }
      }
    }
  });

  if (!activeShift) {
    return (
      <div className={styles.container}>
        <div className={styles.dashboardHeader}>
          <div className={styles.titleArea}>
            <h1 className={styles.mainTitle}>Operations Control Panel</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Welcome back, {user.firstName}. Setup your shift to begin.</p>
          </div>
        </div>
        <StartShiftPanel />
      </div>
    );
  }

  // Calculate Metrics
  let totalTarget = 0;
  let totalActual = 0;
  let totalScrap = 0;
  let totalDowntimeMinutes = 0;

  activeShift.productionLogs.forEach(log => {
    totalTarget += log.targetQty;
    totalActual += log.actualQty;
    totalScrap += log.scrapQty;
  });

  activeShift.downtimeEvents.forEach(e => {
    const end = e.endedAt ? new Date(e.endedAt) : new Date();
    const diff = end.getTime() - new Date(e.startedAt).getTime();
    totalDowntimeMinutes += Math.round(diff / 60000);
  });

  const oee = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
  const scrapRate = totalActual > 0 ? ((totalScrap / totalActual) * 100).toFixed(1) : '0.0';

  const machines = await prisma.machine.findMany();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.titleArea}>
          <div className={styles.shiftBadge}>
            <span className={styles.pulseDot} />
            <span>Active Shift: {activeShift.shiftName}</span>
          </div>
          <h1 className={styles.mainTitle}>Apex Operations Board</h1>
        </div>
      </div>

      {/* Metrics Strips */}
      <section className={styles.metricsStrip}>
        <div className={styles.metricCard}>
          <span className={styles.metricValue}>{oee}%</span>
          <span className={styles.metricLabel}>Shift Efficiency (OEE)</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricValue}>{totalActual} / {totalTarget}</span>
          <span className={styles.metricLabel}>Actual vs Target Parts</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricValue}>{scrapRate}%</span>
          <span className={styles.metricLabel}>Scrap Waste Rate</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricValue}>{totalDowntimeMinutes} Mins</span>
          <span className={styles.metricLabel}>Equipment Downtime</span>
        </div>
      </section>

      {/* Workspace Division */}
      <div className={styles.workspaceGrid}>
        <div className={styles.leftColumn}>
          <ProductionBoard logs={activeShift.productionLogs} />
        </div>
        <div className={styles.rightColumn}>
          <DowntimePanel
            shiftRunId={activeShift.id}
            machines={machines}
            events={activeShift.downtimeEvents.map(e => ({
              ...e,
              startedAt: e.startedAt,
              endedAt: e.endedAt
            }))}
          />
          <HandoverPanel shiftRunId={activeShift.id} />
        </div>
      </div>
    </div>
  );
}
