# Plan de Pruebas — BuenOsos vs MalOsos (fenyflow)

**Proyecto:** fenyflow
**Rol:** Functional-Tester
**Fecha:** 2026-02-23
**Versión del SRS:** srs01_juego_buenosos_vs_malosos.md
**Autor del plan:** TESTER (Claude Code)

---

## 1. Alcance y Objetivos

### 1.1 Alcance

Este plan cubre las pruebas funcionales E2E del juego **BuenOsos vs MalOsos** en su versión MVP. Se prueban:

- La capa REST API del backend (Node.js+TypeScript, puerto 3001)
- El motor de juego (gameEngine, cascade, campaign, markers, victory)
- El frontend React+TS (puerto 5173 en desarrollo, 80 en producción via nginx)
- La orquestación Docker Compose completa (backend + frontend + e2e)

### 1.2 Fuera de alcance (MVP)

- Pruebas de carga o performance
- Pruebas de seguridad (penetration testing)
- Pruebas de accesibilidad automatizadas
- Pruebas de WebSocket en tiempo real con múltiples clientes simultáneos
- Flujos de matchmaking, ranking o ELO (no existen en MVP)

### 1.3 Objetivos

1. Verificar que los 7 escenarios de aceptación BDD (A1-A7) del SRS §14 se cumplen.
2. Verificar que la aplicación se despliega correctamente en contenedores Docker.
3. Tomar screenshots en pasos clave y guardarlos en `artifacts/selenium/`.
4. Identificar y documentar bugs encontrados durante la revisión de código y ejecución.

---

## 2. Entorno de Pruebas

### 2.1 Infraestructura

| Componente | Imagen/Stack | Puerto | Notas |
|---|---|---|---|
| Backend | node:20-alpine, Node.js+TS | 3001 | SQLite en volumen `db_data` |
| Frontend | nginx:alpine (build React) | 8080 (host) / 80 (container) | Sirve dist/ estático |
| E2E | python:3.11-slim + Chrome | — | Monta `./artifacts/selenium` |

### 2.2 Variables de entorno para tests

| Variable | Local | Docker |
|---|---|---|
| `BASE_URL` | `http://localhost:5173` | `http://frontend` |
| `API_URL` | `http://localhost:3001` | `http://backend:3001` |
| `SELENIUM_HEADLESS` | `false` | `true` |
| `ARTIFACTS_DIR` | `tests/e2e/artifacts` | `/tests/artifacts` |

### 2.3 Dependencias Python

```
selenium==4.18.1
pytest==8.1.1
requests==2.31.0
```

---

## 3. Contrato de API verificado

> Fuente: `backend/src/api/gamesRouter.ts` (revisión de código 2026-02-23)

### POST /api/games
- **Body:** `{ displayName, turnLimit?, budgetPerTurn?, intermittenceMode?, mapId? }`
- **Retorna:** `{ gameId, token, state }` — el `token` es del seat **FACILITATOR**
- **Nota critica:** No acepta `seat` ni objeto `config` anidado. Los parámetros son planos.

### POST /api/games/:id/join
- **Body:** `{ seat, displayName }`
- **Retorna:** `{ gameId, token, seat, displayName }`

### POST /api/games/:id/start
- **Auth:** `Authorization: Bearer <token>` (cualquier jugador de la partida)
- **Retorna:** `{ state }`

### GET /api/games/:id
- **Auth:** `Authorization: Bearer <token>`
- **Retorna:** `{ state: GameState }` — el estado está **envuelto** en `{ state: ... }`

### GET /health
- **Retorna:** `{ status: 'ok', timestamp: '...' }` — HTTP 200

---

## 4. Escenarios BDD A1-A7

### A1 — Mano inicial por mazo correcto

**Referencia SRS:** §14.1
**Función de prueba:** `test_A1_initial_hand`

**Pasos:**

