# Reglas del juego: **BuenOsos vs MalOsos**

**Licencia:** Creative Commons Attribution 4.0 International (CC BY 4.0)

Puedes **copiar, distribuir, remezclar, adaptar y usar** este material (incluso con fines comerciales), siempre que otorgues **atribución** adecuada.

Atribución sugerida: “BuenOsos vs MalOsos — Reglas y set de cartas (CC BY 4.0). Autor: **Mtro. Omar Francisco Velazquez Juarez** ([ovelazquezj@gmail.com](mailto:ovelazquezj@gmail.com)). adaptación asistida por ChatGPT.”

Juego didáctico por equipos para modelar **riesgo país**, **fallas en cascada**, **modelo de adversario** y **tail risk**, destacando el papel de **DRP (Disaster Recovery Plan)** y **BCP (Business Continuity Plan)**.

---

## 1) Objetivo del juego

* **MalOsos**: provocar **impacto sistémico** (no solo “hackear”), llevando la **Estabilidad del País** a 0 **o** derribando **3 servicios de Criticidad 5**.
* **BuenOsos**: resistir **X turnos** (recomendado: 8) manteniendo **Estabilidad > 30** y **recuperar al menos 2 servicios** que hayan caído.

---

## 2) Componentes

### 2.1 Tipos de cartas

1. **Servicios / Infraestructura (neutrales)**

   * Representan sistemas del país.
   * Atributos mínimos:

     * **INT (Integridad actual)**
     * **INTmáx (Integridad máxima / valor inicial)**
     * **Criticidad (1–5)**
     * **Dependencias** (2–4 servicios)
     * **Efecto al caer** (dispara cascada)

2. **Cartas MalOsos (ataque)**

   * Subtipos:

     * **Fase de campaña**: Reconocimiento, Acceso, Persistencia, Movimiento Lateral, Impacto
     * **Técnica/Táctica**: phishing, DDoS, supply chain, sabotaje físico coordinado, etc.
     * **Recursos**: botnet, insiders, tiempo, dinero, infraestructura

3. **Cartas BuenOsos (resiliencia)**

   * Subtipos:

     * **Prevención** (reduce probabilidad o daño)
     * **Detección/Respuesta** (contener, aislar, restaurar control)
     * **DRP** (recuperación técnica: restore/failover/runbooks)
     * **BCP** (continuidad operativa: operación degradada/manual, priorización, comunicación)

4. **Cartas de Evento (Tail Risk)**

   * Baja probabilidad, alto impacto.
   * Se roban desde el mazo de eventos en cada turno.

### 2.2 Marcadores y tableros

* **Estabilidad del País**: inicia en **100**.
* **Confianza Pública**: inicia en **50**.
* **Turno / Tiempo**: inicia en **1**.
* **Mapa de Dependencias**: mesa con 8–12 cartas de servicios conectadas por flechas.

### 2.3 Set base recomendado de Servicios (para la mesa)

Para una partida estándar (8 turnos) se recomienda usar **12 servicios**. Este set integra infraestructura digital y física, incluyendo **carreteras, termoeléctricas y refinerías**.

Tabla sugerida (ajusta INT si quieres más o menos duración):

|  ID | Servicio (carta)                              | Criticidad | INT sugerida | Nota didáctica (qué enseña)               |
| --: | --------------------------------------------- | :--------: | :----------: | ----------------------------------------- |
|  S1 | **Refinerías**                                |      5     |      18      | Combustibles como habilitador transversal |
|  S2 | **Terminales/Almacenamiento de combustibles** |      4     |      16      | Distribución y cuello de botella          |
|  S3 | **Generación termoeléctrica**                 |      5     |      18      | Dependencia de combustibles y OT          |
|  S4 | **Transmisión eléctrica**                     |      5     |      18      | Red troncal de energía                    |
|  S5 | **Distribución eléctrica**                    |      5     |      18      | Continuidad local y última milla          |
|  S6 | **Backhaul/Fibra (troncal)**                  |      5     |      16      | Interdependencia energía-telecom          |
|  S7 | **Red móvil**                                 |      5     |      16      | Operación social y coordinación           |
|  S8 | **Nube/Datacenter**                           |      4     |      14      | Centralización y recuperación             |
|  S9 | **DNS**                                       |      4     |      12      | Fragilidad por servicio común             |
| S10 | **Pagos/Banca**                               |      5     |      14      | Impacto ciudadano y economía              |
| S11 | **Carreteras y autopistas**                   |      4     |      16      | Logística, insumos, movilidad             |
| S12 | **Puertos y aduanas (comercio exterior)**     |      5     |      14      | Importación, cadenas de suministro        |

Regla opcional de expansión (si hay 90 min): agrega **Ferrocarril** (Crit 4–5) y **Bombeo/Potabilización de agua** (Crit 5).

