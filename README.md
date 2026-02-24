# fenyflow

**Juego didáctico por equipos para modelar riesgo país, fallas en cascada, modelo de adversario y tail risk, destacando el papel de DRP (Disaster Recovery Plan) y BCP (Business Continuity Plan).**

**Autor:** Mtro. Omar Francisco Velazquez Juarez <ovelazquezj@gmail.com>
**Licencia:** [Creative Commons BY 4.0](https://creativecommons.org/licenses/by/4.0/)

---

## ¿Qué es fenyflow?

fenyflow es la implementación web del juego de cartas didáctico **BuenOsos vs MalOsos**: dos bandos (defensores y atacantes) compiten en un tablero de servicios críticos nacionales interconectados. Los jugadores aprenden a:

- Modelar **fallas en cascada** entre servicios interdependientes
- Entender el **modelo de adversario** y ciclo de campaña (MITRE-inspired)
- Aplicar decisiones de **DRP** (recuperación técnica) y **BCP** (continuidad operativa)
- Visualizar el impacto de **tail risk** en la estabilidad de infraestructura crítica

---

## Arquitectura

```
frontend/   → React 18 + TypeScript + Vite  (puerto 5173 dev / 80 prod)
backend/    → Node.js + TypeScript + Express (puerto 3001)
            → SQLite (archivo local data/game.db)
            → WebSocket en tiempo real
tests/e2e/  → Selenium + pytest (E2E en contenedores)
artifacts/  → Screenshots de pruebas E2E
```

---

## Requisitos

- Node.js >= 20
- npm >= 9
- (Opcional para E2E) Docker + Docker Compose

---

## Cómo correr localmente

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd "BuenOsos y MalOsos"
```

### 2. Iniciar el Backend

```bash
cd backend
npm install
npm run dev
```

El servidor arranca en `http://localhost:3001`.
La base de datos SQLite se crea automáticamente en `backend/data/game.db` al primer arranque.

### 3. Iniciar el Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`.

---

## Inicializar la base de datos

La base de datos se inicializa automáticamente al arrancar el backend. No se requiere ningún paso adicional. Las migraciones se ejecutan en `runMigrations()` al inicio del servidor.

Para reiniciar desde cero:

```bash
rm -f backend/data/game.db
npm run dev   # crea la DB nueva
```

---

## Cómo crear una partida y probar

### Vía interfaz web

1. Abre `http://localhost:5173`
2. Escribe tu nombre de jugador
3. Elige **"Nueva partida"** → selecciona tu bando (BuenOsos / MalOsos / Facilitador)
4. Configura turnos (5 / 8 / 10) y presupuesto por turno
5. Copia el **código de partida** y compártelo con los otros jugadores
6. Los demás jugadores eligen **"Unirse a partida"** e ingresan el código
7. El Facilitador (o cualquier jugador) presiona **"Iniciar partida"**
8. ¡A jugar!

### Vía API REST (para testing o integración)

```bash
# Crear partida (devuelve gameId + token del creador)
curl -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Jugador1","seat":"MALOSOS","turnLimit":8,"budgetPerTurn":8,"intermittenceMode":"deterministic","mapId":"standard"}'

# Respuesta: { "gameId": "...", "token": "...", "player": {...} }

# Unirse a la partida
curl -X POST http://localhost:3001/api/games/{gameId}/join \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Jugador2","seat":"BUENOSOS"}'

# Iniciar la partida
curl -X POST http://localhost:3001/api/games/{gameId}/start \
  -H "Authorization: Bearer {token}"

# Ver estado actual
curl http://localhost:3001/api/games/{gameId} \
  -H "Authorization: Bearer {token}"

# Exportar log en JSON
curl http://localhost:3001/api/games/{gameId}/export \
  -H "Authorization: Bearer {token}"
```

> **Nota:** La respuesta de `GET /api/games/:id` envuelve el estado en `{ "state": { ... } }`.

### Vía WebSocket (acciones del juego)

```
ws://localhost:3001/ws/games/{gameId}?token={token}
```

Mensajes entrantes (cliente → servidor):

```json
{ "type": "PLAY_CARD", "gameId": "...", "side": "MALOSOS", "cardId": "M01", "targets": ["S9"] }
{ "type": "USE_BASIC_ACTION", "gameId": "...", "side": "BUENOSOS", "target": "S5" }
{ "type": "ADVANCE_PHASE", "gameId": "...", "requestedPhase": "MALOSOS_ATTACK" }
```

Mensajes salientes (servidor → cliente):

```json
{ "type": "GAME_STATE", "state": { ... } }
{ "type": "ACTION_RESULT", "logEntry": {...}, "diff": {...} }
{ "type": "ERROR", "code": "INSUFFICIENT_BUDGET", "message": "..." }
```

---

## Pruebas E2E con Docker

```bash
# Levantar todo el stack + correr tests Selenium
docker-compose up --build e2e

# Solo levantar el stack (sin tests)
docker-compose up backend frontend

# Ver screenshots de evidencia
ls artifacts/selenium/
```

### Escenarios BDD implementados

| ID | Escenario | Estado |
|---|---|---|
| A1 | Mano inicial por mazo correcto | SETUP READY |
| A2 | No permite jugar carta sin presupuesto | SETUP READY |
| A3 | MalOsos solo completa 1 fase por turno (anti-salto) | SETUP READY |
| A4 | Cascada se detiene en 3 oleadas | SETUP READY |
| A5 | Estabilidad no pierde más de 25 por turno (tope) | SETUP READY |
| A6 | BCP amortigua penalización (operación manual) | SETUP READY |
| A7 | DRP requiere prueba previa (Backups verificados) | SETUP READY |
| S1 | App se despliega correctamente | READY |
| S2 | Backend health check | READY |
| S3 | Flujo completo crear → unirse → iniciar → estado | READY |

```bash
# Correr tests localmente (sin Docker)
cd tests/e2e
pip install -r requirements.txt
BASE_URL=http://localhost:5173 API_URL=http://localhost:3001 \
  SELENIUM_HEADLESS=false pytest -v test_bdd_scenarios.py
```

---

## Reglas del juego

Ver [`REGLAS.md`](REGLAS.md) para las reglas completas con:
- Condiciones de victoria (MalOsos y BuenOsos)
- Fases del turno (mantenimiento, evento, preparación, ataque, respuesta, cascada)
- Reglas de cascada por oleadas
- Cálculo de impacto país (Estabilidad y Confianza)
- Set base de servicios S1-S12 y sus dependencias (Anexo A)
- 44 cartas del MVP (Anexo B)

---

## Estructura del proyecto

```
.
├── backend/                  # API REST + WebSocket + Motor de juego
│   └── src/
│       ├── types/            # Interfaces TypeScript
│       ├── data/             # Servicios S1-S12 y 44 cartas
│       ├── engine/           # Motor: cascadas, campaña, marcadores, victoria
│       ├── api/              # REST endpoints
│       ├── ws/               # WebSocket handler
│       └── db/               # SQLite + migraciones
├── frontend/                 # React 18 + TypeScript
│   └── src/
│       ├── components/       # Lobby, Board, ServiceNode, HandCard, Markers…
│       ├── hooks/            # useWebSocket, useGame
│       └── api/              # Clientes REST
├── tests/e2e/                # Selenium + pytest
├── artifacts/selenium/       # Screenshots de evidencia E2E
├── Dockerfile.backend
├── Dockerfile.frontend
├── Dockerfile.e2e
├── docker-compose.yml
├── nginx.conf
├── REGLAS.md                 # Reglas completas del juego (CC BY 4.0)
├── BITACORA.md               # Registro de desarrollo del equipo
└── srs01_juego_buenosos_vs_malosos.md  # Especificación de requisitos
```

---

## Licencia

El **código fuente** de esta implementación web (fenyflow) se distribuye bajo [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

Las **reglas del juego y el set de cartas** (contenidos en `REGLAS.md`) también son CC BY 4.0.

Atribución requerida:
> "BuenOsos vs MalOsos — Reglas y set de cartas (CC BY 4.0). Autor: **Mtro. Omar Francisco Velazquez Juarez** (ovelazquezj@gmail.com). Implementación web: fenyflow."

---

*Desarrollado con Claude Code — equipo multi-agente (Arquitecto, FRD01, FRD02, Tester)*
