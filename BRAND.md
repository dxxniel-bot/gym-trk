# gym//TRK — BRAND (léelo primero)

> La identidad de gym//TRK en una página. Manda sobre todo lo demás: si `DESIGN_SYSTEM.md` (la referencia), una skill
> o una propuesta choca con esto, **gana este archivo** y el choque se anota como pregunta para el dueño.
> Sin historia ni versiones aquí: eso vive en `DESIGN_CHANGELOG.md` (nunca se implementa desde ahí).
> Última decisión registrada: 2026-09-21.

## 1. Qué es

**gym//TRK es un registro de entrenamiento escrito como una sesión de terminal, dentro de un chrome de vidrio moderno.**
El **contenido** es terminal: texto monoespaciado sobre `#000`, en líneas y columnas, jerarquía por opacidad, acciones
`[verbo]`, color solo cuando dice algo. El **chrome** es vidrio: lo que flota (nav, sheets, toasts, popovers) es
translúcido, con blur y radio chico. Nunca al revés: el vidrio no entra al contenido y el contenido no flota.

Nombre corto de la identidad: **CMD hacker × glass moderno**.

Qué **no** es: verde matrix, scanlines, glitch, typewriter en el contenido, neón, prompts falsos (`root@`), tiles tipo
Apple Health, SaaS genérico, wellness pastel, gamificación de casino (confeti, XP, mascotas).

## 2. Reglas (IDs estables — se citan en cada cambio)

| ID | Regla |
|---|---|
| **B-01** | **Dos capas.** Contenido plano sobre `#000` (terminal). Chrome flotante de vidrio (nav, sheet, toast, popover). `backdrop-filter` solo en chrome. |
| **B-02** | **Texto primero.** Todo dato se puede escribir con caracteres; la gráfica existe solo cuando el texto no alcanza. |
| **B-03** | **Una línea por registro.** El átomo es la fila de referencia del dueño: `#chest  bench press  160lbs×8@0 / 160lbs×6@0`. Toda lista nueva se diseña primero así. |
| **B-04** | **Jerarquía = opacidad > tamaño > peso.** Escala única 10·12·16·22·34 (también en SVG). JetBrains Mono, única familia. |
| **B-05** | **Formas por capa.** Contenido: 0 en reglas, 2 px en cajas (inputs, tabla, primario, paneles). Chrome flotante: `--r-float`. 50 % solo en puntos. Sin píldoras (999) ni tarjetas de 12/16/22 en el contenido. |
| **B-06** | **Dos tipos de acción.** `[verbo objeto]` para lo puntual. **Un solo primario por vista** (bloque gym//TRK, §4). Fila que termina en `›` para navegar. Nada más. |
| **B-07** | **Color reduccionista.** La paleta es la opacidad del blanco. El color semántico va en el **glifo o el número**, nunca en una frase entera. ≤3 marcas de color sobre el pliegue. Si está en orden, no lleva color. |
| **B-08** | **Íconos TRK.** Palabra > glifo del set (§3) > ícono TRK (SVG propio, §4). **Emoji de interfaz: 0.** Lo que el dueño escribe (🥀 en un nombre) se muestra tal cual. |
| **B-09** | **Movimiento: el contenido imprime, el chrome se desliza.** El contenido cambia al instante o con opacidad + ≤4 px. Solo el chrome se mueve como vidrio. Un movimiento visible por toque. Reduced-motion = instantáneo. |
| **B-10** | **Menos detalle.** Una idea una vez. Sin instrucciones impresas (van al glosario `data-gloss`). ≤4 secciones sobre el pliegue. |
| **B-11** | **Hecho para la serie.** Una mano, toque ≥44×44, lo que necesitas ahora es lo más grande. Texto nunca por debajo de `--o40`. |
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

- **Nav — "glass terminal bar".** Cápsula flotante de vidrio (blur, borde .5 px, sin sombra blanda) con radio
  `--r-float`; dentro, pestañas de **texto** siempre visibles (`progress  gym  macros`); la activa en bloque inverso
  de 2 px o entre `[ ]`. Alto ≥44. Sin animar layout.
- **Primario gym//TRK.** Bloque de 2 px, 48 px de alto, texto de comando en minúsculas con glifo (`▶ resume workout`,
  `✓ save session`), 12/800. Uno por vista. Presionado = invertir. (Variante sólida inversa o vidrio + borde; se elige
  en el lab.)
- **Anillo de kcal.** Se queda (única gráfica circular de la app, solo en macros). Sin tarjeta de 16 px ni brillo
  recortado; color solo en el arco y en `left/over`.
- **Puntuaciones reduccionistas.** Existen, en mínimo: `recovery ~43` en una línea 12/800 sin héroe ni color de
  veredicto; `~ retention 62 · Na:K 2.1 →` como fila de diagnóstico que solo aparece si se sale de rango.
- **Íconos TRK.** SVG propio: rejilla 24, trazo 1.6, remates cuadrados, geometría ortogonal de consola,
  `currentColor`. Piezas: share, camera (marca de la serie grabada, reemplaza al emoji 📷), las 3 de la nav, escáner.
  Un ícono nuevo necesita aprobación del dueño.
- **Arranque.** Shader WebGL de marca (única excepción de fondo animado): encuadre correcto (sin comprimir), apagado con
  reduced-motion y en segundo plano. Las líneas de estado se imprimen una a una.

## 5. Siete primitivos (todo se arma con esto)

```
u/unlxvd ▾          21 sep · 21:29          streak: 12        ← línea de prompt (barra de estado)
//STIMULUS                          effective sets · 7 d     ← //cabecera + meta a la derecha
peso ······························ 61 kg  ▼ −0.4           ← clave ···· valor
#chest  bench press  160lbs×8@0 / 160lbs×6@0                 ← línea de registro
[+ set]  [↓ drop set]  [share]                               ← [comando]
 1  FS  [ 60   ] lbs [10] [2]  ✓                             ← rejilla de datos (cajas de 2 px)
▮▮▮▮▮▮▮▯▯▯  72%                                              ← medidor
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
`backdrop-filter` fuera del chrome = 0 · radios >2 px en el contenido = 0 · primarios por vista ≤1 · marcas de color
sobre el pliegue ≤3 · emoji de interfaz = 0 · glifos fuera de `GLYPHS` = 0 · tamaños fuera de la escala (incluido SVG)
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

## 10. Preguntas abiertas (se cierran en el estudio, `tools/studio.html`)

Desde el 22-sep el dueño las ve **aplicadas a la app real** en el estudio (vista previa de cada pantalla con sus datos o con
demo, en solo lectura) y guarda sus combinaciones como "looks" para dejarlas reposar antes de mandarlas; lo que manda a
revisión llega como "hoja de elección" y cada respuesta se registra en §9 con fecha y cita. `tools/brand-lab.html` queda
como lámina histórica.

Variante de nav (cápsula 999 vs `--r-float`; activa inversa vs corchetes) · variante de primario (sólido vs vidrio) ·
valor de `--r-float` (8 vs 12) · panel del anillo (plano vs vidrio sutil) · set de íconos TRK · shader corregido vs
candidatos de 21st.dev · borde de campo editable para contraste WCAG 1.4.11.
