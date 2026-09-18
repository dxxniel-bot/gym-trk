#!/usr/bin/env node
// gym//TRK — auditor del sistema de diseño (DESIGN_SYSTEM.md §18). Node puro, sin dependencias ni npm.
// Uso:  node tools/ds-audit.cjs            → reporte legible
//       node tools/ds-audit.cjs --json     → contadores en JSON (para comparar antes/después)
//       node tools/ds-audit.cjs --strict   → sale con código 1 si hay hallazgos P0 detectables
// Mide lo que se puede medir: tokens usados vs literales, valores fuera de escala, variables sin definir, pesos no
// cargados, colores literales, reglas duplicadas, deuda de style="" por función. Lo semántico (verde decorativo,
// glass en contenido) sigue siendo revisión humana con las capturas.
'use strict';
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(FILE, 'utf8');
const args = process.argv.slice(2);

// ---- escalas del sistema (DESIGN_SYSTEM.md §4) ----
const TYPE_OK = new Set([9, 10, 11, 12, 13, 16, 22, 34]);
const RADIUS_OK = new Set(['0', '2px', '4px', '12px', '16px', '22px', '999px', '50%']); // literales tolerados solo mientras migran a token
const SPACE_OK = new Set([0, 1, 2, 4, 8, 12, 16, 24, 32, 48]);
const LS_OK = new Set(['0', 'normal', '.2em', '.12em', '-.03em']);

// ---- partes del archivo ----
const cssStart = html.indexOf('<style>'), cssEnd = html.indexOf('</style>');
const css = html.slice(cssStart + 7, cssEnd);
const scriptStart = html.indexOf('<script>', cssEnd), js = html.slice(scriptStart);
const rootBlocks = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map(m => m[1]).join('\n');

