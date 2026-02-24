import {
  LuAnchor,
  LuKeyRound,
  LuSearch,
  LuShuffle,
  LuZap,
} from 'react-icons/lu';
import type { CampaignPhase } from '../../types/game.types';
import styles from './CampaignTrack.module.css';

interface CampaignTrackProps {
  completedPhases: CampaignPhase[];
}

const PHASES: { id: CampaignPhase; label: string; Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }> }[] = [
  { id: 'RECON', label: 'Reconocimiento', Icon: LuSearch },
  { id: 'ACCESS', label: 'Acceso', Icon: LuKeyRound },
  { id: 'PERSISTENCE', label: 'Persistencia', Icon: LuAnchor },
  { id: 'LATERAL_MOVEMENT', label: 'Movimiento Lateral', Icon: LuShuffle },
  { id: 'IMPACT', label: 'Impacto', Icon: LuZap },
];

export function CampaignTrack({ completedPhases }: CampaignTrackProps) {
  return (
    <div className={styles.track} aria-label="Progreso de campana MalOsos">
      <span className={styles.trackLabel}>Campana MalOsos</span>
      <div className={styles.phases}>
        {PHASES.map((phase, idx) => {
          const completed = completedPhases.includes(phase.id);
          return (
            <div
              key={phase.id}
              className={[styles.phase, completed ? styles.completed : styles.pending].join(' ')}
              title={phase.label}
              aria-label={`${phase.label}: ${completed ? 'completada' : 'pendiente'}`}
            >
              <phase.Icon className={styles.phaseIcon} aria-hidden="true" />
              <span className={styles.phaseNum}>{idx + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
