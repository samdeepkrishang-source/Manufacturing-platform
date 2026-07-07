'use client';

import { useState } from 'react';
import { completeShiftAction } from '@/app/actions/shift';
import { useRouter } from 'next/navigation';
import styles from '@/app/dashboard/dashboard.module.css';

interface HandoverPanelProps {
  shiftRunId: string;
}

export default function HandoverPanel({ shiftRunId }: HandoverPanelProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCompleteShift = async () => {
    if (!confirm('Are you sure you want to complete this shift? This will freeze editing for all hourly logs.')) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await completeShiftAction(shiftRunId);
      if (res.success) {
        router.push(`/dashboard/handover/${shiftRunId}`);
      } else {
        alert(`Failed to complete shift: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to complete shift:', err);
      alert('Network error: Failed to complete shift.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.handoverCard}>
      <h3 className={styles.cardTitle}>Conclude Shift</h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
        Ready to hand over? Completing the shift locks all hourly entries, resolves pending timelines, and triggers AI handover compilation.
      </p>
      
      <button
        onClick={handleCompleteShift}
        disabled={loading}
        className={styles.completeShiftBtn}
      >
        {loading ? 'Completing Shift...' : 'Complete Shift & Review Handover'}
      </button>
    </div>
  );
}
