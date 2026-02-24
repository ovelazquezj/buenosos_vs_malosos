import { Player, LogEntry } from '../types/game.types';
export declare function runMigrations(): void;
export declare function saveGame(id: string, status: string, configJson: string, stateJson: string): void;
export declare function loadGame(id: string): {
    id: string;
    status: string;
    config_json: string;
    state_json: string;
    created_at: number;
} | undefined;
export declare function listGames(): {
    id: string;
    status: string;
    created_at: number;
}[];
export declare function savePlayer(player: Player): void;
export declare function getPlayerByToken(token: string): Player | undefined;
export declare function getPlayersByGame(gameId: string): Player[];
export declare function saveLog(gameId: string, turn: number, phase: string, entryJson: string): void;
export declare function getLogsByGame(gameId: string): LogEntry[];
//# sourceMappingURL=migrations.d.ts.map