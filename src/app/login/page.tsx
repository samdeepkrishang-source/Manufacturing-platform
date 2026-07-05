'use client';

import { useActionState } from 'react';
import { loginAction } from '../actions/auth';
import styles from './page.module.css';
import Link from 'next/link';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, { error: null });

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo} />
          <h1 className={styles.title}>Sign in to ApexOps</h1>
          <p className={styles.subtitle}>Enter your supervisor credentials below</p>
        </div>

        <form action={formAction} className={styles.form}>
          {state?.error && (
            <div className={styles.errorBanner} role="alert">
              {state.error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={styles.input}
              placeholder="david@factory.com"
              disabled={isPending}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className={styles.input}
              placeholder="••••••••"
              disabled={isPending}
            />
          </div>

          <button type="submit" disabled={isPending} className={styles.submitBtn}>
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/" style={{ textDecoration: 'underline' }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
