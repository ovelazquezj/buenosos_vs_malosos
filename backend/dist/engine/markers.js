"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTurnMarkers = calculateTurnMarkers;
exports.applyMarkerUpdate = applyMarkerUpdate;
exports.modifyTrust = modifyTrust;
exports.modifyStability = modifyStability;
exports.getEffectiveDamageReduction = getEffectiveDamageReduction;
// ============================================================
// CONSTANTS
// ============================================================
const STABILITY_BASE_PENALTY = {
    DEGRADED: -2,
    INTERMITTENT: -3,
    DOWN: -6,
};
const BASE_PENALTY_CAP = -25; // Max loss from base penalties per turn
const TRUST_PENALTY_CAP = -15; // Max trust loss per turn
const TRUST_ZERO_STABILITY_PENALTY = -5; // Stability lost per turn when trust=0
const TRUST_CITIZEN_DOWN_PENALTY = -3; // Trust lost per citizen-facing service DOWN
const CRITICALITY_BONUS = {
    4: -2,
    5: -4,
};
// ============================================================
// calculateTurnMarkers
// Computes stability and trust deltas at end of turn.
// Order:
// 1. Base penalties (DEGRADED/INTERMITTENT/DOWN) with cap -25
// 2. Criticality multiplier (crit=4: -2 extra, crit=5: -4 extra)
// 3. Trust (citizen DOWN: -3 each, cap -15; trust=0: -5 stability)
// 4. BCP reductions (bcpManualOp, bcpPrioritization temp effects)
// ============================================================
function calculateTurnMarkers(state) {
    const details = [];
    let stabilityDelta = 0;
    let trustDelta = 0;
    // ---- STEP 1: Base penalties with cap ----
    let basePenalty = 0;
    for (const svc of Object.values(state.services)) {
        if (svc.state === 'OK')
            continue;
        // Check if this service is treated as DEGRADED due to bcpManualOp
        const manualOp = state.temporaryEffects.find((e) => e.type === 'bcpManualOp' && e.targetId === svc.id);
        const effectiveState = manualOp && svc.state === 'DOWN' ? 'DEGRADED' : svc.state;
        const penalty = STABILITY_BASE_PENALTY[effectiveState] ?? 0;
        basePenalty += penalty;
        details.push(`${svc.id} (${effectiveState}): ${penalty} stability`);
    }
    // Apply tope (cap)
    if (basePenalty < BASE_PENALTY_CAP) {
        details.push(`Base penalty capped at ${BASE_PENALTY_CAP} (was ${basePenalty})`);
        basePenalty = BASE_PENALTY_CAP;
    }
    stabilityDelta += basePenalty;
    // ---- STEP 2: Criticality multiplier ----
    for (const svc of Object.values(state.services)) {
        if (svc.state === 'OK')
            continue;
        const critPenalty = CRITICALITY_BONUS[svc.crit] ?? 0;
        if (critPenalty !== 0) {
            stabilityDelta += critPenalty;
            details.push(`${svc.id} crit=${svc.crit}: ${critPenalty} stability`);
        }
    }
    // ---- STEP 3: Trust penalties ----
    let trustPenalty = 0;
    const citizenServices = Object.values(state.services).filter((s) => s.citizenFacing === true);
    for (const svc of citizenServices) {
        if (svc.state === 'DOWN') {
            trustPenalty += TRUST_CITIZEN_DOWN_PENALTY;
            details.push(`${svc.id} (citizen, DOWN): ${TRUST_CITIZEN_DOWN_PENALTY} trust`);
        }
    }
    // Cap trust penalty
    if (trustPenalty < TRUST_PENALTY_CAP) {
        details.push(`Trust penalty capped at ${TRUST_PENALTY_CAP} (was ${trustPenalty})`);
        trustPenalty = TRUST_PENALTY_CAP;
    }
    trustDelta += trustPenalty;
    // If trust would reach 0 this turn or is already 0, apply stability penalty
    const newTrust = Math.max(0, state.markers.trust + trustDelta);
    if (newTrust === 0) {
        // Check for ignoreTrustPenalty temp effect (from Comunicacion de crisis)
        const trustIgnored = state.temporaryEffects.some((e) => e.type === 'ignoreTrustPenalty');
        if (!trustIgnored) {
            stabilityDelta += TRUST_ZERO_STABILITY_PENALTY;
            details.push(`Trust=0: ${TRUST_ZERO_STABILITY_PENALTY} stability (panic effect)`);
        }
        else {
            details.push('Trust=0 stability penalty ignored by Comunicacion de crisis');
        }
    }
    // ---- STEP 4: BCP reductions ----
    // bcpPrioritization: two targeted services have their stability penalties halved
    const prioritization = state.temporaryEffects.filter((e) => e.type === 'bcpPrioritization');
    if (prioritization.length > 0) {
        for (const eff of prioritization) {
            const targets = eff.targets ?? [];
            for (const targetId of targets) {
                const svc = state.services[targetId];
                if (!svc || svc.state === 'OK')
                    continue;
                const effectiveState = (() => {
                    const manualOp = state.temporaryEffects.find((e) => e.type === 'bcpManualOp' && e.targetId === svc.id);
                    return manualOp && svc.state === 'DOWN' ? 'DEGRADED' : svc.state;
                })();
                const basePen = STABILITY_BASE_PENALTY[effectiveState] ?? 0;
                const critPen = CRITICALITY_BONUS[svc.crit] ?? 0;
                const totalPen = basePen + critPen;
                // Reduce by half (rounding down toward 0)
                const reduction = Math.floor(Math.abs(totalPen) / 2);
                stabilityDelta += reduction; // Adds back half of the negative penalty
                details.push(`BCP Priorizacion on ${targetId}: +${reduction} stability (half reduction)`);
            }
        }
    }
    return { stabilityDelta, trustDelta, details };
}
// ============================================================
// applyMarkerUpdate
// Applies the computed deltas to the game state, clamping values.
// ============================================================
function applyMarkerUpdate(state, update) {
    const newStability = Math.max(0, Math.min(100, state.markers.stability + update.stabilityDelta));
    const newTrust = Math.max(0, Math.min(50, state.markers.trust + update.trustDelta));
    return {
        ...state,
        markers: {
            ...state.markers,
            stability: newStability,
            trust: newTrust,
        },
    };
}
// ============================================================
// modifyTrust
// Applies a direct trust modification (e.g. from cards).
// ============================================================
function modifyTrust(state, amount) {
    const newTrust = Math.max(0, Math.min(50, state.markers.trust + amount));
    return {
        ...state,
        markers: {
            ...state.markers,
            trust: newTrust,
        },
    };
}
// ============================================================
// modifyStability
// Applies a direct stability modification (e.g. from cards).
// ============================================================
function modifyStability(state, amount) {
    const newStability = Math.max(0, Math.min(100, state.markers.stability + amount));
    return {
        ...state,
        markers: {
            ...state.markers,
            stability: newStability,
        },
    };
}
// ============================================================
// getEffectiveDamageReduction
// Returns total damage reduction for a service from temp effects
// ============================================================
function getEffectiveDamageReduction(serviceId, tempEffects) {
    let reduction = 0;
    for (const eff of tempEffects) {
        if (eff.type === 'damageReductionService' && eff.targetId === serviceId) {
            reduction += eff.value ?? 0;
        }
        if (eff.type === 'socMonitoring' && eff.targetId === serviceId) {
            reduction += eff.damageReduction ?? 0;
        }
        if (eff.type === 'basicMonitoring' && eff.targetId === serviceId) {
            reduction += 1; // Basic monitoring reduces first damage by 1
        }
    }
    return reduction;
}
//# sourceMappingURL=markers.js.map