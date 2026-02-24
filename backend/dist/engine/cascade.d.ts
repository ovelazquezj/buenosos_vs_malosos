import { Service, TemporaryEffect } from '../types/game.types';
export declare function resolveCascades(services: Record<string, Service>, tempEffects: TemporaryEffect[], _turn: number): Record<string, Service>;
export declare function resolveIntermittence(services: Record<string, Service>, turn: number, tempEffects: TemporaryEffect[]): Record<string, Service>;
//# sourceMappingURL=cascade.d.ts.map