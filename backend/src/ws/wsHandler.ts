import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import {
  WsIncomingMessage,
  WsGameState,
  WsActionResult,
  WsError,
  GameState,
} from '../types/game.types';
import { getPlayerByToken } from '../db/migrations';
import { saveGame, loadGame } from '../db/migrations';
import {
  playCard,
  useBasicAction,
  advancePhase,
  GameError,
} from '../engine/gameEngine';

// ============================================================
// Room management: Map<gameId, Set<WebSocket>>
// ============================================================

const rooms = new Map<string, Set<WebSocket>>();

// Map each WebSocket to its player token for auth
const clientTokens = new Map<WebSocket, string>();

// ============================================================
// BROADCAST helpers
// ============================================================

function broadcast(gameId: string, message: unknown): void {
  const room = rooms.get(gameId);
  if (!room) return;

  const payload = JSON.stringify(message);
  for (const client of room) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function sendToClient(ws: WebSocket, message: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws: WebSocket, code: string, message: string): void {
  const err: WsError = { type: 'ERROR', code: code as WsError['code'], message };
  sendToClient(ws, err);
}

// ============================================================
// LOAD / SAVE state helpers
// ============================================================

function loadGameState(gameId: string): { state: GameState; configJson: string } | null {
  const row = loadGame(gameId);
  if (!row) return null;
  return { state: JSON.parse(row.state_json) as GameState, configJson: row.config_json };
}

function persistState(state: GameState): void {
  saveGame(state.id, state.status, JSON.stringify(state.config), JSON.stringify(state));
}

// ============================================================
// UPGRADE HANDLER — called from HTTP server for WS upgrades
// Channel: GET /ws/games/:gameId?token=<token>
// ============================================================

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // Parse URL to get gameId and token
    const rawUrl = req.url ?? '';
    let gameId: string | null = null;
    let token: string | null = null;

    try {
      const url = new URL(rawUrl, 'http://localhost');
      const pathParts = url.pathname.split('/');
      // Expected path: /ws/games/:gameId
      const gamesIdx = pathParts.indexOf('games');
      if (gamesIdx !== -1 && pathParts.length > gamesIdx + 1) {
        gameId = pathParts[gamesIdx + 1];
      }
      token = url.searchParams.get('token');
    } catch {
      sendError(ws, 'NOT_AUTHORIZED', 'Invalid connection URL.');
      ws.close();
      return;
    }

    if (!gameId || !token) {
      sendError(ws, 'NOT_AUTHORIZED', 'gameId and token are required.');
      ws.close();
      return;
    }

    // Authenticate player
    const player = getPlayerByToken(token);
    if (!player) {
      sendError(ws, 'NOT_AUTHORIZED', 'Invalid token.');
      ws.close();
      return;
    }

    if (player.gameId !== gameId) {
      sendError(ws, 'NOT_AUTHORIZED', 'Token does not belong to this game.');
      ws.close();
      return;
    }

    // Register client in room
    if (!rooms.has(gameId)) {
      rooms.set(gameId, new Set());
    }
    rooms.get(gameId)!.add(ws);
    clientTokens.set(ws, token);

    console.log(`[WS] Player '${player.displayName}' (${player.seat}) connected to game ${gameId}`);

    // Send current game state on connect
    const loaded = loadGameState(gameId);
    if (loaded) {
      const stateMsg: WsGameState = { type: 'GAME_STATE', state: loaded.state };
      sendToClient(ws, stateMsg);
    }

    // ---- MESSAGE HANDLER ----
    ws.on('message', (data) => {
      let msg: WsIncomingMessage;
      try {
        msg = JSON.parse(data.toString()) as WsIncomingMessage;
      } catch {
        sendError(ws, 'NOT_AUTHORIZED', 'Invalid JSON message.');
        return;
      }

      handleMessage(ws, gameId!, player.seat, msg);
    });

    // ---- DISCONNECT HANDLER ----
    ws.on('close', () => {
      const room = rooms.get(gameId!);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          rooms.delete(gameId!);
        }
      }
      clientTokens.delete(ws);
      console.log(`[WS] Player '${player.displayName}' disconnected from game ${gameId}`);
    });

    ws.on('error', (err) => {
      console.error(`[WS] Error for player '${player.displayName}' in game ${gameId}:`, err);
    });
  });
}

