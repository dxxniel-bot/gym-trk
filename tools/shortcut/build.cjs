// gym//TRK · tools/shortcut/build.cjs · arma el Atajo "TRK Biometrics" como archivo (node puro, sin dependencias)
//
//   node tools/shortcut/build.cjs            escribe tools/shortcut/TRK Biometrics.shortcut (plist XML SIN firmar), lo valida
//                                            y lo corre contra una Salud de mentira (imprime lo que copiaría el iPhone)
//   node tools/shortcut/build.cjs --check    no escribe: comprueba que el archivo en disco es el que saldría hoy y que
//                                            HP_EXAMPLE de index.html es, letra por letra, lo que el atajo copia
//   node tools/shortcut/build.cjs --sample   solo imprime el texto de ejemplo (para meterlo por parseHealthPaste)
//
// Qué hace el atajo en el iPhone: lee de Salud los últimos 7 días (pasos, energía activa, peso, FC en reposo, HRV, sueño
// con fases, % de grasa y energía en reposo), escribe una línea por muestra en el formato `trk2` que la app ya lee
// (parseHealthPaste en index.html) y lo copia al portapapeles. No abre ninguna URL ni manda nada a internet.
//
// De dónde sale cada identificador: FUENTES.md (junto a este archivo). Regla: nada se escribe "de memoria"; lo que no se
// pudo ver en un atajo real va marcado `soft` y corre DESPUÉS de una copia al portapapeles, así un fallo ahí no se lleva
// lo que ya se leyó.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { toXML, parseXML } = require('./plist.cjs');

const NAME = 'TRK Biometrics';            // nombre visible del atajo: la app lo corre con shortcuts://run-shortcut?name=TRK%20Biometrics
const OUT = path.join(__dirname, NAME + '.shortcut');
const VAR = 'datos';                      // variable donde se juntan las líneas
const DAYS = 7;
const OBJ = '￼';                     // marca de "aquí va una variable" dentro de un Texto

// key = palabra del formato trk2 · type = nombre del tipo en la acción "Buscar muestras de salud" (inglés: es el valor
// interno, no la etiqueta) · day = agrupar por día · unit = la línea termina con la unidad · sleep = inicio, fin y fase
// soft = identificador sin confirmar en una acción Buscar real (ver FUENTES.md): va al final, tras una copia de seguridad
const BLOCKS = [
  { key: 'steps', type: 'Steps', day: true },
  { key: 'act', type: 'Active Calories', day: true, unit: true },
  { key: 'weight', type: 'Weight', unit: true },
  { key: 'rhr', type: 'Resting Heart Rate' },
  { key: 'hrv', type: 'Heart Rate Variability' },
  { key: 'sleep', type: 'Sleep', sleep: true },
  { key: 'fat', type: 'Body Fat Percentage', soft: true },
  { key: 'bas', type: 'Resting Calories', day: true, unit: true, soft: true },
];

// ───────────────────────── piezas del plist ─────────────────────────
// UUID fijo por nombre: el archivo sale idéntico en cada corrida (un diff del atajo es un cambio real, no ruido)
function uuid(seed) {
  const h = crypto.createHash('sha1').update('gymtrk/' + NAME + '/' + seed).digest('hex').split('');
  h[12] = '4'; h[16] = '89ab'[parseInt(h[16], 16) & 3];
  const s = h.join('');
  return (s.slice(0, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16) + '-' + s.slice(16, 20) + '-' + s.slice(20, 32)).toUpperCase();
}
const act = (id, params) => ({ WFWorkflowActionIdentifier: 'is.workflow.actions.' + id, WFWorkflowActionParameters: params });
const attach = v => ({ Value: v, WFSerializationType: 'WFTextTokenAttachment' });
const outRef = (id, name) => ({ OutputUUID: id, Type: 'ActionOutput', OutputName: name });
const varRef = (name, aggr) => Object.assign({ VariableName: name, Type: 'Variable' }, aggr && aggr.length ? { Aggrandizements: aggr } : {});
const prop = name => ({ Type: 'WFPropertyVariableAggrandizement', PropertyName: name });
const iso = () => ({ Type: 'WFDateFormatVariableAggrandizement', WFDateFormatStyle: 'ISO 8601', WFISO8601IncludeTime: true });
// Texto con variables: las partes son cadenas o referencias; cada referencia ocupa un carácter U+FFFC y se anota su posición
function text(parts) {
  let s = ''; const by = {};
  parts.forEach(p => { if (typeof p === 'string') s += p; else { by['{' + s.length + ', 1}'] = p; s += OBJ; } });
  if (!Object.keys(by).length) return s;   // sin variables, los atajos reales guardan la cadena tal cual
  return { Value: { string: s, attachmentsByRange: by }, WFSerializationType: 'WFTextTokenString' };
}
const item = (...aggr) => varRef('Repeat Item', aggr);

