'use client';

import { useState } from 'react';
import { updateProductionLogAction } from '@/app/actions/shift';
import styles from '@/app/dashboard/dashboard.module.css';

interface ProductionLog {
  id: string;
  hourLabel: string;
  targetQty: number;
  actualQty: number;
  scrapQty: number;
  comments: string | null;
}

interface ProductionBoardProps {
  logs: ProductionLog[];
}

export default function ProductionBoard({ logs }: ProductionBoardProps) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localLogs, setLocalLogs] = useState<ProductionLog[]>(logs);

  const handleInputChange = (
    logId: string,
    field: 'actualQty' | 'scrapQty' | 'comments',
    value: string
  ) => {
    setLocalLogs(prev =>
      prev.map(log => {
        if (log.id !== logId) return log;
        if (field === 'comments') {
          return { ...log, [field]: value };
        } else {
          const parsed = parseInt(value, 10);
          return { ...log, [field]: isNaN(parsed) ? 0 : parsed };
        }
      })
    );
  };

  const handleBlur = async (logId: string) => {
    const log = localLogs.find(l => l.id === logId);
    if (!log) return;

    setSavingId(logId);
    try {
      const res = await updateProductionLogAction(logId, {
        actualQty: log.actualQty,
        scrapQty: log.scrapQty,
        comments: log.comments,
      });
      if (!res.success) {
        alert(`Failed to save hourly log: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error saving hourly log:', err);
      alert('Connection error: Failed to save log.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className={styles.boardCard}>
      <div className={styles.boardHeader}>
        <h3 className={styles.boardTitle}>Hourly Production Board</h3>
        <span className={styles.savingText}>
          {savingId ? 'Saving changes...' : 'All data autosaved'}
        </span>
      </div>
      
      <table className={styles.boardTable}>
        <thead>
          <tr className={styles.tableHeader}>
            <th>Hour</th>
            <th style={{ width: 100 }}>Target</th>
            <th style={{ width: 110 }}>Actual</th>
            <th style={{ width: 110 }}>Scrap</th>
            <th>Notes / Operator Remarks</th>
          </tr>
        </thead>
        <tbody>
          {localLogs.map((log) => (
            <tr key={log.id} className={styles.tableRow}>
              <td style={{ fontWeight: '600' }}>{log.hourLabel}</td>
              <td style={{ color: 'var(--text-muted)' }}>{log.targetQty}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={log.actualQty}
                  onChange={(e) => handleInputChange(log.id, 'actualQty', e.target.value)}
                  onBlur={() => handleBlur(log.id)}
                  className={styles.cellInput}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={log.scrapQty}
                  onChange={(e) => handleInputChange(log.id, 'scrapQty', e.target.value)}
                  onBlur={() => handleBlur(log.id)}
                  className={styles.cellInput}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={log.comments || ''}
                  onChange={(e) => handleInputChange(log.id, 'comments', e.target.value)}
                  onBlur={() => handleBlur(log.id)}
                  className={styles.cellInput}
                  placeholder="Enter comments if output is low..."
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
