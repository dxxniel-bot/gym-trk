# gym//TRK — DESIGN SYSTEM (referencia del estado actual)

> Referencia del estado actual (v263). **Lee BRAND.md primero**: manda sobre este archivo. Sin historia: DESIGN_CHANGELOG.md.

---

## 1. Cómo usar esta referencia

**Qué es cada archivo.**
- `BRAND.md` dice **qué es** gym//TRK: la identidad "CMD hacker × glass moderno", las reglas B-01…B-12, el vocabulario,
  las excepciones con nombre, lo prohibido y el registro de decisiones del dueño. Si algo de aquí choca con BRAND, gana
  BRAND y el choque se anota como pregunta para el dueño.
- **Este archivo** dice **cómo está hecho hoy** (v262) y a qué se tiene que acercar: tokens, roles, fichas de componente,
  patrones, auditoría y protocolo. No guarda historia.
- `DESIGN_CHANGELOG.md` guarda la historia (fases DS/R/UX-2, notas vNNN, diseños retirados o rechazados). **Nunca se
  implementa desde ahí.**

**Orden de lectura para construir algo** (personas o agentes): BRAND → §17.2 esqueleto de pantalla → §17.3 árbol de
acciones → la ficha del componente (§7) → tokens (§4) → §17.6 definición de terminado.

**Convenciones.**
- **Hoy** = lo que hace el código de v262. **Objetivo G4 / G3 / G4** = lo que falta y en qué fase de la ruta (plan G:
  G2 datos y sistema sin cambiar el look · G0 láminas para elegir · G3 identidad aprobada · G4 completitud). Nada marcado
  como objetivo está implementado.
- Un nombre entre comillas invertidas (clase, token, función, selector) **existe en `index.html`**. Lo que todavía no
  existe lleva al lado "(pendiente G3)" o "(pendiente G4)".
- Las reglas tienen un ID estable (`TOK-3`, `ACT-2`…) para citarlas en cada cambio, junto a las B-xx de BRAND. Cada una
  dice **la revisa:** `ds-audit R-xx` (estático), `_dsRenderCheck` (en pantalla, `?selftest=1`), un self-check, o *a ojo*.
- Medidas: los tamaños de letra van siempre por token (`--t-*`, escala 10·12·18·24·34 desde v262). En las fichas de §7 las medidas
  de caja se escriben sin unidad (son px CSS) para no confundirlas con tamaños de letra.

**Regla de oro.** *No diseñes cada pantalla: diseña el sistema y usa el sistema para construir cada pantalla.* Si una
implementación necesita un valor que no existe aquí, primero se decide si es una necesidad funcional nueva (se agrega al
sistema, documentada, en el mismo commit) o una desviación (se corrige).

**Preguntas abiertas** (no se deciden aquí; se cierran con el dueño en el estudio, `tools/studio.html`, G0): las de
BRAND §10 (variante de nav, variante de primario, set de íconos TRK; el 22-sep el look "1" cerró `--r-float` = 12, panel
del anillo de vidrio sutil, shader de fósforo y borde de campo 1 px `--o40`) y estas, encontradas al escribir la referencia:
1. **Glifos en uso que BRAND no menciona:** ⬆ ⬇ ↔ (perfil de resistencia), ▦ (rango personalizado), ▢ ▣ (elegir en el
   catálogo), ↻ ↺ (reintentar, recuperado, última vez), ↑ (flojas, ánimo), ⋯ (menú de fila del catálogo). §11.3.
2. **Idioma de los botones de sheet** (`guardar`, `cancelar`, `borrar`): ¿son "verbos de comando" (inglés) o prosa
   (español)? §6.2.
3. **Movimiento de contenido que hoy pasa de 4** (reacomodo FLIP de TRKRow, barras que crecen, el ✓ con rebote): ¿se
   quedan como continuidad o se vuelven instantáneos por B-09? §10.
4. **La vista `la serie` de compartir un ejercicio** usa `--t-hero`: ¿choca con "nada de números gigantes" (BRAND §7)?
   §7.19.

---

## 2. Principios operativos

Lo que BRAND pide, dicho como reglas de trabajo.

| ID | Regla | La revisa |
|---|---|---|
| PRI-1 | **Instrumento, no decoración.** Cada elemento visible tiene una función; si se puede quitar sin perder dato ni acción, sobra (BRAND B-10). | a ojo · prueba de 5 s (BRAND §8) |
| PRI-2 | **Dato primero.** Jerarquía = opacidad > tamaño > peso (B-04), luego espacio y alineación. El color y el ícono acompañan: *dato > tipografía > glifo > ícono*. | ds-audit (escala, pesos) · a ojo |
| PRI-3 | **Honestidad.** La interfaz nunca finge saber más de lo que sabe (§9). | self-checks del motor · a ojo |
| PRI-4 | **Denso ≠ amontonado.** La densidad sale de tipografía, columnas y alineación, no de pegar cosas (presupuesto §5.3). | a ojo · capturas |
| PRI-5 | **Color = estado.** Si un color no dice bien/mal/atención/déficit, no va. Si está en orden, no lleva color (B-07). | R-SEM · `_dsRenderCheck` (conteo de color, G1) |
| PRI-6 | **Excepción funcional, nunca estética.** Toda excepción tiene id y razón (§15, BRAND §6). | R-EXEMPT |
| PRI-7 | **Evolución con decisión.** Lo que cambia el look (radios, color, nav, anillo, idioma, íconos) solo se hace con una decisión del dueño registrada en BRAND §9. Lo demás se corrige hacia el sistema sin preguntar. | revisión del commit |
| PRI-8 | **Sus etiquetas son sagradas** (B-12): músculos, ejercicios, comidas y splits exactamente como él los escribió; lo canónico es interno. | self-checks (`_muscleSelfCheck`) · a ojo |
| PRI-9 | **Un componente, una versión.** Los nombres de clase se conservan (cambiarlos rompe todo); una variante es un **modificador**, nunca una clase paralela; un comportamiento transversal vive en su componente `TRK*` (§7.18) y ninguna pantalla hace el suyo. | ds-audit (selectores repetidos) · revisión |

---

## 3. Gramática CMD: los siete primitivos en el código

BRAND §5 define los siete primitivos con los que se arma toda pantalla. Aquí, con qué están hechos hoy.

| Primitivo (BRAND §5) | Hoy en el código | Notas |
|---|---|---|
| **Línea de prompt** (barra de estado) `u/unlxvd ▾ · 21 sep · 21:29 · streak: 12` | `statusBar()` → `.status` (`.uname`, `.center`, `.streak`, `.sgoal`) | el reloj no avanza y duplica el de iOS (M6-20, objetivo G4: quitarlo) |
| **`//cabecera` + meta a la derecha** | `.section` (`.h` con `<span class="s">//</span>`, `.meta`) · cabecera del día `dayHeadHTML()` → `.whdr` · rótulo de grupo `.grp-label` · TRKLog `.lhd` | un `//` por sección; la meta es 10 |
| **`clave ···· valor`** | `.line` (`.k` · `.dots` · `.v`) y su variante de detalle `.mdline` | la firma de lectura; §7.5 |
| **Línea de registro** `#chest  bench press  160lbs×8@0 / 160lbs×6@0` | `.srw` (compartir sesión) | objetivo G4: también en historial y vista previa del día (M3-04, M1-18) |
| **`[comando]`** | `.addbtn`, `.ctrls a`, `.section .meta`, `.fa-acts a`, `.mdacts a` | toque 44 con `.u-hit` (pendiente G4) |
| **Rejilla de datos** (cajas de 2) | tabla de sesión: `.thead`, `.srow`, `.pair`, `.inp`, `.pick`, `.fs` | la superficie de referencia de B-05 |
| **Medidor** `▮▮▮▮▮▮▮▯▯▯ 72%` | hoy no existe como texto; lo más cercano son las barras finas `.bar`/`.vbar`/`.wprog` | objetivo G3/G4: decidir una sola forma de medidor por uso |

**Tres sigilos** (BRAND §3): `//` sistema · `[ ]` acción · `#` etiqueta del dueño (tenue). En el código: `.s` pinta el
`//` en `--o40`/`--o50`; `#` aparece en `.srm` (compartir) y en el log de comidas.

**Box-drawing** (`─ │ ┌ ┐`): permitido solo en overlays y compartir (BRAND §3). Hoy no se usa en la interfaz.

---

## 4. Tokens

Todo valor visual recurrente es un token en `:root` y se usa con `var(--…)`. **Nunca** se escribe un literal si existe su
token (TOK-1, la revisa: ds-audit "literales"). Valores leídos de `index.html` (v262).

### 4.1 Superficies

| Token | Valor | Rol |
|---|---|---|
| `--bg`, `--frame` | `#000` | lienzo de toda la app |
| `--card` | `#0d0d10` | tarjeta y campo de formulario (≈1.08:1 sobre `#000`: casi no se ve) |
| `--card2` | `#16161c` | superficie elevada: popover, chip, fantasma de arrastre, fallback de la nav |
| `--sheet-bg` | `#0a0a0c` | fallback sólido de sheets y toasts de vidrio |
| `--track` | `#191920` | pista de barras, día vacío del calendario, fase sin clasificar |
| `--faint` | `#3a3a3e` | glifo casi apagado (`.chev`, `.ghead .hash`); legado, no se usa en nuevo |
| `--fill` / `--on-fill` | `#f3f3f4` / `#000` | relleno del primario y de lo seleccionado / texto sobre él |

TOK-2: no hay grises nuevos. Si alguien necesita otro, la pregunta es "¿por qué no es `--card` o `--card2`?".

### 4.2 Texto por opacidad

Todos son `rgba(243,243,244,α)`. **Los nombres son históricos y no son su alfa** (`--o40` = .50); se documentan así y no
se renombran. Contraste calculado sobre `#000`.

| Token | α | Contraste | Rol |
|---|---|---|---|
| `--fg` | 1 | 18.9:1 | valor primario, título, número principal |
| `--o70` | .74 | 10.1:1 | secundario fuerte (texto de alimentos, acción de diagnóstico) |
| `--o60` | .66 | 8.1:1 | secundario, `[acción]`, clave de `.line` |
| `--o50` | .56 | 5.9:1 | rótulo, meta de sección, `//` |
| `--o40` | .50 | 4.9:1 | meta, caption, `.submeta` — **piso del texto** (B-11) |
| `--o35` | .46 | 4.2:1 | solo glifos y deshabilitado (hoy también texto: objetivo G4) |
| `--o30` | .40 | 3.4:1 | solo glifos, placeholder y deshabilitado (hoy también texto: objetivo G4) |
| `--o20` | .26 | 2.0:1 | borde de dato denso, ícono apagado |
| `--o12` | .10 | 1.2:1 | separador fuerte, borde superior de barras acopladas, fondo activo de la nav |
| `--o10` | .06 | 1.1:1 | separador de lista, fondo de fila abierta o presionada |
| `--line` / `--border` | .08 / .09 | 1.1 / 1.2:1 | divisoria de contenido / borde de tarjeta y control |

- TOK-3: **prohibido crear escalones nuevos** (no existen `--o15`, `--o25`, `--o55`). Hoy queda un literal
  `rgba(243,243,244,.035)` en la agenda (código muerto). La revisa: ds-audit (colores literales), R-OP.
- TOK-4: **texto nunca por debajo de `--o40`** (B-11). `--o35`/`--o30` solo para glifos, placeholder y deshabilitado.
  Hoy hay texto en `--o35`/`--o30` (`~ sugerido`, `pocos datos`, días de la semana del calendario, `[+ nota]`, filas no
  elegidas de la rueda): objetivo G4 (T-04). La revisa: `_dsRenderCheck` txt · R-TXT.
- Bordes y WCAG 1.4.11 (contraste de lo que no es texto, ≥3:1): `--border` 1.2:1, `--o20` 2.0:1, `--o10` 1.1:1 no llegan.
  Es pregunta abierta de BRAND §10 (borde de campo editable); no se cambia sin su decisión.

### 4.3 Semánticos

| Token | Valor | Contraste | Significa | Nunca |
|---|---|---|---|---|
| `--good` | `#46c98b` | 10.0:1 | evento bueno: ▲, PR, meta cumplida | estado estable ("fresco", "verificado", "tomado"), adorno, badges |
| `--bad` | `#e5675c` | 6.4:1 | baja, sobre el límite, destructivo | decoración, láser, "cerrar" que guarda |
| `--warn` | `#e3b34f` | 10.8:1 | atención, límite suave (cerca de MRV) | categoría neutral |
| `--info` | `#6aa6ff` | 8.5:1 | **solo** déficit calórico | cualquier otro uso |
| `--abort` | `rgba(190,110,110,.55)` | — | borde del botón `abort` del footer de sesión | cualquier otro uso. Objetivo G3: se retira (`[abort]` en `--o60` que pasa a `--bad` al sostener) |
| `--good-glow` / `--bad-glow` | `rgba(70,201,139,.5)` / `rgba(229,103,92,.5)` | — | brillo del anillo de macros | se retiran con el brillo (objetivo G3, BRAND §4) |

- TOK-5: el color semántico va **en el glifo o el número**, nunca en una frase entera, y siempre con otra señal (▲▼,
  palabra, glifo): nunca rojo/verde solo (B-07). La revisa: R-SEM · a ojo.
- TOK-6: **≤3 marcas de color sobre el pliegue** (B-07). La revisa: prueba de 5 s (BRAND §8).
- Hoy se rompe "si está en orden, no lleva color": 'fresco' en `--good` (`recStateCol()`), ✓ verde de "verificado" en
  resultados de comida, ✓ verde de "tomado" en supps (`.lc.on .k`), ✓ verde en stack, marca MRV en `--warn` fija
  (`.vbar .mrv`), días del recap y del wrap en verde. Objetivo G3 (verde solo en eventos; 'fresco' en `--o50` con glifo).

### 4.4 Tipografía

- **Familia única:** JetBrains Mono (Google Fonts), fallback `ui-monospace, Menlo, monospace` (B-04). Fuentes nuevas:
  prohibidas.
- **Escala única (TYP-1, v262 — look "1" del dueño):** `--t-label` 10 · `--t-data` 12 · `--t-section` **18** · `--t-display`
  **24** · `--t-hero` 34. `--t-section` es también el tamaño de los campos (≥16 = sin zoom de iOS); el auditor y
  `_dsRenderCheck` leen la escala de `:root`.
  Cualquier otro tamaño está prohibido, **también en SVG**. Exentos solo con id (§15): wrap 60/44, escáner 40, panel
  `?design=1`. Hoy la escala en uso es 10×151 · 12×100 · 16×47 · 22×13 · 34×4 reglas; el radar de macros todavía escribe
  `font-size="7.5"` en su SVG (objetivo G4, M4-11). La revisa: ds-audit (escala, tokens viejos) · R-SVGFS ·
  `_dsRenderCheck` fsOff.
- **Pesos (TYP-2):** 400 texto · 700 énfasis, números, botones y chips · 800 títulos, `//SECCIÓN`, nombre del
  ejercicio, valores display. **600 prohibido** (no se carga; el navegador lo pinta como 700). Desde v260 la URL de la
  fuente solo carga 400 · 700 · 800 (300 y 500 no se usaban). La revisa: R-FONT.
- **Mínimos (TYP-3):** texto ≥10 siempre. **800 nunca por debajo de 12.** 700 a 10 solo en estado semántico (▲▼ %, PR,
  sobre MRV). Campos que abren teclado o picker a 16 (anti-zoom de iOS), salvo la tabla de sesión (`table36`). La revisa:
  ds-audit (peso 800 bajo 12, campos por debajo de 16).
- **Tracking (TYP-4), 4 roles por token:** `--ls-caps` .2em (rótulos en MAYÚSCULAS a 10) · `--ls-title` .12em (títulos
  en mayúsculas; hoy también `.sheet h3` y `.sph .h`) · `--ls-num` −.03em (números de 22 y 34) · `--ls-ui` .03em (botones,
  controles y meta de interfaz) · 0 por defecto. Un rol = un valor. Hoy queda un tracking fuera de rol (`.14em` en
  `.supps .spdots`, CSS muerto) y los exentos de wrap/boot/anillo. La revisa: ds-audit (letter-spacing fuera de rol).
- **Interlineado (TYP-5, v260):** cuatro tokens con el valor que ya tenían sus sitios: `--lh-tight` 1 (números grandes y
  glifos, 20 sitios) · `--lh-ui` 1.2 (interfaz, 9) · `--lh-read` 1.4 (lectura, 6) · `--lh-share` 1.6 (compartir, 3; lo
  decidió el dueño en v257). Quedan literales 1.05, 1.1, 1.25, 1.3, 1.35, 1.5, 1.55 y 1.8 (12 sitios): ajustarlos a los
  tokens cambia el look, así que es una **propuesta del estudio**, no una limpieza. Las alturas fijas de línea que centran
  controles son geometría (no token). La revisa: R-LH.

### 4.5 Roles: tamaño × peso × tracking × interlineado

Tabla cerrada: un componente nuevo **elige su fila, no un tamaño** (TYP-6). La revisa: ds-audit (rol con token fuera de
tabla) · a ojo.

| Rol | Tamaño | Peso | Tracking | Interlineado | Ejemplos hoy |
|---|---|---|---|---|---|
| Héroe | `--t-hero` | 800 | `--ls-num` | tight | `.mdval` (valor del detalle de métrica), marca del landing. Nada más |
| Display | `--t-display` | 800 | `--ls-num` | tight | `.whdr .wname` (nombre del día), `.pval`, `.ring.lg .num`, `.shsn`, `.msum-tot b`, `.exbn` |
| Sección / título | `--t-section` | 800 | 0 (`--ls-title` si va en mayúsculas) | ui | `.section .h`, `.sheet h3`, `.lt .h`, `.mnm`, `.mkc` (total de comida), `.exhead .n`, `.wline .wtn`, `.dnlbl`, `.shtt` |
| Campo | `--t-section` | 400 / 700 | 0 | — | `.field input`, `#fa_q`, `textarea.ta`, `.slph input`, `.tselo` |
| Glifo de control | `--t-section` | 400 | 0 | tight | `.dchk`, `.pairdone`, `.dnav`, `.lx`, `.mchev`, `.footer .undo`, `.exmore` |
| Fila / dato | `--t-data` | 400 (valor 700/800) | 0 | ui; lectura en compartir | `.line`, `.mit`, `.lc`, `.trow`, `.srw`, `.stq`, `.inp`, `.pick` |
| Acción: botón, chip, tab | `--t-data` | 700 | `--ls-ui` | centrado por alto | `.start` = `.footer .save` = `.lact` = `.toggles button` = `.mdtabs span`; `.secondary .b` y `.sheetbtns .cancel` van a 400 |
| Etiqueta, meta, ayuda, vacío | `--t-label` | 400 | `--ls-caps` en MAYÚSCULAS · `--ls-ui` en meta de interfaz · 0 | ui | `.grp-label`, `.whdr .wlbl`, `.submeta`, `.empty`, `.wmeta`, `.thead .cl`, `.setn`, `.exsub .note` |
| Estado semántico | `--t-label` | 700 | `--ls-caps` si es sigla | — | `.lpr` (PR), `.pst`, `.setprog`, `.vst` |

