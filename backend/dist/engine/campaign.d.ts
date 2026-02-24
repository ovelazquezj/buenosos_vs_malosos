import { CampaignPhase, CampaignState, Card, GameState } from '../types/game.types';
export interface CanPlayResult {
    allowed: boolean;
    reason?: string;
}
export declare function canPlayCard(card: Card, campaign: CampaignState, gameState: GameState): CanPlayResult;
export declare function completeCampaignPhase(campaign: CampaignState, phase: CampaignPhase): CampaignState;
export declare function rollbackCampaignPhase(campaign: CampaignState, phase?: CampaignPhase): CampaignState;
export declare function useBasicRecon(campaign: CampaignState): CampaignState;
export declare function resetTurnCampaignState(campaign: CampaignState): CampaignState;
//# sourceMappingURL=campaign.d.ts.map