---

## 3) Preparación (Setup) — paso a paso

1. **Seleccionar servicios**

   * El facilitador elige **12 cartas** del set base recomendado (sección 2.3) y las coloca boca arriba.

2. **Construir el mapa de dependencias (estándar)**

   * Usa el **Mapa estándar** del Anexo A (al final) para dibujar las flechas.
   * Regla mínima: cada servicio debe tener **2–4 dependencias**.

3. **Separar y barajar mazos**

   * Mazo **BuenOsos**: barajar y colocar boca abajo.
   * Mazo **MalOsos**: barajar y colocar boca abajo.
   * Mazo **Eventos (Tail Risk)**: barajar y colocar boca abajo.
   * Regla: **cada equipo solo roba de su propio mazo**. El mazo de Eventos no pertenece a ningún equipo.

4. **Definir parámetros de partida**

   * Turnos totales: recomendado **8**.
   * Presupuesto por turno: recomendado **8 puntos** por equipo.
   * Marcadores iniciales:

     * Estabilidad del País = **100**
     * Confianza Pública = **50**
     * Turno = **1**

5. **Mano inicial (robo inicial)**

   * **BuenOsos** roba **5 cartas** del **Mazo BuenOsos**.
   * **MalOsos** roba **5 cartas** del **Mazo MalOsos**.
   * Nadie roba cartas del mazo de Eventos en esta etapa.

6. **Confirmación de inicio**

   * El facilitador lee en voz alta:

     * Condiciones de victoria (sección 6)
     * Orden del turno (sección 5)
     * Regla de cascada (sección 7)

---

## 4) Conceptos clave del sistema

### 4.1 Estados de un servicio

* **OK**: sin penalización.
* **Degradado**: pierde **1 INT por turno** (además de cascadas) y reduce Estabilidad.
* **Intermitente**: puede propagar fallas a dependientes (ver 7.6).
* **Caído**: **INT = 0**. Dispara cascada y penalizaciones.

### 4.2 Costos y límites por turno

* Cada carta tiene **Costo (1–5)**.
* Cada equipo dispone de **Presupuesto por Turno**:

  * Recomendado: **8 puntos** por turno.
* Un equipo puede jugar cartas hasta agotar su presupuesto.

### 4.3 Regla de campaña (Modelo de adversario)

Para evitar “ataques mágicos”, MalOsos debe seguir una secuencia de campaña.

* MalOsos tiene una **Línea de Campaña** con 5 casillas:

  1. Reconocimiento
  2. Acceso
  3. Persistencia
  4. Movimiento Lateral
  5. Impacto

**Regla**: Para jugar una carta de **Impacto Alto**, MalOsos debe haber completado las fases previas indicadas en el texto de la carta.

* Ejemplo: “Ransomware Operacional” requeriría **Acceso + Persistencia**.

**Límite de aceleración (anti-salto):**

* MalOsos puede marcar como “completada” **máximo 1 fase nueva por turno** (Recon básico no cuenta como fase permanente).
* Si en un mismo turno juega varias cartas de fase (por presupuesto), solo la primera avanza la línea; las demás aplican su efecto pero **no avanzan** fases adicionales.

### 4.4 Acciones básicas (para evitar bloqueos por mala mano) (para evitar bloqueos por mala mano)

Cada equipo puede ejecutar **1 acción básica por turno** (costo 0). No requiere carta.

* **MalOsos — Recon básico**: marca “Reconocimiento” como completado **solo para este turno** (no se queda permanente). Permite jugar cartas que requieran Recon este turno.
* **BuenOsos — Monitoreo básico**: elige 1 servicio; hasta el final del turno, el primer daño que reciba ese servicio se reduce en **-1 INT**.

Regla: solo se puede usar **una** acción básica por turno, y no se acumula con otra acción básica.

---

## 5) Estructura del turno — orden exacto

Cada turno se juega siempre en este orden y sin saltos.

### Inicio del turno (paso 0: mantenimiento y robo)

0.0 **Mantenimiento de estados (pérdida automática de INT)**

* Por cada servicio **Degradado**: pierde **-1 INT**.
* Los servicios **Intermitentes** no pierden INT automáticamente (su riesgo es la propagación, ver 7.6).
* Los servicios **Caídos** permanecen en **INT = 0**.
* Si un servicio llega a INT ≤ 0 por este mantenimiento, se ajusta a INT = 0 y pasa a **Caído** (aplica “Efecto al caer” si corresponde).

0.1 **Reiniciar presupuestos**

* Cada equipo recupera su **Presupuesto por Turno** completo (recomendado: 8).

0.2 **Robo hasta mano objetivo**

* **BuenOsos** roba del **Mazo BuenOsos** hasta tener **5 cartas en mano**.
* **MalOsos** roba del **Mazo MalOsos** hasta tener **5 cartas en mano**.
* Regla: si un mazo se agota, se baraja su descarte para formar un nuevo mazo.

