# gym//TRK — DESIGN SYSTEM (constitución visual y de interacción)

> **Fuente única de verdad** de la estética, los componentes y las reglas de interfaz de gym//TRK.
> Absorbe y reemplaza a `STYLEMAP.md` (queda como puntero). Toda pantalla, componente, gráfica o animación nueva
> se construye con este documento y se audita con `tools/ds-audit.cjs` antes de desplegar.
> Base: 2026-09-18, app v230 (`index.html`, 7,888 líneas). Se actualiza en el mismo commit que cambie el sistema.

**Cómo usarlo.** §1–§3 son la identidad (qué es y qué no es). §4 son los tokens (valores cerrados). §5–§13 son las
reglas por tema y cada componente con su función, anatomía y sí/no. §14 es el mapa por pantalla. §15–§16 las
excepciones y lo prohibido. §17–§19 el protocolo para features nuevas, la auditoría y el tooling. §20 el estado actual
(discrepancias y plan de corrección), que es la única parte que envejece.

> **Regla de oro para cualquier IA o persona que toque la UI:** *no diseñes cada pantalla — diseña el sistema y usa el
> sistema para construir cada pantalla.* Si una implementación necesita un valor que no existe aquí, primero decide
> si es una necesidad funcional nueva (se agrega al sistema, documentada) o una desviación (se corrige).

---

## 1. Definición (congelada)

**ES.** gym//TRK es un instrumento de entrenamiento monocromo, monoespaciado y denso en datos. Su lenguaje visual se
define por etiquetas de terminal (`//`), corchetes para acciones, alineación rígida, superficies planas, color solo
semántico, líneas finas, números como lecturas de instrumento, movimiento funcional y **honestidad visual sobre lo que
sabe y lo que no**. El vidrio es exclusivo del chrome flotante. Cada módulo es un instrumento distinto de la misma
familia: la función puede cambiar la composición, nunca el lenguaje.

**EN.** gym//TRK is a monochromatic, monospace, data-dense training instrument: terminal-style `//` labels, bracketed
text actions, rigid alignment, flat surfaces, semantic-only color, hairlines, numbers read like instrument readouts,
functional motion and visible honesty about what it knows and what it doesn't. Glass is reserved for floating system
chrome. Every module is a different instrument of the same family.

Lo que transmite: precisión · dato · medición · progreso · control · sistema.
Lo que **no** es: wellness · lujo decorativo · suavidad pastel · gamificación de casino · dashboard SaaS genérico.

## 2. Principios

1. **Instrumento, no decoración.** Cada elemento visible tiene una función; si se puede quitar sin perder información o
   acción, sobra.
2. **Dato primero.** Jerarquía = tipografía (tamaño, peso, opacidad) + espacio + alineación. El color y el ícono
   acompañan, no compiten: *dato > tipografía > ícono*.
3. **Honestidad.** La interfaz nunca finge saber más de lo que sabe: lo estimado lleva `~`, lo sugerido va punteado
   hasta que el dueño lo confirma, lo que no hay es un hueco o "sin dato", y nunca hay una puntuación mágica (§9).
4. **Denso ≠ amontonado.** La densidad se logra con tipografía, columnas y alineación; no pegando cosas.
5. **Color = estado.** Si un color no comunica bien/mal/atención/déficit, no va.
6. **Excepción funcional, nunca estética.** Toda excepción está en §15 con su razón.
7. **Evolución, no rediseño.** Se corrige hacia el sistema; no se cambia el "look" sin decisión del dueño.
8. **Sus etiquetas son sagradas.** Nombres de músculos, ejercicios, comidas y splits se muestran EXACTO como él los
   escribió; lo canónico es interno (regla vinculante v148).

## 3. Jerarquía de identidad

