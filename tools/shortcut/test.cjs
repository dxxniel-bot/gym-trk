// gym//TRK · tools/shortcut/test.cjs · pruebas del atajo sin iPhone:  node tools/shortcut/test.cjs
//   1) cada rotura del plist la ve el validador · 2) el corredor de mentira: un tipo sin datos se salta, y si algo se detiene lo ya copiado se queda
//   3) build.cjs --check (el plist en disco es el de hoy y HP_EXAMPLE de index.html coincide) · 4) sign.cjs --verify (el firmado lleva esas acciones)
// Posiciones (v292): 0 comentario · 1 Texto trk2 · 2 Agregar · 3 Combinar · 4 Copiar · y cada tipo ocupa 9:
//   Buscar · Si · Repetir · Texto · Fin de repetir · Agregar · Fin de si · Combinar · Copiar   (el primero, pasos, va de 5 a 13)
'use strict';
const path = require('path'), cp = require('child_process');
const B = require('./build.cjs'), P = require('./plist.cjs');
const fresh = () => P.parseXML(P.toXML(B.build()));
const FIND = 5, IF = 6, REP = 7, TXT = 8, REPEND = 9, ENDIF = 11;
const par = (wf, i) => wf.WFWorkflowActions[i].WFWorkflowActionParameters;
const cases = {
  'sin romper nada': wf => {},
  'salida que no existe': wf => { par(wf, REP).WFInput.Value.OutputUUID = '00000000-0000-4000-8000-000000000000'; },
  'UUID repetido': wf => { par(wf, TXT).UUID = par(wf, 1).UUID; },
  'acción sin UUID': wf => { delete par(wf, TXT).UUID; },
  'Repetir sin cerrar': wf => { wf.WFWorkflowActions.splice(REPEND, 1); },
  'Si sin cerrar': wf => { wf.WFWorkflowActions.splice(ENDIF, 1); },
  'Si con otra condición (101 = no tiene valor)': wf => { par(wf, IF).WFCondition = 101; },
  'Si que mira otra salida': wf => { par(wf, IF).WFInput.Variable.Value.OutputUUID = par(wf, 1).UUID; },
  'Buscar sin su Si': wf => { wf.WFWorkflowActions.splice(ENDIF, 1); wf.WFWorkflowActions.splice(IF, 1); },
  'Si con "Si no" (modo 1)': wf => { wf.WFWorkflowActions.splice(ENDIF, 0, { WFWorkflowActionIdentifier: 'is.workflow.actions.conditional', WFWorkflowActionParameters: { GroupingIdentifier: par(wf, IF).GroupingIdentifier, WFControlFlowMode: 1 } }); },
  'variable sin crear': wf => { par(wf, 2).WFVariableName = 'otra'; wf.WFWorkflowActions.filter(a => /appendvariable/.test(a.WFWorkflowActionIdentifier)).forEach(a => { a.WFWorkflowActionParameters.WFVariableName = 'otra'; }); },
  'adjunto fuera de su marca': wf => { const t = par(wf, TXT).WFTextActionText.Value; t.string = 'steps  ' + t.string.slice(6); },
  'operador "es hoy" (1002)': wf => { par(wf, FIND).WFContentItemFilter.Value.WFActionParameterFilterTemplates[1].Operator = 1002; },
  'acción desconocida': wf => { wf.WFWorkflowActions.push({ WFWorkflowActionIdentifier: 'is.workflow.actions.openurl', WFWorkflowActionParameters: { UUID: '11111111-1111-4111-8111-111111111111' } }); },
  'nunca copia': wf => { wf.WFWorkflowActions = wf.WFWorkflowActions.filter(a => !/setclipboard/.test(a.WFWorkflowActionIdentifier)); },
};
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? 'OK   ' : 'MAL  ') + msg); };
{ const wf = fresh(), id = i => wf.WFWorkflowActions[i].WFWorkflowActionIdentifier.replace('is.workflow.actions.', '');
  say(id(FIND) === 'filter.health.quantity' && id(IF) === 'conditional' && id(REP) === 'repeat.each' && id(TXT) === 'gettext' && id(REPEND) === 'repeat.each' && id(ENDIF) === 'conditional', 'las posiciones de la prueba son las del plist'); }