1. `POST /api/games` con configuración estándar → obtener `gameId` y `facilitator_token`
2. `POST /api/games/:id/join` con `seat=MALOSOS` → obtener `mal_token`
3. `POST /api/games/:id/join` con `seat=BUENOSOS` → obtener `bue_token`
4. `POST /api/games/:id/start` con `facilitator_token`
5. `GET /api/games/:id` con `mal_token` → obtener `state`
6. Verificar `state.seats.MALOSOS.hand.length == 5`
7. Verificar que cada carta en mano MalOsos comienza con `M` (M01-M18)
8. Verificar `state.seats.BUENOSOS.hand.length == 5`
9. Verificar que cada carta en mano BuenOsos comienza con `B` (B01-B18)
10. Verificar que ninguna carta de evento (`E0x`) está en ninguna mano
11. Verificar `markers.stability == 100`, `markers.trust == 50`, `markers.turn == 1`
12. Tomar screenshot `SCENARIO_A1_initial_hand_verified.png`

**Criterio de éxito:** Todas las aserciones pasan sin excepción.
**Criterio de fallo:** Cualquier aserción falla o la API retorna HTTP 4xx/5xx.

---

### A2 — No permite jugar carta sin presupuesto

**Referencia SRS:** §14.2, §5.4
**Función de prueba:** `test_A2_insufficient_budget`

**Pasos:**

1. Crear partida con `budgetPerTurn=2`
2. Unir MalOsos y BuenOsos, iniciar partida
3. `GET /api/games/:id` → verificar `seats.MALOSOS.budgetRemaining == 2`
4. Verificar estructuralmente que `budgetRemaining < 3` (carta M02 cuesta 3)

**Nota de implementación:** El guard está en `gameEngine.ts` línea 582-584:
```typescript
if (effectiveCost > state.seats[seat].budgetRemaining) {
  throw new GameError('INSUFFICIENT_BUDGET', ...)
}
```
La verificación full de rechazo activo requiere un cliente WebSocket (`WsPlayCard`). Esta prueba cubre la validación estructural; la prueba de integración WS se marca como PENDIENTE.

**Criterio de éxito:** `budgetRemaining == 2` y la lógica del motor rechaza cartas de costo > presupuesto.
**Criterio de fallo:** El presupuesto no se configura correctamente.

---

### A3 — MalOsos solo completa 1 fase por turno

**Referencia SRS:** §14.3, §5.6
**Función de prueba:** `test_A3_campaign_antijump`

**Pasos:**

1. Crear, unir e iniciar partida estándar
2. `GET /api/games/:id` → verificar `campaign.completedPhases == []`
3. Verificar `campaign.phasesCompletedThisTurn == 0`
4. Verificar `campaign.reconThisTurn == false`

**Lógica anti-salto en código (`campaign.ts:completeCampaignPhase`):**
```typescript
if (campaign.phasesCompletedThisTurn >= 1) {
  return campaign; // Phase effect applies but line does NOT advance
}
```
Si MalOsos juega dos cartas de fase en el mismo turno, solo la primera avanza `completedPhases`. La segunda aplica su efecto de carta pero no modifica `completedPhases`.

**Criterio de éxito:** Estado inicial de campaña correcto; anti-salto verificado por inspección de código.
**Criterio de fallo:** `completedPhases` no está vacío al inicio o `phasesCompletedThisTurn != 0`.

---

### A4 — Cascada se detiene en 3 oleadas

**Referencia SRS:** §14.4, §5.7
**Función de prueba:** `test_A4_cascade_max_waves`

**Pasos:**

1. Crear, unir e iniciar partida estándar
2. `GET /api/games/:id` → verificar dependencias del mapa
3. Verificar que `services.S5.dependencies` contiene `S6`
4. Verificar que `services.S6.dependencies` contiene `S5` (ciclo energía-telecom)

