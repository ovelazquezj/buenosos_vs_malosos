# SRS — BuenOsos vs MalOsos (Web App)

**Licencia del juego (contenido de reglas y cartas):** Creative Commons Attribution 4.0 International (CC BY 4.0)

Atribución sugerida: “BuenOsos vs MalOsos — Reglas y set de cartas (CC BY 4.0). Autor: **Mtro. Omar Francisco Velazquez Juarez** ([ovelazquezj@gmail.com](mailto:ovelazquezj@gmail.com)). Co-creación/adaptación asistida por ChatGPT.”

---

## 1. Propósito

Este documento especifica los requisitos para desarrollar una aplicación web responsive que implemente el juego didáctico **BuenOsos vs MalOsos** (dos bandos, cartas, tablero de servicios, dependencias, eventos, cascadas y marcadores), orientado a enseñar análisis de escenarios, fallas en cadena, continuidad (DRP/BCP) y modelos de adversario.

El SRS está diseñado para **Specs Driven Development** y debe ser suficiente para que un agente (Claude Code) implemente el sistema sin ambigüedades.

---

## 2. Alcance

### 2.1 Incluye

* Juego digital de cartas con dos bandos: **BuenOsos** y **MalOsos**.
* Modos de participación:

  * **Equipos** (múltiples usuarios por bando, un “asiento” de control por bando).
  * **1v1** (un usuario por bando; equivalente a equipos de 1).
* Motor de reglas:

  * Turnos, fases, presupuestos, robos, límites de mano.
  * Servicios con dependencias (mapa), estados (OK/Degradado/Intermitente/Caído) e INT/INTmáx.
  * Cascadas por oleadas (máx. 3) y anti-bucle.
  * Intermitencia modo determinista (turnos impares) y opción con azar.
  * Campaña MalOsos con límite: máximo 1 fase permanente por turno.
  * Topes por turno: Estabilidad (-25) y Confianza (-15).
  * Orden de cálculo de impacto país.
* Persistencia de partidas en **SQLite**.
* Sincronización multiusuario en tiempo real.
* UI minimalista, carga rápida, con tablero sobre fondo de **mapamundi** (imagen grande tenue).

### 2.2 No incluye (MVP)

* Matchmaking público, ranking o ELO.
* Monetización.
* Editor visual de cartas avanzado (solo carga/edición por JSON o interfaz simple de admin, opcional).
* IA o bots (se puede añadir después).

---

## 3. Arquitectura y tecnologías

### 3.1 Frontend

* React + TypeScript.
* UI responsive (móvil/tablet/escritorio).
* Estado de sesión sincronizado vía WebSocket.

### 3.2 Backend

* Node.js (TypeScript recomendado, pero aceptable JS si se documenta).
* API REST para autenticación simple, creación/gestión de partidas y lectura de estado.
* WebSocket para eventos del juego (acciones, cambios de estado, log).

### 3.3 Persistencia

* SQLite (archivo local para despliegue sencillo).
* Migraciones versionadas.

---

## 4. Usuarios, roles y permisos

### 4.1 Conceptos

* **Game**: una partida.
* **Seat**: “asiento” de control por bando.

  * `BUENOSOS`
  * `MALOSOS`
* **Member**: usuario conectado a un seat (0..N).
* **Facilitador** (opcional): rol con permisos administrativos en la partida.

### 4.2 Roles

1. **Facilitador**

* Puede crear partida, configurar modo, iniciar, avanzar fases si es necesario.
* Puede pausar/reanudar.
* Puede forzar correcciones de estado (solo si se habilita “modo clase”).

2. **Jugador/Miembro de seat**

* Puede ver el estado completo del tablero.
* Puede proponer jugadas.
* Confirmación de jugadas:

  * MVP: cualquier miembro del seat puede confirmar.
  * Extensión (opcional): solo el “Capitán” confirma.

---

## 5. Reglas del juego implementadas (normativas)

### 5.1 Entidades del tablero

* **Servicio**:

  * `id` (S1..S12)
  * `name`
  * `crit` (1..5)
  * `int` (0..intMax)
  * `intMax` (valor inicial)
  * `state` ∈ {OK, DEGRADED, INTERMITTENT, DOWN}
  * `dependencies[]` (ids)
  * `downEffect` (opcional; reglas específicas)

