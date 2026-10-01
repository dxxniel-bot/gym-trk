// gym//TRK · tools/shortcut/test.cjs · pruebas del atajo sin iPhone:  node tools/shortcut/test.cjs
//   1) cada rotura del plist la ve el validador · 2) el corredor de mentira se detiene donde debe y lo ya copiado se queda
//   3) build.cjs --check (el plist en disco es el de hoy y HP_EXAMPLE de index.html coincide) · 4) sign.cjs --verify (el firmado lleva esas acciones)
'use strict';
const path = require('path'), cp = require('child_process');
const B = require('./build.cjs'), P = require('./plist.cjs');
const fresh = () => P.parseXML(P.toXML(B.build()));
const cases = {
  'sin romper nada': wf => {},
  'salida que no existe': wf => { wf.WFWorkflowActions[4].WFWorkflowActionParameters.WFInput.Value.OutputUUID = '00000000-0000-4000-8000-000000000000'; },
  'UUID repetido': wf => { wf.WFWorkflowActions[5].WFWorkflowActionParameters.UUID = wf.WFWorkflowActions[1].WFWorkflowActionParameters.UUID; },
  'acción sin UUID': wf => { delete wf.WFWorkflowActions[3].WFWorkflowActionParameters.UUID; },
  'Repetir sin cerrar': wf => { wf.WFWorkflowActions.splice(6, 1); },
  'variable sin crear': wf => { wf.WFWorkflowActions[2].WFWorkflowActionParameters.WFVariableName = 'otra'; wf.WFWorkflowActions.filter(a => /appendvariable/.test(a.WFWorkflowActionIdentifier)).forEach(a => { a.WFWorkflowActionParameters.WFVariableName = 'otra'; }); },
  'adjunto fuera de su marca': wf => { const t = wf.WFWorkflowActions[5].WFWorkflowActionParameters.WFTextActionText.Value; t.string = 'steps  ' + t.string.slice(6); },
  'operador "es hoy" (1002)': wf => { wf.WFWorkflowActions[3].WFWorkflowActionParameters.WFContentItemFilter.Value.WFActionParameterFilterTemplates[1].Operator = 1002; },
  'acción desconocida': wf => { wf.WFWorkflowActions.push({ WFWorkflowActionIdentifier: 'is.workflow.actions.openurl', WFWorkflowActionParameters: { UUID: '11111111-1111-4111-8111-111111111111' } }); },
  'nunca copia': wf => { wf.WFWorkflowActions = wf.WFWorkflowActions.filter(a => !/setclipboard/.test(a.WFWorkflowActionIdentifier)); },
};
let bad = 0;
for (const [name, mut] of Object.entries(cases)) {
  const wf = fresh(); mut(wf); const errs = B.validate(wf), expectOk = name === 'sin romper nada';
  const ok = expectOk ? errs.length === 0 : errs.length > 0; if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'MAL  ') + name + ' → ' + (errs.length ? errs[0] : 'sin errores'));
}
// el corredor: propiedad desconocida y tipo que truena
{ const wf = fresh(); wf.WFWorkflowActions[5].WFWorkflowActionParameters.WFTextActionText.Value.attachmentsByRange['{8, 1}'].Aggrandizements[0].PropertyName = 'Valor';
  const r = B.run(wf, B.HEALTH, { now: B.NOW }); const ok = /propiedad desconocida/.test(r.stoppedAt || ''); if (!ok) bad++; console.log((ok ? 'OK   ' : 'MAL  ') + 'corredor: propiedad desconocida → ' + r.stoppedAt); }
{ const r = B.run(fresh(), B.HEALTH, { now: B.NOW, fail: 'Resting Calories' }); const keys = new Set(r.clip.split('\n').slice(1).map(l => l.split(' ')[0]));
  const ok = /Resting Calories/.test(r.stoppedAt) && ['steps', 'act', 'weight', 'rhr', 'hrv', 'sleep', 'fat'].every(k => keys.has(k)) && !keys.has('bas'); if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'MAL  ') + 'corredor: si "Resting Calories" truena, el portapapeles ya tiene ' + [...keys].join(' ')); }
{ const r = B.run(fresh(), B.HEALTH, { now: B.NOW, fail: 'Body Fat Percentage' }); const keys = new Set(r.clip.split('\n').slice(1).map(l => l.split(' ')[0]));
  const ok = ['steps', 'act', 'weight', 'rhr', 'hrv', 'sleep'].every(k => keys.has(k)) && !keys.has('fat') && !keys.has('bas'); if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'MAL  ') + 'corredor: si "Body Fat Percentage" truena, el portapapeles ya tiene ' + [...keys].join(' ')); }
{ const r = B.run(fresh(), {}, { now: B.NOW }); const ok = r.clip === 'trk2' && !r.stoppedAt; if (!ok) bad++; console.log((ok ? 'OK   ' : 'MAL  ') + 'corredor: Salud vacía (iPhone bloqueado) copia solo ' + JSON.stringify(r.clip)); }
for (const args of [['build.cjs', '--check'], ['sign.cjs', '--verify']]) {
  const r = cp.spawnSync(process.execPath, [path.join(__dirname, args[0]), args[1]], { encoding: 'utf8' }); const ok = r.status === 0; if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'MAL  ') + args.join(' ') + ' → ' + String(r.stdout + r.stderr).trim().split(/\r?\n/).pop());
}
console.log(bad ? 'FALLARON ' + bad : 'todo en orden');
process.exit(bad ? 1 : 0);
