// gym//TRK — reglas R-* del auditor (DESIGN_SYSTEM.md §18, BRAND.md §8). Node puro. Lo usa tools/ds-audit.cjs.
// Cada regla devuelve hits {id, line, snip}. Los conteos se comparan contra tools/ds-baseline.json con `--strict`.
// Lo que solo se ve pintado (fugas del navegador, toques <44, contraste) lo mide _dsRenderCheck en ?selftest=1.
'use strict';
const fs = require('fs'), path = require('path');

const LEVEL = { ROLE: 'P0', GLYE: 'P0', SVGFS: 'P1', SEM: 'P1', GLY: 'P1', SAVE: 'P1', TOASTOK: 'P1', SCROLL: 'P1', RAD: 'P1', BLUR: 'P1',
  EXEMPT: 'P1', MOTION: 'P1', DOC: 'P1', RADF: 'P2', LANG: 'P2', BRK: 'P2', OK: 'P2', TOAST: 'P2', OP: 'P2', LH: 'P2', FONT: 'P2', A11Y: 'P2' };
const NAME = { ROLE: 'botón sin estilo propio (cae al del navegador)', GLYE: 'emoji en la interfaz', SVGFS: 'SVG fuera de escala (font-size / stroke-width)',
  SEM: 'color semántico (conteo; no debe crecer)', GLY: 'glifo fuera de GLYPHS', SAVE: 'save() sin feedback', TOASTOK: '✓ sin revisar si save() guardó', SCROLL: 'render() que salta el scroll',
  RAD: 'radio fuera de la familia (0 · 2 marcas · 4 gráficas · 12 control · 16 tarjeta)', RADF: 'radio flotante ≠ --r-float', BLUR: 'blur fuera del chrome', EXEMPT: 'ds:exempt sin categoría',
  MOTION: 'movimiento de layout / bucle / smooth', DOC: 'la guía cita algo que no existe', LANG: 'componente con dos idiomas', BRK: '[ corchete ] con espacios',
  OK: 'más de un primario por plantilla', TOAST: 'toast de más de 42 caracteres', OP: 'opacidad literal', LH: 'interlineado literal', FONT: 'peso cargado sin uso',
  A11Y: 'data-act en un elemento que no es botón' };