- El total de una comida **siempre** manda sobre sus alimentos: 16/800 contra 12/400 (decisión del dueño, v256).
- Las flechas `‹ ›` nunca pesan más que el dato que mueven.
- Tamaños por pantalla (hoy): gym {10,12,16,22} · sesión {10,12,16} · macros {10,12,16,22} · progreso {10,12,16,22,34 en
  el detalle} · ajustes {10,12,16} · compartir {10,12,16,22}.

### 4.6 Espaciado y ritmo

| Token | Valor | Uso |
|---|---|---|
| `--s1` | 2 | ajuste óptico |
| `--s2` | 4 | micro: entre glifos, entre línea y sublínea |
| `--s3` | 8 | interno de componente |
| `--s4` | 12 | control, fila |
| `--s5` | 16 | estándar entre bloques |
| `--s6` | 24 | separación mayor |
| `--s7` | 32 | entre secciones grandes |
| `--s8` | 48 | nivel pantalla |

**Ritmo de página** (perillas que afinó el dueño en `?design=1`; no se cambian sin él): `--sp-py` 22 · `--sp-px` 18
(gutter horizontal) · `--sp-card` 15 · `--sp-gap` 12 · `--sp-section` 14 · `--sp-field` 12 · `--sp-row` 12 ·
`--sp-sheet` 18. Tokens locales de componente: `--mcol` (columna de acciones de TRKLog) y `--hdot` (punto del rail del
historial).

- SPC-1: lo interno de un componente usa `--s*`, con **6 y 10 como medios pasos** de componente; el ritmo de página usa
  `--sp-*`; nada de 3/5/7/9/11/13/15. La revisa: ds-audit (espaciado fuera de escala: hoy 0; 471 por token / 7 literales).
- SPC-2: los márgenes **negativos que centran un punto** (el del scrub, el "hoy" del calendario) son geometría: se calculan
  de su tamaño y llevan id `geom` (§15).
- SPC-3: **todo borde horizontal de contenido = `--sp-px`** (página, barras, nav, sheets). Solo los overlays de pantalla
  completa se salen. La revisa: a ojo · capturas.

### 4.7 Radios

| Token | Valor | Hoy se usa en |
|---|---|---|
| `--r-sm` | 2 | tabla de sesión (`.inp`, `.pick`, `.fs`, `.bwchip`), opciones de TRKSelect, hora del desglose, indicadores |
| `--r-mark` | 4 | marcas de gráfica: días del calendario, hipnograma |
| `--r-ctl` | 12 | botones, campos de formulario, toggles, `.lact`, popovers (`.tsel`, `.gloss`), `.savebar` |
| `--radius` | 16 | tarjetas `.card`, `.grp`, `.ptile`, `.pthrow`, `.hcal`, `.ws-card` |
| `--r-float` | 12 | **todo lo que flota** (v262, look "1"): nav y sus pestañas (−6), sheet (`--r-sheet`), toast, popovers (`.tsel`, `.gloss`), `.savebar`, fantasma de arrastre |
| `--r-sheet` | `var(--r-float)` | esquinas inferiores del sheet |
| `--r-pill` | 999 | nav y sus pestañas, toast, chips (`.chip`, `.ag-chip`), etiqueta de scrub, fantasma de arrastre, barras finas |
| `50%` | — | puntos, thumbs, spinners, `.dots3`, punto del rail |

- RAD-1 (hoy): prohibidos 3/6/8/9/10/14 y los literales `999px`/`2px`/`16px` (van por token). La revisa: ds-audit (radios
  fuera de escala: hoy 0).
- RAD-2 (**objetivo G3**, B-05, decisión del dueño 2026-09-21 "mixto con regla"): contenido 0 en reglas y 2 en cajas
  (campos, tabla, primario, paneles); chrome flotante (nav, sheet, toast, popover) con `--r-float` = 12 (hecho en v262); 50% solo en puntos; **fuera del contenido** `--radius`, `--r-ctl` en controles de contenido, `--r-sheet` y
  `--r-pill` (tarjetas, chips, barras redondeadas y la cápsula de la nav se rehacen). La revisa: R-RAD.

### 4.8 Bordes, sombras y efectos

- BRD-1 **Dualidad de bordes (intencional, no unificar):** 1 `--border` en formularios, tarjetas y controles · .5 `--o20`
  en datos densos (tabla de sesión) · .5 `--o10` como separador de lista · **2 solo como indicador** (posición de soltar al
  arrastrar, pestaña activa, marco del escáner). Sin 1.5. Punteado = sugerido sin confirmar (§9) o líder de `.line`. Hoy:
  1×56, .5×43, 2×4 reglas. La revisa: ds-audit (bordes).
- BRD-2 **Sombras:** solo `--glass-shadow` (chrome de vidrio) y `--shadow-float` (lo que flota sobre contenido: popover,
  fantasma de arrastre, `.savebar`, panel de diseño, marco de escritorio). Un anillo `0 0 0 Npx` (contorno de "hoy", halo
  del scrub, velo del escáner) y un `inset` (bordes del vidrio) son **bordes dibujados**, no sombras. La revisa: ds-audit
  (sombras fuera de token: hoy 0).
- BRD-3 **Sin gradientes CSS.** El único gradiente es el relleno tenue bajo la línea de las tiles (SVG, ≤.16 α).
- BRD-4 **Sin brillo.** Hoy queda el `drop-shadow` del anillo de macros (`.hero.good .ring-fill` y `.cell.good`/`.over`),
  que además se corta en cuadrado: objetivo G3 quitarlo (BRAND §4).

### 4.9 Opacidades de estado

Tokens (TOK-7, v260): `--op-press` .7 (5 `:active`) · `--op-disabled` .4 · `--op-pf` .45 (prefill) · `--op-drop` .82
(serie drop) · `--op-dim` .28 (ejercicio no activo en modo enfoque). Siguen literales (10): tile presionada `.85`,
presionado `.6` de la agenda, `.5` de `.fa-em-step.off`/`.u-dim`, arrastre `.3`, relleno del hold `.22`, sugerido `.75`,
`.vbar .mrv` `.7` y dos de keyframes; mapearlos a los tokens cambia el look (propuesta del estudio). La revisa: R-OP.

### 4.10 Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--dur-1` | 120ms | tap, presionado, pop del ✓ |
| `--dur-2` | 180ms | filas, pestañas, barras, salida de sheets y scrim |
| `--dur-3` | 280ms | entrada de sheets, toast, conteo de números |
| `--dur-screen` | 140ms | cambio de pantalla (`viewin`) |
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | entradas y transformaciones, sin overshoot |
| `--ease-in` | `cubic-bezier(.4,0,1,1)` | salidas |
| `--toast-life` / `--toast-life-err` | 2.3s / 4.6s | vida del toast (el de error o con deshacer, el doble) |

- MOV-T1: ninguna duración literal en el CSS salvo los bucles con id (§15). En JS se leen con `durMs()`, que respeta la
  unidad (el hold lee `--dur-hold` desde v260). Hoy quedan literales en JS: 1300/5000 del arranque y el recap, 190/200 de salidas, 430 del
  escáner, 1600 del scrub, y el easing del rebote del escáner.
- v260: `--mv-1` 4px (desplazamiento máximo del contenido en `rowin`, `mdslide` y `viewin`, B-09) · `--ease-step`
  `step-end` (los 3 bucles de terminal) · `--dur-hold` 900ms (TRKHold).

### 4.11 Capas (z)

| Token | Valor | Quién vive ahí hoy |
|---|---|---|
| `--z-float` | 20 | `.dragghost` (fantasma de arrastre) |
| `--z-nav` | 30 | `.nav` |
| `--z-modal` | 40 | `.modal`: scrim + sheet (**tapa la nav**) |
| `--z-pop` | 50 | capa de decisión `.modal.asklayer` (TRKAsk, TRKHold, TRKWheel, TRKMenu) · popovers `.tsel` y `.gloss` |
| `--z-overlay` | 60 | `.bootov` (arranque, recap, wrap) · `.exsh` (compartir un ejercicio) |
| `--z-toast` | 80 | `.toasts` · `.savebar` (aviso permanente de guardado fallido) |
| `--z-dev` | 90 | `.dz` (panel `?design=1`) |

- Z-1: todo z-index va por token; los únicos locales son `.mdtabs span` (1, sobre su indicador), el lienzo del shader (−1
  dentro del overlay) y la agenda (código muerto).
- Z-2 (objetivo G4, M6-38): una pregunta de recuperación de datos (TRKAsk, `--z-pop`) puede quedar tapada por el arranque
  (`--z-overlay`). Prioridad: seguridad de datos > arranque > wrap > recap.
- Scrim: `--scrim` `rgba(0,0,0,.6)` en `.modal` (v260).

### 4.12 Vidrio (solo chrome)

`--glass-bg` `rgba(14,14,17,.55)` · `--glass-bg-strong` .72 · `--glass-blur` 18px · `--glass-sat` 1.7 · `--glass-edge`
.14 · `--glass-edge-lo` .06 · `--glass-ring` .10 · `--glass-shadow` `0 8px 30px rgba(0,0,0,.55)`.

- GLS-1 (B-01): `backdrop-filter` **solo en chrome** (nav, sheet, toast; popover en G3). Nunca en contenido. La revisa:
  R-BLUR · `_dsRenderCheck` blur.
- GLS-2: **una sola definición.** Las utilidades `.glass` (nav) y `.glass-strong` (sheet, toast, capa de decisión) se
  ponen en el marcado (`<nav class="nav glass">`, `openModal()`, `askLayer()`, `toast()`); el componente no repite blur,
  fondo, borde ni sombra. Ajustes por pieza con selector doble (`.sheet.glass-strong`: solo borde inferior porque cuelga de
  arriba).
- GLS-3: fallbacks en las utilidades: sin `backdrop-filter` → sólido; `prefers-reduced-transparency` → sólido sin blur
  (`--card2` en la nav, `--sheet-bg` en sheet y toast).

### 4.13 Tokens exactos de v260 y los que faltan

v260 (fase T del estudio) creó cada token **con el valor de hoy** y solo lo puso donde ya se usaba ese valor: `tools/ds-diff.html`
(que ahora compara también interlineado, grosor y color de bordes, radios por esquina, opacidad, sombra, filtro, trazo y
blur) dio **0 diferencias en 57 escenarios** y `dsSweep` quedó idéntico a la línea base. El estudio (`tools/studio.html`)
los mueve en vivo sin tocar la app; cambian de valor solo por decisión del dueño (BRAND §9).

| Token | Valor hoy | Sitios | Rol |
|---|---|---|---|
| `--lh-tight` · `--lh-ui` · `--lh-read` · `--lh-share` | 1 · 1.2 · 1.4 · 1.6 | 20 · 9 · 6 · 3 | interlineado (§4.1 TYP-5) |
| `--op-press` · `--op-disabled` · `--op-pf` · `--op-drop` · `--op-dim` | .7 · .4 · .45 · .82 · .28 | 5 · 1 · 1 · 2 · 1 | opacidad de estado (§4.9) |
| `--bw-sep` | .5px | 22 | separador de lista (`.hrow`, `.exrow`, `.mdtr`, `.u-sep`…) |
| `--bw-box` | .5px | 15 | caja de dato (`.inp`, `.pick`, `.fs`, `.tselo`, `.chip`…) |
| `--bw-dash` | 1px (v262) | 4 | subrayado punteado (`[data-gloss]`, `.mch`, `.u-dash`) |
| `--bw-leader` | 1px | 2 | guía `····` de `clave ···· valor` (`.line .dots`, `.mddots`) |
| `--bw-field` | 1px | 9 | campo de formulario (`.field input`, `#fa_q`, `textarea.ta`…) |
| `--bw-ctl` | 1px | 17 | control (`button.b/.t/.cancel`, `.lact`, `.toggles button`, `.hold`…) |
| `--bw-card` | 1px | 8 | tarjeta (`.card`, `.grp`, `.ptile`, `.hcal`…; G3 las retira) |
| `--bw-rule` | 1px | 12 | regla (`.rule`, borde de `.footer`/`.restbar`, `.ghead`…) |
| `--bw-chrome` | 1px | 8 | borde del vidrio (`.glass`, `.sheet.glass-strong`, `.tsel`, `.gloss`, `.savebar`…) |
| `--bw-mark` · `--bw-focus` | 2px · 1.5px | 4 · 1 | marca · anillo de foco |
| `--sw-grid` · `--sw-ref` · `--sw-data` · `--sw-data-lg` | .5 · 1 · 1.4 · 1.8 | clases `.sw-*` | trazos de gráficas (lineChart, radar, FC; la regla CSS gana al atributo) |
| `--sw-icon` · `--sw-ring-lg` · `--sw-ring-md` | 1.6 · 1.4 · 1.8 | nav · anillos | trazos de íconos y anillos (la imagen para compartir lee el trazo computado) |
| `--r-nav` · `--r-toast` · `--r-pop` · `--r-bar` | `var(--r-float)` (v262) | 2 · 1 · 2 · 1 | radio por pieza flotante; el auditor resuelve el alias |
| `--scrim` · `--nav-clear` · `--mv-1` · `--ease-step` · `--dur-hold` | `rgba(0,0,0,.6)` · 84px · 4px · `step-end` · 900ms | 1 · 2 · 3 · 3 · JS | fondo de modal · espacio sobre la nav · desplazamiento · bucles · TRKHold |
| `--ring-glow` · `--ring-glow-sm` | retirados en v262 | — | el anillo ya no tiene brillo (look "1") |

Sin token a propósito: los bordes de 1 px de los spinners (`.spin`, `.fa-spin`) y la línea del scrub (`.chsl`), que son
geometría. Falta retirar `--abort` (G3a).

---

## 5. Layout, rejilla en caracteres y densidad

### 5.1 Marco

- LAY-1: marco de referencia **393×852**; en ≤440 de ancho ocupa la pantalla (`.frame`). Se mide también a 375×812.
- LAY-2: el contenido vive en `#view` (`.scroll`), el **único** elemento que hace scroll, con `padding: --sp-py --sp-px`
  y abajo `calc(84 + safe-area)` para librar la nav flotante.
- LAY-3: **un solo eje**: todo el contenido comparte borde izquierdo y derecho (`--sp-px`). Dos pantallas lado a lado se
  ven construidas sobre la misma retícula.
- LAY-4: secciones = `hr.rule` + `.section` (título `//` a la izquierda, meta a la derecha) → contenido. Entre secciones
  `--sp-section`/`--s6`; dentro de una sección `--s3`–`--s4`.
- LAY-5: **barras acopladas** (descanso `#resttimer`, footer `#wfooter`) viven fuera de `#view`, entre el contenido y la
  nav, y sobreviven a `render()`.
- LAY-6: safe areas con `env(safe-area-inset-*)` en nav, sheet, barras y overlays. El toast (`.toasts`) se apoya a
  `calc(84px + env(safe-area-inset-bottom))` (v258); objetivo G4: el token `--nav-clear` (pendiente G4).

### 5.2 Rejilla en caracteres

JetBrains Mono avanza **0.6em** por carácter. Ancho útil a 393 = 393 − 2×18 = **357**.

| Tamaño | Ancho de carácter | Columnas en 357 | Columnas en 339 (375 de pantalla) |
|---|---|---|---|
| 10 | 6.0 | 59 | 56 |
| 12 | 7.2 | **49** | 47 |
| 16 | 9.6 | 37 | 35 |
| 22 | 13.2 | 27 | 25 |
| 34 | 20.4 | 17 | 16 |

El tracking resta columnas: `--ls-ui` a 12 deja 47; `--ls-caps` a 10 deja 44. La línea de referencia del dueño
`#chest  bench press  160lbs×8@0 / 160lbs×6@0` mide 44 caracteres: cabe en una línea a 12. En `.srw` la columna del
músculo ocupa 64 + 8 de separación, así que al cuerpo le quedan unas 39 columnas. **Prueba TTY** (BRAND §8): si una
pantalla no se puede reescribir en esta rejilla sin perder un dato, no es gym//TRK.

### 5.3 Presupuesto de densidad ("menos detalle")

Decisión del dueño 2026-09-21: "se está haciendo muy completa y con muchos detalles" (BRAND §9, B-10).

| ID | Presupuesto | La revisa |
|---|---|---|
| DEN-1 | **≤4 secciones sobre el pliegue** (a 393×852). | a ojo · capturas |
| DEN-2 | **≤3 marcas de color sobre el pliegue.** | prueba de 5 s |
| DEN-3 | **≤3 estilos de texto por bloque** (un estilo = tamaño + peso + opacidad). | a ojo |
| DEN-4 | **Una línea de meta** por bloque. | a ojo |
| DEN-5 | **Una idea una vez**: nada se dice dos veces en la misma pantalla, ni la misma idea con cuatro redacciones en cuatro pantallas. | a ojo |
| DEN-6 | **Sin instrucciones impresas**: las definiciones van al glosario (`data-gloss`), las pistas de gesto se enseñan una vez (`hintSeen()`/`hintMark()`). Hoy: `swipehint` 1 · `ehint` 6 · `submeta` 114 (línea base de ds-audit "texto instructivo"). | ds-audit (texto instructivo) |
| DEN-7 | Lo secundario vive detrás de una fila `›` o de un sheet, no en la pantalla principal. | a ojo |
| DEN-8 | **Un primario por vista** (B-06). | R-OK |
| DEN-9 | Toasts de **≤42 caracteres** (el error puede ocupar 2 líneas). | R-TOAST |

Hoy se pasan del presupuesto: //STATS repite datos de Progress y dice "today" cinco veces; las hojas del catálogo y del
perfil tienen párrafos fijos de instrucciones; la tira de 17 tiles de Progress. Objetivo G4 (y G3 para las tiles).

---

## 6. Idioma, mayúsculas y voz

### 6.1 Política (BRAND §3, decisión del dueño 2026-09-21)

- VOZ-1 **Etiquetas de sistema en inglés:** `//SECCIONES`, la nav, los verbos de comando (`start`, `save`, `rest`,
  `skip`) y los estados cortos. **Prosa en español:** ayudas, errores, toasts, vacíos, diagnósticos. **Un componente nunca
  mezcla idiomas.** Las etiquetas del dueño no se traducen ni se tocan. La revisa: R-LANG.
- VOZ-2 **Mayúsculas** solo en `//SECCIÓN`, siglas (PR, RIR, MEV, MRV) y rótulos de grupo. Todo lo demás en minúsculas,
  **incluidas las etiquetas de campo** (hoy `.field label` va en mayúsculas: `TU NOMBRE`, `SEXO`…, objetivo G3). Cabeceras en
  una línea (`sep 2026 · 10`). Nunca `text-transform` sobre una etiqueta del dueño (v258: la vista previa del día y el catálogo la
  muestran tal cual como `#etiqueta`, M1-08). La revisa: a ojo.
- VOZ-3 **Tono:** seco, operativo, en minúsculas, de consola (`serie 2/3`, `bajo MEV · le faltan ~3 series`). Sin
  exclamaciones ni "genial". Lo humano se reserva para errores y diagnósticos. Cuando un dato no es obvio, el *porqué* va
  en una línea ("correlación, no causa") o al glosario.

**Hoy (v262) el idioma está mezclado** y la regla anterior ("lo nuevo en español salvo vecino en inglés") está en el
changelog. Estado medido:
- Títulos `//` en inglés: SETTINGS, HISTORY, SPLIT, STACK, PROGRESS, RECORDS, STATS, NEXT, SUPPS, MEALS, WATER.
  En español: PERFIL, SALUD, ESTÍMULO, MÚSCULOS, FUERZA, RENDIMIENTO, COBERTURA, HOY (recap).