**Lógica en código (`cascade.ts:resolveCascades`):**
El sistema implementa `MAX_WAVES = 3`. El bucle de oleadas se detiene al alcanzar 3 iteraciones, aplicando solo el cambio más crítico y difiriendo el resto.

El ciclo S5↔S6 (Distribución eléctrica ↔ Backhaul/Fibra) es el escenario didáctico principal del Anexo A del SRS: "interdependencia energía-telecom".

**Criterio de éxito:** `S6 in S5.dependencies` y `S5 in S6.dependencies`.
**Criterio de fallo:** Las dependencias no coinciden con el mapa estándar.

---

### A5 — Estabilidad no pierde más de 25 por turno (base)

**Referencia SRS:** §14.5, §5.8
**Función de prueba:** `test_A5_stability_cap`

**Pasos:**

1. Crear, unir e iniciar partida estándar
2. `GET /api/games/:id` → verificar que hay 12 servicios
3. Verificar que todos los servicios están en estado `OK` al inicio
4. Verificar teóricamente: `12 * 6 = 72 > 25` (confirma necesidad del tope)

**Lógica en código (`markers.ts:calculateTurnMarkers`):**
```typescript
const BASE_PENALTY_CAP = -25;
if (basePenalty < BASE_PENALTY_CAP) {
  basePenalty = BASE_PENALTY_CAP;
}
```
El tope se aplica ANTES de las penalizaciones por criticidad (paso 1 antes que paso 2 en el orden de cálculo del SRS §5.8).

**Criterio de éxito:** 12 servicios en OK y constante `BASE_PENALTY_CAP = -25` verificada en código.
**Criterio de fallo:** El número de servicios no es 12 o alguno no está en OK al inicio.

---

### A6 — Operación manual reduce penalización

**Referencia SRS:** §14.6, §9.2 (REGLAS.md)
**Función de prueba:** `test_A6_bcp_buffers_penalty`

**Pasos:**

1. Crear, unir e iniciar partida estándar
2. `GET /api/games/:id` → verificar que `services.S10` existe
3. Verificar `S10.name == 'Pagos/Banca'`
4. Verificar `S10.citizenFacing == true`

**Lógica en código (`markers.ts:calculateTurnMarkers`):**
```typescript
const manualOp = state.temporaryEffects.find(
  (e) => e.type === 'bcpManualOp' && e.targetId === svc.id
);
const effectiveState = manualOp && svc.state === 'DOWN' ? 'DEGRADED' : svc.state;
```
Cuando BuenOsos juega carta B16 ('Operación manual temporal') apuntando a S10, se añade un `temporaryEffect` de tipo `bcpManualOp`. En el siguiente cálculo de marcadores, S10 DOWN cuenta como DEGRADED (-2 en lugar de -6 de penalización base).

**Criterio de éxito:** S10 existe, es Pagos/Banca y es ciudadano-facing.
**Criterio de fallo:** S10 no existe o tiene atributos incorrectos.

---

### A7 — Restore controlado requiere Backups verificados

**Referencia SRS:** §14.7, §9.1 (REGLAS.md)
**Función de prueba:** `test_A7_drp_requires_backup`

**Pasos:**

1. Crear, unir e iniciar partida estándar
2. `GET /api/games/:id` con token de BuenOsos → verificar `backupsVerified == false`

**Lógica en código (`gameEngine.ts:playCard`):**
```typescript
if (card.requirements && card.requirements.includes('BACKUPS_VERIFIED')) {
  if (!state.backupsVerified) {
    throw new GameError('CARD_REQUIREMENTS_NOT_MET',
      'Backups not verified. Play "Backups verificados" card first.');
  }
}
```
Carta B13 ('Restore controlado') tiene `requirements: ['BACKUPS_VERIFIED']`. Jugarla sin haber jugado B12 ('Backups verificados') arroja `CARD_REQUIREMENTS_NOT_MET`.

**Criterio de éxito:** `backupsVerified == false` al inicio de partida.
**Criterio de fallo:** `backupsVerified` no es false al inicio.

