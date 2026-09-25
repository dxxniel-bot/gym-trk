# gym//TRK — BRAND (léelo primero)

> La identidad de gym//TRK en una página. Manda sobre todo lo demás: si `DESIGN_SYSTEM.md` (la referencia), una skill
> o una propuesta choca con esto, **gana este archivo** y el choque se anota como pregunta para el dueño.
> Sin historia ni versiones aquí: eso vive en `DESIGN_CHANGELOG.md` (nunca se implementa desde ahí).
> Última decisión registrada: 2026-09-24.

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
| **B-04** | **Jerarquía = opacidad > tamaño > peso.** Escala única 10·12·14·20·28 (también en SVG; la movió el dueño el 23-sep: "14 · 20, más compacto"). `--t-field` **14** (v269; antes 16) **solo** en lo editable (input, select, textarea); nunca en texto que solo se lee. Ya no hace falta 16 para evitar el zoom del iPhone al enfocar: el viewport lleva `maximum-scale=1` (`vp-lock`, §6) y la tabla de series lleva meses con campos a 12 sin zoom. Lo movió el dueño el 24-sep: "está desproporcional". JetBrains Mono, única familia. |
| **B-05** | **Contenido afilado** (la reescribió el dueño el 23-sep: "4 px, suave"). Reglas y barras a 0. `--r-sm` 2 px **solo** en marcas que no se tocan. `--r-mark` 4 px en marcas de gráfica. **Todo control —botón, campo, celda de la tabla de series, chip, toggle— y las tarjetas a 4** (`--r-ctl` = `--radius` = 4). Solo el chrome flotante (nav, sheets, toasts, popovers) lleva `--r-float` 8. 50 % solo en puntos. Única píldora que queda: la tapa de las barras finas ≤6 px (`.bar`, `.wprog`, `.vbar`). |
| **B-06** | **Dos tipos de acción.** `[verbo objeto]` para lo puntual, **incluidos los secundarios** (cancelar, alternativas de una hoja, `[abort]`, `[↩]`): sin caja, corchetes en `--o40` (enviados en v267). **Un solo primario por vista** (bloque gym//TRK, §4). Fila que termina en `›` para navegar. Nada más. |
| **B-07** | **Color reduccionista.** La paleta es la opacidad del blanco. El color semántico va en el **glifo o el número**, nunca en una frase entera. ≤3 marcas de color sobre el pliegue. Si está en orden, no lleva color. |
| **B-08** | **Íconos TRK.** Palabra > glifo del set (§3) > ícono TRK (SVG propio, §4). **Emoji de interfaz: 0** (el último de compartir, la cámara de fotos, salió en v269: la serie grabada lleva la cámara TRK). Lo que el dueño escribe (🥀 en un nombre) se muestra tal cual. |
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
| █ ░ | medidor de progreso: `[██████▍░░░] 42%` (octavos ▏…▉ en el borde) | σ | estímulo en series efectivas (1 = una serie al fallo; v272) |

Los de trabajo y medidor (con el box-drawing) viven en `GLYPHS_VIZ` y solo en dos componentes: el spinner de texto, cuando
no se sabe cuánto falta, y el medidor, cuando el avance es real. Nada de anillos que giran.

✓ ○ ⠿ ↩ **no existen en JetBrains Mono**: Google no los sirve y salen con la fuente del sistema (pregunta abierta, §10).
Los demás glifos del set llegan de la fuente con un subconjunto propio (`&text=`, v267).

Fuera del set (se reemplazan): ⓘ → `[?]` · ⎘ → `[duplicar]` · ✎ → `[editar]` · ≈ → `~` · ◦ ▸ ▴ → `›`/nada ·
← → `‹` · ✗ → `✕` · ■ → texto. ▲▼ nunca para reordenar (eso es ⠿).

**Mayúsculas.** Solo `//SECCIÓN`, siglas (PR, RIR) y rótulos de grupo. Todo lo demás en minúsculas, incluidas
las etiquetas de campo. Cabeceras en una línea (`sep 2026 · 10`).

**Idioma (decisión 2026-09-21).** Etiquetas de sistema en **inglés** (`//PROFILE`, `//SETTINGS`, `//HEALTH`,
`//STIMULUS`, `//PROGRESS`, nav, verbos de comando: `start`, `save`, `rest`, `skip`). Prosa en **español** (ayudas,
errores, toasts, vacíos, diagnósticos). Un componente nunca mezcla idiomas. Las etiquetas del dueño no se traducen.

**Números.** Series pegadas `160lbs×8@0 / 160lbs×6@0` · lectura suelta `59.8 kg` (unidad tenue) · miles `2,405` ·
cambio `▲ +3%` / `▼ −4%` (signo menos real) · hora `09:13` · fecha `17 sep` · estimado `~43` · sin dato `—`.
**Duraciones en h y min, con espacio** (`45 min` · `5 h 12 min` · `2 d 4 h`, vía `fmtDur`): **nunca horas decimales**
(`5.2 h` no dice nada; decisión del 24-sep, §9). En el eje de una gráfica, horas redondas (`7 h`). El temporizador de
descanso sigue en `m:ss` (`1:30`).

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
  `currentColor`. Piezas: share, camera y escáner (la nav es de texto desde v267). Un ícono nuevo necesita aprobación del
  dueño. **Camera, enviada en v269** a pedido suyo (24-sep): una **cámara de video** (cuerpo y lente de trazo 1.4 en
  `currentColor`) con un **punto rojo de grabación** relleno en `--bad`, de 16 px, a la izquierda de la serie que marcaste
  en compartir-ejercicio; reemplaza al emoji de cámara de fotos. El rojo es la señal de "grabando" que él pidió, no un
  veredicto. Como share, hoy está dibujada a viewBox 16 / trazo 1.4: pasar el set a la rejilla 24 / trazo 1.6 sigue
  abierto (§10).
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
//STIMULUS                                       σ · 7 d     ← //cabecera + meta a la derecha
peso ······························ 61 kg  ▼ −0.4           ← clave ···· valor
#chest  bench press  160lbs×8@0 / 160lbs×6@0                 ← línea de registro
[+ set]  [↓ drop set]  [share]                               ← [comando]
 1  FS  [ 60   ] lbs [10] [2]  ✓                             ← rejilla de datos (cajas de 4 px)
[███████░░░] 72%                                             ← medidor
```

## 6. Excepciones con nombre (todas funcionales)

`ring` anillo de kcal (macros y compartir) · `table36` tabla de sesión con celdas de 36 px (densidad en la serie;
el ✓ amplía su toque con `::after`) · `boot` shader del arranque · `wrap`/`scanner` overlays de un solo mensaje ·
`vp-lock` zoom bloqueado (app nativa-like; también evita el zoom del iPhone al enfocar un campo, por eso los campos van a
`--t-field` 14 desde v269) · `camera` ícono TRK de cámara de video con su punto rojo de grabación en compartir-ejercicio
(lo que el dueño pone en sus historias; v269) · `user-label` emoji dentro de etiquetas del dueño.

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
| 2026-09-24 | **Fuera el ánimo** (v269): se retira de toda la app (hoja, tile de progreso, línea `mood · today` de //STATS y su peso en recovery) y el dato se borra con una foto previa en IndexedDB; ya lo había pedido | "Te había dicho de que quitaras lo del mood" |
| 2026-09-24 | **`rest day` ≠ `skip day`** (v269): rest = descanso programado, se registra y **no mueve el split** (mañana toca el mismo día); skip = saltar el día del split. Los dos con `[deshacer]`; el descanso se quita con `[undo rest]` (en la hoja del calendario, `quitar descanso`) | "Rest Day no es para saltar, es para indicar... fue programado el descanso. Skip Day sí es saltar el día del split" |
| 2026-09-24 | **//PROGRESS se edita como pantalla de widgets** (v269): `[edit]` (o mantener una tile) → `−` en cada tile para quitarla, `⠿` para acomodarla, `+ add` para lo oculto y `✓ done` para confirmar (`cancel` descarta). Reemplaza la hoja de métricas on/off | "en configuración de activar y desactivar, preferiría que fueran otro de edit para poder que aparezca el signo de más para agregar, signo de menos en cada elemento para quitar... acomodar tu orden y ya después confirmar... como una screen de widgets" |
| 2026-09-24 | **Suplementos en una cuenta nueva** (v269): //SUPPS sale arriba de MEALS aunque no haya ninguno, con `[+ supp]` y `···` → `ignorar por ahora` (se reactiva desde ajustes) | "en una cuenta nueva, arriba de Meals, tendría que salir la opción de registrar suplementos. Y en caso de que no quieran, pues que sea tres puntitos e ignorar" |
| 2026-09-24 | **Cámara de video con punto rojo** (v269): la serie grabada en compartir-ejercicio lleva el ícono TRK camera (cámara de video y un punto rojo de grabación); fuera el emoji de cámara de fotos (B-08) | "en lugar del emoji de la cámara de fotografía sea una cámara de video... una señalización roja como de que está grabando" |
| 2026-09-24 | **Unidad del peso corporal aparte y primero** (v269): `te pesas en kg/lbs` es distinto de `pesas gym lbs/kg`; las dos van al inicio del perfil, el campo de peso sigue a la primera y el peso corporal se muestra en esa unidad en toda la app (registro, tile, detalle, wrap, perfil) | "ya pusiste tu peso en kilos. Porque abajo dice pesas en libras kilos. O sea, no tiene puto sentido" |
| 2026-09-24 | **Perfil proporcionado** (v269): casillas de 36 y `--t-field` 14 en toda la app (reescribe el 16 del 23-sep, B-04); actividad y objetivo como listas verticales con la descripción de cada opción a su lado (fuera la pista que cambiaba abajo); `[‹ atrás]` arriba | "el formulario para profile... está muy gordo, está muy alto, o sea, la casilla está muy grande, el texto adentro de las casillas también, o sea, está desproporcional" · "en actividad, de sedentario, ligero, moderado, alto, está mal acomodado. Y luego abajo la nota de que caminas algo... la nota dependiendo de qué selecciona... está todo goofy" · "no hay forma de darle back" |
| 2026-09-24 | **Atajo de Salud: pega todo** (v270): un solo Atajo copia pasos, peso, sueño con fases, FC en reposo, HRV y energía; la app lo pega con un toque (`health · paste` en //STATS, `[pegar de Salud]` en //HEALTH) y la receta explica que aún no somos app nativa. Lo tecleado a mano gana | "hay que ver la forma de generar un shortcut en general para que a la hora de pegar la información se pegue lo del peso, se pegue lo de los pasos, se pegue lo del HRV, se pegue lo de la frecuencia cardíaca en reposo, o sea, literalmente todo" |
| 2026-09-24 | **Meals sin trampas** (v271): `cancel` en la hoja de loguear **nunca** registra el alimento (vuelve a la búsqueda o cierra; un alimento nuevo decide aparte `guardar en mis alimentos [sí] no`) · `[+ food]` sube a la cabecera de cada comida, con sus corchetes, a la derecha entre el nombre y el total · el nombre de la comida manda y el total queda segundo (`--o70`/700) · cada alimento vuelve a llevar su línea `P 31 · C 2 · F 1` con la fuente principal (por kcal) en blanco negrita, sin color | "a pesar de que le doy cancelar se me agrega a la meal ese alimento que no quería agregar" · "el add food se pierde mucho… yo le añadiría los corchetes y lo pondría igual del lado derecho de la meal" · "el nombre de la meal y el total de calorías… destaca más… las calorías totales que es el nombre de la meal" · "le hace falta lo que antes tenía de que por alimento poner sus macros y en highlight como que su fuente principal" · elección: "Blanco en negrita, sin color" |
| 2026-09-24 | **Duraciones en h y min** (v271): `45 min` · `5 h 12 min` · `2 d 4 h` en toda la app (sueño, recuperación, sesión, agenda, recap, wrap, exportar); nunca horas decimales; el eje de una gráfica en horas redondas (`7 h`) y el descanso sigue `m:ss`. Reescribe el `1h26` de §3 | "hoy dormí 5.2 horas, pero ese 0.2 horas no me dice nada. así que hay que manejar horas y minutos, hay que manejar las unidades correspondientes de las cosas" |
| 2026-09-24 | **σ en lugar de la T y fuera MEV/MRV y la guía RP** (v272, modelo de `contexto/tension-v2.md` §3 y §6): el estímulo se mide en **σ** (series efectivas, 1 = una serie al fallo) según el peso relativo y la cercanía al fallo; el fallo cuesta aparte (costo C) y más de 30 reps cuenta como poco estímulo y mucha fatiga. //STIMULUS y //MUSCLES dan σ de 7 días por músculo real contra la **zona objetivo 10–20** (marcas neutras en 10 y 20; bandas <4 · 4–10 · 10–20 · 20–30 · >30, Pelland 2026); una frase solo si hay algo que mover y el color solo en el `⚠` (B-07). En el entreno, `obj RIR 1–2` según el peso reemplaza al contador de zonas. σ entra a `GLYPHS` | "me parece bien" · "el tema de las series efectivas y del mínimo volumen recuperable y esa madre y de la GRP, esa madre realmente no sirve" · "sí el volumen importa, pero no volumen basura, o sea volumen de repeticiones cercanas al fallo" · "si entrenas a 50 repeticiones RIR cero… es más bien fatiga cardiovascular" |
| 2026-09-24 | **Estado de cada ejercicio y fatiga acumulada** (v272): cada ejercicio dice `progresando` · `estable` · `estancado` · `retrocediendo` (o `pocos datos` con menos de 6 sesiones en 4 semanas), por la tendencia de su e1RM en la unidad real; con 2 o más retrocediendo en ~10 días y la semana cargada (+20 %) o con mucho fallo (>25 % a F o RIR 0), //STIMULUS **ofrece** una semana ligera — nunca la impone | "cuantificar si se está estancando, si se está progresando, si se está retrocediendo… acumulando fatiga" |
| 2026-09-24 | **Cómo entrenas, antes que los días** (v273): el editor del split abre con //SCHEDULE — `modo [diario] días fijos rotativo`; rotativo con `días on` (1–6) y `días off` (1–3); días fijos = una rutina (o descanso) por día de la semana; `días sin gym` (`L M X J V S D`) para lo que nunca abre. **El ciclo se calcula real** (sus 6 días a 3 on / 1 off = 8 días) y //COVERAGE cuenta sets por semana con ese ciclo. **Regla adaptativa** (su elección): tras los días on entrenados seguidos toca descanso; un día que no entrenas **es** descanso y no pide otro; un día sin gym es descanso. Gym lo dice (`hoy toca descanso · domingo sin gym · siguiente: …`) con `[entrenar igual]`, y los descansos del plan y los días sin gym no rompen la racha (un día de entreno que faltó, sí) | "antes de todo poner si se entrena a diario, si se entrena, qué días on, qué días off" · "deshabilitar tal día, por ejemplo domingo, porque… donde yo vivo ningún gimnasio abre los domingos" · "asignar un día de entrenamiento a la semana, o sea, todos los lunes se hace esta rutina" · "que sea rotativo… tres días on, uno off" · "mi split actual realmente sería un split de ocho días, pues que lo calcule bien" · para el domingo bloqueado en 3/1: "el domingo caería como rest day porque se descansó… tiene que ser adaptativo… si no se entrena = descanso" |
| 2026-09-24 | **RIR o RPE, por split** (v273): `intensidad [RIR] RPE` y `fallo (F) [sí] no` en //SCHEDULE. El RPE se guarda como RIR (10 − RPE) para que todo se calcule igual, y cada sesión se lee en la escala con que se registró (selector `F 10 9.5 … 5`, cabecera `rpe`, compartir `@9` / `RPE 9`); la etiqueta `@ RIR · F` sale del ajuste, no se teclea | "poder seleccionar el intensificador, porque… yo utilizo el RIR, pero… mi amigo utiliza el RPE" |
| 2026-09-24 | **Historial por ejercicio, como las notas de su amigo** (v274): desde Progreso eliges un ejercicio y ves su bitácora numerada `#1 #2 #3…` con **la más nueva arriba**: fecha, día del split, gym y cada serie (peso, reps e intensidad en la escala de esa sesión); encima, su gráfica (e1RM · peso top · volumen) **en la unidad real** del ejercicio, sin drops, y en máquina solo con el gym de la última vez. **Un ejercicio es una sola historia** aunque lo hagas en varios días del split (sus calf rises de 3 días = una); uni ≠ bi. También se abre desde //RECORDS, //STRENGTH, el catálogo, el perfil del ejercicio, el nombre en el entreno y el historial | "irme a progreso, seleccionar el ejercicio y… ver… un enlistado de… la fecha de la sesión… peso, número de repeticiones e intensidad, y… una gráfica de progreso respecto a ese ejercicio… como… las notas" (las de su amigo: `#1`, `#2`, `#3`… con fecha y series) |
| 2026-09-24 | **Suplementos con marca, frasco y aviso** (v275): cada suplemento sigue siendo **el genérico** (`omega-3`: sus tomas, su historial y lo que se cruza con tu rendimiento no se parten) y encima lleva su **marca/producto** y su **frasco** (presentación, cuántas por toma, cuántas trae, cuándo lo abriste). **Lo que queda se calcula** con tus tomas (tomada o tarde; la saltada no gasta) y se corrige a mano; **avisa una semana antes** de que se acabe (`⚠ quedan 10 softgels · ~5 d`, `⚠ se acabó`; el color solo en el `⚠`, B-07) en el stack, en su celda de //SUPPS y con un aviso una vez al día. **Pausar o archivar** con su motivo (`se acabó` · `no lo encontré`): sale de hoy pero conserva sus tomas y la nutrición de sus días, y vuelve con `[reactivar]`; borrar queda al final y se lleva su historial. Agregar otra vez el mismo genérico **lo retoma** (con la misma marca o con otra, o aparte si lo pides); la marca nueva es otro producto con su frasco y la vieja conserva lo suyo para los días de antes; si cambió la presentación, lo que va por toma o la dosis, **se confirma** antes de guardar | su encargo del 24-sep: la marca/producto, "cuántas pastillas… por porción" (ej. 2), la frecuencia, "cuántas… trae el frasco", que avise "una semana antes de que se acabe", archivar / pausar / "no lo encontré", y si vuelve con otra marca, confirmar si cambió la dosis o la presentación |

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
terminal (`▖▘▝▗` y `[█░]`), que dejan de estar pendientes. **Decididas y enviadas el 24-sep** (§9, v269): el campo a 14,
la cámara de video con su punto rojo, `rest` ≠ `skip`, //PROGRESS editable como widgets, la invitación de suplementos y
la unidad del peso corporal aparte. **Siguen abiertas:** set de íconos TRK (la nav ya no los usa: share y camera existen
dibujados a viewBox 16 / trazo 1.4, falta el escáner y llevar las tres a la rejilla 24 / trazo 1.6), tarjetas →
paneles (por ahora solo bajaron a radio 4), `[‹ origen]` (hoy `[‹ back]` de texto que siempre vuelve a gym), interlineado
y opacidad a la escala, **los glifos ✓ ○ ⠿ ↩ no existen en JetBrains Mono** (salen con la fuente del sistema; el `⠿` de
//PROGRESS editable también): reemplazarlos o aceptarlos, y el idioma de los botones de acción, que la barra del modo
editar de //PROGRESS ya no mezcla idiomas: `[+ add] [cancel] ✓ done` y en gym `rest today ✓ [undo rest] [skip day]` (resuelto el 24-sep).
