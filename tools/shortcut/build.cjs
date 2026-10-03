// gym//TRK · tools/shortcut/build.cjs · arma el Atajo "TRK Salud" como archivo (node puro, sin dependencias)
//
//   node tools/shortcut/build.cjs            escribe tools/shortcut/TRK Salud.shortcut (plist XML SIN firmar), lo valida
//                                            y lo corre contra una Salud de mentira (imprime lo que copiaría el iPhone)
//   node tools/shortcut/build.cjs --check    no escribe: comprueba que el archivo en disco es el que saldría hoy, que
//                                            HP_EXAMPLE de index.html es, letra por letra, lo que el atajo copia, y que el
//                                            orden de los datos (HP_ORDER) es el mismo en la app y en el atajo
//   node tools/shortcut/build.cjs --sample   solo imprime el texto de ejemplo (para meterlo por parseHealthPaste)
//
// Qué hace el atajo en el iPhone: lee de Salud pasos, energía activa, peso, sueño con fases, FC en reposo, % de grasa,
// energía en reposo y HRV; escribe una línea por muestra en el formato `trk2` que la app ya lee (parseHealthPaste en
// index.html) y lo copia al portapapeles. No abre ninguna URL ni manda nada a internet.
//
// v294 · lo que enseñó el iPhone del dueño (2-oct): "Buscar muestras de Salud" SE DETIENE con un error ("No Samples Found:
// There are either no Body Fat Percentage samples logged or you need to give Shortcuts access…") cuando no encuentra nada.
// Un "Si trajo algo" después de buscar nunca llega a correr, y Atajos no tiene "intentar y seguir". Por eso:
//   1) la APP le dice al atajo, por la entrada (`shortcuts://run-shortcut?…&input=text&text={"steps":2,…}`), cuántos días
//      buscar de cada dato; 0 = no buscarlo. La app aprende qué no tienes (punto 3) y pide siempre una ventana que incluye el
//      último dato que ya tiene, así la búsqueda nunca queda vacía. La primera vez pide un año (el historial).
//   2) sin entrada (corrido desde Atajos), 7 días de todo;
//   3) cada dato que se leyó deja una marca `ok <dato>` (y `ok cfg` al leer la entrada): si el atajo se detiene, la app sabe
//      en cuál y ya no lo pide;
//   4) se copia al portapapeles tras cada dato: lo leído antes de una falla nunca se pierde (v292).
//
// De dónde sale cada identificador: FUENTES.md (junto a este archivo). Regla: nada se escribe "de memoria"; lo que no se
// pudo ver en un atajo real va marcado `soft`.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { toXML, parseXML } = require('./plist.cjs');

// v293 · se llamaba "TRK Biometrics". El iPhone le pone al atajo el nombre del ARCHIVO, y Safari numera las descargas repetidas
// ("… 2.shortcut"): con archivos viejos del mismo nombre en Descargas, el atajo nuevo entraba como "TRK Biometrics 2" y la app, que lo
// corre por nombre, no lo encontraba (o se volvía a agregar el viejo). Nombre nuevo = ningún archivo anterior estorba.
// v294 · TRK Sync → TRK Salud: el dueño ya tiene el TRK Sync de v293 (archivo y atajo); bajado con el mismo nombre entraría como
// "TRK Sync 2" y la app seguiría corriendo el viejo, que no sabe leer la lista.
const NAME = 'TRK Salud';                 // nombre visible del atajo: la app lo corre con shortcuts://run-shortcut?name=TRK%20Salud
const OUT = path.join(__dirname, NAME + '.shortcut');
const VAR = 'datos';                      // variable donde se juntan las líneas
const CFG = 'cfg';                        // la entrada (o los 7 días por omisión), como texto JSON
const DIAS = 'dias';                      // cuántos días del dato que toca (0 = no se busca)
const DEFAULT_DAYS = 7;
const OBJ = '￼';                     // marca de "aquí va una variable" dentro de un Texto

