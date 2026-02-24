import { useWebSocket } from './useWebSocket';
import type { GameState, Seat } from '../types/game.types';

export interface UseGameResult {
  gameState: GameState | null;
  connected: boolean;
  error: string | null;
  playCard: (cardId: string, targets?: string[]) => void;
  useBasicAction: (target?: string) => void;
  advancePhase: () => void;
}

export function useGame(
  gameId: string | null,
  token: string | null,
  seat: Seat | 'FACILITATOR'
): UseGameResult {
  const { gameState, sendMessage, connected, error } = useWebSocket(gameId, token);

  const playCard = (cardId: string, targets?: string[]) => {
    sendMessage({ type: 'PLAY_CARD', side: seat, cardId, targets: targets ?? [] });
  };

  const useBasicAction = (target?: string) => {
    sendMessage({ type: 'USE_BASIC_ACTION', side: seat, target: target ?? null });
  };

  const advancePhase = () => {
    sendMessage({ type: 'ADVANCE_PHASE' });
  };

  return { gameState, connected, error, playCard, useBasicAction, advancePhase };
}
