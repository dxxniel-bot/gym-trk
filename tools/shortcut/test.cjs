// gym//TRK · tools/shortcut/test.cjs · pruebas del atajo sin iPhone:  node tools/shortcut/test.cjs
//   1) cada rotura del plist la ve el validador · 2) el corredor de mentira: un dato vacío DETIENE el atajo (como en el iPhone) y lo ya
//   copiado se queda; pedirlo en 0 lo salta; pedir más días trae más · 3) build.cjs --check · 4) sign.cjs --verify
// Posiciones (v294): 0 comentario · 1 Texto trk2 · 2 Agregar · 3 Combinar · 4 Copiar · 5 Texto (7 días) · 6 Si hay entrada · 7 ok in · 8 Agregar ·
//   9 Obtener diccionario (entrada) · 10 Si no · 11 Obtener diccionario (7 días) · 12 Fin · 13 cfg ← If Result · 14 ok id · 15 Agregar · 16 ok cfg ·
//   17 Agregar · 18 Combinar · 19 Copiar · y cada dato ocupa 14 (pasos, de 20 a 33):
//   dias ← cfg[dato] · Si dias > 0 · Buscar · Si trajo algo · Repetir · Texto · Fin de repetir · Agregar · Fin · ok · Agregar · Fin · Combinar · Copiar
'use strict';
const path = require('path'), cp = require('child_process');
const B = require('./build.cjs'), P = require('./plist.cjs');
const fresh = () => P.parseXML(P.toXML(B.build()));
const ELSE = 10, SETD = 20, REQ = 21, FIND = 22, IF = 23, REP = 24, TXT = 25, REPEND = 26, ENDIF = 28, ENDREQ = 31;
const par = (wf, i) => wf.WFWorkflowActions[i].WFWorkflowActionParameters;
const cases = {
  'sin romper nada': wf => {},
  'salida que no existe': wf => { par(wf, REP).WFInput.Value.OutputUUID = '00000000-0000-4000-8000-000000000000'; },
  'UUID repetido': wf => { par(wf, TXT).UUID = par(wf, 1).UUID; },
  'acción sin UUID': wf => { delete par(wf, TXT).UUID; },
  'Repetir sin cerrar': wf => { wf.WFWorkflowActions.splice(REPEND, 1); },
  'Si sin cerrar': wf => { wf.WFWorkflowActions.splice(ENDIF, 1); },
  'Si con otra condición (101 sobre las muestras)': wf => { par(wf, IF).WFCondition = 101; },
  'Si que mira otra salida': wf => { par(wf, IF).WFInput.Variable.Value.OutputUUID = par(wf, 1).UUID; },
  'Buscar sin "Si dias > 0"': wf => { wf.WFWorkflowActions.splice(ENDREQ, 1); wf.WFWorkflowActions.splice(REQ, 1); },
  '"Si no" fuera de su Si': wf => { par(wf, ELSE).GroupingIdentifier = par(wf, REQ).GroupingIdentifier; },
  'variable sin crear': wf => { wf.WFWorkflowActions.filter(a => /appendvariable/.test(a.WFWorkflowActionIdentifier)).forEach(a => { a.WFWorkflowActionParameters.WFVariableName = 'otra'; }); },
  'dias sin crear': wf => { par(wf, SETD).WFVariableName = 'otro'; },
  'coerción no prevista': wf => { par(wf, SETD).WFInput.Value.Aggrandizements.unshift({ Type: 'WFCoercionVariableAggrandizement', CoercionItemClass: 'WFStringContentItem' }); },
  'adjunto fuera de su marca': wf => { const t = par(wf, TXT).WFTextActionText.Value; t.string = 'steps  ' + t.string.slice(6); },
  'operador "es hoy" (1002)': wf => { par(wf, FIND).WFContentItemFilter.Value.WFActionParameterFilterTemplates[1].Operator = 1002; },
  'N fijo en 0': wf => { par(wf, FIND).WFContentItemFilter.Value.WFActionParameterFilterTemplates[1].Values.Number = '0'; },
  'no acepta entrada': wf => { wf.WFWorkflowHasShortcutInputVariables = false; },
  'acción desconocida': wf => { wf.WFWorkflowActions.push({ WFWorkflowActionIdentifier: 'is.workflow.actions.openurl', WFWorkflowActionParameters: { UUID: '11111111-1111-4111-8111-111111111111' } }); },
  'nunca copia': wf => { wf.WFWorkflowActions = wf.WFWorkflowActions.filter(a => !/setclipboard/.test(a.WFWorkflowActionIdentifier)); },
};
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? 'OK   ' : 'MAL  ') + msg); };
{ const wf = fresh(), id = i => wf.WFWorkflowActions[i].WFWorkflowActionIdentifier.replace('is.workflow.actions.', '');
  say(id(ELSE) === 'conditional' && par(wf, ELSE).WFControlFlowMode === 1 && id(SETD) === 'setvariable' && id(REQ) === 'conditional' && id(FIND) === 'filter.health.quantity' && id(IF) === 'conditional' && id(REP) === 'repeat.each' && id(TXT) === 'gettext' && id(REPEND) === 'repeat.each' && id(ENDIF) === 'conditional' && id(ENDREQ) === 'conditional', 'las posiciones de la prueba son las del plist'); }
