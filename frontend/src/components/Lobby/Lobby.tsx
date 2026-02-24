import { useState } from 'react';
import { createGame, joinGame, startGame } from '../../api/gameApi';
import type { Seat } from '../../types/game.types';
import styles from './Lobby.module.css';

interface LobbyProps {
  onGameJoined: (gameId: string, token: string, seat: Seat | 'FACILITATOR') => void;
}

type SeatOption = Seat | 'FACILITATOR';

export function Lobby({ onGameJoined }: LobbyProps) {
  const [displayName, setDisplayName] = useState('');
  const [createSeat, setCreateSeat] = useState<SeatOption>('BUENOSOS');
  const [turnLimit, setTurnLimit] = useState(8);
  const [joinGameId, setJoinGameId] = useState('');
  const [joinSeat, setJoinSeat] = useState<SeatOption>('MALOSOS');
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!displayName.trim()) { setErrorMsg('Ingresa tu nombre'); return; }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await createGame(displayName.trim(), createSeat, { turnLimit });
      setCreatedGameId(res.gameId);
      setCreatedToken(res.token);
      localStorage.setItem('gameId', res.gameId);
      localStorage.setItem('token', res.token);
      localStorage.setItem('seat', createSeat);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al crear partida');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!createdGameId || !createdToken) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await startGame(createdGameId, createdToken);
      onGameJoined(createdGameId, createdToken, createSeat);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al iniciar partida');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!displayName.trim()) { setErrorMsg('Ingresa tu nombre'); return; }
    if (!joinGameId.trim()) { setErrorMsg('Ingresa el codigo de partida'); return; }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await joinGame(joinGameId.trim(), displayName.trim(), joinSeat);
      localStorage.setItem('gameId', joinGameId.trim());
      localStorage.setItem('token', res.token);
      localStorage.setItem('seat', joinSeat);
      onGameJoined(joinGameId.trim(), res.token, joinSeat);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al unirse a partida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.lobby}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.buenos}>BuenOsos</span>
          <span className={styles.vs}> vs </span>
          <span className={styles.malos}>MalOsos</span>
        </h1>
        <p className={styles.subtitle}>Juego de ciberseguridad - Infraestructura critica</p>
      </header>

      {errorMsg && <div className={styles.error}>{errorMsg}</div>}

      <div className={styles.nameField}>
        <label htmlFor="displayName">Tu nombre</label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Nombre del jugador"
          className={styles.input}
        />
      </div>

      <div className={styles.sections}>
        <section className={styles.section}>
          <h2>Nueva partida</h2>
          <div className={styles.field}>
            <label>Asiento</label>
            <select
              value={createSeat}
              onChange={e => setCreateSeat(e.target.value as SeatOption)}
              className={styles.select}
            >
              <option value="BUENOSOS">BuenOsos (defensores)</option>
              <option value="MALOSOS">MalOsos (atacantes)</option>
              <option value="FACILITATOR">Facilitador</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Turnos limite</label>
            <select
              value={turnLimit}
              onChange={e => setTurnLimit(Number(e.target.value))}
              className={styles.select}
            >
              <option value={5}>5 turnos (rapido)</option>
              <option value={8}>8 turnos (estandar)</option>
              <option value={10}>10 turnos (extendido)</option>
            </select>
          </div>
          {!createdGameId ? (
            <button
              className={styles.btnPrimary}
              onClick={() => void handleCreate()}
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear partida'}
            </button>
          ) : (
            <div className={styles.gameCode}>
              <p>Codigo de partida:</p>
              <code className={styles.codeBox}>{createdGameId}</code>
              <p className={styles.shareHint}>Comparte este codigo con el otro jugador</p>
              <button
                className={styles.btnPrimary}
                onClick={() => void handleStart()}
                disabled={loading}
              >
                {loading ? 'Iniciando...' : 'Iniciar partida'}
              </button>
            </div>
          )}
        </section>

        <div className={styles.divider} />

        <section className={styles.section}>
          <h2>Unirse a partida</h2>
          <div className={styles.field}>
            <label>Codigo de partida</label>
            <input
              type="text"
              value={joinGameId}
              onChange={e => setJoinGameId(e.target.value)}
              placeholder="ej: abc123"
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label>Asiento</label>
            <select
              value={joinSeat}
              onChange={e => setJoinSeat(e.target.value as SeatOption)}
              className={styles.select}
            >
              <option value="BUENOSOS">BuenOsos (defensores)</option>
              <option value="MALOSOS">MalOsos (atacantes)</option>
              <option value="FACILITATOR">Facilitador</option>
            </select>
          </div>
          <button
            className={styles.btnSecondary}
            onClick={() => void handleJoin()}
            disabled={loading}
          >
            {loading ? 'Uniendose...' : 'Unirse'}
          </button>
        </section>
      </div>
    </div>
  );
}