// Buscar muestras de salud donde Tipo es <type> y Fecha de inicio está en los últimos 7 días (más viejas primero)
function findSamples(b) {
  const p = {
    WFContentItemFilter: {
      Value: {
        WFActionParameterFilterPrefix: 1,
        WFContentPredicateBoundedDate: false,
        WFActionParameterFilterTemplates: [
          { Property: 'Type', Operator: 4, Values: { Enumeration: { Value: b.type, WFSerializationType: 'WFStringSubstitutableState' } }, Removable: false, Bounded: true },
          { Property: 'Start Date', Operator: 1001, Values: { Unit: 16, Number: String(DAYS) }, Removable: false, Bounded: true },
        ],
      },
      WFSerializationType: 'WFContentPredicateTableTemplate',
    },
    WFContentItemSortProperty: 'Start Date',
    WFContentItemSortOrder: 'Oldest First',
    WFContentItemLimitEnabled: false,
    UUID: uuid(b.key + '/find'),
  };
  if (b.day) { p.WFHKSampleFilteringGroupBy = 'Day'; p.WFHKSampleFilteringFillMissing = false; }
  return act('filter.health.quantity', p);
}
// la línea que escribe cada vuelta del Repetir
function line(b) {
  if (b.sleep) return text([b.key + ' ', item(prop('Start Date'), iso()), ' ', item(prop('End Date'), iso()), ' ', item(prop('Value'))]);
  const parts = [b.key + ' ', item(prop('Start Date'), iso()), ' ', item(prop('Value'))];
  if (b.unit) parts.push(' ', item(prop('Unit')));
  return text(parts);
}
// un bloque = Buscar → Repetir con cada (Texto) → Fin de repetir → Agregar a variable
function block(b) {
  const g = uuid(b.key + '/group'), find = findSamples(b), end = uuid(b.key + '/end');
  return [
    find,
    act('repeat.each', { WFInput: attach(outRef(find.WFWorkflowActionParameters.UUID, 'Health Samples')), GroupingIdentifier: g, WFControlFlowMode: 0 }),
    act('gettext', { WFTextActionText: line(b), UUID: uuid(b.key + '/line') }),
    act('repeat.each', { GroupingIdentifier: g, WFControlFlowMode: 2, UUID: end }),
    act('appendvariable', { WFInput: attach(outRef(end, 'Repeat Results')), WFVariableName: VAR, UUID: uuid(b.key + '/append') }),
  ];
}
// juntar `datos` con saltos de línea y copiarlo
function copy(tag) {
  const c = uuid(tag + '/combine');
  return [
    act('text.combine', { WFTextSeparator: 'New Lines', text: attach(varRef(VAR)), UUID: c }),
    act('setclipboard', { WFInput: attach(outRef(c, 'Combined Text')), UUID: uuid(tag + '/copy') }),
  ];
}

function build() {
  const hard = BLOCKS.filter(b => !b.soft), soft = BLOCKS.filter(b => b.soft), head = uuid('head/text');
  let a = [
    act('comment', { WFCommentActionText: 'gym//TRK · copia tus datos de Salud de los últimos ' + DAYS + ' días para pegarlos en gymtrk.app. No abre ninguna página ni manda nada a internet.' }),
    act('gettext', { WFTextActionText: text(['trk2']), UUID: head }),
    act('appendvariable', { WFInput: attach(outRef(head, 'Text')), WFVariableName: VAR, UUID: uuid('head/append') }),
  ];
  hard.forEach(b => { a = a.concat(block(b)); });
  a = a.concat(copy('copy/0'));                                     // lo confirmado ya está en el portapapeles
  soft.forEach((b, i) => { a = a.concat(block(b), copy('copy/' + (i + 1))); });   // cada tipo sin confirmar vuelve a copiar al terminar
  return {
    WFWorkflowMinimumClientVersionString: '900',
    WFWorkflowMinimumClientVersion: 900,
    WFWorkflowIcon: { WFWorkflowIconStartColor: 255, WFWorkflowIconGlyphNumber: 59754 },
    WFWorkflowClientVersion: '3218.0.9',
    WFWorkflowOutputContentItemClasses: [],
    WFWorkflowHasOutputFallback: false,
    WFWorkflowActions: a,
    WFWorkflowInputContentItemClasses: [],
    WFWorkflowImportQuestions: [],
    WFWorkflowTypes: [],
    WFQuickActionSurfaces: [],
    WFWorkflowHasShortcutInputVariables: false,
  };
}

