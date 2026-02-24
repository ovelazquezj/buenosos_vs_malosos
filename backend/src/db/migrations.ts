import { getDb } from './database';
import { Player, GameState, LogEntry } from '../types/game.types';

// ============================================================
// MIGRATIONS
// ============================================================

export function runMigrations(): void {
  const db = getDb();

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

export function saveGame(
  id: string,
  status: string,
  configJson: string,
  stateJson: string
): void {
  const db = getDb();
  const now = Date.now();

  const existing = db.prepare('SELECT id FROM games WHERE id = ?').get(id);

  if (existing) {
    db.prepare(
      'UPDATE games SET status = ?, config_json = ?, state_json = ? WHERE id = ?'
    ).run(status, configJson, stateJson, id);
  } else {
    db.prepare(
      'INSERT INTO games (id, created_at, status, config_json, state_json) VALUES (?, ?, ?, ?, ?)'
    ).run(id, now, status, configJson, stateJson);
  }
}

export function loadGame(id: string): { id: string; status: string; config_json: string; state_json: string; created_at: number } | undefined {
  const db = getDb();
  const row = db
    .prepare('SELECT id, status, config_json, state_json, created_at FROM games WHERE id = ?')
    .get(id) as { id: string; status: string; config_json: string; state_json: string; created_at: number } | undefined;
  return row;
}

export function listGames(): { id: string; status: string; created_at: number }[] {
  const db = getDb();
  return db.prepare('SELECT id, status, created_at FROM games ORDER BY created_at DESC').all() as { id: string; status: string; created_at: number }[];
}

// ============================================================
// PLAYER PERSISTENCE
// ============================================================

export function savePlayer(player: Player): void {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM players WHERE id = ?').get(player.id);

  if (existing) {
    db.prepare(
      'UPDATE players SET game_id = ?, seat = ?, display_name = ?, token = ? WHERE id = ?'
    ).run(player.gameId, player.seat, player.displayName, player.token, player.id);
  } else {
    db.prepare(
      'INSERT INTO players (id, game_id, seat, display_name, token, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      player.id,
      player.gameId,
      player.seat,
      player.displayName,
      player.token,
      player.createdAt
    );
  }
}

export function getPlayerByToken(token: string): Player | undefined {
  const db = getDb();
  const row = db
    .prepare('SELECT id, game_id, seat, display_name, token, created_at FROM players WHERE token = ?')
    .get(token) as { id: string; game_id: string; seat: string; display_name: string; token: string; created_at: number } | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    gameId: row.game_id,
    seat: row.seat as Player['seat'],
    displayName: row.display_name,
    token: row.token,
    createdAt: row.created_at,
  };
}

export function getPlayersByGame(gameId: string): Player[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, game_id, seat, display_name, token, created_at FROM players WHERE game_id = ?')
    .all(gameId) as { id: string; game_id: string; seat: string; display_name: string; token: string; created_at: number }[];

  return rows.map((row) => ({
    id: row.id,
    gameId: row.game_id,
    seat: row.seat as Player['seat'],
    displayName: row.display_name,
    token: row.token,
    createdAt: row.created_at,
  }));
}

// ============================================================
// LOG PERSISTENCE
// ============================================================

export function saveLog(
  gameId: string,
  turn: number,
  phase: string,
  entryJson: string
): void {
  const db = getDb();
  const entry = JSON.parse(entryJson) as LogEntry;

  db.prepare(
    'INSERT INTO logs (id, game_id, turn, phase, timestamp, entry_json) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(entry.id, gameId, turn, phase, entry.timestamp, entryJson);
}

export function getLogsByGame(gameId: string): LogEntry[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT entry_json FROM logs WHERE game_id = ? ORDER BY timestamp ASC')
    .all(gameId) as { entry_json: string }[];

  return rows.map((row) => JSON.parse(row.entry_json) as LogEntry);
}
