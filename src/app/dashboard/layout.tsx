import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { logoutAction } from '../actions/auth';
import styles from './layout.module.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.header}>
          <div className={styles.logo} />
          <span className={styles.title}>ApexOps Console</span>
        </div>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navLink} ${styles.activeLink}`}>
            📊 Live Dashboard
          </Link>
          <Link href="/dashboard/settings" className={styles.navLink}>
            ⚙️ Settings
          </Link>
        </nav>

        <div className={styles.footer}>
          <div className={styles.profileInfo}>
            <span className={styles.userName}>{user.firstName} {user.lastName}</span>
            <span className={styles.companyName}>{user.companyName}</span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className={styles.logoutBtn}>
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
