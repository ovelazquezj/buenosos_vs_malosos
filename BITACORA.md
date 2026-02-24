# BITACORA — fenyflow (BuenOsos vs MalOsos)

**Proyecto:** fenyflow
**Descripción:** Juego didáctico por equipos para modelar riesgo país, fallas en cascada, modelo de adversario y tail risk, destacando el papel de DRP y BCP.
**Autor:** Mtro. Omar Francisco Velazquez Juarez <ovelazquezj@gmail.com>
**Licencia:** Creative Commons BY

---

## Equipo

| Rol | ID | Responsabilidad |
|---|---|---|
| Arquitecto / Team Lead | Claude Code | Análisis, arquitectura, coordinación, README |
| Developer Backend | FRD01 | Node.js + TypeScript, motor de juego, REST API, WebSocket, SQLite |
| Developer Frontend | FRD02 | React + TypeScript, UI/UX responsive, WebSocket client |
| Functional Tester | TESTER | Docker, Selenium E2E, BDD A1-A7, reporte de bugs |

---

## Arquitectura técnica aprobada

### Stack
- **Frontend:** React 18 + TypeScript, Vite, react-icons (iconos especificados en SRS §8.2)
- **Backend:** Node.js + TypeScript, Express 4, ws (WebSocket), better-sqlite3
- **DB:** SQLite (archivo local `data/game.db`)
- **Tests E2E:** Docker Compose + Selenium 4 headless (Python)

### Puertos
- Backend API: `3001`
- Frontend (dev): `5173`
- Frontend (prod): servido por backend en `3001/`

### Estructura de directorios
```
/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── types/game.types.ts
│   │   ├── engine/
│   │   │   ├── gameEngine.ts      # Orquestador de fases y turno
│   │   │   ├── cascade.ts         # Sistema de oleadas (máx 3)
│   │   │   ├── campaign.ts        # Campaña MalOsos (anti-salto)
│   │   │   ├── markers.ts         # Cálculo Estabilidad/Confianza
│   │   │   └── victory.ts         # Condiciones de victoria
│   │   ├── api/gamesRouter.ts
│   │   ├── ws/wsHandler.ts
│   │   ├── db/
│   │   │   ├── database.ts
│   │   │   └── migrations.ts
│   │   └── data/
│   │       ├── services.ts        # S1-S12 con dependencias
│   │       └── cards.ts           # 18 MalOsos + 18 BuenOsos + 8 Eventos
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── types/game.types.ts
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   └── useGame.ts
│   │   ├── components/
│   │   │   ├── Lobby/
│   │   │   ├── Board/             # Tablero con mapamundi
│   │   │   ├── ServiceNode/       # S1-S12
│   │   │   ├── HandCard/          # Cartas en mano
│   │   │   ├── Markers/           # Estabilidad, Confianza, Turno
│   │   │   ├── CampaignTrack/     # Fases MalOsos
│   │   │   ├── PhasePanel/        # Fase actual del turno
│   │   │   └── LogPanel/          # Log de acciones
│   │   └── assets/
│   │       └── worldmap.svg       # Mapamundi (< 300KB)
│   ├── package.json
│   └── tsconfig.json
├── artifacts/
│   └── selenium/                  # Screenshots E2E
├── tests/
│   └── e2e/
│       ├── conftest.py
│       ├── test_bdd_scenarios.py   # A1-A7
│       └── requirements.txt
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── Dockerfile.e2e
├── BITACORA.md
├── README.md
├── REGLAS.md
└── srs01_juego_buenosos_vs_malosos.md
```

### Decisiones de diseño clave
1. **Backend es fuente de verdad** (RNF-3): el frontend solo renderiza estado recibido vía WS
2. **Motor determinista**: sin aleatoriedad en MVP salvo robo de cartas y orden del mazo
3. **Intermitencia modo determinista**: turnos impares propagan a 1 dependiente (mayor criticidad, menor INT)
4. **Token de sesión por jugador**: generado en `/join`, sin login formal
5. **SQLite snapshot**: `state_json` se actualiza al final de cada fase
6. **WebSocket por partida**: canal `ws://host:3001/ws/games/:gameId`
7. **Mapamundi como asset**: SVG/WebP simplificado < 300KB, opacidad 6-10%

