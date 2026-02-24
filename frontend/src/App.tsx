import { useEffect, useRef, useState } from 'react';
import './App.css';
import { getGame } from './api/gameApi';
import { Board } from './components/Board/Board';
import { Lobby } from './components/Lobby/Lobby';
import { LogPanel } from './components/LogPanel/LogPanel';
import { Markers } from './components/Markers/Markers';
import { PhasePanel } from './components/PhasePanel/PhasePanel';
import { useGame } from './hooks/useGame';
import type { Card, GameState, Seat } from './types/game.types';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

type AppScreen = 'lobby' | 'game';
type MobileTab = 'tablero' | 'mano' | 'log' | 'marcadores';

interface GameSession {
  gameId: string;
  token: string;
  seat: Seat | 'FACILITATOR';
}

const EMPTY_GAME_STATE: GameState = {
  id: '',
  status: 'lobby',
  config: { turnLimit: 8, budgetPerTurn: 8, intermittenceMode: 'deterministic', mapId: 'standard' },
  services: {},
  seats: {
    BUENOSOS: { budgetRemaining: 0, hand: [], deck: [], discard: [], basicActionUsed: false },
    MALOSOS: { budgetRemaining: 0, hand: [], deck: [], discard: [], basicActionUsed: false },
  },
  eventDeck: [],
  eventDiscard: [],
  markers: { stability: 100, trust: 50, turn: 1, phase: 'MAINTENANCE' },
  campaign: { completedPhases: [], reconThisTurn: false, phasesCompletedThisTurn: 0 },
  temporaryEffects: [],
  backupsVerified: false,
  servicesRecovered: [],
  servicesThatWentDown: [],
  log: [],
  createdAt: 0,
  updatedAt: 0,
};