* **Marcadores**:

  * `stability` (0..100)
  * `trust` (0..50)
  * `turn` (>=1)
  * `phase` (enum)

### 5.2 Estados y mantenimiento

* En el **Paso 0.0** del turno:

  * Cada servicio `DEGRADED` pierde `-1 int`.
  * `INTERMITTENT` no pierde int automáticamente.
  * `DOWN` se mantiene en `int=0`.
  * Si un servicio llega a `int<=0`, se fija en 0 y su `state` pasa a `DOWN`.

### 5.3 Fases del turno (orden exacto)

El motor debe ejecutar siempre:

0. Inicio del turno

* 0.0 Mantenimiento de estados.
* 0.1 Reset presupuesto por seat.
* 0.2 Robo hasta mano objetivo (5).
* 0.3 Límite de mano (7).

1. Evento (Tail Risk)

* Robar 1 carta de evento; aplicar activación/latente.

2. Preparación MalOsos

* Jugar cartas permitidas (Recon/Recursos/Fases) pagando costo.

3. Ataque MalOsos

* Jugar cartas de ataque pagando costo.

4. Respuesta BuenOsos

* Jugar cartas de Prevención/Respuesta/DRP/BCP pagando costo.

5. Cascada y evaluación

* Cascadas por oleadas (máx 3).
* Actualización de marcadores (orden de cálculo).
* Micro-debrief (log de explicaciones opcional).
* Fin de turno: `turn++`.

### 5.4 Presupuesto

* Cada seat tiene `budgetPerTurn` (default 8).
* Cada acción de “jugar carta” consume presupuesto.
* No se puede jugar una carta si `cost > budgetRemaining`.

### 5.5 Acción básica gratuita (anti-bloqueo)

Una por turno por seat, costo 0:

* MalOsos: **Recon básico**

  * Marca Reconocimiento válido solo para este turno (no permanente).

* BuenOsos: **Monitoreo básico**

  * Elige 1 servicio; el primer daño que reciba ese servicio este turno se reduce en -1.

### 5.6 Regla de campaña MalOsos

* Fases: Reconocimiento → Acceso → Persistencia → Movimiento Lateral → Impacto.
* Requisitos de cartas “Impacto Alto” deben cumplirse.
* **Límite anti-salto:** MalOsos puede completar **máximo 1 fase permanente por turno**.

### 5.7 Cascadas (oleadas)

* En fase 5, aplicar cascadas en oleadas:

  * Oleada 1: computar impactos por dependencias.
  * Si hay cambios de estado o caídas, ejecutar oleada 2.
  * Máximo 3 oleadas.
* Si después de 3 oleadas aún habría cambios, el motor aplica solo el cambio más crítico (por criticidad y menor int) y difiere el resto al siguiente turno.

#### Impactos por dependencia

Para cada servicio y por cada dependencia:

* Dependencia `DEGRADED`: `-1 int`.
* Dependencia `INTERMITTENT`: `-1 int` y puede inducir intermitencia.
* Dependencia `DOWN`: `-2 int` y si el servicio estaba OK pasa a DEGRADED.

Regla acumulativa:

* Si un servicio acumula 2+ dependencias afectadas (no OK) pasa a `INTERMITTENT`.

#### Intermitencia

MVP debe soportar modo determinista:

* En turnos impares (1,3,5,...) cada servicio `INTERMITTENT` propaga a 1 dependiente:

  * Elegir dependiente de mayor criticidad; si empata, menor int.
  * Aplicar `-2 int`.

(Opcional) modo azar:

* Dado/moneda con 50% de propagación.

### 5.8 Impacto país: Estabilidad y Confianza

#### Penalizaciones base (tope)

* DEGRADED: -2 estabilidad
* INTERMITTENT: -3 estabilidad
* DOWN: -6 estabilidad

Tope por turno: pérdida base no excede **-25**.

#### Multiplicador por criticidad

* Si crit=4: -2 adicional
* Si crit=5: -4 adicional

#### Confianza

* Servicios ciudadanos (S7, S10, S12): si están DOWN, -3 confianza cada uno.
* Tope confianza: -15 por turno.
* Si confianza llega a 0: estabilidad -5 por turno.

