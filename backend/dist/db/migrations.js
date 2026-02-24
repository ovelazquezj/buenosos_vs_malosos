"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
exports.saveGame = saveGame;
exports.loadGame = loadGame;
exports.listGames = listGames;
exports.savePlayer = savePlayer;
exports.getPlayerByToken = getPlayerByToken;
exports.getPlayersByGame = getPlayersByGame;
exports.saveLog = saveLog;
exports.getLogsByGame = getLogsByGame;
const database_1 = require("./database");
// ============================================================
// MIGRATIONS
// ============================================================
function runMigrations() {
    const db = (0, database_1.getDb)();
    db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id          TEXT PRIMARY KEY,
      created_at  INTEGER NOT NULL,
      status      TEXT NOT NULL CHECK(status IN ('lobby','running','paused','finished')),
      config_json TEXT NOT NULL,
      state_json  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      id           TEXT PRIMARY KEY,
      game_id      TEXT NOT NULL REFERENCES games(id),
      seat         TEXT NOT NULL CHECK(seat IN ('BUENOSOS','MALOSOS','FACILITATOR')),
      display_name TEXT NOT NULL,
      token        TEXT NOT NULL UNIQUE,
      created_at   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logs (
      id         TEXT PRIMARY KEY,
      game_id    TEXT NOT NULL REFERENCES games(id),
      turn       INTEGER NOT NULL,
      phase      TEXT NOT NULL,
      timestamp  INTEGER NOT NULL,
      entry_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
    CREATE INDEX IF NOT EXISTS idx_players_token   ON players(token);
    CREATE INDEX IF NOT EXISTS idx_logs_game_id    ON logs(game_id);
  `);
    console.log('[DB] Migrations applied successfully.');
}
// ============================================================
// GAME PERSISTENCE
// ============================================================
function saveGame(id, status, configJson, stateJson) {
    const db = (0, database_1.getDb)();
    const now = Date.now();
    const existing = db.prepare('SELECT id FROM games WHERE id = ?').get(id);
    if (existing) {
        db.prepare('UPDATE games SET status = ?, config_json = ?, state_json = ? WHERE id = ?').run(status, configJson, stateJson, id);
    }
    else {
        db.prepare('INSERT INTO games (id, created_at, status, config_json, state_json) VALUES (?, ?, ?, ?, ?)').run(id, now, status, configJson, stateJson);
    }
}
function loadGame(id) {
    const db = (0, database_1.getDb)();
    const row = db
        .prepare('SELECT id, status, config_json, state_json, created_at FROM games WHERE id = ?')
        .get(id);
    return row;
}
function listGames() {
    const db = (0, database_1.getDb)();
    return db.prepare('SELECT id, status, created_at FROM games ORDER BY created_at DESC').all();
}
// ============================================================
// PLAYER PERSISTENCE
// ============================================================
function savePlayer(player) {
    const db = (0, database_1.getDb)();
    const existing = db.prepare('SELECT id FROM players WHERE id = ?').get(player.id);
    if (existing) {
        db.prepare('UPDATE players SET game_id = ?, seat = ?, display_name = ?, token = ? WHERE id = ?').run(player.gameId, player.seat, player.displayName, player.token, player.id);
    }
    else {
        db.prepare('INSERT INTO players (id, game_id, seat, display_name, token, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(player.id, player.gameId, player.seat, player.displayName, player.token, player.createdAt);
    }
}
function getPlayerByToken(token) {
    const db = (0, database_1.getDb)();
    const row = db
        .prepare('SELECT id, game_id, seat, display_name, token, created_at FROM players WHERE token = ?')
        .get(token);
    if (!row)
        return undefined;
    return {
        id: row.id,
        gameId: row.game_id,
        seat: row.seat,
        displayName: row.display_name,
        token: row.token,
        createdAt: row.created_at,
    };
}
function getPlayersByGame(gameId) {
    const db = (0, database_1.getDb)();
    const rows = db
        .prepare('SELECT id, game_id, seat, display_name, token, created_at FROM players WHERE game_id = ?')
        .all(gameId);
    return rows.map((row) => ({
        id: row.id,
        gameId: row.game_id,
        seat: row.seat,
        displayName: row.display_name,
        token: row.token,
        createdAt: row.created_at,
    }));
}
// ============================================================
// LOG PERSISTENCE
// ============================================================
function saveLog(gameId, turn, phase, entryJson) {
    const db = (0, database_1.getDb)();
    const entry = JSON.parse(entryJson);
    db.prepare('INSERT INTO logs (id, game_id, turn, phase, timestamp, entry_json) VALUES (?, ?, ?, ?, ?, ?)').run(entry.id, gameId, turn, phase, entry.timestamp, entryJson);
}
function getLogsByGame(gameId) {
    const db = (0, database_1.getDb)();
    const rows = db
        .prepare('SELECT entry_json FROM logs WHERE game_id = ? ORDER BY timestamp ASC')
        .all(gameId);
    return rows.map((row) => JSON.parse(row.entry_json));
}
//# sourceMappingURL=migrations.js.map