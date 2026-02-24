"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameError = void 0;
exports.initializeGame = initializeGame;
exports.startGame = startGame;
exports.processPhase = processPhase;
exports.playCard = playCard;
exports.useBasicAction = useBasicAction;
exports.advancePhase = advancePhase;
const uuid_1 = require("uuid");
const cards_1 = require("../data/cards");
const services_1 = require("../data/services");
const campaign_1 = require("./campaign");
const cascade_1 = require("./cascade");
const markers_1 = require("./markers");
const victory_1 = require("./victory");
// ============================================================
// GAME ENGINE ERROR
// ============================================================
class GameError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'GameError';
    }
}
exports.GameError = GameError;
// ============================================================
// HELPERS
// ============================================================
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function makeLogEntry(turn, phase, action, actor, details, before, after) {
    return {
        id: (0, uuid_1.v4)(),
        turn,
        phase,
        timestamp: Date.now(),
        action,
        actor,
        details,
        before,
        after,
    };
}
function drawCards(deck, discard, hand, targetHandSize) {
    let d = [...deck];
    let disc = [...discard];
    let h = [...hand];
    while (h.length < targetHandSize) {
        if (d.length === 0) {
            if (disc.length === 0)
                break; // No more cards
            d = shuffle(disc);
            disc = [];
        }
        const card = d.shift();
        h.push(card);
    }
    return { deck: d, discard: disc, hand: h };
}
function clampHand(hand, discard, maxHandSize) {
    if (hand.length <= maxHandSize)
        return { hand, discard };
    // Discard cards with highest cost (deterministic mode)
    // For simplicity, just trim from the end (they were already sorted by draw order)
    const excess = hand.slice(maxHandSize);
    return {
        hand: hand.slice(0, maxHandSize),
        discard: [...discard, ...excess],
    };
}
function expireTemporaryEffects(effects, currentPhase, currentTurn) {
    return effects.filter((e) => {
        if (e.expiresAtPhase && e.expiresAtPhase === currentPhase)
            return false;
        if (e.expiresAtTurn !== undefined && e.expiresAtTurn <= currentTurn)
            return false;
        return true;
    });
}
function applyDamageToService(services, targetId, amount, tempEffects, ignoreDamageReduction = false) {
    const svc = services[targetId];
    if (!svc || svc.state === 'DOWN')
        return services;
    let damage = amount;
    if (!ignoreDamageReduction) {
        const reduction = (0, markers_1.getEffectiveDamageReduction)(targetId, tempEffects);
        damage = Math.max(0, damage - reduction);
        // Mark basic monitoring as consumed (one-time)
        // (handled by expiring the effect after first use)
    }
    const newInt = Math.max(0, svc.int - damage);
    let newState = svc.state;
    if (newInt === 0) {
        newState = 'DOWN';
    }
    return { ...services, [targetId]: { ...svc, int: newInt, state: newState } };
}
function setServiceState(services, targetId, state) {
    const svc = services[targetId];
    if (!svc)
        return services;
    return { ...services, [targetId]: { ...svc, state } };
}
function healService(services, targetId, amount, capToIntMax) {
    const svc = services[targetId];
    if (!svc)
        return services;
    let newInt = svc.int + amount;
    if (capToIntMax) {
        newInt = Math.min(svc.intMax, newInt);
    }
    let newState = svc.state;
    if (newInt > 0 && newState === 'DOWN') {
        newState = 'DEGRADED'; // Healing a DOWN service brings it to DEGRADED
    }
    return { ...services, [targetId]: { ...svc, int: newInt, state: newState } };
}
// ============================================================
// INITIALIZE GAME
// ============================================================
function initializeGame(config, gameId) {
    const id = gameId ?? (0, uuid_1.v4)();
    const now = Date.now();
    const services = (0, services_1.createInitialServices)();
    const malososDeckIds = cards_1.MALOSOS_DECK.map((c) => c.id);
    const buenososDeckIds = cards_1.BUENOSOS_DECK.map((c) => c.id);
    const eventDeckIds = cards_1.EVENT_DECK.map((c) => c.id);
    return {
        id,
        status: 'lobby',
        config,
        services,
        seats: {
            MALOSOS: {
                budgetRemaining: config.budgetPerTurn,
                hand: [],
                deck: malososDeckIds,
                discard: [],
                basicActionUsed: false,
            },
            BUENOSOS: {
                budgetRemaining: config.budgetPerTurn,
                hand: [],
                deck: buenososDeckIds,
                discard: [],
                basicActionUsed: false,
            },
        },
        eventDeck: eventDeckIds,
        eventDiscard: [],
        markers: {
            stability: 100,
            trust: 50,
            turn: 1,
            phase: 'MAINTENANCE',
        },
        campaign: {
            completedPhases: [],
            reconThisTurn: false,
            phasesCompletedThisTurn: 0,
        },
        temporaryEffects: [],
        backupsVerified: false,
        servicesRecovered: [],
        servicesThatWentDown: [],
        log: [],
        createdAt: now,
        updatedAt: now,
    };
}
// ============================================================
// START GAME
// ============================================================
function startGame(state) {
    if (state.status !== 'lobby') {
        throw new GameError('GAME_NOT_RUNNING', 'Game is not in lobby state.');
    }
    let s = { ...state };
    // Shuffle decks
    const malDeck = shuffle(cards_1.MALOSOS_DECK.map((c) => c.id));
    const buenDeck = shuffle(cards_1.BUENOSOS_DECK.map((c) => c.id));
    const evtDeck = shuffle(cards_1.EVENT_DECK.map((c) => c.id));
    s.seats = {
        MALOSOS: { ...s.seats.MALOSOS, deck: malDeck, hand: [], discard: [], budgetRemaining: s.config.budgetPerTurn },
        BUENOSOS: { ...s.seats.BUENOSOS, deck: buenDeck, hand: [], discard: [], budgetRemaining: s.config.budgetPerTurn },
    };
    s.eventDeck = evtDeck;
    s.eventDiscard = [];
    // Deal 5 cards to each team
    const malResult = drawCards(s.seats.MALOSOS.deck, s.seats.MALOSOS.discard, [], 5);
    s.seats = {
        ...s.seats,
        MALOSOS: { ...s.seats.MALOSOS, deck: malResult.deck, discard: malResult.discard, hand: malResult.hand },
    };
    const buenResult = drawCards(s.seats.BUENOSOS.deck, s.seats.BUENOSOS.discard, [], 5);
    s.seats = {
        ...s.seats,
        BUENOSOS: { ...s.seats.BUENOSOS, deck: buenResult.deck, discard: buenResult.discard, hand: buenResult.hand },
    };
    s.status = 'running';
    s.markers = { ...s.markers, phase: 'MAINTENANCE', turn: 1 };
    s.updatedAt = Date.now();
    const logEntry = makeLogEntry(s.markers.turn, 'MAINTENANCE', 'GAME_STARTED', undefined, { config: s.config });
    s.log = [...s.log, logEntry];
    return s;
}
// ============================================================
// PROCESS PHASE (automatic phases)
// ============================================================
function processPhase(state) {
    if (state.status !== 'running') {
        throw new GameError('GAME_NOT_RUNNING', 'Game is not running.');
    }
    switch (state.markers.phase) {
        case 'MAINTENANCE':
            return processMaintenance(state);
        case 'EVENT':
            return processEvent(state);
        case 'CASCADE_EVAL':
            return processCascadeEval(state);
        case 'TURN_END':
            return processTurnEnd(state);
        default:
            return state;
    }
}
// ---- MAINTENANCE (Phase 0) ----
function processMaintenance(state) {
    let s = { ...state };
    const beforeServices = JSON.parse(JSON.stringify(s.services));
    // 0.0 Degraded services lose -1 INT
    const updated = {};
    for (const [id, svc] of Object.entries(s.services)) {
        if (svc.state === 'DEGRADED') {
            const newInt = Math.max(0, svc.int - 1);
            const newState = newInt === 0 ? 'DOWN' : 'DEGRADED';
            updated[id] = { ...svc, int: newInt, state: newState };
            // Track services going DOWN
            if (newState === 'DOWN' && !s.servicesThatWentDown.includes(id)) {
                s.servicesThatWentDown = [...s.servicesThatWentDown, id];
            }
        }
        else {
            updated[id] = svc;
        }
    }
    s.services = updated;
    // 0.1 Reset budgets
    s.seats = {
        MALOSOS: { ...s.seats.MALOSOS, budgetRemaining: s.config.budgetPerTurn, basicActionUsed: false },
        BUENOSOS: { ...s.seats.BUENOSOS, budgetRemaining: s.config.budgetPerTurn, basicActionUsed: false },
    };
    // 0.2 Draw to hand target (5 cards)
    const malResult = drawCards(s.seats.MALOSOS.deck, s.seats.MALOSOS.discard, s.seats.MALOSOS.hand, 5);
    s.seats = { ...s.seats, MALOSOS: { ...s.seats.MALOSOS, ...malResult } };
    const buenResult = drawCards(s.seats.BUENOSOS.deck, s.seats.BUENOSOS.discard, s.seats.BUENOSOS.hand, 5);
    s.seats = { ...s.seats, BUENOSOS: { ...s.seats.BUENOSOS, ...buenResult } };
    // 0.3 Hand limit (7)
    const malClamped = clampHand(s.seats.MALOSOS.hand, s.seats.MALOSOS.discard, 7);
    s.seats = { ...s.seats, MALOSOS: { ...s.seats.MALOSOS, hand: malClamped.hand, discard: malClamped.discard } };
    const buenClamped = clampHand(s.seats.BUENOSOS.hand, s.seats.BUENOSOS.discard, 7);
    s.seats = { ...s.seats, BUENOSOS: { ...s.seats.BUENOSOS, hand: buenClamped.hand, discard: buenClamped.discard } };
    // Reset turn campaign state
    s.campaign = (0, campaign_1.resetTurnCampaignState)(s.campaign);
    // Expire turn-based effects
    s.temporaryEffects = expireTemporaryEffects(s.temporaryEffects, 'MAINTENANCE', s.markers.turn);
    s.markers = { ...s.markers, phase: 'EVENT' };
    s.updatedAt = Date.now();
    const logEntry = makeLogEntry(s.markers.turn, 'MAINTENANCE', 'MAINTENANCE_DONE', undefined, { beforeServices, afterServices: s.services });
    s.log = [...s.log, logEntry];
    return s;
}
// ---- EVENT PHASE ----
function processEvent(state) {
    let s = { ...state };
    if (s.eventDeck.length === 0) {
        if (s.eventDiscard.length > 0) {
            s.eventDeck = shuffle(s.eventDiscard);
            s.eventDiscard = [];
        }
        else {
            // No events available, skip
            s.markers = { ...s.markers, phase: 'MALOSOS_PREP' };
            return s;
        }
    }
    const eventId = s.eventDeck[0];
    s.eventDeck = s.eventDeck.slice(1);
    const eventCard = (0, cards_1.getCard)(eventId);
    if (!eventCard) {
        s.markers = { ...s.markers, phase: 'MALOSOS_PREP' };
        return s;
    }
    // Apply event effects
    s = applyCardEffects(s, eventCard.effects, undefined, []);
    s.eventDiscard = [...s.eventDiscard, eventId];
    s.markers = { ...s.markers, phase: 'MALOSOS_PREP' };
    s.updatedAt = Date.now();
    const logEntry = makeLogEntry(s.markers.turn, 'EVENT', 'EVENT_DRAWN', undefined, { cardId: eventId, cardName: eventCard.name });
    s.log = [...s.log, logEntry];
    return s;
}
// ---- CASCADE EVAL (Phase 5) ----
function processCascadeEval(state) {
    let s = { ...state };
    const beforeServices = JSON.parse(JSON.stringify(s.services));
    const beforeMarkers = { ...s.markers };
    // Apply cascades
    let cascadedServices = (0, cascade_1.resolveCascades)(s.services, s.temporaryEffects, s.markers.turn);
    // Apply intermittence propagation
    cascadedServices = (0, cascade_1.resolveIntermittence)(cascadedServices, s.markers.turn, s.temporaryEffects);
    // Track services that newly went DOWN
    for (const [id, svc] of Object.entries(cascadedServices)) {
        if (svc.state === 'DOWN' && !s.servicesThatWentDown.includes(id)) {
            s.servicesThatWentDown = [...s.servicesThatWentDown, id];
        }
    }
    s.services = cascadedServices;
    // Calculate and apply markers
    const markerUpdate = (0, markers_1.calculateTurnMarkers)(s);
    s = (0, markers_1.applyMarkerUpdate)(s, markerUpdate);
    // Check for downEffect triggers
    for (const [id, svc] of Object.entries(s.services)) {
        const prevSvc = beforeServices[id];
        if (svc.state === 'DOWN' && prevSvc.state !== 'DOWN') {
            s = applyDownEffect(s, id);
        }
    }
    s.markers = { ...s.markers, phase: 'TURN_END' };
    s.updatedAt = Date.now();
    // Check victory
    const winner = (0, victory_1.checkVictory)(s);
    if (winner) {
        s.winner = winner;
        s.status = 'finished';
    }
    const logEntry = makeLogEntry(s.markers.turn, 'CASCADE_EVAL', 'CASCADE_EVALUATED', undefined, {
        markerUpdate,
        beforeServices,
        afterServices: s.services,
        beforeMarkers,
        afterMarkers: s.markers,
    });
    s.log = [...s.log, logEntry];
    return s;
}
// ---- TURN END ----
function processTurnEnd(state) {
    let s = { ...state };
    // Check victory one more time
    const winner = (0, victory_1.checkVictory)(s);
    if (winner) {
        s.winner = winner;
        s.status = 'finished';
        return s;
    }
    // Increment turn counter
    const newTurn = s.markers.turn + 1;
    s.markers = { ...s.markers, turn: newTurn, phase: 'MAINTENANCE' };
    s.updatedAt = Date.now();
    const logEntry = makeLogEntry(s.markers.turn, 'TURN_END', 'TURN_ENDED', undefined, { newTurn });
    s.log = [...s.log, logEntry];
    return s;
}
function playCard(state, seat, cardId, targets) {
    if (state.status !== 'running') {
        throw new GameError('GAME_NOT_RUNNING', 'Game is not running.');
    }
    const card = (0, cards_1.getCard)(cardId);
    if (!card) {
        throw new GameError('INVALID_TARGET', `Card '${cardId}' not found.`);
    }
    // Validate card belongs to the seat
    const expectedSide = seat === 'MALOSOS' ? 'MALOSOS' : 'BUENOSOS';
    if (card.side !== expectedSide) {
        throw new GameError('NOT_AUTHORIZED', `Card '${cardId}' does not belong to ${seat}.`);
    }
    // Validate card is in hand
    if (!state.seats[seat].hand.includes(cardId)) {
        throw new GameError('INVALID_TARGET', `Card '${cardId}' is not in ${seat}'s hand.`);
    }
    // Validate phase
    validatePhaseForSeat(state.markers.phase, seat);
    // Validate budget
    let effectiveCost = card.cost;
    // DRP cost reduction effect (Runbook automatizado)
    if (card.category === 'DRP' && seat === 'BUENOSOS') {
        const drpReduction = state.temporaryEffects.find((e) => e.type === 'drpCostReduction');
        if (drpReduction) {
            effectiveCost = Math.max(1, effectiveCost - (drpReduction.value ?? 1));
        }
    }
    // Detection/Response cost increase from Persistencia silenciosa
    if (card.category === 'DETECTION_RESPONSE' && seat === 'BUENOSOS') {
        const frictionEffect = state.temporaryEffects.find((e) => e.type === 'detectionResponseCostIncrease' && !e.consumed);
        if (frictionEffect) {
            effectiveCost += 1;
        }
    }
    // Detection/Response limit from Distraccion multiple
    if (card.category === 'DETECTION_RESPONSE' && seat === 'BUENOSOS') {
        const limitEffect = state.temporaryEffects.find((e) => e.type === 'limitDetectionResponse');
        if (limitEffect) {
            const usedCount = state.log.filter((e) => e.turn === state.markers.turn &&
                e.actor === 'BUENOSOS' &&
                typeof e.details === 'object' &&
                e.details !== null &&
                'category' in e.details &&
                e.details.category === 'DETECTION_RESPONSE').length;
            if (usedCount >= 1) {
                throw new GameError('INVALID_PHASE', 'MalOsos Distraccion multiple limits BuenOsos to 1 Detection/Response card this turn.');
            }
        }
    }
    if (effectiveCost > state.seats[seat].budgetRemaining) {
        throw new GameError('INSUFFICIENT_BUDGET', `Not enough budget. Needs ${effectiveCost}, has ${state.seats[seat].budgetRemaining}.`);
    }
    // Validate campaign requirements (MalOsos only)
    if (seat === 'MALOSOS') {
        const canPlay = (0, campaign_1.canPlayCard)(card, state.campaign, state);
        if (!canPlay.allowed) {
            throw new GameError('CARD_REQUIREMENTS_NOT_MET', canPlay.reason ?? 'Requirements not met.');
        }
    }
    else {
        // BuenOsos requirements
        if (card.requirements && card.requirements.includes('BACKUPS_VERIFIED')) {
            if (!state.backupsVerified) {
                throw new GameError('CARD_REQUIREMENTS_NOT_MET', 'Backups not verified. Play "Backups verificados" card first.');
            }
        }
        if (card.requirements && card.requirements.includes('PREV_DETECTION')) {
            const hasPlayedDetection = state.log.some((entry) => entry.actor === 'BUENOSOS' &&
                typeof entry.details === 'object' &&
                entry.details !== null &&
                'category' in entry.details &&
                entry.details.category === 'DETECTION_RESPONSE');
            if (!hasPlayedDetection) {
                throw new GameError('CARD_REQUIREMENTS_NOT_MET', 'Must have played a Detection/Response card in a previous turn.');
            }
        }
    }
    let s = { ...state };
    const beforeState = JSON.parse(JSON.stringify(s));
    // Deduct budget and remove card from hand
    s.seats = {
        ...s.seats,
        [seat]: {
            ...s.seats[seat],
            budgetRemaining: s.seats[seat].budgetRemaining - effectiveCost,
            hand: s.seats[seat].hand.filter((id) => id !== cardId),
            discard: [...s.seats[seat].discard, cardId],
        },
    };
    // Apply effects
    s = applyCardEffects(s, card.effects, seat, targets);
    // Handle campaign phase advancement for MalOsos campaign cards
    if (seat === 'MALOSOS') {
        const campaignPhase = getCampaignPhaseFromCard(card);
        if (campaignPhase) {
            s.campaign = (0, campaign_1.completeCampaignPhase)(s.campaign, campaignPhase);
        }
    }
    // Check victory after card play
    const winner = (0, victory_1.checkVictory)(s);
    if (winner) {
        s.winner = winner;
        s.status = 'finished';
    }
    s.updatedAt = Date.now();
    const logEntry = makeLogEntry(s.markers.turn, s.markers.phase, 'CARD_PLAYED', seat, { cardId, cardName: card.name, category: card.category, targets, effectiveCost }, beforeState.services, s.services);
    s.log = [...s.log, logEntry];
    return { newState: s, logEntry };
}
// ============================================================
// USE BASIC ACTION
// ============================================================
function useBasicAction(state, seat, target) {
    if (state.status !== 'running') {
        throw new GameError('GAME_NOT_RUNNING', 'Game is not running.');
    }
    if (state.seats[seat].basicActionUsed) {
        throw new GameError('INVALID_PHASE', 'Basic action already used this turn.');
    }
    let s = { ...state };
    if (seat === 'MALOSOS') {
        // Basic Recon: marks recon valid for this turn only (non-permanent)
        s.campaign = (0, campaign_1.useBasicRecon)(s.campaign);
        s.seats = {
            ...s.seats,
            MALOSOS: { ...s.seats.MALOSOS, basicActionUsed: true },
        };
        const logEntry = makeLogEntry(s.markers.turn, s.markers.phase, 'BASIC_ACTION_RECON', 'MALOSOS', { description: 'Basic Recon: Reconocimiento valid this turn only' });
        s.log = [...s.log, logEntry];
    }
    else {
        // Basic Monitoring: -1 damage to first attack on target service
        if (!target) {
            throw new GameError('INVALID_TARGET', 'BuenOsos basic action requires a target service.');
        }
        const svc = s.services[target];
        if (!svc) {
            throw new GameError('INVALID_TARGET', `Service '${target}' not found.`);
        }
        const effectId = (0, uuid_1.v4)();
        s.temporaryEffects = [
            ...s.temporaryEffects,
            {
                id: effectId,
                type: 'basicMonitoring',
                targetId: target,
                expiresAtTurn: s.markers.turn + 1,
                value: 1,
            },
        ];
        s.seats = {
            ...s.seats,
            BUENOSOS: { ...s.seats.BUENOSOS, basicActionUsed: true },
        };
        const logEntry = makeLogEntry(s.markers.turn, s.markers.phase, 'BASIC_ACTION_MONITORING', 'BUENOSOS', { target, description: `Basic Monitoring on ${target}: first attack reduced by 1` });
        s.log = [...s.log, logEntry];
    }
    s.updatedAt = Date.now();
    return s;
}
// ============================================================
// ADVANCE PHASE
// ============================================================
function advancePhase(state, requestedPhase) {
    if (state.status !== 'running') {
        throw new GameError('GAME_NOT_RUNNING', 'Game is not running.');
    }
    const PHASE_ORDER = [
        'MAINTENANCE',
        'EVENT',
        'MALOSOS_PREP',
        'MALOSOS_ATTACK',
        'BUENOSOS_RESPONSE',
        'CASCADE_EVAL',
        'TURN_END',
    ];
    const currentIdx = PHASE_ORDER.indexOf(state.markers.phase);
    // Automatic phases are processed directly, not advanced manually
    const automaticPhases = ['MAINTENANCE', 'EVENT', 'CASCADE_EVAL', 'TURN_END'];
    if (automaticPhases.includes(state.markers.phase)) {
        return processPhase(state);
    }
    let nextPhase;
    if (requestedPhase) {
        nextPhase = requestedPhase;
    }
    else {
        const nextIdx = currentIdx + 1;
        if (nextIdx >= PHASE_ORDER.length) {
            nextPhase = 'MAINTENANCE'; // Wrap around (new turn)
        }
        else {
            nextPhase = PHASE_ORDER[nextIdx];
        }
    }
    let s = { ...state, markers: { ...state.markers, phase: nextPhase } };
    // If entering an automatic phase, process it immediately
    if (automaticPhases.includes(nextPhase)) {
        s = processPhase(s);
    }
    s.updatedAt = Date.now();
    const logEntry = makeLogEntry(s.markers.turn, s.markers.phase, 'PHASE_ADVANCED', undefined, { from: state.markers.phase, to: nextPhase });
    s.log = [...s.log, logEntry];
    return s;
}
// ============================================================
// APPLY CARD EFFECTS
// ============================================================
function applyCardEffects(state, effects, actor, targets) {
    let s = { ...state };
    for (const effect of effects) {
        s = applyEffect(s, effect, actor, targets);
    }
    return s;
}
function applyEffect(state, effect, actor, targets) {
    let s = { ...state };
    const target = targets[0];
    const targetId = effect.targetId ?? target;
    switch (effect.type) {
        // ---- DAMAGE INT ----
        case 'damageInt': {
            const amount = effect.amount ?? 0;
            const tId = effect.targetId ?? target;
            // Check for ignoreDamageReduction effect (Insider oportunista)
            const insiderActive = s.temporaryEffects.some((e) => e.type === 'ignoreDamageReduction' && e.targetId === tId);
            if (effect.targetAll && targets.length > 0) {
                for (const tid of targets) {
                    s.services = applyDamageToService(s.services, tid, amount, s.temporaryEffects, insiderActive);
                    s = trackDownTransition(s, tid);
                }
            }
            else if (tId) {
                s.services = applyDamageToService(s.services, tId, amount, s.temporaryEffects, insiderActive);
                s = trackDownTransition(s, tId);
            }
            break;
        }
        // ---- HEAL INT ----
        case 'healInt': {
            const amount = effect.amount ?? 0;
            const capToIntMax = effect.capToIntMax ?? true;
            const tId = targetId;
            if (tId) {
                const wasDOWN = s.services[tId]?.state === 'DOWN';
                s.services = healService(s.services, tId, amount, capToIntMax);
                const isNowUp = s.services[tId]?.state !== 'DOWN';
                if (wasDOWN && isNowUp && s.servicesThatWentDown.includes(tId)) {
                    if (!s.servicesRecovered.includes(tId)) {
                        s.servicesRecovered = [...s.servicesRecovered, tId];
                    }
                }
            }
            break;
        }
        // ---- SET STATE ----
        case 'setState': {
            const newState = effect.state;
            const tId = effect.targetId ?? target;
            if (newState && tId) {
                // Track recovery
                if (newState !== 'DOWN' && s.services[tId]?.state === 'DOWN') {
                    if (s.servicesThatWentDown.includes(tId) && !s.servicesRecovered.includes(tId)) {
                        s.servicesRecovered = [...s.servicesRecovered, tId];
                    }
                }
                s.services = setServiceState(s.services, tId, newState);
            }
            break;
        }
        // ---- SET INT ----
        case 'setInt': {
            const value = effect.value ?? 0;
            const tId = effect.targetId ?? target;
            if (tId && s.services[tId]) {
                s.services = { ...s.services, [tId]: { ...s.services[tId], int: value } };
            }
            break;
        }
        // ---- SET STATE IF ALREADY ----
        case 'setStateIfAlready': {
            const currentState = effect.currentState;
            const newState = effect.newState;
            const tId = effect.targetId ?? target;
            if (tId && s.services[tId]?.state === currentState) {
                s.services = setServiceState(s.services, tId, newState);
            }
            break;
        }
        // ---- SET STATE IF INT = 0 ----
        case 'setStateIfInt0': {
            const newState = effect.state;
            const tId = effect.targetId ?? target;
            if (tId && s.services[tId]?.int === 0) {
                s.services = setServiceState(s.services, tId, newState);
                if (newState === 'DOWN') {
                    s = trackDownTransition(s, tId);
                }
            }
            break;
        }
        // ---- CONDITIONAL DAMAGE ----
        case 'conditionalDamage': {
            const condition = effect.condition;
            const condTarget = effect.conditionTargetId;
            const victims = effect.victims ?? [];
            const amount = effect.amount ?? 0;
            if (condition === 'targetDown' && s.services[condTarget]?.state === 'DOWN') {
                for (const vid of victims) {
                    s.services = applyDamageToService(s.services, vid, amount, s.temporaryEffects, false);
                    s = trackDownTransition(s, vid);
                }
            }
            break;
        }
        // ---- SET STATE IF CONDITION ----
        case 'setStateIfCondition': {
            const condition = effect.condition;
            const newState = effect.newState;
            const tId = effect.targetId ?? target;
            let condMet = false;
            if (condition === 'S11DegradedOrWorse') {
                const s11 = s.services['S11'];
                condMet = !!s11 && s11.state !== 'OK';
            }
            else if (condition === 'S1DegradedOrWorse') {
                const s1 = s.services['S1'];
                condMet = !!s1 && s1.state !== 'OK';
            }
            if (condMet && tId) {
                s.services = setServiceState(s.services, tId, newState);
            }
            break;
        }
        // ---- MODIFY TRUST ----
        case 'modifyTrust': {
            const amount = effect.amount ?? 0;
            s = (0, markers_1.modifyTrust)(s, amount);
            break;
        }
        // ---- CONDITIONAL TRUST ----
        case 'conditionalTrust': {
            const condition = effect.condition;
            const amount = effect.amount ?? 0;
            let condMet = false;
            if (condition === 'S7orS10IntermittentOrDown') {
                const s7 = s.services['S7'];
                const s10 = s.services['S10'];
                condMet =
                    (!!s7 && (s7.state === 'INTERMITTENT' || s7.state === 'DOWN')) ||
                        (!!s10 && (s10.state === 'INTERMITTENT' || s10.state === 'DOWN'));
            }
            if (condMet) {
                s = (0, markers_1.modifyTrust)(s, amount);
            }
            break;
        }
        // ---- MODIFY STABILITY ----
        case 'modifyStability': {
            const amount = effect.amount ?? 0;
            s = (0, markers_1.modifyStability)(s, amount);
            // Check victory after stability change
            const winner = (0, victory_1.checkVictory)(s);
            if (winner) {
                s.winner = winner;
                s.status = 'finished';
            }
            break;
        }
        // ---- MARK CAMPAIGN PHASE ----
        case 'markCampaignPhase': {
            const phase = effect.phase;
            if (phase) {
                s.campaign = (0, campaign_1.completeCampaignPhase)(s.campaign, phase);
            }
            break;
        }
        // ---- ROLLBACK CAMPAIGN PHASE ----
        case 'rollbackCampaignPhase': {
            const choices = effect.choices ?? [];
            // Roll back first available phase from choices
            for (const ph of choices) {
                if (s.campaign.completedPhases.includes(ph)) {
                    s.campaign = (0, campaign_1.rollbackCampaignPhase)(s.campaign, ph);
                    break;
                }
            }
            break;
        }
        // ---- SET BACKUPS VERIFIED ----
        case 'setBackupsVerified': {
            s.backupsVerified = effect.value ?? true;
            break;
        }
        // ---- DISCARD OPPONENT CARD ----
        case 'discardOpponentCard': {
            const opponent = effect.opponent ?? (actor === 'MALOSOS' ? 'BUENOSOS' : 'MALOSOS');
            const count = effect.count ?? 1;
            const mode = effect.mode ?? 'random';
            const opHand = [...s.seats[opponent].hand];
            const opDiscard = [...s.seats[opponent].discard];
            for (let i = 0; i < count && opHand.length > 0; i++) {
                let discarded;
                if (mode === 'random') {
                    const idx = Math.floor(Math.random() * opHand.length);
                    discarded = opHand.splice(idx, 1)[0];
                }
                else {
                    // highest cost
                    opHand.sort((a, b) => {
                        const cardA = (0, cards_1.getCard)(a);
                        const cardB = (0, cards_1.getCard)(b);
                        return (cardB?.cost ?? 0) - (cardA?.cost ?? 0);
                    });
                    discarded = opHand.shift();
                }
                opDiscard.push(discarded);
            }
            s.seats = {
                ...s.seats,
                [opponent]: { ...s.seats[opponent], hand: opHand, discard: opDiscard },
            };
            break;
        }
        // ---- ADD TEMP EFFECT ----
        case 'addTempEffect': {
            const effectType = effect.effectType;
            const duration = effect.duration;
            const effectTargetId = effect.targetId ?? target;
            let expiresAtTurn;
            let expiresAtPhase;
            if (duration === 'turn') {
                expiresAtTurn = s.markers.turn + 1;
            }
            const newEffect = {
                id: (0, uuid_1.v4)(),
                type: effectType,
                targetId: effectTargetId,
                expiresAtTurn,
                expiresAtPhase,
                value: effect.value,
                ...extractExtraEffectProps(effect),
            };
            s.temporaryEffects = [...s.temporaryEffects, newEffect];
            // Special handling for bcpManualOp — target must be from targets
            if (effectType === 'bcpManualOp' && target) {
                s.temporaryEffects = s.temporaryEffects.map((e) => e.id === newEffect.id ? { ...e, targetId: target } : e);
            }
            // bcpPrioritization — store the two targets
            if (effectType === 'bcpPrioritization' && targets.length > 0) {
                s.temporaryEffects = s.temporaryEffects.map((e) => e.id === newEffect.id ? { ...e, targets } : e);
            }
            // blockIntermittentPropagation — target from targets
            if (effectType === 'blockIntermittentPropagation' && target) {
                s.temporaryEffects = s.temporaryEffects.map((e) => e.id === newEffect.id ? { ...e, targetId: target } : e);
            }
            // ignoreCascadeEdge — two targets
            if (effectType === 'ignoreCascadeEdge' && targets.length >= 2) {
                s.temporaryEffects = s.temporaryEffects.map((e) => e.id === newEffect.id
                    ? { ...e, fromServiceId: targets[0], toServiceId: targets[1] }
                    : e);
            }
            // socMonitoring — target from targets
            if (effectType === 'socMonitoring' && target) {
                s.temporaryEffects = s.temporaryEffects.map((e) => e.id === newEffect.id
                    ? { ...e, targetId: target, budgetPenalty: effect.budgetPenalty, damageReduction: effect.damageReduction }
                    : e);
            }
            // Persistencia silenciosa -> budget modifier for BuenOsos detection/response
            if (effectType === 'addBudgetModifier') {
                // Represented as detectionResponseCostIncrease
                const modifier = {
                    id: (0, uuid_1.v4)(),
                    type: 'detectionResponseCostIncrease',
                    expiresAtTurn: s.markers.turn + 1,
                    value: effect.amount ?? 1,
                    consumed: false,
                };
                s.temporaryEffects = s.temporaryEffects.filter((e) => e.id !== newEffect.id);
                s.temporaryEffects = [...s.temporaryEffects, modifier];
            }
            break;
        }
        // ---- EVENT ACTIVATION (conditional) ----
        case 'eventActivation': {
            const condition = effect.condition;
            const ifTrue = effect.ifTrue ?? [];
            const ifFalse = effect.ifFalse ?? [];
            let condMet = false;
            if (condition === 'turn>=5') {
                condMet = s.markers.turn >= 5;
            }
            else if (condition === 'S11DegradedOrWorse') {
                condMet = !!s.services['S11'] && s.services['S11'].state !== 'OK';
            }
            else if (condition === 'S7orS10DegradedOrWorse') {
                const s7 = s.services['S7'];
                const s10 = s.services['S10'];
                condMet =
                    (!!s7 && s7.state !== 'OK') ||
                        (!!s10 && s10.state !== 'OK');
            }
            else if (condition === 'S12DegradedOrWorse') {
                condMet = !!s.services['S12'] && s.services['S12'].state !== 'OK';
            }
            const subEffects = condMet ? ifTrue : ifFalse;
            for (const sub of subEffects) {
                s = applyEffect(s, sub, actor, targets);
            }
            break;
        }
        // ---- SET LATENT (event latent marker) ----
        case 'setLatent': {
            const activationTurn = effect.activationTurn ?? 5;
            const latentEffect = {
                id: (0, uuid_1.v4)(),
                type: 'latentEvent',
                expiresAtTurn: undefined,
                activationTurn,
            };
            s.temporaryEffects = [...s.temporaryEffects, latentEffect];
            break;
        }
        default:
            // Unknown effect type — skip gracefully
            break;
    }
    return s;
}
// ============================================================
// HELPERS
// ============================================================
function trackDownTransition(state, serviceId) {
    const svc = state.services[serviceId];
    if (!svc)
        return state;
    if (svc.state === 'DOWN' && !state.servicesThatWentDown.includes(serviceId)) {
        return {
            ...state,
            servicesThatWentDown: [...state.servicesThatWentDown, serviceId],
        };
    }
    return state;
}
function applyDownEffect(state, serviceId) {
    let s = { ...state };
    // Apply hard-coded down effects based on service id
    // (These mirror the downEffect descriptions in services.ts and REGLAS.md)
    switch (serviceId) {
        case 'S1':
            // S2 receives -2 INT
            s.services = applyDamageToService(s.services, 'S2', 2, s.temporaryEffects, false);
            break;
        case 'S5':
            // S6 and S7 receive -2 INT
            s.services = applyDamageToService(s.services, 'S6', 2, s.temporaryEffects, false);
            s.services = applyDamageToService(s.services, 'S7', 2, s.temporaryEffects, false);
            break;
        default:
            break;
    }
    return s;
}
function getCampaignPhaseFromCard(card) {
    switch (card.category) {
        case 'RECON': return 'RECON';
        case 'ACCESS': return 'ACCESS';
        case 'PERSISTENCE': return 'PERSISTENCE';
        case 'LATERAL_MOVEMENT': return 'LATERAL_MOVEMENT';
        default: return null;
    }
}
function validatePhaseForSeat(phase, seat) {
    const malososPhases = ['MALOSOS_PREP', 'MALOSOS_ATTACK'];
    const buenososPhases = ['BUENOSOS_RESPONSE'];
    if (seat === 'MALOSOS' && !malososPhases.includes(phase)) {
        throw new GameError('INVALID_PHASE', `MalOsos cannot play cards in phase '${phase}'.`);
    }
    if (seat === 'BUENOSOS' && !buenososPhases.includes(phase)) {
        throw new GameError('INVALID_PHASE', `BuenOsos cannot play cards in phase '${phase}'.`);
    }
}
function extractExtraEffectProps(effect) {
    const excluded = new Set([
        'type', 'effectType', 'duration', 'targetId', 'expiresAtTurn', 'expiresAtPhase',
        'value', 'amount', 'state', 'phase', 'choices', 'condition', 'ifTrue', 'ifFalse',
        'targetAll', 'currentState', 'newState', 'victims', 'opponent', 'count', 'mode',
        'activationTurn',
    ]);
    const extra = {};
    for (const [k, v] of Object.entries(effect)) {
        if (!excluded.has(k)) {
            extra[k] = v;
        }
    }
    return extra;
}
//# sourceMappingURL=gameEngine.js.map