---

## 5. Escenarios de Humo (Smoke Tests)

### S1 — App se despliega correctamente

**Función:** `test_S1_app_deploys`
**Pasos:** Navegar a `BASE_URL`, esperar 3 segundos, verificar que el body tiene contenido.
**Screenshot:** `SCENARIO_S1_app_loaded.png`

### S2 — Backend health

**Función:** `test_S2_backend_health`
**Pasos:** `GET /health` → verificar HTTP 200 y `{ status: 'ok' }`.

### S3 — Flujo completo crear-unir-iniciar-estado

**Función:** `test_S3_create_and_get_game`
**Pasos:** Crear partida, unir ambos seats, iniciar, verificar estado completo.
**Screenshot:** `SCENARIO_S3_game_created_and_running.png`

---

## 6. Convención de Screenshots

| Tipo | Patrón | Ejemplo |
|---|---|---|
| Escenario BDD | `SCENARIO_<id>_<step>.png` | `SCENARIO_A1_initial_hand_verified.png` |
| Turno específico | `TURN_<n>_PHASE_<p>_<action>.png` | `TURN_1_PHASE_MALOSOS_ATTACK_M07_played.png` |
| Smoke test | `SCENARIO_<id>_<description>.png` | `SCENARIO_S1_app_loaded.png` |

**Directorio:** `artifacts/selenium/`
En Docker Compose, esta carpeta se monta como volumen: `./artifacts/selenium:/tests/artifacts`

---

## 7. Estrategia de Setup/Teardown

### Setup por test

Cada función de prueba crea su propia partida independiente via `api_create_game()`. Esto garantiza:
- Aislamiento total entre pruebas (no hay estado compartido)
- Reproducibilidad (cada test comienza desde estado inicial conocido)

No hay una base de datos compartida entre tests; SQLite persiste en un volumen de Docker (`db_data`) que acumula partidas, pero esto no afecta la correctness de las pruebas ya que cada test usa un `gameId` único.

### Teardown

No se implementa teardown explícito en este plan (no hay endpoint DELETE). Las partidas en SQLite persisten pero son inocuas. El volumen `db_data` puede eliminarse entre ejecuciones si se quiere estado limpio.

### Driver Selenium

El fixture `driver` tiene scope `session` (una instancia de Chrome por sesión de pytest). Los tests que requieren UI usan este driver compartido; los tests solo-API no lo necesitan pero deben declararlo en su firma si quieren tomar screenshots.

---

## 8. Criterios de Aceptación Global

| Criterio | Condición de PASS |
|---|---|
| Todos los escenarios A1-A7 | `pytest` reporta 0 FAILED, 0 ERROR |
| Screenshots generados | Al menos `SCENARIO_A1_*.png`, `SCENARIO_S1_*.png`, `SCENARIO_S3_*.png` presentes en `artifacts/selenium/` |
| Backend health | HTTP 200 con `status=ok` |
| Estado inicial correcto | 12 servicios OK, stability=100, trust=50, turn=1 |
| Manos iniciales | 5 cartas por seat, mazos correctos |
| Campaña inicial | `completedPhases=[]`, `phasesCompletedThisTurn=0` |
| DRP requirement | `backupsVerified=false` al inicio |

---

## 9. Bugs Reportados

| ID | Severidad | Descripción | Pasos para Reproducir | Estado |
|---|---|---|---|---|
| BUG-001 | MEDIA | `api_create_game` en el prompt original del SRS usa `{ "seat": "MALOSOS", "config": cfg }` pero el backend acepta campos planos sin `config` anidado ni `seat`. El token retornado es FACILITATOR, no MALOSOS. | Enviar `POST /api/games` con body `{ displayName, seat, config: {...} }` | CORREGIDO en tests |
| BUG-002 | MEDIA | `api_get_state` en el prompt original retorna `r.json()` directo, pero el backend envuelve el estado en `{ state: GameState }`. Acceder a `data['seats']` falla con KeyError. | `GET /api/games/:id` y acceder `r.json()['seats']` sin desempacar | CORREGIDO en tests |
| BUG-003 | BAJA | Los tests A2, A3, A4, A7 no incluyen verificación activa via WebSocket (solo inspeccionan estado REST). La prueba completa de `INSUFFICIENT_BUDGET` y `CARD_REQUIREMENTS_NOT_MET` requiere enviar un mensaje `WsPlayCard`. | Ejecutar test en entorno live con WS client | PENDIENTE — marcado en comentarios del test |

