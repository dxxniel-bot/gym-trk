# gym//TRK — DESIGN SYSTEM (referencia del estado actual)

> Referencia del estado actual (v268). **Lee BRAND.md primero**: manda sobre este archivo. Sin historia: DESIGN_CHANGELOG.md.

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
- Medidas: los tamaños de letra van siempre por token (`--t-*`, escala 10·12·14·20·28 desde v267, más `--t-field` 16 solo
  en lo editable). En las fichas de §7 las medidas
  de caja se escriben sin unidad (son px CSS) para no confundirlas con tamaños de letra.

**Regla de oro.** *No diseñes cada pantalla: diseña el sistema y usa el sistema para construir cada pantalla.* Si una
implementación necesita un valor que no existe aquí, primero se decide si es una necesidad funcional nueva (se agrega al
sistema, documentada, en el mismo commit) o una desviación (se corrige).

**Preguntas abiertas** (no se deciden aquí; se cierran con el dueño en el estudio, `tools/studio.html`, G0): las de
BRAND §10 (set de íconos TRK, tarjetas → paneles, `[‹ origen]`, glifos que JetBrains Mono no tiene; el 22-sep el look "1"
cerró el panel del anillo de vidrio sutil, el shader de fósforo y el borde de campo 1 px `--o40`, y el 23-sep, v267, las
esquinas —contenido 4, flotante `--r-float` 8—, la escala 14 · 20, la nav de texto con `>`, el primario y los secundarios
`[verbo]`) y estas, encontradas al escribir la referencia:
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
| **`[comando]`** | `.addbtn`, `.ctrls a`, `.section .meta`, `.fa-acts a`, `.mdacts a`; los secundarios `button.b`, `button.cancel`, `.secondary .b`, `.sheetbtns .cancel`, `.footer .abort`/`.undo` (corchetes por CSS, v267) | toque 44 con `.u-hit` (pendiente G4) |
| **Rejilla de datos** (cajas de 4) | tabla de sesión: `.thead`, `.srow`, `.pair`, `.inp`, `.pick`, `.fs` | la superficie de referencia de B-05 |
| **Medidor** `[███████░░░] 72%` | TRKProgress (v268, §7.33): `trkProgressHTML()` → `.tprog` (lectura de etiqueta con OCR, barra del arranque); las proporciones fijas siguen en las barras finas `.bar`/`.vbar`/`.wprog` | `█░` con octavos `▏…▉` en el borde; ▮▯ no existen en JetBrains Mono. Objetivo G3/G4: una sola forma de medidor por uso |

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
| `--card` | `#0d0d0d` | tarjeta (≈1.08:1 sobre `#000`: casi no se ve); los campos son transparentes desde v267 |
| `--card2` | `#161616` | superficie elevada: popover, chip, fantasma de arrastre, fallback de la nav |
| `--sheet-bg` | `#0a0a0a` | fallback sólido de sheets y toasts de vidrio |
| `--track` | `#191919` | pista de barras, día vacío del calendario, fase sin clasificar |
| `--faint` | `#3a3a3a` | glifo casi apagado (`.chev`, `.ghead .hash`); legado, no se usa en nuevo |
| `--fill` / `--on-fill` | `#f3f3f3` / `#000` | relleno del primario y de lo seleccionado / texto sobre él |

TOK-2 (v264): **todo negro elevado es R=G=B** — los grises tenían el azul 2-7 puntos arriba (matiz 240°) y el vidrio lo amplificaba con `saturate(1.7)`; hoy la saturación del vidrio es 1 y no queda ni un `244`. No hay grises nuevos. Si alguien necesita otro, la pregunta es "¿por qué no es `--card` o `--card2`?".

### 4.2 Texto por opacidad

Todos son `rgba(243,243,243,α)`. **Los nombres son históricos y no son su alfa** (`--o40` = .50); se documentan así y no
se renombran. Contraste calculado sobre `#000`.

| Token | α | Contraste | Rol |
|---|---|---|---|
| `--fg` | 1 | 18.9:1 | valor primario, título, número principal |
| `--o70` | .74 | 10.1:1 | secundario fuerte (texto de alimentos, acción de diagnóstico) |
| `--o60` | .66 | 8.1:1 | secundario, `[acción]`, clave de `.line` |
| `--o50` | .56 | 5.9:1 | rótulo, meta de sección, `//` |
| `--o40` | .50 | 4.9:1 | meta, caption, `.submeta` — **piso del texto** (B-11); borde del campo editable y corchetes de `[verbo]` |
| `--o35` | .46 | 4.2:1 | solo glifos y deshabilitado (hoy también texto: objetivo G4) |
| `--o30` | .40 | 3.4:1 | solo glifos, placeholder y deshabilitado (hoy también texto: objetivo G4) |
| `--o20` | .26 | 2.0:1 | borde de dato denso, ícono apagado |
| `--o12` | .10 | 1.2:1 | separador fuerte, borde superior de barras acopladas |
| `--o10` | .06 | 1.1:1 | separador de lista, fondo de fila abierta o presionada |
| `--line` / `--border` | .08 / .09 | 1.1 / 1.2:1 | divisoria de contenido / borde de tarjeta y control |

- TOK-3: **prohibido crear escalones nuevos** (no existen `--o15`, `--o25`, `--o55`). Hoy queda un literal
  `rgba(243,243,243,.035)` en la agenda (código muerto). La revisa: ds-audit (colores literales), R-OP.
- TOK-4: **texto nunca por debajo de `--o40`** (B-11). `--o35`/`--o30` solo para glifos, placeholder y deshabilitado.
  Hoy hay texto en `--o35`/`--o30` (`~ sugerido`, `pocos datos`, días de la semana del calendario, `[+ nota]`, filas no
  elegidas de la rueda): objetivo G4 (T-04). La revisa: `_dsRenderCheck` txt · R-TXT.
- Bordes y WCAG 1.4.11 (contraste de lo que no es texto, ≥3:1): el campo editable ya lleva `--o40` (4.9:1; look "1" y
  v267). `--border` 1.2:1, `--o20` 2.0:1 y `--o10` 1.1:1 no llegan en tarjetas, datos densos y separadores; no se cambian
  sin su decisión.

### 4.3 Semánticos

| Token | Valor | Contraste | Significa | Nunca |
|---|---|---|---|---|
| `--good` | `#46c98b` | 10.0:1 | evento bueno: ▲, PR, meta cumplida | estado estable ("fresco", "verificado", "tomado"), adorno, badges |
| `--bad` | `#e5675c` | 6.4:1 | baja, sobre el límite, destructivo | decoración, láser, "cerrar" que guarda |
| `--warn` | `#e3b34f` | 10.8:1 | atención, límite suave (cerca de MRV) | categoría neutral |
| `--abort` | `rgba(190,110,110,.55)` | — | corchetes de `[abort]` en el footer de sesión (v267; antes su borde) | cualquier otro uso. Objetivo G3: se retira (`[abort]` en `--o60` que pasa a `--bad` al sostener) |
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
- **Escala única (TYP-1, v267 — el dueño, 23-sep: "14 · 20, más compacto"):** `--t-label` 10 · `--t-data` 12 ·
  `--t-section` **14** · `--t-display` **20** · `--t-hero` **28**, más **`--t-field` 16 solo en lo editable** (input,
  select, textarea: con menos de 16 el iPhone hace zoom al enfocar; nunca en texto que solo se lee). El auditor y
  `_dsRenderCheck` leen la escala de `:root` (`dsScale()` incluye `--t-field`; `DS_SCALE_DEF` = 10·12·14·20·28·16).
  Cualquier otro tamaño está prohibido, **también en SVG**. Exentos solo con id (§15): wrap 60/44, escáner 40, panel
  `?design=1`. Hoy (v267) el CSS usa `--t-label` ×152 · `--t-data` ×98 · `--t-section` ×38 · `--t-field` ×11 ·
  `--t-display` ×13 · `--t-hero` ×4; el radar de macros todavía escribe `font-size="7.5"` en su SVG (objetivo G4, M4-11).
  La revisa: ds-audit (escala, tokens viejos) · R-SVGFS · `_dsRenderCheck` fsOff.
- **Pesos (TYP-2):** 400 texto · 700 énfasis, números, botones y chips · 800 títulos, `//SECCIÓN`, nombre del
  ejercicio, valores display. **600 prohibido** (no se carga; el navegador lo pinta como 700). Desde v260 la URL de la
  fuente solo carga 400 · 700 · 800 (300 y 500 no se usaban). La revisa: R-FONT.
- **Mínimos (TYP-3):** texto ≥10 siempre. **800 nunca por debajo de 12.** 700 a 10 solo en estado semántico (▲▼ %, PR,
  sobre MRV). Campos que abren teclado o picker a `--t-field` 16 (anti-zoom de iOS), salvo la tabla de sesión (`table36`). La revisa:
  ds-audit (peso 800 bajo 12, campos por debajo de 16).