// ---- 1 · variables ----
const defined = new Set([...rootBlocks.matchAll(/--([\w-]+)\s*:/g)].map(m => m[1]));
[...html.matchAll(/setProperty\(\s*['"]--([\w-]+)/g)].forEach(m => defined.add(m[1]));
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
const ls = [...html.matchAll(/letter-spacing\s*:\s*([-\d.]+(?:px|em)|0|normal)/g)].map(m => m[1]);
const lsOff = ls.filter(v => !LS_OK.has(v));

// ---- 3 · radios, espaciado, bordes, sombras ----
const radii = [...html.matchAll(/border-radius\s*:\s*([^;"'}]+)/g)].map(m => m[1].trim());
const radiiLit = radii.filter(v => !/var\(/.test(v));
const radiiOff = radiiLit.filter(v => !v.split(/\s+/).every(p => RADIUS_OK.has(p)));
const spaceVals = [];
[...html.matchAll(/(?:padding|margin|gap)(?:-(?:top|right|bottom|left))?\s*:\s*([^;"'}]+)/g)].forEach(m => {
  m[1].split(/\s+/).forEach(p => { const x = p.match(/^(-?[\d.]+)px$/); if (x) spaceVals.push(Math.abs(+x[1])); }); });
const spaceOff = spaceVals.filter(v => !SPACE_OK.has(v));
const spaceTok = tokenUse('s') - tokenUse('sp-') - tokenUse('sheet') - tokenUse('shadow');
const borderW = countBy([...html.matchAll(/border(?:-(?:top|right|bottom|left))?\s*:\s*([\d.]+px)/g)].map(m => m[1]));
const shadows = [...css.matchAll(/box-shadow\s*:\s*([^;}]+)/g)].map(m => m[1].trim()).filter(v => !/var\(--(glass-shadow|shadow-float)\)/.test(v) && v !== 'none');

// ---- 4 · color ----
const noRoot = css.replace(/:root\s*\{[^}]*\}/g, '');
const hexCSS = [...noRoot.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(m => m[0]);
const rgbaCSS = [...noRoot.matchAll(/rgba?\([^)]*\)/g)].map(m => m[0]);
const inlineColors = [...js.matchAll(/(?:color|background|border[\w-]*|fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/g)].map(m => m[1]);

// ---- 5 · reglas CSS duplicadas ----
const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}@]+)\{[^{}]*\}/g)].map(m => m[1].trim()).filter(s => s && !/^(from|to|\d+%)/.test(s));
const selCount = {}; rules.forEach(r => r.split(',').map(s => s.trim()).forEach(s => { selCount[s] = (selCount[s] || 0) + 1; }));
const dupSel = Object.entries(selCount).filter(([s, n]) => n > 1 && !/^(:root|html|body)$/.test(s));

// ---- 6 · deuda style="" por función ----
const styleIdx = [...html.matchAll(/style="/g)].map(m => m.index);
const fnDecl = [...html.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => ({ i: m.index, n: m[1] }));
const byFn = {};
styleIdx.forEach(i => { let n = '(html estático)'; for (let k = fnDecl.length - 1; k >= 0; k--) { if (fnDecl[k].i < i) { n = fnDecl[k].n; break; } } byFn[n] = (byFn[n] || 0) + 1; });
const topFn = Object.entries(byFn).sort((a, b) => b[1] - a[1]).slice(0, 12);

// ---- 7 · movimiento ----
const durs = [...css.matchAll(/(?:transition|animation)\s*:\s*([^;}]+)/g)].flatMap(m => [...m[1].matchAll(/([\d.]+)(ms|s)\b/g)].map(x => x[2] === 's' ? Math.round(+x[1] * 1000) : +x[1]));
const distinctDur = [...new Set(durs)].sort((a, b) => a - b);

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
  duplicateSelectors: dupSel.length,
  motion: { distinctDurationsMs: distinctDur },
  inlineByFunction: topFn
};
const p0 = [];
if (Object.keys(undefNoFallback).length) p0.push('variables sin definir y sin fallback: ' + Object.keys(undefNoFallback).map(k => '--' + k).join(', '));
if (unloadedW.length) p0.push('pesos no cargados en uso: ' + [...new Set(unloadedW)].join(', ') + ' (×' + unloadedW.length + ')');
report.P0 = p0;

if (args.includes('--json')) { console.log(JSON.stringify(report, null, 2)); }
else {
  const L = (k, v) => console.log(('  ' + k).padEnd(34, '.') + ' ' + v);
  console.log('\ngym//TRK · ds-audit  (' + path.basename(FILE) + ', ' + html.split('\n').length + ' líneas)\n');
  console.log('P0 detectables:'); (p0.length ? p0 : ['ninguno']).forEach(x => console.log('  · ' + x));
  console.log('\nTipografía'); L('font-size literales CSS/inline', cssFS.length + ' / ' + jsFS.length); L('usos de var(--t-*)', report.fontSize.tokenUses);
  L('tamaños distintos', report.fontSize.distinct.join(' ')); L('fuera de escala', fsOff.length);
  L('pesos (valor ×usos)', Object.entries(report.weights.byValue).map(([k, v]) => k + '×' + v).join(' ')); L('letter-spacing distintos / fuera de rol', report.letterSpacing.distinct + ' / ' + lsOff.length);
  console.log('\nGeometría'); L('radios literales / fuera de escala', radiiLit.length + ' / ' + radiiOff.length + (radiiOff.length ? '  [' + report.radius.distinctOff.join(', ') + ']' : ''));
  L('espaciado px literal / fuera de escala', spaceVals.length + ' / ' + spaceOff.length); L('usos de var(--s*)', spaceTok);
  L('bordes (grosor ×usos)', Object.entries(borderW).map(([k, v]) => k + '×' + v).join(' ')); L('sombras fuera de token', shadows.length);
  console.log('\nColor y variables'); L('hex / rgba literales en CSS', hexCSS.length + ' / ' + rgbaCSS.length); L('colores literales en línea', inlineColors.length);
  L('sin definir (con fallback)', Object.keys(undefWithFallback).map(k => '--' + k).join(', ') || '—'); L('tokens definidos sin uso', unusedTokens.map(k => '--' + k).join(', ') || '—');
  console.log('\nEstructura'); L('style="" en total', styleIdx.length); L('selectores CSS repetidos', dupSel.length); L('duraciones distintas (ms)', distinctDur.join(' '));
  console.log('\nMás style="" por función'); topFn.forEach(([n, c]) => L(n, c));
  console.log('');
}
if (args.includes('--strict') && p0.length) process.exit(1);
