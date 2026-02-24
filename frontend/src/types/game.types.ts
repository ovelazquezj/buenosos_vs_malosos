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

export interface Service {
  id: string;
  name: string;
  crit: number;
  int: number;
  intMax: number;
  state: ServiceState;
  dependencies: string[];
  citizenFacing?: boolean;
}

export interface Card {
  id: string;
  name: string;
  side: 'MALOSOS' | 'BUENOSOS' | 'EVENT';
  category: CardCategory;
  cost: number;
  requirements?: string[];
  targeting?: string;
  effects: unknown[];
  duration: string;
  isHighImpact?: boolean;
}

export interface GameMarkers {
  stability: number;
  trust: number;
  turn: number;
  phase: TurnPhase;
}

export interface CampaignState {
  completedPhases: CampaignPhase[];
  reconThisTurn: boolean;
  phasesCompletedThisTurn: number;
}

export interface SeatState {
  budgetRemaining: number;
  hand: string[];
  deck: string[];
  discard: string[];
  basicActionUsed: boolean;
}

export interface GameState {
  id: string;
  status: GameStatus;
  config: {
    turnLimit: number;
    budgetPerTurn: number;
    intermittenceMode: string;
  };
  services: Record<string, Service>;
  seats: Record<Seat, SeatState>;
  eventDeck: string[];
  eventDiscard: string[];
  markers: GameMarkers;
  campaign: CampaignState;
  temporaryEffects: unknown[];
  winner?: Seat;
  backupsVerified: boolean;
  servicesRecovered: string[];
  servicesThatWentDown: string[];
  log: unknown[];
}

export interface Player {
  id: string;
  gameId: string;
  seat: Seat | 'FACILITATOR';
  displayName: string;
  token: string;
}