#### Prioridad de cálculo

1. Base con tope.
2. Criticidad.
3. Confianza.
4. Reducciones por BCP.

### 5.9 Victoria

* MalOsos gana si:

  * stability == 0, o
  * 3 servicios de criticidad 5 están DOWN.

* BuenOsos gana si:

  * llega a turnLimit (default 8) con stability > 30, y
  * recuperó al menos 2 servicios que estuvieron DOWN.

---

## 6. Datos del juego: set base y mapa estándar

### 6.1 Servicios base (S1..S12)

El sistema debe incluir por defecto el set base del Anexo A de reglas (refinerías, terminales, termoeléctrica, transmisión, distribución, backhaul, red móvil, nube, DNS, pagos/banca, carreteras, puertos/aduanas) con INTmáx sugerida (editable en config).

### 6.2 Mapa estándar

El sistema debe incluir el mapa estándar de dependencias (Anexo A) como plantilla seleccionable.

---

## 7. Cartas (MVP)

### 7.1 Origen

El sistema debe incluir el **set MVP** (Anexo B del documento de reglas) como deck por defecto.

### 7.2 Representación

Las cartas se representan en JSON con:

* `id`, `name`, `side`, `category`, `subtype`, `cost`
* `requirements` (campaña/condiciones)
* `targeting` (tipos de objetivos válidos)
* `effects[]` (operaciones del motor)
* `duration`

### 7.3 Motor de efectos

El backend debe implementar un motor determinista que soporte, como mínimo:

* `damageInt(serviceId, amount)`
* `healInt(serviceId, amount, capToIntMax=true)`
* `setState(serviceId, state)`
* `addBudgetModifier(side, amount, duration)`
* `modifyTrust(amount, capped=true)`
* `modifyStability(amount, capped=true)`
* `blockIntermittentPropagation(serviceId, duration)`
* `ignoreCascadeEdge(fromServiceId, toServiceId, duration)`
* `markCampaignPhase(phase)` / `rollbackCampaignPhase(phase)`

---

## 8. Experiencia de usuario (UI/UX)

### 8.1 Look & feel

* Minimalista, sin animaciones pesadas.
* Cartas con diseño limpio, información priorizada.
* Fondo del tablero: mapamundi tenue.

### 8.2 Iconografía (react-icons) — lista congelada

Se deben usar exclusivamente estos íconos (sin SVG propio).

* Equipos:

  * BuenOsos: `FaShieldAlt`
  * MalOsos: `FaSkullCrossbones`

* Tipos macro:

  * Servicio: `LuNetwork`
  * Evento: `LuAlertTriangle`

* Subtipos BuenOsos:

  * Prevención: `LuShieldCheck`
  * Detección/Respuesta: `LuRadar`
  * DRP: `LuRefreshCw`
  * BCP: `LuWorkflow`

* Fases MalOsos:

  * Reconocimiento: `LuSearch`
  * Acceso: `LuKeyRound`
  * Persistencia: `LuAnchor`
  * Movimiento lateral: `LuShuffle`
  * Impacto: `LuZap`

### 8.3 Layout responsive

* Móvil:

  * Tabs: Tablero | Mano | Log | Marcadores
* Tablet:

  * Tablero + Mano en split
* Desktop:

  * Tablero central + panel lateral (Mano / Log / Acciones)

### 8.4 Tablero con mapamundi

* El tablero mostrará un mapamundi grande de fondo con opacidad 6–10%.
* Requisito de performance: el asset del mapamundi no debe exceder 300KB (recomendado WebP/SVG simplificado).

### 8.5 Accesibilidad

* Contraste suficiente.
* Navegación por teclado para jugar carta y seleccionar objetivo.
* Texto de estado e íconos con `aria-label`.

---

## 9. Requisitos funcionales

### 9.1 Gestión de partidas

* RF-1 Crear partida (facilitador o usuario).
* RF-2 Unirse a partida por código.
* RF-3 Seleccionar modo:

  * turnLimit (5/8/10)
  * budgetPerTurn
  * mapa estándar / otros
  * intermitencia determinista / azar
