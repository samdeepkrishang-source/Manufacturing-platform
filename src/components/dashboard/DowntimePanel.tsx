'use client';

import { useState } from 'react';
import { logDowntimeAction, resolveDowntimeAction } from '@/app/actions/shift';
import styles from '@/app/dashboard/dashboard.module.css';

interface Machine {
  id: string;
  name: string;
}

interface DowntimeEvent {
  id: string;
  machine: { name: string };
  reasonCategory: string;
  startedAt: Date;
  endedAt: Date | null;
  notes: string | null;
}

interface DowntimePanelProps {
  shiftRunId: string;
  machines: Machine[];
  events: DowntimeEvent[];
}

export default function DowntimePanel({ shiftRunId, machines, events }: DowntimePanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id || '');
  const [reasonCategory, setReasonCategory] = useState('Mechanical Failure');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const activeEvent = events.find(e => e.endedAt === null);

  const handleLogDowntime = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await logDowntimeAction(shiftRunId, selectedMachineId, reasonCategory, notes || null);
      setModalOpen(false);
      setNotes('');
    } catch (err) {
      console.error('Failed to log downtime:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDowntime = async (eventId: string) => {
    setLoading(true);
    try {
      await resolveDowntimeAction(eventId);
    } catch (err) {
      console.error('Failed to resolve downtime:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDuration = (startedAt: Date, endedAt: Date | null) => {
    const end = endedAt ? new Date(endedAt) : new Date();
    const diff = end.getTime() - new Date(startedAt).getTime();
    const mins = Math.round(diff / 60000);
    return `${mins} min${mins !== 1 ? 's' : ''}`;
  };

  return (
    <div className={styles.downtimeCard}>
      <h3 className={styles.cardTitle}>Downtime Registry</h3>
      
      {activeEvent ? (
        <div className={styles.downtimeAlert}>
          <div className={styles.alertText}>
            🚨 LINE DOWN: {activeEvent.machine.name}
          </div>
          <div className={styles.alertSubtext}>
            Reason: {activeEvent.reasonCategory} <br />
            Started at: {new Date(activeEvent.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            onClick={() => handleResolveDowntime(activeEvent.id)}
            disabled={loading}
            className={styles.resolveBtn}
          >
            Resolve Breakdown
          </button>
        </div>
      ) : (
        <button
          onClick={() => setModalOpen(true)}
          className={styles.logBreakdownBtn}
        >
          + Log Machine Breakdown
        </button>
      )}

      <div className={styles.eventsList}>
        {events.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
            No downtime events logged.
          </p>
        ) : (
          events.map(event => (
            <div key={event.id} className={styles.eventItem}>
              <div className={styles.eventDetails}>
                <span className={styles.eventMachineName}>{event.machine.name}</span>
                <span className={styles.eventReason}>
                  {event.reasonCategory} {event.endedAt === null && ' (Active)'}
                </span>
              </div>
              <span className={styles.eventDuration}>
                {getDuration(event.startedAt, event.endedAt)}
              </span>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Log Machine Breakdown</h3>
              <span onClick={() => setModalOpen(false)} className={styles.closeBtn}>✕</span>
            </div>
            
            <form onSubmit={handleLogDowntime} className={styles.modalForm}>
              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Select Machine</label>
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Breakdown Reason</label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="Mechanical Failure">Mechanical Failure</option>
                  <option value="Material Shortage">Material Shortage</option>
                  <option value="Operator Error">Operator Error</option>
                  <option value="Electrical Fault">Electrical Fault</option>
                </select>
              </div>

              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Operator Comments / Action Taken</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={styles.select}
                  placeholder="Describe failure details..."
                  disabled={loading}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={styles.cancelBtn}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={loading}
                >
                  {loading ? 'Logging...' : 'Log Breakdown'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