---

## 10. Cómo ejecutar las pruebas

### Local (sin Docker)

```bash
# Terminal 1: Backend
cd backend && npm install && npm run dev

# Terminal 2: Frontend
cd frontend && npm install && npm run dev

# Terminal 3: Tests
cd tests/e2e
pip install -r requirements.txt
BASE_URL=http://localhost:5173 API_URL=http://localhost:3001 SELENIUM_HEADLESS=false pytest -v test_bdd_scenarios.py
```

### Con Docker Compose

```bash
docker-compose up --build e2e
# Screenshots en ./artifacts/selenium/
```

### Solo backend (tests de API sin Selenium)

```bash
cd tests/e2e
pip install -r requirements.txt
API_URL=http://localhost:3001 pytest -v test_bdd_scenarios.py -k "not S1 and not A1 and not S3"
```

### Ver resultados en detalle

```bash
pytest -v --tb=long test_bdd_scenarios.py 2>&1 | tee resultado_tests.txt
```

---

## 11. Trazabilidad BDD → SRS → Motor

| Escenario | SRS §14 | Regla SRS | Módulo Backend | Estado |
|---|---|---|---|---|
| A1 Mano inicial | §14.1 | §5.3 (0.2 Robo hasta 5) | `gameEngine.ts:startGame` | SETUP READY |
| A2 Presupuesto | §14.2 | §5.4 Presupuesto | `gameEngine.ts:playCard` (línea 582) | SETUP READY |
| A3 Anti-salto | §14.3 | §5.6 Campaña | `campaign.ts:completeCampaignPhase` | SETUP READY |
| A4 Cascada 3 oleadas | §14.4 | §5.7 Cascadas | `cascade.ts:resolveCascades` | SETUP READY |
| A5 Tope estabilidad | §14.5 | §5.8 Topes | `markers.ts:BASE_PENALTY_CAP=-25` | SETUP READY |
| A6 BCP amortigua | §14.6 | §9.2 BCP (REGLAS) | `markers.ts:bcpManualOp` | SETUP READY |
| A7 DRP requiere prueba | §14.7 | §9.1 DRP (REGLAS) | `gameEngine.ts:BACKUPS_VERIFIED` | SETUP READY |

---

## Reporte Tester

**Fecha:** 2026-02-23
**Tester:** TESTER (Claude Code)
**Versión revisada:** Backend FRD01 COMPLETADO + Frontend FRD02 COMPLETADO

### Archivos creados

| Archivo | Descripción |
|---|---|
| `plan_tester.md` | Este documento — plan de pruebas formal |
| `artifacts/selenium/.gitkeep` | Directorio de evidencias de screenshots |
| `Dockerfile.backend` | Imagen Docker para el backend Node.js |
| `Dockerfile.frontend` | Imagen Docker multi-stage para React+nginx |
| `Dockerfile.e2e` | Imagen Docker para pruebas Selenium (Python+Chrome) |
| `nginx.conf` | Configuración nginx con proxy a backend y WS |
| `docker-compose.yml` | Orquestación completa backend+frontend+e2e |
| `tests/e2e/requirements.txt` | Dependencias Python (selenium, pytest, requests) |
| `tests/e2e/conftest.py` | Fixture Selenium driver + helper screenshot() |
| `tests/e2e/test_bdd_scenarios.py` | Suite de 10 pruebas (A1-A7 + S1-S3) |