for (const [name, mut] of Object.entries(cases)) {
  const wf = fresh(); mut(wf); const errs = B.validate(wf), expectOk = name === 'sin romper nada';
  say(expectOk ? errs.length === 0 : errs.length > 0, name + ' → ' + (errs.length ? errs[0] : 'sin errores'));
}
const lines = r => (r.clip || '').split('\n'), keysOf = r => new Set(lines(r).slice(1).filter(l => !/^ok /.test(l)).map(l => l.split(' ')[0])), oks = r => new Set(lines(r).filter(l => /^ok /.test(l)).map(l => l.slice(3)));
const ALL = B.BLOCKS.map(b => b.key), without = (...types) => { const h = Object.assign({}, B.HEALTH); types.forEach(t => { delete h[t]; }); return h; };
// el corredor: propiedad desconocida
{ const wf = fresh(); par(wf, TXT).WFTextActionText.Value.attachmentsByRange['{8, 1}'].Aggrandizements[0].PropertyName = 'Valor';
  const r = B.run(wf, B.HEALTH, { now: B.NOW }); say(/propiedad desconocida/.test(r.stoppedAt || ''), 'corredor: propiedad desconocida → ' + r.stoppedAt); }
// su caso (2-oct): sin entrada y sin % grasa, se detiene AHÍ con "No Samples Found", y lo de antes ya está copiado con su marca
{ const r = B.run(fresh(), without('Body Fat Percentage'), { now: B.NOW }), k = keysOf(r), o = oks(r);
  say(/No Samples Found/.test(r.stoppedAt || '') && ['steps', 'act', 'weight', 'sleep', 'rhr'].every(x => k.has(x) && o.has(x)) && !o.has('fat') && !k.has('bas'), 'corredor: sin grasa y sin entrada se detiene en grasa con ' + [...k].join(' ')); }
// la app pide no buscarlo: llega al final
{ const r = B.run(fresh(), without('Body Fat Percentage', 'Heart Rate Variability'), { now: B.NOW, input: B.cfgOf({ fat: 0, hrv: 0 }) }), k = keysOf(r);
  say(!r.stoppedAt && [...k].sort().join() === 'act,bas,rhr,sleep,steps,weight' && !/\n\n|\n$/.test(r.clip), 'corredor: pidiendo grasa y HRV en 0 llega al final con ' + [...k].join(' ')); }
{ const r = B.run(fresh(), without('Body Fat Percentage', 'Heart Rate Variability', 'Resting Heart Rate', 'Sleep'), { now: B.NOW, input: B.cfgOf({ fat: 0, hrv: 0, rhr: 0, sleep: 0 }) }), k = keysOf(r);
  say(!r.stoppedAt && [...k].sort().join() === 'act,bas,steps,weight', 'corredor: un iPhone sin reloj, pidiendo solo lo que tiene → ' + [...k].join(' ')); }
// el historial: pedir más días trae más (la muestra de hace 13 días)
{ const r7 = B.run(fresh(), B.HEALTH, { now: B.NOW }), r20 = B.run(fresh(), B.HEALTH, { now: B.NOW, input: B.cfgOf({ steps: 20 }) });
  say(!/ 9999$/m.test(r7.clip) && / 9999$/m.test(r20.clip) && !r20.stoppedAt, 'corredor: 7 días no traen la muestra de hace 13; 20 días sí'); }
{ const r = B.run(fresh(), {}, { now: B.NOW, input: B.cfgOf(B.BLOCKS.reduce((m, b) => (m[b.key] = 0, m), {})) }); say(r.clip === 'trk2\nok in\nok id demo\nok cfg\nok end' && !r.stoppedAt, 'corredor: pidiendo nada copia solo ' + JSON.stringify(r.clip)); }
{ const r = B.run(fresh(), B.HEALTH, { now: B.NOW, input: 'esto no es json' }), o = oks(r); say(!r.stoppedAt && o.has('end') && !B.BLOCKS.some(b => o.has(b.key)), 'corredor: una entrada que no es JSON llega al final sin buscar nada (ok end sin ok de datos: la app sabe que no leyó la lista)'); }
{ const r = B.run(fresh(), B.HEALTH, { now: B.NOW, fail: 'Resting Calories' }), k = keysOf(r);
  say(/Resting Calories/.test(r.stoppedAt) && ['steps', 'act', 'weight', 'sleep', 'rhr', 'fat'].every(x => k.has(x)) && !k.has('bas') && !k.has('hrv'), 'corredor: si "Resting Calories" truena, el portapapeles ya tiene ' + [...k].join(' ')); }
{ const r = B.run(fresh(), {}, { now: B.NOW, input: B.cfgOf() }); say(/No Samples Found: Steps/.test(r.stoppedAt || '') && r.clip === 'trk2\nok in\nok id demo\nok cfg', 'corredor: Salud vacía: se detiene en pasos, pero la app ya ve ok cfg → ' + JSON.stringify(r.clip)); }
say(ALL[ALL.length - 1] === 'hrv' && ALL[0] === 'steps', 'orden: ' + ALL.join(' · '));
for (const args of [['build.cjs', '--check'], ['sign.cjs', '--verify']]) {
  const r = cp.spawnSync(process.execPath, [path.join(__dirname, args[0]), args[1]], { encoding: 'utf8' });
  say(r.status === 0, args.join(' ') + ' → ' + String(r.stdout + r.stderr).trim().split(/\r?\n/).pop());
}
console.log(bad ? 'FALLARON ' + bad : 'todo en orden');
process.exit(bad ? 1 : 0);