- Una pieza con dos idiomas: barra de estado (`streak:` junto a `meta: mantener`), barra de descanso (`descanso · skip ·
  listo`), abortar (`abort` → "abortar la sesión"), ajustes (`data`, `export file` junto a `espacio`), sheets (`guardar` +
  `cancel`), vacíos en inglés (`no meals logged`, `no water logged`).
- Para cerrar se usa `cancel`, `cancelar`, `close` y `cerrar`.

**Lista para G3 (propuesta G1, a confirmar con el dueño; BRAND solo fija PROFILE, SETTINGS, HEALTH, STIMULUS, PROGRESS):**
//PERFIL → //PROFILE · //SALUD → //HEALTH · //ESTÍMULO → //STIMULUS · //MÚSCULOS → //MUSCLES · //FUERZA → //STRENGTH ·
//RENDIMIENTO → //PERFORMANCE · //COBERTURA → //COVERAGE · //ESPACIO → //STORAGE · //HOY → //TODAY. Vacíos a español
(`// sin comidas · [+ meal]`).

### 6.2 Palabras únicas

- VOZ-4 **Una palabra por acción en toda la app**: una para cerrar, una para guardar, una para borrar, una para cancelar.
  Qué idioma llevan los botones de sheet es pregunta abierta (§1).
- VOZ-5 **El botón dice el verbo**: `borrar sesión` / `conservar`, nunca `ok`/`cancel` ni "¿seguro?". Hoy `trkAsk()` y
  `holdConfirm()` usan `'¿seguro?'` como título por defecto y el OK destructivo de TRKAsk sale como `.cancel.danger`
  (parece un cancelar): objetivo G4.
- VOZ-6 **Corchetes** `[verbo objeto]` (BRAND §3): minúsculas, sin espacios internos, ≤3 palabras, nunca dentro de una
  caja, con toque de 44. Hoy quedan `[ ver rutina ▾ ]`, `[ ocultar rutina ▴ ]` y `[tap para cerrar]` (objetivo G3:
  `[ver rutina ›]`). La revisa: R-BRK.

### 6.3 Vocabulario de feedback (TRKToast)

- `✓ <objeto> <acción>` en español y minúscula, una línea, sin punto final: `✓ sesión guardada · 9 series`,
  `✓ sesión actualizada`, `✓ split actualizado`, `✓ ejercicio actualizado`, `✓ perfil del ejercicio guardado`,
  `✓ comida guardada`, `✓ metas guardadas`, `✓ peso guardado`, `✓ sueño guardado`, `✓ ajustes guardados`.
- Tareas (`toastTask()`): `… sincronizando salud` → `✓ salud sincronizada · 12 días`; `… buscando producto` →
  `✓ encontrado` / `⚠ no está en OpenFoodFacts`; `… generando imagen` → `✓ imagen lista`.
- Error: `⚠ qué pasó · qué hacer` (`⚠ pon un nombre`), nunca un diálogo nativo.
- Reversible: `✓ alimento borrado [deshacer]`.
- Vacío: `// sin registros · [+ acción]`. En Progreso, además, **la tile activada nunca desaparece** (v263): sin dato muestra `—` + `sin registro` y ella misma es el botón de registro.
- La revisa: ds-audit (guardados sin feedback: hoy 0; diálogos nativos: hoy 0) · R-SAVE · R-TOAST.

---

## 7. Componentes

Una ficha por componente, siempre con los mismos campos: **Rol · Clase / API · Anatomía · Estados · Toque · Sí / No ·
Motor TRK · Hoy → objetivo · La revisa**. La anatomía usa nombres de token.

### 7.1 Acciones

BRAND B-06: dos tipos de acción. `[verbo objeto]` para lo puntual y **un solo primario por vista**; una fila que termina
en `›` para navegar. Nada más. El árbol para elegir está en §17.3.

#### Primario
- **Rol:** la razón de ser de la vista. Uno por vista.
- **Clase / API:** `.start` (pantallas), `.sheetbtns .ok` (sheets), `.footer .save` (barra de sesión). `.start.ghost` = misma
  geometría en contorno para una alternativa de igual peso.
- **Anatomía:** alto 48 (44 en la barra acoplada, para no robarle alto a la tabla) · `--r-ctl` · fondo `--fill` y texto
  `--on-fill` · `--t-data`/700 · `--ls-ui`.
- **Estados:** presionado = opacidad `.7` (hoy literal); deshabilitado: no se usa, se oculta.
- **Toque:** 48×ancho.
- **Sí / No:** sí `▶ start workout`, `✓ save session`. No dos primarios en la misma vista; no un primario para
  "cerrar" o "cancelar".
- **Motor TRK:** —
- **Hoy → objetivo:** hoy es un bloque blanco redondeado y hay vistas con más de uno (hoja de sesión con 3 `.ok`, //ESPACIO
  con 2, el día del calendario con varios). **Objetivo G3** (decisión del dueño 2026-09-21, "más al estilo gymTRK"):
  "primario gym//TRK" (clase por definir en G3) = bloque de 2, alto 48, texto de comando en minúsculas con glifo
  (`▶ resume workout`), `--t-data`/800, presionado = invertir; variante sólida inversa o vidrio + borde, se elige en G0.
  `rest day`, `skip day`, `abort`, `↩` y `← back` pasan a `[verbo]`.
- **La revisa:** R-OK · R-ROLE · a ojo.

#### Secundario
- **Rol:** alternativas y cancelar dentro de un sheet o de una barra.
- **Clase / API:** `.secondary .b`, `.sheetbtns .cancel`, `.footer .abort`, `.footer .undo`. Destructivo = `.cancel.danger`
  (`--bad`).
- **Anatomía:** alto 44 (48 en `.sheetbtns`) · `--r-ctl` · borde 1 `--border` · `--t-data`/400 · texto `--o60`/`--fg`.
- **Estados:** presionado = fondo `--card2`.
- **Toque:** 44.
- **Sí / No:** no pills como botón universal; no botones con estética propia por módulo; no íconos sin texto en acciones
  importantes.
- **Hoy (v258, T-01):** `button{font-family:inherit}` y roles con selector propio de menor especificidad que los padres:
  `button.b` (44, borde, `--r-sm`), `button.t` (toggle 36, `.on` en `--fg`) y `button.cancel` (44, `--o60`). Donde el
  padre ya daba estilo (`.secondary .b`, `.sheetbtns .cancel`) sigue igual; fuera de él ya no sale el botón nativo gris
  (fugas del navegador 16 → 0 en `dsSweep`). **Objetivo G3:** la mayoría de los secundarios pasan a `[verbo]`.
- **La revisa:** R-ROLE · `_dsRenderCheck` ua.

#### Acción de texto `[verbo]`
- **Rol:** acción puntual dentro de los datos (BRAND §3).
- **Clase / API:** `.addbtn` (`[+ set]`, `[↓ drop set]`), `.ctrls a` (`[change split]`), `.section .meta` (`[settings]`),
  `.fa-acts a`, `.mdacts a`, `.hbody .hacts a`.
- **Anatomía:** texto `--t-label`/`--t-data` en `--o60`, sin caja; `[ ]` literales en el texto.
- **Estados:** presionado = `--fg`.
- **Toque:** 44×44 con `.u-hit` (pendiente G4); hoy se consigue con padding + margen negativo en algunos (`.addbtn`,
  `.ctrls a`) y en otros no (`[share]` y `[goals]` miden 42×13).
- **Sí / No:** sí `[+ set]` `[share]` `[‹ gym]`; no `[ + set ]` con espacios, no un corchete dentro de una caja, no más de
  3 palabras.
- **La revisa:** R-BRK · `_dsRenderCheck` hit.

#### Acción de sección de log (`.lact`)
- **Rol:** la acción de cada sección de TRKLog (`+ water`, `+ meal`, `✓ AM`).
- **Anatomía:** 96×32 visible, `--r-ctl`, borde 1 `--border`, `--t-data`/700, `--ls-ui`; un `::after` lo lleva a 44 de alto.
- **Estados:** presionado fondo `--o10`; `aria-disabled` → texto `--o30`, borde `--o10`.
- **Hoy → objetivo:** caja con radio de control: objetivo G3 (pasa a `[verbo]` o a la forma de 2 de B-05).
- **La revisa:** `_dsRenderCheck` hit.

#### Más acciones (`.dots3`)
- **Rol:** abrir el menú de acciones de una entidad (comida).
- **Anatomía:** tres puntos dibujados de 3 con 3 de aire, `--o50` (`.gmore` > `.dots3`); nunca el texto `···`.
- **Toque:** 44×44 que se mete 12 en el margen de la página.
- **Hoy:** el catálogo usa `⋯` como texto (`.exmore`): fuera del set (§11.3).

### 7.2 Campos

#### Formulario
- **Rol:** dato que se escribe en sheets, ajustes, onboarding y perfiles.
- **Clase / API:** `.field input`, `.field select`, `#fa_q`, `textarea.ta` (`.sm/.md/.lg/.xl`), `select.pfsel`, `#pf_gym`,
  `.pfw`, `.slblk input`, `.slph input`, `.mdcust input`, `.mmrow select`. Etiqueta `.field label`.
- **Anatomía:** alto 44 · `--r-ctl` · borde 1 `--border` · fondo `--card` · `--t-section` (anti-zoom). `.mmrow select` va a
  `--t-data` porque acompaña a una fila (el viewport ya bloquea el zoom).
- **Estados:** foco con `:focus-visible` (contorno `--fg`); placeholder `--o30`.
- **Sí / No:** **unidad y porción siempre `<select>`, nunca texto libre** (vinculante). No alturas 30/32/34/38, radio 8,
  sombras internas, labels flotantes ni bordes de color.
- **Hoy → objetivo:** la etiqueta va en MAYÚSCULAS (objetivo G3, VOZ-2); el borde no llega a 3:1 (pregunta BRAND §10).
- **La revisa:** ds-audit (campos por debajo de 16: hoy 0).

#### Dato (tabla de sesión)
- **Clase / API:** `.inp` (`.inp.weight`), `.pick`, `.fs`, `.bwchip`; RIR con TRKSelect (`.pick.rirb` + `openRirSelect()`;
  `TRK_RIR` = false vuelve al `<select>`).
- **Anatomía:** alto 36 · `--r-sm` · .5 `--o20` · transparente · `--t-data`. "La caja cabe su contenido".
- **Estados:** prefill `.pf` a .45 por campo hasta tocarlo; drop `.isdrop` a .82; `.fs.on` fondo `--o12`.
- **Toque:** 36 (excepción `table36`).
- **La revisa:** a ojo · `_dsRenderCheck` hit (con la excepción).

#### Dato mini
- **Clase:** `.inp-mini` (fecha, duración y horas del registro tardío). Alto de su texto, `--r-sm`, .5 `--o20`,
  `--t-label`. Es la única caja por debajo de 16 fuera de la tabla (el viewport bloquea el zoom).

### 7.3 Toggles y pestañas

#### Toggles
- **Clase:** `.toggles button` (`.toggles.wrap`); lo **sugerido** va con borde punteado hasta tocarlo (`.pftog.sug`).
- **Anatomía:** alto 44, `--r-ctl`, borde 1 `--border`, `--t-data`/700 `--ls-ui` en `--o50`; elegido = fondo `--fill`, texto
  `--on-fill`.
- **Hoy → objetivo:** radio de control en contenido → objetivo G3 (2).

#### Pestañas (TRKTabs)
- **Rol:** cambiar de periodo o de vista sin cambiar de pantalla.
- **Clase / API:** `.mdtabs[data-tk]` con `<span class="on">`; el indicador `.tabind` lo pone `slideTabs()` desde
  `afterPaint()`; sin JS, un `::after` subraya la activa.
- **Anatomía:** separador .5 `--o10` abajo; etiquetas `--t-data`/700 `--ls-ui` en `--o50`, activa `--fg`; indicador de 2
  `--fill` bajo la mitad central de la activa. Sin pista, sin píldora, sin tarjeta por pestaña.
- **Movimiento:** el indicador aparece en su sitio al pintarse; **solo viaja** (posición y ancho, `--dur-2 --ease-out`)
  cuando cambia la pestaña elegida (así "PM" ya no parpadea).
- **Dónde:** periodos del detalle de métrica, volumen y e1RM; HOY/TODOS del stack; momentos de SUPPS (`.lseg`); vistas de
  compartir un ejercicio.
- **La revisa:** a ojo · self-check de UI.

### 7.4 Marcas y estados

| Familia | Clases | Anatomía | Función |
|---|---|---|---|
| **Etiqueta de dato** | `.exsub .note` (`[+ nota]`), `.exrow .exp` (perfil), `.exT` (T), `.settens` | texto sin caja, `--t-label`, `--o50`; si se toca, subrayado punteado | describe (tipo, T, perfil) |
| **Estado** | `.vst`, `.setprog`, `.lpr` (PR), `.pill`, `.pst` | texto `--t-label` **sin caja**, minúsculas salvo sigla; color = semántico del estado | dice cómo está (bajo MEV, ▲+3 %, PR) |
| **Seleccionable** | `.chip`, `.ag-chip` | píldora `--r-pill`, alto ≥36, borde .5 o `--card2`, `--t-data` | se toca para elegir o filtrar |

- MRK-1: nada de cajas alrededor de un estado; nada de chips con radio 4/6/8/14; no más familias.
- Objetivo G3: los seleccionables en píldora salen del contenido (B-05, "sin píldoras").
- La revisa: R-RAD · a ojo.

### 7.5 Catálogo de filas

Hoy hay más de diez clases de fila. Se agrupan en **cuatro familias**; una fila nueva elige su familia y usa su anatomía
(ROW-1). Las clases existentes se conservan (PRI-9) y convergen a los valores de su familia.

| Familia | Anatomía | Toque | Clases de hoy |
|---|---|---|---|
| **A · Lectura** `clave ···· valor` | clave `--o60` · líder punteado `.dots` · valor `--fg`/700; `--t-data`; sin toque | — | `.line`, `.line.stat`, `.mdline` (variante de detalle), `.tbrow`, `.stline`, `.nl-row`, `.mdr` |
| **B · Navegable** (termina en `›`) | nombre `--t-data` + sublínea `--t-label` opcional; `›` `--o30` al final; separador .5 `--o10` | toda la fila, ≥44 | `.line.lnav`, `.nvm` (menú, filas de ~50), `.pickitem`, `.exrow`, `.hrow`, `.mscrow`, `.mmrow`, `.trow` (con sparkline), `.mdtr`, `.stq` (si tiene detalle) |
| **C · Registro** (una línea por registro, B-03) | `#etiqueta` tenue · nombre `--fg`/800 · datos `--o50`; interlineado de lectura | la fila, si abre algo | `.srw` (la referencia), `.sxr` (historial compacto, objetivo G4: pasa a `.srw`), `.mit` (alimento), `.sitem` (compartir comida), `.lc` (celda de supp/agua), `.seex` (ejercicio del split), `.exbr` |
| **D · Rejilla editable** | cajas de dato de 2 en columnas fijas | cada caja | `.srow`/`.pair` con `.gc-*`, `.slph`, `.slblk` |

- ROW-2: separador **.5 `--o10`** en todas las filas de lista; dentro de un grupo con borde, el separador es el borde.
- ROW-3: una línea + sublínea opcional; lo que no cabe se corta con elipsis **salvo las etiquetas del dueño**, que no se
  cortan (B-12; v258: la tile de e1RM dice `e1rm` y el nombre va completo debajo en `.ptname`, M5-05).
- ROW-4: una **lista de ejercicios es siempre `.srw`** (familia C). La revisa: a ojo.
- Hoy ajustes tiene dos tipos de fila navegable (una de 23 de alto) y un interruptor que muestra `›` (M6-17): objetivo G4.
- `.vrow`/`.vtop` (fila de volumen) y `.mrow` (fila de ingesta con barra) son filas A con una barra (§7.15).

### 7.6 Cabeceras

| Componente | Clase / API | Anatomía |
|---|---|---|
| **Barra de estado** (línea de prompt) | `statusBar(back)` → `.status` | rejilla de 3; `u/usuario ▾` `--t-data`/800 · fecha y hora centradas `--t-label` `--o50` · `streak:` a la derecha y, en home/macros/progress/settings/stack/history, `meta: ▾` (`.sgoal`, toque 44 con `::after`) |
| **Cabecera del día** | `dayHeadHTML(lbl,name,meta)` → `.whdr` (`.wlbl`, `.wname`, `.wmeta`) | un solo borde izquierdo: `//NEXT` `--t-label` MAYÚSCULAS `--ls-caps` · nombre `--t-display`/800 · una línea de meta `--t-label` `--o40`. Firma de las pantallas de gym; no se aplana |
| **Sección** | `.section` (`.h` + `.s`, `.meta`) | `//` en `--o50` + nombre `--t-section`/800; meta `--t-label` `--o50` a la derecha |
| **Rótulo de grupo** | `.grp-label` (`.sub`, `.first`) | `--t-label` `--o40` `--ls-caps` en MAYÚSCULAS |
| **Meta / ayuda** | `.submeta` (`.gap`) | `--t-label` `--o40` |
| **Título de sheet** | `.sheet h3` (`.sub` para el `· tag`) | `--t-section`/800 `--fg` `--ls-title` |

- HDR-1: una cabecera por pantalla (`dayHeadHTML` o `//MÓDULO` + meta), un `//` por sección.
- Hoy //FUERZA, //RECORDS, //MÚSCULOS y //RENDIMIENTO son `.grp-label` de 10, más débiles que sus propias filas (M5-07):
  objetivo G4 a `.section` 16/800.
- El `← back` de la barra de estado es una caja de 68×37: objetivo G3 `[‹ origen]` (§14.2).

### 7.7 Superficies de agrupación

- **Hoy:** `.card`, `.grp`, `.ptile`, `.pthrow`, `.hcal` (y `.ws-card` en el wrap): fondo `--card`, borde 1 `--border`,
  radio `--radius`, padding `--sp-card`, margen inferior `--sp-gap`.
- SRF-1 (sigue valiendo): una superficie existe **solo** si agrupa una entidad, contiene una métrica independiente o es un
  módulo autónomo. Nunca una tarjeta por número, fila o botón. Sin gradiente, brillo, vidrio, acento ni sombra.
- **Objetivo G3** (B-05): en el contenido no hay tarjetas de 16. Un grupo es un **panel** `//TÍTULO` + regla, o una caja de
  2 cuando hace falta borde. El anillo de kcal pasa a un panel de lectura (plano o vidrio sutil, se elige en G0). Progress
  deja la rejilla de tiles (`.pgrid`/`.ptile`) por filas TRKTrend (M5-03, requiere su visto bueno). El mes del historial y
  su calendario dejan la caja.
- La revisa: R-RAD · prueba de 5 s.

### 7.8 Tabla de sesión

La pieza más gym//TRK de la app: densa, afilada, técnica. **Nunca** vidrio, radios grandes ni color decorativo.

- **Rol:** registrar series en vivo y corregirlas en el historial (`.hist-compact`, mismas filas).
- **Clase / API:** `renderExercise()`, `renderSetRow()`; cabecera `.thead` (`.cl`); filas `.srow` en rejillas
  `.gc-free`, `.gc-mach`, `.gc-mach-fs`, `.gc-uni`, `.gc-free-bw`, `.gc-uni-bw`, `.gc-cardio` (la última columna es el ✓);
  unilateral `.pair` con `.prows`, cabecera `uniHeadHTML()` con la misma envoltura (`.pair.phead`).