0.3 **Límite de mano (previo al turno)**

* Si un equipo excede **7 cartas**, debe descartar inmediatamente hasta quedar en 7.

### Fase 1: Evento (Tail Risk) — facilitador

1.1 El facilitador roba **1 carta** del **Mazo de Eventos (Tail Risk)**.

1.2 Resolución del evento

* Si la carta indica **Activar** o se cumple su condición, se aplica de inmediato.
* Si la carta indica **No activa**, se descarta (salvo que diga “Evento latente”).

### Fase 2: Preparación (MalOsos) — Reconocimiento/Recursos

2.1 MalOsos puede jugar cartas de **Reconocimiento** y/o **Recursos** pagando su costo.

2.2 Efectos típicos

* Obtener “ventaja”, colocar marcadores de campaña, habilitar prerequisitos.

2.3 Regla

* MalOsos no puede jugar cartas de “Impacto Alto” si no cumple la **Regla de campaña** (sección 4.3).

### Fase 3: Ataque (MalOsos) — Acciones contra servicios

3.1 MalOsos puede jugar cartas de ataque pagando su costo.

3.2 Cada carta debe declarar explícitamente:

* **Servicio objetivo** (o dos objetivos si la carta lo permite)
* **Daño** en INT (Integridad) y/o **cambio de estado**
* Cualquier **propagación** definida por la carta

3.3 Aplicación

* Se aplica primero el efecto al servicio objetivo.
* Luego se aplican efectos secundarios si la carta lo especifica.

### Fase 4: Respuesta y Continuidad (BuenOsos)

4.1 BuenOsos juega cartas pagando su costo.

4.2 Tipos de respuesta

* **Prevención**: reduce daño futuro o bloquea técnicas.
* **Detección/Respuesta**: contención, aislamiento, corte de propagación.
* **DRP**: recuperación técnica (restore/failover/runbooks).
* **BCP**: continuidad operativa (operación degradada/manual, priorización, comunicación).

4.3 Restricción didáctica

* Una carta DRP/BCP debe indicar qué servicio/proceso protege y qué impacto reduce.

### Fase 5: Cascada y Evaluación (riesgo país)

5.1 Evaluar cascadas

* Se aplican las reglas de dependencias (sección 7).

5.2 Ajustar marcadores

* Estabilidad y Confianza se actualizan (sección 8).

5.3 Micro-debrief (obligatorio)

* **MalOsos** explica en 30–45 s: “qué fase de campaña avanzó” y “qué buscaba el ataque”.
* **BuenOsos** explica en 30–45 s: “qué control DRP/BCP cambió (o no) el resultado”.

5.4 Fin del turno

* Incrementar Turno = Turno + 1.

---

## 6) Condiciones de victoria

* **Victoria MalOsos** si ocurre cualquiera:

  1. Estabilidad del País llega a **0**.
  2. Caen **3 servicios** con **Criticidad 5**.

* **Victoria BuenOsos** si al final del turno X:

  1. Estabilidad del País es **> 30**.
  2. Han recuperado **al menos 2 servicios** que estuvieron Caídos.

---

## 7) Reglas de cascada (Cascading failures)

### 7.1 Principio general

* Las dependencias generan **degradación progresiva**: no es “solo se propaga si está Caído”.
* La cascada se evalúa en **oleadas** para capturar efectos en cadena sin entrar en bucles.

### 7.2 Oleadas de cascada (para evitar bucles)

En la **Fase 5**, resuelve cascadas en oleadas:

1. **Oleada 1**: aplica impactos por dependencias a todos los servicios.
2. Si algún servicio cambia de estado o llega a **INT = 0** en esa oleada, se marca como “cambio”.
3. Repite una nueva oleada.

* Detente cuando:

  * No haya cambios en una oleada, o
  * Se alcance el **límite de 3 oleadas** en el turno.

Regla anti-bucle: si tras 3 oleadas siguen ocurriendo cambios, el facilitador aplica solo el cambio más crítico y difiere el resto al siguiente turno.

### 7.3 Impacto por estado de las dependencias

Para cada servicio, revisa el estado de **cada dependencia** y aplica lo siguiente:

* Si una dependencia está **Degradada**:

  * El servicio recibe **-1 INT**.

* Si una dependencia está **Intermitente**:

  * El servicio recibe **-1 INT** y, además, el servicio queda **Intermitente** si ya tenía otra dependencia afectada (Degradada, Intermitente o Caída).

* Si una dependencia está **Caída**:

  * El servicio recibe **-2 INT** y pasa a **Degradado** (si estaba OK).

Regla acumulativa:

* Suma impactos por cada dependencia afectada.
* Si el servicio acumula **2 o más dependencias afectadas** (en cualquier estado distinto de OK), el servicio pasa a **Intermitente**.

