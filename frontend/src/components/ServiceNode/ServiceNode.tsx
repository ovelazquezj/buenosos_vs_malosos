import { LuNetwork } from 'react-icons/lu';
import type { Service } from '../../types/game.types';
import styles from './ServiceNode.module.css';

interface ServiceNodeProps {
  service: Service;
  selected?: boolean;
  onClick?: () => void;
  targetable?: boolean;
}

const STATE_LABEL: Record<string, string> = {
  OK: 'OK',
  DEGRADED: 'Degradado',
  INTERMITTENT: 'Intermitente',
  DOWN: 'Caido',
};

export function ServiceNode({ service, selected, onClick, targetable }: ServiceNodeProps) {
  const intPct = service.intMax > 0 ? (service.int / service.intMax) * 100 : 0;

  return (
    <button
      className={[
        styles.node,
        styles[`state_${service.state}`],
        selected ? styles.selected : '',
        targetable ? styles.targetable : '',
        onClick ? styles.clickable : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      aria-label={`${service.name} - Estado: ${STATE_LABEL[service.state] ?? service.state}`}
      aria-pressed={selected}
      type="button"
    >
      <div className={styles.header}>
        <LuNetwork className={styles.icon} aria-hidden="true" />
        <span className={styles.id}>{service.id}</span>
        <span className={[styles.stateBadge, styles[`badge_${service.state}`]].join(' ')}>
          {STATE_LABEL[service.state] ?? service.state}
        </span>
      </div>
      <div className={styles.name}>{service.name}</div>
      <div className={styles.intBar}>
        <div
          className={[styles.intFill, styles[`intFill_${service.state}`]].join(' ')}
          style={{ width: `${intPct}%` }}
        />
      </div>
      <div className={styles.meta}>
        <span>INT {service.int}/{service.intMax}</span>
        <span>CRIT {service.crit}</span>
      </div>
      {service.citizenFacing && <span className={styles.citizen}>Ciudadanos</span>}
    </button>
  );
}
