import { useEffect, useRef } from 'react';
import styles from './LogPanel.module.css';

interface LogEntry {
  type?: string;
  message?: string;
  turn?: number;
  phase?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface LogPanelProps {
  log: unknown[];
}

function formatEntry(entry: unknown, idx: number): string {
  if (typeof entry === 'string') return entry;
  const e = entry as LogEntry;
  const parts: string[] = [];
  if (e.turn !== undefined) parts.push(`T${e.turn}`);
  if (e.phase) parts.push(e.phase as string);
  if (e.type) parts.push(`[${e.type}]`);
  if (e.message) parts.push(e.message);
  if (parts.length === 0) return `Entrada ${idx + 1}`;
  return parts.join(' - ');
}

export function LogPanel({ log }: LogPanelProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [log]);

  return (
    <div className={styles.panel} aria-label="Log de acciones del juego" role="log" aria-live="polite">
      <h3 className={styles.title}>Registro de acciones</h3>
      <div className={styles.entries}>
        {log.length === 0 ? (
          <p className={styles.empty}>Sin eventos registrados</p>
        ) : (
          log.map((entry, idx) => (
            <div key={idx} className={styles.entry}>
              <span className={styles.index}>{idx + 1}</span>
              <span className={styles.text}>{formatEntry(entry, idx)}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