### 7.4 Umbrales y estados

* Si un servicio llega a **INT ≤ 0**, se ajusta a **INT = 0** y pasa a **Caído**.
* Un servicio **Caído** permanece Caído hasta que una carta DRP lo recupere.

### 7.5 Efecto al caer

Cuando un servicio pasa a **Caído**, se aplica su “Efecto al caer” inmediatamente (si lo tiene) y se continúa con la oleada actual.

### 7.6 Intermitencia (azar controlado o modo determinista)

**Opción A — con dado/moneda (recomendado):**

* Por cada servicio **Intermitente**, tira 1 vez por turno:

  * Éxito: no propaga este turno.
  * Falla: elige 1 dependiente y aplícale **-2 INT**.

**Opción B — sin azar (modo determinista):**

* Todo servicio **Intermitente** propaga a **1 dependiente** en **turnos impares** (1,3,5,...) y no propaga en turnos pares.

---

## 8) Impacto país: Estabilidad y Confianza

### 8.1 Ajuste base por estado de servicios

Al final de cada turno (después de la cascada):

* Por cada servicio **Degradado**: Estabilidad **-2**.
* Por cada servicio **Intermitente**: Estabilidad **-3**.
* Por cada servicio **Caído**: Estabilidad **-6**.

**Tope por turno (anti-derrumbe instantáneo):**

* La pérdida total de Estabilidad en un turno no puede exceder **-25** (antes de aplicar cartas BCP que reduzcan daño).

### 8.2 Criticidad multiplica el impacto

Si un servicio afectado tiene **Criticidad 4 o 5**, aplica además:

* Estabilidad adicional: **-2 × (Criticidad - 3)**

  * Criticidad 4: -2
  * Criticidad 5: -4

### 8.3 Confianza pública

* Por caída de servicios de cara al ciudadano (ej. pagos, comunicaciones, trámites): Confianza **-3** por servicio.
* Si Confianza llega a **0**, cada turno adicional Estabilidad **-5** (efecto social/pánico).

**Tope por turno:**

* La pérdida total de Confianza en un turno no puede exceder **-15**.

BuenOsos puede jugar cartas BCP de **Comunicación de crisis** para reducir o revertir pérdidas de Confianza.

---

### 8.4 Prioridad de cálculo (para evitar discusiones)

En el cierre del turno, calcula en este orden:

1. Penalizaciones base por estado (8.1) aplicando el **tope**.
2. Penalizaciones adicionales por criticidad (8.2).
3. Penalizaciones/bonos por Confianza (8.3).
4. Aplicar reducciones por cartas BCP activas (si dicen que reducen penalizaciones).

---

BuenOsos puede jugar cartas BCP de **Comunicación de crisis** para reducir o revertir pérdidas de Confianza.

---

## 9) Reglas DRP vs BCP (para que “se sienta” la diferencia)

### 9.1 DRP (recuperación técnica)

* Una carta DRP típicamente:

  * Restaura INT (Integridad)
  * Cambia estado (Caído→Degradado u OK)
  * Reduce futuros daños de cascada

**Regla: Backup no probado = riesgo**

* Si BuenOsos no ha jugado previamente una carta tipo **“Prueba/Simulacro”**, entonces la primera acción de **Restore** del juego tiene penalización:

  * Recupera **solo la mitad** del INT (Integridad) indicado **o** cuesta +2 presupuesto.

### 9.2 BCP (continuidad operativa)

* Una carta BCP no “cura INT (Integridad)” necesariamente.
* Su función es:

  * Reducir pérdidas de Estabilidad
  * Proteger Confianza
  * Permitir operación manual/degradada

Ejemplo de regla:

* Si un servicio está **Caído** pero BuenOsos aplica “Operación manual”, entonces ese servicio cuenta como **Degradado** para la penalización de Estabilidad (no como Caído) por 1–2 turnos.

---

## 10) Robo, descarte y remezcla — reglas explícitas

### 10.1 ¿De dónde se roba?

* **BuenOsos**: solo roba del **Mazo BuenOsos**.
* **MalOsos**: solo roba del **Mazo MalOsos**.
* **Eventos (Tail Risk)**: solo roba el facilitador en la **Fase 1** de cada turno.

### 10.2 ¿Cuándo se roba?

* **Inicio del turno (Paso 0.2)**: cada equipo roba **hasta tener 5 cartas en mano**.
* No hay “robos extra” salvo que una carta lo indique.

### 10.3 Límite de mano

* Máximo **7 cartas**.
* Si un equipo queda con más de 7 por efectos de cartas, debe descartar al final de su fase hasta quedar en 7.

### 10.4 Descarte

* Cada mazo tiene su propio descarte:

  * Descarte BuenOsos
  * Descarte MalOsos
  * Descarte Eventos