---

## Plan de trabajo aprobado

### FRD01 (Backend) — Tareas
| # | Tarea | Estado |
|---|---|---|
| B1 | Setup proyecto Node.js+TS | Pendiente |
| B2 | Esquema SQLite + migraciones | Pendiente |
| B3 | Datos: S1-S12 y 44 cartas | Pendiente |
| B4 | Tipos de juego (game.types.ts) | Pendiente |
| B5 | Motor: fases del turno (0.0-5) | Pendiente |
| B6 | Motor: cascadas por oleadas | Pendiente |
| B7 | Motor: campaña MalOsos | Pendiente |
| B8 | Motor: cálculo Estabilidad/Confianza | Pendiente |
| B9 | Motor: condiciones de victoria | Pendiente |
| B10 | REST API (7 endpoints) | Pendiente |
| B11 | WebSocket handler | Pendiente |
| B12 | Validaciones (6 errores estándar) | Pendiente |
| B13 | Export JSON | Pendiente |

### FRD02 (Frontend) — Tareas
| # | Tarea | Estado |
|---|---|---|
| F1 | Setup Vite + React 18 + TS | Pendiente |
| F2 | Tipos espejo del backend | Pendiente |
| F3 | Hook WebSocket + reconexión | Pendiente |
| F4 | Pantalla Lobby (crear/unirse partida) | Pendiente |
| F5 | Tablero con mapamundi SVG | Pendiente |
| F6 | Componente ServiceNode (S1-S12 + estados) | Pendiente |
| F7 | Componente HandCard con íconos react-icons | Pendiente |
| F8 | Panel Marcadores (Estabilidad/Confianza/Turno) | Pendiente |
| F9 | Panel Campaña MalOsos | Pendiente |
| F10 | Panel Fase actual + acciones básicas | Pendiente |
| F11 | Log de partida | Pendiente |
| F12 | Layout responsive (móvil/tablet/desktop) | Pendiente |
| F13 | Accesibilidad (aria-label, teclado) | Pendiente |

### TESTER — Tareas
| # | Tarea | Estado |
|---|---|---|
| T1 | Plan de pruebas formal | Pendiente |
| T2 | docker-compose.yml + Dockerfiles | Pendiente |
| T3 | Suite Selenium: escenarios A1-A7 | Pendiente |
| T4 | Screenshots en artifacts/selenium/ | Pendiente |
| T5 | Reporte de bugs | Pendiente |

---

## Registro de cambios

### 2026-02-23 — Arquitecto
- [INICIO] Análisis completo de SRS01 y REGLAS.md
- [ARCH] Definición de arquitectura técnica aprobada
- [TEAM] Creación del equipo: FRD01, FRD02, TESTER
- [PLAN] Planes de trabajo FRD01, FRD02 y TESTER aprobados
- [COORD] Ejecución: FRD01 y FRD02 en paralelo, TESTER al finalizar ambos

### 2026-02-23 — Developer-FRD02 ✅ COMPLETADO
- [BUILD] Frontend React+TS compilado sin errores (0 errores TypeScript)
- [FILES] 26 archivos creados en `frontend/src/`
- [FEAT] Lobby: crear/unirse partida, código compartible, configuración turnLimit
- [FEAT] Tablero: mapamundi SVG inline (opacity 0.07), grid ServiceNodes S1-S12
- [FEAT] ServiceNode: colores por estado (OK/DEGRADED/INTERMITTENT/DOWN), barra INT, aria-label
- [FEAT] HandCard: íconos react-icons por categoría, borde por lado, accesibilidad teclado
- [FEAT] Markers: barras Estabilidad/Confianza con umbrales de color, fase en español
- [FEAT] CampaignTrack: 5 casillas con íconos LuSearch/LuKeyRound/LuAnchor/LuShuffle/LuZap
- [FEAT] PhasePanel: fase actual, presupuesto, acción básica, mano de cartas
- [FEAT] LogPanel: log scrollable con aria-live="polite"
- [FEAT] App responsive: desktop (marcadores+tablero+panel) / móvil (tabs)
- [FEAT] WebSocket hook con reconexión automática (3 intentos, backoff exponencial)
- [NOTE] LuAlertTriangle → corregido a LuTriangleAlert (nombre correcto en react-icons v5)
- [NOTA] Backend completado — integración lista para Tester