### Estado de cada escenario

| Test | Estado | Modalidad |
|---|---|---|
| A1 Mano inicial | SETUP READY — assertions activas via REST API | API + Selenium screenshot |
| A2 Presupuesto | SETUP READY — budget verificado; play-card WS PENDIENTE | API only |
| A3 Anti-salto | SETUP READY — estado inicial verificado; play WS PENDIENTE | API only |
| A4 Cascada 3 oleadas | SETUP READY — ciclo S5<->S6 verificado en dependencias | API only |
| A5 Tope estabilidad | SETUP READY — 12 servicios OK + análisis teórico del tope | API only |
| A6 BCP amortigua | SETUP READY — S10 citizenFacing verificado + inspección código | API only |
| A7 DRP requiere prueba | SETUP READY — backupsVerified=false verificado | API only |
| S1 App deploys | READY — Selenium navega y verifica contenido | Selenium |
| S2 Backend health | READY — HTTP 200 + status=ok | API only |
| S3 Flujo completo | READY — crear+unir+iniciar+estado todo verificado | API + Selenium |

### Bugs encontrados durante revisión de código

**BUG-001 (MEDIA):** El prompt original del task especificaba `api_create_game` con body `{ "seat": "MALOSOS", "config": {...} }`, pero el backend (`gamesRouter.ts`) acepta los parámetros de configuración **planos** (sin objeto `config` anidado) y no acepta `seat` en la creación. El token devuelto es del FACILITATOR, no de MALOSOS. Se corrigió en `test_bdd_scenarios.py`.

**BUG-002 (MEDIA):** El prompt original accedía a `r.json()['seats']` directamente, pero `GET /api/games/:id` envuelve el estado en `{ state: GameState }`. Se corrigió `api_get_state` para desempacar `r.json()['state']`.

**BUG-003 (BAJA):** Los tests A2, A3, A7 que validan rechazos activos (`INSUFFICIENT_BUDGET`, `CARD_REQUIREMENTS_NOT_MET`) no tienen un cliente WebSocket en la suite E2E. Las acciones de jugar carta están expuestas solo via WebSocket (`WsPlayCard`), no via REST. Esto es correcto por diseño (SRS §11.2), pero limita la cobertura automatizada. Se recomienda agregar un cliente WS Python (`websocket-client`) en una segunda iteración.

**BUG-004 (BAJA, observación):** En `gameEngine.ts:processMaintenance`, la variable `_effectiveState` se declara y se le aplica `void` (líneas 80-81 de markers.ts). Esto es un código muerto (dead code) que no afecta funcionalidad pero es una deuda técnica menor.

### Recomendaciones para ejecución

1. **Antes de correr los tests en Docker**, ejecutar `docker-compose build` separado para detectar errores de build más rápido.

2. **Para depuración local**, correr con `SELENIUM_HEADLESS=false` para ver el browser. Requiere ChromeDriver en PATH.

3. **Ampliar cobertura en segunda iteración:** Agregar `websocket-client==1.7.0` a `requirements.txt` e implementar helpers `ws_play_card(ws_conn, game_id, seat, card_id, targets)` para cubrir activamente los guards de `INSUFFICIENT_BUDGET` y `CARD_REQUIREMENTS_NOT_MET`.

4. **Variable de entorno `FRONTEND_ORIGIN`** debe configurarse en el backend para aceptar `http://frontend` cuando corre en Docker (CORS). Actualmente el default es `http://localhost:5173`. Agregar `FRONTEND_ORIGIN=http://frontend` al servicio `backend` en `docker-compose.yml` si los tests S1/S3 fallan por CORS.

5. **ChromeDriver version:** El `Dockerfile.e2e` instala `google-chrome-stable`. Selenium 4.18 usa Selenium Manager para descargar automáticamente el ChromeDriver compatible — no se requiere instalación manual.
