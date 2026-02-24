# Manual de Usuario — BuenOsos vs MalOsos (fenyflow)

**Versión:** 1.0 — Sprint 2
**Audiencia:** Jugadores y facilitadores que usan la aplicación web

---

## Tabla de contenidos

1. [Requisitos para jugar](#1-requisitos-para-jugar)
2. [Acceder a la aplicación](#2-acceder-a-la-aplicación)
3. [Crear la partida (Lobby)](#3-crear-la-partida-lobby)
4. [Unirse a la partida](#4-unirse-a-la-partida)
5. [Iniciar la partida](#5-iniciar-la-partida)
6. [Entender el tablero](#6-entender-el-tablero)
7. [Flujo de turno completo (fase por fase)](#7-flujo-de-turno-completo-fase-por-fase)
8. [Cómo jugar una carta](#8-cómo-jugar-una-carta)
9. [Acción básica](#9-acción-básica)
10. [Condiciones de victoria y derrota](#10-condiciones-de-victoria-y-derrota)
11. [Ejemplo de Turno 1 completo con decisiones comentadas](#11-ejemplo-de-turno-1-completo-con-decisiones-comentadas)
12. [Preguntas frecuentes](#12-preguntas-frecuentes)

---

## 1. Requisitos para jugar

### Configuración recomendada: 3 personas
| Rol | Descripción |
|---|---|
| **FACILITADOR** | Crea la partida, controla el flujo de fases, modera el juego |
| **BUENOSOS** | Equipo defensor: protege la infraestructura del país |
| **MALOSOS** | Equipo atacante: ejecuta campaña de ciberataques |

### Alternativa: 1 persona en 3 pestañas del navegador
Si estás solo o practicando, puedes abrir tres pestañas del navegador y jugar los tres roles desde la misma máquina:
- **Pestaña 1:** sesión de FACILITADOR
- **Pestaña 2:** sesión de BUENOSOS
- **Pestaña 3:** sesión de MALOSOS

### Requisitos técnicos
- Backend corriendo en `http://localhost:3001` (ejecutar `npm start` en `/backend`)
- Frontend corriendo en `http://localhost:5173` (ejecutar `npm run dev` en `/frontend`)
- Navegador moderno (Chrome recomendado)
- Conexión estable a la misma máquina (o red local)

---

## 2. Acceder a la aplicación

1. Asegúrate de que el backend y el frontend están corriendo (ver sección de requisitos).
2. Abre el navegador y navega a:
   ```
   http://localhost:5173
   ```
3. Verás la pantalla del **Lobby** con dos secciones: `Crear partida` y `Unirse a partida`.

---

## 3. Crear la partida (Lobby)

Solo el **FACILITADOR** crea la partida. Los demás jugadores se unen después con el código.

### Pasos:
1. En la sección **"Crear partida"**, completa el formulario:
   - **Nombre / equipo**: ingresa un nombre identificador, por ejemplo `Facilitador-Omar`
   - **Turnos (1-20)**: número de turnos que durará la partida. Recomendado: **8**
   - **Presupuesto por turno (1-20)**: puntos que cada equipo puede gastar por turno. Recomendado: **8**
2. Haz clic en **"Crear partida"**.
3. La pantalla mostrará un **Código de partida** (8 caracteres, por ejemplo `a3f7c2d1`). **Comparte este código** con los demás jugadores.
4. El FACILITADOR queda registrado automáticamente como asiento `FACILITATOR`.

> **Nota:** El código de partida es el ID único de la sesión. Todos los jugadores necesitan este código para unirse.

---

## 4. Unirse a la partida

Cada jugador (BUENOSOS y MALOSOS) debe unirse usando el código que el FACILITADOR compartió.

### Pasos:
1. En la sección **"Unirse a partida"**, completa:
   - **Código de partida**: el código de 8 caracteres compartido por el FACILITADOR
   - **Nombre**: un nombre identificador, por ejemplo `BuenOsos-Ana`
   - **Asiento**: selecciona `BUENOSOS` o `MALOSOS`
2. Haz clic en **"Unirse"**.
3. Si el código es válido y el asiento está libre, accederás a la vista de espera.

> **Error "SEAT_TAKEN":** Si ves este error, el asiento ya fue tomado por otra persona. Intenta con el otro asiento disponible.

---

## 5. Iniciar la partida

Una vez que los tres asientos están ocupados (FACILITATOR, BUENOSOS, MALOSOS):

1. El FACILITADOR verá el botón **"Iniciar Partida"** habilitado.
2. Clic en **"Iniciar Partida"**.
3. El juego comenzará en **Turno 1, Fase: Mantenimiento**.
4. Cada jugador recibirá automáticamente **5 cartas** de su respectivo mazo.
5. Los marcadores iniciales serán: **Estabilidad 100/100**, **Confianza 50/50**.

> **Nota:** Tras iniciar la partida, todos los jugadores son redirigidos automáticamente al tablero de juego vía WebSocket.

---

## 6. Entender el tablero

Una vez que la partida comienza, el tablero muestra varios paneles:

### 6.1 Marcadores (panel superior)

```
Estabilidad    [████████████████████] 100/100
Confianza cid. [██████████] 50/50
Turno 1 / 8    [Mantenimiento]
```

| Elemento | Qué indica |
|---|---|
| **Estabilidad** | Salud general del país (0–100). Verde >60, Amarillo ≥30, Rojo <30. Si llega a 0, ganan MalOsos. |
| **Confianza ciudadana** | Confianza pública (0–50). Azul >25, Naranja ≥10, Rojo <10. |
| **Turno / Límite** | Turno actual y total de turnos configurados. |
| **Fase actual** | Badge de texto con la fase actual del turno (ver sección 7). |

### 6.2 Los 12 servicios (tablero central)

El mapa muestra los 12 servicios de infraestructura del país sobre un mapamundi. Cada servicio tiene un **color que indica su estado**:

| Color | Estado | Significado |
|---|---|---|
| Verde | **OK** | Operando normalmente, sin penalización |
| Amarillo | **DEGRADED** | Funcionando con problemas, pierde 1 INT/turno |
| Naranja | **INTERMITTENT** | Inestable, puede propagar fallos a dependientes |
| Rojo | **DOWN** | Caído completamente, penalización máxima |

Cada servicio muestra:
- **ID** (S1–S12) y nombre
- **Barra de integridad (INT)**: cuánta integridad le queda vs. su máximo
- **Criticidad** (1–5): los de criticidad 4–5 tienen mayor impacto en Estabilidad

**Los 12 servicios:**
| ID | Servicio | Criticidad |
|---|---|---|
| S1 | Refinerías | 5 |
| S2 | Terminales/Combustibles | 4 |
| S3 | Generación termoeléctrica | 5 |
| S4 | Transmisión eléctrica | 5 |
| S5 | Distribución eléctrica | 5 |
| S6 | Backhaul/Fibra (troncal) | 5 |
| S7 | Red móvil | 5 |
| S8 | Nube/Datacenter | 4 |
| S9 | DNS | 4 |
| S10 | Pagos/Banca | 5 |
| S11 | Carreteras | 4 |
| S12 | Puertos y Aduanas | 5 |

### 6.3 Panel Campaña MalOsos (5 fases)

Visible para todos. Muestra el avance de la campaña de ataque de MalOsos:

```
[RECON] → [ACCESS] → [PERSISTENCE] → [LATERAL_MOVEMENT] → [IMPACT]
   ✓          ✓              ○                  ○                 ○
```

- **✓ completado**: MalOsos completó permanentemente esa fase
- **○ pendiente**: fase no completada aún

> Las cartas de Impacto Alto de MalOsos requieren completar las fases anteriores.

### 6.4 Panel Fase + Presupuesto + Cartas (panel derecho)

Este panel cambia según la fase activa:

| Elemento | Descripción |
|---|---|
| **Fase actual** | Nombre de la fase (ej. "Preparacion MalOsos") |
| **"Avanzar fase"** | Botón para pasar a la siguiente fase. Solo el facilitador o el equipo activo deben hacer clic. |
| **Presupuesto restante** | Puntos que te quedan para jugar cartas este turno |
| **"Accion basica"** | Botón de acción gratuita (aparece si aún no se usó este turno) |
| **Tu mano (N)** | Lista de cartas en tu mano con nombre, costo e íconos |

### 6.5 Log de acciones (panel inferior derecho)

Registro cronológico de todo lo que ocurre durante la partida: cartas jugadas, fases avanzadas, daños, cambios de estado de servicios. Útil para el debrief posterior.

---

## 7. Flujo de turno completo (fase por fase)

Cada turno pasa por 7 fases en orden fijo:

```
MAINTENANCE → EVENT → MALOSOS_PREP → MALOSOS_ATTACK → BUENOSOS_RESPONSE → CASCADE_EVAL → TURN_END
```

### 7.1 MAINTENANCE — "Mantenimiento" (automática)

**Quién actúa:** Nadie. El motor la procesa automáticamente.
**Qué pasa:**
- Los servicios en estado DEGRADED pierden **-1 INT** automáticamente
- El presupuesto de ambos equipos se **repone** al valor configurado (ej. 8)
- Ambos equipos **roban cartas** hasta tener 5 en mano
- El facilitador hace clic en **"Avanzar fase"** para pasar al Evento

**Qué ves en la UI:** El badge muestra "Mantenimiento". Las barras INT de servicios degradados pueden bajar. Las cartas en mano se reponen.

---

### 7.2 EVENT — "Evento" (automática)

**Quién actúa:** El facilitador avanza la fase.
**Qué pasa:**
- El motor revela automáticamente una carta de **Evento (Tail Risk)** del mazo de eventos
- Si la condición del evento se cumple, su efecto se aplica inmediatamente (ej. "S4 y S5 reciben -2 INT")
- Si no se cumple, el evento se descarta silenciosamente (o queda "latente" si así lo indica)

**Qué ves en la UI:** Una entrada en el Log con el nombre del evento y sus efectos. Las barras INT pueden bajar si el evento activó.
El facilitador hace clic en **"Avanzar fase"** para pasar a Preparación MalOsos.

---

### 7.3 MALOSOS_PREP — "Preparacion MalOsos" (interactiva)

**Quién actúa:** Equipo **MALOSOS**.
**Qué puede hacer:**
- Jugar cartas de **Reconocimiento** (RECON) para marcar la fase permanente en la campaña
- Jugar cartas de **Recurso** (RESOURCE) para obtener ventajas este turno
- Usar la **Acción básica** ("Recon básico") si no tiene cartas RECON

**Ejemplo de carta en esta fase:** M01 "OSINT y mapeo de dependencias" (costo 2) — marca RECON permanente y daña 1 INT a cualquier servicio.

**Cuando termina:** MalOsos hace clic en **"Avanzar fase"** cuando termina sus preparativos.

---

### 7.4 MALOSOS_ATTACK — "Ataque MalOsos" (interactiva)

**Quién actúa:** Equipo **MALOSOS**.
**Qué puede hacer:**
- Jugar cartas de **Acceso** (requieren RECON completado)
- Jugar cartas de **Persistencia**, **Movimiento Lateral** (requieren fases previas)
- Jugar cartas de **Impacto** (dañan servicios, cambian estados)
- Jugar cartas **Sociales** (reducen Confianza pública, sin requisitos de campaña)

**Restricciones:**
- Solo puede completar **1 fase de campaña nueva por turno** (anti-salto)
- Las cartas de Impacto Alto requieren tener completadas las fases que indica la carta
- No puede gastar más presupuesto del disponible

**Cuando termina:** MalOsos hace clic en **"Avanzar fase"**.

---

### 7.5 BUENOSOS_RESPONSE — "Respuesta BuenOsos" (interactiva)

**Quién actúa:** Equipo **BUENOSOS**.
**Qué puede hacer:**
- Jugar cartas de **Prevención** (reducen daño futuro este turno)
- Jugar cartas de **Detección/Respuesta** (contención, aislamiento)
- Jugar cartas de **DRP** (recuperación técnica: restore, failover)
- Jugar cartas de **BCP** (continuidad: operación manual, comunicación de crisis)
- Usar la **Acción básica** ("Monitoreo básico") para proteger un servicio

**Restricciones:**
- Las cartas DRP de tipo "Restore" requieren haber jugado "Backups verificados" antes (cualquier turno)
- No puede gastar más presupuesto del disponible

**Cuando termina:** BuenOsos hace clic en **"Avanzar fase"**.

---

### 7.6 CASCADE_EVAL — "Evaluacion en Cascada" (automática)

**Quién actúa:** Nadie. El motor procesa automáticamente hasta 3 oleadas de cascada.
**Qué pasa:**
- El motor revisa las **dependencias** entre servicios
- Si un servicio está degradado, sus dependientes reciben daño automático
- Si un servicio cae (DOWN), puede arrastrar a sus dependientes
- Se ejecutan hasta **3 oleadas** para capturar efectos en cadena

**Qué ves en la UI:** Múltiples entradas en el Log con daños por cascada. Las barras INT pueden bajar notablemente.

---

### 7.7 TURN_END — "Fin de Turno" (automática)

**Quién actúa:** Nadie. El motor calcula penalizaciones y avanza el turno.
**Qué pasa:**
1. Se calculan penalizaciones de **Estabilidad** por estado de servicios:
   - DEGRADED: -2 por servicio
   - INTERMITTENT: -3 por servicio
   - DOWN: -6 por servicio
   - Criticidad 4: -2 adicionales; Criticidad 5: -4 adicionales
2. La pérdida máxima de Estabilidad por turno es **-25** (tope anti-derrumbe)
3. Si **Confianza ≤ 0**: se aplican -5 adicionales a Estabilidad
4. Se verifica si alguien ganó (ver sección 10)
5. El contador de turno se incrementa: `Turno N → Turno N+1`

**Qué ves en la UI:** Las barras de Estabilidad y Confianza se actualizan. El turno avanza.

---

## 8. Cómo jugar una carta

### Paso a paso:

1. Asegúrate de que es **tu fase** (el badge de fase dice "Preparacion MalOsos", "Ataque MalOsos" o "Respuesta BuenOsos" según tu rol)
2. En el **panel derecho**, verás tus cartas con su nombre, costo y estado (habilitada/deshabilitada)
3. Las cartas **habilitadas** (sin opacidad reducida) son las que puedes jugar con tu presupuesto actual
4. Haz clic en la carta que deseas jugar

### Si la carta requiere seleccionar un objetivo:
5. Aparecerá un mensaje: **"Selecciona un servicio como objetivo"**
6. Haz clic en el servicio del tablero que deseas como objetivo
7. La carta se juega automáticamente con ese objetivo

### Si la carta no requiere objetivo:
5. La carta se juega inmediatamente al hacer clic

### Resultado:
- Tu presupuesto disminuye según el costo de la carta
- El Log registra la acción con todos sus efectos
- El estado de los servicios afectados se actualiza en tiempo real para todos los jugadores

### Cuándo una carta aparece deshabilitada:
- **Presupuesto insuficiente**: el costo supera tu presupuesto restante
- **Requisitos no cumplidos**: la carta requiere una condición que no se ha cumplido (ej. BACKUPS_VERIFIED, o completar una fase de campaña)
- **No es tu fase**: estás en una fase donde no puedes actuar

---

## 9. Acción básica

Cada equipo puede usar **1 acción básica gratuita por turno** (costo 0). El botón **"Accion basica"** aparece en el panel si aún no se usó este turno.

### MalOsos — Recon básico
- Marca "Reconocimiento" como completado **solo para este turno** (no es permanente)
- Permite jugar cartas que requieran RECON completado (como Acceso inicial)
- Útil cuando no tienes la carta M01 (OSINT) en mano

### BuenOsos — Monitoreo básico
- Elige **1 servicio** en el tablero haciendo clic sobre él
- El primer daño que reciba ese servicio este turno se reduce en **-1 INT**
- Útil para proteger un servicio crítico sin gastar presupuesto

> **Regla:** Solo se puede usar una acción básica por turno. Si ya la usaste, el botón desaparece.

---

## 10. Condiciones de victoria y derrota

### Victoria MalOsos (ganan si ocurre cualquiera):
1. **Estabilidad del País llega a 0**
2. **3 servicios de Criticidad 5 caen (DOWN) durante la partida**

Los servicios de Criticidad 5 son: S1, S3, S4, S5, S6, S7, S10, S12

### Victoria BuenOsos (ganan si al final del último turno):
1. **Estabilidad > 30**, Y
2. **Han recuperado al menos 2 servicios** que estuvieron DOWN en algún momento

> **Nota sobre recuperación:** Para que BuenOsos pueda contar una recuperación, el servicio debe haber caído (DOWN) y luego BuenOsos debe haberlo restaurado con una carta DRP (Restore controlado, Failover).

### Empate / Sin resultado:
Si la partida termina sin que ninguno cumpla sus condiciones, el Facilitador arbitra el resultado basándose en el estado final.

---

## 11. Ejemplo de Turno 1 completo con decisiones comentadas

Esta sección guía a través de un Turno 1 típico, explicando las decisiones de cada equipo.

### Estado inicial
```
Estabilidad: 100 | Confianza: 50 | Turno: 1
Todos los servicios: OK, INT al máximo
BuenOsos mano: 5 cartas (ej. B04, B07, B15, B17, B18)
MalOsos mano: 5 cartas (ej. M01, M06, M15, M17, M18)
```

### Fase: MAINTENANCE (automática)
> El facilitador hace clic en "Avanzar fase".
> No hay servicios degradados, por lo que no hay penalizaciones automáticas.
> Ambos equipos ya tienen 5 cartas (no robaron más).

### Fase: EVENT (automática)
> El motor revela automáticamente una carta de evento.
> Supón que sale **E08 "Respuesta coordinada excepcional"** (evento positivo): BuenOsos puede jugar 1 carta adicional este turno sin pagar costo.
> El facilitador avanza la fase.

### Fase: MALOSOS_PREP
> **Decisión MalOsos:** ¿Usar Recon básico o jugar M01?
> - Si tienen M01 (OSINT, costo 2) en mano: **juegan M01** → marca RECON permanente + daña 1 INT a S9 (DNS, servicio frágil)
> - Si no tienen M01: usan **Acción básica** → Recon temporal solo este turno
>
> **Razonamiento:** El RECON permanente permite jugar cartas de Acceso en turnos futuros. El temporal solo sirve para este turno.
>
> MalOsos avanza la fase.

### Fase: MALOSOS_ATTACK
> **Decisión MalOsos:** Con RECON completado (permanente o temporal), ¿qué atacar?
> - **Opción A (agresiva):** Jugar M15 "Campaña de desinformación" (costo 3, sin requisitos) → Confianza -6. Golpe psicológico temprano.
> - **Opción B (estratégica):** Si tienen M02 "Acceso inicial" (costo 3, requiere RECON) → Marca ACCESS permanente + S6 DEGRADED. Sienta bases para ataques futuros.
>
> **Recomendación inicial:** M15 si se quiere presión inmediata; M02 si se planea escalar en turnos 2-3.
>
> Supongamos que MalOsos juega **M15** → Confianza baja a 44.
> MalOsos avanza la fase.

### Fase: BUENOSOS_RESPONSE
> **Estado actual:** Confianza = 44. Todos los servicios OK.
>
> **Decisión BuenOsos:** ¿Qué priorizar?
> - **Opción A (recuperar confianza):** Jugar B18 "Comunicación de crisis" (costo 2) → Confianza +6 (a 50), ignorar penalización de confianza este turno.
> - **Opción B (preventivo):** Jugar B04 "Hardening operacional" (costo 2, objetivo: S9) → reduce en -2 el daño que reciba S9 este turno.
>
> **Razonamiento:** Como no hay servicios caídos aún, la Confianza en 44 es manejable. Sin embargo, MalOsos puede aprovechar S7 o S10 degradados para -3 adicionales. Conviene proteger un servicio estratégico.
>
> BuenOsos juega **B04 apuntando a S9** (S9 ya recibió -1 INT de M01, tiene INT=11).
> Si tienen presupuesto, también juegan **B18** → Confianza vuelve a 50.
> BuenOsos avanza la fase.

### Fase: CASCADE_EVAL (automática)
> No hay servicios DEGRADED ni INTERMITTENT, por lo que no hay cascada significativa.
> S9 tiene INT=11 (levemente dañado pero OK).

### Fase: TURN_END (automática)
> **Cálculo de penalizaciones:**
> - Todos los servicios en OK → Estabilidad -0 por estados
> - S9 en OK (INT=11, no DEGRADED) → sin penalización
> - Confianza = 50 → sin penalización extra
>
> **Resultado del Turno 1:**
> ```
> Estabilidad: 100 (sin pérdida)
> Confianza: 50 (recuperada con B18)
> Turno: 1 → 2
> ```
>
> **Reflexión (micro-debrief):**
> - MalOsos: "Ejecuté desinformación para bajar confianza, base para ataques sociales futuros"
> - BuenOsos: "Protegí S9 con Hardening y recuperé confianza con Comunicación de crisis"

---

## 12. Preguntas frecuentes

### ¿Por qué mis cartas aparecen deshabilitadas?

**Causa 1 — No es tu fase:**
El botón de jugar carta solo se activa durante tu fase de juego. BuenOsos no puede jugar en la fase de MalOsos y viceversa.

**Causa 2 — Presupuesto insuficiente:**
Cada carta tiene un costo. Si tu presupuesto restante es menor al costo de la carta, aparece deshabilitada. Ejemplo: si te quedan 2 puntos, no puedes jugar una carta de costo 3.

**Causa 3 — Requisitos no cumplidos:**
Algunas cartas requieren condiciones previas:
- MalOsos: cartas de ACCESS requieren RECON completado; cartas de IMPACT_ALTO requieren fases de campaña completadas
- BuenOsos: "Restore controlado" (B13) requiere haber jugado "Backups verificados" (B12) antes

---

### ¿Qué hago si me quedé sin cartas útiles?

Usa la **Acción básica** (gratuita, costo 0):
- MalOsos: Recon básico (permite jugar cartas de Acceso este turno sin carta RECON)
- BuenOsos: Monitoreo básico (protege 1 servicio contra -1 daño este turno)

Si tampoco la has usado y el presupuesto se agotó, simplemente haz clic en **"Avanzar fase"** para ceder el turno.

---

### ¿Qué es el "Recon básico"? ¿Es lo mismo que jugar M01?

No exactamente. Diferencias:
| | Recon básico (acción gratuita) | M01 OSINT (carta) |
|---|---|---|
| Costo | 0 | 2 presupuesto |
| RECON permanente | No (solo este turno) | Sí (resta en campaña) |
| Daño adicional | No | -1 INT a un servicio |

Usa la acción básica si no tienes M01 o si quieres guardar presupuesto. Usa M01 si quieres el RECON permanente para turnos futuros.

---

### ¿Por qué bajó la Estabilidad aunque protegí mis servicios?

La Estabilidad puede bajar por:
1. **Penalizaciones por estado de servicios** al final del turno (DEGRADED -2, INTERMITTENT -3, DOWN -6)
2. **Penalizaciones por criticidad** (criticidad 4: -2 extra, criticidad 5: -4 extra)
3. **Confianza en 0**: si la Confianza llega a cero, se aplican -5 adicionales por turno
4. **Cartas sociales de MalOsos**: M16 "Extorsión y pánico" aplica -5 directamente a Estabilidad

---

### ¿Cuántas cartas puedo jugar por turno?

Tantas como tu presupuesto permita. Cada carta tiene un costo y tu presupuesto se repone al inicio de cada turno (valor configurado al crear la partida, recomendado: 8).

**Límite de mano:** Máximo 7 cartas en mano. Si al inicio del turno tienes más de 7, debes descartar hasta quedar en 7.

---

### ¿Qué son las cartas de Evento?

Son cartas de **Tail Risk** (riesgo de cola): eventos de baja probabilidad pero alto impacto, como "Evento solar severo" o "Falla regional de energía". Se revelan automáticamente al inicio de cada turno (Fase EVENT). Pueden:
- Activarse inmediatamente si se cumple su condición
- Quedar "latentes" y activarse en un turno posterior
- Ser positivos (como E08 "Respuesta coordinada excepcional")

Ningún equipo controla las cartas de evento — son el componente de azar del juego.

---

### ¿Puedo recuperar un servicio caído?

Sí, pero requiere cartas DRP específicas:
- **B13 "Restore controlado"** (costo 4): mueve un servicio DOWN → DEGRADED con INT=6. Requiere haber jugado B12 antes.
- **B14 "Failover a sitio alterno"** (costo 5): mueve un servicio digital DOWN → INTERMITTENT con INT=8.

Si no tienes esas cartas, usa **B12 "Backups verificados"** primero (+3 INT a un servicio, habilita el Restore).

---

### ¿Cuándo termina la partida?

La partida termina cuando:
1. **MalOsos gana**: Estabilidad llega a 0, o 3 servicios de Criticidad 5 caen
2. **BuenOsos gana**: Se completan todos los turnos con Estabilidad > 30 y ≥2 servicios recuperados
3. **Turno límite alcanzado** sin condición de victoria clara

Al finalizar, el banner "Ganador: BuenOsos/MalOsos" aparece en la cabecera.

---

### El log no se actualiza, ¿hay algún problema?

El log y el estado del tablero se actualizan vía **WebSocket** en tiempo real. Si ves que el estado no se actualiza:
1. Verifica el indicador de conexión en la cabecera (punto verde = conectado, punto rojo = desconectado)
2. Si está desconectado, el cliente intentará reconectarse automáticamente (hasta 3 intentos)
3. Si la reconexión falla, recarga la página — tu sesión se restaurará automáticamente vía localStorage

---

*Manual generado para fenyflow v1.0 — BuenOsos vs MalOsos*
*Autor del juego: Mtro. Omar Francisco Velazquez Juarez — Licencia CC BY 4.0*