### 10.5 ¿Qué pasa si se acaba un mazo?

* Si un equipo necesita robar y su mazo está vacío:

  1. Baraja su descarte.
  2. Forma un nuevo mazo.
  3. Continúa el robo.

---

## 11) Reglas de moderación del facilitador

* El facilitador asegura que cada acción tenga **causa-efecto** y que los equipos expliquen:

  * Qué servicio se afectó
  * Por qué se afectó
  * Qué dependencias propagaron el impacto
  * Qué control DRP/BCP lo mitigó (o faltó)

* Si hay disputa, se resuelve por:

  1. Texto de la carta
  2. Reglas del turno (sección 5)
  3. Reglas de cascada (sección 7)
  4. Reglas de impacto país (sección 8)
  5. Decisión del facilitador basada en coherencia del escenario

### 11.1 Resolución de “azar” sin dados (opción determinista)

Si el grupo no quiere usar azar, aplica estas reglas:

* **Descartar al azar**: en lugar de azar, el equipo afectado descarta la carta de **mayor costo**; si hay empate, descarta una de ellas a elección.
* **Elecciones ambiguas (por ejemplo, “elige un dependiente”)**: el facilitador elige el dependiente de **Criticidad más alta**; si hay empate, el de **INT más baja**.

### 11.2 Aclaración de “cancelar efectos secundarios”

Cuando una carta diga “cancela el efecto secundario”:

* Se cancela **cualquier** efecto adicional que no sea el daño/estado principal al objetivo.
* Ejemplos de efectos secundarios: propagación extra, penalización social adicional, daño a otros servicios, “efecto al caer adicional” descrito en la carta.

## 12) Cierre y debrief (obligatorio) (obligatorio)

Al finalizar la partida, cada equipo entrega verbalmente:

1. **Una cascada completa**: 1 cadena de 4–6 pasos (servicio→dependiente→impacto país).
2. **Línea de campaña** del adversario: fases jugadas y su lógica.
3. **3 decisiones DRP** y **3 decisiones BCP** que hubieran cambiado el resultado.
4. Un ejemplo de **tail risk**: por qué era improbable y qué barrera lo habría mitigado.

---

## 13) Variante rápida (si solo hay 30–40 min)

* 6 servicios en mesa.
* 5 turnos.
* Presupuesto por turno: 6.
* Sin intermitencia: Intermitente se trata como Degradado.

---

## 14) Variante avanzada (si hay 90 min)

* 12 servicios.
* 10 turnos.
* Se agrega un tercer marcador: **Costo Económico** (0–100) y penalizaciones por recuperación cara.
* Se agregan “cartas de proveedor” (dependencias externas) para simular supply chain.

---

# Anexo A) Mapa estándar de dependencias (set base)

Este mapa está diseñado para:

* Forzar interdependencias físicas–digitales.
* Generar cascadas razonables sin que el juego se vuelva incontrolable.
* Mantener 2–4 dependencias por servicio.

## A.1 Lista de dependencias (flechas)

Interpreta cada renglón como: **Servicio depende de**.

* **S1 Refinerías** depende de: **S5 Distribución eléctrica**, **S11 Carreteras**.
* **S2 Terminales/Almacenamiento de combustibles** depende de: **S1 Refinerías**, **S11 Carreteras**, **S5 Distribución eléctrica**.
* **S3 Generación termoeléctrica** depende de: **S2 Terminales**, **S5 Distribución eléctrica**.
* **S4 Transmisión eléctrica** depende de: **S3 Termoeléctrica**, **S6 Backhaul/Fibra**.
* **S5 Distribución eléctrica** depende de: **S4 Transmisión**, **S6 Backhaul/Fibra**.
* **S6 Backhaul/Fibra (troncal)** depende de: **S5 Distribución eléctrica**, **S11 Carreteras**.
* **S7 Red móvil** depende de: **S5 Distribución eléctrica**, **S6 Backhaul/Fibra**.
* **S8 Nube/Datacenter** depende de: **S5 Distribución eléctrica**, **S6 Backhaul/Fibra**, **S11 Carreteras**.
* **S9 DNS** depende de: **S5 Distribución eléctrica**, **S8 Nube/Datacenter**.
* **S10 Pagos/Banca** depende de: **S7 Red móvil**, **S9 DNS**, **S8 Nube/Datacenter**.
* **S11 Carreteras y autopistas** depende de: **S2 Terminales (combustible)**, **S5 Distribución eléctrica**.
* **S12 Puertos y aduanas** depende de: **S11 Carreteras**, **S10 Pagos/Banca**, **S7 Red móvil**.

## A.2 Notas de uso

