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
existe su token. Valores marcados **(DS-1)** se agregan en la fase de corrección 1 (§20).

### 4.1 Superficies

| Token | Valor | Rol |
|---|---|---|
| `--bg`, `--frame` | `#000` | lienzo de toda la app |
| `--card` | `#0d0d10` | tarjeta, input de formulario |
| `--card2` | `#16161c` | superficie elevada (chip seleccionable, select en sheet, tooltip) |
| `--sheet-bg` | `#0a0a0c` | fallback sólido de sheets glass |
| `--track` | `#191920` | pista de barras y días vacíos del calendario |
| `--faint` | `#3a3a3e` | borde de `.pill` (legado; no usar en nuevo) |
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
| `--t-hero` **(DS-1)** | 34 | número protagonista de una vista | racha `.strk-n`, valor de detalle `.mdval` |

- **Prohibidos:** 7, 7.5, 8, 9.5, 14, 15, 17–21, 23–26, 30, 36, 40. Se mapean según §20.
- **Excepción de componente:** el número dentro de un anillo escala con el anillo (lg 26 · share 24 · banner 21).
- **Overlays exentos:** boot, wrap (60/44/20) y escáner (40) son pantallas de un solo mensaje.
- Micro-texto legible **≥10 px**; 9 px solo para mayúsculas espaciadas (etiquetas, ejes).
- Inputs de formulario en **16 px** (evita el zoom de iOS).

**Peso:** 300 glifos grandes (`+` del FAB) · 400 texto · 500 (reservado, casi sin uso) · **700** énfasis, números,
botones · **800** títulos, `//SECCIÓN`, `.whdr`, nombre del ejercicio, valores display. **600 prohibido** (no está
cargado; el navegador lo pinta como 700).

**Tracking (DS-1):** `--ls-caps .2em` mayúsculas de 9–11 px · `--ls-title .12em` `.whdr`/títulos en mayúsculas ·
`--ls-num -.03em` números ≥22 px · 0 por defecto. Un rol = un valor, siempre en `em`.

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
| `--s7` **(DS-1)** | 32 | entre secciones grandes |
| `--s8` **(DS-1)** | 48 | nivel pantalla |

**Ritmo de página** (knobs afinados por el dueño en `?design=1`; no se cambian sin él): `--sp-py 22` · `--sp-px 18`
(gutter horizontal) · `--sp-card 15` · `--sp-gap 12` · `--sp-section 14` · `--sp-field 12` · `--sp-row 12` ·
`--sp-sheet 18`.

Reglas: lo interno de un componente usa la escala `--s*`; el ritmo de página usa `--sp-*`; nada de 3/5/7/9/11/13 px
salvo ajuste óptico ≤2 px comentado. **Todo borde horizontal de contenido = `--sp-px`** (página, barras, nav, FAB,
sheets); solo los overlays de pantalla completa se salen.

### 4.6 Radios (comunican jerarquía)

| Token | px | Qué |
|---|---|---|
| `--r-sm` | 2 | datos densos: inputs de la tabla de sesión, celdas, indicadores |
| `--r-mark` **(DS-1)** | 4 | marcas de gráfica: días del calendario, topes de barras |
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
- **Sombras:** `--glass-shadow` (chrome glass) y `--shadow-float` **(DS-1)** `0 6px 22px rgba(0,0,0,.55)` para lo que
  flota sobre contenido (FAB, popover, fantasma de arrastre, panel de diseño). Ninguna otra.
- **Sin gradientes CSS.** El único gradiente es el relleno tenue bajo la línea de las tiles de gráfica (SVG, ≤.16 α).
- **Sin glow**, salvo la excepción documentada del estado del anillo de macros (§15).

### 4.8 Movimiento (DS-1)

| Token | Valor | Uso |
|---|---|---|
| `--dur-1` | 120ms | tap, pressed, toggles |
| `--dur-2` | 180ms | componentes: filas, chips, pestañas, barras que crecen |
| `--dur-3` | 280ms | sheets, nav, toast |
| `--dur-screen` | 140ms | fade de cambio de pantalla (existente, `viewin`) |
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | entradas y transformaciones (sin overshoot) |
| `--ease-in` | `cubic-bezier(.4,0,1,1)` | salidas |

### 4.9 Capas (z-index, DS-1)

`--z-float 20` (FAB, fantasma) · `--z-nav 30` · `--z-modal 40` (scrim + sheet: **tapa la nav**) · `--z-pop 50`
(popovers, addpop) · `--z-overlay 60` (boot, wrap) · `--z-toast 80` · `--z-dev 90` (`?design=1`).

### 4.10 Glass (solo chrome)

