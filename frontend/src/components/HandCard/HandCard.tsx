import type { KeyboardEvent } from 'react';
import { FaShieldAlt, FaSkullCrossbones } from 'react-icons/fa';
import {
  LuAnchor,
  LuKeyRound,
  LuRadar,
  LuRefreshCw,
  LuSearch,
  LuShieldCheck,
  LuShuffle,
  LuTriangleAlert,
  LuWorkflow,
  LuZap,
} from 'react-icons/lu';
import type { Card, CardCategory } from '../../types/game.types';
import styles from './HandCard.module.css';

interface HandCardProps {
  card: Card;
  canPlay: boolean;
  onPlay: (cardId: string) => void;
}

function CategoryIcon({ side, category }: { side: Card['side']; category: CardCategory }) {
  if (side === 'EVENT') return <LuTriangleAlert aria-hidden="true" />;
  if (side === 'BUENOSOS') {
    switch (category) {
      case 'PREVENTION': return <LuShieldCheck aria-hidden="true" />;
      case 'DETECTION_RESPONSE': return <LuRadar aria-hidden="true" />;
      case 'DRP': return <LuRefreshCw aria-hidden="true" />;
      case 'BCP': return <LuWorkflow aria-hidden="true" />;
      default: return <FaShieldAlt aria-hidden="true" />;
    }
  }
  // MALOSOS side
  switch (category) {
    case 'RECON': return <LuSearch aria-hidden="true" />;
    case 'ACCESS': return <LuKeyRound aria-hidden="true" />;
    case 'PERSISTENCE': return <LuAnchor aria-hidden="true" />;
    case 'LATERAL_MOVEMENT': return <LuShuffle aria-hidden="true" />;
    case 'IMPACT':
    case 'IMPACT_ALTO': return <LuZap aria-hidden="true" />;
    case 'RESOURCE':
    case 'SOCIAL': return <LuZap aria-hidden="true" />;
    default: return <FaSkullCrossbones aria-hidden="true" />;
  }
}

const CATEGORY_LABEL: Record<CardCategory, string> = {
  RECON: 'Reconocimiento',
  ACCESS: 'Acceso',
  PERSISTENCE: 'Persistencia',
  LATERAL_MOVEMENT: 'Movimiento Lateral',
  IMPACT: 'Impacto',
  IMPACT_ALTO: 'Impacto Alto',
  RESOURCE: 'Recurso',
  SOCIAL: 'Social',
  PREVENTION: 'Prevencion',
  DETECTION_RESPONSE: 'Deteccion/Respuesta',
  DRP: 'DRP',
  BCP: 'BCP',
  TAIL_RISK: 'Riesgo Cola',
};

export function HandCard({ card, canPlay, onPlay }: HandCardProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && canPlay) {
      e.preventDefault();
      onPlay(card.id);
    }
  };

  const sideClass = card.side === 'BUENOSOS'
    ? styles.sideBuenos
    : card.side === 'MALOSOS'
      ? styles.sideMalos
      : styles.sideEvento;

  return (
    <div
      className={[styles.card, sideClass, !canPlay ? styles.disabled : ''].filter(Boolean).join(' ')}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="article"
      aria-label={`Carta: ${card.name}, costo ${card.cost}, ${CATEGORY_LABEL[card.category]}`}
    >
      <div className={styles.cardHeader}>
        <span className={styles.iconWrap}>
          <CategoryIcon side={card.side} category={card.category} />
        </span>
        <span className={styles.cost}>{card.cost}</span>
        {card.isHighImpact && <span className={styles.highImpact}>ALTO</span>}
      </div>
      <div className={styles.cardName}>{card.name}</div>
      <div className={styles.cardCategory}>{CATEGORY_LABEL[card.category]}</div>
      <button
        className={styles.playBtn}
        disabled={!canPlay}
        onClick={() => onPlay(card.id)}
        type="button"
        aria-label={`Jugar ${card.name}`}
      >
        Jugar
      </button>
    </div>
  );
}