module.exports = function rules(raw, repoDir) {
  const hits = []; Object.keys(LEVEL).forEach(() => {});
  const lineOf = (() => { const nl = []; for (let i = 0; i < raw.length; i++) if (raw.charCodeAt(i) === 10) nl.push(i);
    return i => { let lo = 0, hi = nl.length; while (lo < hi) { const m = (lo + hi) >> 1; if (nl[m] < i) lo = m + 1; else hi = m; } return lo + 1; }; })();
  const add = (id, i, snip) => hits.push({ id, line: lineOf(i), snip: String(snip).replace(/\s+/g, ' ').slice(0, 90) });
  const cssA = raw.indexOf('<style>') + 7, cssB = raw.indexOf('</style>'), css = raw.slice(cssA, cssB);
  const jsA = raw.indexOf('<script>', cssB) + 8, jsB = raw.lastIndexOf('</script>'), js = raw.slice(jsA, jsB);

  // ---- rangos que no son interfaz: self-checks, tablas de datos, panel de diseño ----
  const skip = [];
  const blockEnd = (s, i) => { let d = 0; for (let k = i; k < s.length; k++) { const c = s[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return k; } } return s.length; };
  for (const m of js.matchAll(/function\s+(_\w*(?:SelfCheck|Check|Report)|selfcheck\w*)\s*\([^)]*\)\s*\{/g)) { const a = m.index + m[0].length - 1; skip.push([jsA + m.index, jsA + blockEnd(js, a)]); }
  for (const m of js.matchAll(/const\s+(BASE_FOODS|MUSCLES|MUSCLE_GROUPS|LABEL_CANON|EX_HINTS|GLOSS|DESIGN_KNOBS|CARDIO_SUBS)\s*=/g)) {
    const a = js.indexOf(m[1] === 'BASE_FOODS' ? '{' : (js[m.index + m[0].length] === '[' ? '[' : '{'), m.index + m[0].length); if (a < 0) continue;
    const open = js[a], close = open === '[' ? ']' : '}'; let d = 0, k = a; for (; k < js.length; k++) { if (js[k] === open) d++; else if (js[k] === close) { d--; if (!d) break; } } skip.push([jsA + m.index, jsA + k]); }
  const skipped = i => skip.some(([a, b]) => i >= a && i <= b);
  // función que contiene una posición (para agrupar por componente)
  const fns = [...js.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => ({ i: jsA + m.index, n: m[1] }));
  const fnAt = i => { let n = '(global)'; for (const f of fns) { if (f.i < i) n = f.n; else break; } return n; };

  // ---- lexer mínimo del JS: literales de texto (con su posición), sin comentarios ni regex ----
  const lits = []; {
    const s = js; let i = 0, prev = '(';
    const regexOK = () => /[(,=:[!&|?{};+\-*%<>~^]$/.test(prev) || /\b(return|typeof|case|in|of|delete|void|throw|new)$/.test(prev);
    while (i < s.length) { const c = s[i], n = s[i + 1];
      if (c === '/' && n === '/') { const e = s.indexOf('\n', i); i = e < 0 ? s.length : e; continue; }
      if (c === '/' && n === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? s.length : e + 2; continue; }
      if (c === '/' && regexOK()) { let k = i + 1, cls = false; for (; k < s.length; k++) { const d = s[k]; if (d === '\\') { k++; continue; } if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break; else if (d === '\n') break; } i = k + 1; while (/[a-z]/.test(s[i] || '')) i++; prev = 'x'; continue; }
      if (c === '"' || c === "'") { let k = i + 1, t = ''; for (; k < s.length; k++) { const d = s[k]; if (d === '\\') { t += s[k + 1]; k++; continue; } if (d === c || d === '\n') break; t += d; } lits.push({ i: jsA + i, t }); i = k + 1; prev = 'x'; continue; }
      if (c === '`') { // plantilla: el texto va a literales; ${…} se escanea como código con anidamiento
        let k = i + 1, t = '', st = jsA + i; for (; k < s.length; k++) { const d = s[k];
          if (d === '\\') { t += s[k + 1]; k++; continue; }
          if (d === '`') break;
          if (d === '$' && s[k + 1] === '{') { lits.push({ i: st, t }); t = ''; let dep = 1; k += 2; for (; k < s.length && dep; k++) { if (s[k] === '{') dep++; else if (s[k] === '}') dep--; else if (s[k] === '`') { let q = k + 1; for (; q < s.length && s[q] !== '`'; q++) if (s[q] === '\\') q++; k = q; } else if (s[k] === "'" || s[k] === '"') { const qc = s[k]; let q = k + 1; for (; q < s.length && s[q] !== qc && s[q] !== '\n'; q++) if (s[q] === '\\') q++; k = q; } } k--; st = jsA + k; continue; }
          t += d; }
        lits.push({ i: st, t }); i = k + 1; prev = 'x'; continue; }
      if (!/\s/.test(c)) prev = /[\w$]/.test(c) ? (s.slice(Math.max(0, i - 8), i + 1).match(/[\w$]+$/) || ['x'])[0] : c;
      i++; } }
  const uiLits = lits.filter(l => !skipped(l.i));

  // ---- GLYPHS y R-GLY / R-GLYE ----
  const G = (js.match(/const GLYPHS='([^']*)'/) || [])[1] || '';
  const OKCH = /[áéíóúüñÁÉÍÓÚÜÑ¿¡·–—×…’‘“”°²³µ ‑]/;           // letras y puntuación tipográfica
  const VIZ = /[▁▂▃▄▅▆▇█▮▯─│┌┐└┘├┤┬┴┼]/;                        // medidores y box-drawing (BRAND §3)
  uiLits.forEach(l => { for (const ch of l.t) { const cp = ch.codePointAt(0); if (cp < 127 || OKCH.test(ch) || VIZ.test(ch) || G.indexOf(ch) >= 0) continue;
    const emoji = cp >= 0x1F000 || cp === 0xFE0F || (cp >= 0x2600 && cp <= 0x27BF && /[☀-➿]/.test(ch) && !/[✓✕▶]/.test(ch));
    add(emoji ? 'GLYE' : 'GLY', l.i, ch + '  ' + l.t.slice(0, 50)); } });

  // ---- R-BRK · corchetes con espacios internos ----
  uiLits.forEach(l => { for (const m of l.t.matchAll(/\[ [^\]\n]{1,40}\]|\[[^\[\]\n]{1,40} \]/g)) add('BRK', l.i, m[0]); });

  // ---- R-TOAST · toasts largos ----
  for (const m of js.matchAll(/\btoast\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g)) { const i = jsA + m.index; if (skipped(i)) continue; const txt = m[2].replace(/\$\{[^}]*\}/g, 'xxxx'); if (txt.length > 42) add('TOAST', i, txt.length + ' · ' + txt); }

  // ---- CSS: reglas y selectores ----
  const rules = []; { const s = css.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length)); let d = 0, st = 0;
    for (let i = 0; i < s.length; i++) { const c = s[i]; if (c === '{') { const sel = s.slice(st, i).trim(); const e = blockEnd(s, i); const body = s.slice(i + 1, e);
        if (/^@(media|supports)/.test(sel)) { st = i + 1; continue; } // se entra al bloque
        if (/^@keyframes/.test(sel)) { rules.push({ sel, body, i: cssA + i, kf: true }); i = e; st = e + 1; continue; }
        rules.push({ sel, body, i: cssA + i }); i = e; st = e + 1; }
      else if (c === '}') st = i + 1; } }
  const CHROME = /(^|[\s,>])(\.nav|\.modal|\.sheet|\.toast|\.toasts|\.tsel|\.gloss|#asklayer|\.ask|\.glass|\.glass-strong|\.exsh|\.bootov|\.dz|\.savebar|\.dragghost|\.ag-supp-pop)\b/;   // v262: el fantasma de arrastre y el popover de la agenda también flotan
  // clases con estilo propio (compuesto único) y pares padre→hijo
  const own = new Set(), pair = {};
  rules.forEach(r => { if (r.kf) return; r.sel.split(',').forEach(sel => { sel = sel.trim().replace(/::?[\w-]+(\([^)]*\))?/g, ''); const parts = sel.split(/\s*[\s>+~]\s*/).filter(Boolean);
    const last = parts[parts.length - 1] || ''; const cls = [...last.matchAll(/\.([\w-]+)/g)].map(m => m[1]); const tag = (last.match(/^[a-z]+/) || [])[0];
    if (parts.length === 1) { if (cls.length === 1) own.add(cls[0]); }   // `.agm.b` estila solo la combinación: no hace a `.b` un rol propio
    else { const par = [...(parts[parts.length - 2] || '').matchAll(/\.([\w-]+)|#([\w-]+)/g)].map(m => m[1] || m[2]); (cls.length ? cls : (tag ? [tag] : [])).forEach(c => { pair[c] = pair[c] || new Set(); par.forEach(p => pair[c].add(p)); }); } }); });
  // ---- R-ROLE · <button> cuyo rol no tiene estilo propio ni un padre estilado cerca ----
  for (const m of js.matchAll(/<button\b([^>]*)>/g)) { const i = jsA + m.index; if (skipped(i)) continue;
    const cl = ((m[1].match(/class="([^"$]*)/) || [])[1] || '').split(/\s+/).filter(c => c && !/^u-/.test(c));
    if (cl.some(c => own.has(c))) continue;
    // el contenedor puede armarse antes o después en la misma función (plantillas auxiliares): se busca en toda ella
    const fA = (() => { let a = 0; for (const f of fns) { if (f.i - jsA < m.index) a = f.i - jsA; else break; } return a; })(), fB = (() => { for (const f of fns) if (f.i - jsA > m.index) return f.i - jsA; return js.length; })();
    const back = js.slice(Math.max(fA, m.index - 4000), Math.min(fB, m.index + 4000)); const near = [...back.matchAll(/class="([^"]*)"/g)].flatMap(x => x[1].split(/\s+/)).concat([...back.matchAll(/id="([\w-]+)"/g)].map(x => x[1]));
    const want = cl.length ? cl : ['button']; if (want.some(c => pair[c] && near.some(p => pair[c].has(p)))) continue;
    if (pair.button && near.some(p => pair.button.has(p))) continue;   // `.toggles button`, `.sheetbtns button`…
    add('ROLE', i, m[0]); }
  // ---- R-SVGFS ----
  const SW = new Set(['.5', '0.5', '1', '1.4', '1.6', '1.8']);
  const TSC = []; for (const m of raw.matchAll(/--t-(?:label|data|section|display|hero)\s*:\s*([\d.]+)px/g)) TSC.push(+m[1]);   // v262: la escala se lee de :root
  const TYPE = TSC.length ? TSC : [10, 12, 16, 22, 34];
  for (const m of raw.matchAll(/font-size="([\d.]+)"/g)) if (!TYPE.includes(+m[1])) add('SVGFS', m.index, m[0]);
  for (const m of raw.matchAll(/stroke-width(?:=")?:?\s*"?([\d.]+)/g)) { if (m.index > cssA && m.index < cssB && raw.slice(m.index - 60, m.index).includes('/*ds:exempt')) continue; if (!SW.has(m[1])) add('SVGFS', m.index, 'stroke-width ' + m[1]); }
  // ---- R-SEM · uso de color semántico (se cuenta; --strict impide que crezca) ----
  for (const m of raw.matchAll(/var\(--(good|bad|warn|info)\)|\bu-(good|bad|warn)\b/g)) { if (m.index < cssA || m.index > cssB) { if (skipped(m.index)) continue; } add('SEM', m.index, fnAt(m.index) + ' · ' + m[0]); }
  // ---- R-SAVE · handlers que guardan sin feedback ----
  const FB = /\b(toast|toastTask|savedToast|holdConfirm|trkAsk|undo|openModal|closeModal|go|nudgeBackup)\(/;
  for (const m of js.matchAll(/a===['"]([\w-]+)['"]\)\s*\{/g)) { const a = m.index + m[0].length - 1, b = js.slice(a, blockEnd(js, a) + 1); if (/\bsave\(\)/.test(b) && !FB.test(b) && !/reRender\(\)|render\(\)/.test(b)) add('SAVE', jsA + m.index, m[1]); }
  // ---- R-TOASTOK · v265: un ✓ pegado a un save() que no se revisa (se usa savedToast, que avisa ⚠ si no guardó) ----
  for (const m of js.matchAll(/\bsave\(\);\s*toast\(\s*['"`]✓/g)) add('TOASTOK', jsA + m.index, fnAt(jsA + m.index));
  // ---- R-SCROLL ----
  for (const m of js.matchAll(/closeModal\(\);\s*render\(\)/g)) if (!skipped(jsA + m.index)) add('SCROLL', jsA + m.index, fnAt(jsA + m.index) + ' · ' + m[0]);
  for (const m of js.matchAll(/a===['"](sd_\w+)['"]\)\s*\{/g)) { const a = m.index + m[0].length - 1, b = js.slice(a, blockEnd(js, a) + 1); if (/(^|[^e])render\(\)/.test(b.replace(/reRender/g, ''))) add('SCROLL', jsA + m.index, m[1] + ' · render()'); }
  // ---- R-RAD / R-RADF · radios ----
  // v259 · el valor de cada token de radio se resuelve desde :root siguiendo cadenas var() (un alias como
  // --r-nav:var(--r-pill) antes valía 0 y escondía el hallazgo). RADV solo es el respaldo si el token no se encuentra.
  const RADV = { '--r-ctl': 12, '--r-pill': 999, '--radius': 16, '--r-sheet': 22, '--r-mark': 4, '--r-sm': 2, '--r-float': 0 };
  const ROOTV = {}; for (const m of raw.slice(cssA, cssB).matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) if (!(m[1] in ROOTV)) ROOTV[m[1]] = m[2].trim();
  const radTok = (t, d) => { const v = ROOTV[t]; if (v == null || d > 6) return { px: RADV[t] || 0, fl: t === '--r-float' };
    const mm = v.match(/^var\((--[\w-]+)\)$/); if (mm) { const r = radTok(mm[1], (d || 0) + 1); return { px: r.px, fl: r.fl || t === '--r-float' }; }
    return { px: parseFloat(v) || 0, fl: t === '--r-float' }; };
  // v264 · B-05 reescrita por el dueño ("lo que ya tienen estilo redondeado, que ese sea el estándar… que parezcan de la
  // misma familia"): la regla ya no tolera un número de gracia, exige la familia. Permitidos tras resolver el token:
  // 0 (reglas y barras finas) · 2 marcas que no se tocan · 4 marcas de gráfica · 12 todo control · 16 tarjetas.
  const RAD_OK = new Set([0, 2, 4, 12, 16]);
  const PILL_OK = /^(\.bar|\.wprog|\.vbar)(>i)?$/;                                     // única píldora: la tapa de las barras ≤6 px
  const CARD = /(^|[\s,>])(\.card|\.grp|\.ptile|\.pthrow|\.hcal|\.ws-card|\.pfeat)\b/;   // 16 solo en una tarjeta
  rules.forEach(r => { if (r.kf) return; for (const m of r.body.matchAll(/border-radius\s*:\s*([^;]+)/g)) { const v = m[1]; if (/ds:exempt/.test(v)) continue;
      const chrome = CHROME.test(r.sel), id = chrome ? 'RADF' : 'RAD';
      const toks = [...v.matchAll(/var\((--[\w-]+)\)/g)].map(x => radTok(x[1], 0));
      const lit = v.trim().split(/\s+/).filter(p => !/var\(/.test(p) && /^[\d.]+px$/.test(p) && parseFloat(p) > 0);
      if (lit.length) { add(id, r.i, r.sel + ' · literal ' + lit.join(' ')); continue; }        // todo píxel va por token
      if (toks.some(t => t.px > 100)) { if (!r.sel.split(',').every(x => PILL_OK.test(x.replace(/\s+/g, '')))) add(id, r.i, r.sel + ' · píldora ' + v.trim()); continue; }
      const off = toks.filter(t => !RAD_OK.has(t.px));
      if (off.length) { add(id, r.i, r.sel + ' · ' + v.trim()); continue; }                      // valor fuera de la familia
      if (!toks.some(t => t.px > 2)) continue;                                                   // marcas: nada que revisar
      if (chrome) { if (!(toks.every(t => t.fl) || /--r-float|--r-ctl/.test(v))) add('RADF', r.i, r.sel + ' · ' + v.trim()); continue; }
      if (/--radius/.test(v) && !CARD.test(r.sel)) add('RAD', r.i, r.sel + ' · 16 fuera de una tarjeta'); } });
  // ---- R-BLUR · backdrop-filter fuera del chrome (CSS) y la clase glass fuera de nav/sheet/toast (marcado) ----
  rules.forEach(r => { if (r.kf) return; if (/backdrop-filter\s*:\s*(?!none)/.test(r.body) && !CHROME.test(r.sel)) add('BLUR', r.i, r.sel); });
  for (const m of js.matchAll(/class="[^"]*\bglass(-strong)?\b[^"]*"/g)) { const i = jsA + m.index, f = fnAt(i); if (!/^(openModal|renderNav|toast|toastTask|trkAsk|holdConfirm|trkPrompt|trkMenu|trkSelect|trkPop|askLayer|showSaveBar)$/i.test(f) && !skipped(i)) add('BLUR', i, f + ' · ' + m[0]); }
  // ---- R-EXEMPT ----
  for (const m of raw.matchAll(/\/\*ds:exempt\*\//g)) add('EXEMPT', m.index, raw.slice(Math.max(0, m.index - 50), m.index));
  // ---- R-MOTION ----
  rules.forEach(r => { if (r.kf) { if (/scale\(\s*1\.\d*[1-9]|scale\(\s*[2-9]/.test(r.body)) add('MOTION', r.i, r.sel + ' · rebote'); return; }
    for (const m of r.body.matchAll(/transition\s*:\s*([^;]+)/g)) if (/\b(width|height|top|left|padding|gap|grid-template-columns|grid-template-rows|margin)\b/.test(m[1])) add('MOTION', r.i, r.sel + ' · transition ' + m[1].trim().slice(0, 40));
    for (const m of r.body.matchAll(/animation\s*:\s*([^;]+)/g)) if (/infinite/.test(m[1]) && !/ds:exempt/.test(m[1])) add('MOTION', r.i, r.sel + ' · infinite'); });
  for (const m of js.matchAll(/behavior\s*:\s*['"]smooth['"]/g)) if (!skipped(jsA + m.index)) add('MOTION', jsA + m.index, fnAt(jsA + m.index) + ' · smooth');
  // ---- R-OK · más de un primario (.ok / .start) en la misma función ----
  const okBy = {}; for (const m of js.matchAll(/class="(?:[^"]*\s)?(ok|start)(?:\s[^"]*)?"/g)) { const i = jsA + m.index; if (skipped(i)) continue; const f = fnAt(i); (okBy[f] = okBy[f] || []).push(i); }
  Object.entries(okBy).forEach(([f, arr]) => { if (arr.length > 1) add('OK', arr[1], f + ' · ' + arr.length + ' primarios'); });
  // ---- R-LANG · botones con verbos en dos idiomas dentro del mismo componente ----
  const EN = /^(cancel|close|save|done|delete|back|add|edit|share|copy|next|ok|remove|apply|reset|confirm|abort|start|skip|rest)\b/i, ES = /^(cancelar|cerrar|guardar|listo|borrar|atrás|agregar|editar|compartir|copiar|siguiente|aceptar|quitar|aplicar|confirmar|abortar|empezar|saltar|descanso)\b/i;
  const lang = {}; for (const m of js.matchAll(/<button\b[^>]*>([^<$]{2,40})</g)) { const i = jsA + m.index; if (skipped(i)) continue; const t = m[1].replace(/^[^a-záéíóúñ]+/i, '').trim(); const f = fnAt(i); lang[f] = lang[f] || { en: 0, es: 0, i }; if (EN.test(t)) lang[f].en++; if (ES.test(t)) lang[f].es++; }
  Object.entries(lang).forEach(([f, v]) => { if (v.en && v.es) add('LANG', v.i, f + ' · en ' + v.en + ' / es ' + v.es); });
  // ---- R-OP / R-LH ----
  rules.forEach(r => { if (r.kf) return; for (const m of r.body.matchAll(/(?<![\w-])opacity\s*:\s*([\d.]+)/g)) if (m[1] !== '0' && m[1] !== '1') add('OP', r.i, r.sel + ' · ' + m[1]);
    for (const m of r.body.matchAll(/line-height\s*:\s*([\d.]+)(?!\w)/g)) if (m[1] !== '1' && m[1] !== '0') add('LH', r.i, r.sel + ' · ' + m[1]); });
  // ---- R-FONT ----
  const loaded = ((raw.match(/JetBrains\+Mono:wght@([\d;]+)/) || [])[1] || '').split(';').filter(Boolean).map(Number);
  const used = new Set([...raw.matchAll(/font-weight\s*:\s*(\d{3}|bold)/g)].map(m => m[1] === 'bold' ? 700 : +m[1])); used.add(400);
  loaded.forEach(w => { if (!used.has(w)) add('FONT', raw.indexOf('JetBrains+Mono:wght'), 'peso ' + w + ' cargado sin uso'); });
  // ---- R-A11Y · data-act en algo que no es botón ----
  for (const m of js.matchAll(/<(\w+)\b([^>]*?)\bdata-act=/g)) { const i = jsA + m.index; if (skipped(i)) continue; const tag = m[1].toLowerCase();
    if (/^(button|input|select|textarea)$/.test(tag) || /\brole=/.test(m[2]) || (tag === 'a' && /\bhref=/.test(m[2]))) continue; add('A11Y', i, '<' + tag + ' … data-act'); }
  // ---- R-DOC · la guía contra el código ----
  try { const dsPath = path.join(repoDir, 'DESIGN_SYSTEM.md'), ds = fs.readFileSync(dsPath, 'utf8'), sw = fs.readFileSync(path.join(repoDir, 'sw.js'), 'utf8');
    const lines = ds.split('\n'); const tokDefined = new Set([...raw.matchAll(/--([\w-]+)\s*:/g)].map(m => m[1]));
    const clsUsed = s => raw.includes('.' + s) || new RegExp('class="[^"]*\\b' + s.replace(/[-]/g, '\\-') + '\\b').test(raw) || new RegExp("['\"`]" + s + "['\"`]").test(raw) || raw.includes(' ' + s + ' ') || raw.includes(' ' + s + '"');
    // una viñeta ocupa varias líneas: "pendiente" en las 2 líneas anteriores también la marca como objetivo, no como hecho
    const pend = k => [k, k - 1, k - 2, k + 1].some(j => j >= 0 && j < lines.length && /pendiente|objetivo G\d|G\d\)/i.test(lines[j]) && !/^\s*$/.test(lines[Math.min(j, k)] || '') && !(j > k && /^\s*$/.test(lines[k + 1] || '')));
    lines.forEach((ln, k) => { if (pend(k)) return;
      for (const m of ln.matchAll(/`([^`]+)`/g)) { const t = m[1];
        for (const x of t.matchAll(/(?:^|[\s(,])\.([a-z][\w-]{1,30})\b/g)) if (!/^(u-x|gitignore|md|json|js|cjs|html)$/.test(x[1]) && !clsUsed(x[1])) hits.push({ id: 'DOC', line: k + 1, snip: 'DESIGN_SYSTEM.md · .' + x[1] + ' no existe', doc: true });
        for (const x of t.matchAll(/--([a-z][\w-]{0,30}[a-z0-9])(?![\w-]|\*)/g)) if (!tokDefined.has(x[1]) && /^(t|o|s|r|z|dur|ease|ls|sp|glass|op|lh|mv|nav|good|bad|warn|info|fg|bg|card|fill|track|line|border|faint|sheet|scrim|abort)\b/.test(x[1])) hits.push({ id: 'DOC', line: k + 1, snip: 'DESIGN_SYSTEM.md · --' + x[1] + ' no existe', doc: true }); } });
    const v1 = (ds.match(/estado actual \(v(\d+)\)/) || [])[1], v2 = (sw.match(/gymtrk-v(\d+)/) || [])[1];
    if (v1 && v2 && v1 !== v2) hits.push({ id: 'DOC', line: 1, snip: 'DESIGN_SYSTEM.md dice v' + v1 + ', sw.js es v' + v2, doc: true });
  } catch (_) {}
  const counts = {}; Object.keys(LEVEL).forEach(k => counts[k] = 0); hits.forEach(h => counts[h.id]++);
  return { hits, counts, LEVEL, NAME };
};
module.exports.LEVEL = LEVEL; module.exports.NAME = NAME;
