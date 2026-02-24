"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.closeDb = closeDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let db = null;
const DB_DIR = path_1.default.resolve(__dirname, '../../data');
const DB_PATH = path_1.default.join(DB_DIR, 'game.db');
function getDb() {
    if (db) {
        return db;
    }
    // Ensure the data directory exists
    if (!fs_1.default.existsSync(DB_DIR)) {
        fs_1.default.mkdirSync(DB_DIR, { recursive: true });
    }
    db = new better_sqlite3_1.default(DB_PATH);
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    // Enable foreign key enforcement
    db.pragma('foreign_keys = ON');
    return db;
}
function closeDb() {
    if (db) {
        db.close();
        db = null;
    }
}
//# sourceMappingURL=database.js.map