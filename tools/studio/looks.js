// gym//TRK · estudio · LOOKS ENVIADOS (tools/studio/looks.js) — CONTRACT §1 y §8
// Cuando el dueño manda un look a revisión (hoja de elección), Claude lo agrega aquí con estado 'en revisión' para que
// se vea en todos sus dispositivos (estado 'enviado', luego 'aprobado' / 'implementado').
// Forma: { id, name, created, updated, status, picks:{id:k}, tokens:{tok:valor}, data }.
// SIN sus notas: tools/ es público en GitHub Pages. Empieza vacío.
window.TRK_LOOKS = [
  // 22-sep · su primer look, mandado desde el estudio; horneado en index.html en v262 (BRAND §9)
  { id:'sent-1', name:'1', created:'2026-09-22T00:00:00.000Z', updated:'2026-09-22T00:00:00.000Z', status:'implementado', data:'demo',
    picks:{ float:'B', ring:'C', boot:'C', field:'A', green:'A', recovery:'A', retention:'B', wordmark:'A', english:'A' },
    tokens:{ '--t-section':'18px', '--t-display':'24px', '--bw-dash':'1px' } }
];
