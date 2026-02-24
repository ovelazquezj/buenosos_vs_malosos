import { useWebSocket } from './useWebSocket';
import type { GameState } from '../types/game.types';

export interface UseGameResult {
  gameState: GameState | null;
  connected: boolean;
  error: string | null;
  playCard: (cardId: string, targets?: string[]) => void;
  useBasicAction: (target?: string) => void;
  advancePhase: () => void;
}

export function useGame(gameId: string | null, token: string | null): UseGameResult {
  const { gameState, sendMessage, connected, error } = useWebSocket(gameId, token);

  const playCard = (cardId: string, targets?: string[]) => {
    sendMessage({
      type: 'PLAY_CARD',
      payload: { cardId, targets: targets ?? [] },
    });
  };

  const useBasicAction = (target?: string) => {
    sendMessage({
      type: 'USE_BASIC_ACTION',
      payload: { target },
    });
  };

  const advancePhase = () => {
    sendMessage({ type: 'ADVANCE_PHASE', payload: {} });
  };

  return { gameState, connected, error, playCard, useBasicAction, advancePhase };
}
