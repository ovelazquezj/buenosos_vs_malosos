import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  saveGame,
  loadGame,
  listGames,
  savePlayer,
  getPlayerByToken,
  getPlayersByGame,
  getLogsByGame,
} from '../db/migrations';
import {
  initializeGame,
  startGame,
  GameError,
} from '../engine/gameEngine';
import { GameConfig, GameState, Player } from '../types/game.types';

const router = Router();

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'NOT_AUTHORIZED', message: 'Missing Authorization header.' });
    return;
  }

  const player = getPlayerByToken(token);
  if (!player) {
    res.status(401).json({ error: 'NOT_AUTHORIZED', message: 'Invalid token.' });
    return;
  }

  // Attach player to request
  (req as Request & { player: Player }).player = player;
  next();
}

function requireGameAccess(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const player = (req as Request & { player: Player }).player;
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

function loadGameState(gameId: string): { state: GameState; configJson: string } | null {
  const row = loadGame(gameId);
  if (!row) return null;

  const state = JSON.parse(row.state_json) as GameState;
  return { state, configJson: row.config_json };
}

// ============================================================
// POST /api/games — Create a new game
// ============================================================

router.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body as {
      displayName?: string;
      seat?: 'BUENOSOS' | 'MALOSOS' | 'FACILITATOR';
      // Flat params
      turnLimit?: number;
      budgetPerTurn?: number;
      intermittenceMode?: 'deterministic' | 'random';
      mapId?: string;
      // Nested config (also accepted)
      config?: {
        turnLimit?: number;
        budgetPerTurn?: number;
        intermittenceMode?: 'deterministic' | 'random';
        mapId?: string;
      };
    };

    const displayName = body.displayName ?? 'Player';
    const seat = body.seat ?? 'FACILITATOR';
    const cfg = body.config ?? {};
    const config: GameConfig = {
      turnLimit:         cfg.turnLimit         ?? body.turnLimit         ?? 8,
      budgetPerTurn:     cfg.budgetPerTurn     ?? body.budgetPerTurn     ?? 8,
      intermittenceMode: cfg.intermittenceMode ?? body.intermittenceMode ?? 'deterministic',
      mapId:             cfg.mapId             ?? body.mapId             ?? 'standard',
    };

    const gameId = uuidv4();
    const state = initializeGame(config, gameId);
    saveGame(gameId, state.status, JSON.stringify(config), JSON.stringify(state));

    const playerToken = uuidv4();
    const player: Player = {
      id: uuidv4(),
      gameId,
      seat,
      displayName,
      token: playerToken,
      createdAt: Date.now(),
    };
    savePlayer(player);

    res.status(201).json({ gameId, token: playerToken, player, state });
  } catch (err) {
    console.error('[POST /api/games]', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create game.' });
  }
});

// ============================================================
// POST /api/games/:gameId/join — Join an existing game
// ============================================================

router.post('/:gameId/join', (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { seat, displayName } = req.body as { seat: 'BUENOSOS' | 'MALOSOS' | 'FACILITATOR'; displayName: string };

    if (!seat || !displayName) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'seat and displayName are required.' });
      return;
    }

    const gameRow = loadGame(gameId);
    if (!gameRow) {
      res.status(404).json({ error: 'NOT_FOUND', message: `Game '${gameId}' not found.` });
      return;
    }

    if (gameRow.status === 'finished') {
      res.status(400).json({ error: 'GAME_NOT_RUNNING', message: 'Game is already finished.' });
      return;
    }

    // Check if seat is already taken (only one player per seat)
    const existingPlayers = getPlayersByGame(gameId);
    const seatTaken = existingPlayers.some((p) => p.seat === seat);
    if (seatTaken && seat !== 'FACILITATOR') {
      res.status(409).json({ error: 'SEAT_TAKEN', message: `Seat '${seat}' is already occupied.` });
      return;
    }

    const token = uuidv4();
    const player: Player = {
      id: uuidv4(),
      gameId,
      seat,
      displayName,
      token,
      createdAt: Date.now(),
    };
    savePlayer(player);

    res.status(200).json({ gameId, token, seat, displayName });
  } catch (err) {
    console.error('[POST /api/games/:gameId/join]', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to join game.' });
  }
});

// ============================================================
// GET /api/games/:gameId — Get game state
// ============================================================

router.get('/:gameId', requireGameAccess, (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const loaded = loadGameState(gameId);
    if (!loaded) {
      res.status(404).json({ error: 'NOT_FOUND', message: `Game '${gameId}' not found.` });
      return;
    }

    res.status(200).json({ state: loaded.state });
  } catch (err) {
    console.error('[GET /api/games/:gameId]', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to load game.' });
  }
});

// ============================================================
// POST /api/games/:gameId/start — Start the game
// ============================================================

router.post('/:gameId/start', requireGameAccess, (req: Request, res: Response) => {
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

    const newState = startGame(loaded.state);
    saveGame(gameId, newState.status, loaded.configJson, JSON.stringify(newState));

    res.status(200).json({ state: newState });
  } catch (err) {
    if (err instanceof GameError) {
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

router.post('/:gameId/pause', requireGameAccess, (req: Request, res: Response) => {
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

    const newState: GameState = { ...loaded.state, status: 'paused', updatedAt: Date.now() };
    saveGame(gameId, 'paused', loaded.configJson, JSON.stringify(newState));

    res.status(200).json({ state: newState });
  } catch (err) {
    console.error('[POST /api/games/:gameId/pause]', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to pause game.' });
  }
});

// ============================================================
// POST /api/games/:gameId/resume — Resume the game
// ============================================================

router.post('/:gameId/resume', requireGameAccess, (req: Request, res: Response) => {
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

    const newState: GameState = { ...loaded.state, status: 'running', updatedAt: Date.now() };
    saveGame(gameId, 'running', loaded.configJson, JSON.stringify(newState));

    res.status(200).json({ state: newState });
  } catch (err) {
    console.error('[POST /api/games/:gameId/resume]', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to resume game.' });
  }
});

// ============================================================
// GET /api/games/:gameId/export — Export game log as JSON
// ============================================================

router.get('/:gameId/export', requireGameAccess, (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const loaded = loadGameState(gameId);
    if (!loaded) {
      res.status(404).json({ error: 'NOT_FOUND', message: `Game '${gameId}' not found.` });
      return;
    }

    const logs = getLogsByGame(gameId);
    const players = getPlayersByGame(gameId);

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
  } catch (err) {
    console.error('[GET /api/games/:gameId/export]', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to export game.' });
  }
});

// ============================================================
// GET /api/games — List all games (utility endpoint)
// ============================================================

router.get('/', (_req: Request, res: Response) => {
  try {
    const games = listGames();
    res.status(200).json({ games });
  } catch (err) {
    console.error('[GET /api/games]', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to list games.' });
  }
});

export default router;