// key = palabra del formato trk2 (y llave de la entrada) · type = nombre del tipo en la acción "Buscar muestras de salud"
// (inglés: es el valor interno, no la etiqueta) · day = agrupar por día · unit = la línea termina con la unidad · sleep =
// inicio, fin y fase · soft = identificador sin confirmar en una acción Buscar real (ver FUENTES.md)
// El ORDEN importa: si un dato detuviera el atajo, en esa corrida se pierden los que van después de él. La app tiene el
// mismo orden en HP_ORDER (lo compara --check).
const BLOCKS = [
  { key: 'steps', type: 'Steps', day: true },
  { key: 'act', type: 'Active Calories', day: true, unit: true },
  { key: 'weight', type: 'Weight', unit: true },
  { key: 'sleep', type: 'Sleep', sleep: true },
  { key: 'rhr', type: 'Resting Heart Rate' },
  { key: 'fat', type: 'Body Fat Percentage' },   // confirmado: la alerta de su iPhone dice "Body Fat Percentage"
  { key: 'bas', type: 'Resting Calories', day: true, unit: true, soft: true },
  { key: 'hrv', type: 'Heart Rate Variability' },
];
const DEFAULT_CFG = '{' + BLOCKS.map(b => '"' + b.key + '":' + DEFAULT_DAYS).join(',') + '}';
// lo que la entrada puede pedir: aceptar cualquier cosa, como un atajo nuevo (la lista del cliente más nuevo leído, HS)
const INPUT_CLASSES = ['WFAppContentItem', 'WFAppStoreAppContentItem', 'WFArticleContentItem', 'WFContactContentItem', 'WFDateContentItem', 'WFEmailAddressContentItem', 'WFFolderContentItem', 'WFGenericFileContentItem', 'WFImageContentItem', 'WFiTunesProductContentItem', 'WFLocationContentItem', 'WFDCMapsLinkContentItem', 'WFAVAssetContentItem', 'WFPDFContentItem', 'WFPhoneNumberContentItem', 'WFRichTextContentItem', 'WFSafariWebPageContentItem', 'WFStringContentItem', 'WFURLContentItem'];

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
const INPUT = () => ({ Type: 'ExtensionInput' });                                   // la entrada del atajo (SW #62, #65)
const asVar = v => ({ Type: 'Variable', Variable: attach(v) });                     // lo que mira un Si
const prop = name => ({ Type: 'WFPropertyVariableAggrandizement', PropertyName: name });
const iso = () => ({ Type: 'WFDateFormatVariableAggrandizement', WFDateFormatStyle: 'ISO 8601', WFISO8601IncludeTime: true });
const asDict = () => ({ Type: 'WFCoercionVariableAggrandizement', CoercionItemClass: 'WFDictionaryContentItem' });   // SW #65
const dictKey = k => ({ Type: 'WFDictionaryValueVariableAggrandizement', DictionaryKey: k });                         // SW #65
// Texto con variables: las partes son cadenas o referencias; cada referencia ocupa un carácter U+FFFC y se anota su posición
function text(parts) {
  let s = ''; const by = {};
  parts.forEach(p => { if (typeof p === 'string') s += p; else { by['{' + s.length + ', 1}'] = p; s += OBJ; } });
  if (!Object.keys(by).length) return s;   // sin variables, los atajos reales guardan la cadena tal cual
  return { Value: { string: s, attachmentsByRange: by }, WFSerializationType: 'WFTextTokenString' };
}
const item = (...aggr) => varRef('Repeat Item', aggr);
// condiciones de un Si (FUENTES.md): 2 = "es mayor que" (SW #66) · 100 = "tiene algún valor" (IC2 #29) · 101 = "no tiene ningún valor" (LW #177)
const GT = 2, HAS_VALUE = 100, NO_VALUE = 101;
const ifStart = (g, input, cond, extra) => act('conditional', Object.assign({ WFInput: input, WFControlFlowMode: 0, GroupingIdentifier: g, WFCondition: cond }, extra || {}));
const ifElse = g => act('conditional', { GroupingIdentifier: g, WFControlFlowMode: 1 });
const ifEnd = (g, seed) => act('conditional', { UUID: uuid(seed), GroupingIdentifier: g, WFControlFlowMode: 2 });
const setVar = (name, v) => act('setvariable', { WFInput: attach(v), WFVariableName: name });   // sin UUID, como en IC2 #2