`--glass-bg rgba(14,14,17,.55)` · `--glass-bg-strong .72` · `--glass-blur 18px` · `--glass-sat 1.7` · `--glass-edge`
· `--glass-ring` · `--glass-shadow`. Se aplica con las utilidades `.glass` / `.glass-strong` (DS-3: nav, sheet y toast
dejan de copiar sus propiedades). Fallbacks existentes: `@supports not (backdrop-filter)` y
`prefers-reduced-transparency` → sólido `--sheet-bg`.

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
| **Primario** | `.start`, `.sheetbtns .ok` | 48px · `--r-ctl` · `--fill` + `--on-fill` · 13/700 · tracking .02em | la acción principal de la vista (una por vista) |
| **Secundario** | `.secondary .b`, `.sheetbtns .cancel`, `.toggles button` | 44px · `--r-ctl` · 1px `--border` · 12/400 · `--o60` (`.on` = relleno) | alternativas, cancelar, selector de opciones |
| **Acción de texto** | `.addbtn`, `.ctrls a`, `.section .meta a` | texto `[ ]` 10–11 px `--o60`, zona táctil ≥44 (padding + margen negativo) | acciones frecuentes dentro de datos |
| **Flotante** | `.fab` | 56 círculo, `--fill`, glifo 30/300, `--shadow-float` | agregar (macros) |

Destructivo = secundario + `.danger` (`--bad`). **No:** botones con estética propia por módulo, botones <44 px de zona
táctil (el footer de sesión hoy mide ~30 px: se corrige en DS-3), pills como sustituto de botón, íconos sin texto en
acciones importantes.

### 7.2 Inputs — dos familias (dualidad intencional)

| Familia | Clases | Anatomía | Dónde |
|---|---|---|---|
| **Formulario** | `.field input/select`, `#fa_q`, `textarea.ta(.sm/.md/.lg/.xl)` | 44px · `--r-ctl` · 1px `--border` · `--card` · 16px | sheets, ajustes, onboarding, perfiles |
| **Dato** | `.inp`, `.pick`, `.fs`, `.bwchip` | 36px · `--r-sm` · .5px `--o20` · transparente · 12px | tabla de sesión e historial ("la caja cabe su contenido") |

Label: `.field label` en mayúsculas 10 px `--o50`. **Unidad/porción siempre `<select>`, nunca texto libre**
(vinculante). Selects en sheets (`.pfsel`, `.mmrow select`) pasan a la familia formulario en DS-3. **No:** alturas
30/32/34/38, radios 8, sombras internas, labels flotantes, bordes de color.

### 7.3 Toggles y pestañas

- `.toggles` (segmentos de opción, 44 px): selección = relleno `--fill`. Lo **sugerido** va con borde punteado hasta
  tocarse (`.pftog.sug`).
- Pestañas de periodo/vista (`.mdtabs`): mismo alto y línea base; la selección se marca por contraste; el indicador
  se desliza al cambiar (DS-5). **No** tarjetas por pestaña.

### 7.4 Chips y etiquetas — tres familias

| Familia | Clases | Anatomía | Función |
|---|---|---|---|
| **Etiqueta de dato** | `.note` (`[cable]`, `[+ nota]`), `.exp`, `.exT` | texto sin caja, 10–11 px, `--o50`; tappable con subrayado punteado | describe (tipo, T, perfil) |
| **Estado** | `.vst`, `.setprog`, `.lpr` | texto 9 px mayúsculas sin caja; color = semántico del estado | dice cómo está (bajo MEV, ▲+3 %, PR) |
| **Seleccionable** | `.chip`, `.spc`, `.ag-chip` | píldora, ≥36 px de alto, `--card2` o borde .5px, 11 px | se toca para marcar/filtrar (suplementos) |

**No:** chips con radio 4/6/8/14, cajas alrededor de estados, más familias.

### 7.5 Filas

- **`.line` — firma de la app.** Clave (`--o60`) · líder punteado (`.dots`) · valor (`--fg`). Para toda lectura
  clave-valor (stats, detalles, perfiles). `.mdline` es su variante de detalle (12 px) y converge a `.line.lg`.
- **Fila de lista** (`.row`, DS-3; hoy `.exrow`, `.mmrow`, `.mscrow`, `.mdtr`, `.nvm`, `.pickitem`, `.hrow`):
  padding `--s3`–`--s4`, separador .5px `--o10`, tap en toda la fila, contenido en una línea + sublínea opcional.
- **Fila de volumen** (`.vrow` + `.vbar`): nombre + estado a la izquierda, lectura a la derecha, barra de 3 px con
  marcas MEV (`--o40`) y MRV (`--warn`).

### 7.6 Encabezados