// ───────────────────────── validación ─────────────────────────
const UUID_RE = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/;
const KNOWN = { comment: 1, gettext: 1, appendvariable: 1, 'filter.health.quantity': 1, 'repeat.each': 1, 'text.combine': 1, setclipboard: 1 };
const short = a => a.WFWorkflowActionIdentifier.replace('is.workflow.actions.', '');
// todas las referencias a variables dentro de un valor (Texto con adjuntos o adjunto suelto), con dónde están
function refs(v, out) {
  out = out || [];
  if (Array.isArray(v)) v.forEach(x => refs(x, out));
  else if (v && typeof v === 'object' && !Buffer.isBuffer(v)) {
    if (v.Type === 'ActionOutput' || v.Type === 'Variable') out.push(v);
    else Object.keys(v).forEach(k => refs(v[k], out));
  }
  return out;
}
function validate(wf) {
  const E = [], A = wf.WFWorkflowActions; const ids = new Map(), vars = new Set(), open = [];
  if (!Array.isArray(A) || !A.length) return ['sin acciones'];
  ['WFWorkflowMinimumClientVersion', 'WFWorkflowClientVersion', 'WFWorkflowIcon', 'WFWorkflowImportQuestions', 'WFWorkflowTypes', 'WFWorkflowInputContentItemClasses'].forEach(k => { if (wf[k] == null) E.push('falta ' + k); });
  A.forEach((a, i) => {
    const id = short(a), p = a.WFWorkflowActionParameters || {}, at = '#' + i + ' ' + id;
    if (!/^is\.workflow\.actions\./.test(a.WFWorkflowActionIdentifier) || !KNOWN[id]) E.push(at + ': acción fuera de la lista confirmada');
    const start = id === 'repeat.each' && p.WFControlFlowMode === 0;
    // UUID: toda acción lo lleva, salvo el comentario y el INICIO de Repetir (en los atajos reales no lo llevan: el
    // Repetir se identifica por GroupingIdentifier)
    if (id !== 'comment' && !start) {
      if (!UUID_RE.test(p.UUID || '')) E.push(at + ': sin UUID válido');
      else if (ids.has(p.UUID)) E.push(at + ': UUID repetido (#' + ids.get(p.UUID) + ')');
    }
    // referencias: una salida solo se puede usar DESPUÉS de la acción que la produce; una variable, después de crearla
    refs(p).forEach(r => {
      if (r.Type === 'ActionOutput') { if (!ids.has(r.OutputUUID)) E.push(at + ': usa una salida que no existe antes (' + r.OutputName + ' ' + r.OutputUUID + ')'); }
      else if (r.VariableName === 'Repeat Item') { if (!open.length) E.push(at + ': "Repeat Item" fuera de un Repetir'); }
      else if (!vars.has(r.VariableName)) E.push(at + ': usa la variable "' + r.VariableName + '" antes de crearla');
      (r.Aggrandizements || []).forEach(g => { if (g.Type !== 'WFPropertyVariableAggrandizement' && g.Type !== 'WFDateFormatVariableAggrandizement') E.push(at + ': ajuste de variable desconocido ' + g.Type); });
    });
    // Textos: cada adjunto apunta a un U+FFFC y cada U+FFFC tiene su adjunto
    const t = p.WFTextActionText && p.WFTextActionText.Value;
    if (t) { const by = t.attachmentsByRange || {}, s = t.string || ''; let n = 0;
      Object.keys(by).forEach(k => { const m = /^\{(\d+), 1\}$/.exec(k); if (!m || s.charAt(+m[1]) !== OBJ) E.push(at + ': adjunto ' + k + ' no cae en una marca'); });
      for (const ch of s) if (ch === OBJ) n++;
      if (n !== Object.keys(by).length) E.push(at + ': ' + n + ' marcas y ' + Object.keys(by).length + ' adjuntos'); }
    if (id === 'repeat.each') {
      if (!UUID_RE.test(p.GroupingIdentifier || '')) E.push(at + ': sin GroupingIdentifier');
      if (start) open.push(p.GroupingIdentifier);
      else if (p.WFControlFlowMode === 2) { if (open.pop() !== p.GroupingIdentifier) E.push(at + ': Fin de repetir sin su inicio'); }
      else E.push(at + ': WFControlFlowMode desconocido');
    }
    if (id === 'filter.health.quantity') {
      const f = p.WFContentItemFilter, T = f && f.Value && f.Value.WFActionParameterFilterTemplates;
      if (!f || f.WFSerializationType !== 'WFContentPredicateTableTemplate' || !Array.isArray(T)) E.push(at + ': filtro mal formado');
      else { const ty = T.find(x => x.Property === 'Type'), dt = T.find(x => x.Property === 'Start Date');
        if (!ty || ty.Operator !== 4 || !ty.Values || !ty.Values.Enumeration || typeof ty.Values.Enumeration.Value !== 'string') E.push(at + ': sin tipo de Salud');
        if (!dt || dt.Operator !== 1001 || !dt.Values || dt.Values.Unit !== 16 || !(+dt.Values.Number > 0)) E.push(at + ': sin "en los últimos N días" (operador 1001, unidad 16)'); }
    }
    if (id === 'appendvariable') { if (!p.WFVariableName) E.push(at + ': sin nombre de variable'); else vars.add(p.WFVariableName); }
    if (p.UUID) ids.set(p.UUID, i);
  });
  if (open.length) E.push('Repetir sin cerrar');
  if (!A.some(a => short(a) === 'setclipboard')) E.push('nunca copia al portapapeles');
  return E;
}

