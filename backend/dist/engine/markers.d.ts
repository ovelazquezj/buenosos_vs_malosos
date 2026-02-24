import { GameState, TemporaryEffect } from '../types/game.types';
export interface MarkerUpdate {
    stabilityDelta: number;
    trustDelta: number;
    details: string[];
}
export declare function calculateTurnMarkers(state: GameState): MarkerUpdate;
export declare function applyMarkerUpdate(state: GameState, update: MarkerUpdate): GameState;
export declare function modifyTrust(state: GameState, amount: number): GameState;
export declare function modifyStability(state: GameState, amount: number): GameState;
export declare function getEffectiveDamageReduction(serviceId: string, tempEffects: TemporaryEffect[]): number;
//# sourceMappingURL=markers.d.ts.map