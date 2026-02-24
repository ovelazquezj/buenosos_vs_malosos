# Plan Developer-FRD01 — Backend BuenOsos vs MalOsos (fenyflow)

**Fecha de inicio:** 2026-02-23  
**Rol:** Developer-FRD01  
**Misión:** Construir el backend completo del juego "BuenOsos vs MalOsos"

---

## Stack Técnico
- Node.js + TypeScript
- Express 4
- `ws` (WebSocket nativo, sin socket.io)
- `better-sqlite3` (SQLite sincrono)
- `uuid` para IDs únicos
- Puerto: 3001

---

## Arquitectura General

```
backend/
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── server.ts           ← punto de entrada, Express + HTTP + WS
    ├── types/
    │   └── game.types.ts   ← todos los tipos e interfaces
    ├── engine/
    │   ├── gameEngine.ts   ← orquestador de fases y turno
    │   ├── cascade.ts      ← motor de cascadas por oleadas
    │   ├── campaign.ts     ← gestión de campaña MalOsos
    │   ├── markers.ts      ← cálculo de estabilidad y confianza
    │   └── victory.ts      ← condiciones de victoria
    ├── api/
    │   └── gamesRouter.ts  ← REST API (6 endpoints)
    ├── ws/
    │   └── wsHandler.ts    ← WebSocket handler + rooms
    ├── db/
    │   ├── database.ts     ← inicialización de SQLite
    │   └── migrations.ts   ← schema de tablas
    └── data/
        ├── services.ts     ← 12 servicios del mapa estándar
        └── cards.ts        ← 44 cartas (18 MalOsos + 18 BuenOsos + 8 Eventos)
```

---

## Plan de Ejecución (en orden)

### Paso 1: Crear estructura de directorios
Crear `backend/` con todas las subcarpetas.

### Paso 2: Configurar package.json y tsconfig.json
- Dependencias de producción: express, better-sqlite3, ws, uuid, cors, dotenv
- Dependencias de desarrollo: typescript + todos los @types necesarios, ts-node, nodemon
- Scripts: build, dev, start

### Paso 3: Implementar tipos (types/game.types.ts)
Todos los tipos tal como se especifican, sin modificaciones.

### Paso 4: Implementar datos base
- `data/services.ts`: 12 servicios con criticidad, INT inicial, dependencias, citizenFacing, downEffect
- `data/cards.ts`: 44 cartas completas con efectos estructurados

### Paso 5: Implementar base de datos
- `db/migrations.ts`: schema de 3 tablas (games, players, logs)
- `db/database.ts`: instancia singleton de better-sqlite3

### Paso 6: Implementar motor de juego
En este orden (de menor a mayor dependencia):
1. `engine/campaign.ts` — canPlayCard, completeCampaignPhase, rollbackCampaignPhase
2. `engine/cascade.ts` — resolveCascades, resolveIntermittence (oleadas, max 3)
3. `engine/markers.ts` — calculateMarkers (estabilidad, confianza, penalizaciones)
4. `engine/victory.ts` — checkVictory (condiciones MalOsos y BuenOsos)
5. `engine/gameEngine.ts` — processTurn y funciones por fase (0-5)

### Paso 7: Implementar REST API
`api/gamesRouter.ts` con 6 endpoints:
- POST /api/games (crear partida)
- POST /api/games/:id/join
- GET /api/games/:id
- POST /api/games/:id/start
- POST /api/games/:id/pause
- POST /api/games/:id/resume
- GET /api/games/:id/export

### Paso 8: Implementar WebSocket
`ws/wsHandler.ts`:
- Canal: GET /ws/games/:gameId?token=<token>
- Mensajes: PLAY_CARD, USE_BASIC_ACTION, ADVANCE_PHASE
- Broadcast a sala: GAME_STATE, ACTION_RESULT
- Error al sender: ERROR

### Paso 9: Servidor principal
`server.ts`: integrar Express + HTTP server + WebSocket upgrade

---

## Reglas de Juego Implementadas

### Estados de Servicio
- OK → DEGRADED → INTERMITTENT → DOWN
- DEGRADED pierde -1 INT por turno (mantenimiento)
- INT=0 → DOWN automático, aplica downEffect

### Cascadas (motor crítico)
- Max 3 oleadas por turno
- DEGRADED dep: -1 INT al dependiente
- INTERMITTENT dep: -1 INT + posible INTERMITTENT si 2+ afectados
- DOWN dep: -2 INT al dependiente
- Acumulativo: 2+ deps afectadas → INTERMITTENT

### Campaña MalOsos
- Secuencia: RECON → ACCESS → PERSISTENCE → LATERAL_MOVEMENT → IMPACT
- Máx 1 fase nueva por turno
- Recon básico: no permanente, solo para ese turno

### Marcadores
- Estabilidad: base penalty cap 25, luego criticidad sin cap
- Confianza: afectada por S7/S10/S12 DOWN (-3 cada uno)
- Trust=0: -5 estabilidad por turno
- Clamped: estabilidad [0,100], confianza [0,50]

### Victoria
- MalOsos: estabilidad=0 O 3 servicios crit=5 caídos
- BuenOsos: turno >= límite AND estabilidad > 30 AND 2+ servicios recuperados

---

## Notas de Diseño
- Estado del juego completamente en memoria durante la partida, persistido en SQLite tras cada fase
- WebSocket rooms por gameId (Map<gameId, Set<WebSocket>>)
- Autenticación por token Bearer (UUID simple)
- Validaciones devuelven ErrorCode tipado
- Log de acciones en tabla `logs` de SQLite

