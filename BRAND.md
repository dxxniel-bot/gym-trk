# gym//TRK — BRAND (léelo primero)

> La identidad de gym//TRK en una página. Manda sobre todo lo demás: si `DESIGN_SYSTEM.md` (la referencia), una skill
> o una propuesta choca con esto, **gana este archivo** y el choque se anota como pregunta para el dueño.
> Sin historia ni versiones aquí: eso vive en `DESIGN_CHANGELOG.md` (nunca se implementa desde ahí).
> Última decisión registrada: 2026-09-23.

## 1. Qué es

**gym//TRK es un registro de entrenamiento escrito como una sesión de terminal, dentro de un chrome de vidrio moderno.**
El **contenido** es terminal: texto monoespaciado sobre `#000`, en líneas y columnas, jerarquía por opacidad, acciones
`[verbo]`, color solo cuando dice algo. El **chrome** es vidrio: lo que flota (nav, sheets, toasts, popovers) es
translúcido, con blur y radio chico. Nunca al revés: el vidrio no entra al contenido y el contenido no flota.

Nombre corto de la identidad: **CMD hacker × glass moderno**.

Qué **no** es: verde matrix, scanlines, glitch, typewriter en el contenido, neón, prompts falsos (`root@`,
`user@host:~$`), tiles tipo Apple Health, SaaS genérico, wellness pastel, gamificación de casino (confeti, XP, mascotas).
El caret `>` sí existe, con un solo significado: **aquí / activo** (la pestaña en la que estás, la línea que imprime el
arranque, la fila del perfil que estás llenando); nunca como prompt decorativo (§3).

## 2. Reglas (IDs estables — se citan en cada cambio)

