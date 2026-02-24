import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { runMigrations } from './db/migrations';
import gamesRouter from './api/gamesRouter';
import { setupWebSocket } from './ws/wsHandler';

// ============================================================
// CONFIGURATION
// ============================================================

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

// ============================================================
// EXPRESS APP
// ============================================================

const app = express();

// CORS — allow frontend origin
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// REST API
app.use('/api/games', gamesRouter);

// ============================================================
// HTTP + WEBSOCKET SERVER
// ============================================================

const server = http.createServer(app);

const wss = new WebSocketServer({
  server,
  path: undefined, // Accept all WS paths; we filter in setupWebSocket
});

// Handle WS upgrade manually to support /ws/games/:gameId?token=...
server.on('upgrade', (req, socket, head) => {
  const url = req.url ?? '';
  if (url.startsWith('/ws/')) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

setupWebSocket(wss);

// ============================================================
// STARTUP
// ============================================================

function main(): void {
  // Run DB migrations before starting
  runMigrations();

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

export { app, server, wss };