- **Tracking (TYP-4), 4 roles por token:** `--ls-caps` .2em (rótulos en MAYÚSCULAS a 10) · `--ls-title` .12em (títulos
  en mayúsculas; hoy también `.sheet h3` y `.sph .h`) · `--ls-num` −.03em (números de `--t-display` y `--t-hero`) · `--ls-ui` .03em (botones,
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
| Campo (solo editable) | `--t-field` | 400 / 700 (800 al renombrar) | 0 | — | `.field input`/`select`, `#fa_q`, `textarea.ta`, `.slph input`, `.slblk input`, `.mdcust input`, `select.pfsel`, `#pf_gym`, `.pfw`, `.msum-time`, `.gnmin`, `.senm` |
| Glifo de control | `--t-section` | 400 | 0 | tight | `.dchk`, `.pairdone`, `.dnav`, `.lx`, `.mchev`, `.footer .undo`, `.exmore` |
| Fila / dato | `--t-data` | 400 (valor 700/800) | 0 | ui; lectura en compartir | `.line`, `.mit`, `.lc`, `.trow`, `.srw`, `.stq`, `.inp`, `.pick` |
| Acción: botón, chip, tab | `--t-data` | 700 | `--ls-ui` | centrado por alto | `.lact` = `.mdtabs span` = `.nav a` a 700; el primario (`.start` = `.sheetbtns .ok` = `.footer .save`) a 800; los `[verbo]` (`button.b`, `button.cancel`, `.secondary .b`, `.sheetbtns .cancel`) y las opciones sin elegir (`button.t`) a 400, la elegida a 700 |
| Etiqueta, meta, ayuda, vacío | `--t-label` | 400 | `--ls-caps` en MAYÚSCULAS · `--ls-ui` en meta de interfaz · 0 | ui | `.grp-label`, `.whdr .wlbl`, `.submeta`, `.empty`, `.wmeta`, `.thead .cl`, `.setn`, `.exsub .note` |
| Estado semántico | `--t-label` | 700 | `--ls-caps` si es sigla | — | `.lpr` (PR), `.pst`, `.setprog`, `.vst` |

- El total de una comida **siempre** manda sobre sus alimentos: `--t-section`/800 (14) contra 12/400 (decisión del dueño,
  v256).
- `.tselo` (opción de TRKSelect) no es un campo: va a `--t-section`/700.
- Las flechas `‹ ›` nunca pesan más que el dato que mueven.
- Tamaños por pantalla (hoy, v267): gym {10,12,14,20} · sesión {10,12,14} · macros {10,12,14,20} · progreso {10,12,14,20,
  28 en el detalle} · ajustes {10,12,14} · compartir {10,12,14,20}; más 16 en cada campo editable.

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

**Contenido afilado (v267, B-05 reescrita por el dueño el 23-sep):** "el redondeado en general… de los botones, de las
casillas de escribir, siento que es demasiado" · elección "4 px, suave". Reemplaza la familia de v264 (control 12,
tarjeta 16, flotante 12).

| Token | Valor | Hoy se usa en |
|---|---|---|
| `--r-sm` | 2 | **solo marcas que no se tocan**: marco de escritorio, celdas de la franja de racha, indicador de pestaña, pistas de `range`, barras del hipnograma corto, interruptor de sueño, punto de agua |
| `--r-mark` | 4 | marcas de gráfica: días del calendario, hipnograma, bloque de agenda |
| `--r-ctl` | 4 | **TODO control**: primario (`.start`, `.sheetbtns .ok`, `.footer .save`), campos y selects, `.lact`, `.restbar a`, `.hold`, celdas de la tabla de series (`.inp`, `.pick`, `.fs`, `.bwchip`, `.inp-mini`), opciones de TRKSelect (`.tselo`), hora del desglose, **los chips** (`.chip`, `.spc`, `.wchip`, `.ag-chip`, `.chst`) y el panel del anillo (`.card.kpanel`, excepción `ring`). Los `[verbo]` y las opciones (`button.b/.t/.cancel`, `.secondary .b`, `.sheetbtns .cancel`, `.footer .abort/.undo`) no tienen caja: radio 0 |
| `--radius` | 4 | tarjetas `.card`, `.grp`, `.ptile`, `.pfeat`, `.pthrow`, `.hcal`, `.ws-card` |
| `--r-float` | 8 | **solo lo que flota**: nav (`--r-nav`; sus pestañas no tienen caja), sheet (`--r-sheet`), toast (`--r-toast`), popovers `.tsel`/`.gloss` (`--r-pop`), `.savebar` (`--r-bar`), fantasma de arrastre, panel de `?design` |
| `--r-sheet` | `var(--r-float)` | esquinas inferiores del sheet |
| `--r-pill` | 999 | **única píldora que queda**: la tapa de las barras finas ≤6 px (`.bar`, `.wprog`, `.vbar`) |
| `50%` | — | puntos, thumbs, `.dots3`, punto del rail (los spinners circulares se retiraron en v268) |

- RAD-1: prohibidos 3/6/9/10/12/14/16 y cualquier literal en píxeles (todo va por token); el 8 solo como `--r-float` en
  lo que flota. La revisa: ds-audit (radios fuera de escala: hoy 0).
- RAD-2 (v267, **B-05**, decisión del dueño 2026-09-23): en el contenido el conjunto permitido es **0 · 2 · 4** (reglas y
  barras · marcas · control, tarjeta y marca de gráfica), más 50 % en puntos y la píldora solo en las barras finas; **el 8
  solo en lo que flota** (`--r-float` y sus alias), y los controles dentro de lo que flota siguen en `--r-ctl`. La línea
  base de R-RAD es 0. En pantalla lo mide `_dsRenderCheck` (`rad`, §18.2), la prueba de 5 s de BRAND §8. La revisa:
  R-RAD / R-RADF · `_dsRenderCheck` rad.

### 4.8 Bordes, sombras y efectos

- BRD-1 **Dualidad de bordes (intencional, no unificar):** 1 `--o40` en campos editables (v267) · 1 `--border` en tarjetas y controles · .5 `--o20`
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
| `--dur-blink` | 1.1s | parpadeo del `>` de la pestaña activa (v267) y del cursor `▌` de `ready` en el arranque (v268); bucle `loop`, en pasos |

- MOV-T1: ninguna duración literal en el CSS salvo los bucles con id (§15). En JS se leen con `durMs()`, que respeta la
  unidad (el hold lee `--dur-hold` desde v260). Hoy quedan literales en JS: 950/480/600 (+260 de cierre) del arranque
  (normal/corto/movimiento reducido, v268), 40 de su barra, 5000 del recap, 120 del ticker de TRKSpin (v268), 190/200 de
  salidas, 430 del escáner, 1600 del scrub, y el easing del rebote del escáner.
- v260: `--mv-1` 4px (desplazamiento máximo del contenido en `rowin`, `mdslide` y `viewin`, B-09) · `--ease-step`
  `step-end` (los bucles de terminal: cursor ▌ del landing, wrap, desde v267 el `>` de la nav y desde v268 el cursor
  `.bcur` de `ready▌` en el arranque) · `--dur-hold` 900ms (TRKHold).

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
- Z-2 (M6-38, resuelto en v268): una pregunta de recuperación de datos (TRKAsk, `--z-pop`) podía abrirse **debajo** del
  arranque (`--z-overlay`). Ahora la cola del arranque (`_bootNext()`) no abre ningún aviso mientras exista `#bootov`
  (arranque o recap): lo vuelve a intentar cada 300 ms y lo abre en cuanto se cierra. Como el arranque dura ~1 s y se
  salta tocando, la pregunta llega enseguida y nunca tapada: ninguna decisión de datos se toma a ciegas. Lo prueba
  `_v268SelfCheck`.
- Scrim: `--scrim` `rgba(0,0,0,.6)` en `.modal` (v260).

### 4.12 Vidrio (solo chrome)

`--glass-bg` `rgba(14,14,14,.55)` · `--glass-bg-strong` `rgba(14,14,14,.72)` · `--glass-blur` 18px · `--glass-sat` 1
(v264: sobre un gris `saturate()` no hace nada; el 1.7 de antes solo saturaba el color dentro del vidrio) · `--glass-edge`
.14 · `--glass-edge-lo` .06 · `--glass-ring` .10 · `--glass-shadow` `0 8px 30px rgba(0,0,0,.55)`. Radio: `--r-float` 8.

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
| `--bw-field` | 1px | 10 | campo de formulario (`.field input`, `#fa_q`, `textarea.ta`…; en `--o40` desde v267) |
| `--bw-ctl` | 1px | 9 | control (`.lact`, `.restbar a`, `.hold`, `.ag-chip`, anillo interior del primario presionado…; los `[verbo]` y los toggles ya no tienen borde, v267) |
| `--bw-card` | 1px | 8 | tarjeta (`.card`, `.grp`, `.ptile`, `.hcal`…; G3 las retira) |
| `--bw-rule` | 1px | 12 | regla (`.rule`, borde de `.footer`/`.restbar`, `.ghead`…) |
| `--bw-chrome` | 1px | 8 | borde del vidrio (`.glass`, `.sheet.glass-strong`, `.tsel`, `.gloss`, `.savebar`…) |
| `--bw-mark` · `--bw-focus` | 2px · 1.5px | 4 · 1 | marca · anillo de foco |
| `--sw-grid` · `--sw-ref` · `--sw-data` · `--sw-data-lg` | .5 · 1 · 1.4 · 1.8 | clases `.sw-*` | trazos de gráficas (lineChart, radar, FC; la regla CSS gana al atributo) |
| `--sw-icon` · `--sw-ring-lg` · `--sw-ring-md` | 1.6 · 1.4 · 1.8 | nav · anillos | trazos de íconos y anillos (la imagen para compartir lee el trazo computado) |
| `--r-nav` · `--r-toast` · `--r-pop` · `--r-bar` | `var(--r-float)` (v262) | 2 · 1 · 2 · 1 | radio por pieza flotante; el auditor resuelve el alias |
| `--scrim` · `--nav-clear` · `--mv-1` · `--ease-step` · `--dur-hold` | `rgba(0,0,0,.6)` · 84px · 4px · `step-end` · 900ms | 1 · 2 · 3 · 3 · JS | fondo de modal · espacio sobre la nav · desplazamiento · bucles · TRKHold |
| `--ring-glow` · `--ring-glow-sm` | retirados en v262 | — | el anillo ya no tiene brillo (look "1") |