* RF-4 Iniciar partida (setup automático de decks, manos, marcadores).

### 9.2 Juego en tiempo real

* RF-5 Sincronización de estado para todos los clientes conectados.
* RF-6 Acciones por fase: solo permitir acciones del lado correcto en la fase correcta.
* RF-7 Selección de objetivos: UI debe validar targets permitidos antes de enviar al BE.
* RF-8 Log detallado: registrar cada acción con antes/después.

### 9.3 Motor de reglas

* RF-9 Aplicar automáticamente Paso 0.0 (mantenimiento) al iniciar turno.
* RF-10 Resolver cascadas por oleadas con límite.
* RF-11 Aplicar topes de estabilidad/confianza.
* RF-12 Evaluar condiciones de victoria al final de cada turno y al ocurrir DOWN de servicios crit=5.

### 9.4 Persistencia

* RF-13 Guardar estado completo de partida tras cada acción (o al menos al final de cada fase).
* RF-14 Reanudar partida desde SQLite.

### 9.5 Exportación (MVP recomendado)

* RF-15 Exportar log de partida en JSON.
* (Opcional) Exportar en Markdown.

---

## 10. Requisitos no funcionales

* RNF-1 Performance: carga inicial < 2s en red escolar promedio (sin garantías estrictas, pero objetivo).
* RNF-2 Robustez: no perder estado ante refresh del navegador.
* RNF-3 Consistencia: el backend es la fuente de verdad del estado.
* RNF-4 Seguridad:

  * Acceso a partida con código y token de sesión.
  * No se requiere login formal en MVP.
* RNF-5 Observabilidad: logs de servidor con ids de partida.

### 10.1 Pruebas funcionales end-to-end (E2E) en contenedores

* RNF-6 El proyecto debe incluir un flujo de pruebas E2E que:

  * Se ejecute **dentro de contenedores Linux**.
  * Use **Selenium en modo headless**.
  * Valide que la app:

    1. Se despliega correctamente.
    2. Funciona de extremo a extremo.
    3. Cumple los specs (escenarios BDD).

* RNF-7 Las pruebas Selenium deben:

  * Tomar **screenshots** en pasos clave.
  * Guardar los screenshots en una carpeta **dentro del proyecto** que esté mapeada como **volumen montado** para inspección.

#### 10.1.1 Convención de carpeta de evidencias

* Carpeta requerida en repo: `./artifacts/selenium/`
* En ejecución en contenedor, esta carpeta debe existir y montarse como volumen para persistir evidencias.
* Nomenclatura sugerida:

  * `TURN_<n>_PHASE_<p>_<action>.png`
  * `SCENARIO_<id>_<step>.png`

#### 10.1.2 Orquestación recomendada

* Se debe proveer un `docker-compose.yml` (o equivalente) para levantar:

  * `backend`
  * `frontend` (o servido estático si aplica)
  * `db` (si se separa; para SQLite puede ser volumen compartido)
  * `e2e` (contenedor de Selenium)

* El contenedor `e2e` debe:

  * Esperar a que FE/BE estén disponibles.
  * Ejecutar los escenarios definidos.
  * Volcar screenshots a `./artifacts/selenium/`.

---

## 11. API y eventos

### 11.1 REST (mínimo)

* `POST /api/games` crea partida
* `POST /api/games/:gameId/join` unirse (devuelve token)
* `GET /api/games/:gameId` obtener estado actual
* `POST /api/games/:gameId/start` iniciar
* `POST /api/games/:gameId/pause` pausar
* `POST /api/games/:gameId/resume` reanudar
* `GET /api/games/:gameId/export` exportar JSON

### 11.2 WebSocket

Canal por juego: `ws://.../ws/games/:gameId`

Mensajes cliente→servidor (ejemplos):

* `PLAY_CARD` { gameId, side, cardId, targets }
* `USE_BASIC_ACTION` { gameId, side, action, target? }
* `ADVANCE_PHASE` { gameId, requestedPhase } (facilitador o regla automática)

Mensajes servidor→cliente:

* `GAME_STATE` { fullState }
* `ACTION_RESULT` { logEntry, diff }
* `ERROR` { code, message }

---

## 12. Modelo de datos (SQLite)

