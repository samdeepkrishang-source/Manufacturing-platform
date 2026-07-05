'use client';

import { startShiftAction } from '@/app/actions/shift';
import { useState } from 'react';
import styles from '@/app/dashboard/dashboard.module.css';

export default function StartShiftPanel() {
  const [shiftName, setShiftName] = useState('Day');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await startShiftAction(shiftName);
    } catch (err) {
      console.error('Failed to initialize shift:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.initCard}>
      <h2 className={styles.initTitle}>Initialize Production Shift</h2>
      <p className={styles.initDesc}>
        Select your active shift schedule to load today's hourly tracker and enable live downtime logging.
      </p>
      
      <form onSubmit={handleSubmit} className={styles.initForm}>
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
