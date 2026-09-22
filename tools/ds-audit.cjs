#!/usr/bin/env node
// gym//TRK — auditor del sistema de diseño (DESIGN_SYSTEM.md §18). Node puro, sin dependencias ni npm.
// Uso:  node tools/ds-audit.cjs            → reporte legible
//       node tools/ds-audit.cjs --json     → contadores en JSON (para comparar antes/después)
//       node tools/ds-audit.cjs --strict   → sale con código 1 si hay P0 detectables o si sube un contador R-* P0/P1
//                                            contra tools/ds-baseline.json
//       node tools/ds-audit.cjs --list     → cada hallazgo R-* como `R-xx @ index.html:NNN · fragmento`
//       node tools/ds-audit.cjs --write-baseline → guarda los contadores R-* actuales (conserva el bloque `render`)
// Mide lo que se puede medir: tokens usados vs literales, valores fuera de escala, variables sin definir, pesos no
// cargados, colores literales, reglas duplicadas, deuda de style="" por función. Lo semántico (verde decorativo,
// glass en contenido) sigue siendo revisión humana con las capturas.
'use strict';
const fs = require('fs'), path = require('path');
const fileArg = process.argv.slice(2).find(a => !a.startsWith('--'));   // otro archivo (p. ej. un respaldo) para comparar antes/después
const FILE = fileArg ? path.resolve(fileArg) : path.join(__dirname, '..', 'index.html');
const raw = fs.readFileSync(FILE, 'utf8');
// las excepciones documentadas (§15) llevan /*ds:exempt*/ junto a la declaración y no cuentan como desviación
const html = raw.replace(/[a-z-]+\s*:\s*[^;{}]*?\/\*ds:exempt(?::[\w-]+)?\*\//g, '');
const exemptCount = (raw.match(/\/\*ds:exempt(?::[\w-]+)?\*\//g) || []).length;
const args = process.argv.slice(2);

// ---- escalas del sistema (DESIGN_SYSTEM.md §4) ----
const TYPE_OK = new Set([10, 12, 16, 22, 34]);   // v256: escala única 34·22·16·12·10 (mueren 13, 11 y 9)
const RADIUS_OK = new Set(['0', '2px', '4px', '12px', '16px', '22px', '999px', '50%']); // literales tolerados solo mientras migran a token
const SPACE_OK = new Set([0, 1, 2, 4, 6, 8, 10, 12, 16, 24, 32, 48]);   // 6 y 10 = medios pasos de componente
const LS_OK = new Set(['0', 'normal']);   // todo lo demás va por var(--ls-*)

// ---- partes del archivo ----
const cssStart = html.indexOf('<style>'), cssEnd = html.indexOf('</style>');
const css = html.slice(cssStart + 7, cssEnd);
const scriptStart = html.indexOf('<script>', cssEnd), js = html.slice(scriptStart);
const rootBlocks = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map(m => m[1]).join('\n');

// ---- 1 · variables ----
const defined = new Set([...rootBlocks.matchAll(/--([\w-]+)\s*:/g)].map(m => m[1]));
[...html.matchAll(/setProperty\(\s*['"]--([\w-]+)/g)].forEach(m => defined.add(m[1]));
[...css.matchAll(/(?:^|[{;\s])--([\w-]+)\s*:\s*[^;}]+/g)].forEach(m => defined.add(m[1]));   // también las locales de un componente (p. ej. .hist-rail{--hdot:20px})
const uses = [...html.matchAll(/var\(\s*--([\w-]+)\s*(,)?/g)];
const undefNoFallback = {}, undefWithFallback = {};
uses.forEach(m => { if (defined.has(m[1])) return; const bag = m[2] ? undefWithFallback : undefNoFallback; bag[m[1]] = (bag[m[1]] || 0) + 1; });
const tokenUse = pfx => uses.filter(m => m[1].startsWith(pfx)).length;
const unusedTokens = [...defined].filter(t => !uses.some(m => m[1] === t) && !new RegExp('--' + t + '\\b').test(js));

// ---- 2 · tipografía ----
const countBy = (arr) => arr.reduce((o, v) => (o[v] = (o[v] || 0) + 1, o), {});
const fsLit = s => [...s.matchAll(/font-size\s*:\s*([\d.]+)px/g)].map(m => +m[1]);
const cssFS = fsLit(css), jsFS = fsLit(js);
const fsOff = [...cssFS, ...jsFS].filter(v => !TYPE_OK.has(v));
const loaded = new Set(((html.match(/JetBrains\+Mono:wght@([\d;]+)/) || [])[1] || '').split(';').filter(Boolean).map(Number));
const weights = [...html.matchAll(/font-weight\s*:\s*(\d{3})/g)].map(m => +m[1]);
const unloadedW = weights.filter(w => loaded.size && !loaded.has(w));
const ls = [...html.matchAll(/letter-spacing\s*:\s*(var\(--ls-[\w-]+\)|[-\d.]+(?:px|em)|0|normal)/g)].map(m => m[1]);
const lsOff = ls.filter(v => !LS_OK.has(v) && !/^var\(--ls-/.test(v));

// ---- 3 · radios, espaciado, bordes, sombras ----
const radii = [...html.matchAll(/border-radius\s*:\s*([^;"'}]+)/g)].map(m => m[1].trim());
const radiiLit = radii.filter(v => !/var\(/.test(v));
const radiiOff = radiiLit.filter(v => !v.split(/\s+/).every(p => RADIUS_OK.has(p)));
const spaceVals = [];
[...html.matchAll(/(?<![\w-])(?:padding|margin|gap)(?:-(?:top|right|bottom|left))?\s*:\s*([^;"'}]+)/g)].forEach(m => {
  m[1].split(/\s+/).forEach(p => { const x = p.match(/^(-?[\d.]+)px$/); if (x) spaceVals.push(Math.abs(+x[1])); }); });
const spaceOff = spaceVals.filter(v => !SPACE_OK.has(v));
const spaceTok = tokenUse('s') - tokenUse('sp-') - tokenUse('sheet') - tokenUse('shadow');
const borderW = countBy([...html.matchAll(/border(?:-(?:top|right|bottom|left))?\s*:\s*([\d.]+px)/g)].map(m => m[1]));
// una sombra es elevación (blur); los anillos `0 0 0 Npx` y los `inset` son bordes dibujados, no sombras
const splitTop = v => { const out = []; let d = 0, cur = ''; for (const ch of v) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
const shadowPartOK = p => p === 'none' || /^inset\b/.test(p) || /^0 0 0 [\d.]+px\b/.test(p) || /^var\(--(glass-shadow|shadow-float)\)$/.test(p);
const shadows = [...css.matchAll(/box-shadow\s*:\s*([^;}]+)/g)].map(m => m[1].trim()).filter(v => !splitTop(v).every(shadowPartOK));

// ---- 4 · color ----
const noRoot = css.replace(/:root\s*\{[^}]*\}/g, '');
const hexCSS = [...noRoot.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(m => m[0]);
const rgbaCSS = [...noRoot.matchAll(/rgba?\([^)]*\)/g)].map(m => m[0]);
const inlineColors = [...js.matchAll(/(?:color|background|border[\w-]*|fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/g)].map(m => m[1]);

// ---- 5 · reglas CSS duplicadas ----
// Un selector escrito como regla PROPIA dos veces en el nivel superior (el síntoma de "parche encima de parche").
// No cuentan: lo que vive dentro de @media/@supports/@keyframes (variantes legítimas) ni las listas compartidas
// (`.a,.b{…}` + `.a{…}` es base común + ajuste, práctica normal).
const topLevel = (() => { const s = css.replace(/\/\*[\s\S]*?\*\//g, ''); let out = '', d = 0, skip = false, i = 0;
  while (i < s.length) { const ch = s[i];
    if (!d && ch === '@') { skip = true; }
    if (ch === '{') { d++; if (!skip) out += ch; } else if (ch === '}') { d--; if (!skip) out += ch; if (!d) skip = false; } else if (!skip) out += ch;
    i++; } return out; })();
const rules = [...topLevel.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m => m[1].trim()).filter(s => s && !s.includes(','));
const selCount = {}; rules.forEach(s => { selCount[s] = (selCount[s] || 0) + 1; });
const dupSel = Object.entries(selCount).filter(([s, n]) => n > 1 && !/^(:root|html|body)$/.test(s));

// ---- 6 · deuda style="" por función ----
const styleIdx = [...html.slice(cssEnd).matchAll(/style="/g)].map(m => m.index + cssEnd);   // solo marcado (no comentarios del CSS)
const fnDecl = [...html.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => ({ i: m.index, n: m[1] }));
const byFn = {};
styleIdx.forEach(i => { let n = '(html estático)'; for (let k = fnDecl.length - 1; k >= 0; k--) { if (fnDecl[k].i < i) { n = fnDecl[k].n; break; } } byFn[n] = (byFn[n] || 0) + 1; });
const topFn = Object.entries(byFn).sort((a, b) => b[1] - a[1]).slice(0, 12);

// ---- 6b · comportamiento (§7.18): diálogos nativos y guardados sin feedback ----
const nativeDialogs = countBy([...js.matchAll(/(?<![\w.$])(alert|confirm|prompt)\(/g)].map(m => m[1]));
// cuerpo de un bloque a partir de la llave que abre (conteo simple de llaves)
const blockAt = i => { let d = 0; for (let k = i; k < js.length; k++) { const c = js[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return js.slice(i, k + 1); } } return ''; };
const handlers = [];
[...js.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g)].forEach(m => { if (/save|commit/i.test(m[1])) handlers.push({ n: m[1] + '()', b: blockAt(m.index + m[0].length - 1) }); });
[...js.matchAll(/a===['"]([\w-]+)['"]\)\s*\{/g)].forEach(m => { if (/save|^ok/i.test(m[1])) handlers.push({ n: "a==='" + m[1] + "'", b: blockAt(m.index + m[0].length - 1) }); });
[...js.matchAll(/getElementById\(['"]([\w-]+_save)['"]\)[^;{]*?\.onclick\s*=\s*(?:\([^)]*\)|\w+)\s*=>\s*\{/g)].forEach(m => handlers.push({ n: '#' + m[1], b: blockAt(m.index + m[0].length - 1) }));
const silentSaves = handlers.filter(x => /\bsave\(\)/.test(x.b) && !/\btoast(Task)?\(/.test(x.b)).map(x => x.n);
// espaciado del CSS escrito por token vs literal (6/10 medio paso y 1 óptico cuentan como válidos)
const cssSpace = [...css.matchAll(/(?<![\w-])(?:padding|margin|gap)(?:-(?:top|right|bottom|left))?\s*:\s*([^;}]+)/g)].flatMap(m => m[1].trim().split(/\s+(?![^(]*\))/));
const spTok = cssSpace.filter(p => /var\(--(s\d|sp-)/.test(p) || /^calc\(/.test(p)).length;
const spLit = cssSpace.filter(p => /^-?[\d.]+px$/.test(p) && ![1, 6, 10].includes(Math.abs(parseFloat(p)))).length;

// ---- 7 · movimiento ----
const durs = [...css.matchAll(/(?:transition|animation)\s*:\s*([^;}]+)/g)].flatMap(m => [...m[1].matchAll(/([\d.]+)(ms|s)\b/g)].map(x => x[2] === 's' ? Math.round(+x[1] * 1000) : +x[1]));
const distinctDur = [...new Set(durs)].sort((a, b) => a - b);

// ---- 8 · armonía (§4.4b) y ruido (§9.1) — UX-2 ----
// "un rol, un token": el mismo rol no puede pintarse con dos tamaños según la pantalla.
const ruleList = [...topLevel.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), body: m[2] }));
const TPX = { label: 10, data: 12, section: 16, display: 22, hero: 34, caption: 9, xs: 10, meta: 11, sm: 12, body: 13 };   // los 5 últimos ya no existen: si aparecen, es regresión
const tokOf = body => ((body.match(/font-size\s*:\s*var\(--t-([\w-]+)\)/) || [])[1] || null);
const ruleTok = sel => { let t = null; ruleList.forEach(r => { if (r.sel === sel) { const k = tokOf(r.body); if (k) t = k; } }); return t; };
// tabla cerrada de §4.4b: selector → token esperado
const ROLE_MAP = {
  section: ['section', ['.section .h', '.sheet h3', '.mdhd h3']],
  navrow: ['data', ['.pickitem', '.nvm', '.hrow .hnm', '.exrow .exn', '.tbrow']],   // v256: fila navegable = dato 12 (peso 700)
  datarow: ['data', ['.line', '.mrow', '.item', '.sxh', '.trow']],
  meta: ['label', ['.submeta', '.empty', '.hrow .hmeta']],
  chip: ['data', ['.chip', '.spc', '.ag-chip', '.bwchip']],
  tab: ['data', ['.mdtabs span', '.toggles button']],
  entity: ['section', ['.exhead .n', '.ghead .gnm', '.ghead .gkc']],   // título de entidad: el total de una comida manda sobre sus alimentos (queja 9)
};
const roleMiss = [];
Object.entries(ROLE_MAP).forEach(([rol, [want, sels]]) => sels.forEach(s => { const got = ruleTok(s); if (got && got !== want) roleMiss.push(s + ' ' + TPX[got] + '→' + TPX[want]); }));
// campos que abren teclado/picker por debajo de 16 px (zoom de iOS, §4.4)
const INPUT_OK = ['.inp', '.inp-mini', '.pick', '.mmrow select'];   // §15: tabla de sesión y mapa de músculos — el viewport bloquea el zoom de iOS
const inputSmall = ruleList.filter(r => !INPUT_OK.includes(r.sel.trim()) && /(^|[\s,.#])(input|select|textarea)\b|\.inp\b|\.pick\b/.test(r.sel))
  .map(r => ({ s: r.sel, t: tokOf(r.body) })).filter(x => x.t && TPX[x.t] < 16).map(x => x.s + ' ' + TPX[x.t]);
// 9 px reservado a MAYÚSCULAS espaciadas: una regla con --t-caption debe declarar uppercase o --ls-caps
const capsLower = ruleList.filter(r => tokOf(r.body) === 'caption' && !/text-transform\s*:\s*uppercase/.test(r.body) && !/var\(--ls-caps\)/.test(r.body)).map(r => r.sel);
// v256: el 800 nunca por debajo de 12, y ningún token viejo sobrevive
const w800small = ruleList.filter(r => { const t = tokOf(r.body); return t && TPX[t] < 12 && /font-weight\s*:\s*800/.test(r.body); }).map(r => r.sel);
const oldTok = (html.match(/var\(--t-(body|sm|meta|xs|caption)\)/g) || []).length;
const scaleUse = {};
for (const m of css.matchAll(/font-size\s*:\s*var\(--t-([a-z]+)\)/g)) { const px = TPX[m[1]]; scaleUse[px] = (scaleUse[px] || 0) + 1; }
// texto instructivo en pantalla (§9.1): pistas de gesto y leyendas impresas en cada render
const hintCls = ['chhint', 'swipehint', 'ehint'].reduce((o, c) => (o[c] = (js.match(new RegExp('class="[^"]*\\b' + c + '\\b', 'g')) || []).length, o), {});
hintCls.submeta = (js.match(/class="[^"]*\bsubmeta\b/g) || []).length;

// ---- reporte ----
const report = {
  inlineStyles: styleIdx.length,
  fontSize: { literalsCSS: cssFS.length, literalsInline: jsFS.length, tokenUses: tokenUse('t-'), distinct: [...new Set([...cssFS, ...jsFS])].sort((a, b) => a - b), offScale: fsOff.length },
  weights: { byValue: countBy(weights), loaded: [...loaded], unloadedUses: unloadedW.length },
  letterSpacing: { distinct: [...new Set(ls)].length, offRole: lsOff.length },
  radius: { literal: radiiLit.length, tokenUses: tokenUse('r') , offScale: radiiOff.length, distinctOff: [...new Set(radiiOff)] },
  spacing: { literalPx: spaceVals.length, offScale: spaceOff.length, tokenUses: spaceTok },
  borders: borderW,
  shadowsOffToken: shadows.length,
  colors: { hexCSS: hexCSS.length, rgbaCSS: rgbaCSS.length, inline: inlineColors.length },
  vars: { undefinedNoFallback: undefNoFallback, undefinedWithFallback: undefWithFallback, unusedTokens },
  duplicateSelectors: dupSel.length, duplicateList: dupSel.map(([s, n]) => s + ' ×' + n),
  motion: { distinctDurationsMs: distinctDur },
  behavior: { nativeDialogs, silentSaves, spacingCss: { tokens: spTok, literalPx: spLit } },
  harmony: { roleMismatch: roleMiss, inputsUnder16: inputSmall, captionLowercase: capsLower, hints: hintCls },
  inlineByFunction: topFn
};
const p0 = [];
if (Object.keys(undefNoFallback).length) p0.push('variables sin definir y sin fallback: ' + Object.keys(undefNoFallback).map(k => '--' + k).join(', '));
if (unloadedW.length) p0.push('pesos no cargados en uso: ' + [...new Set(unloadedW)].join(', ') + ' (×' + unloadedW.length + ')');
report.P0 = p0;

// ---- 9 · reglas R-* (BRAND.md §8, DESIGN_SYSTEM.md §18) ----
const R = require('./ds-rules.cjs')(raw, path.join(__dirname, '..'));
report.rules = R.counts;
const BASE = path.join(__dirname, 'ds-baseline.json');
let base = null; try { base = JSON.parse(fs.readFileSync(BASE, 'utf8')); } catch (_) {}
const rose = base && base.static ? Object.keys(R.counts).filter(k => /P0|P1/.test(R.LEVEL[k]) && base.static[k] != null && R.counts[k] > base.static[k]) : [];
if (args.includes('--write-baseline')) {
  const sw = (() => { try { return (fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8').match(/gymtrk-v(\d+)/) || [])[1]; } catch (_) { return null; } })();
  const out = { generated: new Date().toISOString().slice(0, 10), version: sw ? 'v' + sw : null, static: R.counts, render: (base && base.render) || {} };
  fs.writeFileSync(BASE, JSON.stringify(out, null, 1) + '\n'); console.log('línea base escrita: tools/ds-baseline.json (' + Object.keys(R.counts).length + ' contadores R-*)');
}
if (args.includes('--list')) { R.hits.slice().sort((a, b) => a.id.localeCompare(b.id) || a.line - b.line).forEach(h => console.log('R-' + h.id + ' @ ' + (h.doc ? 'DESIGN_SYSTEM.md' : path.basename(FILE)) + ':' + h.line + ' · ' + h.snip)); }
if (args.includes('--json')) { console.log(JSON.stringify(report, null, 2)); }
else {
  const L = (k, v) => console.log(('  ' + k).padEnd(34, '.') + ' ' + v);
  console.log('\ngym//TRK · ds-audit  (' + path.basename(FILE) + ', ' + html.split('\n').length + ' líneas)\n');
  console.log('P0 detectables:'); (p0.length ? p0 : ['ninguno']).forEach(x => console.log('  · ' + x));
  console.log('\nTipografía'); L('font-size literales CSS/inline', cssFS.length + ' / ' + jsFS.length); L('usos de var(--t-*)', report.fontSize.tokenUses);
  L('tamaños distintos', report.fontSize.distinct.join(' ')); L('fuera de escala', fsOff.length);
  L('escala en uso (px ×reglas)', Object.entries(scaleUse).map(([k, v]) => k + '×' + v).join(' ')); L('tokens viejos (13/11/9)', oldTok); L('peso 800 bajo 12', w800small.length + (w800small.length ? '  [' + w800small.slice(0, 8).join(', ') + ']' : ''));
  L('pesos (valor ×usos)', Object.entries(report.weights.byValue).map(([k, v]) => k + '×' + v).join(' ')); L('letter-spacing distintos / fuera de rol', report.letterSpacing.distinct + ' / ' + lsOff.length);
  console.log('\nGeometría'); L('radios literales / fuera de escala', radiiLit.length + ' / ' + radiiOff.length + (radiiOff.length ? '  [' + report.radius.distinctOff.join(', ') + ']' : ''));
  L('espaciado px literal / fuera de escala', spaceVals.length + ' / ' + spaceOff.length); L('usos de var(--s*)', spaceTok);
  L('bordes (grosor ×usos)', Object.entries(borderW).map(([k, v]) => k + '×' + v).join(' ')); L('sombras fuera de token', shadows.length);
  console.log('\nColor y variables'); L('hex / rgba literales en CSS', hexCSS.length + ' / ' + rgbaCSS.length); L('colores literales en línea', inlineColors.length);
  L('sin definir (con fallback)', Object.keys(undefWithFallback).map(k => '--' + k).join(', ') || '—'); L('tokens definidos sin uso', unusedTokens.map(k => '--' + k).join(', ') || '—');
  console.log('\nEstructura'); L('excepciones marcadas (ds:exempt)', exemptCount); L('style="" en total', styleIdx.length); L('selectores CSS repetidos', dupSel.length + (dupSel.length ? '  [' + report.duplicateList.join(', ') + ']' : '')); L('duraciones distintas (ms)', distinctDur.join(' '));
  console.log('\nComportamiento (§7.18)'); L('diálogos nativos', ['alert', 'confirm', 'prompt'].map(k => k + ' ' + (nativeDialogs[k] || 0)).join(' · '));
  L('guardados sin feedback', silentSaves.length + (silentSaves.length ? '  [' + silentSaves.join(', ') + ']' : ''));
  L('espaciado CSS token / px literal', spTok + ' / ' + spLit);
  console.log('\nArmonía (§4.4b) y ruido (§9.1)');
  L('rol con token fuera de tabla', roleMiss.length + (roleMiss.length ? '  [' + roleMiss.join(', ') + ']' : ''));
  L('campos por debajo de 16 px', inputSmall.length + (inputSmall.length ? '  [' + inputSmall.join(', ') + ']' : ''));
  L('9 px en minúsculas', capsLower.length + (capsLower.length ? '  [' + capsLower.slice(0, 8).join(', ') + (capsLower.length > 8 ? ', …' : '') + ']' : ''));
  L('texto instructivo en pantalla', Object.entries(hintCls).map(([k, v]) => k + ' ' + v).join(' · '));
  console.log('\nMás style="" por función'); topFn.forEach(([n, c]) => L(n, c));
  console.log('\nReglas R-* (BRAND §8) · actual' + (base ? ' / línea base ' + (base.version || '') : ' (sin línea base: --write-baseline)'));
  Object.keys(R.counts).forEach(k => L('R-' + k + ' ' + R.LEVEL[k] + ' ' + R.NAME[k], R.counts[k] + (base && base.static && base.static[k] != null ? ' / ' + base.static[k] + (R.counts[k] > base.static[k] ? '  ▲ SUBE' : R.counts[k] < base.static[k] ? '  ▼' : '') : '')));
  if (base && base.render && Object.keys(base.render).length) console.log('  (en pantalla: ver `render` en tools/ds-baseline.json · se mide con dsSweep() en el preview)');
  console.log('');
}
if (args.includes('--strict')) {
  if (rose.length) console.log('✗ --strict: suben ' + rose.map(k => 'R-' + k + ' (' + base.static[k] + '→' + R.counts[k] + ')').join(', '));
  if (p0.length || rose.length) process.exit(1);
  console.log('✓ --strict: sin P0 y ningún contador P0/P1 sube contra la línea base');
}
