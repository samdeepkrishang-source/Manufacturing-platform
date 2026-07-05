import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoDot} />
          <span>ApexOps</span>
        </div>
        <Link href="/login" className={styles.signInBtn}>
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.badge}>Next-Gen Manufacturing Operations</div>
        <h1 className={styles.title}>
          The modern, friction-free workspace for shift supervisors
        </h1>
        <p className={styles.description}>
          Say goodbye to messy paper checklists and complex Excel sheets. Log hourly production, track machine downtime, and let AI write your shift handover reports instantly.
        </p>
        <Link href="/login" className={styles.ctaBtn}>
          Get Started
          <span>→</span>
        </Link>
      </main>

      {/* Interactive Mockup Preview */}
      <section className={styles.previewSection}>
        <div className={styles.dashboardPreview}>
          <div className={styles.previewHeader}>
            <div className={styles.previewDotGrid}>
              <div className={`${styles.dot} ${styles.dotRed}`} />
              <div className={`${styles.dot} ${styles.dotYellow}`} />
              <div className={`${styles.dot} ${styles.dotGreen}`} />
            </div>
            <div className={styles.previewTitle}>ApexOps - Line 1 Operations Console</div>
            <div style={{ width: 40 }} />
          </div>

          <div className={styles.previewGrid}>
            <div className={styles.previewSidebar}>
              <div className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}>
                📊 Active Workboard
              </div>
              <div className={styles.sidebarItem}>🚨 Downtime Timeline</div>
              <div className={styles.sidebarItem}>🤖 AI Handover Summary</div>
              <div className={styles.sidebarItem}>⚙️ Settings</div>
            </div>

            <div className={styles.previewContent}>
              <div className={styles.previewMetrics}>
                <div className={styles.previewMetricCard}>
                  <span className={styles.metricValue}>87.5%</span>
                  <span className={styles.metricLabel}>Shift OEE</span>
                </div>
                <div className={styles.previewMetricCard}>
                  <span className={styles.metricValue}>720 / 800</span>
                  <span className={styles.metricLabel}>Actual vs Target</span>
                </div>
                <div className={styles.previewMetricCard}>
                  <span className={styles.metricValue}>12 Mins</span>
                  <span className={styles.metricLabel}>Downtime Logs</span>
                </div>
              </div>

              <div className={styles.previewTable}>
                <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                  <div>Hour</div>
                  <div>Target</div>
                  <div>Actual</div>
                  <div>Notes / Comments</div>
                </div>
                <div className={styles.tableRow}>
                  <div>07:00 - 08:00</div>
                  <div>100</div>
                  <div style={{ color: "var(--state-running)", fontWeight: "bold" }}>105</div>
                  <div style={{ color: "var(--text-muted)" }}>Smooth start, line warmed up.</div>
                </div>
                <div className={styles.tableRow}>
                  <div>08:00 - 09:00</div>
                  <div>100</div>
                  <div style={{ color: "var(--state-down)", fontWeight: "bold" }}>45</div>
                  <div style={{ color: "var(--text-muted)" }}>Labeler jam, 12 min downtime logged.</div>
                </div>
                <div className={styles.tableRow} style={{ borderBottom: "none" }}>
                  <div>09:00 - 10:00</div>
                  <div>100</div>
                  <div style={{ color: "var(--state-running)", fontWeight: "bold" }}>102</div>
                  <div style={{ color: "var(--text-muted)" }}>Running at full speed.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className={styles.featuresGrid}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>📝</div>
          <h3 className={styles.featureTitle}>Excel-like Hourly Entry</h3>
          <p className={styles.featureText}>
            Quick inline grid for logging hourly production numbers. Saves automatically in the background with zero lag.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>⚡</div>
          <h3 className={styles.featureTitle}>3-Click Downtime Logger</h3>
          <p className={styles.featureText}>
            Select machine, click reason category, add notes and save. Keep your shift records accurate without typing essays.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🤖</div>
          <h3 className={styles.featureTitle}>AI Shift Handovers</h3>
          <p className={styles.featureText}>
            Generates professional handover reports with summary metrics, events, and action items for the incoming shift in 1-click.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        © {new Date().getFullYear()} ApexOps. Built for modern factory floor teams.
      </footer>
    </div>
  );
}
