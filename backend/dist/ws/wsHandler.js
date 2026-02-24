"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
exports.broadcastToGame = broadcastToGame;
const ws_1 = require("ws");
const url_1 = require("url");
const migrations_1 = require("../db/migrations");
const migrations_2 = require("../db/migrations");
const gameEngine_1 = require("../engine/gameEngine");
// ============================================================
// Room management: Map<gameId, Set<WebSocket>>
// ============================================================
const rooms = new Map();
// Map each WebSocket to its player token for auth
const clientTokens = new Map();
// ============================================================
// BROADCAST helpers
// ============================================================
function broadcast(gameId, message) {
    const room = rooms.get(gameId);
    if (!room)
        return;
    const payload = JSON.stringify(message);
    for (const client of room) {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(payload);
        }
    }
}
function sendToClient(ws, message) {
    if (ws.readyState === ws_1.WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}
function sendError(ws, code, message) {
    const err = { type: 'ERROR', code: code, message };
    sendToClient(ws, err);
}
// ============================================================
// LOAD / SAVE state helpers
// ============================================================
function loadGameState(gameId) {
    const row = (0, migrations_2.loadGame)(gameId);
    if (!row)
        return null;
    return { state: JSON.parse(row.state_json), configJson: row.config_json };
}
function persistState(state) {
    (0, migrations_2.saveGame)(state.id, state.status, JSON.stringify(state.config), JSON.stringify(state));
}
// ============================================================
// UPGRADE HANDLER — called from HTTP server for WS upgrades
// Channel: GET /ws/games/:gameId?token=<token>
// ============================================================
function setupWebSocket(wss) {
    wss.on('connection', (ws, req) => {
        // Parse URL to get gameId and token
        const rawUrl = req.url ?? '';
        let gameId = null;
        let token = null;
        try {
            const url = new url_1.URL(rawUrl, 'http://localhost');
            const pathParts = url.pathname.split('/');
            // Expected path: /ws/games/:gameId
            const gamesIdx = pathParts.indexOf('games');
            if (gamesIdx !== -1 && pathParts.length > gamesIdx + 1) {
                gameId = pathParts[gamesIdx + 1];
            }
            token = url.searchParams.get('token');
        }
        catch {
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
        const player = (0, migrations_1.getPlayerByToken)(token);
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
        rooms.get(gameId).add(ws);
        clientTokens.set(ws, token);
        console.log(`[WS] Player '${player.displayName}' (${player.seat}) connected to game ${gameId}`);
        // Send current game state on connect
        const loaded = loadGameState(gameId);
        if (loaded) {
            const stateMsg = { type: 'GAME_STATE', state: loaded.state };
            sendToClient(ws, stateMsg);
        }
        // ---- MESSAGE HANDLER ----
        ws.on('message', (data) => {
            let msg;
            try {
                msg = JSON.parse(data.toString());
            }
            catch {
                sendError(ws, 'NOT_AUTHORIZED', 'Invalid JSON message.');
                return;
            }
            handleMessage(ws, gameId, player.seat, msg);
        });
        // ---- DISCONNECT HANDLER ----
        ws.on('close', () => {
            const room = rooms.get(gameId);
            if (room) {
                room.delete(ws);
                if (room.size === 0) {
                    rooms.delete(gameId);
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
function handleMessage(ws, gameId, playerSeat, msg) {
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
    }
    catch (err) {
        if (err instanceof gameEngine_1.GameError) {
            sendError(ws, err.code, err.message);
        }
        else {
            console.error('[WS] Unhandled error:', err);
            sendError(ws, 'NOT_AUTHORIZED', 'Internal server error.');
        }
    }
}
// ---- PLAY_CARD ----
function handlePlayCard(ws, gameId, playerSeat, msg) {
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
    const { newState, logEntry } = (0, gameEngine_1.playCard)(loaded.state, msg.side, msg.cardId, msg.targets ?? []);
    persistState(newState);
    // Broadcast new state to all room members
    const stateMsg = { type: 'GAME_STATE', state: newState };
    broadcast(gameId, stateMsg);
    // Send action result to actor
    const result = { type: 'ACTION_RESULT', logEntry, diff: {} };
    sendToClient(ws, result);
}
// ---- USE_BASIC_ACTION ----
function handleUseBasicAction(ws, gameId, playerSeat, msg) {
    const loaded = loadGameState(gameId);
    if (!loaded) {
        sendError(ws, 'GAME_NOT_RUNNING', 'Game not found.');
        return;
    }
    if (playerSeat !== 'FACILITATOR' && playerSeat !== msg.side) {
        sendError(ws, 'NOT_AUTHORIZED', 'You cannot act for the other seat.');
        return;
    }
    const newState = (0, gameEngine_1.useBasicAction)(loaded.state, msg.side, msg.target);
    persistState(newState);
    const stateMsg = { type: 'GAME_STATE', state: newState };
    broadcast(gameId, stateMsg);
}
// ---- ADVANCE_PHASE ----
function handleAdvancePhase(ws, gameId, msg) {
    const loaded = loadGameState(gameId);
    if (!loaded) {
        sendError(ws, 'GAME_NOT_RUNNING', 'Game not found.');
        return;
    }
    const newState = (0, gameEngine_1.advancePhase)(loaded.state, msg.requestedPhase);
    persistState(newState);
    const stateMsg = { type: 'GAME_STATE', state: newState };
    broadcast(gameId, stateMsg);
}
// ============================================================
// EXPORT getRooms for external use (e.g. broadcasting from REST)
// ============================================================
function broadcastToGame(gameId, message) {
    broadcast(gameId, message);
}
//# sourceMappingURL=wsHandler.js.map