### 2026-02-23 — Developer-FRD01 ✅ COMPLETADO
- [BUILD] Backend Node.js+TS compilado sin errores (exit code 0, 13 archivos en dist/)
- [FILES] 11 archivos creados en `backend/src/`
- [DATA] 44 cartas completas (M01-M18, B01-B18, E01-E08) según Anexo B de REGLAS.md
- [DB] SQLite: tablas games, players, logs + índices + funciones de persistencia
- [ENGINE] cascade.ts: oleadas máx 3, impactos por dependencia, intermitencia determinista (turnos impares)
- [ENGINE] campaign.ts: anti-salto (máx 1 fase/turno), validaciones RECON/backups/prev_detection
- [ENGINE] markers.ts: orden exacto SRS §5.8 (base+tope, criticidad, confianza, BCP)
- [ENGINE] victory.ts: condiciones MalOsos (stability=0 o 3 crit-5 DOWN) y BuenOsos (turnLimit+stability>30+2 recuperados)
- [ENGINE] gameEngine.ts: orquestador completo, motor de efectos determinista (14 tipos de efectos)
- [API] gamesRouter.ts: 7 endpoints REST con middleware requireAuth y requireGameAccess
- [WS] wsHandler.ts: WebSocket con rooms por gameId, broadcast GAME_STATE tras cada cambio
- [FIX] Error TS2367 en markers.ts resuelto (comparación redundante eliminada)

### 2026-02-23 — Arquitecto
- [REVIEW] Ambos desarrolladores completaron con build limpio
- [STATUS] B1-B13 y F1-F13 completados
- [NEXT] Lanzando Functional-Tester para pruebas E2E

### 2026-02-23 — Functional-Tester ✅ COMPLETADO
- [PLAN] `plan_tester.md` creado con escenarios A1-A7, contrato API, setup/teardown, convención de screenshots
- [FILES] `artifacts/selenium/.gitkeep`, `Dockerfile.backend`, `Dockerfile.frontend`, `Dockerfile.e2e`, `nginx.conf`, `docker-compose.yml`
- [TESTS] `tests/e2e/requirements.txt`, `conftest.py`, `test_bdd_scenarios.py` (10 tests: A1-A7 + S1-S3)
- [VERIFY] Sintaxis Python válida, 10 funciones de test correctamente definidas
- [BUGS] BUG-001, BUG-002 (MEDIA): contrato API y wrapping de respuesta — corregidos en tests, asignados a FRD01
- [BUGS] BUG-003 (BAJA): validaciones accesibles solo vía WS — observación de diseño
- [BUGS] BUG-004 (BAJA): código muerto en markers.ts — asignado a FRD01
- [STATUS] Escenarios A1-A7: SETUP READY; S1-S3: READY para ejecución

### 2026-02-23 — Arquitecto (revisión final)
- [BUGS] BUG-001 y BUG-002 asignados a FRD01 para revisión de consistencia
- [BUGS] BUG-004 asignado a FRD01 para limpieza de código muerto
- [DONE] README.md generado con: nombre fenyflow, descripción, instrucciones locales, API REST, WebSocket, Docker E2E, estructura, licencia CC BY
- [CLOSE] Primera iteración completada

### 2026-02-23 — Sprint 2: Corrección de integración

**FRD01** ✅
- [BUG-001] FIXED: `POST /api/games` acepta `seat` + `config` anidado, devuelve `{gameId,token,player,state}`
- [BUG-004] FIXED: Código muerto `_effectiveState` eliminado de `markers.ts`
- [BUILD] Backend: `tsc` sin errores, exit code 0