### 12.1 Tablas

* `games`:

  * `id` TEXT PK
  * `created_at` INTEGER
  * `status` TEXT (lobby|running|paused|finished)
  * `config_json` TEXT
  * `state_json` TEXT (snapshot)

* `players`:

  * `id` TEXT PK
  * `game_id` TEXT FK
  * `seat` TEXT (BUENOSOS|MALOSOS|FACILITATOR)
  * `display_name` TEXT
  * `token` TEXT
  * `created_at` INTEGER

* `logs`:

  * `id` TEXT PK
  * `game_id` TEXT FK
  * `turn` INTEGER
  * `phase` TEXT
  * `timestamp` INTEGER
  * `entry_json` TEXT

Notas:

* `state_json` contiene: servicios, dependencias, manos, mazos, descartes, marcadores, campaña, efectos temporales.

---

## 13. Reglas de validación (backend)

El backend debe rechazar acciones inválidas con errores estandarizados:

* `INVALID_PHASE`
* `INSUFFICIENT_BUDGET`
* `INVALID_TARGET`
* `CARD_REQUIREMENTS_NOT_MET`
* `GAME_NOT_RUNNING`
* `NOT_AUTHORIZED`

---

## 14. Escenarios de aceptación (BDD)

### 14.1 Setup y robo

**Escenario A1: Mano inicial por mazo correcto**

* Dado una partida creada con set base
* Cuando se inicia la partida
* Entonces BuenOsos tiene 5 cartas tomadas de su mazo y MalOsos 5 cartas de su mazo
* Y ningún evento está en mano

### 14.2 Presupuesto

**Escenario A2: No permite jugar carta sin presupuesto**

* Dado un presupuesto restante 2
* Cuando el jugador intenta jugar carta de costo 3
* Entonces el backend rechaza con `INSUFFICIENT_BUDGET`

### 14.3 Campaña anti-salto

**Escenario A3: MalOsos solo completa 1 fase por turno**

* Dado que MalOsos no tiene Persistencia completada
* Cuando juega “Persistencia silenciosa” y luego “Movimiento lateral” en el mismo turno
* Entonces solo Persistencia queda marcada como completada
* Y Movimiento lateral no avanza fase (aunque su efecto se aplica)

### 14.4 Cascadas por oleadas

**Escenario A4: Cascada se detiene en 3 oleadas**

* Dado un ciclo de dependencias en mapa
* Cuando ocurre una caída que generaría cambios repetidos
* Entonces el motor ejecuta máximo 3 oleadas
* Y difiere cambios restantes al siguiente turno

### 14.5 Topes

**Escenario A5: Estabilidad no pierde más de 25 por turno (base)**

* Dado un tablero con múltiples servicios degradados
* Cuando se calcula penalización base
* Entonces la pérdida base de estabilidad no excede 25

### 14.6 BCP amortigua

**Escenario A6: Operación manual reduce penalización**

* Dado S10 Pagos está DOWN
* Cuando BuenOsos juega “Operación manual temporal” apuntando a S10
* Entonces en el cálculo de estabilidad S10 cuenta como DEGRADED para penalización base

### 14.7 DRP requiere prueba

**Escenario A7: Restore controlado requiere Backups verificados**

* Dado que BuenOsos no ha jugado “Backups verificados”
* Cuando intenta jugar “Restore controlado”
* Entonces el backend rechaza con `CARD_REQUIREMENTS_NOT_MET`

---

## 15. Trazabilidad

El repositorio debe incluir una matriz que vincule:

* Regla del juego → Requisito funcional → Caso(s) de aceptación

---

## 16. Entregables del desarrollo

* Frontend React+TS
* Backend Node.js
* Base de datos SQLite con migraciones
* README con:

  * cómo correr local
  * cómo inicializar DB
  * cómo crear partida y probar
* Colección de escenarios de prueba (scripts o documentación)

---

## 17. Criterios de finalización (Definition of Done)

* Implementa el flujo completo de 8 turnos.
* Reglas de campaña, cascada, topes y cálculo se cumplen.
* Persistencia permite pausar y reanudar.
* UI responsive usable en móvil.
* Export JSON funciona.
* Escenarios BDD A1–A7 pasan.