* Este mapa introduce dos “ciclos reales” (energía–telecom y combustible–transporte) que son didácticamente valiosos.
* El juego no entra en bucle porque las cascadas se resuelven por **oleadas** con límite (sección 7.2).
* Si quieres una partida más suave (menos cascada):

  * Quita la dependencia **S4 Transmisión → S6 Backhaul**.
  * Quita la dependencia **S8 Nube → S11 Carreteras**.

## A.3 Representación rápida para el pizarrón (texto)

* Combustibles: **S1 → S2 → (S3 y S11)**
* Energía: **S3 → S4 → S5 → (S6, S7, S8, S9)**
* Internet: **S6 → (S7, S8) → S9 → S10**
* Comercio: **S10 + S11 + S7 → S12**

---

# Anexo B) Set inicial de cartas (MVP) listo para imprimir

Este set es suficiente para jugar 8 turnos con el **Mapa estándar** y validar balance.

## B.1 Plantilla de carta (formato)

**Nombre de la carta**

* Tipo: (MalOsos/BuenOsos/Evento) – Subtipo
* Costo: X (se paga del Presupuesto por Turno)
* Requisitos (si aplica): (Fases de campaña previas, condiciones)
* Efecto: (cambios de INT/estado y reglas)
* Duración: (inmediato / hasta fin de turno / permanente)

Notas:

* “Impacto Alto” se define como cualquier carta MalOsos que: (a) pueda dejar un servicio **Caído** en un solo uso, (b) afecte 2+ servicios, o (c) imponga penalizaciones directas a Estabilidad/Confianza.
* En cartas BuenOsos, especifica siempre si el efecto es **Prevención**, **Respuesta**, **DRP** o **BCP**.

---

## B.2 Mazo MalOsos (18 cartas)

### Fase / Preparación (6)

1. **OSINT y mapeo de dependencias**

* Tipo: MalOsos – Reconocimiento
* Costo: 2
* Efecto: Marca **Reconocimiento** como completado (permanente). Además, elige 1 servicio y aplica **-1 INT** (representa presión/sondeo).

2. **Acceso inicial por credenciales**

* Tipo: MalOsos – Acceso
* Costo: 3
* Requisitos: Reconocimiento completado (o usar Recon básico este turno)
* Efecto: Elige 1 servicio digital (S6–S10 o S12). Ese servicio pasa a **Degradado** y recibe **-2 INT**.

3. **Acceso por tercero (proveedor)**

* Tipo: MalOsos – Acceso / Supply chain
* Costo: 3
* Requisitos: Reconocimiento completado
* Efecto: Elige 1 de estos: **S8 Nube**, **S6 Backhaul**, **S9 DNS**. Recibe **-3 INT**. Si ya estaba Degradado, pasa a **Intermitente**.

4. **Persistencia silenciosa**

* Tipo: MalOsos – Persistencia
* Costo: 2
* Requisitos: Acceso completado
* Efecto: Marca **Persistencia** como completado (permanente). Además, la **primera** carta BuenOsos de Detección/Respuesta que se juegue este turno cuesta **+1** (fricción operativa).

5. **Movimiento lateral**

* Tipo: MalOsos – Movimiento Lateral
* Costo: 3
* Requisitos: Persistencia completada
* Efecto: Elige 2 servicios conectados por dependencia directa. Ambos reciben **-1 INT**. Si alguno estaba Degradado, ese pasa a **Intermitente**.

6. **Coordinación híbrida (ciber + físico)**

* Tipo: MalOsos – Recurso
* Costo: 2
* Efecto: Hasta fin de turno, tus cartas que afecten servicios físicos (S1–S5, S11–S12) hacen **+1 INT** de daño.

### Impacto (8)

7. **DDoS focalizado**

* Tipo: MalOsos – Impacto
* Costo: 3
* Requisitos: Acceso completado **o** tener “Coordinación híbrida” activa
* Efecto: Elige 1 servicio digital. Pasa a **Intermitente** y recibe **-2 INT**.

8. **Interrupción de troncal (Backhaul)**

* Tipo: MalOsos – Impacto Alto
* Costo: 5
* Requisitos: Movimiento Lateral completado
* Efecto: Elige **S6 Backhaul**. Recibe **-5 INT**. Si su INT llega a 0, queda **Caído**.

9. **Interrupción de distribución eléctrica**

* Tipo: MalOsos – Impacto Alto
* Costo: 5
* Requisitos: Movimiento Lateral completado
* Efecto: Elige **S5 Distribución**. Recibe **-5 INT**. Si queda Caído, además S6 y S7 reciben **-2 INT** inmediatos (efecto al caer específico).

10. **Ataque a DNS (indisponibilidad)**

* Tipo: MalOsos – Impacto
* Costo: 4
* Requisitos: Acceso completado
* Efecto: Elige **S9 DNS**. Recibe **-4 INT**. Si ya estaba Degradado, pasa a **Intermitente**.

11. **Presión sobre pagos (fraude/indisponibilidad)**

