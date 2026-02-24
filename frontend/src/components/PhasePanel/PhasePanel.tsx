import type { Card, GameState, Seat, TurnPhase } from '../../types/game.types';
import { HandCard } from '../HandCard/HandCard';
import styles from './PhasePanel.module.css';

interface PhasePanelProps {
  gameState: GameState;
  seat: Seat | 'FACILITATOR';
  cards: Card[];
  onPlayCard: (cardId: string) => void;
  onBasicAction: () => void;
  onAdvancePhase: () => void;
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

function canPlayInPhase(phase: TurnPhase, seat: Seat | 'FACILITATOR'): boolean {
  if (seat === 'FACILITATOR') return false;
  if (seat === 'MALOSOS') return phase === 'MALOSOS_PREP' || phase === 'MALOSOS_ATTACK';
  if (seat === 'BUENOSOS') return phase === 'BUENOSOS_RESPONSE';
  return false;
}

export function PhasePanel({
  gameState,
  seat,
  cards,
  onPlayCard,
  onBasicAction,
  onAdvancePhase,
}: PhasePanelProps) {
  const phase = gameState.markers.phase;
  const seatState = seat !== 'FACILITATOR' ? gameState.seats[seat] : null;
  const budget = seatState?.budgetRemaining ?? 0;
  const basicUsed = seatState?.basicActionUsed ?? true;
  const canPlay = canPlayInPhase(phase, seat);

  return (
    <div className={styles.panel}>
      <div className={styles.phaseHeader}>
        <span className={styles.phaseLabel}>{PHASE_LABELS[phase] ?? phase}</span>
        <button
          className={styles.advanceBtn}
          onClick={onAdvancePhase}
          type="button"
        >
          Avanzar fase
        </button>
      </div>

      {seat !== 'FACILITATOR' && (
        <div className={styles.budgetRow}>
          <span className={styles.budgetLabel}>Presupuesto restante</span>
          <span className={styles.budgetValue}>{budget}</span>
        </div>
      )}

      {seat !== 'FACILITATOR' && !basicUsed && (
        <button
          className={styles.basicBtn}
          onClick={onBasicAction}
          disabled={!canPlay}
          type="button"
        >
          Accion basica
        </button>
      )}

      <div className={styles.handSection}>
        <h3 className={styles.handTitle}>Tu mano ({cards.length})</h3>
        {cards.length === 0 ? (
          <p className={styles.emptyHand}>Sin cartas en mano</p>
        ) : (
          <div className={styles.hand}>
            {cards.map(card => (
              <HandCard
                key={card.id}
                card={card}
                canPlay={canPlay && budget >= card.cost}
                onPlay={onPlayCard}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