| Componente | Anatomía | Función |
|---|---|---|
| `.status` | 10 px `--o50`; usuario 12/800 · fecha centrada · racha a la derecha | barra de estado de toda pantalla |
| `.whdr` | `//NEXT`/`WORKOUT` 16/800 `--o50` tracking `--ls-title` + nombre del día 22/800 | **firma de las pantallas de gym. No aplanar** |
| `.section .h` | `<span class="s">//</span>` + nombre, 16/800 | título de sección |
| `.grp-label` | 9 px mayúsculas `--ls-caps` `--o40` | etiqueta de grupo dentro de una sección o sheet |
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
session). Sólidas (`--frame`) con borde superior `--o12`; gutter `--sp-px`; alturas táctiles ≥44 en sus botones
(DS-3). Fin de descanso: 3 destellos de borde `--good`.

### 7.10 Navegación

Píldora glass flotante (`.nav`), 3 pestañas: **progress · gym · macros**. Íconos de línea 24u trazo 1.6; la activa se
ensancha y muestra su etiqueta (fondo `--o12`). Pertenece al chrome, no al contenido. Suplementos, músculos, split,
historial y ajustes viven en el menú `u/…`. **No:** más de 3–4 pestañas, dock con lupa, rebote.

### 7.11 Sheets y modales

`openModal(html, cls)`: scrim `rgba(0,0,0,.6)` + `.sheet` **glass-strong anclado arriba** (esquinas inferiores
`--r-sheet`), padding `--sp-sheet`, máx. 80 % (`.tall` 90 vh). Título `.sheet h3`, botones `.sheetbtns`
(primario + secundario). Entrada/salida deslizando 280 ms `--ease-out` (DS-3). El contenido dentro del sheet usa el
lenguaje normal (no todo es glass). `nodismiss` solo para decisiones obligatorias (sesión inactiva).

### 7.12 Toast

Píldora glass sobre la nav, 12/700, un mensaje corto. **Borde por tipo** (DS-1): éxito `--good`, error `--bad`,
neutro `--border`. Errores sin auto-cierre; máximo 3 apilados; `aria-live`. **No** confeti ni sonido.

### 7.13 Popover de agregar (FAB)

`.addpop`: acciones `.api` en píldoras sólidas `--fill`, escalonadas 40 ms, `--ease-out` (sin overshoot, DS-5).

### 7.14 Vacíos, carga y errores

- **Vacío** `.empty`: `// ` + frase corta en `--o50` + `.ehint` con la acción. Sin ilustraciones.
- **Carga:** texto de sistema, spinner simple o cursor `▌`; el boot (1.3 s) es la única pantalla de carga con
  personalidad. Sin puntos que rebotan.
- **Error:** toast `--bad` + texto que dice qué pasó y qué hacer.

### 7.15 Barras de progreso

`.bar`/`.vbar`/`.wprog`: 3px (2px en `.wprog`), píldora, `--track` + relleno `--fill`; exceso (`.over`) en
semántico. Barras segmentadas (celdas) permitidas para conteos discretos (DS-6).

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

## 10. Movimiento

Anima **cambios de estado**: navegación entre pantallas (fade 140 ms), sheets (280 ms), filas que entran/salen
(180 ms), pestañas (180 ms), barras que crecen (180 ms), confirmación ✓ (120 ms con el único overshoot permitido),
números que cambian (DS-5). **Nunca** en re-renders de la misma pantalla (cada tecla re-renderiza).
**No:** rebote, elástico, parallax, animaciones infinitas decorativas (el radar que "respira" se quita en DS-5), "que
se sienta premium". Pressed: opacidad o `scale(.98)`. `prefers-reduced-motion` ya reduce todo a 0.01 ms.

## 11. Íconos y glifos

- **SVG** de línea, viewBox 24, trazo **1.6**, puntas redondas, `currentColor`. Una sola familia (sin mezclar relleno,
  3D o redondeados).
- **Vocabulario de glifos** (fijo): ✓ hecho · ○ pendiente · ▲▼ progreso · ⬆⬇↔ perfil de resistencia · › entra a
  detalle · ↓ drop · ✕ quitar · ▾ desplegar · ⠿ arrastrar · ▦ rango custom · ~ estimado · ▌ cursor · ⚠ aviso.
- **Emoji pictográficos no** (🗑 🔒 📸 se cambian en DS-3). Sus etiquetas con emoji ("puh🥀") se respetan: son suyas.

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

## 16. Prohibido

