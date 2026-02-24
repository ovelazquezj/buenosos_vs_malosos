import { CampaignPhase, CampaignState, Card, GameState } from '../types/game.types';

// ============================================================
// CAMPAIGN PHASE ORDER
// ============================================================

const PHASE_ORDER: CampaignPhase[] = [
  'RECON',
  'ACCESS',
  'PERSISTENCE',
  'LATERAL_MOVEMENT',
  'IMPACT',
];

// ============================================================
// canPlayCard
// Validates whether MalOsos can play a given card based on:
// - campaign phase requirements
// - phase-acceleration limit (max 1 new permanent phase per turn)
// ============================================================

export interface CanPlayResult {
  allowed: boolean;
  reason?: string;
}

export function canPlayCard(
  card: Card,
  campaign: CampaignState,
  gameState: GameState
): CanPlayResult {
  if (!card.requirements || card.requirements.length === 0) {
    return { allowed: true };
  }

  for (const req of card.requirements) {
    // Campaign phase requirements
    if (PHASE_ORDER.includes(req as CampaignPhase)) {
      const phase = req as CampaignPhase;
      const isCompleted = campaign.completedPhases.includes(phase);
      const isBasicRecon = phase === 'RECON' && campaign.reconThisTurn;

      if (!isCompleted && !isBasicRecon) {
        return {
          allowed: false,
          reason: `Campaign phase '${phase}' not completed. Use basic recon action or play a recon card first.`,
        };
      }
    }

    // Backups verified requirement (BuenOsos DRP)
    if (req === 'BACKUPS_VERIFIED') {
      if (!gameState.backupsVerified) {
        return {
          allowed: false,
          reason: 'Backups not verified. Play "Backups verificados" card first.',
        };
      }
    }

    // Previous detection/response requirement
    if (req === 'PREV_DETECTION') {
      const hasPlayedDetection = gameState.log.some(
        (entry) =>
          entry.actor === 'BUENOSOS' &&
          typeof entry.details === 'object' &&
          entry.details !== null &&
          'category' in entry.details &&
          (entry.details as { category: string }).category === 'DETECTION_RESPONSE'
      );
      if (!hasPlayedDetection) {
        return {
          allowed: false,
          reason: 'Must have played a Detection/Response card in a previous turn.',
        };
      }
    }

    // At least 2 services degraded or worse (for M16)
    if (req === '2_SERVICES_DEGRADED_OR_WORSE') {
      const degradedCount = Object.values(gameState.services).filter(
        (s) => s.state === 'DEGRADED' || s.state === 'INTERMITTENT' || s.state === 'DOWN'
      ).length;
      if (degradedCount < 2) {
        return {
          allowed: false,
          reason: 'Requires at least 2 services in DEGRADED or worse state.',
        };
      }
    }
  }

  return { allowed: true };
}

// ============================================================
// completeCampaignPhase
// Marks a phase as permanently completed.
// Enforces: max 1 new permanent phase per turn.
// ============================================================

export function completeCampaignPhase(
  campaign: CampaignState,
  phase: CampaignPhase
): CampaignState {
  // Already completed — no change needed
  if (campaign.completedPhases.includes(phase)) {
    return campaign;
  }

  // Anti-acceleration: max 1 new phase per turn
  if (campaign.phasesCompletedThisTurn >= 1) {
    // Phase effect applies but does not advance the line
    return campaign;
  }

  return {
    ...campaign,
    completedPhases: [...campaign.completedPhases, phase],
    phasesCompletedThisTurn: campaign.phasesCompletedThisTurn + 1,
  };
}

// ============================================================
// rollbackCampaignPhase
// Removes a completed phase from the campaign line.
// Used by BuenOsos "Busqueda y erradicacion" card.
// If no phase specified, rolls back the last completed phase.
// ============================================================

export function rollbackCampaignPhase(
  campaign: CampaignState,
  phase?: CampaignPhase
): CampaignState {
  if (campaign.completedPhases.length === 0) {
    return campaign;
  }

  let phaseToRemove: CampaignPhase;

  if (phase) {
    phaseToRemove = phase;
  } else {
    // Roll back the most recently completed phase
    phaseToRemove = campaign.completedPhases[campaign.completedPhases.length - 1];
  }

  const newCompleted = campaign.completedPhases.filter((p) => p !== phaseToRemove);

  return {
    ...campaign,
    completedPhases: newCompleted,
  };
}

// ============================================================
// useBasicRecon
// Marks basic recon as used for this turn (non-permanent).
// ============================================================

export function useBasicRecon(campaign: CampaignState): CampaignState {
  return {
    ...campaign,
    reconThisTurn: true,
  };
}

// ============================================================
// resetTurnCampaignState
// Resets per-turn flags. Called at start of each new turn.
// ============================================================

export function resetTurnCampaignState(campaign: CampaignState): CampaignState {
  return {
    ...campaign,
    reconThisTurn: false,
    phasesCompletedThisTurn: 0,
  };
}