// ───────────────────────── corredor de mentira ─────────────────────────
// Corre las acciones del plist (ya leído de vuelta del XML) contra una Salud inventada y devuelve lo que quedaría en el
// portapapeles. No es el iPhone: comprueba que la ESTRUCTURA produce el texto que la app lee. `fail` = tipo que truena.
function run(wf, health, opt) {
  opt = opt || {}; const A = wf.WFWorkflowActions, outs = new Map(), vars = new Map(), st = { clip: null, copies: 0, stoppedAt: null };
  const dayOf = s => s.slice(0, 10), tz = s => s.slice(19), nowMs = Date.parse(opt.now);
  const P = { 'Start Date': 'start', 'End Date': 'end', Value: 'value', Unit: 'unit', Type: 'type' };
  const val = (r, loop) => {
    let v;
    if (r.Type === 'ActionOutput') { if (!outs.has(r.OutputUUID)) throw new Error('salida sin producir: ' + r.OutputName); v = outs.get(r.OutputUUID); }
    else if (r.VariableName === 'Repeat Item') { if (!loop) throw new Error('Repeat Item fuera de un Repetir'); v = loop.item; }
    else { if (!vars.has(r.VariableName)) throw new Error('variable sin crear: ' + r.VariableName); v = vars.get(r.VariableName); }
    (r.Aggrandizements || []).forEach(g => {
      if (g.Type === 'WFPropertyVariableAggrandizement') { if (!(g.PropertyName in P)) throw new Error('propiedad desconocida: ' + g.PropertyName); v = v[P[g.PropertyName]]; }
      else if (g.Type === 'WFDateFormatVariableAggrandizement') { if (g.WFDateFormatStyle !== 'ISO 8601' || !g.WFISO8601IncludeTime) throw new Error('formato de fecha no previsto'); v = String(v); }
      else throw new Error('ajuste desconocido: ' + g.Type);
    });
    return v;
  };
  const str = v => Array.isArray(v) ? v.map(str).join('\n') : (v && typeof v === 'object' ? String(v.value) : String(v == null ? '' : v));
  const tok = (t, loop) => { if (typeof t === 'string') return t; if (t.WFSerializationType === 'WFTextTokenAttachment') return val(t.Value, loop);
    const by = t.Value.attachmentsByRange || {}; let i = -1; return Array.from(t.Value.string).map(ch => { i += ch.length; return ch === OBJ ? str(val(by['{' + i + ', 1}'], loop)) : ch; }).join(''); };
  const find = p => {
    const T = p.WFContentItemFilter.Value.WFActionParameterFilterTemplates, type = T.find(x => x.Property === 'Type').Values.Enumeration.Value, n = +T.find(x => x.Property === 'Start Date').Values.Number;
    if (opt.fail === type) throw new Error('Salud no reconoce el tipo "' + type + '"');
    let s = (health[type] || []).filter(x => nowMs - Date.parse(x.start) <= n * 86400000 && Date.parse(x.start) <= nowMs).map(x => Object.assign({ type }, x));
    if (p.WFHKSampleFilteringGroupBy === 'Day') { const by = {}; s.forEach(x => { const d = dayOf(x.start); (by[d] = by[d] || { type, start: d + 'T00:00:00' + tz(x.start), end: d + 'T23:59:59' + tz(x.start), value: 0, unit: x.unit }).value += x.value; });
      s = Object.values(by).map(x => Object.assign(x, { value: Math.round(x.value * 1000) / 1000 })); }
    return s.sort((x, y) => Date.parse(x.start) - Date.parse(y.start));
  };
  const exec = (from, to, loop) => {
    let last;
    for (let i = from; i < to; i++) {
      const a = A[i], id = short(a), p = a.WFWorkflowActionParameters || {};
      if (id === 'comment') continue;
      else if (id === 'gettext') last = tok(p.WFTextActionText, loop);
      else if (id === 'filter.health.quantity') last = find(p);
      else if (id === 'appendvariable') { const v = tok(p.WFInput, loop), cur = vars.get(p.WFVariableName) || []; vars.set(p.WFVariableName, cur.concat(v == null ? [] : v)); last = vars.get(p.WFVariableName); }
      else if (id === 'text.combine') { if (p.WFTextSeparator !== 'New Lines') throw new Error('separador no previsto'); const v = tok(p.text, loop); last = (Array.isArray(v) ? v : [v]).map(str).join('\n'); }
      else if (id === 'setclipboard') { st.clip = str(tok(p.WFInput, loop)); st.copies++; last = st.clip; }
      else if (id === 'repeat.each' && p.WFControlFlowMode === 0) {
        let j = i + 1; while (j < to && !(short(A[j]) === 'repeat.each' && A[j].WFWorkflowActionParameters.GroupingIdentifier === p.GroupingIdentifier)) j++;
        if (j >= to) throw new Error('Repetir sin fin');
        const list = tok(p.WFInput, loop), res = []; (Array.isArray(list) ? list : [list]).forEach(it => { const r = exec(i + 1, j, { item: it }); if (r !== undefined) res.push(r); });
        last = res; outs.set(A[j].WFWorkflowActionParameters.UUID, res); i = j; continue;
      }
      else throw new Error('acción no prevista: ' + id);
      if (p.UUID) outs.set(p.UUID, last);
    }
    return last;
  };
  try { exec(0, A.length, null); } catch (e) { st.stoppedAt = e.message; }   // en el iPhone un error detiene el atajo ahí: lo ya copiado se queda
  return st;
}