* Tipo: MalOsos – Impacto
* Costo: 4
* Requisitos: Acceso completado
* Efecto: Elige **S10 Pagos/Banca**. Recibe **-3 INT** y la Confianza Pública **-3** (tope aplica).

12. **Sabotaje logístico (carreteras)**

* Tipo: MalOsos – Impacto
* Costo: 4
* Requisitos: Reconocimiento completado
* Efecto: Elige **S11 Carreteras**. Pasa a **Degradado** y recibe **-3 INT**.

13. **Choque de combustibles (terminales)**

* Tipo: MalOsos – Impacto
* Costo: 4
* Requisitos: Reconocimiento completado
* Efecto: Elige **S2 Terminales**. Recibe **-3 INT**. Si S11 está Degradado o Intermitente, entonces S2 pasa a **Intermitente**.

14. **Paro operativo en refinerías**

* Tipo: MalOsos – Impacto Alto
* Costo: 5
* Requisitos: Movimiento Lateral completado **o** “Coordinación híbrida” activa
* Efecto: Elige **S1 Refinerías**. Recibe **-5 INT**. Si queda Caído, S2 recibe **-2 INT** inmediato.

### Efectos sociales (4)

15. **Campaña de desinformación**

* Tipo: MalOsos – Impacto Social
* Costo: 3
* Efecto: Confianza Pública **-6** (tope aplica). Si S7 o S10 están Intermitentes/Caídos, aplica **-3** adicional (pero respetando el tope).

16. **Extorsión y pánico**

* Tipo: MalOsos – Impacto Social
* Costo: 3
* Requisitos: Al menos 2 servicios Degradados o peor
* Efecto: Estabilidad **-5** (se suma y respeta tope). BuenOsos debe descartar 1 carta al azar (representa presión y ruido).

17. **Distracción múltiple**

* Tipo: MalOsos – Recurso
* Costo: 2
* Efecto: Este turno, BuenOsos solo puede jugar **1** carta de Detección/Respuesta (además de BCP/DRP).

18. **Insider oportunista**

* Tipo: MalOsos – Recurso
* Costo: 3
* Efecto: Elige 1 servicio. Ignora el primer efecto de “reducción de daño” que BuenOsos aplique sobre ese servicio este turno.

---

## B.3 Mazo BuenOsos (18 cartas)

### Prevención (6)

1. **Segmentación y zonas críticas**

* Tipo: BuenOsos – Prevención
* Costo: 3
* Efecto: Elige 1 servicio. Hasta el final del juego, el primer cambio de estado hacia **Intermitente** sobre ese servicio se cancela (permanece Degradado como máximo).

2. **Gestión de cambios controlada**

* Tipo: BuenOsos – Prevención
* Costo: 2
* Efecto: Reduce en **-1** el daño del próximo ataque MalOsos este turno (a cualquier servicio). Además, si el ataque era Impacto Alto, reduce **-2** en lugar de -1.

3. **Redundancia mínima viable**

* Tipo: BuenOsos – Prevención
* Costo: 3
* Efecto: Elige 1 servicio. Cuando ese servicio llegue a 0 por primera vez, en lugar de Caído queda en **INT = 1** y **Degradado**.
* Restricción: cada servicio solo puede beneficiarse de este efecto **1 vez por juego** (no se puede “encadenar” redundancias sobre el mismo servicio).

4. **Hardening operacional**

* Tipo: BuenOsos – Prevención
* Costo: 2
* Efecto: Elige 1 servicio. Hasta fin de turno, reduce en **-2 INT** el daño total que reciba ese servicio (acumulado).

5. **MFA/Controles de acceso**

* Tipo: BuenOsos – Prevención
* Costo: 3
* Efecto: Hasta fin de turno, MalOsos no puede jugar cartas de **Acceso** nuevas (pero sí Impacto si ya cumplía requisitos).

6. **Gestión de proveedores**

* Tipo: BuenOsos – Prevención
* Costo: 3
* Efecto: Hasta fin de turno, las cartas MalOsos “Acceso por tercero” y “Supply chain” hacen **-2 INT** menos (mínimo 0).

### Detección/Respuesta (5)

7. **Monitoreo reforzado (SOC)**

* Tipo: BuenOsos – Detección/Respuesta
* Costo: 2
* Efecto: Elige 1 servicio. Si MalOsos lo ataca este turno, ese ataque cuesta **+1** al MalOsos (fricción). Además, el daño se reduce **-1 INT**.

8. **Contención rápida**

* Tipo: BuenOsos – Detección/Respuesta
* Costo: 3
* Efecto: Elige 1 servicio Intermitente. Hasta fin de turno, **no propaga** intermitencia (anula 7.6 para ese servicio).

9. **Aislamiento de incidente**