---

## Reporte FRD01

**Fecha de finalización:** 2026-02-23
**Estado:** COMPLETADO — build exitoso (0 errores)

---

### Archivos Creados

| Archivo | Descripcion |
|---------|-------------|
| `backend/src/data/cards.ts` | 44 cartas del juego: 18 MalOsos (M01-M18), 18 BuenOsos (B01-B18), 8 Eventos (E01-E08). Exporta ALL_CARDS, MALOSOS_DECK, BUENOSOS_DECK, EVENT_DECK, getCard(id). |
| `backend/src/db/database.ts` | Singleton SQLite con better-sqlite3. WAL + foreign keys habilitados. DB en `data/game.db`. |
| `backend/src/db/migrations.ts` | 3 tablas (games, players, logs) con indices. Exporta saveGame, loadGame, savePlayer, getPlayerByToken, getPlayersByGame, saveLog, getLogsByGame. |
| `backend/src/engine/cascade.ts` | Motor de cascadas por oleadas (max 3). Implementa resolveCascades y resolveIntermittence (modo determinista: turnos impares). Impactos: DEGRADED=-1INT, INTERMITTENT=-1INT, DOWN=-2INT+DEGRADED si OK. Regla acumulativa: 2+ deps afectadas → INTERMITTENT. |
| `backend/src/engine/campaign.ts` | Gestion de campaña MalOsos. canPlayCard, completeCampaignPhase (max 1 por turno), rollbackCampaignPhase, useBasicRecon, resetTurnCampaignState. |
| `backend/src/engine/markers.ts` | Calculo Estabilidad y Confianza en orden exacto: (1) penalizaciones base con tope -25, (2) criticidad (-2 crit=4, -4 crit=5), (3) confianza ciudadana DOWN, (4) reducciones BCP. Modulos: calculateTurnMarkers, applyMarkerUpdate, modifyTrust, modifyStability. |
| `backend/src/engine/victory.ts` | Condiciones de victoria: MalOsos (stability=0 o 3 crit=5 DOWN), BuenOsos (turn>=limit AND stability>30 AND 2+ recuperados). |
| `backend/src/engine/gameEngine.ts` | Orquestador principal. initializeGame, startGame, processPhase (MAINTENANCE/EVENT/CASCADE_EVAL/TURN_END), playCard, useBasicAction, advancePhase. Motor de efectos cubre: damageInt, healInt, setState, setInt, modifyTrust, modifyStability, markCampaignPhase, rollbackCampaignPhase, addTempEffect, setBackupsVerified, discardOpponentCard, eventActivation, y mas. |
| `backend/src/api/gamesRouter.ts` | 6 endpoints REST: POST /api/games, POST /:gameId/join, GET /:gameId, POST /:gameId/start, POST /:gameId/pause, POST /:gameId/resume, GET /:gameId/export. Autenticacion Bearer token. |
| `backend/src/ws/wsHandler.ts` | WebSocket handler. Canal /ws/games/:gameId?token=. Mensajes: PLAY_CARD, USE_BASIC_ACTION, ADVANCE_PHASE. Broadcast GAME_STATE. Map<gameId, Set<WebSocket>> para rooms. |
| `backend/src/server.ts` | Entry point. Express + HTTP + WebSocketServer en puerto 3001. CORS para localhost:5173. Llama runMigrations() al inicio. |

---

### Resultado del Build

```
> buenosos-vs-malosos-backend@1.0.0 build
> tsc
(sin errores — exit code 0)
```

Build exitoso. TypeScript compilado en `backend/dist/`.

---

### Problemas Encontrados y Soluciones

| Problema | Solucion |
|----------|----------|
| `error TS2367` en `markers.ts` linea 80: comparacion imposible `'DEGRADED' | 'INTERMITTENT' | 'DOWN'` con `'OK'` | Se elimino la comparacion redundante. La comprobacion `svc.state === 'OK'` ya ocurre antes de este bloque, por lo que `effectiveState` nunca puede ser `'OK'` en ese punto. |

---

### Notas de Implementacion

- **Motor de efectos de cartas:** Cada efecto en `effects[]` tiene un campo `type` que el motor interpreta en un switch determinista. Los efectos compuestos (como `eventActivation` con `ifTrue`/`ifFalse`) se resuelven recursivamente.
- **Efectos temporales:** Se almacenan en `temporaryEffects[]` con `expiresAtTurn`. Se limpian automaticamente en la fase MAINTENANCE de cada turno.
- **downEffects de S1 y S5:** Implementados como logica hard-coded en `applyDownEffect()` dentro del engine (S1-DOWN → S2 -2 INT; S5-DOWN → S6,S7 -2 INT cada uno).
- **Autenticacion WebSocket:** Token como query param `?token=` en la URL de conexion (estandar para WS ya que los headers de HTTP no estan disponibles en el handshake WS desde el browser).
- **Campaña anti-salto:** `phasesCompletedThisTurn` se resetea en MAINTENANCE. Si ya se completo 1 fase en el turno, las cartas de fase adicionales aplican sus otros efectos pero no avanzan la linea.
- **BCP ManualOp:** Registra el servicio objetivo como `bcpManualOp` en temporaryEffects; el calculo de markers lo usa para tratar ese servicio como DEGRADED en vez de DOWN durante el calculo de penalizaciones.

---

## Sprint 2 — Corrección de bugs de integración

- [BUG-001] FIXED: POST /api/games ahora acepta seat + config anidado, devuelve player
- [BUG-004] FIXED: Código muerto eliminado de markers.ts
- [BUILD] npm run build: exit code 0
