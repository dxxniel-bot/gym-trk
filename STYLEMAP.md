# gym//TRK — STYLEMAP (mapa de estilos por pantalla)

> Referencia viva + **design-system** para TODOS los forks. Estado **v171**: Liquid Glass (chrome) **LANDED** (sheets/toast v169, nav flotante v170), color consolidado (v160), headers tokenizados (v171).
> Alma locked: mono/ASCII, JetBrains Mono, monocromático (negro + escala de opacidad blanco + verde/rojo). Solo capa visual; nunca renombrar etiquetas del usuario; anillos solo en macros.
> Todo vive en `index.html` (`<style>` ~l.16-490; renders en `<script>`). Editar → `node --check` → bump `sw.js` → push → verificar iPhone `?v=N`.
> ⚠️ **Deuda de inline `style=`: 361 (creció +120 con features de los forks).** La homogeneización es disciplina COMPARTIDA: usa las clases de §DESIGN SYSTEM (abajo), no `style=` inline. La nav/sheets/toast ya son glass — NO meterles inline.

## 1. Pantallas (`state.screen`, router en `render()`)

| Pantalla | Fondo | Header | Contenedores | Colores dominantes | ¿Nav? |
|---|---|---|---|---|---|
| **landing** | `#000` | — (logo + CTA) | `.start`/`.secondary` | `--fg` `--o50` `--o40` | no |
| **login** | `#000` | — (título) | `.field` · `.ta` | `--fg` `--o50` | no |
| **onboard** | `#000` | — | `.field` · `.toggles` | `--fg` `--o50` `--o30` | no |
| **home** | `#000` | **`.whdr`** (día grande + `//NEXT`) | `.rot` · `.section .h`(//STATS,//VOLUME) · `.vbar` | `--fg` `--o50` `--o40` `--o10` | **sí** |
| **workout** | `#000` | `.whdr.top` (`//NOW`) | tabla densa `.thead/.srow/.inp/.gc-*` · `.mgroup` | `--fg` `--o60..--o20` · good/bad | no (footer) |
| **macros** | `#000` + `.card` | `.section .h` (`//FUEL`) | anillos P/C/F (SVG) · `.mrow` intake · `.grp/.item` food log | `--fg` `--good/--bad/--warn/--info` `--o50/--o40` | **sí** |
| **progress** | `#000` + `.ptile` | `.section .h` | `.pfeat`/`.ptile` · lineChart SVG | `--fg` good/bad `--o50/--o40` | **sí** |
| **stack** | `#000` | `.section .h` | tabs · `.grp-label`/`.line` | `--fg` `--o60/--o50/--o40/--o20` | **sí** |
| **history** | `#000` + `.card` | `.section .h` (`//HISTORY`) | `.hmon` mes · `.grp`+`.hrow` | `--fg` `--o50/--o40/--o30` · good/bad (agg) | no (footer) |
| **settings** | `#000` + `.card`/`.grp` | `.section .h` | `.line` (data) · `.field` · `.start`/`.secondary` | `--fg` `--o60..--o30` | no (footer) |
| **splitedit** | `#000` + `.seday` | `.senm` (editable) | `.seex`/`.srowm` | `--fg` `--o60..--o30` | no (footer) |
| **share** ⭐ | `#000` | `.shbanner` | `.sgrp/.sgh/.sitem/.shfoot` | `--fg` · good/bad | no |

⭐ **`renderShare` = BENCHMARK de cohesión** (cero inline, todo en clases). NO tocar. Imitar su estilo.

**Nav presente:** home · macros · progress · stack. **Sin nav** (muestran footer/restbar): workout · settings · splitedit · history · share (`renderNav` l.720 las oculta).

## 2. Chrome / flotantes (targets de glass)

| Elemento | Estado actual | Plan glass |
|---|---|---|
| `.nav` (bottom) | barra pegada `flex:0 0 60px`, border-top | **→ píldora flotante glass** (absolute al frame) |
| `.sheet` (modal) | `#0c0c0c` móvil / `#0a0a0c` desktop (doble bg ⚠) | **glass-strong** (+ fallback `--sheet-bg`) |
| `.toast` | `#13131a` (crudo ⚠) + border `--good` | **glass-strong** (border verde se conserva) |
| `.restbar` (rest timer) | `--frame`, border-top `--o12` | **glass** + radio pill |
| `.fab` (+) | sólido `--fg`, texto `#0c0c0c` (invierte en desktop ⚠) | **sólido** (`--on-fill`) — NO glass |
| `.addpop .api` | sólido `--fill` | **sólido** — NO glass |
| `.bootov` (boot/recap) | sólido `--frame` | **sólido #000** (terminal puro) — NO glass |
| `.dz` (design panel, `?design=1`) | `#0c0c0e` (crudo, dev-only) | — (dev, baja prioridad) |

**Regla glass:** solo CHROME flotante; el CONTENIDO sigue flat. Glass NEUTRO/acromático (sin tinte de color). La **tabla de workout (`.thead/.srow/.inp/.gc-*`) JAMÁS lleva glass** (sharp/densa por diseño).

## 3. Roles de color (canónico) — escala de opacidad → rol

| Rol | Token | Notas |
|---|---|---|
| Valor primario / texto fuerte | `--fg` (#f3f3f4) | títulos de tarjeta, valores principales |
| Valor secundario / acción-link | `--o60` | links de nav/acción, valores meta |
| Header de sección | `--o50` | `.section .h`, `.whdr` labels, labels de campo |
| Meta / caption / hint visible | `--o40` | submeta, captions, músculo en gris |
| Hint tenue / placeholder | `--o30` | placeholders, hints muy suaves |
| Hairline / icono apagado | `--o20` | bordes finos, flechas off |
| Divisoria de contenido | `--line` (.08) | `.rule`, separadores |
| Borde de card/control | `--border` (.09) | `.card`, `.field input` (formulario) |

**Semánticos:** `--good`(#46c98b verde=mejora/completo/en-meta) · `--bad`(#e5675c rojo=baja/over) · `--warn`(#e3b34f amarillo=límite suave) · `--info`(#6aa6ff azul=déficit calórico, **única excepción cool**, vive en `balanceOf`).

**Dualidad de bordes (INTENCIONAL, no unificar):** formulario = `1px solid var(--border)`; tabla densa workout = `.5px solid var(--o20)`.

**Inconsistencias a vigilar (en consolidación):** `--on-fill:#000` debe reemplazar los `#000`/`#0c0c0c` dispersos (texto sobre `--fill`); hex crudos `#13131a`/`#0c0c0e` → tokens; `.sheet` doble bg → glass+fallback; links: acción/nav=`--o60`, meta=`--o50`.

## 4. Tokens (referencia rápida, `:root` l.17-34)
- **Tipo:** `--t-display:22 · --t-section:16 · --t-body:13 · --t-sm:12 · --t-meta:11 · --t-xs:10 · --t-caption:9`
- **Spacing:** `--s1:2 · --s2:4 · --s3:8 · --s4:12 · --s5:16 · --s6:24` (+ knobs `--sp-*` ajustables con `?design=1`)
- **Radio:** `--r-ctl:12 (botones/inputs) · --radius:16 (tarjetas) · --r-sheet:22 (modales) · --r-pill:999 (chips/nav/barras) · --r-sm:2 (tabla densa/hairline)`
- **Superficie:** `--card:#0d0d10 · --card2:#16161c · --sheet-bg:#0a0a0c · --fill:#f3f3f4 · --track · --border · --line`
- **Glass (plan):** `--glass-bg/-strong · --glass-blur:18 · --glass-edge · --glass-shadow · --on-fill:#000`

## 5. Reglas heredadas (de CLAUDE.md / feedback del dueño)
- **Anillos radiales SOLO en macros** (P/C/F); todo lo demás lineal/texto.
- **`//SECTION`** = headers de sección; brackets `[+ set]` para acciones; `.whdr` = firma de las pantallas de gym (NO aplanar).
- **Nunca renombrar/mergear etiquetas del usuario** (músculos, nombres custom): mostrar EXACTO; alias solo en lookups internos.
- **Inputs densos (set w/r/rir) = `.inp` 36px** es la referencia; "la caja cabe su contenido" (no inflar; el 44px es para botones/campos, no grillas numéricas).
- **`renderShare`** es el benchmark de cohesión a imitar.

## 6. Excepciones documentadas
- `--info` (azul): único color cool, estado "déficit calórico" en `balanceOf` (l.3400). No es decorativo.
- `.scan-reticle` usa `rgba(...,.85)` (1 uso, overlay de cámara).
- `.dz` design panel: estética dev-only (`?design=1`), no parte de la app de usuario.

## 7. DESIGN SYSTEM — clases compartidas (TODOS los forks: úsalas, no `style=` inline)
Existen en `<style>`; reemplazan los patrones inline más repetidos. Antes de escribir `style="font-size:…"` o `style="color:…"`, usa una de estas:

**Texto / meta** (matan `font-size`+`color` inline):
- `.t-meta` (11px o50) · `.t-xs` (10px o40) · `.muted` (o40 dentro de otra línea) · `.muted2` (o50) · `.kc-right` (`float:right;color:o50` — kcal a la derecha en filas de food).

**Form:**
- `.field` (wrapper + label) · `.field input/select` (h44, r-ctl, --card) · **`textarea.ta`** (+ `.sm/.md/.lg/.xl` por altura — NO textarea inline) · `.field .inline-row` / `.field select.grow` / `.field input.w72` (selects en fila).

**Sheet / modal:** `.sheet` (ya es **glass-strong**, no tocar bg) · `.sheet h3` (título) · `.sheet h3 .sub` (subtítulo `· tag`) · `.sheetbtns` (.ok/.cancel/`.cancel.danger`).

**Botones:** `.start` (primario filled h48) · `.secondary .b` / `.toggles button` (outline) · texto sobre `--fill` = `var(--on-fill)` (NO `#000`/`#0c0c0c`).

**Listas / tarjetas:** `.card` · `.grp`+`.item` (food log) · `.line`/`.mdline` · `.prow`+`.pr-r` (fila genérica) · `.semv span` (flechas reorder, `.off`=extremo).

**Glass (chrome flotante, neutro/acromático):** `.glass` / `.glass-strong` (= bg translúcido + `backdrop-filter` + edge highlight + safeguards iOS + fallbacks). Aplicado a nav/sheet/toast. **NO** en contenido, **NUNCA** en la tabla de workout (sharp por diseño).

**Spacing puntual:** `.submeta.gap` · `.mt-s3/.mt-s4/.mt-s5/.mb-s4` (huérfanos; preferir tokens `--s1..6` en clases).

> Si un patrón inline se repite ≥3×, conviene clase nueva (no utility-soup). El benchmark de cero-inline es `renderShare`.

## 8. Tooling de diseño — qué skills/MCP usar (y cuáles NO)
> Criba 2026-06-16, calibrada al alma terminal/mono + JetBrains Mono, offline single-file. Objetivo: evitar "design slop" (fuentes nuevas, gradientes, glass colorido, "premium SaaS") que rompería el sello.

**ADOPTAR (van con el sello o son agnósticas de estética):**
- **`brutalist-skill`** — estrella polar: monospace, rejilla rígida, radius 0, color semántico mínimo, cero gradiente/sombra. Referencia de estilo, NO generador.
- **`impeccable`** — modo audit/polish/animate sobre lo existente (no genera de cero). Ideal para evolución-no-rediseño.
- **`emil-design-eng`** — filosofía de motion (animar solo con razón, easing custom, respeta reduced-motion). Implementable en CSS vanilla.
- **`ecc:accessibility`** (WCAG 2.2) · **`ecc:browser-qa`** — audit, agnósticas, offline-safe.
- **MCP `playwright`** — review visual sistemático (ver loop QA abajo). Reemplaza los scripts puppeteer ad-hoc (`tools/export-pdfs.cjs`).
- A revisar al tocar glass: **`ecc:liquid-glass-design`**, **`ecc:make-interfaces-feel-better`** (no leídas aún).

**MEDIAS — solo la filosofía (asumen React/Tailwind; no portear su stack):** `minimalist-skill` · `taste-skill` · `redesign-skill` · `ecc:design-system`.

**EVITAR — romperían el sello o el stack (React/Tailwind/offline):** `frontend-design` · `soft-skill` · `ui-ux-pro-max` · `gpt-tasteskill` · `stitch-skill` · `imagegen-*` · **MCP `magic`/21st** (genera componentes React).

### Loop QA con Playwright (review de cada lote — glass REAL, no fallback sólido)
1. Servir: `python -m http.server 4599 -d repo` (background).
2. `browser_navigate http://localhost:4599/index.html` → `browser_resize 393×852`.
3. Sembrar demo: `browser_evaluate` con el cuerpo de `buildDemo()` de `tools/export-pdfs.cjs` (usa `seed()/demoSplit()/todayISO()` de la app) → escribe `gymtrk_db_v1` + `sessionStorage.gymtrk_boot='1'`.
4. Recargar → `browser_evaluate go('<screen>')` → `browser_take_screenshot {fullPage:true}` → `Read` el PNG.
5. Pantallas de entrada (landing/login/onboard): `localStorage.removeItem('gymtrk_db_v1')` + reload antes de capturar.
> Ventaja vs PDF/SVG: renderiza el `backdrop-filter` en vivo, estados interactivos y sheets. Para handoff editable a Illustrator sigue siendo `tools/export-svg.cjs` (SVG) — ver design-exports.

---
*Actualizado 2026-06-16 — §8 tooling/skills criba + loop Playwright QA. (v171 base: glass landed; deuda inline 361, disciplina compartida.)*
