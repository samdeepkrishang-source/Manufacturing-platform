'use client';

import { useActionState } from 'react';
import { updateSettingsAction } from '../../actions/settings';
import styles from './settings.module.css';

interface SettingsFormProps {
  initialUser: {
    firstName: string;
    lastName: string;
    companyName: string;
  };
}

export default function SettingsForm({ initialUser }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, { error: null });

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Supervisor Profile Settings</h2>
      
      <form action={formAction} className={styles.form}>
        {state?.error && (
          <div className={styles.errorBanner} role="alert">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className={styles.successBanner}>
            Profile updated successfully.
          </div>
        )}

        <div className={styles.inputGroup}>
          <label htmlFor="firstName" className={styles.label}>First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            defaultValue={initialUser.firstName}
            className={styles.input}
            disabled={isPending}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="lastName" className={styles.label}>Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            defaultValue={initialUser.lastName}
            className={styles.input}
            disabled={isPending}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="companyName" className={styles.label}>Company / Plant Name</label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            defaultValue={initialUser.companyName}
            className={styles.input}
            disabled={isPending}
          />
        </div>

        <button type="submit" disabled={isPending} className={styles.submitBtn}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