Fuentes nuevas · gradientes CSS · neón/glow (fuera de §15) · fondos ilustrados, animados, shaders, aurora ·
tarjetas 3D o glass en contenido · sombras decorativas · paletas pastel o arcoíris · colores de acento aleatorios ·
color como categoría · tamaños, espacios o radios fuera de token · peso 600 · pills como botón universal ·
tarjeta por cada dato · confeti, partículas, XP, mascotas, FOMO · renombrar sus etiquetas · anillos fuera de
macros · puntuación única · 0 falso en gráficas · placeholders de relleno ("+ machine") · unidad en el corchete
frontal · unidad en texto libre · animar re-renders · `style=""` para lo que ya es clase · componentes de librerías
externas sin adaptar (§19).

---

## 17. Protocolo para features nuevas

Antes de escribir UI, responder por escrito (en el plan):
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
corre antes y después de cada cambio de UI; **ningún commit puede subir los contadores P0/P1**.

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
Dependencias permitidas: MIT, versión fijada, cacheadas por `sw.js` (offline). Hoy solo `number-flow` lo justifica
(web component sin React); sonner, cmdk y vaul son solo-React.

| Prioridad | Patrón (ej. en 21st) | Dónde | Cómo |
|---|---|---|---|
| A | Números animados (Number Flow) | kcal y macros, racha, valor de detalles, totales de sesión/compartir, series de //MÚSCULOS | `number-flow` fijado; sin blur; respeta reduced-motion |
| A | Toast semántico (Sonner) | todo el feedback | propio: tipos, máx. 3, errores sin temporizador, `aria-live` |
| A | Mantener para confirmar (Hold to Confirm) | abortar sesión, borrar sesión/día/comida, reset | pointer + `animate`, barra "armando %"; reemplaza `confirm()` en lo irreversible |
| A | Filas que entran/salen (Animated List) | + serie, drop, borrar, + ejercicio, chips de supps | FLIP / `@starting-style`, 4 px + opacidad, `--dur-2` |
| A | Indicador de pestañas deslizante (Animated Tabs) | periodos de gráficas, toggles de macros | un indicador que mueve posición y ancho |
| A | Glosario al tocar (Tooltip → popover) | RIR, T, MEV/MRV, estimado/observado, ~ | atributo `popover` nativo; nunca hover |
| B | Rail de historial (Timeline) | historial | `<ol>` + línea `::before` + fechas |
| B | Filas expandibles (Data Grid) | historial: ver series sin abrir el sheet | `<details>` / toggle |
| B | Transición de origen (Morphing Dialog) | fila del catálogo → perfil del ejercicio | View Transitions API |
| B | Barras segmentadas (8-bit progress, solo la idea) | intake de macros, series vs MEV | N celdas de un color |
| C | Paleta de comandos · text scramble en etiquetas | acceso rápido · boot | solo con ≥15 acciones; nunca en números |
| No | shaders, aurora, sparkles, tarjetas 3D, glow, docks con lupa, gooey, carruseles, partículas, glass en tarjetas | — | rompen monocromo, táctil o batería |

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
| 22 | P2 | balance: mantenimiento verde / volumen ámbar como categoría | neutro + glifo (déficit azul se queda) | DS-3 |
| 23 | P2 | 11 grosores de trazo SVG | 1.6 íconos · 1.4/1.8 gráficas | DS-3 |
| 24 | P2 | emoji 🗑 🔒 📸 | glifo/texto | DS-3 |
| 25 | P3 | CSS muerto (`.glass*`, utilidades v156, `.prow`, `.srowm`, `--warn-glow`) y reglas repetidas (`.nav`, `.fab`, `.grp`, `.sheet`×3, `.grp-label`, `.mdk`) | limpiar | DS-1 |
| 26 | P3 | docs viejas: "Design language" de CLAUDE.md, comentario r13/r11, "`!important`" del modo diseño | apuntar aquí | DS-0 |

**Fases:** DS-0 documento y auditor · DS-1 P0 + tokens nuevos + capas + CSS muerto · DS-2 tipografía, tracking,
gutters y espaciado · DS-3 componentes (radios, inputs, chips, botones, sombras, glass, sheets, íconos) · **PT2 v231
(diagnóstico por músculo)** · DS-4 deuda en línea · DS-5 movimiento + números animados + filas + pestañas · DS-6 capa
21st A/B. Cada fase es una versión desplegable con capturas antes/después y `ds-audit` sin regresiones.

*Historial:* v33 "Luxury Terminal" · v139–v145 consolidación (48/44, `.field`, 140 ms, vacíos `//`) · v160 color ·
v169–v176 glass en chrome · v171 headers tokenizados · v213 `.pf` · v224 encabezado de ejercicio en dos líneas ·
v225 ✓ a la derecha y deslizar para borrar · v226 //SUPPS y calendario · v227 gráficas estilo Bevel · v228–v230
músculos canónicos, perfil, //MÚSCULOS · **2026-09-18 este documento reemplaza a STYLEMAP.md**.
