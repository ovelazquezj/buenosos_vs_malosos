export type ServiceState = 'OK' | 'DEGRADED' | 'INTERMITTENT' | 'DOWN';
export type Seat = 'BUENOSOS' | 'MALOSOS';
export type CampaignPhase = 'RECON' | 'ACCESS' | 'PERSISTENCE' | 'LATERAL_MOVEMENT' | 'IMPACT';
export type TurnPhase =
  | 'MAINTENANCE'
  | 'EVENT'
  | 'MALOSOS_PREP'
  | 'MALOSOS_ATTACK'
  | 'BUENOSOS_RESPONSE'
  | 'CASCADE_EVAL'
  | 'TURN_END';
export type GameStatus = 'lobby' | 'running' | 'paused' | 'finished';
export type CardSide = 'MALOSOS' | 'BUENOSOS' | 'EVENT';
export type CardCategory =
  | 'RECON'
  | 'ACCESS'
  | 'PERSISTENCE'
  | 'LATERAL_MOVEMENT'
  | 'IMPACT'
  | 'IMPACT_ALTO'
  | 'RESOURCE'
  | 'SOCIAL'
  | 'PREVENTION'
  | 'DETECTION_RESPONSE'
  | 'DRP'
  | 'BCP'
  | 'TAIL_RISK';
export type Duration = 'immediate' | 'turn' | 'permanent' | 'game';

export interface Service {
  id: string;
  name: string;
  crit: 1 | 2 | 3 | 4 | 5;
  int: number;
  intMax: number;
  state: ServiceState;
  dependencies: string[]; // service ids
  citizenFacing?: boolean; // S7, S10, S12 → affect trust
  downEffect?: string;
}

export interface CardEffect {
  type: string;
  [key: string]: unknown;
}

export interface Card {
  id: string;
  name: string;
  side: CardSide;
  category: CardCategory;
  subtype?: string;
  cost: number;
  requirements?: string[]; // campaign phases or card ids required
  targeting?: string; // 'digital' | 'physical' | 'any' | 'citizen' | specific service id
  effects: CardEffect[];
  duration: Duration;
  isHighImpact?: boolean;
}

export interface CampaignState {
  completedPhases: CampaignPhase[];
  reconThisTurn: boolean; // basic action recon (non-permanent)
  phasesCompletedThisTurn: number; // max 1 per turn
}

export interface TemporaryEffect {
  id: string;
  type: string;
  targetId?: string;
  expiresAtPhase?: TurnPhase;
  expiresAtTurn?: number;
  value?: number;
  [key: string]: unknown;
}

export interface GameConfig {
  turnLimit: number; // default 8
  budgetPerTurn: number; // default 8
  intermittenceMode: 'deterministic' | 'random'; // default deterministic
  mapId: string; // 'standard'
}

export interface GameMarkers {
  stability: number; // 0-100, starts at 100
  trust: number; // 0-50, starts at 50
  turn: number; // starts at 1
  phase: TurnPhase;
}

export interface SeatState {
  budgetRemaining: number;
  hand: string[]; // card ids
  deck: string[]; // card ids
  discard: string[]; // card ids
  basicActionUsed: boolean;
}

export interface GameState {
  id: string;
  status: GameStatus;
  config: GameConfig;
  services: Record<string, Service>;
  seats: Record<Seat, SeatState>;
  eventDeck: string[];
  eventDiscard: string[];
  markers: GameMarkers;
  campaign: CampaignState;
  temporaryEffects: TemporaryEffect[];
  winner?: Seat;
  backupsVerified: boolean; // true once 'Backups verificados' card is played
  servicesRecovered: string[]; // service ids that have been recovered from DOWN
  servicesThatWentDown: string[]; // all services that ever went DOWN
  log: LogEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface LogEntry {
  id: string;
  turn: number;
  phase: TurnPhase;
  timestamp: number;
  action: string;
  actor?: Seat;
  details: unknown;
  before?: unknown;
  after?: unknown;
}

export interface Player {
  id: string;
  gameId: string;
  seat: Seat | 'FACILITATOR';
  displayName: string;
  token: string;
  createdAt: number;
}

export type ErrorCode =
  | 'INVALID_PHASE'
  | 'INSUFFICIENT_BUDGET'
  | 'INVALID_TARGET'
  | 'CARD_REQUIREMENTS_NOT_MET'
  | 'GAME_NOT_RUNNING'
  | 'NOT_AUTHORIZED';

// WebSocket messages
export interface WsPlayCard {
  type: 'PLAY_CARD';
  gameId: string;
  side: Seat;
  cardId: string;
  targets: string[]; // service ids or other targets
}

export interface WsUseBasicAction {
  type: 'USE_BASIC_ACTION';
  gameId: string;
  side: Seat;
  target?: string;
}

export interface WsAdvancePhase {
  type: 'ADVANCE_PHASE';
  gameId: string;
  requestedPhase: TurnPhase;
}

export interface WsGameState {
  type: 'GAME_STATE';
  state: GameState;
}

export interface WsActionResult {
  type: 'ACTION_RESULT';
  logEntry: LogEntry;
  diff: unknown;
}

export interface WsError {
  type: 'ERROR';
  code: ErrorCode;
  message: string;
}

export type WsIncomingMessage = WsPlayCard | WsUseBasicAction | WsAdvancePhase;