Sin token a propósito: la línea del scrub (`.chsl`), que es geometría. Los anillos de carga con borde de 1 px se retiraron
en v268: el trabajo en curso ahora es texto (TRKSpin, §7.33). Falta retirar `--abort` (G3a).

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
| 14 | 8.4 | 42 | 40 |
| 16 (campo) | 9.6 | 37 | 35 |
| 20 | 12.0 | 29 | 28 |
| 28 | 16.8 | 21 | 20 |

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
- Tareas (`toastTask()`, v268 con TRKSpin): `▖ sincronizando salud… 3s` → `✓ salud sincronizada · 12 días`;
  `▖ buscando producto…` → `✓ encontrado` / `⚠ no está en OpenFoodFacts`; `▖ generando imagen…` → `✓ imagen lista`. El
  verbo va en gerundio y en minúscula; los puntos suspensivos los pone el componente (el mensaje no los trae) y los
  segundos aparecen solos a partir de 1 s.
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
- **Anatomía (v267, "primario gym//TRK", BRAND §4):** alto 44 (`--h-pri`, igual en pantallas, sheets y la barra
  acoplada) · `--r-ctl` 4 · fondo `--fill` y texto `--on-fill` · `--t-data`/800 · `--ls-ui` · texto de comando en
  minúsculas con glifo (`▶ resume workout`, `✓ save session`).
- **Estados:** presionado = **invertir** (fondo `--bg`, texto `--fg`, anillo interior de `--bw-ctl` en `--fg`);
  deshabilitado: no se usa, se oculta.
- **Toque:** 44×ancho.
- **Sí / No:** sí `▶ start workout`, `✓ save session`. No dos primarios en la misma vista; no un primario para
  "cerrar" o "cancelar".
