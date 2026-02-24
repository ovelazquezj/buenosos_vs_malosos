"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wss = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
const migrations_1 = require("./db/migrations");
const gamesRouter_1 = __importDefault(require("./api/gamesRouter"));
const wsHandler_1 = require("./ws/wsHandler");
// ============================================================
// CONFIGURATION
// ============================================================
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
// ============================================================
// EXPRESS APP
// ============================================================
const app = (0, express_1.default)();
exports.app = app;
// CORS — allow frontend origin
app.use((0, cors_1.default)({
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express_1.default.json());
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// REST API
app.use('/api/games', gamesRouter_1.default);
// ============================================================
// HTTP + WEBSOCKET SERVER
// ============================================================
const server = http_1.default.createServer(app);
exports.server = server;
const wss = new ws_1.WebSocketServer({
    server,
    path: undefined, // Accept all WS paths; we filter in setupWebSocket
});
exports.wss = wss;
// Handle WS upgrade manually to support /ws/games/:gameId?token=...
server.on('upgrade', (req, socket, head) => {
    const url = req.url ?? '';
    if (url.startsWith('/ws/')) {
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    }
    else {
        socket.destroy();
    }
});
(0, wsHandler_1.setupWebSocket)(wss);
// ============================================================
// STARTUP
// ============================================================
function main() {
    // Run DB migrations before starting
    (0, migrations_1.runMigrations)();
    server.listen(PORT, () => {
        console.log(`[Server] BuenOsos vs MalOsos backend running on port ${PORT}`);
        console.log(`[Server] REST API: http://localhost:${PORT}/api`);
        console.log(`[Server] WebSocket: ws://localhost:${PORT}/ws/games/:gameId?token=<token>`);
        console.log(`[Server] CORS origin: ${FRONTEND_ORIGIN}`);
    });
    server.on('error', (err) => {
        console.error('[Server] Fatal error:', err);
        process.exit(1);
    });
}
main();
//# sourceMappingURL=server.js.map