- **Anatomía:** número de serie `.setn` (`--t-label`; 1, 1.5, 2… con color de zona; hecho `--fill`/700) · cajas de dato
  (§7.2) · `.dchk` ✓/○ (`--t-section`, 30×36) en la última columna; en unilateral `.pairdone` a la derecha del par.
  Encabezado del ejercicio en dos líneas: `.exhead` (`[bi] nombre`, `--t-section`/800, `[uni]`/`[bi]` con la misma fuente
  que el nombre) · `.exsub` (`[tipo]`, marca/setup `.mch` con subrayado punteado, `[+ nota]`). Barra de acciones
  `.addrow` con `.addbtn`. Sin rellenos ("+ machine" no existe).
- **Estados:** prefill `.pf` por campo (gris .45 hasta tocarlo); drop `.isdrop` .82; serie hecha `.setn.done` + `.dchk.done`;
  ejercicio en curso `.ex.current` (en modo enfoque, §7.20).
- **Toque:** 36 (`table36`); el ✓ debe ampliar su toque con `::after` a 44×42 y 6 de separación (objetivo G4, M2-06).
- **Sí / No:** borrar = **deslizar la fila a la derecha ≥76** (gesto horizontal claro; nunca desde un campo, el ✓ o el
  asa); la pista se enseña una vez (`swipehint`, `hintSeen()`). No hay ✕ por fila.
- **Motor TRK:** TRKRow (`data-rk`, `reRender()`), TRKSelect (RIR), `applyEnter()` (`.enter`, `.pop`).
- **Hoy → objetivo G4:** borrar una serie solo deslizando no tiene alternativa ni deshacer (M2-07: toast con
  `[deshacer]` + menú al mantener el número); `↩` borra la serie más baja con datos aunque no tenga ✓ (M2-08: pila de
  eventos ✓); tras cada ✓ aparecen T, FC, % de drop y ▲▼ a la vez (M2-24: en vivo solo ▲▼%).
- **La revisa:** self-checks (`_loggingSelfCheck`, `_dropsetSelfCheck`) · R-SESS · a ojo.

### 7.9 Barras acopladas

- **Clase:** `.restbar` (`#resttimer`: `.rl` etiqueta, `.rt` tiempo `--t-section`/800 tabular, `−15 +15 skip`) y `.footer`
  (`#wfooter`: `.abort`, `.undo`, `.save`). Viven fuera de `#view`.
- **Anatomía:** sólidas (`--frame`), borde superior 1 `--o12`, gutter `--sp-px`. Footer: botones de 44 (`abort` borde
  `--abort`, `↩` borde `--border`, `save session` primario). Descanso: botones de 32 visibles con toque de 44 (`::after`).
- **Estados:** fin de descanso `.restbar.fin`: tiempo en `--good` y 3 destellos del borde (`restdone`, id `loop`); texto
  `listo`.
- **Motor:** `updateRestBar()` escribe solo `textContent` cada 500 (nunca repinta); `visibilitychange` recalcula.
- **Hoy → objetivo:** `abort` y `↩` pasan a `[verbo]` y `--abort` se retira (G3); el tiempo de `.wline` se congela durante
  el descanso (M2-15, G4). `updateNowBar()` es código muerto (G4).

### 7.10 Navegación

- **Rol:** las tres pantallas primarias: **progress · gym · macros**. Pertenece al chrome, no al contenido.
- **Clase / API:** `renderNav()` construye una vez `.nav.glass` con `NAVIC` (íconos SVG de línea 24, trazo 1.6) y alterna
  `.active`; se oculta en workout, settings, splitedit, history y share. Suplementos, músculos, split, historial y ajustes
  viven en el menú `u/…` (`.nvm`).
- **Anatomía hoy:** cápsula de vidrio `--r-pill` flotando a 12 del borde; pestañas de solo ícono; la activa se ensancha y
  muestra su etiqueta (`--t-data`/700, fondo `--o12`) animando `gap`, `padding` y `grid-template-columns`.
- **Toque:** hoy 83×40 (menos de 44).
- **Objetivo G3** (decisión del dueño 2026-09-21: "glass terminal bar", BRAND §4): cápsula de vidrio con `--r-float`
  (pendiente G3), borde .5, sin sombra blanda; dentro, pestañas de **texto siempre visibles** (`progress  gym  macros`);
  la activa en bloque inverso de 2 o entre `[ ]` (se elige en G0); alto ≥44; **sin animar layout**. La nav también se
  oculta en histedit, stack y agenda (hoy se ve: T-02).
- **No:** más de 3–4 pestañas, dock con lupa, rebote.
- **La revisa:** R-MOTION (layout) · `_dsRenderCheck` hit · a ojo.

### 7.11 Sheets y capas

- **Rol:** una tarea corta encima de la pantalla sin cambiar de pantalla.
- **Clase / API:** `openModal(html, cls)` → `.modal` (scrim) + `.sheet.glass-strong` **anclado arriba** (evita el teclado
  de iOS); `cls` admite `tall` (90 de alto de pantalla), `mdetail-wrap` (88) y `nodismiss` (solo decisiones obligatorias,
  hoy la sesión inactiva de `promptIdleSession()`). `closeModal()`. Capa de decisión encima del sheet: `askLayer()` →
  `.modal.asklayer` (§7.13).
- **Anatomía:** scrim `rgba(0,0,0,.6)` · sheet con padding `--sp-sheet`, esquinas inferiores `--r-sheet`, máx. 80 % de
  alto · título `.sheet h3` · botones `.sheetbtns` (primario + secundario). El contenido del sheet usa el lenguaje normal
  (no todo es vidrio).
- **Movimiento:** al abrir desde cero el sheet baja (`sheetin`, `--dur-3 --ease-out`) y el scrim aparece (`scrimin`,
  `--dur-2`); al cerrar sube y se desvanece (`--dur-2 --ease-in`). **`openModal` sobre otro sheet, o justo después de
  `closeModal()`, es cambio de contenido: sin animación.**
- **Cierre sin trampas:** `closeModal()` quita el `id` al instante y deja un fantasma `.modal.out` sin clics que se borra a
  los 200.
- **Hoy (v258, T-10):** cerrar un sheet y repintar usa `closeModal(); reRender()` (28 llamadas + los handlers del
  editor de split): el scroll de abajo se conserva. Radio del sheet: `--r-float` (v262). Con un sheet abierto, un
  error va en línea bajo el campo, no en un toast bajo el teclado (G4).
- **La revisa:** R-SCROLL · a ojo.

### 7.12 TRKToast

- **Rol:** decir qué pasó después de una acción; una sola voz para todo el feedback (§6.3).
- **API:** `toast(msg, type, {undo})` (tipo `ok`/`err`/neutro, se infiere de `✓`/`⚠`) · `toastTask(msg)` → `{done, fail}`
  para lo que tarda.
- **Anatomía:** `.toasts` (pila `aria-live`, máximo 3, sale la más vieja) · `.toast.glass-strong` `--r-pill`, `--t-data`/700;
  borde `--good` (`.ok`), `--bad` (`.err`, se queda hasta tocarlo, con ` ✕`), neutro; `.toast.task` en `--o70`;
  `[deshacer]` `.tundo` con toque ampliado.
- **Vida:** éxito/neutro `--toast-life`; con deshacer o error `--toast-life-err`; un solo deshacer vivo a la vez.
- **Hoy (v258):** `bottom` con `env(safe-area-inset-bottom)` (M6-06) y un error ocupa hasta 2 líneas en vez de cortarse
  (M6-07); ≤42 caracteres lo revisa R-TOAST. Objetivo G4: token `--nav-clear`. Forma: objetivo G3 `--r-float`.
  Sin confeti ni sonido.
- **La revisa:** R-TOAST · `_uiSelfCheck`.

### 7.13 Capa de decisión

Todo lo que pide una decisión vive en `askLayer()` (`.modal.asklayer`, `--z-pop`): **encima** del sheet actual, nunca lo
reemplaza, así lo escrito abajo se conserva. Diálogos nativos (`alert`/`confirm`/`prompt`): 0 (ds-audit).

#### TRKAsk
- **Rol:** decisión reversible o de flujo. **API:** `trkAsk({title,detail,ok,cancel,danger,dismiss}, onOk, onCancel)`.
  `dismiss` (v259) = qué hace tocar fuera; sin él, tocar fuera = cancelar. Una decisión que borra algo que no se puede
  recuperar (la sesión por recuperar) NUNCA se toma tocando fuera: `dismiss` la deja para después.
- **Cola del arranque (v259):** `bootAsk(o, onOk, onCancel)` pone los avisos del arranque uno tras otro (sesión por
  recuperar → respaldo más completo). Si otro aviso los tapa (`_onReplaced`), la cola se vacía: lo pendiente sigue
  guardado y se vuelve a ofrecer en el siguiente arranque.
- **Anatomía:** `h3` + `.submeta` + `.sheetbtns` (primario + secundario; si destruye, `.cancel.danger` + secundario).
- **Hoy → objetivo G4:** título por defecto `'¿seguro?'` y OK destructivo que parece cancelar (VOZ-5).

#### TRKHold
- **Rol:** confirmar lo **irreversible** sin que un toque accidental baste. **API:** `holdConfirm({title,detail,verb}, onOk)`.
- **Anatomía:** `.hold` alto 48, borde `--bad`, texto `--bad`; `.hold-fill` `--bad` a .22 avanza con `scaleX` en 900 lineal
  mientras se sostiene ("armando 73 %"); soltar antes cancela; vibración corta al completar (solo Android).
- **Dónde:** §17.4.

#### TRKPrompt
- **Rol:** un campo suelto en un sheet. **API:** `trkPrompt({title,label,value,type,inputmode,hint,ok}, onSave)` (usa
  `openModal`); `onSave` devuelve `false` para no cerrar.

#### TRKWheel
- **Rol:** elegir de una lista corta girando (nombre de comida, fase). **API:** `trkWheel({title,opts,cur,ok,other}, onPick)`.
- **Anatomía:** `.whl` de 5 filas de 40 (`.whl-o`, `--t-section`, `--o35`; la elegida `.on` `--fg`/800) entre dos líneas
  .5 `--o20` (`.whl-sel`); `scroll-snap` nativo; `role="radiogroup"`. Tocar una fila elige; `[elegir]` lee la posición real.
- **Hoy → objetivo G4:** las filas no elegidas en `--o35` son texto bajo el piso (TOK-4).

#### TRKMenu
- **Rol:** las acciones de una entidad (comida, ejercicio del catálogo). **API:** `trkMenu(título, [[etiqueta, fn], …])` →
  filas `.nvm` con `›` en la capa de decisión.

### 7.14 Popovers

- **TRKSelect** — elegir un valor chico de un toque: `trkSelect(anchor, opts, cur, onPick, {title, clear})` → `#tsel`
  (`.tsel`, `.tselh`, `.tselr`, `.tselo` de 44 con `--t-section`/700, elegida `.on` en `--fill`; `.tselx` para
  "— quitar"; opción con sublínea `.tsub`). Se cierra con `popClose()`: toque fuera, scroll o repintado. Elegir (aunque sea
  el mismo valor) confirma; cerrar sin elegir no cambia nada. Uso: RIR (`openRirSelect()`), meta y actividad.
- **TRKPop / glosario** — texto corto anclado al término: `trkPop(anchor, text)` → `#gloss` (`.gloss`); el glosario marca
  los términos con `data-gloss="clave"` (subrayado punteado `--o20`) y lee `GLOSS` (rir, t, cap, lm, est, rirmed, e1rm, racha,
  stim). El listener va en captura y no dispara la acción de la fila.
- **Anatomía común:** `--card2`, borde 1 `--border`, `--r-ctl`, `--shadow-float`, entrada `rowin`.
- **Hoy (v262):** son chrome flotante con `--r-float`; vidrio opcional (G3).

### 7.15 Barras (TRKBar)

- **Rol:** mostrar una proporción con un solo trazo fino (volumen vs landmarks, ingesta, progreso de la sesión).
- **Clase / API:** `.bar`, `.vbar`, `.wprog`; relleno `trkBarI(clave, pct, cls)` (con `data-bk`, acotado 0–100); marcas
  `trkMark(pct, cls, title)` (`.mev` en `--o40`, `.mrv` en `--warn`); `animBars()` en `afterPaint()`.
- **Anatomía:** alto 3 (2 en `.wprog`), pista `--track` + relleno `--fill`; exceso `.over` en semántico. Barras de celdas
  permitidas para conteos discretos.
- **Movimiento:** crece desde su ancho anterior (`--dur-2`) solo si esa clave ya estaba pintada con otro valor.
- **Hoy → objetivo:** hoy son píldoras (`--r-pill`): objetivo G3 sin radio. Marca MRV fija en `--warn`: objetivo G3 `--o40`
  y `--warn` solo al pasarse (M1-10).
- **La revisa:** self-check de UI (TRKBar) · a ojo.

### 7.16 Diagnóstico

