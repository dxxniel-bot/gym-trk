// gym//TRK · estudio · LOOKS ENVIADOS (tools/studio/looks.js) — CONTRACT §1 y §8
// Cuando el dueño manda un look a revisión (hoja de elección), Claude lo agrega aquí con estado 'en revisión' para que
// se vea en todos sus dispositivos (estado 'enviado', luego 'aprobado' / 'implementado').
// Forma: { id, name, created, updated, status, picks:{id:k}, tokens:{tok:valor}, data }.
// SIN sus notas: tools/ es público en GitHub Pages. Empieza vacío.
window.TRK_LOOKS = [
  // 22-sep · su primer look, mandado desde el estudio; horneado en index.html en v262 (BRAND §9)
  { id:'sent-1', name:'1', created:'2026-09-22T00:00:00.000Z', updated:'2026-09-22T00:00:00.000Z', status:'implementado', data:'demo',
    picks:{ float:'B', ring:'C', boot:'C', field:'A', green:'A', recovery:'A', retention:'B', wordmark:'A', english:'A' },
    tokens:{ '--t-section':'18px', '--t-display':'24px', '--bw-dash':'1px' } },
  // 23-sep · "terminal sobrio": elegido en la conversación (no desde el estudio) y horneado en index.html en v267 (BRAND §9)
  { id:'sent-2', name:'terminal sobrio', created:'2026-09-23T00:00:00.000Z', updated:'2026-09-23T00:00:00.000Z', status:'implementado', data:'demo',
    picks:{ nav:'D', primary:'A', secondary:'A', corners:'4px', type:'A', fields:'A', toggles:'A' },
    tokens:{ '--r-ctl':'4px', '--radius':'4px', '--r-float':'8px', '--t-section':'14px', '--t-display':'20px', '--t-hero':'28px' } }
];
