import type { GameMarkers, TurnPhase } from '../../types/game.types';
import styles from './Markers.module.css';

interface MarkersProps {
  markers: GameMarkers;
  turnLimit: number;
}

const PHASE_LABELS: Record<TurnPhase, string> = {
  MAINTENANCE: 'Mantenimiento',
  EVENT: 'Evento',
  MALOSOS_PREP: 'Preparacion MalOsos',
  MALOSOS_ATTACK: 'Ataque MalOsos',
  BUENOSOS_RESPONSE: 'Respuesta BuenOsos',
  CASCADE_EVAL: 'Evaluacion en Cascada',
  TURN_END: 'Fin de Turno',
};

function Bar({
  value,
  max,
  colorClass,
  label,
}: {
  value: number;
  max: number;
  colorClass: string;
  label: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={styles.barContainer}>
      <div className={styles.barLabel}>
        <span>{label}</span>
        <span className={styles.barValue}>{value}/{max}</span>
      </div>
      <div className={styles.barTrack}>
        <div
          className={[styles.barFill, colorClass].join(' ')}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        />
      </div>
    </div>
  );
}

function stabilityColor(v: number) {
  if (v > 60) return styles.green;
  if (v >= 30) return styles.yellow;
  return styles.red;
}

function trustColor(v: number) {
  if (v > 25) return styles.blue;
  if (v >= 10) return styles.orange;
  return styles.red;
}

export function Markers({ markers, turnLimit }: MarkersProps) {
  return (
    <div className={styles.markers}>
      <Bar
        value={markers.stability}
        max={100}
        colorClass={stabilityColor(markers.stability)}
        label="Estabilidad"
      />
      <Bar
        value={markers.trust}
        max={50}
        colorClass={trustColor(markers.trust)}
        label="Confianza ciudadana"
      />
      <div className={styles.turnInfo}>
        <span className={styles.turnLabel}>
          Turno <strong>{markers.turn}</strong> / {turnLimit}
        </span>
        <span className={styles.phaseBadge}>
          {PHASE_LABELS[markers.phase] ?? markers.phase}
        </span>
      </div>
    </div>
  );
}