| ID | Regla |
|---|---|
| **B-01** | **Dos capas.** Contenido plano sobre `#000` (terminal). Chrome flotante de vidrio (nav, sheet, toast, popover). `backdrop-filter` solo en chrome. |
| **B-02** | **Texto primero.** Todo dato se puede escribir con caracteres; la gráfica existe solo cuando el texto no alcanza. |
| **B-03** | **Una línea por registro.** El átomo es la fila de referencia del dueño: `#chest  bench press  160lbs×8@0 / 160lbs×6@0`. Toda lista nueva se diseña primero así. |
| **B-04** | **Jerarquía = opacidad > tamaño > peso.** Escala única 10·12·14·20·28 (también en SVG; la movió el dueño el 23-sep: "14 · 20, más compacto"). `--t-field` 16 **solo** en lo editable (input, select, textarea: con menos de 16 el iPhone hace zoom al enfocar); nunca en texto que solo se lee. JetBrains Mono, única familia. |
| **B-05** | **Contenido afilado** (la reescribió el dueño el 23-sep: "4 px, suave"). Reglas y barras a 0. `--r-sm` 2 px **solo** en marcas que no se tocan. `--r-mark` 4 px en marcas de gráfica. **Todo control —botón, campo, celda de la tabla de series, chip, toggle— y las tarjetas a 4** (`--r-ctl` = `--radius` = 4). Solo el chrome flotante (nav, sheets, toasts, popovers) lleva `--r-float` 8. 50 % solo en puntos. Única píldora que queda: la tapa de las barras finas ≤6 px (`.bar`, `.wprog`, `.vbar`). |
| **B-06** | **Dos tipos de acción.** `[verbo objeto]` para lo puntual, **incluidos los secundarios** (cancelar, alternativas de una hoja, `[abort]`, `[↩]`): sin caja, corchetes en `--o40` (enviados en v267). **Un solo primario por vista** (bloque gym//TRK, §4). Fila que termina en `›` para navegar. Nada más. |
| **B-07** | **Color reduccionista.** La paleta es la opacidad del blanco. El color semántico va en el **glifo o el número**, nunca en una frase entera. ≤3 marcas de color sobre el pliegue. Si está en orden, no lleva color. |
| **B-08** | **Íconos TRK.** Palabra > glifo del set (§3) > ícono TRK (SVG propio, §4). **Emoji de interfaz: 0.** Lo que el dueño escribe (🥀 en un nombre) se muestra tal cual. |
| **B-09** | **Movimiento: el contenido imprime, el chrome se desliza.** El contenido cambia al instante o con opacidad + ≤4 px. Solo el chrome se mueve como vidrio. Un movimiento visible por toque. Reduced-motion = instantáneo. |
| **B-10** | **Menos detalle.** Una idea una vez. Sin instrucciones impresas (van al glosario `data-gloss`). ≤4 secciones sobre el pliegue. |
| **B-11** | **Hecho para la serie.** Una mano, toque ≥44×44, lo que necesitas ahora es lo más grande. Lo que se ve puede ser fino; el toque sigue ≥44. Texto nunca por debajo de `--o40`. |
| **B-12** | **Sus etiquetas son sagradas.** Músculos, ejercicios, comidas y splits se muestran exacto como él los escribió: sin renombrar, sin mayúsculas forzadas, sin cortar. `[uni]`/`[bi]` al frente del nombre = solo lateralidad. |

## 3. Vocabulario

**Tres sigilos.** `//` = sistema (secciones, vacíos, marca) · `[ ]` = acción · `#` = etiqueta del dueño (tenue).

**Corchetes.** `[verbo objeto]`: minúsculas, sin espacios internos, ≤3 palabras, nunca dentro de una caja, con zona de
toque de 44 px (`.u-hit`). Ej.: `[+ set]` `[share]` `[‹ gym]` `[borrar sesión]`.

**Glifos — diccionario cerrado (`GLYPHS`, un glifo = un significado).**

| glifo | significa | glifo | significa |
|---|---|---|---|
| ✓ | hecho | ○ | pendiente |
| ▲ ▼ | cambio (sube/baja) | ⠿ | arrastrar / reordenar |
| › | entrar / abrir detalle | ‹ | atrás / anterior |
| ▾ | desplegar / elegir | ▶ | empezar / continuar |
| ↓ | drop set | ✕ | quitar |
| ↩ | deshacer | ~ | estimado |
| ⚠ | aviso | ▌ | cursor (solo arranque y vacíos) |
| × @ / → # | notación de series y datos | — | sin dato |
| `>` | aquí / activo (pestaña de la nav, prompt del arranque, fila con foco) | ▖ ▘ ▝ ▗ | trabajando: `▖ buscando… 3s` |
| █ ░ | medidor de progreso: `[██████▍░░░] 42%` (octavos ▏…▉ en el borde) | | |

Los de trabajo y medidor (con el box-drawing) viven en `GLYPHS_VIZ` y solo en dos componentes: el spinner de texto, cuando
no se sabe cuánto falta, y el medidor, cuando el avance es real. Nada de anillos que giran.

✓ ○ ⠿ ↩ **no existen en JetBrains Mono**: Google no los sirve y salen con la fuente del sistema (pregunta abierta, §10).
Los demás glifos del set llegan de la fuente con un subconjunto propio (`&text=`, v267).

Fuera del set (se reemplazan): ⓘ → `[?]` · ⎘ → `[duplicar]` · ✎ → `[editar]` · ≈ → `~` · ◦ ▸ ▴ → `›`/nada ·
← → `‹` · ✗ → `✕` · ■ → texto. ▲▼ nunca para reordenar (eso es ⠿).

**Mayúsculas.** Solo `//SECCIÓN`, siglas (PR, RIR, MEV, MRV) y rótulos de grupo. Todo lo demás en minúsculas, incluidas
las etiquetas de campo. Cabeceras en una línea (`sep 2026 · 10`).

**Idioma (decisión 2026-09-21).** Etiquetas de sistema en **inglés** (`//PROFILE`, `//SETTINGS`, `//HEALTH`,
`//STIMULUS`, `//PROGRESS`, nav, verbos de comando: `start`, `save`, `rest`, `skip`). Prosa en **español** (ayudas,
errores, toasts, vacíos, diagnósticos). Un componente nunca mezcla idiomas. Las etiquetas del dueño no se traducen.

**Números.** Series pegadas `160lbs×8@0 / 160lbs×6@0` · lectura suelta `59.8 kg` (unidad tenue) · miles `2,405` ·
cambio `▲ +3%` / `▼ −4%` (signo menos real) · hora `09:13` · duración `1h26` · fecha `17 sep` · estimado `~43` ·
sin dato `—`.

**Marca.** `gym//TRK`: `gym` y `TRK` en `--fg`/800, `//` en `--o40`, sin tracking. 22 en pantalla, 16 en overlays y
pie de compartir, 34 solo en el landing. Una sola variante.

**Box-drawing** (`─ │ ┌ ┐`): solo en overlays y compartir, nunca en listas del día a día.

## 4. Las piezas de marca (decididas; su forma exacta se elige en el estudio, `tools/studio.html`)

- **Nav — "glass terminal bar"** (decidida el 23-sep). Cápsula flotante de vidrio (blur, borde .5 px, sin sombra blanda)
  con radio `--r-float` 8; dentro, pestañas de **texto** siempre visibles (`progress  gym  macros`), sin íconos. La activa
  lleva `>` delante, que **parpadea** (paso seco, `--dur-blink` 1.1 s; quieto con reduced-motion), y su nombre en `--fg`;
  las demás en `--o50`. El `>` apagado guarda su lugar: el nombre nunca se mueve. Alto 44. Sin animar layout.
- **Primario gym//TRK** (decidido el 23-sep). Bloque sólido inverso (`--fill`, texto `--on-fill`), 44 px de alto
  (`--h-pri`), radio 4 (`--r-ctl`), texto de comando en minúsculas con glifo (`▶ resume workout`, `✓ save session`),
  12/800. Uno por vista. Presionado = invertir (fondo negro, texto `--fg`, anillo interior de 1 px).
- **Anillo de kcal.** Se queda (única gráfica circular de la app, solo en macros), en un **panel de vidrio sutil** (relleno
  `--glass-bg-strong`, borde de canto `--glass-edge`, radio `--r-ctl` 4, sin blur: excepción con nombre `ring`); sin brillo
  ni punto al 0 %; color solo en el arco y en `left/over`.
- **Puntuaciones reduccionistas.** Existen, en mínimo: `recovery ~43` en una línea 12/800 sin héroe ni color de
  veredicto; `~ retention 62 · Na:K 2.1 →` como fila de diagnóstico que solo aparece si se sale de rango.
- **Íconos TRK.** SVG propio: rejilla 24, trazo 1.6, remates cuadrados, geometría ortogonal de consola,
  `currentColor`. Piezas: share, camera (marca de la serie grabada, reemplaza al emoji 📷) y escáner (la nav es de texto
  desde v267). Un ícono nuevo necesita aprobación del dueño.
- **Arranque.** Shader WebGL de marca (única excepción de fondo animado): **matriz de puntos de fósforo** (rejilla de 6 px,
  onda desde el centro, monocromo), encuadre cover (sin comprimir), cuadro quieto con reduced-motion y apagado en segundo
  plano, detrás del texto a `--op-dim`. **`loading gym tracker` en cada apertura** (decidido el 23-sep, enviado en v268):
  `gym//TRK` con su versión, `> loading gym tracker`, sus líneas de estado reales (`db`, `split`, `last session`) una a una —solo
  aparecen, nada se mueve—, el medidor `[██████] 100%` y `ready▌`. ~1 s; versión corta (~0.5 s, sin shader, `> resuming
  <día> · set n/N`) con una sesión viva o si abriste hace menos de 30 min; tocar lo salta; con reduced-motion sale todo a
  la vez. Ningún aviso se abre debajo de él.
- **Trabajo en curso** (enviado en v268, §9). Como en una terminal: `▖ verbo… 3s` (el glifo cambia, los segundos cuentan)
  cuando no se sabe cuánto falta; `[█░] %` cuando el avance es real. Sin anillos giratorios.

## 5. Siete primitivos (todo se arma con esto)

```
u/unlxvd ▾          21 sep · 21:29          streak: 12        ← línea de prompt (barra de estado)
//STIMULUS                          effective sets · 7 d     ← //cabecera + meta a la derecha
peso ······························ 61 kg  ▼ −0.4           ← clave ···· valor
#chest  bench press  160lbs×8@0 / 160lbs×6@0                 ← línea de registro
[+ set]  [↓ drop set]  [share]                               ← [comando]
 1  FS  [ 60   ] lbs [10] [2]  ✓                             ← rejilla de datos (cajas de 4 px)
[███████░░░] 72%                                             ← medidor
```

## 6. Excepciones con nombre (todas funcionales)

`ring` anillo de kcal (macros y compartir) · `table36` tabla de sesión con celdas de 36 px (densidad en la serie;
el ✓ amplía su toque con `::after`) · `boot` shader del arranque · `wrap`/`scanner` overlays de un solo mensaje ·
`vp-lock` zoom bloqueado (app nativa-like; compensado con 16 px en campos) · `camera` ícono TRK de cámara en
compartir-ejercicio (lo que el dueño pone en sus historias) · `user-label` emoji dentro de etiquetas del dueño.

## 7. Prohibido

Emoji de interfaz · shaders fuera del arranque · blur en el contenido · píldoras y tarjetas redondeadas en el contenido ·
un segundo primario en la misma vista · color en frases enteras · puntuación única en tamaño héroe · instrucciones
impresas en pantalla · texto bajo `--o40` · renombrar o forzar mayúsculas en etiquetas del dueño · tarjetas de
compartir con números gigantes ("del pito") · confeti, XP, mascotas, FOMO · fuentes nuevas · peso 600.

## 8. Prueba de 5 segundos (objetiva, a 393×852)

Sin logo y en gris, ¿parece una terminal dentro de vidrio? Y con conteos (los mide `_dsRenderCheck`):
`backdrop-filter` fuera del chrome = 0 · esquinas > 4 px en el contenido = 0 (medido por `_dsRenderCheck` · rad) ·
primarios por vista ≤1 · marcas de color
sobre el pliegue ≤3 · emoji de interfaz = 0 · glifos fuera de `GLYPHS` (y de `GLYPHS_VIZ`, trabajo y medidor) = 0 · tamaños fuera de la escala (incluido SVG)
= 0 · texto bajo `--o40` = 0 · fugas del navegador (13.333 px, `rgb(240,240,240)`) = 0 · ¿se puede reescribir con
caracteres sin perder un dato?

## 9. Registro de decisiones del dueño

| fecha | decisión | cita / origen |
|---|---|---|
| 2026-06-01 | Estética terminal/CLI, monocroma, JetBrains Mono | origen del proyecto (ironLOG → gym//TRK) |
| 2026-06-01 | Compartir comida: rótulo centrado + anillo + comidas con todos sus alimentos (primera versión, restaurada en v257) | "estaba mejor la primer versión" |
| 2026-08-21 | `[uni]`/`[bi]` al frente = lateralidad, nunca la unidad | reporte v217 |
| 2026-09-19 | Racha en una sola escala de blanco (fuera gris+verde) | "el gris y el verde se ven feos" |
| 2026-09-21 | Macros en orden SUPPS → MEALS → WATER, con esos nombres | "supps, meals y water al final y esos nombres" |
| 2026-09-21 | Compartir sesión = su vista RECENT; nada de héroes ni rejillas | "ese diseño… está del pito" · "este formato me gustaba más, más sencillo" |
| 2026-09-21 | Menos detalle en toda la interfaz | "se está haciendo muy completa y con muchos detalles" |
| 2026-09-21 | Compartir es vertical, a altura natural, nunca un cuadro que recorte | "share de rutina igual todo feo, amontonado" |
| 2026-09-21 | **Identidad = mezcla "CMD hacker × glass moderno"** | "que todo sea un mix cmdhacker/glass moderno" |
| 2026-09-21 | Nav: híbrido de cápsula de vidrio y barra de terminal | "genera una propuesta mezclando la cápsula de vidrio con tipo barra terminal" |
| 2026-09-21 | Formas: afilado para datos, radio chico solo en lo flotante | "Mixto con regla" |
| 2026-09-21 | Dos tipos de botón; el principal, más gym//TRK | "corchetes para cosas puntuales y btns para principales, pero el estilo de los principales … más al estilo gymTRK" |
| 2026-09-21 | Etiquetas de sistema en inglés, prosa en español | "Etiquetas en inglés" |
| 2026-09-21 | Anillo de kcal se queda | "dejarlo, pero que todo sea un mix cmdhacker/glass moderno" |
| 2026-09-21 | Color y puntuaciones se conservan, en versión mínima | "conserva pero hazlo lo más reduccionista posible" |
| 2026-09-21 | Share y cámara se quedan, con íconos propios | "rediseña los iconos a que sea nuestro estilo" |
| 2026-09-21 | Shader del arranque se queda, corregido (se ve comprimido); explorar 21st.dev | "mantener pero ajustar, la relación de aspecto lo hace ver comprimida" |
| 2026-09-22 | **Look "1"** (elegido en el estudio, v262): todo lo que flota con radio 12; anillo en panel de vidrio sutil; arranque = matriz de fósforo; borde de campo editable 1 px `--o40`; verde solo en glifo o número; `recovery ~43`; retención = una fila de diagnóstico solo fuera de rango; marca única `gym//TRK`; etiquetas de sistema en inglés | "TRK-PICK v1 · 1 · base v261 · datos demo · 3float=B 4ring=C 6boot=C 7field=A 10green=A 12recovery=A 13retention=B 14wordmark=A 17english=A" |
| 2026-09-22 | Escala de texto 10·12·**18·24**·34 y subrayado punteado de 1 px | tokens de la misma hoja: "--t-section 16px→18px · --t-display 22px→24px · --bw-dash 0.5px→1px" |
| 2026-09-22 | **Una sola familia de esquinas** (v264): todo control —botón, campo, celda de la tabla, chip, toggle— a `--r-ctl` 12; tarjetas 16; la píldora sobrevive solo en las barras finas. Reescribe B-05, que pedía lo contrario, y R-RAD deja de tolerar 45 casos | "sigo notando inconsistencias en todos los btns, lo que ya tienen estilo recondeado que ese sea el standar… que parezcan de la misma familia" |
| 2026-09-22 | **Negro de verdad** (v264): todo negro elevado pasa a R=G=B (`--card`, `--card2`, `--track`, `--faint`, `--sheet-bg`, el vidrio) y la saturación del vidrio baja de 1.7 a 1; se retira `--info` y el balance calórico deja de llevar color | "hay screens que tienen un tint como azulado en lugar de ser negro" |
| 2026-09-23 | **"Terminal sobrio"** (v267): estética más sobria y más de terminal, conservando los detalles de vidrio. Lo disparó el formulario de crear cuenta | "tosco, todo muy gordo" · "que sea una estética más sobria, que sea más terminal" · "detalles modernos, tipo glass transparente" |
| 2026-09-23 | **Esquinas a 4** (v267): todo control y las tarjetas a 4; solo lo que flota a 8. Reescribe B-05 otra vez (el 22-sep todo control iba a 12) | "el redondeado en general… de los botones, de las casillas de escribir, siento que es demasiado" · "hay elementos que son muy chiquitos, por ejemplo el full stack… el redondeado se ve exagerado" · elección: "4 px, suave" |
| 2026-09-23 | **Escala 10·12·14·20·28** (v267) y `--t-field` 16 solo en lo editable | "fuentes muy grandes para lo que son" · elección: "14 · 20, más compacto" |
| 2026-09-23 | **Nav de texto con `>`** (v267): el `>` marca la pestaña activa y parpadea; el nombre no se mueve | "que este símbolo > sea el que como que indique en qué pestaña estás… Y que esté parpadeando" · elección: "> parpadea y el nombre fijo (Recomendado)" |
| 2026-09-23 | **El arranque imprime `loading gym tracker` en cada apertura** (enviado en v268: línea por línea, versión corta con sesión viva o si abriste hace <30 min, tocar lo salta) | elección: "Cada vez que abres la app (Recomendado)" |
| 2026-09-23 | **Trabajo en curso como en Claude Code** (enviado en v268): spinner de texto `▖▘▝▗` con su verbo y los segundos; medidor `[█░] %` solo con avance real; fuera los anillos que giraban | "animaciones… estilo como lo de Claude Code, de que cuando está cargando algo, cuando está pensando" |
| 2026-09-23 | **Perfil en filas de terminal** (v268): crear cuenta pasa a filas `clave  control` en minúsculas, campos de 40, `>` en la fila con foco (el mismo "aquí" de la nav) y vista previa de kcal/proteína | respuesta a su queja del formulario de crear cuenta: "tosco, todo muy gordo" |
| 2026-09-23 | **Secundarios como `[verbo]`** (v267): sin caja, corchetes en `--o40`; decidido en principio el 21-sep (B-06) y enviado con esta ronda | su vista previa del 23-sep |
| 2026-09-23 | **Casilla = caja fina y opción = `[x]`** (v267): campo editable con borde 1 px `--o40`, fondo transparente y radio 4 (foco = borde `--fg`); toggle sin caja, la opción elegida `[entre corchetes]` en `--fg`/700 | su vista previa del 23-sep |

## 10. Preguntas abiertas (se cierran en el estudio, `tools/studio.html`)

Desde el 22-sep el dueño las ve **aplicadas a la app real** en el estudio (vista previa de cada pantalla con sus datos o con
demo, en solo lectura) y guarda sus combinaciones como "looks" para dejarlas reposar antes de mandarlas; lo que manda a
revisión llega como "hoja de elección" y cada respuesta se registra en §9 con fecha y cita. `tools/brand-lab.html` queda
como lámina histórica.

Cerradas el 22-sep con el look "1" (§9): panel del anillo (vidrio sutil), shader (fósforo) y borde de campo (1 px
`--o40`); ese día también el tinte de los negros (R=G=B, vidrio sin saturar). **Cerradas el 23-sep** (§9, v267): las
esquinas (contenido a 4 y lo que flota a 8; reemplaza el 12 del 22-sep), la escala (14 · 20), la variante de nav (texto
con `>` que parpadea), la variante de primario (bloque inverso de 44, radio 4, presionado = invertir) y los secundarios
como `[verbo]`. **Enviadas en v268** (§9): el arranque `loading gym tracker` en cada apertura y el trabajo en curso de
terminal (`▖▘▝▗` y `[█░]`), que dejan de estar pendientes. **Siguen abiertas:** set de íconos TRK (la nav ya no los usa: quedan share, camera y escáner), tarjetas →
paneles (por ahora solo bajaron a radio 4), `[‹ origen]` (hoy `[‹ back]` de texto que siempre vuelve a gym), interlineado
y opacidad a la escala, y **los glifos ✓ ○ ⠿ ↩ no existen en JetBrains Mono** (salen con la fuente del sistema):
reemplazarlos o aceptarlos.