- **Motor TRK:** —
- **Hoy → objetivo:** la forma quedó cerrada en v267 (decisión del dueño 2026-09-23, sin clase nueva: `.start`,
  `.sheetbtns .ok` y `.footer .save` comparten anatomía). Quedan vistas con más de uno (hoja de sesión con 3 `.ok`,
  //ESPACIO con 2, el día del calendario con varios): G4. `rest day`, `skip day`, `abort`, `↩` y `‹ back` ya son
  `[verbo]` (v267).
- **La revisa:** R-OK · R-ROLE · a ojo.

#### Secundario = `[verbo]`
- **Rol:** alternativas, cancelar y acciones de una hoja o de una barra.
- **Clase / API:** `button.b`, `button.cancel`, `.secondary .b`, `.sheetbtns .cancel`, `.mdcust .b`, `.footer .abort`,
  `.footer .undo`. Destructivo = `.cancel.danger` (`--bad`).
- **Anatomía (v267, B-06):** **sin caja, fondo ni borde** (radio 0): corchetes por CSS (`::before '['`, `::after ']'`) en
  `--o40`, etiqueta `--t-data`/400 en `--o60`, alto 44, alineado a la izquierda. `.secondary` es una fila que envuelve
  (`gap` 0 / `--s4`). `.footer .abort` pinta sus corchetes en `--abort`; `.footer .undo` va a `--t-section` (glifo ↩).
- **Estados:** presionado = texto `--fg`.
- **Toque:** 44 de alto × su ancho.
- **Sí / No:** sí `[rest day]` `[skip day]` `[cancelar]`. **La etiqueta nunca trae sus propios corchetes** (los pone el
  CSS: `[unir]` escrito en un `button.b` sale `[[unir]]`; en v267 se quitaron de `+ toma puntual`, `adoptar` y `unir`). No
  cajas, no pills, no botones con estética propia por módulo, no íconos sin texto en acciones importantes.
- **Hoy:** decidido en principio el 21-sep y enviado en v267. `button{font-family:inherit}` sigue (T-01): fuera de su
  padre ya no sale el botón nativo gris (fugas del navegador 0 en `dsSweep`).
- **La revisa:** R-ROLE · R-BRK · `_dsRenderCheck` ua.

#### Acción de texto `[verbo]`
- **Rol:** acción puntual dentro de los datos (BRAND §3).
- **Clase / API:** `.addbtn` (`[+ set]`, `[↓ drop set]`), `.ctrls a` (`[change split]`), `.section .meta` (`[settings]`),
  `.fa-acts a`, `.mdacts a`, `.hbody .hacts a`.
- **Anatomía:** texto `--t-label`/`--t-data` en `--o60`, sin caja; `[ ]` literales en el texto (en los secundarios
  `button.b`/`.cancel` los pone el CSS, ver arriba).
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
- **Hoy → objetivo:** caja con radio de control (4 desde v267): objetivo G3 (pasa a `[verbo]` o se queda como caja fina).
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
  `.pfw`, `.slblk input`, `.slph input`, `.mdcust input`, `.msum-time`, `.mmrow select`. Etiqueta `.field label`. Los de
  renombrar en línea (`.gnmin`, `.senm`) son §7.27.
- **Anatomía (v267, vista previa del dueño 23-sep):** caja fina: alto 44 · `--r-ctl` 4 · borde 1 (`--bw-field`) `--o40` ·
  fondo **transparente** · `--t-field` 16 (anti-zoom). `.msum-time` (hora del desglose) conserva su caja de 36 con .5
  `--o20`. `.mmrow select` va a `--t-data` porque acompaña a una fila (el viewport ya bloquea el zoom).
- **Estados:** foco = el borde sube a `--fg` **y es el foco** (v268: `outline:none` en `:focus` de todos los campos de v267,
  sin anillo doble); placeholder `--o30`.
- **Variante del perfil de primer uso:** `.obi` (40 de alto, dentro de una fila de terminal), §7.34.
- **Sí / No:** **unidad y porción siempre `<select>`, nunca texto libre** (vinculante). No alturas 30/32/34/38, fondo
  relleno, radio distinto de `--r-ctl`, sombras internas, labels flotantes ni bordes de color.
- **Hoy → objetivo:** la etiqueta va en MAYÚSCULAS (objetivo G3, VOZ-2). El borde `--o40` ya llega a 4.9:1.
- **La revisa:** ds-audit (campos por debajo de 16: hoy 0).

#### Dato (tabla de sesión)
- **Clase / API:** `.inp` (`.inp.weight`), `.pick`, `.fs`, `.bwchip`; RIR con TRKSelect (`.pick.rirb` + `openRirSelect()`;
  `TRK_RIR` = false vuelve al `<select>`).
- **Anatomía:** alto 36 · `--r-ctl` 4 · .5 `--o20` · transparente · `--t-data`. "La caja cabe su contenido".
- **FS** (`.fs`, v267): columna de 28 (`.gc-mach`, `.gc-mach-fs`, `.addrow.amach`); apagado = caja fina con `FS` en
  `--o40` 10/700; encendido = **celda invertida** (`--fill`, texto `--on-fill`); en un drop, `.fs.ds` = texto `DS` en
  `--o50` sin caja.
- **Estados:** prefill `.pf` a .45 por campo hasta tocarlo; drop `.isdrop` a .82.
- **Toque:** 36 (excepción `table36`).
- **La revisa:** a ojo · `_dsRenderCheck` hit (con la excepción).

#### Dato mini
- **Clase:** `.inp-mini` (fecha, duración y horas del registro tardío). Alto de su texto, `--r-ctl`, .5 `--o20`,
  `--t-label`. Es la única caja por debajo de 16 fuera de la tabla (el viewport bloquea el zoom).

### 7.3 Toggles y pestañas

#### Toggles
- **Clase:** `button.t` dentro de `.toggles` (fila que envuelve, `gap` 0 / `--s4`); `.toggles.wrap` = rejilla de 2
  columnas alineada a la izquierda. Lo **sugerido** lleva subrayado punteado `--o40` a .75 hasta tocarlo
  (`.pftog.sug .t.on`; antes caja punteada).
- **Anatomía (v267, vista previa del dueño 23-sep):** **sin caja**; alto 44; `--t-data` `--ls-ui`; sin elegir `--o50`/400;
  elegida `[etiqueta]` en `--fg`/700, con corchetes por CSS (`::before`/`::after`) que, apagados, guardan su lugar
  (`visibility:hidden`) para que nada se mueva al elegir.
- **Hoy:** cerrado en v267 (antes caja con radio de control y relleno `--fill` en la elegida).

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
| **Seleccionable** | `.chip`, `.spc`, `.wchip`, `.ag-chip` | caja `--r-ctl` 4, alto ≥36, borde .5 o `--card2`, `--t-data` | se toca para elegir o filtrar |

- MRK-1: nada de cajas alrededor de un estado; nada de chips con otro radio que `--r-ctl`; no más familias.
- v264 sacó las píldoras de los seleccionables y v267 los deja a 4 (B-05, contenido afilado).
- La revisa: R-RAD · a ojo.

### 7.5 Catálogo de filas

Hoy hay más de diez clases de fila. Se agrupan en **cuatro familias**; una fila nueva elige su familia y usa su anatomía
(ROW-1). Las clases existentes se conservan (PRI-9) y convergen a los valores de su familia.

| Familia | Anatomía | Toque | Clases de hoy |
|---|---|---|---|
| **A · Lectura** `clave ···· valor` | clave `--o60` · líder punteado `.dots` · valor `--fg`/700; `--t-data`; sin toque | — | `.line`, `.line.stat`, `.mdline` (variante de detalle), `.tbrow`, `.stline`, `.nl-row`, `.mdr` |
| **B · Navegable** (termina en `›`) | nombre `--t-data` + sublínea `--t-label` opcional; `›` `--o30` al final; separador .5 `--o10` | toda la fila, ≥44 | `.line.lnav`, `.nvm` (menú, filas de ~50), `.pickitem`, `.exrow`, `.hrow`, `.mscrow`, `.mmrow`, `.trow` (con sparkline), `.mdtr`, `.stq` (si tiene detalle) |
| **C · Registro** (una línea por registro, B-03) | `#etiqueta` tenue · nombre `--fg`/800 · datos `--o50`; interlineado de lectura | la fila, si abre algo | `.srw` (la referencia), `.sxr` (historial compacto, objetivo G4: pasa a `.srw`), `.mit` (alimento), `.sitem` (compartir comida), `.lc` (celda de supp/agua), `.seex` (ejercicio del split), `.exbr` |
| **D · Rejilla editable** | cajas de dato (`--r-ctl` 4) en columnas fijas | cada caja | `.srow`/`.pair` con `.gc-*`, `.slph`, `.slblk` |

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
- El atrás de la barra de estado es `[‹ back]` de texto desde v267 (antes una caja de 68×37): objetivo G3 `[‹ origen]`
  (§14.2).

### 7.7 Superficies de agrupación

- **Hoy:** `.card`, `.grp`, `.ptile`, `.pthrow`, `.hcal` (y `.ws-card` en el wrap): fondo `--card`, borde 1 `--border`,
  radio `--radius` (4 desde v267), padding `--sp-card`, margen inferior `--sp-gap`.
- SRF-1 (sigue valiendo): una superficie existe **solo** si agrupa una entidad, contiene una métrica independiente o es un
  módulo autónomo. Nunca una tarjeta por número, fila o botón. Sin gradiente, brillo, vidrio, acento ni sombra.
- **Objetivo G3** (tarjetas → paneles, abierta en BRAND §10): un grupo es un **panel** `//TÍTULO` + regla, o una caja fina
  cuando hace falta borde; por ahora las tarjetas solo bajaron a 4 (v267). El anillo de kcal ya está en su panel de vidrio
  sutil (v262). Progress
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
- **Anatomía:** sólidas (`--frame`), borde superior 1 `--o12`, gutter `--sp-px`. Footer (v267): `[abort]` y `[↩]` son
  `[verbo]` sin caja (los corchetes de abort en `--abort`) y `save session` es el primario de 44 (`--h-pri`). Descanso:
  botones de 32 visibles con toque de 44 (`::after`).
- **Estados:** fin de descanso `.restbar.fin`: tiempo en `--good` y 3 destellos del borde (`restdone`, id `loop`); texto
  `listo`.
- **Motor:** `updateRestBar()` escribe solo `textContent` cada 500 (nunca repinta); `visibilitychange` recalcula.
- **Hoy → objetivo:** `abort` y `↩` ya son `[verbo]` (v267); `--abort` se retira (G3); el tiempo de `.wline` se congela durante
  el descanso (M2-15, G4). `updateNowBar()` es código muerto (G4).

### 7.10 Navegación

- **Rol:** las tres pantallas primarias: **progress · gym · macros**. Pertenece al chrome, no al contenido.
- **Clase / API:** `renderNav()` construye una vez `.nav.glass` con tres `<a data-act="nav" data-screen role="link">` de
  solo texto (`progress  gym  macros`; `NAVIC` y sus íconos se retiraron en v267) y alterna `.active` +
  `aria-current="page"`; se oculta en workout, settings, splitedit, history, histedit y share (y sin usuario).
  Suplementos, músculos, split, historial y ajustes viven en el menú `u/…` (`.nvm`).
- **Anatomía (v267, decisión del dueño 2026-09-23: "> parpadea y el nombre fijo", BRAND §4):** cápsula de vidrio
  `--r-nav` (= `--r-float` 8) flotando a 12 del borde, sin separación entre pestañas; pestaña de 44 de alto (mínimo 44 de
  ancho), `--t-data`/700 `--ls-ui` en `--o50`, sin caja ni fondo. La activa va en `--fg` con `>` delante (`::before`, 1ch +
  `--s2`) que parpadea (`blink var(--dur-blink) step-end infinite`, bucle `loop`); en las demás el `>` está oculto pero
  guarda su lugar: **el nombre nunca se mueve**. Con reduced-motion el `>` queda quieto.
- **Movimiento:** solo `color` (`--dur-2`); nada de layout.
- **Toque:** 44 de alto.
- **Hoy → objetivo:** la forma quedó cerrada en v267. Queda que la nav todavía se ve en stack y agenda (T-02, G4).
- **No:** más de 3–4 pestañas, íconos, pestaña que se ensancha, dock con lupa, rebote.
- **La revisa:** R-MOTION (layout) · `_dsRenderCheck` hit · a ojo.

### 7.11 Sheets y capas

- **Rol:** una tarea corta encima de la pantalla sin cambiar de pantalla.
- **Clase / API:** `openModal(html, cls)` → `.modal` (scrim) + `.sheet.glass-strong` **anclado arriba** (evita el teclado
  de iOS); `cls` admite `tall` (90 de alto de pantalla), `mdetail-wrap` (88) y `nodismiss` (solo decisiones obligatorias,
  hoy la sesión inactiva de `promptIdleSession()`). `closeModal()`. Capa de decisión encima del sheet: `askLayer()` →
  `.modal.asklayer` (§7.13).
- **Anatomía:** scrim `rgba(0,0,0,.6)` · sheet con padding `--sp-sheet`, esquinas inferiores `--r-sheet`, máx. 80 % de
  alto · título `.sheet h3` · botones `.sheetbtns` (primario de 44 + `[verbo]`). El contenido del sheet usa el lenguaje normal
  (no todo es vidrio).
- **Movimiento:** al abrir desde cero el sheet baja (`sheetin`, `--dur-3 --ease-out`) y el scrim aparece (`scrimin`,
  `--dur-2`); al cerrar sube y se desvanece (`--dur-2 --ease-in`). **`openModal` sobre otro sheet, o justo después de
  `closeModal()`, es cambio de contenido: sin animación.**
- **Cierre sin trampas:** `closeModal()` quita el `id` al instante y deja un fantasma `.modal.out` sin clics que se borra a
  los 200.
- **Hoy (v258, T-10):** cerrar un sheet y repintar usa `closeModal(); reRender()` (28 llamadas + los handlers del
  editor de split): el scroll de abajo se conserva. Radio del sheet: `--r-float` (8 desde v267). Con un sheet abierto, un
  error va en línea bajo el campo, no en un toast bajo el teclado (G4).
- **La revisa:** R-SCROLL · a ojo.

### 7.12 TRKToast

- **Rol:** decir qué pasó después de una acción; una sola voz para todo el feedback (§6.3).
- **API:** `toast(msg, type, {undo})` (tipo `ok`/`err`/neutro, se infiere de `✓`/`⚠`) · `toastTask(msg)` → `{done, fail}`
  para lo que tarda: desde v268 el toast de tarea lleva TRKSpin dentro de `.tm` (`▖ sincronizando salud… 3s`) y
  `done()`/`fail()` lo resuelven **en el mismo toast** con `✓`/`⚠` (al quitarse el spinner, el ticker se apaga solo).
- **Anatomía:** `.toasts` (pila `aria-live`, máximo 3, sale la más vieja) · `.toast.glass-strong` `--r-toast` (=
  `--r-float` 8), `--t-data`/700; borde del vidrio (`.ok`, sin verde desde v262), `--bad` (`.err`, se queda hasta tocarlo,
  con ` ✕`), neutro; `.toast.task` en `--o70`;
  `[deshacer]` `.tundo` con toque ampliado.
- **Vida:** éxito/neutro `--toast-life`; con deshacer o error `--toast-life-err`; un solo deshacer vivo a la vez.
- **Hoy (v258):** `bottom` con `env(safe-area-inset-bottom)` (M6-06) y un error ocupa hasta 2 líneas en vez de cortarse
  (M6-07); ≤42 caracteres lo revisa R-TOAST. Objetivo G4: token `--nav-clear`. Sin confeti ni sonido.
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
  guardado y se vuelve a ofrecer en el siguiente arranque. v268 (Z-2, §4.11): mientras el arranque o el recap están en
  pantalla (`#bootov`), `_bootNext()` espera y reintenta cada 300 ms; ningún aviso se abre debajo.
- **Anatomía:** `h3` + `.submeta` + `.sheetbtns` (primario + secundario; si destruye, `.cancel.danger` + secundario).
- **Hoy → objetivo G4:** título por defecto `'¿seguro?'` y OK destructivo que parece cancelar (VOZ-5).

#### TRKHold
- **Rol:** confirmar lo **irreversible** sin que un toque accidental baste. **API:** `holdConfirm({title,detail,verb}, onOk)`.
- **Anatomía:** `.hold` alto 44 (`--h-pri`), `--r-ctl`, borde `--bad`, texto `--bad`; `.hold-fill` `--bad` a .22 avanza con `scaleX` en 900 lineal
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
- **Anatomía común:** `--card2`, borde 1 `--border`, `--r-pop` (= `--r-float` 8), `--shadow-float`, entrada `rowin`; sus
  opciones (`.tselo`) son controles a `--r-ctl` 4.
- **Hoy (v267):** son chrome flotante a 8; vidrio opcional (G3).

### 7.15 Barras (TRKBar)

- **Rol:** mostrar una proporción con un solo trazo fino (volumen vs landmarks, ingesta, progreso de la sesión).
- **Clase / API:** `.bar`, `.vbar`, `.wprog`; relleno `trkBarI(clave, pct, cls)` (con `data-bk`, acotado 0–100); marcas
  `trkMark(pct, cls, title)` (`.mev` en `--o40`, `.mrv` en `--warn`); `animBars()` en `afterPaint()`.
- **Anatomía:** alto 3 (2 en `.wprog`), pista `--track` + relleno `--fill`; exceso `.over` en semántico. Barras de celdas
  permitidas para conteos discretos.
- **Movimiento:** crece desde su ancho anterior (`--dur-2`) solo si esa clave ya estaba pintada con otro valor.
- **Hoy → objetivo:** son píldoras (`--r-pill`), la única que B-05 conserva (≤6 px). Marca MRV fija en `--warn`: objetivo G3 `--o40`
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
| **TRKSpin** | algo trabaja y no se sabe cuánto falta (v268) | `trkSpinHTML(verb, {t0})` → `.tspin[data-spin]`; un solo ticker `spinStart()`/`spinTick()` | §7.33 |
| **TRKProgress** | algo trabaja y se sabe cuánto va (v268) | `trkProgressHTML(p, {label, cells})` → `.tprog`; `trkProgressSet(el, p)`; `trkBarTxt(p, n)` | §7.33 |

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
- **MEALS:** una `.mrec` por comida: cabecera `.mhd` de 44 (`.mtg` con `.mchev` y el nombre `.mnm` `--t-section`/800 + meta
  `.mmeta` `hora · P C F`; total `.mkc` `--t-section`/800 que abre el desglose; `.gmore` con `.dots3` → `openMealMenu()`); alimentos `.mit` de 36
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
  `--t-field`/800) y `.gnmin` (nombre de la comida, desde su menú: línea inferior `--o40`, `--t-field`/800).
