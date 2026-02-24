# Plan Developer-FRD02 — Frontend BuenOsos vs MalOsos (fenyflow)

**Fecha de inicio:** 2026-02-23  
**Rol:** Developer-FRD02  
**Misión:** Construir el frontend completo del juego "BuenOsos vs MalOsos" en React + TypeScript

---

## Stack Técnico
- React 18 + TypeScript
- Vite 5 (bundler, puerto 5173)
- Tailwind CSS v3 (estilos)
- react-icons (íconos específicos de fa y lu)
- WebSocket nativo (sin socket.io)
- Backend URL: http://localhost:3001 (configurable via VITE_API_URL)

---

## Arquitectura General

```
frontend/
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/
│   │   └── game.types.ts
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   └── useGame.ts
│   ├── api/
│   │   └── gameApi.ts
│   ├── components/
│   │   ├── Lobby/
│   │   ├── Board/
│   │   ├── ServiceNode/
│   │   ├── HandCard/
│   │   ├── Markers/
│   │   ├── CampaignTrack/
│   │   ├── PhasePanel/
│   │   ├── LogPanel/
│   │   └── shared/
│   └── assets/
│       └── worldmap.svg
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Plan de Ejecución (en orden)

### Paso 1: Crear plan_frd02.md
Este archivo.

### Paso 2: Scaffold con Vite + instalación de dependencias
- `npm create vite@latest frontend -- --template react-ts`
- Instalar: react-icons, tailwindcss, postcss, autoprefixer

### Paso 3: Configurar Tailwind + Vite
- tailwind.config.js con content paths
- postcss.config.js
- vite.config.ts con proxy al backend

### Paso 4: Tipos (game.types.ts)
Mirror completo del backend.

### Paso 5: API REST (gameApi.ts)
Funciones: createGame, joinGame, getGame, startGame, exportGame.

### Paso 6: Hooks
- useWebSocket: conexión WS, reconexión (3 intentos), mensajes GAME_STATE/ACTION_RESULT/ERROR
- useGame: acciones del juego (playCard, basicAction, advancePhase)

### Paso 7: Componentes shared
- Icon.tsx: resuelve ícono por categoría/tipo

### Paso 8: Lobby
- Formulario nombre
- Crear partida (seat + config)
- Unirse (gameId input)
- Código para compartir

### Paso 9: Board y sub-componentes
- Board.tsx: layout responsive (desktop/tablet/móvil)
- Markers.tsx: estabilidad, confianza, turno, fase
- ServiceNode.tsx: S1-S12 con estado y colores
- HandCard.tsx: cartas jugables con ícono y fase
- CampaignTrack.tsx: 5 fases MalOsos
- PhasePanel.tsx: fase actual + controles
- LogPanel.tsx: log de acciones

### Paso 10: App.tsx
- Router de estados: lobby vs game
- localStorage para token y gameId (reconexión)

### Paso 11: Worldmap SVG
- SVG simplificado de contornos del mundo < 300KB

### Paso 12: Build verification
- `npm run build` sin errores TypeScript
- Sin warnings críticos

---

## Reglas de UI Implementadas

### Colores de Estado de Servicio
- OK: #22c55e (green-500)
- DEGRADED: #eab308 (yellow-500)
- INTERMITTENT: #f97316 (orange-500)
- DOWN: #ef4444 (red-500)

### Colores de Carta por Lado
- BuenOsos: #3b82f6 (blue-500)
- MalOsos: #ef4444 (red-500)
- Evento: #f59e0b (amber-500)

### Marcadores
- Estabilidad > 60: verde; 30-60: amarillo; < 30: rojo
- Confianza > 25: azul; 10-25: naranja; < 10: rojo

### Responsividad
- Desktop (>1024px): tablero central, panel derecho, marcadores arriba
- Tablet (768-1024px): tablero izquierda, mano derecha
- Móvil (<768px): tabs (Tablero | Mano | Log | Marcadores)

---

## Reporte FRD02

**Fecha de completion:** 2026-02-23
**Estado del build:** EXITOSO (0 errores TypeScript, 0 warnings criticos)

### Archivos creados

#### Configuracion
- `frontend/.env` — Variable `VITE_API_URL=http://localhost:3001`
- `frontend/vite.config.ts` — Actualizado con proxy `/api` y `/ws` al backend en puerto 3001

#### Tipos
- `frontend/src/types/game.types.ts` — Mirror completo de tipos del backend (ServiceState, Seat, Card, GameState, Player, etc.)

#### API REST
- `frontend/src/api/gameApi.ts` — Funciones: `createGame`, `joinGame`, `getGame`, `startGame`, `pauseGame`, `resumeGame`, `exportGame`