// Buscar muestras de salud donde Tipo es <type> y Fecha de inicio está en los últimos [dias] días (más viejas primero)
function findSamples(b) {
  const p = {
    WFContentItemFilter: {
      Value: {
        WFActionParameterFilterPrefix: 1,
        WFContentPredicateBoundedDate: false,
        WFActionParameterFilterTemplates: [
          { Property: 'Type', Operator: 4, Values: { Enumeration: { Value: b.type, WFSerializationType: 'WFStringSubstitutableState' } }, Removable: false, Bounded: true },
          { Property: 'Start Date', Operator: 1001, Values: { Unit: 16, Number: attach(varRef(DIAS)) }, Removable: false, Bounded: true },   // N en una variable: LW #292
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
// marca de "este dato terminó": una línea `ok <dato>` en `datos`
function mark(tag, k) {
  const t = uuid(tag + '/ok');
  return [act('gettext', { WFTextActionText: text(['ok ' + k]), UUID: t }), act('appendvariable', { WFInput: attach(outRef(t, 'Text')), WFVariableName: VAR, UUID: uuid(tag + '/okappend') })];
}
// un bloque = dias ← entrada[dato] → Si dias > 0 → Buscar → Si trajo algo → Repetir (Texto) → Agregar → Fin → ok <dato> → Fin
function block(b) {
  const req = uuid(b.key + '/req'), g = uuid(b.key + '/group'), ifg = uuid(b.key + '/if'), find = findSamples(b), end = uuid(b.key + '/end');
  const samples = () => outRef(find.WFWorkflowActionParameters.UUID, 'Health Samples');
  return [
    setVar(DIAS, varRef(CFG, [dictKey(b.key)])),   // cfg ya es un diccionario (Obtener diccionario); el valor por llave, como SW #1241
    ifStart(req, asVar(varRef(DIAS)), GT, { WFNumberValue: '0' }),
    find,
    ifStart(ifg, asVar(samples()), HAS_VALUE),
    act('repeat.each', { WFInput: attach(samples()), GroupingIdentifier: g, WFControlFlowMode: 0 }),
    act('gettext', { WFTextActionText: line(b), UUID: uuid(b.key + '/line') }),
    act('repeat.each', { GroupingIdentifier: g, WFControlFlowMode: 2, UUID: end }),
    act('appendvariable', { WFInput: attach(outRef(end, 'Repeat Results')), WFVariableName: VAR, UUID: uuid(b.key + '/append') }),
    ifEnd(ifg, b.key + '/endif'),
  ].concat(mark(b.key, b.key), [ifEnd(req, b.key + '/endreq')]);
}
// juntar `datos` con saltos de línea y copiarlo
function copy(tag) {
  const c = uuid(tag + '/combine');
  return [
    act('text.combine', { WFTextSeparator: 'New Lines', text: attach(varRef(VAR)), UUID: c }),
    act('setclipboard', { WFInput: attach(outRef(c, 'Combined Text')), UUID: uuid(tag + '/copy') }),
  ];
}
// la entrada → un diccionario, con el patrón exacto de SW #1236–#1241: Si [x] tiene algún valor → Obtener diccionario de [x] /
// Si no → Obtener diccionario de [otro] → Fin; lo que sigue usa el "If Result" del Fin. Apple: "Use the Get Dictionary from Input
// action to turn text containing JSON … into a dictionary item". Sin entrada (corrido desde Atajos), 7 días de todo.
// Marcas: `ok in` = llegó la entrada · `ok id <n>` = el número de corrida que mandó la app (así la app no aprende de un portapapeles
// viejo) · `ok cfg` = ya leyó el plan. Se copian ANTES de la primera búsqueda: si la primera se detiene, la app igual lo sabe.
function config() {
  const g = uuid('cfg/if'), def = uuid('cfg/default'), endG = 'cfg/end', idT = uuid('cfg/id');
  return [
    act('gettext', { WFTextActionText: text([DEFAULT_CFG]), UUID: def }),
    ifStart(g, asVar(INPUT()), HAS_VALUE),
  ].concat(mark('in', 'in'), [
    act('detect.dictionary', { WFInput: attach(INPUT()), UUID: uuid('cfg/dict-in') }),   // lo último de la rama: es el "If Result"
    ifElse(g),
    act('detect.dictionary', { WFInput: attach(outRef(def, 'Text')), UUID: uuid('cfg/dict-def') }),
    ifEnd(g, endG),
    setVar(CFG, outRef(uuid(endG), 'If Result')),
    act('gettext', { WFTextActionText: text(['ok id ', varRef(CFG, [dictKey('id')])]), UUID: idT }),
    act('appendvariable', { WFInput: attach(outRef(idT, 'Text')), WFVariableName: VAR, UUID: uuid('cfg/idappend') }),
  ], mark('cfg', 'cfg'));
}

function build() {
  const head = uuid('head/text');
  let a = [
    act('comment', { WFCommentActionText: 'gym//TRK · copia tus datos de Salud para pegarlos en gymtrk.app. La app le dice cuántos días buscar de cada dato y cuáles no tienes. No abre ninguna página ni manda nada a internet.' }),
    act('gettext', { WFTextActionText: text(['trk2']), UUID: head }),
    act('appendvariable', { WFInput: attach(outRef(head, 'Text')), WFVariableName: VAR, UUID: uuid('head/append') }),
  ];
  a = a.concat(copy('copy/head'));                                           // desde el primer momento el portapapeles dice `trk2`: la app sabe que el atajo corrió
  a = a.concat(config(), copy('copy/cfg'));                                  // las marcas de la entrada, copiadas antes de la primera búsqueda
  BLOCKS.forEach(b => { a = a.concat(block(b), copy('copy/' + b.key)); });   // tras cada dato, lo leído hasta ahí ya está en el portapapeles
  a = a.concat(mark('end', 'end'), copy('copy/end'));                        // `ok end` = llegó al final (si falta un dato pedido, no leyó el plan)
  return {
    WFWorkflowMinimumClientVersionString: '900',
    WFWorkflowMinimumClientVersion: 900,
    WFWorkflowIcon: { WFWorkflowIconStartColor: 255, WFWorkflowIconGlyphNumber: 59754 },
    WFWorkflowClientVersion: '3218.0.9',
    WFWorkflowOutputContentItemClasses: [],
    WFWorkflowHasOutputFallback: false,
    WFWorkflowActions: a,
    WFWorkflowInputContentItemClasses: INPUT_CLASSES,
    WFWorkflowImportQuestions: [],
    WFWorkflowTypes: [],
    WFQuickActionSurfaces: [],
    WFWorkflowHasShortcutInputVariables: true,
  };
}

// ───────────────────────── validación ─────────────────────────
const UUID_RE = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/;
const KNOWN = { comment: 1, gettext: 1, appendvariable: 1, setvariable: 1, 'detect.dictionary': 1, 'filter.health.quantity': 1, 'repeat.each': 1, conditional: 1, 'text.combine': 1, setclipboard: 1 };
const AGGR = { WFPropertyVariableAggrandizement: 1, WFDateFormatVariableAggrandizement: 1, WFCoercionVariableAggrandizement: 1, WFDictionaryValueVariableAggrandizement: 1 };
const short = a => a.WFWorkflowActionIdentifier.replace('is.workflow.actions.', '');
// todas las referencias a variables dentro de un valor (Texto con adjuntos o adjunto suelto), con dónde están
function refs(v, out) {
  out = out || [];
  if (Array.isArray(v)) v.forEach(x => refs(x, out));
  else if (v && typeof v === 'object' && !Buffer.isBuffer(v)) {
    if (v.Type === 'ActionOutput' || v.Type === 'ExtensionInput' || (v.Type === 'Variable' && 'VariableName' in v)) out.push(v);   // el WFInput de un Si es {Type:'Variable', Variable:<adjunto>}: no es una referencia, la lleva dentro
    else Object.keys(v).forEach(k => refs(v[k], out));
  }
  return out;
}
function validate(wf) {
  const E = [], A = wf.WFWorkflowActions; const ids = new Map(), vars = new Set(), open = [];
  if (!Array.isArray(A) || !A.length) return ['sin acciones'];
  ['WFWorkflowMinimumClientVersion', 'WFWorkflowClientVersion', 'WFWorkflowIcon', 'WFWorkflowImportQuestions', 'WFWorkflowTypes', 'WFWorkflowInputContentItemClasses'].forEach(k => { if (wf[k] == null) E.push('falta ' + k); });
  const usesInput = JSON.stringify(A).indexOf('"ExtensionInput"') >= 0;
  if (usesInput && (wf.WFWorkflowHasShortcutInputVariables !== true || !(wf.WFWorkflowInputContentItemClasses || []).includes('WFStringContentItem'))) E.push('usa la entrada pero el atajo no acepta texto de entrada');
  A.forEach((a, i) => {
    const id = short(a), p = a.WFWorkflowActionParameters || {}, at = '#' + i + ' ' + id;
    if (!/^is\.workflow\.actions\./.test(a.WFWorkflowActionIdentifier) || !KNOWN[id]) E.push(at + ': acción fuera de la lista confirmada');
    const flow = id === 'repeat.each' || id === 'conditional', start = flow && p.WFControlFlowMode === 0, mid = id === 'conditional' && p.WFControlFlowMode === 1;
    // UUID: toda acción lo lleva, salvo el comentario, Guardar variable y el INICIO / "Si no" de Repetir o de Si (en los atajos
    // reales no lo llevan: se identifican por GroupingIdentifier)
    if (id !== 'comment' && id !== 'setvariable' && !start && !mid) {
      if (!UUID_RE.test(p.UUID || '')) E.push(at + ': sin UUID válido');
      else if (ids.has(p.UUID)) E.push(at + ': UUID repetido (#' + ids.get(p.UUID) + ')');
    }
    // referencias: una salida solo se puede usar DESPUÉS de la acción que la produce; una variable, después de crearla
    refs(p).forEach(r => {
      if (r.Type === 'ActionOutput') { if (!ids.has(r.OutputUUID)) E.push(at + ': usa una salida que no existe antes (' + r.OutputName + ' ' + r.OutputUUID + ')'); }
      else if (r.Type === 'ExtensionInput') { /* la entrada del atajo siempre existe (puede venir vacía) */ }
      else if (r.VariableName === 'Repeat Item') { if (!open.some(o => o.indexOf('repeat.each ') === 0)) E.push(at + ': "Repeat Item" fuera de un Repetir'); }
      else if (!vars.has(r.VariableName)) E.push(at + ': usa la variable "' + r.VariableName + '" antes de crearla');
      (r.Aggrandizements || []).forEach(g => {
        if (!AGGR[g.Type]) E.push(at + ': ajuste de variable desconocido ' + g.Type);
        if (g.Type === 'WFCoercionVariableAggrandizement' && g.CoercionItemClass !== 'WFDictionaryContentItem') E.push(at + ': coerción no prevista ' + g.CoercionItemClass);
        if (g.Type === 'WFDictionaryValueVariableAggrandizement' && typeof g.DictionaryKey !== 'string') E.push(at + ': llave de diccionario sin texto'); });
    });
    // Textos: cada adjunto apunta a un U+FFFC y cada U+FFFC tiene su adjunto
    const t = p.WFTextActionText && p.WFTextActionText.Value;
    if (t) { const by = t.attachmentsByRange || {}, s = t.string || ''; let n = 0;
      Object.keys(by).forEach(k => { const m = /^\{(\d+), 1\}$/.exec(k); if (!m || s.charAt(+m[1]) !== OBJ) E.push(at + ': adjunto ' + k + ' no cae en una marca'); });
      for (const ch of s) if (ch === OBJ) n++;
      if (n !== Object.keys(by).length) E.push(at + ': ' + n + ' marcas y ' + Object.keys(by).length + ' adjuntos'); }
    if (flow) {   // Repetir y Si se anidan: cada fin cierra el último que se abrió, y del mismo tipo; "Si no" solo dentro de su Si
      const what = id === 'conditional' ? 'si' : 'repetir';
      if (!UUID_RE.test(p.GroupingIdentifier || '')) E.push(at + ': sin GroupingIdentifier');
      if (start) open.push(id + ' ' + p.GroupingIdentifier);
      else if (mid) { if (open[open.length - 1] !== id + ' ' + p.GroupingIdentifier) E.push(at + ': "Si no" fuera de su Si'); }
      else if (p.WFControlFlowMode === 2) { if (open.pop() !== id + ' ' + p.GroupingIdentifier) E.push(at + ': Fin de ' + what + ' sin su inicio'); }
      else E.push(at + ': WFControlFlowMode desconocido');
    }
    if (id === 'conditional' && start) {
      const w = p.WFInput, r = w && w.Variable && w.Variable.Value;
      if (!w || w.Type !== 'Variable' || !w.Variable || w.Variable.WFSerializationType !== 'WFTextTokenAttachment' || !r) E.push(at + ': el Si no mira nada');
      else if (p.WFCondition === HAS_VALUE) { if (r.Type !== 'ActionOutput' && r.Type !== 'ExtensionInput') E.push(at + ': "tiene algún valor" sobre algo que no es una salida ni la entrada'); }
      else if (p.WFCondition === NO_VALUE) { if (r.Type !== 'ExtensionInput') E.push(at + ': "no tiene valor" solo se usa sobre la entrada'); }
      else if (p.WFCondition === GT) { if (r.VariableName !== DIAS || p.WFNumberValue !== '0') E.push(at + ': "es mayor que" solo se usa como dias > 0'); }
      else E.push(at + ': condición no prevista ' + p.WFCondition);
    }
    if (id === 'setvariable') { if (!p.WFVariableName || !p.WFInput) E.push(at + ': Guardar variable sin nombre o sin valor'); else vars.add(p.WFVariableName); }
    if (id === 'filter.health.quantity') {
      const f = p.WFContentItemFilter, T = f && f.Value && f.Value.WFActionParameterFilterTemplates;
      if (!f || f.WFSerializationType !== 'WFContentPredicateTableTemplate' || !Array.isArray(T)) E.push(at + ': filtro mal formado');
      else { const ty = T.find(x => x.Property === 'Type'), dt = T.find(x => x.Property === 'Start Date'), num = dt && dt.Values && dt.Values.Number;
        if (!ty || ty.Operator !== 4 || !ty.Values || !ty.Values.Enumeration || typeof ty.Values.Enumeration.Value !== 'string') E.push(at + ': sin tipo de Salud');
        const okNum = (typeof num === 'string' && +num > 0) || (num && num.WFSerializationType === 'WFTextTokenAttachment' && num.Value && num.Value.VariableName === DIAS);
        if (!dt || dt.Operator !== 1001 || dt.Values.Unit !== 16 || !okNum) E.push(at + ': sin "en los últimos N días" (operador 1001, unidad 16, N > 0 o la variable dias)');
        // una búsqueda vacía DETIENE el atajo: solo se busca dentro de "Si dias > 0", y con dias recién leído de la entrada
        const q = A[i - 1] && A[i - 1].WFWorkflowActionParameters, s2 = A[i - 2];
        if (!q || short(A[i - 1]) !== 'conditional' || q.WFCondition !== GT || !s2 || short(s2) !== 'setvariable' || s2.WFWorkflowActionParameters.WFVariableName !== DIAS) E.push(at + ': se busca sin pasar por "Si dias > 0"'); }
    }
    if (id === 'appendvariable') { if (!p.WFVariableName) E.push(at + ': sin nombre de variable'); else vars.add(p.WFVariableName); }
    if (p.UUID) ids.set(p.UUID, i);
  });
  if (open.length) E.push((open[open.length - 1].indexOf('conditional ') === 0 ? 'Si' : 'Repetir') + ' sin cerrar');
  // cada Buscar va seguido de su Si: una búsqueda vacía nunca llega suelta a un Repetir
  A.forEach((a, i) => { if (short(a) !== 'filter.health.quantity') return; const n = A[i + 1], q = n && n.WFWorkflowActionParameters, r = q && q.WFInput && q.WFInput.Variable && q.WFInput.Variable.Value;
    if (!n || short(n) !== 'conditional' || q.WFControlFlowMode !== 0 || !r || r.OutputUUID !== a.WFWorkflowActionParameters.UUID) E.push('#' + i + ' filter.health.quantity: sin su "Si trajo algo" justo después'); });
  if (!A.some(a => short(a) === 'setclipboard')) E.push('nunca copia al portapapeles');
  return E;
}

// ───────────────────────── corredor de mentira ─────────────────────────
// Corre las acciones del plist (ya leído de vuelta del XML) contra una Salud inventada y devuelve lo que quedaría en el
// portapapeles. No es el iPhone: comprueba que la ESTRUCTURA produce el texto que la app lee.
//   opt.input = la entrada (texto JSON, como la manda la app) · opt.fail = tipo que truena por otra razón
// Como en el iPhone (2-oct): una búsqueda sin resultados DETIENE el atajo con "No Samples Found".
function run(wf, health, opt) {
  opt = opt || {}; const A = wf.WFWorkflowActions, outs = new Map(), vars = new Map(), st = { clip: null, copies: 0, stoppedAt: null };
  const dayOf = s => s.slice(0, 10), tz = s => s.slice(19), nowMs = Date.parse(opt.now);
  const P = { 'Start Date': 'start', 'End Date': 'end', Value: 'value', Unit: 'unit', Type: 'type' };
  const val = (r, loop) => {
    let v;
    if (r.Type === 'ActionOutput') { if (!outs.has(r.OutputUUID)) throw new Error('salida sin producir: ' + r.OutputName); v = outs.get(r.OutputUUID); }
    else if (r.Type === 'ExtensionInput') v = opt.input == null ? null : opt.input;
    else if (r.VariableName === 'Repeat Item') { if (!loop) throw new Error('Repeat Item fuera de un Repetir'); v = loop.item; }
    else { if (!vars.has(r.VariableName)) throw new Error('variable sin crear: ' + r.VariableName); v = vars.get(r.VariableName); }
    (r.Aggrandizements || []).forEach(g => {
      if (g.Type === 'WFPropertyVariableAggrandizement') { if (!(g.PropertyName in P)) throw new Error('propiedad desconocida: ' + g.PropertyName); v = v[P[g.PropertyName]]; }
      else if (g.Type === 'WFDateFormatVariableAggrandizement') { if (g.WFDateFormatStyle !== 'ISO 8601' || !g.WFISO8601IncludeTime) throw new Error('formato de fecha no previsto'); v = String(v); }
      else if (g.Type === 'WFCoercionVariableAggrandizement') { if (typeof v === 'string') { try { v = JSON.parse(v); } catch (_) { v = null; } } if (v && typeof v !== 'object') v = null; }
      else if (g.Type === 'WFDictionaryValueVariableAggrandizement') v = v && Object.prototype.hasOwnProperty.call(v, g.DictionaryKey) ? v[g.DictionaryKey] : null;
      else throw new Error('ajuste desconocido: ' + g.Type);
    });
    return v;
  };
  const str = v => Array.isArray(v) ? v.map(str).join('\n') : (v && typeof v === 'object' ? String(v.value) : String(v == null ? '' : v));
  const tok = (t, loop) => { if (typeof t === 'string') return t; if (t.WFSerializationType === 'WFTextTokenAttachment') return val(t.Value, loop);
    const by = t.Value.attachmentsByRange || {}; let i = -1; return Array.from(t.Value.string).map(ch => { i += ch.length; return ch === OBJ ? str(val(by['{' + i + ', 1}'], loop)) : ch; }).join(''); };
  const has = v => Array.isArray(v) ? v.length > 0 : (v != null && v !== '');
  const find = (p, loop) => {
    const T = p.WFContentItemFilter.Value.WFActionParameterFilterTemplates, type = T.find(x => x.Property === 'Type').Values.Enumeration.Value, num = T.find(x => x.Property === 'Start Date').Values.Number;
    const n = +(typeof num === 'string' ? num : tok(num, loop));
    if (opt.fail === type) throw new Error('Salud no reconoce el tipo "' + type + '"');
    if (!(n > 0)) throw new Error('"en los últimos N días" sin un número: ' + n);
    let s = (health[type] || []).filter(x => nowMs - Date.parse(x.start) <= n * 86400000 && Date.parse(x.start) <= nowMs).map(x => Object.assign({ type }, x));
    if (p.WFHKSampleFilteringGroupBy === 'Day') { const by = {}; s.forEach(x => { const d = dayOf(x.start); (by[d] = by[d] || { type, start: d + 'T00:00:00' + tz(x.start), end: d + 'T23:59:59' + tz(x.start), value: 0, unit: x.unit }).value += x.value; });
      s = Object.values(by).map(x => Object.assign(x, { value: Math.round(x.value * 1000) / 1000 })); }
    if (!s.length) throw new Error('No Samples Found: ' + type);   // lo que hace el iPhone (captura del dueño, 2-oct)
    return s.sort((x, y) => Date.parse(x.start) - Date.parse(y.start));
  };
  const exec = (from, to, loop) => {
    let last;
    for (let i = from; i < to; i++) {
      const a = A[i], id = short(a), p = a.WFWorkflowActionParameters || {};
      if (id === 'comment') continue;
      else if (id === 'gettext') last = tok(p.WFTextActionText, loop);
      else if (id === 'filter.health.quantity') last = find(p, loop);
      else if (id === 'setvariable') { last = tok(p.WFInput, loop); vars.set(p.WFVariableName, last); }
      // Obtener diccionario de la entrada: un texto JSON se lee; si no es JSON, no sale nada (sin detener: así lo modela la prueba)
      else if (id === 'detect.dictionary') { let v = tok(p.WFInput, loop); if (typeof v === 'string') { try { v = JSON.parse(v); } catch (_) { v = null; } } last = v && typeof v === 'object' && !Array.isArray(v) ? v : null; }
      else if (id === 'appendvariable') { const v = tok(p.WFInput, loop), cur = vars.get(p.WFVariableName) || []; vars.set(p.WFVariableName, cur.concat(v == null ? [] : v)); last = vars.get(p.WFVariableName); }
      else if (id === 'text.combine') { if (p.WFTextSeparator !== 'New Lines') throw new Error('separador no previsto'); const v = tok(p.text, loop); last = (Array.isArray(v) ? v : [v]).map(str).join('\n'); }
      else if (id === 'setclipboard') { st.clip = str(tok(p.WFInput, loop)); st.copies++; last = st.clip; }
      else if (id === 'conditional' && p.WFControlFlowMode === 0) {
        const G = p.GroupingIdentifier, same = j => short(A[j]) === 'conditional' && A[j].WFWorkflowActionParameters.GroupingIdentifier === G;
        let e = -1, j = i + 1; for (; j < to && !(same(j) && A[j].WFWorkflowActionParameters.WFControlFlowMode === 2); j++) if (same(j) && A[j].WFWorkflowActionParameters.WFControlFlowMode === 1) e = j;
        if (j >= to) throw new Error('Si sin fin');
        const v = val(p.WFInput.Variable.Value, loop);
        const yes = p.WFCondition === HAS_VALUE ? has(v) : p.WFCondition === NO_VALUE ? !has(v) : p.WFCondition === GT ? (has(v) && +v > +p.WFNumberValue) : (() => { throw new Error('condición no prevista: ' + p.WFCondition); })();
        last = yes ? exec(i + 1, e >= 0 ? e : j, loop) : (e >= 0 ? exec(e + 1, j, loop) : undefined);
        outs.set(A[j].WFWorkflowActionParameters.UUID, last); i = j; continue;
      }
      else if (id === 'repeat.each' && p.WFControlFlowMode === 0) {
        let j = i + 1; while (j < to && !(short(A[j]) === 'repeat.each' && A[j].WFWorkflowActionParameters.GroupingIdentifier === p.GroupingIdentifier)) j++;
        if (j >= to) throw new Error('Repetir sin fin');
        const list = tok(p.WFInput, loop), res = [];
        (Array.isArray(list) ? list : [list]).forEach(it => { const r = exec(i + 1, j, { item: it }); if (r !== undefined) res.push(r); });
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
// HP_EXAMPLE en index.html es EXACTAMENTE lo que el atajo copia con estos datos y sin entrada (lo comprueba --check).
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
  // ruido que NO debe salir: otro tipo, y una muestra de hace más de 7 días (sí sale si la app pide más días: el historial)
  'Heart Rate': [q(D2, '08:00', 71)],
};
HEALTH.Steps.push(q('2026-09-10', '10:00', 9999, 'count'));
const cfgOf = o => JSON.stringify(Object.assign({ id: 'demo' }, BLOCKS.reduce((m, b) => (m[b.key] = DEFAULT_DAYS, m), {}), o || {}));

// el ejemplo es el uso real: la app manda la lista (7 días de todo) y el atajo la recibe (`ok in`)
function sample(wf) { return run(wf, HEALTH, { now: NOW, input: cfgOf() }); }

// ───────────────────────── principal ─────────────────────────
function main() {
  const arg = process.argv[2] || '', wf = build(), xml = toXML(wf), back = parseXML(xml);
  const fail = m => { console.error('FALLA: ' + m); process.exit(1); };
  if (JSON.stringify(back) !== JSON.stringify(wf)) fail('el XML no se lee de vuelta igual');
  const errs = validate(back); if (errs.length) fail('plist inválido\n  ' + errs.join('\n  '));
  const s = sample(back); if (s.stoppedAt) fail('el atajo se detiene: ' + s.stoppedAt);
  const lines = s.clip.split('\n'), keysOf = r => new Set((r.clip || '').split('\n').slice(1).filter(l => !/^ok /.test(l)).map(l => l.split(' ')[0])), oks = r => new Set((r.clip || '').split('\n').filter(l => /^ok /.test(l)).map(l => l.slice(3)));
  if (lines.slice(0, 4).join('|') !== 'trk2|ok in|ok id demo|ok cfg' || lines[lines.length - 1] !== 'ok end') fail('el texto no empieza con trk2 · ok in · ok id · ok cfg o no termina en ok end');
  { const d = run(back, HEALTH, { now: NOW }); if (d.stoppedAt || d.clip.split('\n').slice(0, 3).join('|') !== 'trk2|ok id |ok cfg') fail('sin entrada debe correr con 7 días de todo y sin la marca ok in: ' + JSON.stringify(d.clip.slice(0, 40))); }
  if (BLOCKS.some(b => !keysOf(s).has(b.key) || !oks(s).has(b.key))) fail('falta un dato o su marca: ' + [...keysOf(s)].join(' ') + ' / ' + [...oks(s)].join(' '));
  if (/9999|\b71\b/.test(s.clip)) fail('se coló una muestra vieja o de otro tipo');
  if (s.copies !== BLOCKS.length + 3) fail('copias al portapapeles: ' + s.copies + ' (encabezado, entrada, una por dato y el final)');
  BLOCKS.forEach((b, i) => {
    const h = Object.assign({}, HEALTH); delete h[b.type];
    // sin entrada y sin ese dato: el atajo se detiene AHÍ (como en el iPhone), y todo lo anterior ya está copiado con su marca
    const r = run(back, h, { now: NOW }), kr = keysOf(r), or = oks(r);
    if (!/No Samples Found/.test(r.stoppedAt || '')) fail('sin datos de ' + b.type + ' el atajo no se detuvo como en el iPhone');
    if ((r.clip || '').split('\n')[0] !== 'trk2') fail('si se detiene en ' + b.type + ' el portapapeles no dice trk2');
    BLOCKS.slice(0, i).forEach(x => { if (!kr.has(x.key) || !or.has(x.key)) fail('si se detiene en ' + b.type + ' se pierde ' + x.key); });
    if (or.has(b.key) || BLOCKS.slice(i + 1).some(x => or.has(x.key))) fail('si se detiene en ' + b.type + ' quedó una marca de algo que no se leyó');
    if (or.has('in')) fail('sin entrada no debe salir la marca ok in');
    // la app pide no buscarlo (0): llega al final, con todo lo demás y sin renglones en blanco
    const e = run(back, h, { now: NOW, input: cfgOf({ [b.key]: 0 }) }), ke = keysOf(e), oe = oks(e);
    if (e.stoppedAt) fail('pidiendo saltar ' + b.key + ' el atajo se detiene: ' + e.stoppedAt);
    if (ke.has(b.key) || oe.has(b.key) || BLOCKS.some(x => x !== b && (!ke.has(x.key) || !oe.has(x.key)))) fail('pidiendo saltar ' + b.key + ' no llega lo demás: ' + [...ke].join(' '));
    if (/\n\n|\n$/.test(e.clip)) fail('pidiendo saltar ' + b.key + ' queda un renglón en blanco');
    if (!oe.has('in') || e.clip.split('\n').slice(0, 4).join() !== 'trk2,ok in,ok id demo,ok cfg') fail('con entrada el texto debe empezar trk2 · ok in · ok id · ok cfg');
    // aunque se detenga en el PRIMER dato, la app ya ve ok cfg (se copia antes de buscar)
    if (i === 0) { const f0 = run(back, h, { now: NOW, input: cfgOf() }); if (!/No Samples Found/.test(f0.stoppedAt || '') || f0.clip.split('\n').indexOf('ok cfg') < 0) fail('si se detiene en el primer dato, ok cfg no quedó copiado'); }
  });
  { const r = run(back, HEALTH, { now: NOW, input: cfgOf({ steps: 20 }) }); if (r.stoppedAt || !/ 9999$/m.test(r.clip)) fail('pidiendo 20 días de pasos no llega la muestra de hace 13 días: ' + (r.stoppedAt || '')); }
  { const all0 = run(back, {}, { now: NOW, input: cfgOf(BLOCKS.reduce((m, b) => (m[b.key] = 0, m), {})) }); if (all0.stoppedAt || all0.clip !== 'trk2\nok in\nok id demo\nok cfg\nok end') fail('pidiendo nada, el texto debe ser trk2 · ok in · ok id · ok cfg · ok end: ' + JSON.stringify(all0.clip)); }
  { const bad = run(back, HEALTH, { now: NOW, input: 'esto no es json' }); if (bad.stoppedAt || bad.clip !== 'trk2\nok in\nok id \nok cfg\nok end') fail('una entrada que no es JSON debe llegar al final sin buscar nada: ' + JSON.stringify(bad.clip)); }
  if (BLOCKS[BLOCKS.length - 1].key !== 'hrv') fail('HRV debe ir al final');
  if (arg === '--sample') { process.stdout.write(s.clip + '\n'); return; }
  const index = path.join(__dirname, '..', '..', 'index.html');
  const src = () => fs.existsSync(index) ? fs.readFileSync(index, 'utf8') : '';
  const example = () => { const m = /const HP_EXAMPLE='((?:[^'\\]|\\.)*)'/.exec(src()); return m ? m[1].replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\\\/g, '\\') : null; };
  const order = () => { const m = /const HP_ORDER=\[([^\]]*)\]/.exec(src()); return m ? m[1].replace(/['"\s]/g, '') : null; };
  if (arg === '--check') {
    if (!fs.existsSync(OUT)) fail('no existe ' + path.basename(OUT) + ' (corre build.cjs sin argumentos)');
    if (fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') !== xml) fail(path.basename(OUT) + ' no es el que build.cjs genera hoy (vuelve a generarlo y a firmarlo)');
    const ex = example(); if (ex == null) fail('no encontré HP_EXAMPLE en index.html');
    if (ex !== s.clip) fail('HP_EXAMPLE de index.html no es lo que el atajo copia. Debe ser:\n' + JSON.stringify(s.clip));
    if (order() !== BLOCKS.map(b => b.key).join(',')) fail('HP_ORDER de index.html (' + order() + ') no es el orden del atajo (' + BLOCKS.map(b => b.key).join(',') + ')');
    console.log('atajo OK · ' + back.WFWorkflowActions.length + ' acciones · ' + BLOCKS.length + ' tipos · HP_EXAMPLE y HP_ORDER coinciden'); return;
  }
  fs.writeFileSync(OUT, xml);
  console.log('escrito: ' + OUT + ' · ' + Buffer.byteLength(xml) + ' bytes · ' + back.WFWorkflowActions.length + ' acciones');
  console.log('tipos: ' + BLOCKS.map(b => b.key + '=' + JSON.stringify(b.type) + (b.soft ? ' (sin confirmar)' : '')).join(' · '));
  console.log('validación: OK (UUID, referencias, Si/Si no/Repetir, entrada, filtros, ida y vuelta del XML, un dato vacío detiene como en el iPhone y lo anterior se queda, pedir 0 lo salta, pedir más días trae más)');
  console.log('--- lo que copiaría con la Salud de ejemplo y la lista de la app (7 días de todo) ---\n' + s.clip);
  const ex = example(); if (ex != null && ex !== s.clip) console.log('--- AVISO: HP_EXAMPLE de index.html es distinto; debe ser ---\n' + JSON.stringify(s.clip));
}
if (require.main === module) main();
module.exports = { build, validate, run, sample, BLOCKS, NAME, OUT, HEALTH, NOW, cfgOf, DEFAULT_CFG };