- **Regla:** a `--t-field` 16 (anti-zoom, v267); nunca cambia la etiqueta del dueño salvo que él la escriba.

### 7.28 TRKRing (anillo de macros)

Decisión del dueño 2026-09-21: **el anillo de kcal se queda** (única gráfica circular de la app, solo en macros y en
compartir comida; excepción `ring`).
- **API:** `ringHTML(pct, center, size, inv)` → `.ring` (`.lg` 132 con trazo 1.4 y número `--t-display`/800; `.md` 72 con
  trazo 1.8 y número `--t-section`/800); `.ring-track` `--track`, `.ring-fill` `--fill`; estado `.good`/`.over` en el arco.
  El número central cuenta con TRKNum.
- **Hoy (v262, look "1"; radio 4 desde v267):** en un panel de vidrio sutil `.card.kpanel` (`--glass-bg-strong`, borde
  `--glass-edge`, radio `--r-ctl`, excepción `ring`), sin brillo ni punto al 0 % (`.ring-fill.z`); color solo en el arco y
  en `left/over` (BRAND §4).

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
- **Hoy hay seis:** landing `--t-hero` con `//` `--o40` y cursor `.cur`; login `--t-display` con `//` `--o50`; perfil de
  primer uso `.obh` a `--t-section`/800 con `//` `--o40` y la etiqueta `//PROFILE` en `--o50` (v268, §7.34); pie de
  compartir `.shfoot` todo en `--o35`; arranque `.bootov .bt` a `--t-section`/800 con `//` `--o40` y la versión (`APP_V`) en
  `.bv` `--t-label` `--o40` (v268); wrap `.ws-kick` y `.ws-cardf`.
- **Objetivo G3:** una clase `.mark` (pendiente G3) con sus tres tamaños por contexto.

### 7.31 Íconos TRK

- **Hoy:** la nav es de texto desde v267 (`NAVIC` se retiró). `EXSH_SVG` (compartir un ejercicio): viewBox 16, trazo 1.4.
  Escáner y cámara: sin ícono propio (📷 emoji).
- **Objetivo G3** (decisión del dueño 2026-09-21, BRAND §4 y B-08): set propio — rejilla 24, trazo 1.6, **remates
  cuadrados**, geometría ortogonal de consola, `currentColor`, variante sobre chip de vidrio para el chrome. Piezas: share,
  camera y el escáner. Se dibujan en una lámina (G0) y el dueño las aprueba; un ícono nuevo necesita su
  aprobación.
- Orden de preferencia (B-08): palabra > glifo del set (§11) > ícono TRK. Emoji de interfaz: 0.

### 7.32 Overlays

| Overlay | API | Hoy | Objetivo |
|---|---|---|---|
| **Arranque "loading gym tracker"** (v268, decisión del dueño 23-sep: "Cada vez que abres la app") | `bootScreen()` → `showOverlay(html, {ms, shader})`; **en cada apertura**, una vez por apertura (`sessionStorage.gymtrk_boot`), con o sin cuenta; tocar lo salta. Ficha abajo | `.bootov` a pantalla completa; shader de fósforo (`startShader()`) detrás a `--op-dim`; `.bboot` con líneas `.bl` que se imprimen una a una | ✓ enviado en v268 (BRAND §4). Queda: marca única en todos los overlays (§7.30) |
| **Recap de las 21 h** | `snapRecap()` → `showOverlay(…, {ms:5000})`; una vez al día (`?recap=1` lo fuerza); se encadena después del arranque | `//TODAY · fecha` + líneas con `--good`/`--bad`; `[tap para cerrar]` quieto (v268: `.bready` ya no parpadea) | G4: evaluar (capa bloqueante cada noche) |
| **Wrap mensual** | `wrapMonthData()` + diapositivas `.wstage` | números de 60 y 44 exentos, tarjeta `.ws-card`, "captura para compartir" | G4: es el formato de números grandes que el dueño rechazó ("del pito") |
| **Escáner** | `openBarcode()` → `.scan-reticle` | marco `.frame2` de 2 con velo, línea que barre (`scanmove`), fijado en verde con rebote y ✓ de 40 | G4: idioma de botones (`look up` / `capturar` / `cancel`), rol de `capturar`, verde |
| **Compartir un ejercicio** | `openExShare()` → `.exsh` | §7.19 | §7.19 |

#### Arranque "loading gym tracker" (`bootScreen()`, v268)
- **Rol:** la app abre como una terminal que carga: dice qué versión corre y qué encontró en este teléfono. Líneas reales
  (de `db.sessions`, `db.split`, `db.activeWork`), nunca inventadas.
- **Anatomía:** cabecera `.bt` `gym//TRK` + `.bv` con la versión (`APP_V`, `v268`) · `.bboot` (máx. 320 de ancho,
  `--t-data`): `> loading gym tracker` (`.bp`, `--o70`) · filas `clave ···· valor` (`.line.bl`): `db` (`N sessions`, o
  `new · this phone` sin cuenta), `split` (nombre · día de hoy; solo con cuenta y días), `last session` (día · hoy / ayer /
  hace Nd) · TRKProgress de 18 celdas (`[██████] 100%`, §7.33) · `ready▌` (`.bready` + `.bcur`: el cursor parpadea en pasos
  con `--dur-blink`, `/*ds:exempt:loop*/`, quieto con movimiento reducido).
- **Tiempo:** normal ~950 ms (se cierra a los ~1.2 s). Cada línea aparece en su turno (`total / (líneas + 1)`) solo con
  `visibility` (`.bl` → `.bl.on`): se imprime, no se mueve (B-09). La barra se llena por tiempo en el 85 % del total.
  **Corto** ~480 ms y sin shader: con una sesión viva (`> resuming <día> · set n/N`, n = la siguiente serie sin ✓) o si
  abriste hace menos de 30 min (`localStorage.gymtrk_lastopen`). **Movimiento reducido:** todo a la vez, barra al 100 %,
  600 ms.
- **Toque:** tocar en cualquier parte lo salta.
- **Fondo:** shader de fósforo (`startShader()`, excepción `boot`) detrás a `--op-dim`; cuadro quieto con movimiento
  reducido y pausado en segundo plano; nunca en la versión corta.
- **Honestidad:** la barra del arranque marca el tiempo del propio arranque, no un avance de carga: es la única excepción a
  la regla de TRKProgress (§7.33).
- **Cola:** los avisos del arranque esperan a que se cierre (Z-2, §4.11).
- **La revisa:** `_v268SelfCheck` (la cola espera bajo `#bootov`) · a ojo.

### 7.33 Trabajo en curso: TRKSpin y TRKProgress (v268)

Decisión del dueño 2026-09-23 (BRAND §9): "estilo como lo de Claude Code, de que cuando está cargando algo, cuando está
pensando". El trabajo en curso se escribe como en una terminal: un verbo con su glifo que cambia y sus segundos, o una
barra de texto con su porcentaje. Reemplaza a los anillos giratorios de CSS, retirados junto con su `@keyframes` (en el
auditor, excepciones 31 → 28 y bucles R-MOTION 10 → 7).

#### TRKSpin
- **Rol:** algo trabaja y **no** se sabe cuánto falta (red, cámara, motor de OCR cargando, IA).
- **API:** `trkSpinHTML(verb, {t0})` → `<span class="tspin" data-spin role="status" aria-live="polite">` con `.tsg` (el
  glifo) · `.tsv` (`verbo…`) · `.tst` (segundos). `t0` = desde cuándo contar (por defecto, ahora). Insertarlo arranca el
  ticker.
- **Anatomía:** `▖ buscando en línea… 3s`. Glifo en `--fg`/400 con 1 ch de ancho y 1 ch de aire (cambiar de cuadro no
  mueve el texto); verbo en `--o60`; segundos en `--o40` y solo a partir de 1 s. Cuadros `TRK_SPIN` = `▖▘▝▗` (existen en
  JetBrains Mono y llegan por el subconjunto `&text=`, GLY-3).
