import type { GameState, Player, Seat } from '../types/game.types';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface CreateGameResponse {
  gameId: string;
  token: string;
  player: Player;
  state: GameState;
}

export interface JoinGameResponse {
  gameId: string;
  token: string;
  seat: string;
  displayName: string;
}

export interface GameStateResponse {
  state: GameState;
}

export async function createGame(
  displayName: string,
  seat: Seat | 'FACILITATOR',
  config: { turnLimit: number; budgetPerTurn?: number; intermittenceMode?: string }
): Promise<CreateGameResponse> {
  return apiFetch<CreateGameResponse>('/api/games', {
    method: 'POST',
    body: JSON.stringify({
      displayName,
      seat,
      config: {
        turnLimit: config.turnLimit,
        budgetPerTurn: config.budgetPerTurn ?? 8,
        intermittenceMode: config.intermittenceMode ?? 'deterministic',
        mapId: 'standard',
      },
    }),
  });
}

export async function joinGame(
  gameId: string,
  displayName: string,
  seat: Seat | 'FACILITATOR'
): Promise<JoinGameResponse> {
  return apiFetch<JoinGameResponse>(`/api/games/${gameId}/join`, {
    method: 'POST',
    body: JSON.stringify({ displayName, seat }),
  });
}

export async function getGame(gameId: string, token: string): Promise<GameState> {
  const data = await apiFetch<GameStateResponse>(`/api/games/${gameId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.state;
}

export async function startGame(gameId: string, token: string): Promise<GameState> {
  const data = await apiFetch<GameStateResponse>(`/api/games/${gameId}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.state;
}

export async function pauseGame(gameId: string, token: string): Promise<void> {
  await apiFetch<unknown>(`/api/games/${gameId}/pause`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function resumeGame(gameId: string, token: string): Promise<void> {
  await apiFetch<unknown>(`/api/games/${gameId}/resume`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function exportGame(gameId: string, token: string): Promise<unknown> {
  return apiFetch<unknown>(`/api/games/${gameId}/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