// Salud de mentira: dos días y una noche, con lo que un iPhone en español de México devolvería (fechas ISO con zona).
// HP_EXAMPLE en index.html es EXACTAMENTE lo que el atajo copia con estos datos (lo comprueba --check).
const Z = '-06:00', D1 = '2026-09-22', D2 = '2026-09-23', at = (d, hm) => d + 'T' + hm + ':00' + Z;
const NOW = at(D2, '09:00');
const q = (d, hm, value, unit) => ({ start: at(d, hm), end: at(d, hm), value, unit });
const sl = (d1, a, d2, b, value) => ({ start: at(d1, a), end: at(d2, b), value });
const HEALTH = {
  Steps: [q(D1, '08:10', 3100, 'count'), q(D1, '18:40', 5114, 'count'), q(D2, '07:30', 902, 'count')],
  'Active Calories': [q(D1, '08:10', 200.4, 'kcal'), q(D1, '19:00', 312, 'kcal'), q(D2, '07:30', 41.5, 'kcal')],
  Weight: [q(D2, '07:05', 61.2, 'kg')],
  'Resting Heart Rate': [q(D1, '23:50', 56), q(D2, '06:10', 55)],
  'Heart Rate Variability': [q(D2, '02:10', 41.3), q(D2, '03:12', 48.3), q(D2, '05:40', 60.1)],
  Sleep: [sl(D1, '23:00', D2, '07:00', 'En cama'), sl(D1, '23:10', D2, '00:42', 'Esencial'), sl(D2, '00:42', D2, '01:30', 'Profundo'), sl(D2, '01:30', D2, '01:38', 'Despierto'), sl(D2, '01:38', D2, '03:05', 'REM'), sl(D2, '03:05', D2, '06:50', 'Esencial')],
  'Body Fat Percentage': [q(D2, '07:05', 14.2)],
  'Resting Calories': [q(D1, '08:10', 800.5, 'kcal'), q(D1, '20:00', 848.4, 'kcal'), q(D2, '07:30', 510, 'kcal')],
  // ruido que NO debe salir: otro tipo, y una muestra de hace más de 7 días
  'Heart Rate': [q(D2, '08:00', 71)],
};
HEALTH.Steps.push(q('2026-09-10', '10:00', 9999, 'count'));