Cómo la app **sugiere** sin inventar (//MÚSCULOS y su detalle).
- **Anatomía:** `.dxrow`: hallazgo `.dxh` (`--t-data`/700, color por severidad `.dx-bad` / `.dx-warn` / `.dx-info` `--fg` /
  `.dx-ok`) · evidencia `.dxev` (`--t-label` `--o50`, con los números que lo disparan) · acción `.dxdo` (`→ …`, `--t-label`
  `--o70`) · separador .5 `--o10` · nota final `.dxnote`. Orden: grave → atención → sugerencia → "en orden".
- **En una fila de lista** (`.mscdx`): solo el hallazgo principal en corto + `+N` (`.dxmore`); nunca repite lo que ya dice
  un estado de la fila; "en orden" no ocupa renglón.
- **Redacción (DX-1):** se dispara solo con evidencia (umbrales en `DIAG`, con prueba de ruido en `_diagSelfCheck`) · nunca
  una puntuación · verbos de sugerencia ("suele", "puede aportar", "considera") · cita si la regla viene de literatura ·
  `~` si se apoya en datos sugeridos · sin datos suficientes dice "pocos datos", no "en orden".
- **Objetivo G3:** 'fresco' deja el verde; `.dx-ok` solo para eventos.

### 7.17 Utilidades `u-`

Lo que antes era `style=""` fijo es una clase `u-` de un vocabulario cerrado, por token. Sirven para el ajuste entre
piezas, **no** para inventar componentes: si un conjunto de utilidades se repite como forma propia, se vuelve componente.

| Grupo | Clases que existen |
|---|---|
| color | `u-fg` `u-o60` `u-o50` `u-o40` `u-o35` `u-o30` `u-o20` `u-good` `u-bad` `u-warn` |
| tipo y peso | `u-label` `u-data` `u-sec` `u-disp` `u-hero` · `u-w4` `u-w7` `u-w8` |
| tracking y caja | `u-lscaps` `u-lsui` `u-lsnum` `u-ls0` · `u-upper` |
| margen | `u-mt2` `u-mt4` `u-mt6` `u-mt8` `u-mt10` `u-mt12` `u-mt16` `u-mt24` `u-mt32` · `u-mt-n2` `u-mt-n4` `u-mt-n6` `u-mt-n8` · `u-mb0` `u-mb2` `u-mb4` `u-mb6` `u-mb8` `u-mb10` `u-mb12` `u-mb16` · `u-ml4` `u-ml6` `u-ml8` `u-mlauto` · `u-mr1` `u-mr2` `u-mr8` · `u-mx0` · `u-my4` `u-my6` `u-my8` `u-my10` `u-my12` |
| padding y gap | `u-p10` `u-pb16` `u-pr4` `u-pt16` `u-pt24` `u-pt32` `u-pt96` · `u-px0` `u-px6` `u-px8` `u-px10` `u-px16` · `u-py0` `u-py1` `u-py2` `u-py4` `u-py6` `u-py8` `u-py24` `u-py32` · `u-gap4` `u-gap8` `u-gap10` `u-gap12` |
| layout | `u-flex` `u-iflex` `u-block` `u-col` `u-wrap` `u-aic` `u-ais` `u-aib` `u-asc` `u-jsb` `u-jfe` `u-f0` `u-f1` `u-fhalf` `u-fthird` `u-min0` `u-w100` `u-wauto` `u-h100` `u-fr` `u-vam` |
| texto y estado | `u-tc` `u-tr` `u-nowrap` `u-preline` `u-ul` `u-tap` (solo cursor) `u-dim` `u-invis` `u-sep` `u-dash` |

- UTL-1: van al final del CSS como `#app .u-x`: ganan como ganaba el `style=""`, y un `el.style.*` en vivo les sigue
  ganando. El bloque se genera **solo con las que se usan**.
- UTL-2: siguen en línea (y está bien) los valores calculados en vivo (`width:${pct}%`, colores de zona, posiciones) y el
  `display:none` que el JS alterna. Hoy: 89 `style=""`.
- UTL-3: no valores fuera de la escala, no color literal, no dos declaraciones de la misma propiedad en un elemento, no
  utilidades para lo que ya es componente. No existen `u-o70`, `u-info` ni utilidades de tamaño viejas.
- **Pendiente G4:** `.u-hit` (pendiente G4), §7.29. La revisa: ds-audit (`style=""`) · R-DOC.
- Clases de ayuda de v156 que quedan en el CSS: `.muted` (en uso); `.t-meta`, `.t-xs`, `.muted2`, `.kc-right`, `.mt-s3`,
  `.mt-s4`, `.mt-s5`, `.mb-s4` no aparecen en el JS (limpieza G4).

### 7.18 Registro de motores `TRK*`

§7.1–§7.17 dicen cómo se ve cada pieza; este registro dice **cómo se comporta**. Cada interacción transversal tiene UN
componente, con una API. **Ninguna pantalla implementa su propia versión**: si falta algo, se agrega aquí primero
(TRK-1). La referencia de comportamiento de 21st.dev solo se toma como idea (§19).

| Componente | Función | API | Ficha |
|---|---|---|---|
| **TRKToast** | feedback de toda acción | `toast()`, `toastTask()` | §7.12 |
| **TRKAsk** · **TRKHold** · **TRKPrompt** · **TRKWheel** · **TRKMenu** | decidir, confirmar, escribir, elegir | `trkAsk()`, `holdConfirm()`, `trkPrompt()`, `trkWheel()`, `trkMenu()` sobre `askLayer()` | §7.13 |
| **TRKSelect** · **TRKPop** | elegir de un toque · explicar un término | `trkSelect()`, `openRirSelect()`, `trkPop()`, `GLOSS`, `popClose()` | §7.14 |
| **TRKTabs** | cambiar de vista sin cambiar de pantalla | `.mdtabs[data-tk]` + `slideTabs()` | §7.3 |
| **TRKRow** | la lista cambia sin saltos | `data-rk` con `rk()` (identidad en memoria, nunca se guarda) · `reRender()` = `flipCapture()` + `render()` + `flipPlay()` · `state._enter` = `{exi,si}`, `{ex,scroll}` o `{sel}` | §7.8, §10 |
| **TRKBar** | barra que crece desde su valor anterior | `trkBarI()`, `trkMark()`, `animBars()` | §7.15 |
| **TRKNum** | número que cuenta hasta su valor | `data-nk` (clave), `data-nv` (valor), `data-nd` (decimales) + `animNums()` | §10 |
| **TRKTrend** | resumen de una serie antes de su gráfica | fila `.trow` con `lineChart(serie, {h, pad, noFill, noDots, margin, dates})` | §8 |
| **TRKCal** | un mes (o una franja) de días con intensidad | `monthCalHTML(y, m, mark, {head, num})`, `stripCalHTML(n, mark)`, `histCalHTML()` | §8 |
| **TRKLog** | registrar lo del día con una sola anatomía | `logSecHTML({k, title, v, act, body, open})`, `lfoldInit()` | §7.24 |
| **TRKRing** | el anillo de macros | `ringHTML(pct, center, size, inv)` | §7.28 |

`afterPaint(root, swap)` (al final de `render()` y de `openModal()`) es **la única vía** para animar lo que `render()`
reconstruye: cierra popovers y aplica TRKNum, TRKBar, TRKTabs y `applyEnter()` una sola vez (TRK-2).

### 7.19 Compartir

Decisiones del dueño (BRAND §9): comida = la primera versión (1-jun); sesión = su vista RECENT, "nada de héroes ni
rejillas"; compartir es **vertical, a altura natural, nunca un cuadro que recorte**.

- **Rol:** una historia de Instagram con lo que hizo o comió, en el lenguaje de la app.
- **API:** `go('share')` con `state.shareType` → `renderShare()` / `renderShareSession()`; `summaryShell(top, body)` arma la
  pantalla: barra de estado con atrás · `.sharecard` · marca `.shfoot` · `.shacts` con `[copiar texto]` (`shareTextFor()`,
  mismo modelo) y `[guardar imagen]` (`shareImage()`).
- **Sesión** (`shSessModel()` → `renderShareSession()`): `.shst` con el día en `.shsn` (`--t-display`/800), fecha · gym en
  `.shsm` (`--t-label` `--o50`) y una línea `1h26 · 18 series · 7 ejercicios` en `.shsum` (`--t-data` `--o70`). Cuerpo: una
  fila `.srw` por ejercicio: `#músculo` (`.srm`, solo cuando cambia) · nombre `.srn` 800 · series `shTokTxt()` →
  `160lbs×8@0 / 160lbs×6@0` (`.srs1` en `--o50`, drop `↓` en `--o40`, separador `.srsep`). Entre ejercicios `--s5`,
  interlineado 1.6. **Sin** tonelaje, T ni tarjeta.
- **Comida** (`shFoodModel()` → `renderShare()`): rótulo centrado `.shcap` (`// resumen · 17 sep`) · `.shbanner` con el
  anillo (`ringHTML`, kcal dentro) y P/C/F en `.shm-g` (`--t-display`) · `.shlog`: cada comida `.sgrp` con su cabecera `.sgh`
  (`// tag` · `P C F` · total `--t-data`/800) y **todos** sus alimentos `.sitem` (cantidad corta en negrita · nombre `--o60`
  · marca `.sb` · kcal). Los alimentos suman exacto el total de su comida y las comidas el anillo (`dayMealParts()`,
  `kcalParts()`).
- **Un ejercicio** (`openExShare()`): capa sólida `.exsh` (`--z-overlay`) con tres vistas en TRKTabs: `igual` (el mismo
  `renderExercise()` de solo lectura, misma x y ancho), `grande` (`.exbr`, una serie por línea a `--t-section`) y `la serie`
  (`.exov` a `--t-hero`, pregunta abierta §1). Tocar una serie le pone 📷 a su izquierda en el margen (`.camon`, a
  `--t-label`; una a la vez, en memoria con `exCamSet()`, nunca toca `db`); tocar fuera cierra. Botón `.exshr` junto al ✕
  con `EXSH_SVG`.
- **Imagen:** `shareImage()` dibuja en un canvas de **1080 × la altura real** (con el margen negro de la página), texto nodo
  por nodo con el avance exacto de la mono, sin librerías; se entrega por la hoja de compartir o, si no se puede, en un sheet
  para mantener presionada. Nunca `<a download>`.
- **Sí / No (SHR-1…4):** vertical y a altura natural; sin escalones, sin `+N`, sin bajar la letra; interlineado 1.5–1.6;
  nada interactivo dentro de la tarjeta; ninguna tarjeta de números gigantes ("del pito"); ningún cuadro 1:1.
- **Hoy → objetivo:** la marca `.shfoot` va toda en `--o35` (objetivo G3: marca única, §7.30); el botón `EXSH_SVG` usa
  viewBox 16 y trazo 1.4 como el ícono de iOS (objetivo G3: ícono TRK "share"); 📷 es emoji (objetivo G3: ícono TRK
  "camera", excepción `camera`); si el id no existe, compartir sesión muestra la última sin avisar (G4: `// esa sesión ya no
  existe`); `[uni]`/`[bi]` en compartir es decisión menor pendiente. `renderShareWeight()` no tiene quien lo abra (G4).
- **La revisa:** `_v257SelfCheck` · a ojo con capturas de las 44 sesiones reales.

### 7.20 Modo enfoque

- **Rol:** cómo se entrena: solo el ejercicio en curso se lee.
- **Clase:** `.wline` (botón de 32 de alto: `.wtn` día `--t-section`/800 · `.wtm` `n/N sets · tiempo` `--t-label` · `.wtx`
  glifo · `.wtb` barra de fondo `.wprog`) · el cuerpo va en `.wfocus`: `.ex.current` se lee; los demás `.ex` a .28 y sin
  toque salvo para volverse el actual; se ocultan `.exsub`, `.setprogline`, `.addrow`, `.swipehint`, zonas, T y asa.
- **Movimiento:** cambios instantáneos.
- **Hoy (v258, M2-02):** con la sesión completa el enfoque se queda en el último ejercicio, así `[+ exercise]` sigue a
  la vista. Pendiente G4: decidir qué señales de honestidad se quedan en el modo (M2-10/M2-16).

### 7.21 Rotación

- **Clase:** `.rot` (`.lbl` `ROTATION`, `.n` `‹ day 2/4 ›` con `.arrow`) + `.segs` (un `<i class="seg">` por día de 4 de
  alto; el elegido `.on` en `--fill`, los demás `--track`).
- **Hoy → objetivo:** `.seg.past` no tiene estilo (M1-19, G4: hecho `--o40`, actual `--fill`, próximo `--track`); las
  flechas miden 18×13 (`.u-hit`, G4).

### 7.22 Línea de preparación

- **Clase / API:** `readinessLineHTML()` → `.ready` (`--t-label` `--o50`: `recuperación <b>43</b> · sueño 6.2h (−1.8) · …`,
  `.rk` en `--ls-caps`, `.rl` `--o35`); toca → `openReadiness()`. Debajo, `dayMusclesLineHTML()` (músculos del día y su
  estado).
- **Hoy → objetivo G3** (decisión del dueño 2026-09-21, BRAND §4): la hoja de detalle muestra la puntuación en `.mdval`
  (`--t-hero`, "43 / 100"), que BRAND prohíbe ("puntuación única en tamaño héroe"). Objetivo: `recovery ~43` en una línea
  `--t-data`/800, sin héroe ni color de veredicto; el desglose sigue en su hoja.

### 7.23 //ESTÍMULO

- **Clase / API:** `stimulusSection()` / `stimulusRows()` → filas `.stq` (`.stqh` con `.stqn` nombre y `.stqv` lectura
  `--t-data`; `.vbar` con MEV/MRV; frase `.stqc` `--t-label` `--o70`).
- **Regla (STQ-1):** **silencio = en rango**; una frase solo si hay algo que mover (`sobre MRV · ~2 series de más`, `bajo
  MEV · le faltan ~3 series`, `lejos del fallo · RIR 4 de media`); color solo para frenar (`.stqc.bad`/`.warn`), nunca
  verde. Es la regla que G3 extiende a toda la app. La revisa: `_v256SelfCheck` (nunca verde, orden).
- **Hoy → objetivo G3:** el título pasa a `//STIMULUS` (§6.1).

### 7.24 TRKLog: SUPPS · MEALS · WATER

Decisión del dueño 2026-09-21: macros en orden **SUPPS → MEALS → WATER**, con esos nombres.

- **API:** `logSecHTML({k, title, v, act, body, open})` para las tres; plegado en `state._lfold` (se fija una vez por día
  visto con `lfoldInit()`); `suppSecHTML()`, `foodSecHTML()`, `waterSecHTML()`.
- **Anatomía:** `.lsec` > `.lhd` de 44: botón `.lt` (`//TÍTULO` `--t-section`/800 · lectura `.lv` `--t-data` `--o40` con TRKNum
  · `›` `.lx` que gira) + acción `.lact`. Cuerpo `.lbody`.
- **SUPPS:** momentos en TRKTabs (`.lseg`, `AM 2/6 · PM …`) y rejilla de 2 columnas `.lcg` de celdas `.lc` (36 de alto;
  tomado `.on` con ✓); `✓ AM` marca lo pendiente del momento. Un toque = tomado con su hora; marcar no mueve nada.
- **MEALS:** una `.mrec` por comida: cabecera `.mhd` de 44 (`.mtg` con `.mchev` y el nombre `.mnm` 16/800 + meta `.mmeta`
  `hora · P C F`; total `.mkc` 16/800 que abre el desglose; `.gmore` con `.dots3` → `openMealMenu()`); alimentos `.mit` de 36
  (`--t-data`, cantidad en negrita, kcal `--o50`); `+ food` al final.
- **WATER:** chips de vaso `.lc` (quitar = toast con `[deshacer]`); `+ water` abre la elección de cantidad.
- **Hoy → objetivo:** las filas tocables miden 36 (M4-07, G4: 44); vacíos en inglés (`no meals logged`, G3); el ✓ de
  tomado va en `--good` (G3).

### 7.25 Stack (suplementos, administración)

- **Hoy:** `renderStack()` con TRKTabs HOY/TODOS y bloques `<details class="stk-blk">` por momento (todos abiertos); cada
  toma es una `.line` con utilidades y dos ✓ con significados distintos, `~` para "tarde" y `ⓘ` (M6-15/16).
- **Objetivo G4:** fila de checklist propia (línea 1 `[✓] minoxidil 5%`, línea 2 tenue `1 ml · AM · 08:12 · skin`), un solo ✓,
  la marca de "tarde" como palabra. (Los botones del stack ya no salen nativos desde v258, T-01.)

### 7.26 Editores de entidad

- **Hoy:** cada entidad tiene su sheet de edición: `openExEdit()` (ejercicio), `openExProfile()` (perfil y músculos del
  motor, con lo sugerido punteado `.pftog.sug`), `openStackEdit()` (suplemento), `openGoals()` (metas), `openSleepLog()`
  (sueño), el editor de máquina y el perfil de ajustes. Todos usan la familia formulario (§7.2), `.toggles` y `.sheetbtns`.
- **Regla (ENT-1):** un editor = un sheet con `h3` · campos en el orden en que se piensan · lo sugerido punteado hasta que lo
  toques · un primario (`guardar`) · lo destructivo al final y separado (TRKHold si es irreversible) · toast al guardar.
- **Objetivo G4:** `style=""` que quedan (`openStackEdit` 9, `openExEdit` 8), textos
  de instrucción fijos al glosario.

### 7.27 Renombrar en línea

- **Clase:** `.senm` (nombre del día en el editor de split: campo transparente con línea inferior `--border`,
  `--t-section`/800). Las comidas se renombran desde su menú.
- **Regla:** a `--t-section` (anti-zoom); nunca cambia la etiqueta del dueño salvo que él la escriba.

### 7.28 TRKRing (anillo de macros)

Decisión del dueño 2026-09-21: **el anillo de kcal se queda** (única gráfica circular de la app, solo en macros y en
compartir comida; excepción `ring`).
- **API:** `ringHTML(pct, center, size, inv)` → `.ring` (`.lg` 132 con trazo 1.4 y número `--t-display`/800; `.md` 72 con
  trazo 1.8 y número `--t-section`/800); `.ring-track` `--track`, `.ring-fill` `--fill`; estado `.good`/`.over` en el arco.
  El número central cuenta con TRKNum.
- **Hoy:** dentro de una `.card` de 16 (`.hero`), con brillo (`drop-shadow` con `--good-glow`/`--bad-glow`) que se corta en
  cuadrado y un punto dibujado al 0 %.
- **Objetivo G3** (BRAND §4): sin tarjeta de 16 ni brillo; panel de lectura plano o de vidrio sutil (se elige en G0); color
  solo en el arco y en `left/over`.

### 7.29 `.u-hit` (pendiente G4)

- **Rol:** que todo control de texto o glifo tenga 44×44 de toque sin crecer visualmente (B-11, T-03).
- **Anatomía propuesta:** `position:relative` + un `::after` absoluto centrado de 44×44. Obligatoria en `[verbo]`, flechas
  del día, `[share]`/`[goals]`, el ✕ de ejercicio, celdas de racha, filas del editor de split y ajustes.
- **Hoy:** el patrón existe suelto (`.sgoal::after`, `.lact::after`, `.restbar a::after`, `.hcnav::after`,
  `.toast .tundo::after`); `.u-tap` solo pone el cursor. ~600 toques bajo 44 medidos.
- **La revisa:** `_dsRenderCheck` hit (R-HIT).

### 7.30 Marca gym//TRK

- **Regla (BRAND §3):** `gym` y `TRK` en `--fg`/800, `//` en `--o40`, sin tracking; 22 en pantalla, 16 en overlays y pie de
  compartir, 34 solo en el landing. Una sola variante.
- **Hoy hay seis:** landing `--t-hero` con `//` `--o40` y cursor `.cur`; login y onboarding `--t-display` con `//` `--o50`;
  pie de compartir `.shfoot` todo en `--o35`; arranque `.bootov .bt` al revés (`gym` tenue); wrap `.ws-kick` y `.ws-cardf`.
- **Objetivo G3:** una clase `.mark` (pendiente G3) con sus tres tamaños por contexto.

### 7.31 Íconos TRK

- **Hoy:** `NAVIC` (progress, gym, macros; y stack/agenda sin uso): SVG de línea, viewBox 24, trazo 1.6, puntas
  redondeadas, `currentColor`. `EXSH_SVG` (compartir un ejercicio): viewBox 16, trazo 1.4. Escáner y cámara: sin ícono
  propio (📷 emoji).
- **Objetivo G3** (decisión del dueño 2026-09-21, BRAND §4 y B-08): set propio — rejilla 24, trazo 1.6, **remates
  cuadrados**, geometría ortogonal de consola, `currentColor`, variante sobre chip de vidrio para el chrome. Piezas: share,
  camera, las 3 de la nav y el escáner. Se dibujan en una lámina (G0) y el dueño las aprueba; un ícono nuevo necesita su
  aprobación.
- Orden de preferencia (B-08): palabra > glifo del set (§11) > ícono TRK. Emoji de interfaz: 0.

### 7.32 Overlays

| Overlay | API | Hoy | Objetivo |
|---|---|---|---|
| **Arranque** | `bootScreen()` → `showOverlay(html, {ms:1300, shader:true})`; una vez por apertura (`sessionStorage`), con usuario y ≥1 sesión; tocar cierra | `.bootov` a pantalla completa; `startShader()` (WebGL, el shader de marca) de fondo al .5; líneas `.line` de estado; `[ready]` parpadeando (`.bready`); ▲▼ de `weekly vol` en verde/rojo | G3 (BRAND §4): shader con encuadre correcto (hoy se ve comprimido), apagado con reduced-motion y en segundo plano; líneas que se imprimen una a una; marca única; sin color de veredicto |
| **Recap de las 21 h** | `snapRecap()` → `showOverlay(…, {ms:5000})`; una vez al día (`?recap=1` lo fuerza) | `//HOY · fecha` + líneas con `--good`/`--bad`; `[tap para cerrar]` | G4: evaluar (capa bloqueante cada noche) |
| **Wrap mensual** | `wrapMonthData()` + diapositivas `.wstage` | números de 60 y 44 exentos, `.ws-card` de 16, "captura para compartir" | G4: es el formato de números grandes que el dueño rechazó ("del pito") |
| **Escáner** | `openBarcode()` → `.scan-reticle` | marco `.frame2` de 2 con velo, línea que barre (`scanmove`), fijado en verde con rebote y ✓ de 40 | G4: idioma de botones (`look up` / `capturar` / `cancel`), rol de `capturar`, verde |
| **Compartir un ejercicio** | `openExShare()` → `.exsh` | §7.19 | §7.19 |

---

## 8. Gráficas

Instrumentación, no infografía (B-02: la gráfica existe solo cuando el texto no alcanza). Una lectura por dato por pantalla.

| Gráfica | API / clase | Dónde | Reglas | Vacía |
|---|---|---|---|---|
| **Línea** | `lineChart(vals, opt)`, `chartNums()` | tiles de Progress, detalle de métrica | ver abajo | "sin registros en este rango" |
| **Sparkline** (TRKTrend) | `.trow .trsp` + `lineChart` a 22 de alto sin relleno ni puntos | //FUERZA, //RECORDS | mismo eje de 30 días en todas las filas; sin línea con <2 sesiones | la fila sin línea |
| **Barra fina** (TRKBar) | `.bar`, `.vbar`, `.wprog` | ingesta, //ESTÍMULO, //MÚSCULOS, progreso de sesión, detalle de músculo | §7.15 | la pista sola |
| **Columnas apiladas** | `.slfc` (FASES del sueño) | detalle de sueño | una columna por noche bajo la x de su fecha (mismo margen de eje que la línea), profundo abajo; 4 filas con etiqueta y valor escritos (`.slfr`) | sin columna |
| **Hipnograma** | `hypnoHTML()` → `.hypno` | registro de sueño | escala de opacidad: profundo `--fg` · core `--o50` · REM `--o30` · despierto `--o12` · sin clasificar `--track`; lo no clasificado se ve, no se reparte | no se dibuja |
| **Anillo** (TRKRing) | `ringHTML()` | macros, compartir comida | §7.28; excepción `ring` | anillo vacío (hoy con punto al 0 %: G3) |
| **Radar** | `dayRadar()` → `.macro-rad`, `.msum-rad` | macros (detalle), desglose de comida | etiquetas SVG a `font-size="7.5"` (≈5.9 reales): objetivo G4 etiquetas HTML a 10 o quitarlo (decisión del dueño) | — |
| **Calendario** (TRKCal) | `monthCalHTML()`, `stripCalHTML()` (racha en franja `.strk-row`), `histCalHTML()` (`.hcal`) | racha, historial | un solo blanco en opacidad (`--track` · `--o30` · `--fg`); celda cuadrada `--r-mark`; hoy con contorno `--o40`; **lunes primero** (`L M X J V S D`); sin leyenda; tocar un día lleva a ese día | días vacíos |
| **FC** | `hrChartSVG()` → `.hrsvg` | hoja de sesión | 56 de alto, `--o60`, marca por serie | no se dibuja |
| **Medidor de celdas** ▮▯ | — | — | primitivo de BRAND §5; hoy no existe | — |

**Línea (GRA-1…6):**
1. **Sin dato = hueco.** La línea se corta; nunca un 0 en el piso (`chartNums()` con `gap0` en las métricas diarias donde 0 =
   no registraste). Un día aislado conserva su punto. El 0 real solo donde existe (semanas de volumen).
2. Trazo `--o60` 1.4 en tiles · `--fill` 1.8 en detalle; `vector-effect: non-scaling-stroke`; puntos como trazos de largo
   cero; cada gradiente con id propio.
3. **Detalle:** el rango normal propio (`normalBandFixed()`, p15–p85 de 90 días, un solo par por periodo) son **dos líneas
   de referencia** de .5 en `--o30`, sin relleno; sin 7 días de historia dice `sin normal · N/7 d`. Promedio punteado (sin
   pastilla dentro de la gráfica: el encabezado ya lo dice); último punto con halo; 3 etiquetas Y a la derecha y 4 fechas
   abajo, en HTML sobre el SVG.
4. **Acento solo en el estado** ("en rango / sobre / bajo lo normal"), nunca en la línea.
5. Periodos `7D · 15D · 30D · 3M · 6M · 1A` + ▦ rango propio + `‹ ›` para paginar (`mdPage()`). Gestos: mantener y
   deslizar (scrub), pellizco ↔ (periodo), ↕ (zoom vertical), doble toque (normal). `touch-action:none` solo sobre la
   gráfica.
6. Tendencias 3·7·14·30·90 días (`trendRows()`): flecha acentuada solo si el cambio supera ~1 error estándar; sparkline de
   la media móvil de 7 días.

**Trazos SVG (GRA-7):** dato 1.4 (tiles, anillo grande, radar, FC) · 1.8 (detalle, anillos chicos) · referencia 1 · rejilla
.5; íconos 1.6. La revisa: R-SVGFS.

**No:** gradientes en el detalle, pasteles, barras gigantes redondeadas, brillo, arcoíris, ejes cargados, etiquetas en cada
punto, escalas de color de otras apps, 0 falso. `miniBars()` convierte huecos en 0 y nadie lo llama (G4).

---

## 9. Honestidad y gramática de datos

### 9.1 Señales de honestidad

| Señal | Significa | Dónde |
|---|---|---|
| `~` antes o después de un dato | estimado o deducido | tensión con RIR supuesto, perfil sugerido, % de baja confianza |
| borde punteado | sugerido, falta que lo confirmes | `.pftog.sug`, deriva del split |
| gris .45 (`.pf`) | prefill de la sesión anterior; no cuenta hasta confirmarlo | tabla de sesión |
| hueco en la línea | no hay dato ese día | gráficas |
| "sin baseline" · "sin guía" · "sin definir" · `sin normal · N/7 d` | no hay con qué comparar o no hay evidencia | progreso, landmarks, perfiles, detalle |
| "estimado" vs "observado" | literatura ajustada vs su propio historial | recuperación por músculo |
| "correlación, no causa" | descriptivo, no diagnóstico | //RENDIMIENTO, causas de un ▼ |
| lecturas separadas | nunca una puntuación única | //MÚSCULOS: volumen · estímulo · fatiga · recuperación |
| hallazgo con su evidencia | una sugerencia existe solo si hay números que la respaldan, y se muestran | §7.16 |
| `—` | sin dato | cualquier lectura |

- HON-1: las puntuaciones existen solo en **versión mínima** (decisión del dueño 2026-09-21): `recovery ~43` en una línea y
  `~ retention 62 · Na:K 2.1 →` como fila de diagnóstico que solo aparece fuera de rango. Hoy "water retention" es una fila
  de ingesta con barra N/100, veredicto de color y consejos en modo orden (`bloating()`), y la recuperación sale en héroe:
  objetivo G3.
- HON-2 (v258): la comida aproximada guarda los micronutrientes como `null` (no se conocen; antes 0 reales que falseaban
  el Na:K), `approx:true`, su kcal se lee `~580`, su cantidad `1` (sin los 100 g sintéticos) y la fila de retención
  lleva `~` si el día incluye una.
- HON-3: "mantenimiento real" es una estimación: objetivo G4 `~mantenimiento` + confianza.

### 9.2 Qué texto se queda

*Estado sí · instrucción no · definición al glosario.*

| Tipo | Ejemplo | Regla |
|---|---|---|
| **Estado** | "sin baseline", "4/14 d", "hoy: comida + gym ✓", "sin clasificar 42 m" | se queda: es dato |
| **Instrucción de gesto** | "mantén y desliza… pellizca ↔… doble toque" | **fuera**: el gesto se descubre tocando |
| **Pista de una vez** | "desliza una serie → para borrarla" | una sola vez por dispositivo (`hintSeen()`/`hintMark()`), nunca en cada render |
| **Definición** | "MEV/MAV/MRV", "correlación, no causa", "estimado vs observado" | al glosario `data-gloss` |
| **Regla del sistema** | "solo se corta el día en que no registras ni comida ni gym" | al glosario; en pantalla, solo el estado |

### 9.3 Gramática de series, números y fechas

Una forma de escribir cada tipo de dato, con su función (NUM-1). La revisa: a ojo · self-checks.

| Dato | Forma | Función hoy | Estado |
|---|---|---|---|
| Serie (línea de registro) | `160lbs×8@0 / 160lbs×6@0` · drop `↓60lbs×9@0` · lado `R 70kg×10@2` | `shTokTxt()` desde `shExModel()` | en compartir; **objetivo G4**: historial y vista previa también (hoy `shareExLines()` escribe `60×11 RIR2 · ↓35×8 RIR0 58%`, M3-04) |
| Conteo de series | `18 series` (series de trabajo; drops aparte; par R+L = 1) | `shExModel()` cuenta así; otras listas cuentan distinto (21 vs 18, M3-05) | `seriesOf()` (pendiente G4) |
| Número de serie | `1, 1.5, 2, 3` (drop = .5, cadena .6/.7) | `setLabels()` | ✓ |
| Lateralidad | `[uni]`/`[bi]` al frente, misma fuente que el nombre; nunca la unidad | `latTxt()`, `exLatTagHead()` | ✓ (B-12) |
| Tipo de ejercicio | una sola forma (`[libre] [máquina] [smith] [cable] [bw]`, propuesta de la auditoría) | hoy 5 formas (`máquina`, `mach`, `pulley`, `machine`, `free`) en `variantChips()` y otros | `typeTag()` (pendiente G4) |
| Carga | `effW()` (peso corporal vivo); `numTxt()` (hasta 2 decimales); `roundLoad()` (kg 2.5 · lbs 5 · pla 1); `kgLoad()` (lbs→kg, placas fuera) | ✓ | e1RM en lbs etiquetado "kg" a mano (M5-04): G4 |
| Lectura suelta | `59.8 kg`: número `--fg`, unidad separada y tenue (`.line .v .u`, `.pval span`) | ✓ | |
| Miles | `2,405` | `toLocaleString()` | ✓ |
| Cambio | `▲ +3%` / `▼ −4%` con signo menos real (−) | badges de progreso | revisar que ningún cambio use `-` (G4) |
| Macros | `48P 71C 4F` · kcal `2,178 / 2,405` | TRKLog, compartir | ✓ |
| Hora | `09:13` | `nowHM()` | ✓ |
| Duración | `1h26` · `42 min` · descanso `1:30` | `shSessModel()`, `elapsedStr()`, `fmtRest()` | ✓ |
| Fecha | `17 sep` · con año `17 sep 2026` · cabecera `sep 2026 · 10` | `fmtShort()`, `fmtDate()` | ✓ |
| Estimado | `~43` | — | ✓ |
| Sin dato | `—` | — | ✓ |

Decimales solo cuando informan: kg 1, porcentajes 0–1, series 1. Unidades por dominio: peso corporal en kg; cargas en la
unidad de cada ejercicio (`exDisplayUnit()`); la unidad se ve en el `<select>` de cada serie y en compartir.

---

## 10. Movimiento

**Firma (B-09): el contenido imprime, el chrome se desliza.** El contenido cambia al instante o con opacidad + ≤4 (`--mv-1`
(pendiente G4)). Solo el chrome (nav, sheet, toast, popover) se mueve como vidrio. **Un movimiento visible por toque.**
Reduced-motion = instantáneo.

- MOV-1: se anima solo un **cambio de estado**: nunca un re-render de la misma pantalla (cada tecla re-renderiza). Lo que
  `render()` reconstruye se anima solo por `afterPaint()` (§7.18). La revisa: R-MOTION.
- MOV-2: solo `transform` y `opacity`. Nada de animar `width`, `height`, `top`, `left`, `padding`, `gap` ni `grid-*`.
- MOV-3: `transition` solo en nodos que **persisten** entre renders (en un nodo que `render()` rehace, nunca se ve: X1-09).
- MOV-4: los bucles son solo funcionales, en `steps()` o lineales, con id `loop` y `animation:none` con reduced-motion.
- MOV-5: sin rebote, elástico, parallax, animaciones infinitas decorativas ni "que se sienta premium". Presionado:
  opacidad o `scale(.98)`.
- MOV-6: con reduced-motion todo es instantáneo y los bucles se vuelven un glifo quieto. La regla global
  (`*{transition-duration:.01ms; animation-duration:.01ms; animation-iteration-count:1}`) corre cada bucle una sola vez
  (v258: antes un bucle a .01 ms parpadeaba) y los cinco `scrollIntoView` suaves usan
  `behavior:reducedMotion()?'auto':'smooth'` (X1-03).

### 10.1 Registro de movimiento (todo lo que se mueve en v262)

Leyenda de la última columna: ✓ cumple B-09 · ⚠ a revisar con el dueño · ✗ se corrige (fase).

**Animaciones CSS (`@keyframes`)**

| Animación | Disparador | Propiedad | Duración | Easing | Propósito | Reduced-motion hoy | B-09 |
|---|---|---|---|---|---|---|---|
| `viewin` (`.fadein`) | `go()` cambia de pantalla | opacity .4→1 · translateY 4→0 | `--dur-screen` | `--ease-out` | continuidad de pantalla | .01ms (global) | ✓ |
| `rowin` (`.enter`, `.tsel`, `.gloss`) | lo agregado (`state._enter` → `applyEnter()`); abrir un popover | opacity 0→1 · translateY −4→0 | `--dur-2` | `--ease-out` | "esto es nuevo" | `applyEnter()` no corre; popovers .01ms | ✓ |
| `chkpop` (`.dchk.pop`, `.pairdone.pop`) | ✓ de una serie (`state._pop`) | scale .6→1.18→1 | `--dur-1` | `--ease-out` | confirmación | no corre | ⚠ único rebote del contenido (§1) |
| `mdslide` (`.mdmeal`) | **cada render** con el detalle de comida abierto | opacity · translateY −4 | `--dur-2` | `--ease-out` | abrir detalle | .01ms | ✓ v258: solo al abrir, vía `state._enter` (X1-02) |
| `sheetin` / `sheetout` (`.modal.in .sheet`, `.modal.out .sheet`) | `openModal()` desde cero / `closeModal()` / capa de decisión | translateY −100%↔0 | entrada `--dur-3`, salida `--dur-2` | `--ease-out` / `--ease-in` | el chrome baja y sube | .01ms; `askLayer()` no pone `.in` | ✓ chrome |
| `scrimin` / `scrimout` (`.modal.in`, `.modal.out`) | idem | background-color | `--dur-2` | `--ease-out` / `--ease-in` | el fondo se oscurece | .01ms | ✓ chrome |
| `toastin` / `toastout` (`.toast`, `.toast.out`) | `toast()` / cierre | opacity · translateY 10 / 8 | `--dur-3` | `--ease-out` / `--ease-in` | el aviso llega y se va | .01ms | ✓ chrome (revisar con `--mv-1` en G3) |
| `restdone` (`.restbar.fin`) | fin del descanso | border-top-color → `--good` | .5s × 3 (`loop`) | ease | aviso | .01ms | ✓ excepción `loop` |
| `blink` (`.cur::after`) | landing | opacity en pasos | 1.15s infinito (`loop`) | `step-end` | cursor ▌ | `animation:none` | ✓ |
| `blink` (`.bootov .bready`, `.wnav`) | arranque, wrap | opacity en pasos | 1.15s / 1.5s infinito | `step-end` | "listo" / "toca" | una vez (v258) | ✓ |
| `spin` (`.spin`, `.fa-spin`) | cargas (OpenFoodFacts, IA, OCR) | rotate 360 | .7s infinito (`loop`) | linear | cargando | una vez (v258) | ✓; G4 spinner de texto |
| `scanmove` (`.scan-reticle .scl`) | escáner buscando | `top` 30%↔70% | 2s infinito | ease-in-out | "buscando" | `animation:none`, línea al centro | ⚠ anima `top` (excepción `scanner`) |
| `bcpop` (`.scan-reticle.hit .frame2`) | código detectado | scale 1→1.06→1 | `--dur-3` | `cubic-bezier(.2,1.3,.4,1)` literal | fijado | .01ms | ✗ G4: rebote fuera de lista, easing literal |
| `bcchk` (`.scan-reticle.hit .chk`) | código detectado | opacity · scale .4→1.15→1 | `--dur-3` | `--ease-out` | ✓ grande | .01ms | ✗ G4: rebote |
| `wsin` (`.wstage`) | cada diapositiva del wrap | opacity · translateY 10 | `--dur-3` | `--ease-out` | pasar diapositiva | .01ms | ✗ G4 (10 > 4; el wrap es el formato rechazado) |
| `faPop` / `faFade` | ninguno (CSS muerto desde U2) | — | — | — | — | — | G4: borrar |

**Transiciones CSS**

| Qué | Disparador | Propiedad | Duración | Easing | Reduced-motion | B-09 |
|---|---|---|---|---|---|---|
| `.nav a`, `.nav a .lbl` | cambia la pestaña activa (nodos persistentes) | gap · padding · `grid-template-columns` · background · color · opacity | `--dur-3` / `--dur-2` | `--ease-out` | .01ms | ✗ G3: anima layout; la nav nueva no lo hace |
| `.mdtabs .tabind` (TRKTabs) | `slideTabs()` al cambiar de pestaña | transform · width | `--dur-2` | `--ease-out` | no se anima | ⚠ anima `width` del indicador |
| `.ring-track`, `.ring-fill` | cambia el valor del anillo | stroke · stroke-dasharray · stroke-dashoffset | `--dur-3` | `--ease-out` | .01ms | ✗ G4: el nodo se rehace, no se ve (el número sí cuenta) |
| `.chev`, `.hrow .hchev`, `.lt .lx`, `.mchev` | abrir / plegar | rotate 90° o 180° | `--dur-2` | `--ease-out` | .01ms | ✗ G4: nodo rehecho; objetivo cambio de glifo `›` ↔ `▾` instantáneo |
| `.cell .sub`, `.cell .cap` | cambia el estado del anillo | color | `--dur-2` | ease | .01ms | ✗ G4: nodo rehecho |
| `.ptile.tap` | presionar una tile | transform scale .98 · opacity .85 | `--dur-1` | `--ease-out` | .01ms | ✓ (las tiles salen en G3) |
| `.bootov` / `.bootov.out` | cerrar un overlay (toque o tiempo) | opacity | `--dur-2` | `--ease-out` | .01ms | ✓ |
| View Transition catálogo → perfil (`::view-transition-group(exname)`, root) | tocar el nombre en el catálogo | morph del nombre al título · fundido | `--dur-3` / `--dur-2` | `--ease-out` | no se usa con `reducedMotion()` | ⚠ contenido que viaja |

**Motores en JS**

| Motor | Disparador | Qué mueve | Duración / easing | Reduced-motion | B-09 |
|---|---|---|---|---|---|
| TRKNum `animNums()` | un `data-nk` ya pintado cambia de valor | el texto cuenta hasta su valor | `--dur-3` · ease-out cúbica en JS | no cuenta | ✓ (v258: en macros la clave lleva `@<fecha>`: cambiar de día no cuenta desde el anterior, X1-08) |
| TRKBar `animBars()` | un `data-bk` ya pintado cambia de ancho | width (`el.animate`) | `--dur-2` · easing de `--ease-out` escrito literal | no anima | ⚠ anima `width` (§1) |
| TRKTabs `slideTabs()` | cambia la pestaña elegida | ver transiciones | — | — | — |
| TRKRow `flipCapture()` / `flipPlay()` vía `reRender()` | agregar, borrar o reordenar filas | translateY Δ→0 (`el.animate`) | `--dur-2` · easing literal = `--ease-out` | no anima | ⚠ contenido que se mueve más de 4 (§1) |
| `applyEnter()` | `state._enter` / `state._pop` | clases `.enter` y `.pop`; con `{scroll}` hace `scrollIntoView` suave | — | no corre | ✓ |
| Deslizar para borrar | arrastre horizontal ≥9 en una fila `data-swipe` | translateX sigue al dedo (máx. 140), opacity ≥.3; al soltar ≥76: sale a translateX 60% y opacity 0 y se borra; <76: vuelve | `--dur-2` · `--ease-in` / `--ease-out` (en línea) | la salida es instantánea | ✓ sigue al dedo |
| Arrastrar para reordenar | mantener el asa `.dgrip` | `.dragghost` sigue al dedo; origen `.dragsrc` a .3; marca de 2 `--fill` donde cae; al soltar, TRKRow | directo | — | ✓ |
| TRKHold `holdConfirm()` | mantener el botón | `.hold-fill` scaleX 0→1 + texto "armando N%" | 900 · linear | **no mira la preferencia** (es un temporizador) | ✓ temporizador |
| Sheets `openModal()` / `closeModal()`; capa `askLayer()` / `closeAsk()` | abrir / cerrar | clases `.in` / `.out`; el fantasma se borra a los 200 | — | `askLayer()` no anima | ✓ chrome |
| Toasts `toast()` | aviso | clase `.out` a los `--toast-life` / `--toast-life-err`; se borra a `--dur-3` | — | .01ms | ✓ chrome |
| Arranque `bootScreen()` + `startShader()` | abrir la app | lienzo WebGL en bucle `requestAnimationFrame` (1300 y fuera) | 1300 | **no se apaga** con reduced-motion ni en segundo plano (T-11) | ✗ G3 (BRAND §4) |
| Recap `snapRecap()` | primera apertura después de las 21 h | overlay 5000 | 5000 | .01ms | G4 |
| Escáner | `startScan()` | bucle de decodificación (~360), pausa de 430 tras fijar, vibración 55 | — | la línea se detiene | ⚠ excepción `scanner` |
| Scrub de gráfica | mantener y deslizar | línea punteada y punto siguen al dedo; se ocultan a los 1600 | directo | — | ✓ |
| Pellizco de gráfica | dos dedos | cambia el periodo o el zoom vertical (se repinta el sheet; el indicador de TRKTabs viaja) | — | — | ✓ |
| TRKWheel `trkWheel()` | girar la rueda | `scroll-snap` nativo; el marcado cambia en el evento | nativo | nativo | ✓ |
| `scrollIntoView` suave | foco tras un ✓ (`state._focusSet`), primer RIR (`state._autoScroll`), `[+ exercise]`, ir a la serie en curso, día del historial | scroll | nativo | los cinco miran `reducedMotion()` (v258) | ✓ |

Hoy un ✓ dispara 4 o 5 movimientos a la vez (pop, barra, número, foco con scroll suave): objetivo G4, uno visible por
toque (X1-10).

---

## 11. Glifos, íconos y emoji

### 11.1 Diccionario `GLYPHS` (cerrado; un glifo = un significado)

Espejo de BRAND §3 y de la constante `GLYPHS` de `index.html` (`'✓○▲▼⠿›‹▾▶↓✕↩~⚠▌×@/→#—'`). Cualquier otro símbolo en un
texto de interfaz es una desviación; las etiquetas que escribe el dueño no cuentan. La revisa: R-GLY · `_dsRenderCheck`
glyph.

| Glifo | Significa | Hoy se usa en | Texto para lectores de pantalla |
|---|---|---|---|
| ✓ | hecho | `.dchk`, `.pairdone`, toasts de éxito, `✓ AM` | "hecho" |
| ○ | pendiente | `.dchk` sin confirmar | "pendiente" |
| ▲ ▼ | cambio (sube / baja) | badges de progreso, //FUERZA, detalle | "sube 3 %" / "baja 4 %" |
| ⠿ | arrastrar / reordenar | `.dgrip`, fantasma de arrastre | "arrastrar" |
| › | entrar / abrir detalle | `.rchev`, `.nvm-x`, `.ptchev`, `.lx`, `.mchev` | "abrir" |
| ‹ | atrás / anterior | `.dnav`, `.hcnav`, flechas de rotación | "anterior" |
| ▾ | desplegar / elegir | `.umcaret`, `.sgoal .cv`, `[ ver rutina ▾ ]` | "elegir" |
| ▶ | empezar / continuar | `▶ start workout`, `▶ resume workout`, `▶ continuar` | "empezar" |
| ↓ | drop set | `[↓ drop set]`, series de drop | "drop" |
| ✕ | quitar | toast de error, ✕ de ejercicio, `.lc .x` | "quitar" |
| ↩ | deshacer | `.footer .undo` | "deshacer" |
| ~ | estimado | `~T`, `~` de sugerido | "aproximado" |
| ⚠ | aviso | toasts de error, alimentos a revisar | "aviso" |
| ▌ | cursor (solo arranque y vacíos) | `.cur` del landing | — |
| × @ / → # | notación de series y datos | `160lbs×8@0 / …`, `→ acción` del diagnóstico, `#músculo` | — |
| — | sin dato | lecturas vacías | "sin dato" |

- GLY-1: **un glifo, un significado.** Hoy se rompe: `▲▼` también reordena en el editor de split y en la hoja de sesión
  (M1-04, M3-10 → `⠿` o menú, G3); `~` también significa "tomado tarde" en el stack (G4); `›` también gira para
  desplegar en TRKLog (el significado de desplegar es `▾`; G3/G4).
- GLY-2: los glifos llevan `aria-hidden` y el control lleva `aria-label` con la palabra (hoy VoiceOver lee "black
  up-pointing triangle": G4, T-12).

### 11.2 Puntuación tipográfica (no son glifos de interfaz)

`·` separador de datos (el más usado) · `–` rango (`61.1 – 62.1 kg`) · `−` signo menos real (obligatorio en cambios) ·
`…` tarea en curso (`… sincronizando`) · `¿ ¡` · `≤ ≥` en texto. Se escriben como texto, no como glifos. (La constante
`GLYPHS` no los incluye; R-GLY y `_dsRenderCheck` deben tratarlos como puntuación.)

### 11.3 Fuera del set, en uso hoy (se reemplazan)

| En uso | Dónde | Reemplazo | Fase |
|---|---|---|---|
| ⓘ | ficha de un suplemento | `[?]` | G3 |
| ⎘ | `⎘ duplicar` (comida) | `[duplicar]` | G3 |
| ✎ | `✎ editar sets`, `✎ editar detalles…`, código de barras | `[editar]` | G3 |
| ◦ | "comunidad" en resultados de comida | nada (solo se marca la excepción `⚠ revisa`) | G3 |
| ▸ ▴ | resumen de bloques del stack, `▸ ver tu wrap`, `[ ocultar rutina ▴ ]`, `.wline` | `›` o nada | G3 |
| ← | `← back`, `← regresar`, `← músculo` | `‹` | G3 |
| ✗ | "saltada" en el stack | `✕` | G3 |
| ■ | v258: `cerrar a las HH:MM` ya va en gris y sin ■ (M2-09) | G3: `[cerrar a las 14:32]` | ✓ |
| ⋯ | menú de fila del catálogo (`.exmore`) | `.dots3` | G3 |
| ≈ | solo en comentarios del código | `~` | — |
| ⬆ ⬇ ↔ ▦ ▢ ▣ ↻ ↺ ↑ | perfil de resistencia, rango personalizado, elegir en el catálogo, reintentar / recuperado / última vez, "flojas ↑" y "↑ ánimo" | **pregunta abierta** (BRAND no los menciona; §1) | G3 |
| ● ◆ | agenda (pantalla sin acceso) | se borra con la agenda | G4 |
| ▁ ¶ | panel `?design=1`, botón `¶ texto` de la IA | `[minimizar]`, `[texto]` | G4 |

### 11.4 Íconos y emoji

- ICO-1 (B-08): palabra > glifo del set > ícono TRK (§7.31). **Emoji de interfaz: 0.** Lo que el dueño escribe (🥀 en un
  nombre) se muestra tal cual (excepción `user-label`).
- Hoy el único emoji de interfaz es 📷 en compartir un ejercicio (objetivo G3: ícono TRK "camera", excepción `camera`).

---

## 12. Estados

### 12.1 Estados de interacción

| Estado | Cómo se ve hoy | Regla |
|---|---|---|
| default | — | — |
| presionado | `--op-press` .7 (`:active`), fondo `--o10`/`--card2` en filas y botones, `scale(.98)` en tiles | G4: una sola forma de presionar en `:active`; en `[verbo]` = `--fg` |
| foco | `:focus-visible` con contorno 1.5 `--fg` y 2 de separación; `:focus` sin contorno | siempre visible con teclado; verificar en controles que no son `<button>` (G4) |
| seleccionado | relleno `--fill` + texto `--on-fill` (toggles, TRKSelect), contraste (`.on`) | — |
| deshabilitado | `--op-disabled` .4, `aria-disabled` en `--o30`, flechas apagadas en `--o20` | misma estructura |
| éxito / error | semántico + texto (toast, `.savebar`) | nunca solo color |

Un componente **no** cambia de estética por estado: cambian opacidad, superficie, borde o color, nada más. En móvil no hay
hover.

### 12.2 Estados por módulo

Cada sección tiene su vacío `// …` y cada módulo sus finales explícitos (EST-1). Forma: `// sin registros · [+ acción]`;
error `⚠ qué pasó · qué hacer`; sin conexión `⚠ sin conexión · [reintentar]`.

| Módulo | Vacío (hoy) | Pocos datos | Cargando | Error / sin conexión |
|---|---|---|---|---|
| Gym | cabecera `//GYM sin split` + `+ crear split`, `explorar splits`, `importar` | recuperación con "pocos datos"; "sin baseline" en series | — | — (local) |
| Sesión | — | prefill vacío; "sin baseline" | — | guardado fallido: `.savebar` permanente + TRKAsk "no se pudo guardar" |
| Macros | `no meals logged`, `no water logged` (inglés: G3 → español) | — | búsqueda en línea con `.fa-spin` | OpenFoodFacts falla **en silencio** y un código que no se pudo buscar sale como "no encontrado" (M4-09 → G4: `// 0 resultados` · `⚠ sin conexión · [reintentar]` · resultados) |
| Progreso | **activada = recuadro (v263):** una métrica encendida en `[config]` dibuja su tile aunque no tenga un solo dato — sin tile no hay por dónde registrarla. Vacío = `emptyTile()`: `—` + `sin registro`, y el recuadro entero abre su registro (volumen/tensión/e1rm → `loglater`; FC en reposo/HRV/energía activa → su hoja). "sin registros en este rango", "sin volumen registrado en este rango", "aún no hay levantamientos con peso × reps" | `sin normal · N/7 d`, diagnóstico "pocos datos" | — | — |
| Historial | "sin sesiones registradas" | — | — | sesión inexistente en compartir (G4) |
| Stack | "stack vacío", "no toca nada hoy ✓" | — | — | — |
| Compartir | "sin sesión para compartir", "sin series registradas", "sin alimentos este día", "aún sin series con peso y reps" | — | `… generando imagen` | `⚠ no se pudo generar la imagen` |
| Ajustes · salud | — | — | `… sincronizando salud` | `⚠ …` del sync; errores de permisos en el log |
| Escáner | — | — | cámara abriendo | fallback a foto, búsqueda por nombre y tecleo |

Objetivo G4: completar la tabla con el texto exacto de cada celda vacía y una acción por vacío.

---

## 13. Accesibilidad, sonido, vibración y tema

### 13.1 Decisiones de accesibilidad (lo que se sacrifica, a sabiendas)

| Decisión | Criterio WCAG que se sacrifica | Por qué | Compensación |
|---|---|---|---|
| **Zoom bloqueado** (`maximum-scale=1, user-scalable=no`; excepción `vp-lock`) | 1.4.4 cambio de tamaño del texto | sensación de app nativa, sin zoom accidental en la serie | campos a 16; texto nunca bajo `--o40` |
| **Texto de 10** (`--t-label`) | ninguno formal (las skills piden 11) | densidad de terminal | solo en meta y rótulos, nunca en datos que se leen en la serie |
| **Tabla de 36** (excepción `table36`) | 2.5.5 (44, AAA); cumple 2.5.8 (24, AA) | densidad en la serie | ✓ con toque ampliado (objetivo G4: 44×42) |
| **Bordes bajo 3:1** | 1.4.11 contraste de lo que no es texto | lenguaje de líneas finas | pregunta abierta de BRAND §10 |

### 13.2 Lo que nunca se sacrifica

- A11Y-1 color nunca como única señal (TOK-5).
- A11Y-2 toasts con `aria-live` (`.toasts` polite; el error con `role="alert"`).
- A11Y-3 foco visible (`:focus-visible`).
- A11Y-4 reduced-motion y reduced-transparency respetados (§10, §4.12; hoy con huecos: G4).
- A11Y-5 todo gesto tiene alternativa visible (hoy deslizar para borrar no la tiene: G4, M2-07; WCAG 2.5.1).
- A11Y-6 toque ≥44 (B-11; hoy ~600 menores: `.u-hit` (pendiente G4)). La revisa: `_dsRenderCheck` hit.
- A11Y-7 texto ≥ `--o40` (B-11). La revisa: `_dsRenderCheck` txt.
- A11Y-8 roles accesibles: todo lo tocable es `<button type="button">` con `aria-label` (hoy hay un solo `role="button"` y
  muchos controles son `span`, `i`, `div` o `a` sin `href`: G4, T-12). La revisa: R-A11Y.

### 13.3 Sonido y vibración

- SND-1 **Sonido solo al terminar el descanso**, con su ajuste (`settings.restBeep`): dos chirridos de 880 Hz
  (`restNotify()`); el `AudioContext` se crea dentro del toque del ✓ (`restAudioInit()`) porque iOS lo exige. Ningún otro
  sonido; el toast no suena.
- SND-2 **Vibración**: `navigator.vibrate` al terminar el descanso (200), al levantar una fila para arrastrar (28), al fijar
  un código (55) y al completar un TRKHold (30). **Safari de iOS no vibra**: en el iPhone del dueño la vibración no existe;
  solo funciona en Android y en la app nativa. Nunca es la única señal.

### 13.4 Solo modo oscuro

- THM-1: la app es **solo oscura**. `prefers-color-scheme` se ignora; `theme-color` `#000`, barra de estado de iOS
  `black`, `manifest.json` con fondo y tema `#000000`.

---

## 14. Navegación y pantallas

### 14.1 Primarias y secundarias

- NAV-1: **pantallas primarias** = las tres de la nav (progress · gym · macros): con nav y sin atrás.
- NAV-2: **pantallas secundarias** (sesión, historial, editor de historial, compartir, stack, split, ajustes, catálogos):
  **sin nav** y con un solo atrás. Hoy `renderNav()` oculta la nav en workout, settings, splitedit, history y share, pero
  se ve en histedit, stack y agenda (T-02, G4).
- NAV-3: lo secundario se abre desde una fila `›`, desde `[verbo]` o desde el menú `u/…` (`navmenu` → `.nvm`).

### 14.2 Atrás

- **Hoy:** `statusBar(true)` pinta `← back` (una caja de 68×37 con borde) y `data-act="leave"` siempre manda a gym: se
  pierden el scroll y el contexto; el editor de historial tiene dos salidas distintas (`← back` → gym y `‹ cerrar` →
  historial).
- **Objetivo G4** (T-02): `state._from` (pendiente G3) guarda de dónde vienes con su scroll; un solo `[‹ origen]` de texto
  en la barra de estado, con 44 de toque (`[‹ gym]`, `[‹ historial]`).
- NAV-4: cerrar un sheet **nunca** mueve el scroll de abajo (`reRender()`, no `closeModal(); render()`). La revisa: R-SCROLL.

### 14.3 Mapa por pantalla (v262)

| Pantalla (`state.screen`) | Instrumento | Cabecera | Contenido | Nav hoy | Notas |
|---|---|---|---|---|---|
| `landing` / `login` / `onboard` | primer uso | marca | `.start`, `.field`, `.toggles` | no | M0 sin evaluar (G4): tono de venta, etiquetas en mayúsculas, `← regresar`, marca con `//` en dos opacidades |
| `home` (gym) | estado actual | `statusBar` + rotación + `dayHeadHTML` (`//NEXT`) | línea de preparación, músculos del día, vista previa (`[ ver rutina ▾ ]`), primario, //ESTÍMULO, //STATS | sí | con sesión viva solo existe `▶ resume workout` (v258, M1-01/M1-01b) |
| `workout` | registro | `.wline` (modo enfoque) | tabla de sesión, descanso, footer | no | §7.8, §7.20 |
| `macros` | composición | `statusBar` + día `‹ fecha ›` | anillo en `.card`, detalle (radar, P/C/F, INTAKE, retención), SUPPS → MEALS → WATER | sí | §7.24, §7.28 |
| `progress` | análisis | `.section` //PROGRESS | racha en franja, tiles `.ptile`, //FUERZA, //RECORDS, //MÚSCULOS, //RENDIMIENTO | sí | tiles → filas en G3 |
| `history` | archivo | `.section` //HISTORY | mes TRKCal, rail por mes, sesión que se abre en su sitio | no | |
| `histedit` | corrección | `dayHeadHTML` | tabla de sesión compacta (`.hist-compact`) | **sí (debería no)** | T-02 |
| `share` | resumen | según tipo | §7.19 | no | |
| `stack` | inventario | `.section` //STACK | TRKTabs HOY/TODOS, bloques por momento | **sí (debería no)** | §7.25 |
| `splitedit` | inventario | `.section` //SPLIT | días (`.seday`), ejercicios (`.seex`), deriva (`.sedrift`) | no | ▲▼ para reordenar y ✕ sin deshacer (G4) |
| `settings` | utilitario | `.section` //SETTINGS | //PERFIL, entrenamiento, //SALUD, datos (`sync data`, `espacio`, `export`, `import`, `reset data`) | no | `reset data` igual que `export` (M6-19); cinco nombres para el respaldo (M6-11) → G4 |
| `agenda` | — | — | sin acceso desde v226 | — | código muerto (`renderAgenda()`, G4) |
| overlays | — | — | §7.32 | — | — |

---

## 15. Excepciones

Toda excepción es funcional y tiene **id de categoría** (BRAND §6). En el CSS se marca pegada a la declaración. Hoy el
marcador es `/*ds:exempt*/` sin id (33 declaraciones en 29 reglas); objetivo G4: `/*ds:exempt:<id>*/` con un id de esta
lista (R-EXEMPT). Marcar algo como exento exige que esté aquí (EXC-1).

| Id | Qué exime | Usos actuales |
|---|---|---|
| `ring` | el anillo de kcal (macros y compartir comida): única gráfica circular | `.ring.lg .num` tracking −1px. Hoy también el brillo del anillo (`drop-shadow`, sin marca), que sale en G3 |
| `table36` | tabla de sesión con celdas de 36 y campos a 12 (densidad en la serie); el ✓ amplía su toque con `::after` | sin marcador CSS (es la anatomía de §7.8) |
| `boot` | shader de marca del arranque (única excepción de fondo animado) y su tipografía | `.bootov .bt` tracking .02em; `startShader()` |
| `wrap` | overlay de un solo mensaje del wrap mensual | `.ws-big` 60 y tracking −2px · `.ws-month` 44 y −1.5px · tracking de `.wnav`, `.ws-lbl`, `.ws-sub`, `.ws-kick`, `.ws-year`, `.ws-cardh`, `.ws-cardf`, `.ws-share` (el wrap se reevalúa en G4: formato rechazado) |
| `scanner` | overlay de cámara | `.scan-reticle .chk` 40 · `.scan-reticle .scl` (bucle, también `loop`) |
| `loop` | bucles funcionales: única animación infinita permitida | `.restbar.fin` (3 destellos) · `.cur::after`, `.bootov .bready`, `.wnav` (`blink`) · `.spin`, `.fa-spin` (`spin`) · `.scan-reticle .scl` (`scanmove`) |
| `geom` | geometría atada al JS o centrado óptico de puntos | `.chwrap` y `.chxs` (40 de columna de etiquetas Y = `.chscrub right`) · `.slfc` (mismo margen de eje) · `.chsd` −5 (punto de 10) · `.strk-row .cd.t.l0::after` y `.cm .cd.t.l0::after` −1.5 (punto de 3) · `.dots3` (la sombra dibuja los puntos 2 y 3) · `.ag-hr i` 30 (agenda, muerta) |
| `vp-lock` | zoom bloqueado (§13.1) | meta viewport |
| `camera` | ícono TRK de cámara en compartir un ejercicio (lo que el dueño pone en sus historias) | hoy `.exsh .camon::before` con el emoji 📷 (objetivo G3: ícono TRK) |
| `user-label` | emoji dentro de las etiquetas del dueño | datos, sin marcador |
| `dev` (propuesta G1, no está en BRAND §6) | panel `?design=1`, fuera del alcance del sistema | `.dz-h` 11 y tracking .3px · `.dz-h button` 14 |

Otras excepciones funcionales sin marcador: el sheet **anclado arriba** (evita el teclado de iOS) y `--info` solo para el
déficit calórico.

---

## 16. Prohibido (técnico)

BRAND §7 manda (emoji de interfaz, shaders fuera del arranque, blur en contenido, píldoras y tarjetas redondeadas en
contenido, segundo primario, color en frases, puntuación en héroe, instrucciones impresas, texto bajo `--o40`, renombrar
etiquetas, compartir con números gigantes, confeti/XP/mascotas/FOMO, fuentes nuevas, peso 600). Además, en el código:

- valores fuera de token (tamaño, espacio, radio, color, sombra, duración, z) sin id de excepción;
- gradientes CSS (salvo el relleno SVG de las tiles), brillo, sombras decorativas;
- `style=""` fijo (usa una utilidad o un componente);
- animar re-renders, animar layout, `behavior:'smooth'` literal, bucles sin `animation:none` con reduced-motion;
- `alert()`, `confirm()`, `prompt()` (se usan TRKToast, TRKAsk, TRKHold, TRKPrompt);
- `closeModal(); render()` (se usa `reRender()`);
- `<a download>` en la app instalada (se usa `saveFileSafe()`);
- 0 falso en gráficas; tarjeta por cada dato; anillos fuera de macros y compartir comida;
- placeholders de relleno ("+ machine"); la unidad en el corchete frontal; la unidad en texto libre;
- componentes de librerías externas sin adaptar (§19).

---

## 17. Protocolo para implementar

### 17.1 Cómo usan esto los agentes de IA

1. Leen en este orden: `BRAND.md` → §17.2 → §17.3 → la ficha del componente (§7) → tokens (§4) → §17.6. **Nunca
   implementan desde `DESIGN_CHANGELOG.md`.**
2. Antes de crear algo, buscan un componente o motor `TRK*` que ya exista (§7.18).
3. Usan las skills como **rúbrica de principios** (§19). Si una skill choca con BRAND, gana BRAND y lo anotan como
   pregunta para el dueño en lugar de decidir.
4. Citan el ID de regla (B-xx y los de esta referencia) en cada cambio y corren las herramientas antes de dar algo por
   terminado.
5. Nunca cambian sin aprobación del dueño lo que marca PRI-7 (look).

### 17.2 Esqueleto de pantalla

1. `statusBar(back)`: primarias sin atrás; secundarias con `[‹ origen]` (hoy `← back`) y sin nav.
2. **Una** cabecera: `dayHeadHTML()` en la familia gym, o `//MÓDULO` + meta a la derecha.
3. **≤4 secciones** (`hr.rule` + `.section`), hechas de líneas de registro (`.srw`) o de lectura (`.line`).
4. Un vacío `// …` por sección.
5. Como mucho **un primario**, abajo.
6. Nada de tarjetas salvo un panel aprobado.

### 17.3 Árbol de decisión de acciones

- ¿Es **la** razón de ser de la vista? → **primario** (uno solo, abajo).
- ¿Es una acción puntual dentro de los datos o secundaria? → `[verbo objeto]` + `.u-hit` (pendiente G4).
- ¿Eliges entre opciones que se excluyen? → `.toggles`.
- ¿Es una decisión dentro de un sheet? → `.sheetbtns` (un `.ok`).
- ¿Es irreversible? → **TRKHold**. ¿Es reversible? → acción inmediata + toast con `[deshacer]`. ¿Cambia el flujo? →
  **TRKAsk** (§17.4).
- ¿Abre un detalle? → fila `.line.lnav` (o de la familia B) que termina en `›`.
- ¿Es un dato editable? → caja de campo: formulario (44) o tabla (36).
- ¿Es una lista de ejercicios? → **siempre** `.srw`.
- ¿Es una lectura? → `.line` o TRKTrend, nunca una tarjeta.
- ¿Hace falta un ícono? → primero la palabra, luego un glifo de `GLYPHS`. Un ícono TRK nuevo requiere la aprobación del
  dueño.
- ¿No está en el registro `TRK*`? → se agrega al registro **antes** de usarlo.

### 17.4 Acciones con consecuencias

Regla (CON-1): **irreversible → TRKHold · reversible → toast + `[deshacer]` · cambia el flujo → TRKAsk.** Y (CON-2): **lo
que crea o reemplaza una sesión se oculta mientras hay una viva.** La revisa: R-SESS (`_sessSafetyCheck()`).

| Acción | Hoy | Objetivo |
|---|---|---|
| abortar sesión | TRKHold | `[abort]` sin `--abort` (G3) |
| borrar sesión (dos lugares), borrar día del split, borrar una comida completa, borrar un suplemento con su historial | TRKHold | — |
| cargar un respaldo (reemplaza todo) | TRKHold (`confirmReplace()`) | — |
| borrar todos los datos | TRKHold | `[borrar todos los datos]` en `--bad`, al final y separado (M6-19) |
| quitar un alimento · quitar un vaso de agua | toast + `[deshacer]` | — |
| guardar sesión | TRKAsk ("finalizar la sesión") + toast | — |
| cambiar un ejercicio con series · adoptar el split · unir ejercicios · registrar sin código | TRKAsk | — |
| borrar peso / sueño / ánimo / FC en reposo de un día | TRKAsk | reversible → toast + `[deshacer]` (G4) |
| borrar una serie (deslizar) | inmediato; TRKAsk solo si se lleva drops con datos | toast + `[deshacer]` + menú al mantener el número (G4, M2-07) |
| `↩` | v258: deshace el último ✓ por su hora (`doneAt`), conserva peso/reps/RIR y avisa con toast + `[deshacer]` | ✓ (M2-08) |
| quitar un ejercicio del split (✕) | sin confirmación ni deshacer, a 1 del ▼ | desde el editor del ejercicio, con toast + deshacer (G4, M1-04) |
| `rest day` · `skip day` | inmediato, sin deshacer; con sesión viva ya no existen ni corren (v258, M1-01b) | toast `✓ día saltado · sigue <día>` + `[deshacer]` (G4, M1-03) |
| `[+ log past session]` | oculto y bloqueado con sesión viva (v258, M1-01) | ✓ |
| recuperar una sesión al arrancar | v259: se copia antes a `gymtrk_live_pending`; solo `[recuperarla]` o `[descartar]` deciden; tocar fuera la deja para el siguiente arranque; con otra sesión viva no la pisa | ✓ |
| `▶ continuar` una sesión pasada | v258: la original sigue en el historial hasta guardar (guardar la reemplaza, sin mover la rotación); abortar la deja intacta y restaura la rotación (M3-09) | ✓ |
| registrar manualmente desde el escáner | v258: guarda en la comida elegida (`window._faTag` se lee antes de cerrar el sheet, M4-08) | ✓ |

### 17.5 Inventario primero

Ninguna fase arranca editando: arranca midiendo (auditor + lectura de lo que toca) y escribe la tabla "actual → objetivo"
con valores. Lo no previsto **se agrega a la tabla con su valor antes de corregirlo**: nada se arregla "de pasada" sin
quedar registrado. Antes de escribir UI se responde por escrito:
0. ¿Qué componente `TRK*` resuelve el comportamiento? Si ninguno, se agrega al registro primero.
1. Propósito y jerarquía (qué se lee primero).
2. Acción primaria y secundarias (§17.3).
3. ¿Existe un componente? → reutilizar. ¿Es variante? → modificador. ¿Categoría nueva? → ficha nueva en §7 en el mismo
   commit.
4. Tokens (ninguno literal), colores semánticos y su porqué, gráfica (si la hay: la representación más eficiente en
   lenguaje TRK, no la más bonita).
5. Estados: vacío, pocos datos, cargando, error, sin conexión, sugerido/estimado (§9, §12.2).
6. Movimiento: qué cambio de estado comunica (§10).

### 17.6 Definición de terminado

- [ ] `node tools/ds-audit.cjs --strict` pasa contra la línea base (`tools/ds-baseline.json`, se guarda en G1).
- [ ] `?selftest=1` pasa, incluidos `_dsRenderCheck` y R-SESS (`_sessSafetyCheck()`).
- [ ] Capturas a 393×852 (y 375×812) de cada estado tocado: normal, vacío, error y reduced-motion, con
  `localStorage.gymtrk_design` borrado.
- [ ] La prueba de 5 segundos de BRAND §8 pasa, con conteos.
- [ ] Ninguna etiqueta del dueño renombrada, en mayúsculas forzadas ni cortada; un idioma por componente.
- [ ] Toda acción da feedback; lo destructivo tiene deshacer o hold.
- [ ] La referencia se actualiza en el mismo commit y `DESIGN_CHANGELOG.md` recibe una línea.
- [ ] Si cambia el look, hay una decisión del dueño registrada en BRAND §9 **tomada en el estudio** (§17.7).
- [ ] Si se tocó el estudio: `node tools/studio/check.cjs` pasa y su prueba de cero escrituras está en verde.

### 17.7 Cambio de look = el estudio primero

1. **Propuesta:** una entrada en `tools/studio/proposals.js` (`hoy | A | B | C`, CSS con su alcance `html[data-v-<id>]`,
   tokens o parches DOM reversibles; nunca en `index.html`). `node tools/studio/check.cjs`, `__studio.measure()` en
   localhost, commit solo de tools (sin bump) y el enlace `…/tools/studio.html?p=<id>` al dueño.
2. **Él elige** viéndola sobre la app real (sus datos o demo), la guarda en un look, la deja reposar y la manda a revisión
   (hoja de elección `TRK-PICK v1 …`).
3. **Registro:** fila en BRAND §9 con fecha y su cita; la propuesta pasa a `decided`; el look enviado se sube a
   `tools/studio/looks.js` (sin sus notas: `tools/` es público).
4. **Implementación:** el commit de G3/G4 hornea la opción de forma nativa en `index.html`, **borra su CSS de
   `proposals.js`** y la marca `shipped: vN`; así "hoy" del estudio pasa a ser el look nuevo. Verificación normal
   (§17.6) y capturas de antes/después.

Lo que no cambia el look (datos, sistema, tokens con su valor de hoy) no pasa por el estudio: se verifica con
`tools/ds-diff.html` (0 diferencias).

---

## 18. Auditoría

### 18.1 `tools/ds-audit.cjs` (estático)

Node puro, sin npm: `node tools/ds-audit.cjs` (con un archivo como argumento audita ese, para comparar contra la versión
anterior). Se corre antes y después de cada cambio de UI; **ningún commit sube un contador P0 o P1** (AUD-1).

**Contadores de hoy** (v262): P0 detectables · tamaños fuera de escala, escala en uso, tokens viejos, peso 800 bajo 12,
pesos · letter-spacing fuera de rol · radios y espaciado fuera de escala · bordes · sombras fuera de token · colores
literales · variables sin definir · excepciones marcadas · `style=""` total y por función · selectores repetidos (la misma
regla propia dos veces en el nivel superior; no cuentan variantes en `@media`/`@supports` ni base + ajuste) · diálogos
nativos · guardados sin feedback · espaciado por token · rol fuera de tabla · campos por debajo de 16 · texto instructivo.
Línea base del 2026-09-21: todos en 0 salvo `style=""` 89, excepciones 33, letter-spacing fuera de rol 1, radios literales
15 y texto instructivo (`swipehint` 1 · `ehint` 6 · `submeta` 114).

**Chequeos nuevos de G1** (los implementa el auditor en esta misma fase; salida `R-xx @ index.html:NNN`):

| Id | Qué mide | Nivel |
|---|---|---|
| R-ROLE | clase de botón sin selector propio (solo con estilo dentro de un padre) | P0 |
| R-GLY | glifos fuera de `GLYPHS` en textos de interfaz; emoji de interfaz | P0 (emoji) / P1 |
| R-SVGFS | `font-size` o `stroke-width` de SVG fuera de escala | P1 |
| R-SEM | color semántico fuera de las funciones de veredicto | P1 |
| R-SAVE | `save()` en una acción sin feedback, deshacer, TRKHold ni TRKAsk | P1 |
| R-SCROLL | `closeModal(); render()` o `render()` en listas editables | P1 |
| R-RAD | radio de contenido >2; flotante distinto de `--r-float` | P1 |
| R-BLUR | `backdrop-filter` fuera del chrome | P1 |
| R-EXEMPT | exención sin id de §15 | P1 |
| R-MOTION | animar layout, bucle sin reduced-motion, rebote no listado, `smooth` literal, animación en un nodo que se re-renderiza | P1 (reduced-motion P0) |
| R-DOC | clase citada en esta referencia que no existe (salvo las marcadas "pendiente"); px fuera de escala en §7; versión de la cabecera ≠ `sw.js` | P1 |
| R-LANG | un componente que mezcla idiomas (lista de palabras por idioma) | P2 |
| R-BRK | `[ ` con espacio o corchete dentro de una caja | P2 |
| R-OK | más de un primario por vista | P2 |
| R-TOAST | toast de más de 42 caracteres | P2 |
| R-OP / R-LH | opacidades o interlineados literales | P2 |
| R-FONT | pesos cargados sin uso | P2 |
| R-A11Y | `data-act` en un elemento que no es botón | P2 |

`--strict` compara contra `tools/ds-baseline.json` (guardada **antes** de arreglar nada) y falla si sube un P0/P1.

### 18.2 En pantalla

- **`_dsRenderCheck()`** (en `?selftest=1`; en consola `_dsRenderReport()`): mide sobre el DOM pintado lo que el auditor
  estático no ve — `ua` fugas de estilo del navegador (letra 13.333, fondo `rgb(240,240,240)`), `hit` toques bajo 44×44
  contando su `::after` (R-HIT), `txt` texto bajo `--o40` (R-TXT), `fsOff` tamaños fuera de la escala (incluido SVG), `blur`
  fuera del chrome, `glyph` glifos fuera de `GLYPHS`. Solo reporta; los umbrales viven en la línea base.
- **R-SESS** (`_sessSafetyCheck()`): con sesión viva, `loglater`, `start`, `rest` y `skip` no cambian `activeWork.id`, no
  mueven `rotIdx` ni agregan o quitan sesiones; continuar + abortar no borra la sesión pasada. Desde v258 es una aserción
  dura (`SELFCHECK R-SESS`): si falla, `?selftest=1` se detiene.
- **Inventario en navegador** (`tools/ds-inventory.js`, se guarda en G1): tamaños, colores→token, radios, sombras, blur,
  tracking, animaciones, glifos y toques por pantalla, con el respaldo real del dueño.

### 18.3 `tools/ds-diff.html`

Para refactors de CSS o de marcado que no deberían cambiar lo que se ve. Copia la versión anterior a `repo/_pre.html` (en
`.gitignore`), sirve `repo/`, abre `/tools/ds-diff.html` y en consola `go2()` → `report()`: corre ~55 escenarios en la
versión anterior y en la actual, lado a lado, y compara 32 propiedades computadas elemento por elemento. Un refactor exacto
da cero diferencias; uno que corrige hacia el sistema da **solo** las que se buscaban. Rompe la caché (`?cb=`); `?a=`/`?b=`
eligen los archivos y `report()` dice qué cargó cada lado. La app tiene CSP sin `eval`: los escenarios llaman funciones
globales del iframe. Desde v260 corre **solo en localhost**, cada frame detrás del guardia del estudio (antes `live:workout`
creaba una sesión real en el almacenamiento) y compara también interlineado, grosor y color de bordes, radio por esquina,
opacidad, sombra, filtro, trazo, blur, outline, transición y animación (57 escenarios).

### 18.7 El estudio (`tools/studio.html`)

Contrato y archivos: `tools/studio/CONTRACT.md`. La app real corre en `<iframe srcdoc>` detrás de
`tools/studio/guard.js`, que se ejecuta antes que la app: `localStorage`/`sessionStorage` en sombra (lectura real,
escritura a memoria; getter de `window` y `Storage.prototype`), sin IndexedDB, sin service worker, sin persistencia ni
caché, sin arranque/recap/wrap automáticos ni avisos de recuperación, exportar/importar/sync en "sandbox", y **falla
cerrado** si algo no queda puesto. El estudio vigila el evento `storage` (una escritura desde un frame = alarma P0) y
`[full test]` compara las firmas de todas las claves `gymtrk*` antes y después de recorrer todo. Pestañas `//SCREENS`
(cada pantalla, hoja, overlay y aviso), `//TUNE` (tokens por rol con rango BRAND y rango "explorar"), `//PROPOSALS`
(`hoy | A | B | C` con su medición de §8), `//LOOKS` (configuraciones guardadas con estado) y `//PLAN` (la ruta G0–G4).
El inspector dice rol, token y usos de cualquier elemento tocado. API para agentes: `window.__studio`.

### 18.4 Severidad

**P0** pierde datos o rompe la identidad a simple vista · **P1** error serio de uso, accesibilidad o consistencia del
sistema · **P2** deuda visible de un módulo · **P3** pulido. (Una sola leyenda para la auditoría y para el auditor.)

### 18.5 Loop de QA visual

Servir `repo/` en 4599 → 393×852 (y 375×812) → borrar `localStorage.gymtrk_design` → sembrar datos (el respaldo real o el
historial de demo) → `go('<pantalla>')` → captura → comparar antes/después. Pantallas mínimas: home, workout, macros,
progress, history, settings, stack, share + sheets (detalle de métrica, perfil de ejercicio, catálogo, músculos, sueño).

### 18.6 Rúbrica de las notas 0–5

Cada módulo se califica en siete ejes: **identidad · jerarquía · consistencia · usabilidad · accesibilidad · movimiento ·
simplicidad**. Una nota se justifica con conteos o capturas, nunca de memoria.

| Nota | Significa |
|---|---|
| 0 | ausente o roto: el eje no existe o rompe la pantalla |
| 1 | contradice el sistema en la mayor parte de la pantalla |
| 2 | la mitad cumple; desviaciones visibles a simple vista |
| 3 | cumple lo principal; desviaciones puntuales listadas |
| 4 | cumple; solo quedan detalles de pulido |
| 5 | ejemplar: se usa como referencia para otras pantallas |

Evidencia por eje: identidad = prueba de 5 s con conteos (BRAND §8) · jerarquía = tamaños y opacidades en uso vs §4.5 ·
consistencia = componentes fuera de ficha, variantes duplicadas · usabilidad = pasos y toques para la tarea principal,
pérdidas de datos · accesibilidad = `_dsRenderCheck` hit/txt, roles, contraste · movimiento = filas del registro §10.1 en
✗ · simplicidad = presupuesto §5.3.

---

## 19. Skills y 21st.dev

- SKL-1: las skills (`ui-ux-pro-max`, `mobile-app-ui-design`, `mobile-design`, `design-critique`, `accessibility-review`,
  `design:design-system`, `ux-copy`) se usan como **rúbrica de principios**: toque, contraste, estados, movimiento con
  sentido, texto claro, datos de consulta (el buscador de `ui-ux-pro-max` sustentó la escala de 5 tamaños y el interlineado
  de lectura). **Sus gustos estéticos no aplican**: acentos, emoji, glassmorphism en contenido, springs, celebraciones,
  verde matrix.
- SKL-2: **si una skill choca con BRAND, gana BRAND** y el choque se anota como pregunta para el dueño. Choques conocidos:
  mínimo de 11 (aquí 10) · perfil "Terminal CLI" con peso 400 y tracking normal (aquí 700/800 y `--ls-caps`) · `blur-purpose`
  contra la nav de vidrio (BRAND la conserva en el chrome) · hojas de iOS que suben desde abajo (aquí bajan desde arriba) ·
  no bloquear el zoom (aquí `vp-lock`) · celebraciones, brillo y emoji (rechazados).
- SKL-3: se evitan como generadores `frontend-design`, `soft-skill`, `gpt-tasteskill`, `stitch-skill`, `imagegen-*` y el
  MCP `magic`/21st.
- **21st.dev (SKL-4):** es un registro de componentes React + Tailwind. Se usa **solo como catálogo de comportamientos**: se
  toma la interacción, se reescribe en JS puro con los tokens de TRK; **nunca se pega un componente**. Licencia "unknown" =
  solo inspiración. Dependencias permitidas: MIT, versión fijada, cacheadas por `sw.js`; hoy **ninguna** (el conteo de
  números es propio). Los candidatos de fondo para el arranque (BRAND §4) se revisan igual: solo el comportamiento, en
  GLSL/JS puro, como propuesta del estudio (`tools/studio/proposals.js`), sobre el arranque real.
- **Regla para cualquier agente:** identificar el componente concreto, documentar qué comportamiento se toma, quitar todo
  tratamiento visual incompatible, reemplazar sus valores por los tokens de este documento, implementarlo como componente
  `TRK*` reutilizable (§7.18) y después correr `node tools/ds-audit.cjs`, `tools/ds-diff.html` y el loop de QA.
