# gym//TRK · estudio (tools/studio.html) — contrato entre archivos

El estudio es donde el dueño **ve y elige** el look: una vista previa de cada pantalla de la app real, controles por rol
(tamaños, líneas, interlineado, radios, opacidad, espaciado, vidrio, movimiento), propuestas `hoy | A | B | C` aplicadas a
la app real, configuraciones guardadas ("looks") para dejar reposar las ideas, la hoja de elección que manda a revisión y
el plan de mejora (//PLAN). Plan aprobado: `X:\claude-config\plans\y-el-plan-de-atomic-moler.md`.

## 0 · Reglas duras (todas, en todos los archivos)

1. **El estudio nunca escribe los datos del dueño ni cambia el look de su app.** La app real corre en `<iframe srcdoc>`
   detrás de `tools/studio/guard.js` (ver §2). Ningún archivo de `tools/studio/*` usa `localStorage`, `sessionStorage` ni
   `indexedDB` salvo `studio.js`, y SOLO con la clave `trkstudio_v1` a través de su helper `store`. Nunca `.clear()`.
   Nunca abrir IndexedDB (dañaría el almacén de respaldo de la app). `tools/` es público en Pages: nada personal en archivos.
2. JS puro, scripts clásicos (`<script src>`), sin dependencias, sin red (salvo `fetch('../index.html')` en studio.js),
   sin `eval`/`new Function`. Cada archivo cuelga UNA global (`window.TRK_*` o `window.__studio`).
3. Estética del estudio = la de la app (BRAND.md): JetBrains Mono (400/700/800), fondo #000, texto por opacidad, `//SECCIÓN`,
   `[verbo]` para acciones, un solo primario, chrome de vidrio (paneles/hojas flotantes), escala 10·12·16·22·34, sin emoji.
   Etiquetas de sistema en inglés (`//SCREENS`, `//TUNE`…), prosa en español.
4. Lo que el dueño ya decidió (BRAND §9) no se vuelve a preguntar: se muestra como "decidido · ver cómo queda".

## 1 · Archivos y orden de carga en `tools/studio.html`

`studio.css` · `scenarios.js` (TRK_SCENARIOS) · `knobs.js` (TRK_KNOBS) · `proposals.js` (TRK_PROPOSALS) · `demo.js`
(TRK_DEMO) · `plan.js` (TRK_PLAN) · `looks.js` (TRK_LOOKS, looks enviados que Claude sube; empieza `[]`) · `studio.js`
(núcleo; define `window.__studio`). `check.cjs` es un linter de node (no se carga en la página).

`studio.html` lleva **la misma `<meta http-equiv="Content-Security-Policy">` que `index.html`** (el `srcdoc` la hereda),
el mismo `<link>` de Google Fonts, `viewport` con `maximum-scale=1, viewport-fit=cover`, y sin scripts en línea.

## 2 · Frames (vistas previas) — dueño: studio.js

```js
const t = await fetch(new URL('../index.html?studio='+Date.now(), location.href), {cache:'no-store'}).then(r=>r.text());
const base = new URL('../', location.href).href;
iframe._trkCfg = { dbText?: string /* demo o archivo */, design?: false /* sin sus ajustes de ?design */ };
iframe.srcdoc = t.replace(/<head([^>]*)>/i, m => m + '<base href="'+base+'"><script src="tools/studio/guard.js?v=…"><\/script>');
```
- Tras `load`: exigir `W.__trk && W.__trk.sandbox===true`; si no, destruir el frame y mostrar "guardia no activa".
- `W.__trk`: `db`, `state` (getters), `writes` `{n,log}`, `mode` (`'window'` | `'prototype'`), `stress()`,
  `bootPreview(runner, hold, short?)` (v268: sin `short` = arranque completo — borra en la sombra `gymtrk_lastopen` y aparta
  la sesión viva solo durante la llamada síncrona a `bootScreen`; `short:true` = la versión corta, sin shader), `bootKill()`. Funciones de la app = globales del frame (`W.go('macros')`, `W.render()`,
  `W.reRender()`, `W.closeModal()`, `W.closeAsk(true)`, `W.closeExShare()`, `W.openMetricDetail('steps')`…).
- Un frame mide 393×852 (o 375×812 / 430×932). En el teléfono: 1:1 (ancho = 100vw, sin escalar). En escritorio se escala
  con `transform:scale()` si no cabe.
- **Aplicar un look** a un frame (en cada `load` y en cada cambio):
  1. `<style id="trk-tok">` en el `<head>` del frame = `html:root{--tok:valor; …}` de los tokens tocados (gana a `:root`).
  2. `<style id="trk-prop">` = el CSS de TODAS las opciones de TODAS las propuestas, concatenado (cada regla va con su
     alcance `html[data-v-<id>="<k>"]`, así solo actúa la elegida).
  3. `document.documentElement.setAttribute('data-v-'+id, k)` por cada propuesta con opción ≠ `hoy`.
  4. `tokens` de la opción elegida se suman a `trk-tok`.
  5. `dom(W)` de la opción elegida después de cada render (MutationObserver sobre `#app`, con rAF). Revertir: ver §5.
  6. Cambios en la nav: `W.document.getElementById('nav').dataset.built=''; W.render()` (la nav se construye una vez).
- **"hoy" sostenido** (comparar): deshabilitar `trk-tok` y `trk-prop`, quitar los `data-v-*`, revertir los parches DOM,
  `W.reRender()` y sin transiciones (`<style id="trk-notrans">*{transition:none!important;animation:none!important}`);
  al soltar, reaplicar.
- **Medir**: `W._dsRenderCheck()` → `{ua,hit,txt,fsOff,blur,glyph}` + (en el estudio) primarios visibles
  (`.start,.sheetbtns .ok,.footer .save,button.ok`) y marcas de color (elementos visibles con color computado = `--good`,
  `--bad`, `--warn`).

## 3 · `window.TRK_SCENARIOS` — scenarios.js

```js
{ id:'home', g:'pantalla'|'hoja'|'sesión'|'compartir'|'overlay'|'aviso', label:'gym · inicio', run(W,T){…}, live?:true, own?:true }
```
- `run(W,T)`: `W` = window del frame, `T = W.__trk` (`T.db`, `T.state`). Puede ser `async`. El estudio antes de cada uno
  hace: `W.closeExShare()`, `W.closeModal()`, `W.closeAsk(true)`, `T.bootKill()`, `W.go('home')` (en try).
- `live:true` = necesita sesión en curso: `if(!T.db.activeWork){ T.db.activeWork = W.newWorkSession(); }` (en memoria; el
  guardia absorbe lo que se guarde).
- `own:true` = el escenario arma su PROPIA sesión (aviso de inactividad, `workout:fs`): la del dueño se aparta y el siguiente
  escenario la devuelve; nunca se modifica una sesión real.
- **Cambios temporales en memoria** (v269, `later(W, deshacer)` en scenarios.js): cuando un escenario necesita otra forma
  de los datos, APARTA lo que estorba en `T.db` (misma referencia, misma posición) y registra cómo devolverlo; el siguiente
  escenario lo deshace antes de correr (en orden inverso) y llama `W.bumpIdx()`. Nada se borra ni se reescribe; lo que la
  app guarde en medio lo absorbe el guardia. Hoy: `m:supps-empty` (el stack entero y `suppHide` se apartan: la invitación
  de //SUPPS solo sale con el stack vacío) y `home:rest` (se apartan la sesión viva y lo entrenado hoy, luego el toque real
  de `[data-act="rest"]`; al salir se quita ese descanso). Un descanso real de hoy se deja como está.
- Cubrir TODO: las 60 de `tools/ds-diff.html` (S2; v269 sin `m:mood`; v271 + `m:log:saved` y `macros:unit`; v272 +
  `home:stimulus` y `m:deload`) + las 16 de `tools/ds-inventory.js` + arranque (`T.bootPreview(null,
  true, false)` y el corto `boot:short` con `true` y `live`), wrap (`W.monthlyWrap(W.prevMonthYm(), true)`), recap (forzar vía la lógica de `snapRecap` si es posible),
  aviso de inactividad (`W.promptIdleSession()` con una sesión en curso "vieja"), toasts (`W.toast('✓ guardado')`,
  `W.toast('⚠ error de prueba','err')`, con deshacer), `W.trkAsk({...})`, `W.holdConfirm({...})`, barra de guardado
  fallido (`W.saveFailed()` si existe), compartir un ejercicio (`W.openExShare(0)` con sesión en curso), `trkMenu`,
  `trkWheel`, `trkSelect`. Cada función debe existir en `index.html` (verificarlo con grep); si no, no se incluye.
- v269: `prog:edit` (`W.go('progress'); W.openProgConfig()` → modo widgets; `openProgConfig` ya no abre hoja y solo actúa
  desde progress), `m:progcfg` (el mismo modo + `W.openProgAdd()`, la hoja `+ add`), `macros:open` (el toque real de
  `[data-act="togglemacros"]` en el frame; sin el botón, `T.state.macroOpen`), `m:supps-empty`, `home:rest` y `exsh:cam`
  (compartir ejercicio con la cámara de video + REC en la 1.ª `[data-camsi]`, sin volver a tocarla si ya la tiene; la marca
  vive en `state._cam`, no en `db`). Fuera `m:mood` (se retiró el ánimo). Total v269: 104 escenarios (`m:machine` de S2
  vive aquí como `live:machine`).
- v271: `m:log:saved` (hoja · loguear alimento guardado: `macros` en el último día con comida y `W.openLog(food de
  T.db.foods, {fromId, tag})` con `W._faCtx=null`, así `[cancel]` cierra; sin la fila "guardar en mis alimentos") junto a
  `m:log`, que se queda como el alimento nuevo (`isNew`: fila `guardar en mis alimentos [sí] no`, primario siempre
  `loguear`; se reetiqueta, no hay `m:log:new`); `macros:unit` (lo de `macros:open` + el toque real de
  `[data-act="toggleMacroUnit"]`, siempre de gramos → %; `state.macroPct` vuelve a su valor con `later`). El recap usa
  `W.fmtSleep(...)` (h y min, como `snapRecap`), `//TODAY` y `—` sin sesión ni descanso. Total v271: 106 escenarios.
- v272 (σ v2 y estado del progreso): `home:stimulus` (`W.go('home')` y `#view` desplazado hasta //STIMULUS con
  `scrollTop` —helper `toSection`, sin `scrollIntoView`, que también movería la página del estudio—: σ de 7 días por
  músculo real, barra con marcas neutras en 10 y 20, una frase solo si hay algo que mover, color solo en el ⚠; arriba,
  una vez, la fatiga acumulada y "mucho fallo en N músculos") y `m:deload` (hoja · fatiga acumulada: `W.openDeloadInfo()`
  directo; sin `fatigueFlag()` sale la receta de la semana ligera sin la línea de qué viene bajando). Solo lectura: ni
  `later` hace falta. `m:muscle`, `m:volume`, `m:lift`, `m:session`, `home`, `progress` e `histedit` no cambian de
  receta y ya pintan σ (VOLUME/STIMULUS/FATIGUE del músculo, e1RM en su unidad real con su línea de estado). Fuera
  MEV/MRV y la guía RP: la marca `.mrv` (--warn .7) ya no se pinta. Total v272: 108 escenarios.
- Etiquetas cortas en español: `gym · inicio`, `macros`, `hoja · agregar alimento`, `sesión · tabla`, `arranque`…

## 4 · `window.TRK_KNOBS` — knobs.js

```js
{ g:'tipografía', key:'type', rule:'B-04 · TYP-1', note:'…', check?(vals)=>string|null,
  items:[ { tok:'--t-data', l:'dato', d:12, min:12, max:13, step:1, u:'px', x:{min:11,max:14},
            kind?:'alpha'|'px'|'num'|'ms'|'raw', rgb?:'243,243,243', sel?:'.inp,.pick', presets?:[{l:'píldora',v:999}] } ] }
```
- `d` = el valor de HOY leído de `:root` de `index.html` (verificar cada uno). `min/max` = rango BRAND; `x` = rango
  "explorar" (fuera de BRAND): se permite, pero la exportación lo marca como **pregunta**. El slider cubre la unión.
- `kind:'alpha'` → el token es `rgba(rgb, a)` y el control mueve `a` (escalera `--o*`, vidrio).
- `sel` = selectores donde vive ese token (para el inspector y para "dónde se ve").
- Grupos (key): `type` (5 tamaños de la escala 10·12·14·20·28 + `--t-field` 14 solo en editables —16 en v267, 14 desde
  v269: rango BRAND 14–16, explorar 12–20—; `check`: label<data<section<display<hero, 800 nunca bajo 12 y campo nunca
  bajo 14), `tracking` (4),
  `lineheight` (`--lh-*`), `lines` (los 11 `--bw-*`, con `sel` exacto de §9), `strokes` (`--sw-*`), `radius`
  (`--r-sm`, `--r-mark`, `--r-ctl`, `--radius`, `--r-pill`, `--r-float`, `--r-sheet`, `--r-nav`, `--r-toast`, `--r-pop`,
  `--r-bar`; familia v267 "terminal sobrio": control y tarjeta ≤ 4 (hoy 4), marcas 2, gráficas 4, flotante 6–12 (hoy 8) y
  nunca menos redondo que el contenido; presets píldora), `opacity` (escalera `--o70…--o10` alpha con `check` de contraste:
  `--o40` sobre #000 ≥ 4.5:1 — luminancia relativa WCAG de rgb(243,243,243)·a — y orden monótono; más `--op-*`),
  `spacing` (los 8 `--sp-*` con los rangos de `DESIGN_KNOBS` de index.html), `glass` (`--glass-bg` α, `--glass-bg-strong`
  α, `--glass-blur`, `--glass-sat`, `--glass-ring` α, `--glass-edge` α, `--glass-edge-lo` α), `motion` (`--dur-1/2/3`,
  `--dur-screen`, `--mv-1` 0–4, `--dur-hold`, `--dur-blink` del `>` de la nav).
- `TRK_KNOBS.locked = ['fuente JetBrains Mono', 'pesos 400·700·800', 'escala de espacio --s1…--s8', 'colores semánticos', 'capas z']`
  (se muestran, no se mueven).

## 5 · `window.TRK_PROPOSALS` — proposals.js

```js
{ id:'nav', n:1, group:'G0'|'G3', title:'nav', rule:'B-05 · BRAND §4', question:'…', src:'brand-lab §1',
  status:'open'|'decided'|'shipped', decided:null|{pick:'B',date:'2026-09-21',quote:'…'}, shipped:null|'v261',
  scenarios:['home','macros','progress'],                 // dónde se juzga (ids de TRK_SCENARIOS)
  options:[ {k:'hoy', label:'hoy'},
            {k:'A', label:'cápsula 999 · activa invertida', note:'…',
             css:`html[data-v-nav="A"] .nav{…}`,            // SIEMPRE con su alcance
             tokens:{ '--r-float':'12px' },                  // opcional
             dom:(W)=>{…},                                   // opcional, idempotente (ver abajo)
             shader:(canvas,W)=>stopFn } ] }                 // opcional (solo arranque)
```
- CSS: cada selector empieza con `html[data-v-<id>="<k>"]`. Solo `var(--x)` que existan en `:root` de index.html o que la
  opción declare en `tokens`. Prohibido: `font-family`, colores literales (`#hex`, `rgb(`), `backdrop-filter` fuera del
  chrome (`.nav`, `.sheet`, `.toast`, `.tsel`, `.gloss`, `#asklayer`), peso 600, glifos fuera de `GLYPHS` de index.html.
- `dom(W)`: solo (a) agrega clases con prefijo `trkp-`, (b) atributos `data-trkp-*`, (c) inserta nodos con
  `data-trk-patch`, (d) cambia el texto de una etiqueta **de sistema** guardando el original en `data-trk-orig`. Nunca
  toca etiquetas del dueño (nombres de ejercicio, comidas, músculos, etc.: B-12). Revertir (lo hace studio.js): quitar
  `[data-trk-patch]`, restaurar `data-trk-orig`, quitar clases `trkp-*` y atributos `data-trkp-*`, `W.reRender()`.
- `shader(canvas,W)`: WebGL propio sobre el canvas del arranque real (`T.bootPreview(runner,true)` lo engancha), con
  `devicePixelRatio`, encuadre **cover** (normalizar por el lado MAYOR: sin "comprimido"), `resize`, y devuelve `stop()`.
- Primer lote (G0, `group:'G0'`): los 7 de `tools/brand-lab.html` llevados a la app real — 1 nav, 2 primario, 3 radio
  flotante (8/12), 4 panel del anillo, 5 íconos TRK, 6 arranque (hoy + A corregido + B tramado + C fósforo), 7 borde de
  campo. Lote G3 (`group:'G3'`): tarjetas → `//TÍTULO` + regla o caja de 2 px; secundarios `[verbo]`; verde solo en el
  glifo o el número; `[‹ origen]`; `recovery ~43`; retención reducida; marca única `gym//TRK`; interlineado y opacidad a
  la escala; etiquetas de sistema en inglés (decidido); esquinas de contenido (v264: control 12; v267: control y tarjeta a 4,
  flotante a 8, "4 px, suave"); anillo (decidido: se queda). Lote v267 "terminal sobrio" (`shipped v267`, sin CSS): 1 nav
  (opción D, `>` que parpadea), 2 primario, 9 secundarios `[verbo]`, 18 esquinas, 20 `type` (14·20), 21 `fields` (caja fina
  de 16), 22 `toggles` (`[elegida]`). Lote v269 (24-sep, `shipped v269`, sin CSS): 23 `camera` (cámara de video con punto
  REC en `--bad`; la propuesta 5 `icons` ya solo toca `[compartir]`), 24 `progedit` (//PROGRESS en modo widgets) y la nota
  de 21 `fields` (letra de campo 14 app-wide, casillas del perfil de 36).

## 6 · `window.TRK_DEMO` — demo.js

`TRK_DEMO.build(todayDate?) → objeto db` (JSON) que la app acepta tal cual (`migrate()` sin errores): `_demo:true`,
usuario `demo`, split push/pull/legs genérico (ids estables únicos), ~10 semanas de sesiones con drop set, unilateral y
cardio, comidas genéricas por día, agua, 2 suplementos, sueño, pasos y peso corporal; sin ánimo (v269: `migrate()` lo
purga con `purgeMood`, que el `--check` también extrae); fechas relativas a hoy (racha y "hoy" siempre con datos). PRNG con
semilla fija. Nada del dueño. `node tools/studio/demo.js --check` valida la forma y
sale con 1 si algo falta.

## 7 · `window.TRK_PLAN` — plan.js

```js
{ updated:'2026-09-22', note:'…', phases:[ { id:'G3a', title:'chrome', version:'v261', status:'hecho'|'en curso'|'por decidir'|'pendiente',
    items:[ { id:'nav', text:'nav elegida (texto, ≥44, sin animar columnas)', status:'por decidir', proposal:'nav', audit:'RADF 9→0' } ] } ] }
```
Fases: G1 (hecho), G2/v258 (hecho), F0/v259 (hecho), T/v260 (hecho), S1 estudio (hecho), G0 decisiones, TS/v267 terminal
sobrio (hecho), P1/v268 primer arranque (hecho), V269 lo del 24-sep (hecho), V270 salud por Atajo (hecho), V271 comida y
unidades (hecho), V272 σ v2 y estado del progreso (hecho), y en el orden aprobado por el dueño (24-sep): V273 split: cómo
entrenas, V274 progreso por ejercicio, V275 suplementos con marca y frasco, V276 macros: laboratorio y carrusel, V277 configuración
paso a paso (antes V271a), V278 cuentas (antes V271b), V279 Pro y anuncios (antes V273), V280 tour (antes V274); G3a–d y
G4a–c sin versión fija (del plan aprobado). `proposal` enlaza a TRK_PROPOSALS.

## 8 · Núcleo — studio.js / studio.html / studio.css

- **Estado** (`trkstudio_v1`, ≤ 8 KB): `{v:1, data:'tuyos'|'demo'|'archivo', size:'393x852', scenario, picks:{id:k},
  tokens:{tok:valor}, looks:[{id,name,created,updated,status:'borrador'|'en reposo'|'enviado'|'aprobado'|'implementado',
  notes,picks,tokens,data}], seen:[ids], ui:{tab,mode}}`. Helper `store.get()/store.set()` en try/catch; si el
  almacenamiento falla, el estudio sigue en memoria.
- **Datos:** `tuyos` (lee la base de ESTE navegador, solo lectura, vía el guardia) · `demo` (`TRK_DEMO.build()` →
  `_trkCfg.dbText`) · `archivo` (input de archivo `.json/.txt` → `_trkCfg.dbText`, en memoria). Aviso fijo: en el iPhone
  la app de la pantalla de inicio y Safari no comparten almacenamiento; para ver tus datos reales ahí usa *archivo* con el
  respaldo que ya exportas a Archivos. Sin datos en *tuyos* → cae a demo y lo dice.
- **Pestañas** (etiquetas en inglés): `//SCREENS` (lista por grupo, `‹ ›`, `[tour]` recorrido 1.5 s c/u) · `//TUNE`
  (controles por grupo; valor editable; tocar el valor = volver a hoy; badge "fuera de BRAND" en rango explorar;
  resultado del `check` del grupo) · `//PROPOSALS` (tarjeta por propuesta: título, regla, pregunta o "decidido · ver cómo
  queda", segmentado `hoy | A | B | C`, notas, `[ver en su pantalla]`, `[medir opciones]` → tabla con §8 por opción;
  arranque: `[ver arranque]`) · `//LOOKS` (guardar el look actual con nombre; lista con estado, fecha; cargar, duplicar,
  renombrar, cambiar estado, borrar con confirmación; comparar dos; `[copiar código]`/`[pegar código]` para pasar de
  dispositivo; `[enviar a revisión]` → estado `enviado` + hoja de elección por `navigator.share({text})` o portapapeles) ·
  `//PLAN` (fases de TRK_PLAN con su estado; un ítem con `proposal` abre esa propuesta).
- **Hoja de elección** (texto): primera línea `TRK-PICK v1 · <look> · base <versión> · datos <modo>` y luego
  `1nav=B 2primary=A …`; tokens `--t-label 10→11`; "fuera de BRAND" como preguntas; notas; y un bloque `--- CSS ---` con
  `html:root{…}` + el CSS de cada opción elegida SIN su alcance (lo que G3 hornearía).
- **Inspector** (`[inspect]`): captura de clic en el frame (fase de captura, `preventDefault`), resalta el elemento y
  muestra: etiqueta y clase, tamaño de letra → token por valor (`--t-*`), peso, interlineado → `--lh-*`, color → token por
  valor (escalera `--o*`, `--fg`, semánticos), bordes → los `--bw-*` cuyo `sel` coincide, radio → `--r-*`, y cuántas
  veces aparece `var(--tok)` en index.html; `[ajustar]` abre ese control.
- **Cero escrituras:** `window.addEventListener('storage', …)`: si `e.url` es `about:srcdoc` o no es index.html → alarma
  P0 (destruye frames, badge rojo "ESCRITURA DETECTADA"); si viene de la app en otra pestaña → nota neutra. Badge normal:
  `guard · window · 0 real writes · N absorbed`. `[full test]`: recorre todas las pantallas y opciones, llama
  `T.stress()` y compara firmas (longitud + 20 primeros + 20 últimos caracteres) de todas las claves `gymtrk*` reales antes
  y después → verde o rojo.
- **Distribución:** teléfono (`max-width:700px` o puntero grueso): frame 1:1 a pantalla completa, barra inferior de 52 px
  `‹ <pantalla> ›  [hoy]  [≡]` (safe-area), `[≡]` abre una hoja de vidrio con las pestañas (70 % de alto), `[hoy]` es un
  botón de mantener (pointer events, `touch-action:none`, `-webkit-touch-callout:none`, `user-select:none`, cancela con
  `pointercancel`). Escritorio: columna de 340 px con las pestañas + área de frames con modos `1` · `hoy | después` ·
  `variantes` (hasta 4 frames, perezosos) y selector de tamaño.
- **Enlaces:** `?p=<propuesta>&s=<pantalla>` abre directo.
- **API para Claude:** `window.__studio = { state(), go(id), set(picks), tok(map), measure(), coverage(), exportJSON(),
  zeroWrite(), looks() }`.

## 9 · Selectores de las líneas (`--bw-*`) — de la tokenización v260

- `--bw-sep` .5: `.mmrow,.mscrow,.dxrow,.stline,.mdtr,.trow+.trow,.mdtabs,.mdstats,.hrow,.hist-rail .hitem,.lc,.mrec+.mrec,.msum-items,.stq,.exrow,.senm,.pickitem,.nvm,.ws-h,.u-sep,.whl-sel,.pedbar`
- `--bw-box` .5: `.spc,.wq,.wchip,.chst,.msum-time,.sedrift,.mgbar,.bwchip,.inp,.pick,.tselo,.fs,.chip,.inp-mini`
- `--bw-dash` .5: `.exsub .mch,.exhead .mch,[data-gloss],.u-dash`
- `--bw-leader` 1: `.line .dots,.mddots`
- `--bw-field` 1: `.mmrow select,select.pfsel,#pf_gym,.pfw,.mdcust input,.field input,.field select,.slph input,.slblk input,#fa_q,textarea.ta,.gnmin,.obi`
- `--bw-ctl` 1: `.status .back,.secondary .b,button.b,button.t,button.cancel,.mdcust .b,.lact,.restbar a,.footer .abort,.footer .undo,.toggles button,.sheetbtns .cancel,.fa-btns .b,.fa-empty .fa-em-step,.start.ghost,.hold,.ag-chip`
- `--bw-card` 1: `.pfeat,.pthrow,.ptile,.hcal,.card,.grp,.ws-card,.ag-blk`
- `--bw-rule` 1: `.rule,.footer,.restbar,.stk-blk,.ghead,.grp .item,.shbanner,.nl-row,.mbody,.seday`
- `--bw-chrome` 1: `.glass,.glass-strong,.sheet.glass-strong,.tsel,.gloss,.savebar,.dragghost`
- `--bw-mark` 2: `.scan-reticle .frame2,.ptile.dropbefore,.ptile.dropafter` (v269: + la barra de soltar del modo
  widgets) · `--bw-focus` 1.5: `:focus-visible`

## 10 · check.cjs (node, sin npm)

Carga `scenarios.js`, `knobs.js`, `proposals.js`, `plan.js`, `looks.js`, `demo.js` con `vm` (window falso) y valida:
- propuestas: ids únicos; opción `hoy` primero; cada regla CSS con su alcance exacto; `var(--x)` existente (en `:root` de
  `../../index.html`) o declarado en `tokens`; sin `font-family`, `#hex`, `rgb(`/`rgba(` literales, `backdrop-filter`
  fuera del chrome, `font-weight:600`; glifos dentro de `GLYPHS` (leer `const GLYPHS=` de index.html); `decided` exige
  `decided.quote` y que la fecha aparezca en BRAND.md §9; `shipped` sin CSS en sus opciones; `scenarios` existentes.
- knobs: `tok` existe en `:root`; `d` = valor real de `:root`; `min≤d≤max` o, si no, `x` lo cubre; grupos con `key`.
- escenarios: ids únicos; `run` es función.
- demo: `TRK_DEMO.build()` devuelve `_demo:true`, `profile.username`, `split.days` con ids únicos, sesiones, comidas.
- plan: cada `proposal` existe.
- **seguridad** en `tools/studio/*.js` (menos guard.js): nada de `localStorage`/`sessionStorage`/`indexedDB` salvo en
  studio.js y solo con `'trkstudio_v1'`; nada de `.clear(`; nada de `eval(`/`new Function`; ningún `setItem`/`removeItem`
  con `gymtrk`.
Imprime un resumen y sale con 1 si hay problemas.
