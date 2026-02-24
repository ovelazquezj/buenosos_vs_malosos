import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState } from '../types/game.types';

const WS_BASE = (import.meta.env.VITE_API_URL as string | undefined)
  ? (import.meta.env.VITE_API_URL as string).replace(/^http/, 'ws')
  : 'ws://localhost:3001';

export interface WsMessage {
  type: string;
  payload?: unknown;
}

export interface UseWebSocketResult {
  gameState: GameState | null;
  sendMessage: (msg: WsMessage) => void;
  connected: boolean;
  error: string | null;
}

export function useWebSocket(gameId: string | null, token: string | null): UseWebSocketResult {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const mountedRef = useRef(true);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!gameId || !token) return;

    const url = `${WS_BASE}/ws/games/${gameId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      setError(null);
      retriesRef.current = 0;
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        if (msg.type === 'GAME_STATE') {
          setGameState(msg.payload as GameState);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setError('Error de conexion WebSocket');
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      if (retriesRef.current < 3) {
        const delay = Math.pow(2, retriesRef.current) * 1000;
        retriesRef.current += 1;
        retryTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      } else {
        setError('No se pudo reconectar al servidor');
      }
    };
  }, [gameId, token]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const sendMessage = useCallback((msg: WsMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { gameState, sendMessage, connected, error };
}