// ============================================================
// MESSAGE DISPATCHER
// ============================================================

function handleMessage(
  ws: WebSocket,
  gameId: string,
  playerSeat: string,
  msg: WsIncomingMessage
): void {
  try {
    switch (msg.type) {
      case 'PLAY_CARD':
        handlePlayCard(ws, gameId, playerSeat, msg);
        break;
      case 'USE_BASIC_ACTION':
        handleUseBasicAction(ws, gameId, playerSeat, msg);
        break;
      case 'ADVANCE_PHASE':
        handleAdvancePhase(ws, gameId, msg);
        break;
      default:
        sendError(ws, 'NOT_AUTHORIZED', 'Unknown message type.');
    }
  } catch (err) {
    if (err instanceof GameError) {
      sendError(ws, err.code, err.message);
    } else {
      console.error('[WS] Unhandled error:', err);
      sendError(ws, 'NOT_AUTHORIZED', 'Internal server error.');
    }
  }
}

// ---- PLAY_CARD ----
function handlePlayCard(
  ws: WebSocket,
  gameId: string,
  playerSeat: string,
  msg: WsIncomingMessage & { type: 'PLAY_CARD' }
): void {
  const loaded = loadGameState(gameId);
  if (!loaded) {
    sendError(ws, 'GAME_NOT_RUNNING', 'Game not found.');
    return;
  }

  // Validate the player is acting on behalf of the correct seat
  if (playerSeat !== 'FACILITATOR' && playerSeat !== msg.side) {
    sendError(ws, 'NOT_AUTHORIZED', 'You cannot act for the other seat.');
    return;
  }

  const { newState, logEntry } = playCard(
    loaded.state,
    msg.side,
    msg.cardId,
    msg.targets ?? []
  );

  persistState(newState);

  // Broadcast new state to all room members
  const stateMsg: WsGameState = { type: 'GAME_STATE', state: newState };
  broadcast(gameId, stateMsg);

  // Send action result to actor
  const result: WsActionResult = { type: 'ACTION_RESULT', logEntry, diff: {} };
  sendToClient(ws, result);
}

// ---- USE_BASIC_ACTION ----
function handleUseBasicAction(
  ws: WebSocket,
  gameId: string,
  playerSeat: string,
  msg: WsIncomingMessage & { type: 'USE_BASIC_ACTION' }
): void {
  const loaded = loadGameState(gameId);
  if (!loaded) {
    sendError(ws, 'GAME_NOT_RUNNING', 'Game not found.');
    return;
  }

  if (playerSeat !== 'FACILITATOR' && playerSeat !== msg.side) {
    sendError(ws, 'NOT_AUTHORIZED', 'You cannot act for the other seat.');
    return;
  }

  const newState = useBasicAction(loaded.state, msg.side, msg.target);

  persistState(newState);

  const stateMsg: WsGameState = { type: 'GAME_STATE', state: newState };
  broadcast(gameId, stateMsg);
}

// ---- ADVANCE_PHASE ----
function handleAdvancePhase(
  ws: WebSocket,
  gameId: string,
  msg: WsIncomingMessage & { type: 'ADVANCE_PHASE' }
): void {
  const loaded = loadGameState(gameId);
  if (!loaded) {
    sendError(ws, 'GAME_NOT_RUNNING', 'Game not found.');
    return;
  }

  const newState = advancePhase(loaded.state, msg.requestedPhase);

  persistState(newState);

  const stateMsg: WsGameState = { type: 'GAME_STATE', state: newState };
  broadcast(gameId, stateMsg);
}

// ============================================================
// EXPORT getRooms for external use (e.g. broadcasting from REST)
// ============================================================

export function broadcastToGame(gameId: string, message: unknown): void {
  broadcast(gameId, message);
}