**Nivel 1 — innegociable** (si se rompe uno, la pantalla no es gym//TRK aunque use los colores):
fondo `#000` · JetBrains Mono como única familia · jerarquía por opacidad de blanco · `//` para secciones de sistema ·
`[acción]` para acciones de texto · `[uni]`/`[bi]` al frente del nombre = solo lateralidad (nunca unidad) · color solo
semántico · anillos solo en macros · glass solo en chrome flotante · contenido plano · lenguaje de honestidad ·
sin confeti, FOMO, XP ni mascotas.

**Nivel 2 — sistema** (consistente; varía solo si la función lo justifica): tokens de §4, componentes de §7.

**Nivel 3 — expresión contextual** (varía por módulo): tipo de gráfica, densidad, número de columnas, composición.

**Prueba de los 5 segundos** para cualquier pantalla: sin leer el contenido, ¿parece gym//TRK? ¿Sin logo? ¿En escala de
grises? ¿La jerarquía funciona sin color? Si alguna es "no", depende de la decoración.

---

## 4. Tokens (valores cerrados)

Todo valor visual recurrente es un token en `:root` y se usa con `var(--…)`. **Nunca** se escribe un valor literal si
existe su token. (Los tokens nuevos de hero, tracking, `--s7/--s8`, `--r-mark`, `--shadow-float`, movimiento y capas
existen desde v231.)

### 4.1 Superficies

| Token | Valor | Rol |
|---|---|---|
| `--bg`, `--frame` | `#000` | lienzo de toda la app |
| `--card` | `#0d0d10` | tarjeta, input de formulario |
| `--card2` | `#16161c` | superficie elevada (chip seleccionable, select en sheet, tooltip) |
| `--sheet-bg` | `#0a0a0c` | fallback sólido de sheets glass |
| `--track` | `#191920` | pista de barras y días vacíos del calendario |
| `--faint` | `#3a3a3e` | glifos casi apagados (`.chev`, el `#` del log de comidas); legado, no usar en nuevo |
| `--fill` / `--on-fill` | `#f3f3f4` / `#000` | fondo del botón primario / texto sobre él |

No hay grises nuevos. Si alguien necesita `#121212`, la pregunta es "¿por qué no es `--card` o `--card2`?".

### 4.2 Texto por opacidad (escala cerrada)

Todos son `rgba(243,243,244,α)`. Los nombres son históricos y **no** son su alfa; se documentan así y no se renombran.

| Token | α real | Rol |
|---|---|---|
| `--fg` | 1 | valor primario, título, número principal |
| `--o70` | .74 | secundario fuerte (texto dentro de chips, BW) |
| `--o60` | .66 | secundario, acción de texto `[ ]`, link |
| `--o50` | .56 | encabezado de sección, label de campo, `//` |
| `--o40` | .50 | meta, caption, `.submeta` |
| `--o35` | .46 | meta tenue, guía de ejercicio en curso |
| `--o30` | .40 | hint, placeholder, glifo pendiente `○` |
| `--o20` | .26 | borde de dato denso, ícono apagado |
| `--o12` | .10 | separador, fondo de pestaña activa en la nav |
| `--o10` | .06 | separador de lista, banda de rango normal |
| `--line` / `--border` | .08 / .09 | divisoria de contenido / borde de tarjeta y control |

**Prohibido** crear pasos nuevos (`--o15`, `--o25`, `--o55` se reemplazan por el vecino más cercano).

### 4.3 Semánticos

| Token | Valor | Significa | Nunca |
|---|---|---|---|
| `--good` | `#46c98b` | mejora, completo, en meta, fresco, "comida + gym" | adorno, "AUTO", badges, líneas decorativas |
| `--bad` | `#e5675c` | baja, sobre el límite, destructivo | láser del escáner, decoración |
| `--warn` | `#e3b34f` | atención, límite suave, cerca de MRV, recuperándose | categoría neutral |
| `--info` | `#6aa6ff` | **solo** déficit calórico (única excepción cool) | cualquier otro uso |

Todo color semántico va acompañado de otra señal (▲▼, texto, glifo) — nunca rojo/verde solo (§17).

### 4.4 Tipografía

Familia única: **JetBrains Mono** (Google Fonts, pesos 300/400/500/700/800), fallback `ui-monospace, Menlo`.

| Token | px | Rol | Ejemplos |
|---|---|---|---|
| `--t-caption` | 9 | **solo** mayúsculas espaciadas | `.grp-label`, ejes y leyendas de gráfica, `.plbl` |
| `--t-xs` | 10 | meta secundaria, acciones `[ ]` | `.submeta`, `.addbtn`, `.ctrls a`, estado de recuperación |
| `--t-meta` | 11 | meta primaria, filas clave-valor, chips | `.line`, `.vn`, `.sheet h3` |
| `--t-sm` | 12 | texto de controles, input de dato | `.b`, `.inp`, `.pick`, `.mdline` |
| `--t-body` | 13 | cuerpo, botón primario | `.start`, `.ok`, `.pickitem` |
| `--t-section` | 16 | `//SECCIÓN`, nombre de ejercicio, input de formulario (anti-zoom iOS) | `.section .h`, `.exhead .n`, `.field input` |
| `--t-display` | 22 | nombre del día, valor de tile | `.wname`, `.pval` |
| `--t-hero` | 34 | número protagonista de una vista | racha `.strk-n`, valor de detalle `.mdval` |

- **Prohibidos:** 7, 7.5, 8, 9.5, 14, 15, 17–21, 23–26, 30, 36, 40. Se mapean según §20.
- **Excepción de componente:** el número dentro de un anillo escala con el anillo (lg 26 · share 24 · banner 21).
- **Overlays exentos:** boot, wrap (60/44/20) y escáner (40) son pantallas de un solo mensaje.
- Micro-texto legible **≥10 px**; 9 px solo para mayúsculas espaciadas (etiquetas, ejes) y **anotaciones de dato**
  pegadas a una fila (línea de progreso por serie, T, FC, % de drop, estado de volumen).
- Inputs de formulario en **16 px** (evita el zoom de iOS).

**Peso:** 300 glifos grandes (`+` del FAB) · 400 texto · 500 (reservado, casi sin uso) · **700** énfasis, números,
botones · **800** títulos, `//SECCIÓN`, `.whdr`, nombre del ejercicio, valores display. **600 prohibido** (no está
cargado; el navegador lo pinta como 700).

**Tracking (4 roles):** `--ls-caps .2em` mayúsculas de 9–11 px (`.grp-label`, labels de campo, `ROTATION`) ·
`--ls-title .12em` `.whdr`/títulos en mayúsculas · `--ls-num -.03em` números ≥20 px · `--ls-ui .03em` botones,
controles y meta de interfaz · 0 por defecto. Un rol = un valor, siempre por token.

**Números.** Son lecturas de instrumento: la unidad va separada y más tenue (`59.8` + `kg` en `--o40`, más chica);
monoespaciado ya es tabular; decimales solo cuando informan (kg 1, porcentajes 0–1, series 1); los cambios con signo
(`+5 · −2.5 %`) y flecha ▲▼ cuando son progreso.

**Mayúsculas.** Etiquetas de sistema en MAYÚSCULAS espaciadas (`//MÚSCULOS`, `RACHA · COMIDA O GYM`); contenido en
minúsculas (nombres, meta). Sus etiquetas conservan exactamente cómo él las escribió.

### 4.5 Espaciado y ritmo

| Token | px | Uso |
|---|---|---|
| `--s1` | 2 | ajuste óptico |
| `--s2` | 4 | micro (gap de íconos, entre línea y sublínea) |
| `--s3` | 8 | interno de componente |
| `--s4` | 12 | control, fila |
| `--s5` | 16 | estándar entre bloques |
| `--s6` | 24 | separación mayor |
| `--s7` | 32 | entre secciones grandes |
| `--s8` | 48 | nivel pantalla |

**Ritmo de página** (knobs afinados por el dueño en `?design=1`; no se cambian sin él): `--sp-py 22` · `--sp-px 18`
(gutter horizontal) · `--sp-card 15` · `--sp-gap 12` · `--sp-section 14` · `--sp-field 12` · `--sp-row 12` ·
`--sp-sheet 18`.

Reglas: lo interno de un componente usa la escala `--s*` (con **6 y 10 como medios pasos** de componente); el ritmo de
página usa `--sp-*`; nada de 3/5/7/9/11/13/15 px. Los márgenes **negativos que centran un punto** (el del scrub, el
"hoy" del calendario) son geometría, no espaciado: se calculan de su tamaño y no se redondean. **Todo borde horizontal de contenido = `--sp-px`** (página, barras, nav, FAB,
sheets); solo los overlays de pantalla completa se salen.

### 4.6 Radios (comunican jerarquía)

| Token | px | Qué |
|---|---|---|
| `--r-sm` | 2 | datos densos: inputs de la tabla de sesión, celdas, indicadores |
| `--r-mark` | 4 | marcas de gráfica: días del calendario, topes de barras |
| `--r-ctl` | 12 | controles: botones, inputs y selects de formulario, toggles |
| `--radius` | 16 | tarjetas, tiles, pestañas de periodo |
| `--r-sheet` | 22 | sheets (esquinas inferiores; el sheet está anclado arriba) |
| `--r-pill` | 999 | chips seleccionables, nav, toast, barras de progreso, etiquetas flotantes |
| `50%` | — | círculos: FAB, puntos, thumbs de slider |

Tabla → casi cuadrada · control → poco redondeado · tarjeta → redondeada · sheet → muy redondeado · píldora → total.
**Prohibidos** 3/6/8/9/10/14 y los literales `999px`/`2px`/`16px` (van por token).

### 4.7 Bordes, sombras y efectos

- **Dualidad de bordes (INTENCIONAL, no unificar):** 1px `--border` en formularios, tarjetas y controles · .5px `--o20`
  en datos densos (tabla de sesión) · .5px `--o10` como separador de lista · **2px** solo como indicador (ejercicio en
  curso, hoy en el calendario, posición de drop). Sin 1.5px. Punteado = sugerido/no confirmado (§9) o líder de `.line`.
- **Sombras:** `--glass-shadow` (chrome glass) y `--shadow-float` `0 6px 22px rgba(0,0,0,.55)` para lo que
  flota sobre contenido (FAB, popover, fantasma de arrastre, panel de diseño, marco de escritorio). Ninguna otra.
  Un anillo `0 0 0 Npx` (contorno de "hoy", halo del punto de scrub, el velo del escáner) y un `inset` (bordes del
  vidrio) son **bordes dibujados**, no sombras: están permitidos y el auditor no los cuenta.
- **Sin gradientes CSS.** El único gradiente es el relleno tenue bajo la línea de las tiles de gráfica (SVG, ≤.16 α).
- **Sin glow**, salvo la excepción documentada del estado del anillo de macros (§15).

### 4.8 Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--dur-1` | 120ms | tap, pressed, toggles |
| `--dur-2` | 180ms | componentes: filas, chips, pestañas, barras que crecen |
| `--dur-3` | 280ms | sheets, nav, toast |
| `--dur-screen` | 140ms | fade de cambio de pantalla (existente, `viewin`) |
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | entradas y transformaciones (sin overshoot) |
| `--ease-in` | `cubic-bezier(.4,0,1,1)` | salidas |
| `--toast-life` / `--toast-life-err` | 2.3s / 4.6s | cuánto vive un toast antes de salir (el de error, el doble) |

Ninguna duración literal en el CSS: lo que no es token es un bucle funcional marcado `/*ds:exempt*/` (§15).

### 4.9 Capas (z-index)

`--z-float 20` (FAB, fantasma) · `--z-nav 30` · `--z-modal 40` (scrim + sheet: **tapa la nav**) · `--z-pop 50`
(popovers, addpop) · `--z-overlay 60` (boot, wrap) · `--z-toast 80` · `--z-dev 90` (`?design=1`).

### 4.10 Glass (solo chrome)

`--glass-bg rgba(14,14,17,.55)` · `--glass-bg-strong .72` · `--glass-blur 18px` · `--glass-sat 1.7` · `--glass-edge`
· `--glass-ring` · `--glass-shadow`. **Una sola definición:** las utilidades `.glass` (nav) y `.glass-strong` (sheet,
toast) se ponen en el marcado (`<nav class="nav glass">`, `openModal`, `toast()`); el componente no repite blur, fondo,
borde ni sombra. Ajustes por pieza con selector doble, nunca copiando el material: `.sheet.glass-strong` (solo borde
inferior, cuelga de arriba) y `.toast.glass-strong` (se centra con transform). Fallbacks en las utilidades:
`@supports not (backdrop-filter)` y `prefers-reduced-transparency` → sólido (`--card2` nav, `--sheet-bg` sheet/toast).

---

## 5. Layout

- **Marco:** 393×852 de referencia; en ≤440 px ocupa la pantalla. Contenido en `#view` (único elemento que hace
  scroll), con `padding: --sp-py --sp-px calc(84px + safe-area)` para librar la nav flotante.
- **Un solo eje:** todo el contenido de todas las pantallas comparte borde izquierdo y derecho (`--sp-px`). Comparadas
  lado a lado, dos pantallas deben verse construidas sobre la misma retícula.
- **Secciones:** `hr.rule` + `.section` (título `//` a la izquierda, meta a la derecha) → contenido. Entre secciones
  `--sp-section`/`--s6`; dentro de una sección `--s3`–`--s4`.
- **Barras acopladas** (descanso, AHORA, footer de sesión) viven fuera de `#view`, entre el contenido y la nav, y
  sobreviven a `render()`.
- **Safe areas:** `env(safe-area-inset-*)` en nav, sheet, barras y overlays.

## 6. Tipografía aplicada y microcopy

- **`//` (marcador de sistema).** Solo para secciones y módulos (`//NEXT`, `//EFFECTIVE VOLUME`, `//MÚSCULOS`,
  `//SUPPS`), estados de sistema en vacíos (`// sin registros`) y el nombre de la app. **Nunca** en valores (`//59.8`),
  botones (`//SAVE`) ni decoración. El `//` va en `--o40`/`--o50`, el nombre en `--fg`.
- **Corchetes `[ ]`.** Acciones de texto (`[+ set]`, `[↓ drop set]`, `[administrar]`, `[unir]`, `[adoptar]`,
  `[+ nota]`, `[share]`). Al frente del nombre de un ejercicio, `[uni]`/`[bi]` en la **misma fuente y tamaño que el
  nombre** — nunca la unidad (vinculante). Etiquetas de tipo `[cable]` en la segunda línea.
- **Tono.** Operativo y corto (`serie 2/3`, `bajo MEV 8`, `fresco · 3.1 d`), no conversacional. Ayudas en español,
  en minúsculas, en `.submeta`. Explicar el *porqué* en una línea cuando un dato no es obvio ("correlación, no causa",
  "estimado = guía de la literatura ajustada a tu dosis").
- **Idioma.** La app mezcla inglés corto (acciones históricas: `start workout`, `save session`) y español (ayudas,
  módulos nuevos). Regla: **no mezclar dentro de un mismo componente**; lo nuevo va en español salvo que el componente
  vecino ya esté en inglés.

---

## 7. Componentes (función · anatomía · sí/no)

Los nombres de clase existentes se conservan (cambiarlos rompe todo); lo que se consolida son sus valores. Cada
componente nuevo que sea variante de uno de estos se hace como **modificador**, nunca como clase paralela.

### 7.1 Botones — cuatro roles, nada más

| Rol | Clases | Anatomía | Función |
|---|---|---|---|
| **Primario** | `.start`, `.sheetbtns .ok` | 48px · `--r-ctl` · `--fill` + `--on-fill` · 13/700 · tracking .02em | la acción principal de la vista (una por vista); `.start.ghost` = misma geometría en contorno (`--border`, texto `--fg`) para una alternativa de igual peso ("registrar a mano") |
| **Secundario** | `.secondary .b`, `.sheetbtns .cancel`, `.toggles button` | 44px · `--r-ctl` · 1px `--border` · 12/400 · `--o60` (`.on` = relleno) | alternativas, cancelar, selector de opciones |
| **Acción de texto** | `.addbtn`, `.ctrls a`, `.section .meta a` | texto `[ ]` 10–11 px `--o60`, zona táctil ≥44 (padding + margen negativo) | acciones frecuentes dentro de datos |
| **Flotante** | `.fab` | 56 círculo, `--fill`, glifo 30/300, `--shadow-float` | agregar (macros) |

Destructivo = secundario + `.danger` (`--bad`); en el footer de sesión, `abort` lleva borde `--abort`. **En barras
acopladas** (footer de sesión) primario y secundarios miden **44**, no 48, para no robarle alto a la tabla. Un botón
que se ve más chico que 44 (los −15/+15/skip del descanso, 32 px) extiende su zona táctil con `::after` (`inset`
negativo), sin crecer visualmente. **No:** botones con estética propia por módulo, botones <44 px de zona táctil, pills
como sustituto de botón, íconos sin texto en acciones importantes.

### 7.2 Inputs — dos familias (dualidad intencional)

| Familia | Clases | Anatomía | Dónde |
|---|---|---|---|
| **Formulario** | `.field input/select`, `#fa_q`, `textarea.ta(.sm/.md/.lg/.xl)`, `.pfsel`/`#pf_gym`/`.pfw` (perfil), `.slblk input` (sueño), `.mdcust input` (rango de fechas), `.mmrow select` | 44px · `--r-ctl` · 1px `--border` · `--card` · 16px | sheets, ajustes, onboarding, perfiles |
| **Dato** | `.inp`, `.pick`, `.fs`, `.bwchip` | 36px · `--r-sm` · .5px `--o20` · transparente · 12px | tabla de sesión e historial ("la caja cabe su contenido") |
| Dato mini | `.inp-mini` | alto de su texto · `--r-sm` · .5px `--o20` · transparente · 10px · padding 4/6 | campos dentro de una línea de datos (fecha/duración/horas del registro tardío) |

Label: `.field label` en mayúsculas 10 px `--o50`. **Unidad/porción siempre `<select>`, nunca texto libre**
(vinculante). **Select dentro de una fila de lista** (`.mmrow select`, el mapeo etiqueta → músculo): geometría de
formulario pero texto de 13 px, porque acompaña a la fila en vez de dominarla (a 16 px cortaba "grupo deltoides"); el
viewport ya fija `maximum-scale=1`, así que iOS no hace zoom al enfocarlo. **No:** alturas 30/32/34/38, radios 8,
sombras internas, labels flotantes, bordes de color.

### 7.3 Toggles y pestañas

- `.toggles` (segmentos de opción, 44 px): selección = relleno `--fill`. Lo **sugerido** va con borde punteado hasta
  tocarse (`.pftog.sug`).
- Pestañas de periodo/vista (`.mdtabs`): mismo alto y línea base; la selección se marca por contraste; el indicador
  se desliza al cambiar (DS-5). **No** tarjetas por pestaña.

### 7.4 Chips y etiquetas — tres familias

| Familia | Clases | Anatomía | Función |
|---|---|---|---|
| **Etiqueta de dato** | `.note` (`[cable]`, `[+ nota]`), `.exp`, `.exT` | texto sin caja, 10–11 px, `--o50`; tappable con subrayado punteado | describe (tipo, T, perfil) |
| **Estado** | `.vst`, `.setprog`, `.lpr`, `.pill` | texto 9 px **sin caja** (minúsculas; mayúsculas solo si es sigla: PR); color = semántico del estado | dice cómo está (bajo MEV, ▲+3 %, PR, retención alta) |
| **Seleccionable** | `.chip`, `.spc`, `.ag-chip` | píldora `--r-pill`, ≥36 px de alto, `--card2` o borde .5px, 11 px | se toca para marcar/filtrar (suplementos) |

**No:** chips con radio 4/6/8/14, cajas alrededor de estados, más familias.

### 7.5 Filas

- **`.line` — firma de la app.** Clave (`--o60`) · líder punteado (`.dots`) · valor (`--fg`). Para toda lectura
  clave-valor (stats, detalles, perfiles). `.mdline` es su variante de detalle (12 px) y converge a `.line.lg`.
- **Fila de lista** (`.exrow`, `.mmrow`, `.mscrow`, `.mdtr`, `.nvm`, `.pickitem`, `.hrow` — los nombres se quedan,
  los valores convergen): padding 6–12 px (el de menú 14 para zona táctil), **separador .5px `--o10`** en todas, tap en
  toda la fila, contenido en una línea + sublínea opcional. Dentro de una tarjeta (`.grp .item`) el separador es el
  borde de la tarjeta (1px `--border`).
- **Fila de volumen** (`.vrow` + `.vbar`): nombre + estado a la izquierda, lectura a la derecha, barra de 3 px con
  marcas MEV (`--o40`) y MRV (`--warn`).

### 7.6 Encabezados

| Componente | Anatomía | Función |
|---|---|---|
| `.status` | 10 px `--o50`; usuario 12/800 · fecha centrada · racha a la derecha | barra de estado de toda pantalla |
| `.whdr` | `//NEXT`/`WORKOUT` 16/800 `--o50` tracking `--ls-title` + nombre del día 22/800 | **firma de las pantallas de gym. No aplanar** |
| `.section .h` | `<span class="s">//</span>` + nombre, 16/800 | título de sección |
| `.grp-label` | 9 px mayúsculas `--ls-caps` `--o40` | etiqueta de grupo dentro de una sección o sheet; `.grp-label.sub` (12 arriba · 4 abajo) para rótulos dentro de un detalle, en vez de márgenes en línea |
| `.submeta` | 10 px `--o40` | ayuda/meta bajo un bloque; variantes de espacio `.gap`, `.tight`, `.flush` (DS-4) en vez de márgenes en línea |
| `.sheet h3` | 11/800 mayúsculas `--o50` | título de sheet |

### 7.7 Tarjetas

`.card` (y `.pfeat`, `.pthrow`, `.ptile`, `.grp`): `--card`, 1px `--border`, `--radius`, padding `--sp-card`,
margen inferior `--sp-gap`. **Una tarjeta existe cuando** agrupa una entidad, contiene una métrica independiente o es
un módulo autónomo. **No** una tarjeta por cada número, fila o botón (eso convierte Progreso en SaaS). **No**
gradientes, glow, glass, colores de acento, sombras.

### 7.8 Tabla de sesión (el componente más fuerte de la identidad)

Denso, afilado, técnico. **Jamás** glass, radios grandes ni colores decorativos.
- Encabezado `.thead` (9 px `--o40`) · filas `.srow` en rejillas `.gc-*` (última columna 30 px = el ✓).
- Número de serie `.setn` (1, 1.5, 2… con color de zona) · inputs de dato · `.dchk` ✓/○ (30×36) en la última
  columna; en unilateral `.pairdone` a la derecha del par.
- **Borrar = deslizar la fila a la derecha ≥76 px** (gesto horizontal claro; nunca desde un input); pista una vez.
- Prefill sin confirmar `.pf` al 45 % **por campo**; al tocarlo, opacidad plena. Drop `.isdrop` al 82 %.
- Ejercicio en curso `.ex.current` (guía 2px `--o35`) + barra **AHORA** (`.nowbar`) con serie N/M.
- Encabezado del ejercicio en dos líneas: `[bi] nombre` (16/800) · `[tipo] marca setup nota|[+ nota]`.
  Sin placeholders de relleno (nada de "+ machine").

### 7.9 Barras acopladas

`.restbar` (descanso: etiqueta + tiempo 16/800 + −15/+15/skip), `.nowbar` (AHORA), `.footer` (abort · ↩ · save
session). Sólidas (`--frame`) con borde superior `--o12`; gutter `--sp-px`. Botones: footer 44 (`abort` borde
`--abort` · `↩` borde `--border` · `save session` primario), descanso 32 visibles con zona táctil de 44 (`::after`).
Fin de descanso: 3 destellos de borde `--good`.

### 7.10 Navegación

Píldora glass flotante (`.nav`), 3 pestañas: **progress · gym · macros**. Íconos de línea 24u trazo 1.6; la activa se
ensancha y muestra su etiqueta (fondo `--o12`). Pertenece al chrome, no al contenido. Suplementos, músculos, split,
historial y ajustes viven en el menú `u/…`. **No:** más de 3–4 pestañas, dock con lupa, rebote.

### 7.11 Sheets y modales

`openModal(html, cls)`: scrim `rgba(0,0,0,.6)` + `.sheet` **glass-strong anclado arriba** (esquinas inferiores
`--r-sheet`), padding `--sp-sheet`, máx. 80 % (`.tall` 90 vh). Título `.sheet h3`, botones `.sheetbtns`
(primario + secundario). El contenido dentro del sheet usa el lenguaje normal (no todo es glass). `nodismiss` solo
para decisiones obligatorias (sesión inactiva).
- **Movimiento:** al abrir, el sheet baja desde arriba (`sheetin`, `--dur-3` `--ease-out`) y el scrim aparece
  (`--dur-2`); al cerrar sube y se desvanece (`--dur-2` `--ease-in`). **`openModal` sobre otro sheet —o justo después de
  `closeModal()`, el patrón `closeModal(); openX()`— es un cambio de contenido: sin animación**, así nunca hay dos
  sheets moviéndose ni se anima un re-render.
- **Cierre sin trampas:** `closeModal()` quita el `id` al instante (para la lógica el modal ya no existe) y deja un
  fantasma `.modal.out` sin clics que sale en 180 ms y se borra a los 200 ms.

### 7.12 Toast

Píldora glass sobre la nav, 12/700, un mensaje corto. **Borde por tipo** (DS-1): éxito `--good`, error `--bad`,
neutro `--border`. Errores sin auto-cierre; máximo 3 apilados; `aria-live`. **No** confeti ni sonido.

### 7.13 Popover de agregar (FAB)

`.addpop`: acciones `.api` en píldoras sólidas `--fill`, escalonadas 40 ms, suben 8 px con `--dur-2` `--ease-out`
(sin escala ni overshoot desde DS-5).

### 7.14 Vacíos, carga y errores

- **Vacío** `.empty`: `// ` + frase corta en `--o50` + `.ehint` con la acción. Sin ilustraciones.
- **Carga:** texto de sistema, spinner simple o cursor `▌`; el boot (1.3 s) es la única pantalla de carga con
  personalidad. Sin puntos que rebotan.
- **Error:** toast `--bad` + texto que dice qué pasó y qué hacer.

### 7.15 Barras de progreso

`.bar`/`.vbar`/`.wprog`: 3px (2px en `.wprog`), píldora, `--track` + relleno `--fill`; exceso (`.over`) en
semántico. Barras segmentadas (celdas) permitidas para conteos discretos (DS-6).

### 7.16 Diagnóstico (hallazgos, v234)

Cómo la app **sugiere** sin inventar (primer uso: //MÚSCULOS y su detalle).
- **Anatomía** (`.dxrow`): hallazgo 12/700 con color por severidad (`.dx-bad` `--bad` · `.dx-warn` `--warn` · `.dx-info`
  `--fg` · `.dx-ok` `--good`) · **evidencia** 10 px `--o50` con los números que lo disparan · **acción** `→ …` 10 px
  `--o70` · separador .5px `--o10` · nota final `.submeta` ("solo aparece lo que tu historial respalda · correlación, no
  causa"). Orden: grave → atención → sugerencia → "en orden".
- **En una fila de lista** (`.mscdx`): solo el hallazgo principal en corto (10 px) + `+N`; nunca repite lo que ya dice un
  estado de la misma fila (MEV/MRV) y "en orden" no ocupa renglón.
- **Reglas de redacción:** se dispara solo con evidencia (umbrales explícitos en el código, con prueba de "ruido" en su
  self-check) · nunca una puntuación · verbos de sugerencia ("suele", "puede aportar", "considera"), no órdenes · cita
  cuando la regla viene de literatura · `~` si se apoya en datos sugeridos sin confirmar · sin datos suficientes dice
  "pocos datos", no "en orden".

### 7.17 Utilidades (DS-4) — la capa mínima entre componentes

Lo que antes era `style=""` fijo es una **clase `u-` de un vocabulario cerrado**, todo por token. Sirven para el ajuste
entre piezas (espacio entre bloques, un color de dato, una alineación), **no** para inventar componentes: si un
conjunto de utilidades se repite como forma propia, se vuelve componente (así nacieron `.setprogline`, `.inp-mini`,
`.gc-uni-head`, `.moodax.at/ab/al/ar`, `.start.ghost`, `.fa-em-step.off`).

| Grupo | Clases | Valor |
|---|---|---|
| color | `u-fg` `u-o70` `u-o60` `u-o50` `u-o40` `u-o35` `u-o30` `u-o20` `u-good` `u-bad` `u-warn` `u-info` | la escala de §4.2–§4.3 |
| tipo | `u-cap` `u-xs` `u-meta` `u-sm` `u-body` `u-sec` `u-disp` `u-hero` · `u-w3` `u-w4` `u-w5` `u-w7` `u-w8` | `--t-*` · pesos cargados |
| tracking | `u-lscaps` `u-lsui` `u-lsnum` `u-ls0` · `u-upper` | los roles de §4.4 |
| espacio | `u-m{t,b,l,r,x,y}N` · `u-p{…}N` · `u-gapN` · negativos `u-mt-nN` · `u-mlauto` | N ∈ 0 · 1 · 2 · 4 · 6 · 8 · 10 · 12 · 16 · 24 · 32 · 48 (· 96); por `--s*` salvo los medios pasos |
| layout | `u-flex` `u-iflex` `u-block` `u-ib` `u-col` `u-wrap` `u-aic` `u-ais` `u-aib` `u-jsb` `u-jfe` `u-asc` `u-f1` `u-f0` `u-fhalf` `u-fthird` `u-min0` `u-w100` `u-wauto` `u-h100` `u-fr` `u-vam` | — |
| texto y estado | `u-tc` `u-tr` `u-tl` `u-nowrap` `u-preline` `u-ul` `u-fsn` `u-tap` `u-dim` (.5) `u-invis` `u-sep` (separador .5 `--o10`) `u-dash` (subrayado punteado = tocable) | — |

- **Cómo ganan:** van al final del CSS como `#app .u-x` — ganan como ganaba el `style=""` que reemplazan, y un
  `el.style.*` asignado en vivo sigue ganándoles. El bloque se **genera solo con las que se usan**.
- **Siguen en línea (y está bien):** valores calculados en vivo (`width:${pct}%`, colores de zona, posiciones de la
  agenda) y `display:none` inicial (el JS lo alterna y a veces lo lee); más ~25 dimensiones únicas (la cámara del
  escáner, anchos de inputs numéricos, alturas mínimas de avisos).
- **No:** valores fuera de la escala (no existe `u-mt14`), utilidades de color literal, dos declaraciones de la misma
  propiedad en un elemento (una utilidad + un `style` que la pise), utilidades para lo que ya es componente.

### 7.18 Componentes de comportamiento `TRK*` (registro)

§7.1–§7.17 dicen **cómo se ve** cada pieza; este registro dice **cómo se comporta**. Cada interacción transversal
(feedback, confirmación, pestañas, filas que cambian, barras que crecen, números que cuentan, popovers, tendencias,
calendarios, selectores) tiene UN componente, con una API, sus tokens y su referencia concreta de 21st.dev (solo el
comportamiento, §19). **Ninguna pantalla implementa su propia versión**: si falta algo, se agrega aquí primero.

| Componente | Función | API | Tokens y anatomía | Referencia 21st · se toma / no se toma | Dónde |
|---|---|---|---|---|---|
| **TRKToast** | decir qué pasó después de una acción; una sola voz para todo el feedback | `toast(msg,type)` (`ok`/`err`/neutro; se infiere de `✓`/`⚠`) · `toastTask(msg)` → `{done(msg), fail(msg)}` para lo que tarda | píldora `.glass-strong` 12/700 sobre la nav · borde `--good`/`--bad`/`--glass-ring` · pila de hasta 3 (sale la más vieja) · éxito/neutro se van a los `--toast-life`, un error se queda hasta tocarlo (`✕`) · `aria-live` | [Save Changes Toast](https://21st.dev/@yadwinder/components/toast-save) (estados cargando → listo) + Sonner (pila) · **no**: iconos de color, sombras propias, barras de progreso | todo guardado (§7.18.1) y toda operación async |
| **TRKAsk** | pedir una decisión reversible o de flujo | `trkAsk({title,detail,ok,cancel,danger},onOk,onCancel)` | sheet: `h3` + `.submeta` + `.sheetbtns` (primario/secundario; `.danger` si destruye) | — (reemplaza `confirm()` nativo) | ¿guardar sin RIR?, cambiar ejercicio con series, adoptar split, unir, borrar un registro del log |
| **TRKHold** | confirmar lo **irreversible** sin que un toque accidental baste | `holdConfirm({title,detail,verb,back},onOk)` | sheet con botón 48 px borde `--bad`, relleno `--bad` .22 que avanza en 0.9 s mientras se sostiene ("armando 73 %"); soltar antes cancela; vibración corta al completar | patrón "Hold to Confirm" del catálogo (sin componente concreto verificado en el reporte) · **no**: círculos de progreso, color de éxito | abortar sesión, borrar sesión, borrar día del split, borrar una comida completa, borrar todos los datos |
| **TRKTabs** | cambiar de periodo o de vista sin cambiar de pantalla | `<div class="trktabs" data-tk="clave">` con `<span class="on">`; el indicador lo pone `afterPaint` | etiquetas 11/700 `--o50`, activa `--fg`; **indicador 2 px `--fill`** bajo la activa que desliza posición y ancho (`--dur-2 --ease-out`); sin pista ni píldora | [Vercel Tabs](https://21st.dev/@yadwinder/components/vercel-tabs) (subrayado que viaja) · **no**: píldoras, escala, gradiente | periodos del detalle de métrica, volumen y e1RM; vista hoy/todos del stack |
| **TRKRow** | que la lista cambie sin saltos: lo nuevo entra, lo borrado sale, el resto se reacomoda | `state._enter={exi,si}\|{ex,scroll}` antes de pintar · `flipRows(root)` (FLIP de las filas con `data-rk`) | entrada 4 px + opacidad `--dur-2` · salida hacia la derecha `--dur-2 --ease-in` · reacomodo `--dur-2 --ease-out` | [Animated Table Rows](https://21st.dev/@arunachalam/components/animated-table-rows) (entrada/salida/`layout`) · **no**: colores, hover, botón rojo, la tabla del demo | tabla de sesión, editor de historial, historial |
| **TRKBar** | que una barra crezca desde su valor anterior cuando el dato cambia | `<i data-bk="clave" style="width:N%">` en `.bar/.vbar/.wprog` | `--track` + `--fill`, estado en semántico (`.over`); transición de ancho `--dur-2 --ease-out`, solo si cambió | [Animated Progress Bar](https://21st.dev/@educlopez/components/animated-progress-bar) · **no**: colores por barra, degradados, etiquetas dentro | //EFFECTIVE VOLUME, intake de macros, //MÚSCULOS, progreso de la sesión |
| **TRKNum** | que un número que cambia cuente hasta su valor | `data-nk` (clave) `data-nv` (valor) `data-nd` (decimales) | 280 ms, mismo formato (`toLocaleString`), solo si la clave ya estaba en pantalla con otro valor | Number Flow (§10; propio, sin dependencia) | kcal, P/C/F, racha, e1RM de //FUERZA |
| **TRKPop** | mostrar algo corto junto a lo que lo originó | `trkPop(anchor,html,{menu})` → popover anclado; en pantallas > 440 px igual, en móvil un **menú** pasa a sheet | tarjeta `--card2`, borde `--border`, `--r-ctl`, `--shadow-float`, 10 px `--o70`; cierra al tocar fuera o al hacer scroll | [Smart Popover](https://21st.dev/@efferd/components/smart-popover) (popover ↔ drawer) · **no**: flechas, glass en contenido | glosario (`data-gloss`), acciones de fila del catálogo |
| **TRKTrend** | resumen de una serie antes de abrir su gráfica | `trendRowHTML({name,cur,delta,unit,series,act})` | nombre · valor (TRKNum) · Δ con ▲▼ en semántico · sparkline 30 d (trazo 1.4 `--o60`, punto final) · `›` | [Trend Card](https://21st.dev/@ravikatiyar162/components/trend-card) · **no**: la tarjeta, el índigo, la interacción de dashboard | //FUERZA, //RECORDS |
| **TRKCal** | un mes como rejilla de días con intensidad; tocar un día lleva a ese día | `monthCalHTML(ym,marksFn,act)` | pastilla `--r-mark` por día: vacío `--track`, un registro `--o60`, ambos `--good`, hoy con contorno | [GitHub Calendar](https://21st.dev/community/components/aliimam/git-hub-calendar) (día → intensidad) · **no**: el verde de GitHub, escalas de 5 tonos | racha (Progreso), mes del historial |
| **TRKSelect** | elegir un valor chico de un toque, con respuesta inmediata | `trkSelect(anchor,opts,cur,onPick)` | fila de opciones de 44 px en popover; la elegida con contraste; el `<select>` sigue de respaldo | [Interactive Selector](https://21st.dev/@minhxthanh/components/interactive-selector) · **no**: su estética ni animación | RIR de la tabla (fase B) |

La navegación (§7.10) ya cumple el patrón de [Bottom menu](https://21st.dev/community/components/yadwinder/bottom-menu/default)
(activo que se ensancha con su etiqueta, sobre glass): sin cambio.

#### 7.18.1 Vocabulario de feedback (TRKToast)

`✓ <objeto> <acción>` en español y minúscula, una línea, sin punto final. Guardar: `✓ sesión guardada · 9 series`,
`✓ sesión actualizada`, `✓ split actualizado`, `✓ ejercicio actualizado`, `✓ perfil del ejercicio guardado`,
`✓ comida guardada`, `✓ metas guardadas`, `✓ peso guardado`, `✓ sueño guardado`, `✓ ajustes guardados`. Tareas
(`toastTask`): `… sincronizando salud` → `✓ salud sincronizada · 12 días`; `… buscando producto` → `✓ encontrado` /
`⚠ no está en OpenFoodFacts`. Errores de validación: `⚠ <qué falta>` (`⚠ pon un nombre`), nunca `alert()`.

---

## 8. Gráficas (instrumentación, no infografía)

**Por módulo:** anillos radiales y radar **solo en macros** (P/C/F, composición). Todo lo demás: línea, barra, calendario
o texto.

**Línea (`lineChart`, v227):**
1. **Sin dato = hueco.** La línea se corta; nunca un 0 en el piso (0 real solo donde existe: auto-percepción, semanas
   de volumen). Un día aislado conserva su punto.
2. Trazo `--o60` 1.4 en tiles · `--fill` 1.8 en detalle; `vector-effect: non-scaling-stroke`; puntos como trazos de
   largo cero (círculos perfectos a cualquier ancho); gradiente con id propio.
3. **Detalle:** banda del **rango normal propio** (p15–p85 de sus 90 días previos) en `--o10` · promedio punteado con
   pastilla · último punto con halo · 3 etiquetas Y a la derecha · 4 fechas abajo · etiquetas en HTML sobre el SVG.
4. **Acentos solo en el estado** ("en rango / sobre / bajo"), nunca en la línea.
5. Periodos 7D·15D·30D·3M·6M·1A + ▦ custom + ‹ › paginar · gestos: mantener y deslizar (scrub), pellizco ↔ (periodo),
   ↕ (zoom Y), doble toque (normal).
6. Tendencias 3·7·14·30·90 días: flecha acentuada solo si el cambio supera ~1 error estándar; mini-sparkline de la
   media móvil 7 d.

**Calendario de racha:** dos meses, una pastilla (`--r-mark`) por día: vacío `--track`, un registro `--o60`, ambos
`--good` (el único acento), hoy con contorno; toque abre el día. **Barras de volumen:** 3 px con MEV/MRV.

**No:** gradientes en detalle, pasteles, barras gigantes redondeadas, glow, arcoíris, ejes cargados, etiquetas en cada
punto, la escala de colores de Bevel.

## 9. Lenguaje de honestidad (propio de gym//TRK)

| Señal | Significa | Dónde |
|---|---|---|
| `~` antes/después de un dato | estimado o deducido | tensión con RIR supuesto, perfil sugerido, % con baja confianza |
| borde punteado | sugerido, falta que lo confirmes | toggles de perfil, `.pftog.sug` |
| gris 45 % (`.pf`) | prefill de la sesión anterior, no cuenta hasta confirmarlo | tabla de sesión |
| hueco en la línea | no hay dato ese día | gráficas |
| "sin baseline" / "sin guía" / "sin definir" | no hay con qué comparar / no hay evidencia | progreso, landmarks, perfiles |
| "estimado" vs "observado" | literatura ajustada vs su propio historial | recuperación por músculo |
| "correlación, no causa" | descriptivo, no diagnóstico | //RENDIMIENTO, causas de un ▼ |
| lecturas separadas | nunca una puntuación única | //MÚSCULOS: volumen · estímulo · fatiga · recuperación |
| hallazgo con su evidencia | una sugerencia existe solo si hay números que la respaldan, y se muestran | DIAGNÓSTICO por músculo (§7.16) |

## 10. Movimiento

Anima **cambios de estado**: navegación entre pantallas (fade 140 ms), sheets (280 ms), filas que entran/salen
(180 ms), pestañas (180 ms), barras que crecen (180 ms), confirmación ✓ (120 ms con el único overshoot permitido),
números que cambian (280 ms). **Nunca** en re-renders de la misma pantalla (cada tecla re-renderiza).
**No:** rebote, elástico, parallax, animaciones infinitas decorativas, "que se sienta premium". Pressed: opacidad o
`scale(.98)`. `prefers-reduced-motion` reduce todo a 0.01 ms y apaga los conteos.

**Cómo se implementa (DS-5, v236)** — como `render()` rehace el DOM, lo que anima se marca ANTES de pintar y
`afterPaint(root, swap)` (al final de `render()` y de `openModal`) lo aplica una sola vez:
- **Lo que se agregó entra** (`rowin`: 4 px + opacidad, `--dur-2`): el handler pone `state._enter` = `{exi, si}` (+ serie,
  ↓ drop, en vivo y en historial) o `{ex, scroll}` (+ ejercicio, que además queda a la vista sin saltar al inicio).
- **El ✓ confirma** (`chkpop`, `--dur-1`, overshoot 1.18): `state._pop` = `{exi, si}` en el handler de `done`.
- **Lo que se borra sale:** deslizar ≥76 px lleva la fila a la derecha y la desvanece (`--dur-2` `--ease-in`) y
  entonces se borra; si el borrado se cancela, vuelve.
- **Números que cuentan:** `data-nk` (clave) + `data-nv` (valor) (+ `data-nd` decimales) en el elemento que solo tiene el
  número; si esa clave ya estaba en pantalla con otro valor, cuenta del anterior al nuevo con el mismo formato
  (`toLocaleString`). Hoy: kcal del anillo, anillos P/C/F (la clave incluye el modo g/%/restante, así que cambiar de
  modo no cuenta) y la racha.
- **Pestañas de periodo** (`.mdtabs`, clave `data-tk`): un indicador `.tabind` que se desliza cuando el sheet se re-abre
  encima de sí mismo (cambio de periodo); al abrir, aparece en su sitio.

## 11. Íconos y glifos

- **SVG** de línea, viewBox 24, trazo **1.6**, puntas redondas, `currentColor`. Una sola familia (sin mezclar relleno,
  3D o redondeados). Las barras gruesas del ícono de código de barras son dibujo (ancho de barra), no grosor de trazo.
- **Trazos de gráfica** (cuatro valores, nada más): **dato** 1.4 en tiles, anillo grande, radar y FC · 1.8 en detalle
  y anillos chicos · **referencia** 1 (promedio punteado) · **rejilla** .5 (radar, cruz central).
- **Vocabulario de glifos** (fijo): ✓ hecho · ○ pendiente · ▲▼ progreso · ⬆⬇↔ perfil de resistencia · › entra a
  detalle · ↓ drop · ✕ quitar · ▾ desplegar · ⠿ arrastrar · ▦ rango custom · ~ estimado · ▌ cursor · ⚠ aviso.
- **Emoji pictográficos no** (DS-3: 🗑 borrar → `✕ borrar` · 🔒 → `[fijar]`/`[fijo]` · 📸 fuera). Sus etiquetas con
  emoji ("puh🥀") se respetan: son suyas.

## 12. Estados de interacción

default · pressed (opacidad/escala .98) · focused (contorno `--o50`, visible) · selected (relleno o contraste) ·
disabled (opacidad .4, misma estructura) · success/error (semántico + texto). Un componente **no** cambia de estética
por estado: cambian opacidad, superficie, borde o color, nada más. En móvil no hay hover; en escritorio es sutil.

## 13. Accesibilidad

Zona táctil ≥44 px en todo lo tocable (acciones de texto con padding + margen negativo) · contraste suficiente
(texto de lectura ≥ `--o40`) · nunca solo rojo/verde · foco visible · `aria-live` para toasts · inputs 16 px ·
`prefers-reduced-motion` y `prefers-reduced-transparency` respetados · gestos siempre con alternativa visible
(deslizar para borrar tiene su pista).

---

## 14. Mapa por pantalla (cada módulo es un instrumento)

| Pantalla | Instrumento | Encabezado | Contenido | Nav |
|---|---|---|---|---|
| landing / login / onboard | configuración | — | `.start`, `.field`, `.toggles` | no |
| **home (gym)** | estado actual | `.whdr` (`//NEXT`) | rotación, preparación, músculos del día, //EFFECTIVE VOLUME, //STATS | sí |
| **workout** | registro | `.whdr.top` (`//NOW`) | tabla de sesión, AHORA, descanso, footer | no |
| **macros** | composición | `.section .h` | anillos P/C/F, radar, //SUPPS, //LOG | sí |
| **progress** | análisis | `.section .h` | racha + calendario, tiles, FUERZA, //RECORDS, //MÚSCULOS, //RENDIMIENTO | sí |
| history / histedit | archivo | `.section .h` / `.whdr.top` | lista por mes; editor = tabla de sesión compacta (`.hist-compact`) | no |
| share | resumen de datos | `.shtitle` | cabecera en una línea, un bloque por ejercicio, series en una línea | no |
| stack (suplementos) | inventario | `.section .h` | bloques por momento (todos abiertos) | vía menú |
| splitedit / catálogo / músculos | inventario | `.section .h` / sheet | filas, deriva del split, mapeo | no |
| settings | utilitario | `.section .h` | `.line`, `.field`, //SALUD | no |

## 15. Excepciones documentadas (todas funcionales)

- **Macros:** anillos radiales y radar hexagonal (composición de nutrientes); glow del anillo según estado.
- **Workout:** tabla densa afilada (`--r-sm`, .5px), sin glass.
- **Chrome:** glass en nav, sheets, toast.
- **Sheets anclados arriba** (evitan el teclado de iOS; uso de meses).
- **`--info`** azul solo para déficit calórico.
- **Números del anillo** con escala propia; overlays (boot, wrap, escáner) fuera de la escala de tipo.
- **`.scan-reticle`** (overlay de cámara) y `.dz` (panel de diseño, solo dev).
- **Glifo del FAB** (`+` 30/300).
- **Geometría atada al JS** (espaciados que el código también usa para posicionar): la columna de etiquetas Y de las
  gráficas de detalle (40 px, `.chwrap`/`.chxs` = `.chscrub right`) y el eje de horas de la agenda (30 px, `.ag-hr i` =
  `left:30px` en JS). **Márgenes negativos de centrado** de puntos (`.chsd` −5 px en un punto de 10, `.cd.t.l0::after`
  −1.5 px en uno de 3).
- **Bucles funcionales** (única animación infinita permitida): spinners de carga (700 ms), cursor `▌` y "toca para
  seguir" (1.15–1.5 s, `step-end`), el barrido del escáner mientras busca (2 s), y los 3 destellos de fin de descanso
  (500 ms × 3). Llevan `/*ds:exempt*/`.

Las declaraciones exentas llevan el marcador **`/*ds:exempt*/`** pegado a la declaración (p. ej.
`font-size:26px/*ds:exempt*/` en el número del anillo): el auditor las cuenta aparte y no como desviación. Marcar algo
como exento exige que esté en esta lista.

## 16. Prohibido

Fuentes nuevas · gradientes CSS · neón/glow (fuera de §15) · fondos ilustrados, animados, shaders, aurora ·
tarjetas 3D o glass en contenido · sombras decorativas · paletas pastel o arcoíris · colores de acento aleatorios ·
color como categoría · tamaños, espacios o radios fuera de token · peso 600 · pills como botón universal ·
tarjeta por cada dato · confeti, partículas, XP, mascotas, FOMO · renombrar sus etiquetas · anillos fuera de
macros · puntuación única · 0 falso en gráficas · placeholders de relleno ("+ machine") · unidad en el corchete
frontal · unidad en texto libre · animar re-renders · `style=""` fijo (usa una utilidad o un componente, §7.17) · componentes de librerías
externas sin adaptar (§19).

---

## 17. Protocolo para features nuevas

**Inventario primero.** Ninguna fase arranca editando: arranca midiendo (auditor + lectura de lo que toca) y escribe la
tabla "actual → objetivo" con valores (§20). La implementación se hace contra esa tabla; si aparece algo no previsto,
**se agrega a la tabla con su valor antes de corregirlo** — nada se arregla "de pasada" sin quedar registrado.

Antes de escribir UI, responder por escrito (en el plan):
0. **¿Qué componente `TRK*` (§7.18) resuelve el comportamiento?** Si ninguno, se agrega al registro primero.
1. **Propósito** y jerarquía de información (qué se lee primero).
2. **Acción primaria** y secundarias.
3. **¿Existe un componente que lo haga?** → reutilizar. **¿Es variante?** → modificador. **¿Categoría nueva?** →
   componente nuevo agregado a §7 en el mismo commit.
4. Tokens que usa (ninguno literal) · colores semánticos y su porqué · gráfica (si la hay: ¿cuál es la representación
   más eficiente en lenguaje TRK?, no "¿cuál se ve bonita?").
5. Estados: vacío, carga, error, sugerido/estimado (§9).
6. Movimiento (si alguno, qué cambio de estado comunica).
7. Después: `tools/ds-audit.cjs` sin regresiones + capturas a 393×852 + prueba de los 5 segundos.

## 18. Auditoría

**`tools/ds-audit.cjs`** (node puro, sin npm; `node tools/ds-audit.cjs`) reporta: tamaños de letra fuera de token,
pesos no cargados, letter-spacing fuera de rol, radios y espaciados fuera de escala, colores literales fuera de token,
variables usadas sin definir, reglas CSS duplicadas, `style=""` totales y por función, clases definidas sin uso. Se
corre antes y después de cada cambio de UI; **ningún commit puede subir los contadores P0/P1**. Con un archivo como
argumento audita ese (`node tools/ds-audit.cjs respaldo.html`), para comparar contra la versión anterior.
- **Selector repetido** = el mismo selector escrito como regla propia dos veces en el nivel superior (el síntoma de
  "parche encima de parche"). No cuentan las variantes dentro de `@media`/`@supports` ni base compartida + ajuste
  (`.a,.b{…}` + `.a{…}`).
- **Sombra fuera de token** = cualquier sombra con desenfoque que no sea `--glass-shadow`/`--shadow-float`; anillos
  `0 0 0 Npx` e `inset` son bordes (§4.7).
- **Diálogos nativos** = `alert(`/`confirm(`/`prompt(` en el código (rompen el lenguaje visual; se usan TRKToast,
  TRKAsk, TRKHold). Objetivo 0.
- **Guardados sin feedback** = funciones/handlers que llaman `save()` después de una acción del usuario y no terminan
  en `toast(` (lista por nombre). Objetivo 0 en las acciones de la lista §7.18.1.
- **Espaciado por token** = proporción de espaciados de CSS escritos como `var(--s*)`/`var(--sp-*)` frente a px
  literales; los medios pasos 6/10 y el 1 óptico cuentan como válidos.

**`tools/ds-diff.html`** — para refactors de CSS o de marcado que no deberían cambiar lo que se ve. Copia la versión
anterior a `repo/_pre.html` (en `.gitignore`), sirve `repo/`, abre `/tools/ds-diff.html` y en consola `go2()` →
`report()`: corre ~50 escenarios (pantallas y sheets) en la versión anterior y en la actual, lado a lado, y compara
32 propiedades computadas elemento por elemento. Un refactor "exacto" debe dar cero diferencias; uno que corrige hacia
el sistema debe dar **solo** las diferencias que se buscaban (así se verificó DS-4). La app tiene CSP sin `eval`: los
escenarios llaman a las funciones globales del iframe, no evalúan texto.

**Severidad:** **P0** identidad o bug visible (fuente/color/glass fuera de lugar, algo que no se pinta) · **P1**
sistema (altura, radio, espaciado o variante inconsistente) · **P2** un módulo · **P3** detalle.

**Loop QA visual** (de STYLEMAP): servir `repo/` en 4599 → 393×852 → sembrar datos (historial de demo) →
`go('<pantalla>')` → captura → comparar antes/después. Pantallas mínimas: home, workout, macros, progress, history,
settings + sheets (detalle de métrica, perfil de ejercicio, catálogo, músculos, suplementos).

## 19. Tooling y 21st.dev

**Skills/MCP** (criba de STYLEMAP §8, vigente): adoptar `brutalist-skill` (referencia de estilo, no generador),
`impeccable` (audit/polish), `emil-design-eng` (movimiento), `ecc:accessibility`, `ecc:browser-qa`, Playwright/preview
para QA visual. Solo filosofía: `minimalist-skill`, `taste-skill`, `redesign-skill`, `ecc:design-system`. **Evitar:**
`frontend-design`, `soft-skill`, `ui-ux-pro-max`, `gpt-tasteskill`, `stitch-skill`, `imagegen-*`, **MCP `magic`/21st**.

**21st.dev.** Es un registro de componentes **React + Tailwind** (shadcn/Radix/Motion), instalación con clave de API,
licencia por componente. Se usa **solo como catálogo de comportamientos**: *se toma la interacción, se reescribe en JS
puro con los tokens de TRK; nunca se pega un componente*. Componentes con licencia "unknown" = solo inspiración.
Dependencias permitidas: MIT, versión fijada, cacheadas por `sw.js` (offline). Hoy **ninguna**: `number-flow` era la
única candidata (web component sin React) y el conteo se hizo propio en DS-5 (§10); sonner, cmdk y vaul son solo-React.

**Biblioteca de referencias concretas** (reporte `21stdev ghstgpt recomendacion implementacion.md`, 2026-09-18). Cada
fila es un componente real de 21st.dev y el componente `TRK*` (§7.18) que lo reescribe; de 21st se toma
**estructura + interacción + comportamiento + idea de motion**, y se reconstruye con `#000`, JetBrains Mono, tokens,
líneas y opacidades de TRK.

| Prio | Componente concreto | Módulo | Se toma | → TRK |
|---|---|---|---|---|
| A+ | [Animated Table rows](https://21st.dev/@arunachalam/components/animated-table-rows) (@arunachalam) | sesión, historial | entrada/salida y reflow de filas (`AnimatePresence` + `layout`) | TRKRow |
| A+ | [Save Changes Toast](https://21st.dev/@yadwinder/components/toast-save) (@yadwinder) | global | estados cargando → listo; un patrón para todo guardado | TRKToast |
| A | [Vercel Tabs](https://21st.dev/@yadwinder/components/vercel-tabs) (@yadwinder) | Progreso (periodos) | indicador lineal que viaja en posición y ancho | TRKTabs |
| A | [Animated Tabs](https://21st.dev/@chetanverma16/components/animated-tabs) (@chetanverma16) | cambios de vista | transición entre vistas; se unifica con Vercel Tabs para no tener dos tipos de pestaña | TRKTabs |
| A | [Animated Progress Bar](https://21st.dev/@educlopez/components/animated-progress-bar) (@educlopez) | gym, macros, progreso, músculos | la barra crece desde su valor anterior | TRKBar |
| A | [Trend Card](https://21st.dev/@ravikatiyar162/components/trend-card) (@ravikatiyar162) | //FUERZA, //RECORDS | valor + Δ + mini tendencia como resumen antes del detalle | TRKTrend |
| A | [Bottom menu](https://21st.dev/community/components/yadwinder/bottom-menu/default) (@yadwinder) | nav | activo que se ensancha con su etiqueta | ya cumple (§7.10) |
| A | [Smart Popover](https://21st.dev/@efferd/components/smart-popover) (@efferd) | global | popover en pantalla ancha, sheet en móvil, misma API | TRKPop |
| B | [GitHub Calendar](https://21st.dev/community/components/aliimam/git-hub-calendar) (@aliimam) | racha, historial | día → intensidad, tocar un día navega | TRKCal |
| B | [Interactive Selector](https://21st.dev/@minhxthanh/components/interactive-selector) (@minhxthanh) | RIR de la tabla | respuesta inmediata al elegir | TRKSelect |
| — | Number Flow | kcal, P/C/F, racha | conteo al cambiar | TRKNum (propio, §10) |
| No | shining text · glow buttons · border beam · aurora/shader · tarjetas 3D · bento como estructura · glass cards · sparkles/partículas · carruseles de datos · docks con lupa | — | convierten dato en decoración o rompen monocromo/táctil | — |

**Regla para cualquier agente que implemente:** *no integrar ningún componente de 21st.dev directamente. Identifica el
componente concreto, documenta qué comportamiento se toma, elimina todo tratamiento visual incompatible, reemplaza sus
valores por los tokens de este documento, implementa el patrón como componente `TRK*` reutilizable (§7.18) y después
ejecuta `node tools/ds-audit.cjs`, `tools/ds-diff.html` y el loop de QA a 393×852.*

---

## 20. Estado actual y plan de corrección (se actualiza por fase)

**Línea base 2026-09-18 (v230):** 570 `style=""` · 342 `font-size` literales vs 31 `var(--t-*)` · 835 espaciados
literales vs 25 `var(--s*)` · 26 tamaños de letra · 21 letter-spacings · 16 radios · 6 alturas de input · ≥10
variantes de chip · 8 sombras · 25 duraciones · peso 600 ×10 · 3 variables sin definir.

| # | Sev | Discrepancia | Corrección | Fase |
|---|---|---|---|---|
| 1 | P0 | `.mdetail` definido dos veces: los detalles de métrica heredan la sangría y el borde izquierdo del detalle de comida | separar en `.mdetail` (métrica) y `.mdmeal` (comida) | DS-1 |
| 2 | P0 | `--o15` sin definir (un borde nunca se pinta); `--o25`/`--o55` solo por fallback | vecino de la escala | DS-1 |
| 3 | P0 | peso 600 ×10 sin cargar (primario, toast, pestañas, nav) | 700 | DS-1 |
| 4 | P0 | toast siempre verde, también en errores | `toast(msg,type)` con borde por tipo | DS-1 |
| 5 | P0 | verde/rojo decorativo (AUTO, ↺ última vez, verificado, línea "ahora", punto de ánimo, láser) | neutro; color solo si es veredicto | DS-1 |
| 6 | P0 | `manifest.json` #1e1e1e/#0c0c0c ≠ #000 | #000 | DS-1 |
| 7 | P1 | 342 tamaños literales, 26 valores, 7 bajo 12 | a `--t-*` (mapeo: 7/7.5/8/9.5→9 · 14/15→13 · 17–21/23–26→16 o 22 · 30/36/40→34 · overlays exentos) | DS-2 |
| 8 | P1 | 21 letter-spacings px/em | `--ls-caps/--ls-title/--ls-num` | DS-2 |
| 9 | P1 | 16 radios; literales; `.mbanner` ignora `--radius` | jerarquía §4.6 | DS-3 |
| 10 | P1 | 6 alturas y 4 radios de input | dos familias §7.2 | DS-3 |
| 11 | P1 | ≥10 variantes de chip; `.vst` duplicado (la cajita de "bajo MEV") | tres familias §7.4 | DS-3 |
| 12 | P1 | footer de sesión ~30 px, 10 px, sin radio | 44 px, roles §7.1 | DS-3 |
| 13 | P1 | 8 sombras ad-hoc | `--shadow-float` + `--glass-shadow` | DS-3 |
| 14 | P1 | gutters 16/18/26/34 | `--sp-px` | DS-2 |
| 15 | P1 | 190 espaciados fuera de escala | escala §4.5 (knobs intactos) | DS-2 |
| 16 | P1 | 25 duraciones; overshoot en popover; radar que respira infinito | tokens §4.8 | DS-5 |
| 17 | P1 | 570 `style=""` (`.submeta` 89/110 y `.grp-label` 27/35 sobreescritos en línea) | clases + modificadores; meta ≤150 (solo valores calculados en vivo) | DS-4 |
| 18 | P1 | glass copiado en 3 reglas; `.glass*` sin usar | utilidades | DS-3 |
| 19 | P2 | la nav queda encima del scrim de los modales | capas §4.9 | DS-1 |
| 20 | P2 | `.mdetail-wrap .sheet` nunca coincide | `.sheet.mdetail-wrap` | DS-1 |
| 21 | P2 | sheets sin animación de entrada/salida | slide 280 ms | DS-3 |
| 22 | P2 | balance: mantenimiento verde / volumen ámbar como categoría | neutro — la palabra es la señal (déficit azul se queda) | DS-3 |
| 23 | P2 | 11 grosores de trazo SVG | 1.6 íconos · 1.4/1.8 gráficas | DS-3 |
| 24 | P2 | emoji 🗑 🔒 📸 | glifo/texto | DS-3 |
| 25 | P3 | CSS muerto (`.glass*`, utilidades v156, `.prow`, `.srowm`, `--warn-glow`) y reglas repetidas (`.nav`, `.fab`, `.grp`, `.sheet`×3, `.grp-label`, `.mdk`) | limpiar | DS-1 |
| 26 | P3 | docs viejas: "Design language" de CLAUDE.md, comentario r13/r11, "`!important`" del modo diseño | apuntar aquí | DS-0 |

**Hecho:** DS-0 (2026-09-18, documento + auditor) · **DS-1 (v231)**: #1–#6, #19, #20, tokens nuevos de §4
(hero, tracking, `--s7/--s8`, `--r-mark`, `--shadow-float`, movimiento, capas), `--warn-glow` fuera. Auditor tras DS-1:
**P0 detectables = 0** (antes `--o15` + peso 600 ×10).
**DS-2 (v232)**: #7, #8, #14 y los impares de #15 en el bloque CSS — `font-size` literales en CSS **229 → 0** (240 usos
de `var(--t-*)`, antes 31; 22 remapeos fuera de escala y 22 exenciones marcadas), 51 tracking por rol, 118
espaciados impares al par más cercano, márgenes laterales de barras y nav a `--sp-px`. Quedan en línea (DS-4) 111
tamaños y el espaciado de 14/18/22 que no es ritmo de página.
**DS-3 (v233)**: #9–#13, #18, #21–#25 — radios fuera de escala **16 → 0** (literales 43 → 14, solo `50%`/`0`/2 en
línea), sombras fuera de token **10 → 0**, selectores repetidos **18 → 0**, colores literales en CSS 18 → 4, sin bordes
de 1.5px; inputs en dos familias (selects de sheets, horas de sueño y rango de fechas a formulario 44/r12); chips en
tres familias (la cajita de "bajo MEV", `PR` y la retención sin caja; suplementos y chips de píldora a 36 px); footer de
sesión a 44 (↩ deja de llevar el borde de abort) y botones del descanso con zona táctil 44; `.glass`/`.glass-strong` en
el marcado de nav, sheet y toast; sheets que entran y salen deslizando; balance neutro salvo déficit; trazos SVG en
cuatro valores; sin emoji pictográficos; CSS muerto fuera (`.rowend`, `.pfv`, `.pwk`, `.ptla`, `.prng`, vista previa de
sesión, `.srowm`, `.shset`, `.mbanner`/`.mb-*`, `.prow`); FAB y fantasma de arrastre en `--z-float`; sin glow en la
barra de intake ni en el escáner. Las utilidades v156 (`.t-meta`, `.mt-s*`…) se quedan para DS-4.
**PT2 v234** (diagnóstico por músculo) construido ya con el sistema: componente §7.16, `.grp-label.sub` en lugar de
márgenes en línea en el detalle de músculo.
**DS-4 (v235)**: #17 — `style=""` **562 → 97** (72 con valores calculados en vivo + 25 dimensiones únicas y
`display:none` que el JS alterna); tamaños de letra en línea **111 → 0** y fuera de escala 8 → 0; tracking fuera de rol
14 → 0. Todo lo fijo pasó a utilidades `u-` (§7.17) o a componentes nuevos (`.setprogline`, `.inp-mini`,
`.gc-uni-head`, `.moodax.at/ab/al/ar`, `.start.ghost`, `.fa-em-step.off`; `updateSetProgress` alterna `.nil` en vez de
escribir estilos). Verificado con `tools/ds-diff.html` en 52 escenarios: **fase exacta con cero diferencias**; la fase de
corrección cambia solo lo buscado (espaciados 3/5/9/13/14/18/26/36/50 → la escala, tracking por rol, 24→22 y 14→13 en
tipo, las dos acciones de texto del gym sin caja). Error corregido de paso: un `style` condicional
(`${b?' style=…':''}`) que el convertidor habría vuelto fijo → `class="k${b?' u-fg':''}"`.
**DS-5 (v236)**: #16 + #21 cerrado — **duraciones literales en el CSS 21 → 0** (todo por `--dur-*`/`--ease-*`/`--toast-life*`;
los bucles funcionales exentos y listados en §15); el radar ya no "respira"; el popover del FAB sin rebote; la nav se
expande en 280 ms (antes 500 + retraso). Nuevo (§10): `afterPaint` con filas que entran, ✓ con pop, fila que sale al
deslizar, números que cuentan (kcal, P/C/F, racha) y el indicador deslizante de periodos; `number-flow` descartado a
favor de un conteo propio. Verificado en preview: + serie/↓ drop/+ ejercicio con `rowin` (y el ejercicio nuevo ya no
salta al inicio), ✓ con `chkpop` solo en esa serie, un re-render sin cambios no anima nada, kcal 0 → 1,234 contando,
indicador 104 → 4 px al cambiar de periodo, deslizar borra tras salir.

**Fases DS (cerradas):** DS-0 documento y auditor · DS-1 P0 + tokens + capas · DS-2 tipografía y ritmo · DS-3
componentes · PT2 v234 diagnóstico · DS-4 deuda en línea · DS-5 movimiento. La "capa 21st A/B" (DS-6) se reemplaza por
la ruta R, construida sobre el registro `TRK*` (§7.18).

### 20.1 Inventario v236 → ruta R (2026-09-18)

Medido sobre v236 antes de tocar nada (auditor + lectura del código). Lo que DS-5 dejó sin detectar (D1) entra aquí.

| # | Área | Actual (medido en v236) | Objetivo (valor) | Fase |
|---|---|---|---|---|
| D1 | Selectores duplicados | 2 (`.mdtabs`, `.mdtabs span`) | 0 | R1 |
| D2 | Espaciado del CSS por token | auditor: **107 por token / 260 px literales** (sin contar 1/6/10); fuera de escala 52 (`14`×17 · `18`×13 · `22`×6 · `30`×3 · `40`×2 · `5`×3 · `1.5`×2 · `3` `7` `9` `20` `28` `34`×1) | escala por token (`2 --s1` · `4 --s2` · `8 --s3` · `12 --s4` · `16 --s5` · `24 --s6` · `32 --s7` · `48 --s8`; 6/10 medio paso; 1 óptico); 14/18/22 → `--sp-*` solo si es ritmo de página, si no 12/16/24; fuera de escala 0 | R1 |
| D3 | Rótulos | `FUERZA · e1RM…` sin `//`; `.grp-label` con 6 combinaciones de márgenes (`u-mt4/6/12/16` + `u-mb4/6`) | `//FUERZA`; solo `.grp-label.sub` (12/4) y `.grp-label.first` (4/4) | R1 |
| D4 | Feedback de guardado | 18 toasts en formato libre; auditor: **10 guardados sin feedback** (`saveExProfile`, `saveExEdit`, `saveSession`, `commitLog`, `ss_save`, `bw/sl/sc/sut/exn_save`) + los que no detecta por nombre (`mc_save`, metas, `dm/mv/dr/am_go`) | 0 sin feedback; vocabulario §7.18.1; pila máx. 3 | R2 |
| D5 | Tareas async | sync de Salud, OpenFoodFacts, IA de etiqueta, exportar: sin "cargando" | `toastTask` cargando → listo/error | R2 |
| D6 | Diálogos nativos | `alert` 36 · `confirm` 31 · `prompt` 3 | 0 (TRKHold ×6 irreversibles · TRKAsk · toast `err`/`ok` · sheet de campo) | R2 |
| D7 | Pestañas | píldora `--card` en pista `--o12` r16 (3 sheets) | TRKTabs: subrayado 2 px `--fill` que viaja; etiquetas `--o50` → activa `--fg` | R3 |
| D8 | Glosario | 0 términos explicables | `data-gloss` + TRKPop: RIR, T, % de capacidad, MEV/MAV/MRV, estimado/observado, RIR medio, e1RM, `~` | R3 |
| D9 | Catálogo → perfil | salto | View Transition del nombre al título (`--dur-3`) | R3 |
| D10 | Acciones de fila | catálogo sin historial/unir desde la fila | `⋯` → TRKPop: perfil · historial · seleccionar para unir | R3 |
| D11 | Reacomodo de filas | al borrar/abrir, el resto salta | TRKRow `flipRows` (`--dur-2`) | R4 |
| D12 | Historial | lista por mes | rail + fila expandible (series en línea) + mes TRKCal arriba | R5 |
| D13 | Barras | se redibujan sin transición | TRKBar (`--dur-2`, solo si cambió) | R6 |
| D14 | //FUERZA | texto `172 ▲5 ›` | TRKTrend con sparkline 30 d | R6 |
| D15 | Logros | //RECORDS estático | `PR` en los récords de los últimos 7 días | R6 |
| D16 | //MÚSCULOS detalle | 4 lecturas solo en texto | 4 TRKBar (volumen vs MRV, estímulo, fatiga, recuperación) + estado en texto | R6 |
| D17 | RIR en la tabla | `<select>` nativo | TRKSelect (0–5, F), `<select>` de respaldo | R7 (B) |

**Hecho R1 (v237):** D1 duplicados 2 → 0 · D2 espaciado del CSS **107 por token / 260 literales → 360 / 0** (fase exacta
`ds-diff` = 0 diferencias en 55 escenarios con datos reales; fase de escala: 14→12 salvo encabezado→contenido (`--sp-section`: `.grp-label`,
`.sheet h3`, `.mdhd`, `.ws-cardh`) y el menú (→16, zona táctil); 18→16; 22→24; 30/28/34→32; 20→24; 9→10; 5/3→4; `.exprog` 7→8) ·
D3 `//FUERZA` y `.grp-label` de 14 variantes a 3 (sección · `.sub` 12/4 · `.first` 4/4, color `--o40`). Fuera de escala 0 en todo el
archivo; las partes fijas de los badges dinámicos (`.setprog`, `.exprog`) pasan a clase y en línea solo queda el color calculado.

**Ruta:** R0 guideline (este documento + auditor) · R1 v237 saneamiento · R2 v238 feedback y confirmación · R3 v239
pestañas, glosario, acciones de fila, transición · R4 v240 filas · R5 v241 historial · R6 v242 progreso · R7 v243 RIR.
Cada una cierra con `ds-audit` sin regresiones (duplicados 0), `ds-diff`, self-checks y QA 393×852.

*Historial:* v33 "Luxury Terminal" · v139–v145 consolidación (48/44, `.field`, 140 ms, vacíos `//`) · v160 color ·
v169–v176 glass en chrome · v171 headers tokenizados · v213 `.pf` · v224 encabezado de ejercicio en dos líneas ·
v225 ✓ a la derecha y deslizar para borrar · v226 //SUPPS y calendario · v227 gráficas estilo Bevel · v228–v230
músculos canónicos, perfil, //MÚSCULOS · **2026-09-18 este documento reemplaza a STYLEMAP.md**.