#### Hooks
- `frontend/src/hooks/useWebSocket.ts` — Conexion WS a `ws://localhost:3001/ws/games/:gameId?token=`, reconexion automatica 3 intentos con backoff exponencial
- `frontend/src/hooks/useGame.ts` — Hook de alto nivel: `playCard`, `useBasicAction`, `advancePhase`

#### Componentes
- `frontend/src/components/Lobby/Lobby.tsx` + `Lobby.module.css`
  - Formulario de nombre de jugador
  - Seccion "Nueva partida": seleccion de seat (BuenOsos/MalOsos/Facilitador), turno limite (5/8/10), boton Crear
  - Codigo de partida compartible post-creacion
  - Boton "Iniciar partida" llama POST /start
  - Seccion "Unirse": input gameId, seleccion de seat, boton Unirse

- `frontend/src/components/ServiceNode/ServiceNode.tsx` + `ServiceNode.module.css`
  - Servicio con nombre, id, estado coloreado, barra INT actual/max, criticidad
  - Icono `LuNetwork` de react-icons/lu
  - Soporte para seleccion, targetable (animacion pulse), onClick
  - aria-label accesible

- `frontend/src/components/HandCard/HandCard.tsx` + `HandCard.module.css`
  - Carta con nombre, costo, categoria, icono segun categoria
  - Iconos corregidos: `LuTriangleAlert` (era LuAlertTriangle, no existia), resto OK
  - Borde azul (BuenOsos), rojo (MalOsos), amarillo (Evento)
  - Boton "Jugar" deshabilitado fuera de fase o sin presupuesto
  - tabIndex y onKeyDown para accesibilidad

- `frontend/src/components/Markers/Markers.tsx` + `Markers.module.css`
  - Barra Estabilidad (0-100): verde>60, amarillo 30-60, rojo<30
  - Barra Confianza (0-50): azul>25, naranja 10-25, rojo<10
  - Turno actual / Turno limite
  - Fase en espanol

- `frontend/src/components/CampaignTrack/CampaignTrack.tsx` + `CampaignTrack.module.css`
  - 5 casillas con iconos: LuSearch, LuKeyRound, LuAnchor, LuShuffle, LuZap
  - Completadas = rellenas en rojo, pendientes = vacias

- `frontend/src/components/Board/Board.tsx` + `Board.module.css`
  - Fondo mapamundi SVG inline con opacity 0.07 (6 continentes simplificados)
  - Grid responsivo de ServiceNodes (S1-S12)
  - CampaignTrack en la parte superior
  - Seleccion de servicios como targets al jugar carta

- `frontend/src/components/PhasePanel/PhasePanel.tsx` + `PhasePanel.module.css`
  - Fase actual con boton "Avanzar fase"
  - Presupuesto restante del seat
  - Boton "Accion basica" (visible si no se uso en el turno)
  - Mano de cartas con HandCard por cada carta

- `frontend/src/components/LogPanel/LogPanel.tsx` + `LogPanel.module.css`
  - Log scrollable con auto-scroll al ultimo evento
  - aria-live="polite" para accesibilidad
  - Formato inteligente de entradas del log

#### App principal
- `frontend/src/App.tsx` — Reescrito completamente:
  - Estados: `lobby` | `game`
  - Restauracion de sesion desde localStorage al cargar
  - Layout desktop: tablero central, panel derecho (mano+log), marcadores arriba
  - Layout movil: tabs "Tablero" | "Mano" | "Log" | "Marcadores"
  - Seleccion de targets al jugar cartas con targeting
  - Banner de ganador
  - Indicador de conexion WS

- `frontend/src/App.css` — Reescrito con estilos globales dark theme y layouts responsive

### Resultado del build

```
> frontend@0.0.0 build
> tsc -b && vite build

vite v7.3.1 building client environment for production...
transforming...
55 modules transformed.
dist/index.html                   0.46 kB | gzip:  0.29 kB
dist/assets/index-C29_YZ-v.css  15.56 kB | gzip:  3.86 kB
dist/assets/index-CL1lg2ni.js  224.01 kB | gzip: 70.81 kB
built in 3.64s
```

**0 errores TypeScript. Build exitoso en 3.64s.**

### Correcion aplicada durante build

- `LuAlertTriangle` no existe en react-icons/lu v5. Se reemplazo por `LuTriangleAlert` (nombre correcto en esta version).

### Como correr

```bash
cd frontend
npm install
npm run dev
# Abre http://localhost:5173
```

El backend debe estar corriendo en `http://localhost:3001` antes de iniciar partidas.

---

## Sprint 2 — Corrección de alineación con backend

- [BUG-001] FIXED: gameApi.ts paths corregidos a /api/games/...
- [BUG-002] FIXED: getGame extrae .state del wrapper
- [BUG-002] FIXED: CreateGameResponse actualizado con campo player y state
- [BUG-002] FIXED: JoinGameResponse actualizado a campos planos
- [FIX] startGame ahora devuelve GameState
- [BUILD] npm run build: exit code 0