for (const [name, mut] of Object.entries(cases)) {
  const wf = fresh(); mut(wf); const errs = B.validate(wf), expectOk = name === 'sin romper nada';
  say(expectOk ? errs.length === 0 : errs.length > 0, name + ' → ' + (errs.length ? errs[0] : 'sin errores'));
}
const keysOf = r => new Set((r.clip || '').split('\n').slice(1).map(l => l.split(' ')[0])), ALL = B.BLOCKS.map(b => b.key);
const without = (...types) => { const h = Object.assign({}, B.HEALTH); types.forEach(t => { delete h[t]; }); return h; };
// el corredor: propiedad desconocida
{ const wf = fresh(); par(wf, TXT).WFTextActionText.Value.attachmentsByRange['{8, 1}'].Aggrandizements[0].PropertyName = 'Valor';
  const r = B.run(wf, B.HEALTH, { now: B.NOW }); say(/propiedad desconocida/.test(r.stoppedAt || ''), 'corredor: propiedad desconocida → ' + r.stoppedAt); }
// un dato sin registros se salta (el caso del dueño: HRV), aun en el peor iPhone (`strict`: Repetir o Agregar vacíos detienen)
{ const r = B.run(fresh(), without('Heart Rate Variability'), { now: B.NOW, strict: true }), k = keysOf(r);
  say(!r.stoppedAt && !k.has('hrv') && ALL.filter(x => x !== 'hrv').every(x => k.has(x)) && r.copies === ALL.length + 1, 'corredor: sin HRV llega al final con ' + [...k].join(' ')); }
{ const r = B.run(fresh(), without('Heart Rate Variability', 'Resting Heart Rate', 'Sleep', 'Body Fat Percentage'), { now: B.NOW, strict: true }), k = keysOf(r);
  say(!r.stoppedAt && [...k].sort().join() === 'act,bas,steps,weight' && !/\n\n|\n$/.test(r.clip), 'corredor: sin HRV, FC, sueño ni grasa (un iPhone sin reloj) copia ' + [...k].join(' ')); }
{ const r = B.run(fresh(), {}, { now: B.NOW, strict: true }); say(r.clip === 'trk2' && !r.stoppedAt, 'corredor: Salud vacía (iPhone bloqueado) copia solo ' + JSON.stringify(r.clip)); }
// sin el Si, ese mismo iPhone se detendría: la prueba de arriba no pasa "de gratis"
{ const wf = fresh(); wf.WFWorkflowActions = wf.WFWorkflowActions.filter(a => !/conditional/.test(a.WFWorkflowActionIdentifier));
  const r = B.run(wf, without('Heart Rate Variability'), { now: B.NOW, strict: true }); say(/sin elementos|sin nada/.test(r.stoppedAt || ''), 'corredor: quitando los Si, HRV vacío sí lo detiene → ' + r.stoppedAt); }
// si un tipo DETIENE el atajo, lo que va antes ya está copiado
{ const r = B.run(fresh(), B.HEALTH, { now: B.NOW, fail: 'Heart Rate Variability' }), k = keysOf(r);
  say(/Heart Rate Variability/.test(r.stoppedAt) && ALL.filter(x => x !== 'hrv').every(x => k.has(x)) && !k.has('hrv'), 'corredor: si HRV truena, el portapapeles ya tiene ' + [...k].join(' ')); }
{ const r = B.run(fresh(), B.HEALTH, { now: B.NOW, fail: 'Resting Calories' }), k = keysOf(r);
  say(/Resting Calories/.test(r.stoppedAt) && ['steps', 'act', 'weight', 'sleep', 'rhr', 'fat'].every(x => k.has(x)) && !k.has('bas') && !k.has('hrv'), 'corredor: si "Resting Calories" truena, el portapapeles ya tiene ' + [...k].join(' ')); }
{ const r = B.run(fresh(), B.HEALTH, { now: B.NOW, fail: 'Steps' }); say(/Steps/.test(r.stoppedAt) && r.clip === 'trk2', 'corredor: si el primero truena, el portapapeles dice ' + JSON.stringify(r.clip)); }
say(ALL[ALL.length - 1] === 'hrv' && ALL[0] === 'steps', 'orden: ' + ALL.join(' · '));
for (const args of [['build.cjs', '--check'], ['sign.cjs', '--verify']]) {
  const r = cp.spawnSync(process.execPath, [path.join(__dirname, args[0]), args[1]], { encoding: 'utf8' });
  say(r.status === 0, args.join(' ') + ' → ' + String(r.stdout + r.stderr).trim().split(/\r?\n/).pop());
}
console.log(bad ? 'FALLARON ' + bad : 'todo en orden');
process.exit(bad ? 1 : 0);