function sample(wf) { return run(wf, HEALTH, { now: NOW }); }

// ───────────────────────── principal ─────────────────────────
function main() {
  const arg = process.argv[2] || '', wf = build(), xml = toXML(wf), back = parseXML(xml);
  const fail = m => { console.error('FALLA: ' + m); process.exit(1); };
  if (JSON.stringify(back) !== JSON.stringify(wf)) fail('el XML no se lee de vuelta igual');
  const errs = validate(back); if (errs.length) fail('plist inválido\n  ' + errs.join('\n  '));
  const s = sample(back); if (s.stoppedAt) fail('el atajo se detiene: ' + s.stoppedAt);
  const lines = s.clip.split('\n'), keys = Array.from(new Set(lines.slice(1).map(l => l.split(' ')[0])));
  if (lines[0] !== 'trk2') fail('la primera línea no es trk2');
  if (BLOCKS.some(b => keys.indexOf(b.key) < 0)) fail('falta una clave en el texto: ' + keys.join(' '));
  if (/9999|\b71\b/.test(s.clip)) fail('se coló una muestra vieja o de otro tipo');
  if (s.copies !== 1 + BLOCKS.filter(b => b.soft).length) fail('copias al portapapeles: ' + s.copies);
  // aislamiento: si Salud no reconoce un tipo sin confirmar, lo ya leído sigue en el portapapeles
  BLOCKS.filter(b => b.soft).forEach(b => { const r = run(back, HEALTH, { now: NOW, fail: b.type }), got = new Set((r.clip || '').split('\n').slice(1).map(l => l.split(' ')[0]));
    if (!r.stoppedAt) fail('la falla simulada de ' + b.type + ' no detuvo nada');
    BLOCKS.filter(x => !x.soft).forEach(x => { if (!got.has(x.key)) fail('si falla ' + b.type + ' se pierde ' + x.key); }); });
  if (arg === '--sample') { process.stdout.write(s.clip + '\n'); return; }
  const index = path.join(__dirname, '..', '..', 'index.html');
  const example = () => { if (!fs.existsSync(index)) return null; const m = /const HP_EXAMPLE='((?:[^'\\]|\\.)*)'/.exec(fs.readFileSync(index, 'utf8')); return m ? m[1].replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\\\/g, '\\') : null; };
  if (arg === '--check') {
    if (!fs.existsSync(OUT)) fail('no existe ' + path.basename(OUT) + ' (corre build.cjs sin argumentos)');
    if (fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') !== xml) fail(path.basename(OUT) + ' no es el que build.cjs genera hoy (vuelve a generarlo y a firmarlo)');
    const ex = example(); if (ex == null) fail('no encontré HP_EXAMPLE en index.html');
    if (ex !== s.clip) fail('HP_EXAMPLE de index.html no es lo que el atajo copia. Debe ser:\n' + JSON.stringify(s.clip));
    console.log('atajo OK · ' + back.WFWorkflowActions.length + ' acciones · ' + BLOCKS.length + ' tipos · HP_EXAMPLE coincide'); return;
  }
  fs.writeFileSync(OUT, xml);
  console.log('escrito: ' + OUT + ' · ' + Buffer.byteLength(xml) + ' bytes · ' + back.WFWorkflowActions.length + ' acciones');
  console.log('tipos: ' + BLOCKS.map(b => b.key + '=' + JSON.stringify(b.type) + (b.soft ? ' (sin confirmar)' : '')).join(' · '));
  console.log('validación: OK (UUID, referencias, Repetir, filtros, ida y vuelta del XML, aislamiento de los tipos sin confirmar)');
  console.log('--- lo que copiaría con la Salud de ejemplo ---\n' + s.clip);
  const ex = example(); if (ex != null && ex !== s.clip) console.log('--- AVISO: HP_EXAMPLE de index.html es distinto; debe ser ---\n' + JSON.stringify(s.clip));
}
if (require.main === module) main();
module.exports = { build, validate, run, sample, BLOCKS, NAME, OUT, HEALTH, NOW };
