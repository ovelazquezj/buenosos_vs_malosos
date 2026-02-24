"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const migrations_1 = require("../db/migrations");
const gameEngine_1 = require("../engine/gameEngine");
const router = (0, express_1.Router)();
// ============================================================
// AUTH MIDDLEWARE
// ============================================================
function extractToken(req) {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
        return auth.slice(7).trim();
    }
    return null;
}
function requireAuth(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        res.status(401).json({ error: 'NOT_AUTHORIZED', message: 'Missing Authorization header.' });
        return;
    }
    const player = (0, migrations_1.getPlayerByToken)(token);
    if (!player) {
        res.status(401).json({ error: 'NOT_AUTHORIZED', message: 'Invalid token.' });
        return;
    }
    // Attach player to request
    req.player = player;
    next();
}
function requireGameAccess(req, res, next) {
    requireAuth(req, res, () => {
        const player = req.player;
        const { gameId } = req.params;
        if (player.gameId !== gameId) {
            res.status(403).json({ error: 'NOT_AUTHORIZED', message: 'Player does not belong to this game.' });
            return;
        }
        next();
    });
}
// ============================================================
// HELPER: Load game state from DB
// ============================================================
function loadGameState(gameId) {
    const row = (0, migrations_1.loadGame)(gameId);
    if (!row)
        return null;
    const state = JSON.parse(row.state_json);
    return { state, configJson: row.config_json };
}
// ============================================================
// POST /api/games — Create a new game
// ============================================================
router.post('/', (req, res) => {
    try {
        const body = req.body;
        const displayName = body.displayName ?? 'Player';
        const seat = body.seat ?? 'FACILITATOR';
        const cfg = body.config ?? {};
        const config = {
            turnLimit: cfg.turnLimit ?? body.turnLimit ?? 8,
            budgetPerTurn: cfg.budgetPerTurn ?? body.budgetPerTurn ?? 8,
            intermittenceMode: cfg.intermittenceMode ?? body.intermittenceMode ?? 'deterministic',
            mapId: cfg.mapId ?? body.mapId ?? 'standard',
        };
        const gameId = (0, uuid_1.v4)();
        const state = (0, gameEngine_1.initializeGame)(config, gameId);
        (0, migrations_1.saveGame)(gameId, state.status, JSON.stringify(config), JSON.stringify(state));
        const playerToken = (0, uuid_1.v4)();
        const player = {
            id: (0, uuid_1.v4)(),
            gameId,
            seat,
            displayName,
            token: playerToken,
            createdAt: Date.now(),
        };
        (0, migrations_1.savePlayer)(player);
        res.status(201).json({ gameId, token: playerToken, player, state });
    }
    catch (err) {
        console.error('[POST /api/games]', err);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create game.' });
    }
});
// ============================================================
// POST /api/games/:gameId/join — Join an existing game
// ============================================================
router.post('/:gameId/join', (req, res) => {
    try {
        const { gameId } = req.params;
        const { seat, displayName } = req.body;
        if (!seat || !displayName) {
            res.status(400).json({ error: 'BAD_REQUEST', message: 'seat and displayName are required.' });
            return;
        }
        const gameRow = (0, migrations_1.loadGame)(gameId);
        if (!gameRow) {
            res.status(404).json({ error: 'NOT_FOUND', message: `Game '${gameId}' not found.` });
            return;
        }
        if (gameRow.status === 'finished') {
            res.status(400).json({ error: 'GAME_NOT_RUNNING', message: 'Game is already finished.' });
            return;
        }
        // Check if seat is already taken (only one player per seat)
        const existingPlayers = (0, migrations_1.getPlayersByGame)(gameId);
        const seatTaken = existingPlayers.some((p) => p.seat === seat);
        if (seatTaken && seat !== 'FACILITATOR') {
            res.status(409).json({ error: 'SEAT_TAKEN', message: `Seat '${seat}' is already occupied.` });
            return;
        }
        const token = (0, uuid_1.v4)();
        const player = {
            id: (0, uuid_1.v4)(),
            gameId,
            seat,
            displayName,
            token,
            createdAt: Date.now(),
        };
        (0, migrations_1.savePlayer)(player);
        res.status(200).json({ gameId, token, seat, displayName });
    }
    catch (err) {
        console.error('[POST /api/games/:gameId/join]', err);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to join game.' });
    }
});
// ============================================================
// GET /api/games/:gameId — Get game state
// ============================================================
router.get('/:gameId', requireGameAccess, (req, res) => {
    try {
        const { gameId } = req.params;
        const loaded = loadGameState(gameId);
        if (!loaded) {
            res.status(404).json({ error: 'NOT_FOUND', message: `Game '${gameId}' not found.` });
            return;
        }
        res.status(200).json({ state: loaded.state });
    }
    catch (err) {
        console.error('[GET /api/games/:gameId]', err);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to load game.' });
    }
});
// ============================================================
// POST /api/games/:gameId/start — Start the game
// ============================================================
router.post('/:gameId/start', requireGameAccess, (req, res) => {
    try {
        const { gameId } = req.params;
        const loaded = loadGameState(gameId);
        if (!loaded) {
            res.status(404).json({ error: 'NOT_FOUND', message: `Game '${gameId}' not found.` });
            return;
        }
        if (loaded.state.status !== 'lobby') {
            res.status(400).json({ error: 'GAME_NOT_RUNNING', message: 'Game is not in lobby state.' });
            return;
        }
        const newState = (0, gameEngine_1.startGame)(loaded.state);
        (0, migrations_1.saveGame)(gameId, newState.status, loaded.configJson, JSON.stringify(newState));
        res.status(200).json({ state: newState });
    }
    catch (err) {
        if (err instanceof gameEngine_1.GameError) {
            res.status(400).json({ error: err.code, message: err.message });
            return;
        }
        console.error('[POST /api/games/:gameId/start]', err);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to start game.' });
    }
});
// ============================================================
// POST /api/games/:gameId/pause — Pause the game
// ============================================================
router.post('/:gameId/pause', requireGameAccess, (req, res) => {
    try {
        const { gameId } = req.params;
        const loaded = loadGameState(gameId);
        if (!loaded) {
            res.status(404).json({ error: 'NOT_FOUND', message: `Game '${gameId}' not found.` });
            return;
        }
        if (loaded.state.status !== 'running') {
            res.status(400).json({ error: 'GAME_NOT_RUNNING', message: 'Game is not running.' });
            return;
        }
        const newState = { ...loaded.state, status: 'paused', updatedAt: Date.now() };
        (0, migrations_1.saveGame)(gameId, 'paused', loaded.configJson, JSON.stringify(newState));
        res.status(200).json({ state: newState });
    }
    catch (err) {
        console.error('[POST /api/games/:gameId/pause]', err);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to pause game.' });
    }
});
// ============================================================
// POST /api/games/:gameId/resume — Resume the game
// ============================================================
router.post('/:gameId/resume', requireGameAccess, (req, res) => {
    try {
        const { gameId } = req.params;
        const loaded = loadGameState(gameId);
        if (!loaded) {
            res.status(404).json({ error: 'NOT_FOUND', message: `Game '${gameId}' not found.` });
            return;
        }
        if (loaded.state.status !== 'paused') {
            res.status(400).json({ error: 'GAME_NOT_RUNNING', message: 'Game is not paused.' });
            return;
        }
        const newState = { ...loaded.state, status: 'running', updatedAt: Date.now() };
        (0, migrations_1.saveGame)(gameId, 'running', loaded.configJson, JSON.stringify(newState));
        res.status(200).json({ state: newState });
    }
    catch (err) {
        console.error('[POST /api/games/:gameId/resume]', err);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to resume game.' });
    }
});
// ============================================================
// GET /api/games/:gameId/export — Export game log as JSON
// ============================================================
router.get('/:gameId/export', requireGameAccess, (req, res) => {
    try {
        const { gameId } = req.params;
        const loaded = loadGameState(gameId);
        if (!loaded) {
            res.status(404).json({ error: 'NOT_FOUND', message: `Game '${gameId}' not found.` });
            return;
        }
        const logs = (0, migrations_1.getLogsByGame)(gameId);
        const players = (0, migrations_1.getPlayersByGame)(gameId);
        const exportData = {
            gameId,
            exportedAt: new Date().toISOString(),
            config: loaded.state.config,
            status: loaded.state.status,
            winner: loaded.state.winner ?? null,
            markers: loaded.state.markers,
            services: loaded.state.services,
            campaign: loaded.state.campaign,
            servicesRecovered: loaded.state.servicesRecovered,
            servicesThatWentDown: loaded.state.servicesThatWentDown,
            players: players.map((p) => ({ id: p.id, seat: p.seat, displayName: p.displayName })),
            logs,
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="game-${gameId}-export.json"`);
        res.status(200).json(exportData);
    }
    catch (err) {
        console.error('[GET /api/games/:gameId/export]', err);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to export game.' });
    }
});
// ============================================================
// GET /api/games — List all games (utility endpoint)
// ============================================================
router.get('/', (_req, res) => {
    try {
        const games = (0, migrations_1.listGames)();
        res.status(200).json({ games });
    }
    catch (err) {
        console.error('[GET /api/games]', err);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to list games.' });
    }
});
exports.default = router;
//# sourceMappingURL=gamesRouter.js.map