* Tipo: BuenOsos – Detección/Respuesta
* Costo: 3
* Efecto: Elige 1 par de servicios conectados por dependencia. Este turno, ignora los efectos de cascada entre ellos (no se aplican impactos por dependencia en esa relación).

10. **CSIRT activado (runbook de contención)**

* Tipo: BuenOsos – Detección/Respuesta
* Costo: 4
* Efecto: Cancela el efecto secundario de una carta MalOsos jugada este turno (por ejemplo, propagación extra, penalización social adicional, o “efecto al caer” adicional).

11. **Búsqueda y erradicación**

* Tipo: BuenOsos – Detección/Respuesta
* Costo: 4
* Requisitos: Haber jugado alguna carta de Detección/Respuesta en turnos previos
* Efecto: Retrocede 1 fase de campaña de MalOsos (elige una completada: Persistencia o Movimiento Lateral) y se considera “no completada” hasta que MalOsos la recupere.

### DRP (4)

12. **Backups verificados (prueba incluida)**

* Tipo: BuenOsos – DRP
* Costo: 3
* Efecto: Esta carta cuenta como **“Prueba/Simulacro”**. Además, elige 1 servicio y súbele **+3 INT** (máximo su INT inicial).

13. **Restore controlado**

* Tipo: BuenOsos – DRP
* Costo: 4
* Requisitos: Haber jugado “Backups verificados” antes (en cualquier turno)
* Efecto: Elige 1 servicio **Caído**. Pasa a **Degradado** con **INT = 6**.

14. **Failover a sitio alterno**

* Tipo: BuenOsos – DRP
* Costo: 5
* Efecto: Elige 1 servicio digital (S6–S10 o S12) Caído. Pasa a **Intermitente** con **INT = 8** (se recupera rápido pero inestable).

15. **Runbook automatizado**

* Tipo: BuenOsos – DRP
* Costo: 3
* Efecto: Hasta el final del juego, tu primera carta DRP de cada turno cuesta **-1** (mínimo 1).

### BCP (3)

16. **Operación manual temporal**

* Tipo: BuenOsos – BCP
* Costo: 3
* Efecto: Elige 1 servicio ciudadano (S7, S10, S12). Si está Caído este turno, para penalizaciones de Estabilidad cuenta como **Degradado** (no Caído).

17. **Priorización de servicios esenciales**

* Tipo: BuenOsos – BCP
* Costo: 3
* Efecto: Elige 2 servicios. Este turno, las penalizaciones de Estabilidad por esos servicios se reducen a la mitad (redondeo hacia abajo).

18. **Comunicación de crisis**

* Tipo: BuenOsos – BCP
* Costo: 2
* Efecto: Confianza Pública **+6** (sin exceder 50). Además, este turno ignora penalizaciones de Estabilidad por Confianza = 0.

---

## B.4 Mazo de Eventos (Tail Risk) (8 cartas)

1. **Evento solar severo (rarísimo)**

* Tipo: Evento – Tail Risk
* Activación: Si sale en Turno 5–8, activa; si sale en Turno 1–4, “latente” (se deja a un lado y se activa automáticamente en Turno 5).
* Efecto: S6 y S7 pasan a **Intermitente** y reciben **-2 INT**.

2. **Falla regional de energía prolongada**

* Activación: siempre activa
* Efecto: S4 y S5 reciben **-2 INT** y si alguno estaba Degradado, pasa a **Intermitente**.

3. **Corte físico múltiple (fibra)**

* Activación: activa si S11 está Degradado o peor
* Efecto: S6 recibe **-3 INT**.

4. **Choque de combustibles (cadena)**

* Activación: siempre activa
* Efecto: S2 recibe **-2 INT**. Si S1 está Degradado o peor, S2 pasa a **Intermitente**.

5. **Crisis de comunicación pública**

* Activación: activa si S7 o S10 está Degradado o peor
* Efecto: Confianza **-6** (tope aplica).

6. **Fallo de proveedor crítico**

* Activación: siempre activa
* Efecto: S8 recibe **-2 INT**. Si S8 estaba Degradado, pasa a **Intermitente**.

7. **Incidente en puertos/aduanas**

* Activación: activa si S12 está Degradado o peor
* Efecto: Estabilidad **-5** (respeta tope). Representa cuello de botella económico.

8. **Respuesta coordinada excepcional**

* Tipo: Evento – Tail Risk positivo
* Activación: siempre activa
* Efecto: BuenOsos puede jugar **1 carta adicional** este turno sin pagar costo (pero sí cuenta para límite de mano).

---

## B.5 Recomendación de impresión

* Imprime cada carta en media hoja o carta completa.
* Marca con color (o borde) por tipo: Servicios / MalOsos / BuenOsos / Eventos.
* Para el MVP, no uses texto extra: solo el bloque de “Efecto” y “Costo” debe verse rápido.