- **Motor:** **un solo** ticker global (`spinStart()`, 120 ms) que recorre los `[data-spin]` y escribe solo `textContent`
  (glifo y segundos; ni clases ni estilos) y **se apaga solo** (`spinTick()`) cuando ya no queda ninguno en el documento.
  Sin animación CSS: no hay bucle que declarar ni que exentar.
- **Movimiento reducido:** el glifo se queda en el primer cuadro (`▖`); los segundos siguen contando (son dato).
- **Dónde:** búsqueda en línea de alimentos (`buscando en línea`), código de barras (`buscando`, `leyendo`,
  `leyendo código`), búsqueda por nombre (`buscando`), OCR mientras carga su motor, lectura de etiqueta con IA
  (`leyendo la etiqueta con IA`), //ESPACIO (`cargando` en COPIES y BOOT LOG) y el toast de tarea (`toastTask()`, §7.12).
- **Sí / No:** sí un verbo en gerundio, minúscula y en español (es prosa, §6.1). No un spinner sin verbo, no dos para la
  misma tarea, no puntos suspensivos en el verbo (los pone el componente), no animarlo con CSS.

#### TRKProgress
- **Rol:** algo trabaja y **sí** se sabe cuánto va.
- **API:** `trkProgressHTML(p, {label, cells})` → `<span class="tprog" role="progressbar">` con `aria-valuemin` 0,
  `aria-valuemax` 100 y `aria-valuenow`: `etiqueta [<b>barra</b>] <i>42%</i>`; `trkProgressSet(el, p)` actualiza barra, `%`
  y `aria-valuenow` sin repintar; `trkBarTxt(p, n)` da solo la barra. `cells` = 16 por defecto.
- **Anatomía:** `leyendo [██████▍░░░░░░░░░] 42%`. Celdas llenas `█`, el borde en octavos (`▏▎▍▌▋▊▉`: avanza de a 1/8 de
  celda) y lo que falta en `░`; barra en `--fg`/400 sin tracking, `%` en `--o50` con cifras tabulares, etiqueta en `--o60`.
  Acotado a 0–100.
- **Movimiento:** solo cambia el texto; ninguna transición.
- **Dónde:** OCR de la etiqueta (arranca con TRKSpin mientras carga el motor y pasa a la barra con el % real de Tesseract)
  y el arranque (18 celdas).
- **Honestidad:** solo con avance **real**; si no se sabe cuánto falta, TRKSpin. Única excepción: el arranque, donde la
  barra marca el tiempo del propio overlay.
- **Glifos:** `GLYPHS_VIZ` (`▖▘▝▗░▒▓█▏▎▍▋▊▉` + box-drawing `─│┌┐└┘├┤┬┴┼`) los declara y `_dsRenderCheck` los acepta. El
  `▌` de la mitad es el mismo carácter del cursor (`GLYPHS`), pero dentro de `[…]` solo es media celda.
- **La revisa:** `_v268SelfCheck` (barra vacía, llena, a la mitad, con octavo y acotada; el ticker corre con un spinner y se
  apaga sin ninguno) · `_uiSelfCheck` (la tarea arranca con el spinner) · a ojo.

### 7.34 Perfil en filas de terminal (`renderOnboard()`, v268)

Respuesta a la queja del dueño sobre el formulario de crear cuenta ("tosco, todo muy gordo", BRAND §9). Cambia solo la
forma: mismos ids (`ob_*`) y los mismos datos que escribe `onboardgo`.

- **Rol:** el primer perfil (nombre, cuerpo, actividad, objetivo, gym, unidad) en una pantalla que se lee como
  `clave  valor`.
- **Clase / API:** `.ob` (pantalla) · `.obh` cabecera `gym//TRK//PROFILE` + `.submeta` (`1 min · se queda en este
  teléfono · todo se cambia después`) · `.obr` fila (rejilla de `10.5ch` + resto, alineada por la línea base, mínimo 44,
  `--t-data`) · `.obk` clave en minúsculas `--o50` · `.obv` control · `.obi` campo (`.obi.sm`: 7 ch alineado a la derecha,
  para números) · `.obu` unidad `--o40` · `.obk2` segunda clave en la misma fila (`peso` junto a `edad`) · `.obr.obr-h` +
  `.obhint` pista de una línea `--t-label` `--o40` · `.obprev` vista previa de metas · primario `.start` `▶ empezar`.
- **Filas:** `nombre` · `sexo [hombre] mujer` · `edad [ ] peso [ ] kg` · `estatura [ ] cm` · `actividad` (2×2,
  `.toggles.wrap`) + pista de la elegida (`OB_ACT`) · `objetivo déficit [mantener] volumen` + pista (`OB_GOAL`) · `gym` ·
  `pesas en [lbs] kg`. Los toggles son los de §7.3.
- **Campo `.obi`:** 40 de alto · borde `--bw-field` `--o40` · `--r-ctl` 4 · transparente · `--t-field` 16 (anti-zoom) ·
  placeholder `--o30`; foco = borde `--fg`, sin contorno.
- **Foco:** la fila con foco (`:focus-within`) pasa su clave a `--fg` y le pone `>` delante (el mismo "aquí" de la nav,
  BRAND §3); el `>` ya tiene su lugar reservado (`visibility`), así la clave no se mueve. Enter salta al siguiente `.obi`;
  en el último cierra el teclado.
- **Vista previa:** `obPrev()` escribe en vivo `2,170 kcal · 122 g proteína al día` con `recalcGoals()` (el mismo cálculo
  que se guarda), números en `--fg`/800; lleva `~` delante mientras edad, peso o estatura sean los de ejemplo (§9.1).
- **Guardar (`onboardgo`, aditivo desde v268):** conserva lo que ya hubiera en `profile` y fija `profile.since` si no
  existía; **mezcla** las metas (la de sueño sobrevive); escribe `goalHist[hoy]`; y solo si tecleaste un peso entre 30 y 250
  kg lo apunta como tu primer registro de `bodyweight[hoy]`. Sin nombre: `⚠ pon tu nombre` y el foco vuelve al campo.
- **La revisa:** `_v268SelfCheck` (en sandbox: `since`, meta de sueño, `goalHist`, peso tecleado y sin teclear) · a ojo a
  393×852.

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
| **Medidor de texto** (TRKProgress, v268) | `trkProgressHTML()` → `.tprog` | lectura de etiqueta con OCR, arranque | primitivo de BRAND §5: `[█░] %` con octavos en el borde, solo con avance real (§7.33); ▮▯ no existen en la fuente | `[░░░] 0%` |

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
| `~` antes o después de un dato | estimado o deducido | tensión con RIR supuesto, perfil sugerido, % de baja confianza, vista previa de metas del perfil mientras edad/peso/estatura son los de ejemplo (v268) |
| `▖ verbo… 3s` · `[█░] 42%` | algo trabaja; la barra solo si el avance es real | TRKSpin · TRKProgress (§7.33) |
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
  Hoy (v268): `.cur` (landing), `.bootov .bcur` (arranque), el `>` de la nav, `.wnav`, `.scan-reticle .scl` y
  `.restbar.fin`. El trabajo en curso ya no es un bucle CSS: es texto que escribe TRKSpin (§7.33).
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
| `blink` (`.nav a.active::before`) | pestaña activa de la nav (v267) | opacity en pasos | `--dur-blink` 1.1s infinito (`/*ds:exempt:loop*/`) | `--ease-step` | el `>` de "estás aquí" | `animation:none` (el `>` queda quieto) | ✓ excepción `loop` |
| `blink` (`.bootov .bcur`) | arranque (v268): el cursor de `ready▌` | opacity en pasos | `--dur-blink` 1.1s infinito (`/*ds:exempt:loop*/`) | `--ease-step` | "listo" | `animation:none` (el cursor queda quieto) | ✓ excepción `loop` (antes parpadeaba toda la línea `[ready]`) |
| `blink` (`.wnav`) | wrap | opacity en pasos | 1.5s infinito | `step-end` | "toca" | una vez (v258) | ✓ |
| `scanmove` (`.scan-reticle .scl`) | escáner buscando | `top` 30%↔70% | 2s infinito | ease-in-out | "buscando" | `animation:none`, línea al centro | ⚠ anima `top` (excepción `scanner`) |
| `bcpop` (`.scan-reticle.hit .frame2`) | código detectado | scale 1→1.06→1 | `--dur-3` | `cubic-bezier(.2,1.3,.4,1)` literal | fijado | .01ms | ✗ G4: rebote fuera de lista, easing literal |
| `bcchk` (`.scan-reticle.hit .chk`) | código detectado | opacity · scale .4→1.15→1 | `--dur-3` | `--ease-out` | ✓ grande | .01ms | ✗ G4: rebote |
| `wsin` (`.wstage`) | cada diapositiva del wrap | opacity · translateY 10 | `--dur-3` | `--ease-out` | pasar diapositiva | .01ms | ✗ G4 (10 > 4; el wrap es el formato rechazado) |
| `faPop` / `faFade` | ninguno (CSS muerto desde U2) | — | — | — | — | — | G4: borrar |

**Transiciones CSS**