function GameView({
  session,
  onExit,
  cardCatalog,
}: {
  session: GameSession;
  onExit: () => void;
  cardCatalog: Record<string, Card>;
}) {
  const { gameState, connected, error, playCard, useBasicAction, advancePhase } = useGame(
    session.gameId,
    session.token,
    session.seat
  );

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [pendingCard, setPendingCard] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('tablero');

  const activeState: GameState = gameState ?? EMPTY_GAME_STATE;

  const seatState =
    session.seat !== 'FACILITATOR' ? activeState.seats[session.seat] : null;
  const handCardIds = seatState?.hand ?? [];
  const handCards = handCardIds.map(id =>
    cardCatalog[id] ?? ({
      id, name: id, side: 'BUENOSOS' as const, category: 'PREVENTION' as const,
      cost: 1, effects: [], duration: 'immediate' as const,
    })
  );

  const handlePlayCard = (cardId: string) => {
    const card = handCards.find(c => c.id === cardId);
    if (card?.targeting) {
      setPendingCard(cardId);
    } else {
      playCard(cardId, []);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    if (pendingCard) {
      const newSelected = selectedServices.includes(serviceId)
        ? selectedServices.filter(s => s !== serviceId)
        : [...selectedServices, serviceId];
      setSelectedServices(newSelected);
      // Auto-confirm single target
      playCard(pendingCard, newSelected);
      setPendingCard(null);
      setSelectedServices([]);
    }
  };

  const handleBasicAction = () => {
    useBasicAction();
  };

  const renderBoard = () => (
    <Board
      gameState={activeState}
      onServiceSelect={pendingCard ? handleServiceSelect : undefined}
      selectedServices={selectedServices}
    />
  );

  const renderPhasePanel = () => (
    <PhasePanel
      gameState={activeState}
      seat={session.seat}
      cards={handCards}
      onPlayCard={handlePlayCard}
      onBasicAction={handleBasicAction}
      onAdvancePhase={advancePhase}
    />
  );

  const renderLog = () => <LogPanel log={activeState.log} />;

  const renderMarkers = () => (
    <Markers markers={activeState.markers} turnLimit={activeState.config.turnLimit} />
  );

  const TABS: { id: MobileTab; label: string }[] = [
    { id: 'tablero', label: 'Tablero' },
    { id: 'mano', label: 'Mano' },
    { id: 'log', label: 'Log' },
    { id: 'marcadores', label: 'Marcadores' },
  ];

  return (
    <div className="app-game">
      <header className="game-header">
        <div className="game-title">
          <span className="buenos">BuenOsos</span>
          <span className="vs"> vs </span>
          <span className="malos">MalOsos</span>
        </div>
        <div className="game-status">
          <span className={`conn-dot ${connected ? 'conn-ok' : 'conn-off'}`} />
          <span className="game-id">#{session.gameId.slice(0, 8)}</span>
          <span className="seat-badge seat-{session.seat.toLowerCase()}">{session.seat}</span>
        </div>
        <div className="header-actions">
          {activeState.winner && (
            <span className="winner-banner">
              Ganador: {activeState.winner === 'BUENOSOS' ? 'BuenOsos' : 'MalOsos'}
            </span>
          )}
          <button className="exit-btn" onClick={onExit} type="button">
            Salir
          </button>
        </div>
      </header>

      {error && <div className="conn-error">{error}</div>}
      {pendingCard && (
        <div className="target-hint">Selecciona un servicio como objetivo</div>
      )}

      {/* Desktop layout */}
      <div className="layout-desktop">
        <div className="layout-top">{renderMarkers()}</div>
        <div className="layout-main">
          <div className="layout-center">{renderBoard()}</div>
          <div className="layout-right">
            {renderPhasePanel()}
            {renderLog()}
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="layout-mobile">
        <nav className="mobile-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`mobile-tab ${mobileTab === tab.id ? 'active' : ''}`}
              onClick={() => setMobileTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="mobile-content">
          {mobileTab === 'tablero' && renderBoard()}
          {mobileTab === 'mano' && renderPhasePanel()}
          {mobileTab === 'log' && renderLog()}
          {mobileTab === 'marcadores' && renderMarkers()}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('lobby');
  const [session, setSession] = useState<GameSession | null>(null);
  const [cardCatalog, setCardCatalog] = useState<Record<string, Card>>({});
  const catalogFetched = useRef(false);

  // Fetch card catalog once on mount
  useEffect(() => {
    if (catalogFetched.current) return;
    catalogFetched.current = true;
    fetch(`${BASE_URL}/api/cards`)
      .then(r => r.json())
      .then((data: { cards: Card[] }) => {
        const catalog: Record<string, Card> = {};
        for (const card of data.cards) catalog[card.id] = card;
        setCardCatalog(catalog);
      })
      .catch(() => { /* silently ignore — fallback placeholders will show */ });
  }, []);

  // Try to restore session from localStorage
  useEffect(() => {
    const storedGameId = localStorage.getItem('gameId');
    const storedToken = localStorage.getItem('token');
    const storedSeat = localStorage.getItem('seat') as (Seat | 'FACILITATOR') | null;
    if (storedGameId && storedToken && storedSeat) {
      getGame(storedGameId, storedToken)
        .then(gs => {
          if (gs.status === 'running' || gs.status === 'paused') {
            setSession({ gameId: storedGameId, token: storedToken, seat: storedSeat });
            setScreen('game');
          }
        })
        .catch(() => {
          // Session expired or invalid — stay on lobby
        });
    }
  }, []);

  const handleGameJoined = (gameId: string, token: string, seat: Seat | 'FACILITATOR') => {
    setSession({ gameId, token, seat });
    setScreen('game');
  };

  const handleExit = () => {
    localStorage.removeItem('gameId');
    localStorage.removeItem('token');
    localStorage.removeItem('seat');
    setSession(null);
    setScreen('lobby');
  };

  if (screen === 'game' && session) {
    return <GameView session={session} onExit={handleExit} cardCatalog={cardCatalog} />;
  }

  return <Lobby onGameJoined={handleGameJoined} />;
}
