import { GameState, GameConfig, TurnPhase, Seat, LogEntry, ErrorCode } from '../types/game.types';
export declare class GameError extends Error {
    code: ErrorCode;
    constructor(code: ErrorCode, message: string);
}
export declare function initializeGame(config: GameConfig, gameId?: string): GameState;
export declare function startGame(state: GameState): GameState;
export declare function processPhase(state: GameState): GameState;
export interface PlayCardResult {
    newState: GameState;
    logEntry: LogEntry;
}
export declare function playCard(state: GameState, seat: Seat, cardId: string, targets: string[]): PlayCardResult;
export declare function useBasicAction(state: GameState, seat: Seat, target?: string): GameState;
export declare function advancePhase(state: GameState, requestedPhase?: TurnPhase): GameState;
//# sourceMappingURL=gameEngine.d.ts.map