| Qué | Disparador | Propiedad | Duración | Easing | Reduced-motion | B-09 |
|---|---|---|---|---|---|---|
| `.nav a` | cambia la pestaña activa (nodos persistentes) | color | `--dur-2` | `--ease-out` | .01ms | ✓ v267: ya no anima `gap`, `padding` ni `grid-template-columns` |
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
| Arranque `bootScreen()` (v268) | cada apertura, una vez | las líneas `.bl` aparecen una a una (`visibility`, `setTimeout`); la barra TRKProgress se llena por tiempo (intervalo de 40 que se apaga solo) | ~950 (corto ~480) + 260 de cierre | todo a la vez, barra al 100 %, 600 | ✓ imprime, no mueve |
| Shader `startShader()` | arranque normal (no el corto) | lienzo WebGL en bucle `requestAnimationFrame` detrás a `--op-dim` | lo que dure el arranque | cuadro quieto; pausado en segundo plano (v262) | ✓ excepción `boot` |
| TRKSpin `spinStart()` / `spinTick()` (v268) | hay algún `[data-spin]` en pantalla | `textContent` del glifo (`▖▘▝▗`) y de los segundos; un solo ticker que se apaga solo | 120 · en pasos | glifo quieto en `▖`; los segundos siguen | ✓ texto, no movimiento de caja |
| TRKProgress `trkProgressSet()` (v268) | avance real (OCR) o el reloj del arranque | `textContent` de la barra y del `%` | — | igual (es dato) | ✓ |
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

Espejo de BRAND §3 y de la constante `GLYPHS` de `index.html` (`'✓○▲▼⠿›‹▾▶↓✕↩~⚠▌×@/→#—−'`). Desde v268 la acompaña
`GLYPHS_VIZ` (`'▖▘▝▗░▒▓█▏▎▍▋▊▉─│┌┐└┘├┤┬┴┼'`): los cuadros del spinner y los bloques del medidor, que solo viven en
TRKSpin y TRKProgress, y el box-drawing, reservado a overlays y compartir (hoy sin uso). Cualquier otro símbolo en un texto de interfaz es
una desviación; las etiquetas que escribe el dueño no cuentan. La revisa: R-GLY (el auditor acepta esos bloques desde
v267) · `_dsRenderCheck` glyph (acepta `GLYPHS_VIZ` desde v268).

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
| ▌ | cursor (solo arranque y vacíos) | `.cur` del landing, `.bcur` de `ready▌` en el arranque (v268); dentro de un medidor `[…]` es media celda | — |
| × @ / → # | notación de series y datos | `160lbs×8@0 / …`, `→ acción` del diagnóstico, `#músculo` | — |
| — | sin dato | lecturas vacías | "sin dato" |
| `>` | aquí / activo (ASCII, fuera de `GLYPHS`) | `.nav a.active::before` (v267); prompt del arranque `> loading gym tracker` y la fila con foco del perfil `.obk::before` (v268) | `aria-current="page"` |
| ▖ ▘ ▝ ▗ | trabajando (`GLYPHS_VIZ`, v268) | TRKSpin `.tsg` (§7.33) | `role="status"` con el verbo |
| █ ░ (+ octavos ▏▎▍▋▊▉) | medidor (`GLYPHS_VIZ`, v268) | TRKProgress `.tprog` (§7.33) | `role="progressbar"` con `aria-valuenow` |

- GLY-1: **un glifo, un significado.** Hoy se rompe: `▲▼` también reordena en el editor de split y en la hoja de sesión
  (M1-04, M3-10 → `⠿` o menú, G3); `~` también significa "tomado tarde" en el stack (G4); `›` también gira para
  desplegar en TRKLog (el significado de desplegar es `▾`; G3/G4).
