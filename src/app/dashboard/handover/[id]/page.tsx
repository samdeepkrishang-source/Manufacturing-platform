'use client';

import { useEffect, useState, use } from 'react';
import { generateHandoverAction, saveHandoverNotesAction } from '@/app/actions/handover';
import { useRouter } from 'next/navigation';
import styles from '../handover.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function HandoverReportPage({ params }: PageProps) {
  const router = useRouter();
  const { id: shiftRunId } = use(params);

  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState('Aggregating shift metrics...');
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const steps = [
      'Scanning hour-by-hour output ledger...',
      'Mapping machine downtime events...',
      'Invoking AI Handover Compilation Engine...',
      'Formatting handover report card...'
    ];
    let stepIndex = 0;
    
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setLoadingStep(steps[stepIndex]);
        stepIndex++;
      }
    }, 1500);

    const fetchSummary = async () => {
      try {
        const result = await generateHandoverAction(shiftRunId);
        setSummary(result);
      } catch (err) {
        console.error('Error compiling handover report:', err);
        setSummary('### Error\nFailed to generate handover summary. Please verify your shift records.');
      } finally {
        clearInterval(interval);
        setLoading(false);
      }
    };

    fetchSummary();

    return () => clearInterval(interval);
  }, [shiftRunId]);

  const handleSignOff = async () => {
    setSigning(true);
    try {
      await saveHandoverNotesAction(shiftRunId, notes);
      router.push('/dashboard');
    } catch (err) {
      console.error('Sign-off error:', err);
    } finally {
      setSigning(false);
    }
  };

  // Safe line-by-line Markdown to React renderer
  const renderSummary = (md: string) => {
    const lines = md.split('\n');
    let inList = false;
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    const renderText = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        if (inList) {
          elements.push(<ul key={`list-${index}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(<h1 key={index}>{renderText(trimmed.slice(2))}</h1>);
      } else if (trimmed.startsWith('## ')) {
        if (inList) {
          elements.push(<ul key={`list-${index}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(<h2 key={index}>{renderText(trimmed.slice(3))}</h2>);
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        inList = true;
        listItems.push(<li key={index}>{renderText(trimmed.slice(2))}</li>);
      } else if (trimmed === '') {
        if (inList) {
          elements.push(<ul key={`list-${index}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
      } else {
        if (inList) {
          elements.push(<ul key={`list-${index}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(<p key={index}>{renderText(trimmed)}</p>);
      }
    });

    if (inList) {
      elements.push(<ul key="list-end">{listItems}</ul>);
    }

    return elements;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Shift Handover Console</h2>
          <span className={styles.badge}>Shift Concluded</span>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingLine} style={{ width: '40%' }} />
            <div className={styles.loadingLine} style={{ width: '85%' }} />
            <div className={styles.loadingLine} style={{ width: '60%' }} />
            <div className={styles.loadingLine} style={{ width: '75%' }} />
            <p className={styles.loadingText}>🤖 {loadingStep}</p>
          </div>
        ) : (
          <>
            <div className={styles.reportArea}>
              {renderSummary(summary)}
            </div>

            <div className={styles.notesArea}>
              <label htmlFor="supervisorNotes" className={styles.notesLabel}>
                Add Handover Notes / Instructions for Next Shift
              </label>
              <textarea
                id="supervisorNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.textarea}
                placeholder="E.g., Packer-03 has a slightly loose belt. Keep an eye on it. Raw packaging materials have been fully restocked."
                disabled={signing}
              />
            </div>

            <button
              onClick={handleSignOff}
              disabled={signing}
              className={styles.signOffBtn}
            >
              {signing ? 'Signing off...' : 'Digital Sign-off & Lock Report'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
