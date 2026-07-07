'use client';

import { startShiftAction } from '@/app/actions/shift';
import { useState } from 'react';
import styles from '@/app/dashboard/dashboard.module.css';

export default function StartShiftPanel() {
  const [shiftName, setShiftName] = useState('Day');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await startShiftAction(shiftName);
      if (!res.success) {
        setError(res.error || 'Failed to initialize shift');
      }
    } catch (err) {
      console.error('Failed to initialize shift:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.initCard}>
      <h2 className={styles.initTitle}>Initialize Production Shift</h2>
      <p className={styles.initDesc}>
        Select your active shift schedule to load today&apos;s hourly tracker and enable live downtime logging.
      </p>
      
      <form onSubmit={handleSubmit} className={styles.initForm}>
        {error && (
          <div style={{ color: '#ff4d4f', fontSize: '14px', marginBottom: '15px', fontWeight: '500' }}>
            ⚠️ {error}
          </div>
        )}

        <div className={styles.selectGroup}>
          <label htmlFor="shiftSelect" className={styles.selectLabel}>Shift Pattern</label>
          <select
            id="shiftSelect"
            value={shiftName}
            onChange={(e) => setShiftName(e.target.value)}
            className={styles.select}
            disabled={loading}
          >
            <option value="Day">Day Shift (07:00 - 15:00)</option>
            <option value="Swing">Swing Shift (15:00 - 23:00)</option>
            <option value="Night">Night Shift (23:00 - 07:00)</option>
          </select>
        </div>
        
        <button type="submit" disabled={loading} className={styles.startBtn}>
          {loading ? 'Initializing...' : 'Start Shift Run'}
        </button>
      </form>
    </div>
  );
}