- GLY-2: los glifos llevan `aria-hidden` y el control lleva `aria-label` con la palabra (hoy VoiceOver lee "black
  up-pointing triangle": G4, T-12).
- GLY-3 (v267): Google sirve JetBrains Mono solo en latin/griego/cirílico, así que ▲▼▾▶✕⚠↓→▌, las cajas `─│┌┐└┘├┤┬┴┼`,
  los bloques `▖▘▝▗░▒▓█▏▎▍▋▊▉` y `· × › ‹ …` llegan por un segundo `<link>` con `&text=` (subconjunto propio). **✓ ○ ↩ ⠿**
  (y ✳ ✻ ✢ ◐ ▮ ▯) **no existen en la fuente**: si se piden, la petición entera da 400, así que salen con la fuente del
  sistema. Pregunta abierta de BRAND §10. Un glifo nuevo se prueba antes con curl contra esa URL.

### 11.2 Puntuación tipográfica (no son glifos de interfaz)

`·` separador de datos (el más usado) · `–` rango (`61.1 – 62.1 kg`) · `−` signo menos real (obligatorio en cambios) ·
`…` tarea en curso, detrás del verbo (`▖ sincronizando salud…`, lo pone TRKSpin desde v268) · `¿ ¡` · `≤ ≥` en texto. Se escriben como texto, no como glifos. (La constante
`GLYPHS` no los incluye; R-GLY y `_dsRenderCheck` deben tratarlos como puntuación.)

### 11.3 Fuera del set, en uso hoy (se reemplazan)

| En uso | Dónde | Reemplazo | Fase |
|---|---|---|---|
| ⓘ | ficha de un suplemento | `[?]` | G3 |
| ⎘ | `⎘ duplicar` (comida) | `[duplicar]` | G3 |
| ✎ | `✎ editar sets`, `✎ editar detalles…`, código de barras | `[editar]` | G3 |
| ◦ | "comunidad" en resultados de comida | nada (solo se marca la excepción `⚠ revisa`) | G3 |
| ▸ ▴ | resumen de bloques del stack, `▸ ver tu wrap`, `[ ocultar rutina ▴ ]`, `.wline` | `›` o nada | G3 |
| ← | `← regresar`, `← músculo` (el `← back` pasó a `[‹ back]` en v267) | `‹` | G3 |
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
| foco | `:focus-visible` con contorno 1.5 `--fg` y 2 de separación; `:focus` sin contorno; en un campo, el borde sube a `--fg` (v267) | siempre visible con teclado; verificar en controles que no son `<button>` (G4) |
| seleccionado | relleno `--fill` + texto `--on-fill` (TRKSelect, FS encendido), contraste (`.on`); en toggles, `[etiqueta]` en `--fg`/700 (v267); en la nav, `>` delante | — |
| deshabilitado | `--op-disabled` .4, `aria-disabled` en `--o30`, flechas apagadas en `--o20` | misma estructura |
| éxito / error | semántico + texto (toast, `.savebar`) | nunca solo color |

Un componente **no** cambia de estética por estado: cambian opacidad, superficie, borde o color, nada más. En móvil no hay
hover.

### 12.2 Estados por módulo

Cada sección tiene su vacío `// …` y cada módulo sus finales explícitos (EST-1). Forma: `// sin registros · [+ acción]`;
cargando `▖ verbo… 3s` (TRKSpin) o, con avance real, `[█░] %` (TRKProgress) (v268, §7.33); error `⚠ qué pasó · qué
hacer`; sin conexión `⚠ sin conexión · [reintentar]`.

| Módulo | Vacío (hoy) | Pocos datos | Cargando | Error / sin conexión |
|---|---|---|---|---|
| Gym | cabecera `//GYM sin split` + `+ crear split`, `explorar splits`, `importar` | recuperación con "pocos datos"; "sin baseline" en series | — | — (local) |
| Sesión | — | prefill vacío; "sin baseline" | — | guardado fallido: `.savebar` permanente + TRKAsk "no se pudo guardar" |
| Macros | `no meals logged`, `no water logged` (inglés: G3 → español) | — | `▖ buscando en línea… 3s` (TRKSpin); OCR `leyendo [██████▍░░░] 42%` (TRKProgress) | OpenFoodFacts falla **en silencio** y un código que no se pudo buscar sale como "no encontrado" (M4-09 → G4: `// 0 resultados` · `⚠ sin conexión · [reintentar]` · resultados) |
| Progreso | **activada = recuadro (v263):** una métrica encendida en `[config]` dibuja su tile aunque no tenga un solo dato — sin tile no hay por dónde registrarla. Vacío = `emptyTile()`: `—` + `sin registro`, y el recuadro entero abre su registro (volumen/tensión/e1rm → `loglater`; FC en reposo/HRV/energía activa → su hoja). "sin registros en este rango", "sin volumen registrado en este rango", "aún no hay levantamientos con peso × reps" | `sin normal · N/7 d`, diagnóstico "pocos datos" | — | — |
| Historial | "sin sesiones registradas" | — | — | sesión inexistente en compartir (G4) |
| Stack | "stack vacío", "no toca nada hoy ✓" | — | — | — |
| Compartir | "sin sesión para compartir", "sin series registradas", "sin alimentos este día", "aún sin series con peso y reps" | — | `▖ generando imagen… 1s` (toast de tarea) | `⚠ no se pudo generar la imagen` |
| Ajustes · salud | — | — | `▖ sincronizando salud… 3s` (toast de tarea) | `⚠ …` del sync; errores de permisos en el log |
| Escáner | — | — | `iniciando cámara…`; al buscar o leer un código, `▖ buscando…` / `▖ leyendo…` (TRKSpin) | fallback a foto, búsqueda por nombre y tecleo |

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
  **sin nav** y con un solo atrás. Hoy `renderNav()` oculta la nav en workout, settings, splitedit, history, histedit
  (v267) y share, pero se ve en stack y agenda (T-02, G4).
- NAV-3: lo secundario se abre desde una fila `›`, desde `[verbo]` o desde el menú `u/…` (`navmenu` → `.nvm`).

### 14.2 Atrás

- **Hoy:** `statusBar(true)` pinta `[‹ back]` (v267: acción de texto con corchetes por CSS y toque ampliado; antes una
  caja de 68×37 con borde) y `data-act="leave"` siempre manda a gym: se pierden el scroll y el contexto; el editor de
  historial tiene dos salidas distintas (`[‹ back]` → gym y `‹ cerrar` → historial).
- **Objetivo G4** (T-02): `state._from` (pendiente G3) guarda de dónde vienes con su scroll; un solo `[‹ origen]` de texto
  en la barra de estado, con 44 de toque (`[‹ gym]`, `[‹ historial]`).
- NAV-4: cerrar un sheet **nunca** mueve el scroll de abajo (`reRender()`, no `closeModal(); render()`). La revisa: R-SCROLL.

### 14.3 Mapa por pantalla (v262)

| Pantalla (`state.screen`) | Instrumento | Cabecera | Contenido | Nav hoy | Notas |
|---|---|---|---|---|---|
| `landing` / `login` | primer uso | marca | `.start`, `.field`, `.toggles` | no | M0 sin evaluar (G4): tono de venta, etiquetas en mayúsculas, `← regresar`, marca con `//` en dos opacidades |
| `onboard` | primer uso (perfil) | `.obh` `gym//TRK//PROFILE` + una línea | filas de terminal `.obr` (clave `.obk` + control; `.obi`, toggles), pistas `.obhint`, vista previa `.obprev`, `▶ empezar` | no | v268, §7.34: la fila con foco lleva `>`; Enter salta al siguiente campo; guardar es aditivo |
| `home` (gym) | estado actual | `statusBar` + rotación + `dayHeadHTML` (`//NEXT`) | línea de preparación, músculos del día, vista previa (`[ ver rutina ▾ ]`), primario, //ESTÍMULO, //STATS | sí | con sesión viva solo existe `▶ resume workout` (v258, M1-01/M1-01b) |
| `workout` | registro | `.wline` (modo enfoque) | tabla de sesión, descanso, footer | no | §7.8, §7.20 |
| `macros` | composición | `statusBar` + día `‹ fecha ›` | anillo en `.card`, detalle (radar, P/C/F, INTAKE, retención), SUPPS → MEALS → WATER | sí | §7.24, §7.28 |
| `progress` | análisis | `.section` //PROGRESS | racha en franja, tiles `.ptile`, //FUERZA, //RECORDS, //MÚSCULOS, //RENDIMIENTO | sí | tiles → filas en G3 |
| `history` | archivo | `.section` //HISTORY | mes TRKCal, rail por mes, sesión que se abre en su sitio | no | |
| `histedit` | corrección | `dayHeadHTML` | tabla de sesión compacta (`.hist-compact`) | no (v267) | |
| `share` | resumen | según tipo | §7.19 | no | |
| `stack` | inventario | `.section` //STACK | TRKTabs HOY/TODOS, bloques por momento | **sí (debería no)** | §7.25 |
| `splitedit` | inventario | `.section` //SPLIT | días (`.seday`), ejercicios (`.seex`), deriva (`.sedrift`) | no | ▲▼ para reordenar y ✕ sin deshacer (G4) |
| `settings` | utilitario | `.section` //SETTINGS | //PERFIL, entrenamiento, //SALUD, datos (`sync data`, `espacio`, `export`, `import`, `reset data`) | no | `reset data` igual que `export` (M6-19); cinco nombres para el respaldo (M6-11) → G4 |
| `agenda` | — | — | sin acceso desde v226 | — | código muerto (`renderAgenda()`, G4) |
| overlays | — | — | §7.32 | — | — |

---

## 15. Excepciones

Toda excepción es funcional y tiene **id de categoría** (BRAND §6). En el CSS se marca pegada a la declaración. Hoy casi
todo el marcador es `/*ds:exempt*/` sin id; los primeros con id son `/*ds:exempt:ring*/` (radio del panel del anillo) y
`/*ds:exempt:loop*/` (el `>` de la nav, v267, y el cursor `.bcur` del arranque, v268). Objetivo G4: `/*ds:exempt:<id>*/` con un id de esta lista en todos
(R-EXEMPT). Marcar algo como exento exige que esté aquí (EXC-1).

| Id | Qué exime | Usos actuales |
|---|---|---|
| `ring` | el anillo de kcal (macros y compartir comida): única gráfica circular | `.ring.lg .num` tracking −1px · radio del panel `.card.kpanel` (`/*ds:exempt:ring*/`) |
| `table36` | tabla de sesión con celdas de 36 y campos a 12 (densidad en la serie); el ✓ amplía su toque con `::after` | sin marcador CSS (es la anatomía de §7.8) |
| `boot` | shader de marca del arranque (única excepción de fondo animado) y su tipografía | `.bootov .bt` tracking .02em; `startShader()` (detrás a `--op-dim` desde v268; no corre en el arranque corto) |
| `wrap` | overlay de un solo mensaje del wrap mensual | `.ws-big` 60 y tracking −2px · `.ws-month` 44 y −1.5px · tracking de `.wnav`, `.ws-lbl`, `.ws-sub`, `.ws-kick`, `.ws-year`, `.ws-cardh`, `.ws-cardf`, `.ws-share` (el wrap se reevalúa en G4: formato rechazado) |
| `scanner` | overlay de cámara | `.scan-reticle .chk` 40 · `.scan-reticle .scl` (bucle, también `loop`) |
| `loop` | bucles funcionales: única animación infinita permitida | `.cur::after` (`blink`, landing) · `.bootov .bcur` (`blink`, el cursor de `ready▌`, `/*ds:exempt:loop*/`, v268) · `.nav a.active::before` (`blink`, el `>` de la pestaña activa, `/*ds:exempt:loop*/`, v267) · `.wnav` (`blink`) · `.scan-reticle .scl` (`scanmove`) · `.restbar.fin` (3 destellos). v268 retiró los anillos de carga y su `@keyframes`: el trabajo en curso es texto (TRKSpin, §7.33) y no necesita excepción |
| `geom` | geometría atada al JS o centrado óptico de puntos | `.chwrap` y `.chxs` (40 de columna de etiquetas Y = `.chscrub right`) · `.slfc` (mismo margen de eje) · `.chsd` −5 (punto de 10) · `.strk-row .cd.t.l0::after` y `.cm .cd.t.l0::after` −1.5 (punto de 3) · `.dots3` (la sombra dibuja los puntos 2 y 3) · `.ag-hr i` 30 (agenda, muerta) |
| `vp-lock` | zoom bloqueado (§13.1) | meta viewport |
| `camera` | ícono TRK de cámara en compartir un ejercicio (lo que el dueño pone en sus historias) | hoy `.exsh .camon::before` con el emoji 📷 (objetivo G3: ícono TRK) |
| `user-label` | emoji dentro de las etiquetas del dueño | datos, sin marcador |
| `dev` (propuesta G1, no está en BRAND §6) | panel `?design=1`, fuera del alcance del sistema | `.dz-h` 11 y tracking .3px · `.dz-h button` 14 |

Otras excepciones funcionales sin marcador: el sheet **anclado arriba** (evita el teclado de iOS).

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

1. `statusBar(back)`: primarias sin atrás; secundarias con `[‹ origen]` (hoy `[‹ back]`) y sin nav.
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
5. Estados: vacío, pocos datos, cargando (TRKSpin o TRKProgress, §7.33; nunca un spinner propio), error, sin conexión,
   sugerido/estimado (§9, §12.2).
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
| R-RAD | radio de contenido fuera de la familia de B-05, resuelta desde `:root` (0 · `--r-sm` 2 marcas · `--r-mark`/`--r-ctl`/`--radius` 4): literal en px, píldora fuera de las barras finas o `--r-float` en contenido. R-RADF: lo que flota admite además `--r-float` 8 y sus alias | P1 |
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
  contando su `::after` (R-HIT), `txt` texto bajo `--o40` (R-TXT), `fsOff` tamaños fuera de la escala (incluido SVG y
  `--t-field`), `blur` fuera del chrome, `glyph` glifos fuera de `GLYPHS` (desde v268 acepta también `GLYPHS_VIZ`: los
  cuadros de TRKSpin, los bloques de TRKProgress y el box-drawing) y, desde v267, **`rad`**: esquinas de contenido
  más redondas que max(`--r-ctl`, `--radius`) (hoy 4), sin contar lo que flota (`DS_CHROME`), lo exento (`DS_EXEMPT`), los
  puntos (círculos ≤24) ni las barras finas `.bar`/`.wprog`/`.vbar` — la prueba de 5 s de BRAND §8. Solo reporta; los
  umbrales viven en la línea base.
- **R-SESS** (`_sessSafetyCheck()`): con sesión viva, `loglater`, `start`, `rest` y `skip` no cambian `activeWork.id`, no
  mueven `rotIdx` ni agregan o quitan sesiones; continuar + abortar no borra la sesión pasada; y desde v267, **sin split**
  (cuenta nueva) `loglater` abre una sesión libre (`dayId` null) y `rest`/`skip` no mueven la rotación ni agregan
  sesiones. Desde v258 es una aserción dura (`SELFCHECK R-SESS`): si falla, `?selftest=1` se detiene.
- **`_v268SelfCheck()`** (en `?selftest=1`, al final de la suite y en sandbox: nada llega al disco): la barra de texto
  (`trkBarTxt`: vacía, llena, a la mitad, con octavo y acotada a 0–100); que `TRK_SPIN` solo use `▖▘▝▗`; que el ticker
  corra con un `[data-spin]` en pantalla y se apague solo sin ninguno; **Z-2**: con `#bootov` en pantalla un aviso de
  la cola del arranque espera en vez de abrirse debajo; y `onboardgo` sobre una base nueva: guarda `profile.since`,
  conserva la meta de sueño, escribe `goalHist[hoy]`, el peso tecleado es el primer registro de `bodyweight` y sin peso
  tecleado no se inventa ninguno.
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