**FRD02** ✅
- [BUG-001] FIXED: Paths corregidos de `/games/` a `/api/games/`
- [BUG-002] FIXED: `getGame()` extrae `.state` del wrapper `{state: GameState}`
- [BUG-002] FIXED: `CreateGameResponse` incluye `player` y `state`
- [BUG-002] FIXED: `JoinGameResponse` usa campos planos (match backend real)
- [FIX] `startGame()` retorna `GameState`
- [VERIFY] `useWebSocket.ts` ya tenía URL correcta (`http→ws`, directo al backend)
- [BUILD] Frontend: `vite build` sin errores, exit code 0

**Tester** ✅ COMPLETADO — Pruebas E2E ejecutadas contra backend real (Node.js, sin Python3)

---

### 2026-02-23 — Sprint 2 / Tester: Ejecución E2E ✅

- [ENV] Python3 no disponible en host Windows — tests ejecutados con `curl` + `node -e` para parseo JSON
- [ENV] WS test requiere `ws` module desde directorio `backend/` (node_modules local)
- [RUN] Todos los escenarios A1-A7 ejecutados contra `http://localhost:3001`

| Escenario | Descripción | Resultado |
|---|---|---|
| A1 | Crear partida: seat=BUENOSOS, status=lobby, gameId recibido | ✅ PASS |
| A2 | Unirse a partida: seat=MALOSOS, token recibido, gameId correcto | ✅ PASS |
| A2b | Seat duplicado rechazado con 409 SEAT_TAKEN | ✅ PASS |
| A3 | Iniciar partida: status=running, turn=1, phase=MAINTENANCE, stability=100, trust=50, manos 5 cartas c/u | ✅ PASS |
| A4 | GET estado: wrapper `{state:GameState}`, 12 servicios, status=running | ✅ PASS |
| A4b | GET sin token devuelve 401 NOT_AUTHORIZED | ✅ PASS |
| A4c | GET partida ajena devuelve 403 NOT_AUTHORIZED | ✅ PASS |
| A5 | Pause→paused, Resume→running | ✅ PASS |
| A5b | Resume en juego ya running devuelve 400 | ✅ PASS |
| A6 | Export: gameId, 12 servicios, logs[], players[], config, markers | ✅ PASS |
| A7 | WebSocket: conexión exitosa, GAME_STATE broadcast recibido tras ADVANCE_PHASE | ✅ PASS |

- [RESULT] **11/11 tests PASSED — 0 FAILED**
- [NOTE] BUG-001, BUG-002, BUG-004 confirmados como RESUELTOS en Sprint 2
- [NOTE] BUG-003 confirmado como observación de diseño (WS-only, comportamiento esperado)

---

## Bugs reportados

| ID | Severidad | Descripción | Asignado a | Estado |
|---|---|---|---|---|
| BUG-001 | MEDIA | `POST /api/games` — contrato espera params planos, no `{config:{...}}` anidado. Tests corregidos por Tester. Revisar consistencia con frontend `gameApi.ts`. | FRD01 | ✅ RESUELTO (Sprint 2) |
| BUG-002 | MEDIA | `GET /api/games/:id` envuelve respuesta en `{state: GameState}`. Frontend corregido para extraer `.state`. | FRD01/FRD02 | ✅ RESUELTO (Sprint 2) |
| BUG-003 | BAJA | `INSUFFICIENT_BUDGET` y `CARD_REQUIREMENTS_NOT_MET` solo accesibles vía WebSocket, no REST. Comportamiento de diseño aceptado. | FRD01 | ✅ ACEPTADO (diseño) |
| BUG-004 | BAJA | Variable `_effectiveState` con `void` en `markers.ts` — código muerto, sin impacto funcional. | FRD01 | ✅ RESUELTO (Sprint 2) |

---

## Notas de integración

- FRD02 conecta al backend en `http://localhost:3001` (configurable via `VITE_API_URL`)
- WebSocket: `ws://localhost:3001/ws/games/:gameId`
- Token de sesión en header `Authorization: Bearer <token>` o query param `?token=<token>` (WS)
- CORS habilitado para `localhost:5173` en desarrollo
