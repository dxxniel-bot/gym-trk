// gym//TRK · estudio · PROPUESTAS (tools/studio/proposals.js) → window.TRK_PROPOSALS (CONTRACT.md §5)
// Cada propuesta = hoy | A | B | C aplicada a la app REAL dentro del frame. Reglas de este archivo:
//   · cada selector empieza con su alcance html[data-v-<id>="<k>"] (studio.js concatena TODO en <style id="trk-prop">);
//   · solo var(--x) de :root de index.html o declaradas en `tokens` de la misma opción; sin colores literales;
//   · el prefijo html[attr] suma (0,1,1) a la especificidad: gana a las reglas de la app sin !important salvo contra
//     un style="" en línea (se dice dónde);
//   · dom(W) idempotente: solo clases trkp-*, atributos data-trkp-*, nodos con data-trk-patch y texto de etiquetas de
//     SISTEMA con el original en data-trk-orig (nunca etiquetas del dueño, B-12);
//   · shader(canvas,W) → stop(): WebGL1, highp con respaldo mediump, pérdida de contexto, dpr ≤ 2, encuadre cover.
// Selectores verificados contra index.html (v260). Nada personal: tools/ es público.
(function(){ 'use strict';

  // ---------- ayudas de DOM (compartidas por los dom(W)) ----------
  const ORIG = 'data-trk-orig';
  // primer nodo de texto con contenido; si fn lo cambia, guarda en data-trk-orig el texto original DE ESE NODO y su
  // índice en data-trkp-tn (studio.js restaura solo ese nodo: los hijos del elemento, p. ej. un ícono, no se pierden)
  function patchText(el, fn){
    if(!el || el.hasAttribute(ORIG)) return;
    const nodes = el.childNodes;
    for(let i = 0; i < nodes.length; i++){ const n = nodes[i];
      if(n.nodeType !== 3 || !n.nodeValue.trim()) continue;
      const v = n.nodeValue, nv = fn(v);
      if(typeof nv === 'string' && nv !== v){ el.setAttribute(ORIG, v); el.setAttribute('data-trkp-tn', String(i)); n.nodeValue = nv; }
      return; }
  }

  // ---------- íconos TRK (brand-lab §5: rejilla 24, trazo 1.6, remates cuadrados, currentColor) ----------
  // v267 · la nav es de texto (sin .ic ni NAVIC) · v269 · la cámara es la de video con REC (propuesta 23): el set ya solo toca [compartir]
  const TRK = {
    share: '<path d="M9 9H5v11h14V9h-4M12 15V3M8 7l4-4 4 4"/>'
  };
  // trazo que no escala: 1.6 px reales a cualquier tamaño (16 en la cabecera del ejercicio)
  const trkSvg = (k, px) => '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '" aria-hidden="true" fill="none" stroke="currentColor"'
    + ' stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter">' + TRK[k].replace(/\/>/g, ' vector-effect="non-scaling-stroke"/>') + '</svg>';
  function patchIcons(W){ const d = W.document;
    d.querySelectorAll('.exshr').forEach(b => {
      if(b.querySelector('[data-trk-patch]')) return;
      const old = b.querySelector('svg'); if(!old) return;
      const s = d.createElement('span'); s.className = 'trkp-ic'; s.setAttribute('data-trk-patch', ''); s.innerHTML = trkSvg('share', 16);
      old.classList.add('trkp-old'); b.appendChild(s); });
  }
  // v269 · la cámara de la serie grabada ya no es parte de esta propuesta: se decidió aparte (propuesta 23 · camera)

  // v267 · nav (1), primario (2) y secundarios (9) se hornearon en index.html: su CSS de propuesta y sus ayudas se borraron

  const P = (id, k) => 'html[data-v-' + id + '="' + k + '"]';

  // ---------- v276 · laboratorio de macros (propuestas 25 y 26) ----------
  // Cada opción pinta su versión con la función DE LA APP, W.macroVizHTML(clave, t, g, {rings}), con los números del día que
  // se está viendo (tuyos, demo o archivo): en el panel abierto de macros en lugar del carrusel, y en la tarjeta de compartir
  // el panel en lugar de la versión guardada. Elegir NO escribe db.settings.macroViz: la elección viaja en la hoja TRK-PICK
  // (25macroprog=barras) y al hornearse esa versión queda como la que abre el carrusel y sale al compartir. El CSS de estas
  // opciones solo esconde el carrusel en el estudio (no es para hornear). La k es la pestaña del carrusel; MV_KEY, la clave
  // de MACRO_VIZ en index.html.
  const MV_KEY = { aros:'rings', barras:'bars', medidor:'meter', reparto:'split', tabla:'table', dona:'donut' };
  // los aros: en el panel, los de la lámina "aros" del carrusel (macroRing de la app, con su toque ringtog); en la tarjeta,
  // los suyos si ya los pinta y si no, las mismas celdas que arma renderShareMacros (ringHTML + macroStatus de la app)
  function mvRings(W, t, g, share){
    const r = W.document.querySelector(share ? '.sharecard .shviz:not([data-trk-patch]) .rings' : '#view .mvslide[data-v="rings"] .rings');
    if(r) return r.innerHTML; if(!share) return '';
    const cell = (m, l) => { const v = +t[m] || 0, gl = +g[m] || 0;
      return '<div class="cell ' + W.macroStatus(v, gl) + '">' + W.ringHTML(gl ? v / gl * 100 : 0, '<div class="num">' + Math.round(v) + '</div>')
        + '<div class="cap">' + l + '</div><div class="sub">/ ' + gl + ' g</div></div>'; };
    return cell('protein', 'protein') + cell('carbs', 'carbs') + cell('fat', 'fat'); }
  // dom(W) de una opción: un nodo data-trk-patch antes del carrusel (#view .mvz) y otro antes de la versión de la tarjeta
  // (.sharecard .shviz); idempotente (uno por propuesta y lugar). Con 25 y 26 elegidas salen las dos, 25 arriba
  function mvPatch(pid, k){ return W => { const d = W.document, vk = MV_KEY[k];
    if(!vk || typeof W.macroVizHTML !== 'function') return;
    const t = W.macroTotals().t, g = W.goalsFor(W.curDate());
    const put = (anchor, cls, share) => { if(!anchor || anchor.parentNode.querySelector(':scope > [data-trkp-mv="' + pid + '"]')) return;
      const n = d.createElement('div'); n.className = cls; n.setAttribute('data-trk-patch', ''); n.setAttribute('data-trkp-mv', pid);
      n.innerHTML = W.macroVizHTML(vk, t, g, { rings: mvRings(W, t, g, share), share }); anchor.parentNode.insertBefore(n, anchor); };
    put(d.querySelector('#view .mvz'), 'trkp-mv', false);
    put(d.querySelector('.sharecard .shviz:not([data-trk-patch])'), 'shviz trkp-mv', true); }; }
  const mvCSS = (pid, k) => { const s = P(pid, k); return `
${s} #view .mvz, ${s} #view .mvtabs, ${s} .sharecard .shviz:not([data-trk-patch]){display:none;}
${s} .trkp-mv + .trkp-mv{margin-top:var(--s5);}`; };
  const mvOpt = (pid, k, label, note) => ({ k, label, note, css: mvCSS(pid, k), dom: mvPatch(pid, k) });

  window.TRK_PROPOSALS = [

    // ======================= G0 · los 7 del brand-lab en la app real =======================
    { id:'nav', n:1, group:'G0', title:'nav', rule:'B-05 · B-11 · BRAND §4 nav', src:'brand-lab §1 · BRAND §9',
      question:'Implementado en v267: pestañas de solo texto, la activa con un > que parpadea y el nombre fijo ("hoy" ya es eso). Ninguna de las tres del lab (A cápsula invertida, B [ ], C barra ancha): elegiste una cuarta.',
      status:'shipped', decided:{ pick:'D', date:'2026-09-23', quote:'> parpadea y el nombre fijo' }, shipped:'v267',
      scenarios:['home', 'nav:progress', 'nav:macros'],
      options:[
        { k:'hoy', label:'hoy · texto + > que parpadea (v267)' },
        { k:'D', label:'texto + > que parpadea', note:'horneado en index.html en v267 (sin íconos, 44 de alto, cápsula de vidrio a --r-float 8, sin animar el layout; reduced-motion = > fijo); su CSS de propuesta y el de A/B/C se borraron' }
      ] },

    { id:'primary', n:2, group:'G0', title:'primary', rule:'B-06 · B-05 · BRAND §4 primario', src:'brand-lab §2 · BRAND §9',
      question:'Implementado en v267: bloque invertido de 44 px, radio 4, 12/800; presionado = negro con contorno ("hoy" ya es eso).',
      status:'shipped', decided:{ pick:'A', date:'2026-09-21', quote:'corchetes para cosas puntuales y btns para principales, pero el estilo de los principales … más al estilo gymTRK' }, shipped:'v267',
      scenarios:['home', 'workout', 'live:workout', 'm:food', 'm:weight', 'landing'],
      options:[
        { k:'hoy', label:'hoy · bloque invertido de 44 (v267)' },
        { k:'A', label:'bloque invertido', note:'horneado en index.html en v267 a 44 px (antes 48) y radio 4 por "tosco, todo muy gordo" (23-sep); su CSS de propuesta y el de B/C se borraron' }
      ] },

    { id:'float', n:3, group:'G0', title:'float radius', rule:'B-05 · BRAND §4', src:'brand-lab §3',
      question:'Implementado en v262 con 12 px; v267 lo bajó a 8 junto con las esquinas de 4 (propuesta 18). "hoy" ya es eso.', status:'shipped', decided:{ pick:'B', date:'2026-09-22', quote:'TRK-PICK v1 · 1 · base v261 · datos demo · 3float=B' }, shipped:'v262',
      scenarios:['m:food', 'm:sleep', 'm:metric', 'macros', 'home'],
      options:[ { k:'hoy', label:'hoy · 8 px (v267; 12 en v262)' }, { k:'B', label:'un solo radio flotante', note:'horneado en index.html en v262 (12 px) y bajado a 8 en v267; su CSS de propuesta se borró' } ] },
    { id:'ring', n:4, group:'G0', title:'ring panel', rule:'B-05 · B-07 · BRAND §4 anillo', src:'brand-lab §4',
      question:'Implementado en v262: tu elección ya es el look de la app ("hoy").', status:'shipped', decided:{ pick:'C', date:'2026-09-22', quote:'TRK-PICK v1 · 1 · base v261 · datos demo · 4ring=C' }, shipped:'v262',
      scenarios:['macros', 'macros:open', 'share:food'],
      options:[ { k:'hoy', label:'hoy · vidrio sutil (v262)' }, { k:'C', label:'vidrio sutil', note:'horneado en index.html en v262; su CSS de propuesta se borró' } ] },
    { id:'icons', n:5, group:'G0', title:'TRK icons', rule:'B-08 · BRAND §4 íconos', src:'brand-lab §5',
      question:'¿Cambiamos los íconos por el set TRK (rejilla 24, trazo 1.6, remates cuadrados)? Aplica a [compartir] del ejercicio (y al escáner). La marca de la serie grabada ya se decidió en v269 (cámara de video con REC, propuesta 23) y la nav no lleva íconos desde v267.',
      status:'open', decided:null, shipped:null,
      scenarios:['workout', 'live:workout', 'popup:exshare'],
      options:[
        { k:'hoy', label:'hoy · trazo redondo' },
        { k:'A', label:'set TRK', note:'Compartir del ejercicio; la nav es de texto desde v267 y la cámara es la de v269.',
          css: `
${P('icons','A')} .exshr svg.trkp-old{display:none;}
${P('icons','A')} .exshr .trkp-ic{display:inline-flex;}`,
          dom: patchIcons }
      ] },

    { id:'boot', n:6, group:'G0', title:'boot shader', rule:'BRAND §4 arranque · B-09', src:'brand-lab §6',
      question:'Implementado en v262: tu elección ya es el look de la app ("hoy"). Desde v268 queda detrás del "loading gym tracker" que sale en cada apertura, atenuado a --op-dim; la versión corta (sesión viva o abriste hace <30 min) va sin shader.', status:'shipped', decided:{ pick:'C', date:'2026-09-22', quote:'TRK-PICK v1 · 1 · base v261 · datos demo · 6boot=C' }, shipped:'v262',
      scenarios:['boot', 'boot:short'],
      options:[ { k:'hoy', label:'hoy · matriz de fósforo detrás del arranque (v262 · v268)' }, { k:'C', label:'matriz de fósforo', note:'horneado en index.html en v262; su CSS de propuesta se borró. v268: opacidad --op-dim (antes .5) detrás de las líneas del arranque' } ] },
    { id:'field', n:7, group:'G0', title:'field edge', rule:'B-11 · WCAG 1.4.11', src:'brand-lab §7',
      question:'Implementado en v262: tu elección ya es el look de la app ("hoy").', status:'shipped', decided:{ pick:'A', date:'2026-09-22', quote:'TRK-PICK v1 · 1 · base v261 · datos demo · 7field=A' }, shipped:'v262',
      scenarios:['workout', 'live:workout', 'histedit', 'm:session'],
      options:[ { k:'hoy', label:'hoy · 1 px --o40 solo en editables (v262)' }, { k:'A', label:'1 px --o40 solo en editables', note:'horneado en index.html en v262; su CSS de propuesta se borró' } ] },
    { id:'cards', n:8, group:'G3', title:'cards', rule:'B-05 · B-01 · B-10', src:'plan · G3b',
      question:'Las tarjetas con fondo (4 px desde v267) salen del contenido. ¿Cómo se agrupa: //TÍTULO sobre una regla (plano, como terminal) o caja de 2 px?',
      status:'open', decided:null, shipped:null,
      scenarios:['progress', 'history', 'macros', 'm:food', 'home'],
      options:[
        { k:'hoy', label:'hoy · tarjetas de 4 px con fondo' },
        { k:'A', label:'//TÍTULO + regla', note:'Sin fondo ni caja; una regla arriba y el rótulo con //.',
          css: `
${P('cards','A')} .card, ${P('cards','A')} .grp, ${P('cards','A')} .ptile, ${P('cards','A')} .pfeat, ${P('cards','A')} .pthrow, ${P('cards','A')} .hcal{background:none; border:0; border-top:var(--bw-rule) solid var(--line); border-radius:0; padding-left:0; padding-right:0;}
${P('cards','A')} #app .card.u-px16{padding-left:0; padding-right:0;}
${P('cards','A')} .plbl::before, ${P('cards','A')} .pthl::before, ${P('cards','A')} .hcalh .hct::before{content:'//';}` },
        { k:'B', label:'caja de 2 px', note:'Sin fondo; contorno fino y 2 px de radio.',
          css: `
${P('cards','B')} .card, ${P('cards','B')} .grp, ${P('cards','B')} .ptile, ${P('cards','B')} .pfeat, ${P('cards','B')} .pthrow, ${P('cards','B')} .hcal{background:none; border:var(--bw-sep) solid var(--o20); border-radius:var(--r-sm);}` }
      ] },

    { id:'secondary', n:9, group:'G3', title:'secondary', rule:'B-06 · BRAND §3 corchetes', src:'plan · G3b',
      question:'Implementado en v267: las acciones puntuales son [verbo] de texto (rest day, skip day, abort, ↩, cerrar), sin caja; el principal sigue siendo botón ("hoy" ya es eso).',
      status:'shipped', decided:{ pick:'A', date:'2026-09-21', quote:'corchetes para cosas puntuales y btns para principales' }, shipped:'v267',
      scenarios:['home', 'workout', 'live:workout', 'settings', 'm:food'],
      options:[
        { k:'hoy', label:'hoy · [verbo] sin caja (v267)' },
        { k:'A', label:'[verbo]', note:'horneado en index.html en v267 (corchetes por CSS en --o40, texto --o60, toque de 44; las etiquetas ya no traen sus propios corchetes); su CSS de propuesta se borró' }
      ] },

    { id:'green', n:10, group:'G3', title:'color', rule:'B-07', src:'plan · G3c',
      question:'Implementado en v262: tu elección ya es el look de la app ("hoy").', status:'shipped', decided:{ pick:'A', date:'2026-09-22', quote:'TRK-PICK v1 · 1 · base v261 · datos demo · 10green=A' }, shipped:'v262',
      scenarios:['home', 'progress', 'macros', 'macros:open', 'm:muscle', 'm:metric'],
      options:[ { k:'hoy', label:'hoy · verde solo en glifo o número (v262)' }, { k:'A', label:'verde solo en glifo o número', note:'horneado en index.html en v262; su CSS de propuesta se borró' } ] },
    { id:'back', n:11, group:'G3', title:'back', rule:'B-06 · BRAND §3 corchetes · GLYPHS', src:'plan · G3c',
      question:'Desde v267 es [‹ back], texto sin caja. ¿Dice a dónde vuelve: [‹ gym]?',
      status:'open', decided:null, shipped:null,
      scenarios:['settings', 'history', 'splitedit', 'workout', 'histedit', 'share:session'],
      options:[
        { k:'hoy', label:'hoy · [‹ back] (v267)' },
        { k:'A', label:'[‹ gym]', note:'La acción "leave" siempre vuelve a gym (go(\'home\')), así que el origen es fijo.',
          css: `
${P('back','A')} .status .back{display:inline-flex; align-items:center; min-height:44px; padding:0 var(--s2); margin-left:calc(-1 * var(--s2)); border:0; border-radius:0; color:var(--o60); font-weight:700;}
${P('back','A')} .status .back::before{content:'[';}
${P('back','A')} .status .back::after{content:']';}`,
          dom: W => W.document.querySelectorAll('.status .back').forEach(el => patchText(el, v => v.replace(/^[^a-z]*back/, '‹ gym'))) }
      ] },

    { id:'recovery', n:12, group:'G3', title:'recovery', rule:'BRAND §4 puntuaciones · B-07 · B-10', src:'plan · G3c',
      question:'Implementado en v262: tu elección ya es el look de la app ("hoy").', status:'shipped', decided:{ pick:'A', date:'2026-09-21', quote:'conserva pero hazlo lo más reduccionista posible' }, shipped:'v262',
      scenarios:['home', 'm:ready'],
      options:[ { k:'hoy', label:'hoy · recovery ~43 (v262)' }, { k:'A', label:'recovery ~43', note:'horneado en index.html en v262; su CSS de propuesta se borró' } ] },
    { id:'retention', n:13, group:'G3', title:'retention', rule:'BRAND §4 puntuaciones · B-10 · B-07', src:'plan · G3c',
      question:'Implementado en v262: tu elección ya es el look de la app ("hoy").', status:'shipped', decided:{ pick:'B', date:'2026-09-22', quote:'TRK-PICK v1 · 1 · base v261 · datos demo · 13retention=B' }, shipped:'v262',
      scenarios:['macros:high', 'macros:open'],
      options:[ { k:'hoy', label:'hoy · diagnóstico, solo si se sale de rango (v262)' }, { k:'B', label:'diagnóstico, solo si se sale de rango', note:'horneado en index.html en v262; su CSS de propuesta se borró' } ] },
    { id:'wordmark', n:14, group:'G3', title:'wordmark', rule:'BRAND §3 marca', src:'plan · G3c',
      question:'Implementado en v262: tu elección ya es el look de la app ("hoy").', status:'shipped', decided:{ pick:'A', date:'2026-09-22', quote:'TRK-PICK v1 · 1 · base v261 · datos demo · 14wordmark=A' }, shipped:'v262',
      scenarios:['boot', 'landing', 'login', 'onboard', 'share:session', 'share:food'],
      options:[ { k:'hoy', label:'hoy · gym//TRK única (v262)' }, { k:'A', label:'gym//TRK única', note:'horneado en index.html en v262; su CSS de propuesta se borró' } ] },
    { id:'lh', n:15, group:'G3', title:'line-height snap', rule:'B-04 · tokens --lh-*', src:'plan · T (v260) · pendiente',
      question:'Quedan interlineados sueltos (1.05, 1.1, 1.25, 1.3, 1.35, 1.5, 1.55, 1.8). ¿Los llevamos a la escala (1 · 1.2 · 1.4 · 1.6)?',
      status:'open', decided:null, shipped:null,
      scenarios:['progress', 'm:metric', 'm:food', 'macros', 'settings', 'live:workout', 'share:session', 'share:food', 'popup:exshare', 'select', 'gloss', 'agenda'],
      options:[
        { k:'hoy', label:'hoy · 12 valores sueltos' },
        { k:'A', label:'a la escala', note:'Cada uno al más cercano de su rol; los de caja en px (44/36/11) no se tocan.',
          css: `
${P('lh','A')} .mdval{line-height:var(--lh-tight);}
${P('lh','A')} .tselo.hs, ${P('lh','A')} .exov{line-height:var(--lh-ui);}
${P('lh','A')} .sitem, ${P('lh','A')} textarea.ta, ${P('lh','A')} .ag-blk .bt, ${P('lh','A')} .ag-blk .bs, ${P('lh','A')} .gloss{line-height:var(--lh-read);}
${P('lh','A')} .sxs, ${P('lh','A')} .fa-empty, ${P('lh','A')} .empty{line-height:var(--lh-share);}` }
      ] },

    { id:'opacity', n:16, group:'G3', title:'opacity snap', rule:'B-04 · B-11 · tokens --op-*', src:'plan · T (v260) · pendiente',
      question:'Quedan opacidades de estado sueltas (.3, .5, .6, .75, .85). ¿Las llevamos a los tokens de estado (presionado .7, deshabilitado .4, sugerido .45, atenuado .28)?',
      status:'open', decided:null, shipped:null,
      scenarios:['progress', 'splitedit', 'm:food', 'm:goals', 'm:profile'],
      options:[
        { k:'hoy', label:'hoy · literales' },
        { k:'A', label:'a los tokens de estado', note:'No se tocan las marcas (las de 10 y 20 σ de v272 son neutras: --o40 sin opacidad suelta, ya no hay MRV .7; relleno de mantener .22; el shader del arranque ya usa --op-dim desde v268) ni el subtexto de la opción elegida. La opción sugerida del perfil (.75) pasa a .7, no a .45: bajo --o40 no se lee. :active y arrastre solo se ven al tocar.',
          css: `
${P('opacity','A')} .ptile.tap:active, ${P('opacity','A')} .ag-mk.supp:active{opacity:var(--op-press);}
${P('opacity','A')} .ex.dragsrc, ${P('opacity','A')} .mgroup.dragsrc{opacity:var(--op-dim);}
${P('opacity','A')} .pftog.sug .t.on{opacity:var(--op-press);}` }
      ] },

    // ---- decididas (BRAND §9): no se preguntan; se muestran "decidido · ver cómo queda" ----
    { id:'english', n:17, group:'G3', title:'system labels', rule:'BRAND §3 idioma · B-12', src:'BRAND §9',
      question:'Implementado en v262: tu elección ya es el look de la app ("hoy").', status:'shipped', decided:{ pick:'A', date:'2026-09-21', quote:'Etiquetas en inglés' }, shipped:'v262',
      scenarios:['progress', 'home', 'macros', 'm:muscle', 'm:metric', 'settings'],
      options:[ { k:'hoy', label:'hoy · inglés (v262)' }, { k:'A', label:'inglés', note:'horneado en index.html en v262; su CSS de propuesta se borró' } ] },
    { id:'corners', n:18, group:'G3', title:'content corners', rule:'B-05', src:'BRAND §9',
      question:'Implementado en v267: contenido afilado, todo control y tarjeta a 4, lo que flota a 8 ("hoy" ya es eso). Reemplaza la familia de v264 (control 12, tarjeta 16), que se sentía "exagerada".',
      status:'shipped', decided:{ pick:'4px', date:'2026-09-23', quote:'4 px, suave' }, shipped:'v267',
      scenarios:['home', 'progress', 'macros', 'workout', 'workout:fs', 'settings', 'm:food'],
      options:[
        { k:'hoy', label:'hoy · control y tarjeta 4, flotante 8 (v267)' },
        { k:'4px', label:'4 px, suave', note:'horneado en index.html en v267 (--r-ctl 12→4, --radius 16→4, --r-float 12→8); marcas 2, gráficas 4, reglas 0, píldora solo en barras finas. Sin CSS de propuesta.' }
      ] },

    { id:'keepring', n:19, group:'G3', title:'kcal ring', rule:'BRAND §4 anillo', src:'BRAND §9',
      question:'El anillo de kcal se queda, única gráfica circular (macros y compartir). Su panel se elige en la propuesta 4.',
      status:'decided', decided:{ pick:'hoy', date:'2026-09-21', quote:'dejarlo, pero que todo sea un mix cmdhacker/glass moderno' }, shipped:null,
      scenarios:['macros', 'share:food'],
      options:[ { k:'hoy', label:'se queda' } ] },

    // ---- v267 "terminal sobrio" (23-sep): decididas en la conversación y horneadas; sin CSS de propuesta ----
    { id:'type', n:20, group:'G3', title:'type scale', rule:'B-04 · TYP-1', src:'BRAND §9',
      question:'Implementado en v267: escala 10·12·14·20·28 y --t-field aparte, solo en lo editable (16 en v267, 14 desde v269: propuesta 21) ("hoy" ya es eso). Antes 10·12·18·24·34: "fuentes muy grandes para lo que son".',
      status:'shipped', decided:{ pick:'A', date:'2026-09-23', quote:'14 · 20, más compacto' }, shipped:'v267',
      scenarios:['home', 'progress', 'macros', 'm:metric', 'onboard', 'share:session'],
      options:[
        { k:'hoy', label:'hoy · 10·12·14·20·28 + campo 14 (v269)' },
        { k:'A', label:'14 · 20, más compacto', note:'horneado en index.html en v267 (--t-section 18→14, --t-display 24→20, --t-hero 34→28, --t-field 16 nuevo: con menos de 16 el iPhone hace zoom al enfocar)' }
      ] },
    { id:'fields', n:21, group:'G3', title:'fields', rule:'B-11 · WCAG 1.4.11 · BRAND §4', src:'BRAND §9',
      question:'Implementado en v267: la casilla es una caja fina (1 px --o40, sin relleno, radio 4) y con foco el borde sube a --fg. v269 (24-sep): la letra de campo baja a 14 en toda la app y las casillas del perfil a 36 de alto ("hoy" ya es eso).',
      status:'shipped', decided:{ pick:'A', date:'2026-09-23', quote:'el redondeado en general... de los botones, de las casillas de escribir, siento que es demasiado' }, shipped:'v267',
      scenarios:['onboard', 'login', 'm:food', 'm:weight', 'm:goals', 'm:sleep'],
      options:[
        { k:'hoy', label:'hoy · caja fina, letra 14, perfil a 36 (v269)' },
        { k:'A', label:'caja fina, sin relleno', note:'horneado en index.html en v267 en .field, #fa_q, textarea.ta, .mdcust, sueño, perfil del ejercicio, .msum-time, .gnmin y .senm. v269: --t-field 16→14 (maximum-scale=1: sin zoom de iOS) y .obi 44→36, por "el formulario para profile... está muy gordo, está muy alto, o sea, la casilla está muy grande, el texto adentro de las casillas también"; sin CSS de propuesta' }
      ] },
    { id:'toggles', n:22, group:'G3', title:'toggles', rule:'B-06 · BRAND §3 corchetes', src:'BRAND §9',
      question:'Implementado en v267: las opciones no llevan caja; la elegida va [entre corchetes] en --fg/700 y las demás en --o50. Los corchetes apagados guardan su lugar: nada se mueve al elegir ("hoy" ya es eso).',
      status:'shipped', decided:{ pick:'A', date:'2026-09-23', quote:'que sea una estética más sobria, que sea más terminal' }, shipped:'v267',
      scenarios:['onboard', 'm:goals', 'm:stacknew', 'm:exedit', 'm:profile'],
      options:[
        { k:'hoy', label:'hoy · [elegida] sin caja (v267)' },
        { k:'A', label:'[elegida]', note:'horneado en index.html en v267 (antes: cada opción elegida era un bloque blanco lleno, "tosco, todo muy gordo"); .toggles.wrap = 2 columnas a la izquierda; la sugerida del perfil lleva subrayado punteado. Sin CSS de propuesta' }
      ] },

    // ---- v269 (24-sep): encargos del dueño, horneados; sin CSS de propuesta ----
    { id:'camera', n:23, group:'G3', title:'camera', rule:'B-08 · BRAND §4 íconos · GLYPHS', src:'BRAND §9',
      question:'Implementado en v269: la serie que grabaste lleva una cámara de video con un punto rojo de REC, fija (sin parpadear), a la izquierda de la serie marcada; el 📷 salió ("hoy" ya es eso).',
      status:'shipped', decided:{ pick:'A', date:'2026-09-24', quote:'en lugar del emoji de la cámara de fotografía sea una cámara de video... una señalización roja como de que está grabando' }, shipped:'v269',
      scenarios:['exsh:cam', 'popup:exshare'],
      options:[
        { k:'hoy', label:'hoy · cámara de video + REC (v269)' },
        { k:'A', label:'cámara de video con REC', note:'horneado en index.html en v269 (CAM_SVG: trazo currentColor 1.4, punto REC en --bad, .camic de 16 px en el margen izquierdo de la serie .camon); el 📷 salió del CSS y de los textos (R-GLYE 4→2). Sin CSS de propuesta' }
      ] },
    { id:'progedit', n:24, group:'G3', title:'progress edit', rule:'B-06 · BRAND §4 · un solo primario', src:'BRAND §9',
      question:'Implementado en v269: //PROGRESS se acomoda como una pantalla de widgets: [edit] (o mantener 0.5 s una tile) → − en cada tile para quitar, ⠿ para arrastrar, [+ add] para volver a poner, [cancel] descarta y ✓ done confirma ("hoy" ya es eso). Antes: una hoja de activar y desactivar.',
      status:'shipped', decided:{ pick:'A', date:'2026-09-24', quote:'en configuración de activar y desactivar, preferiría que fueran otro de edit para poder que aparezca el signo de más para agregar, signo de menos en cada elemento para quitar... acomodar tu orden y ya después confirmar... como una screen de widgets' }, shipped:'v269',
      scenarios:['prog:edit', 'm:progcfg', 'progress'],
      options:[
        { k:'hoy', label:'hoy · modo widgets (v269)' },
        { k:'A', label:'modo edit tipo widgets', note:'horneado en index.html en v269 (db.settings.progLayout {order, hidden}, viaja con respaldos y sync; hereda una vez la config vieja del teléfono). En edición la nav se oculta; − (.pdel) arriba a la izquierda con toque de 44, ⠿ (.pgrip) arriba a la derecha; tocar ⠿ sin mover abre [mover antes] [mover después] [quitar]; barra fija .pedbar con ✓ done como único primario. Sin CSS de propuesta' }
      ] },

    // ---- v276 (24-sep): laboratorio de macros — abiertas; cada opción con la función de la app y los números de tu día ----
    { id:'macroprog', n:25, group:'V276', title:'macros · progreso', rule:'BRAND §4 anillo y gráficas · B-07', src:'encargo 24-sep · v276',
      question:'¿Cómo ves el avance de cada macro contra su meta? Desde v276 el panel abierto es un carrusel (desliza izquierda-derecha: aros · barras · medidor · reparto · tabla). Aquí cada opción ocupa el lugar del carrusel y de la tarjeta de compartir el panel, con tus números; la que elijas será con la que abre el carrusel y la que sale al compartir (las demás siguen a un deslizamiento).',
      status:'open', decided:null, shipped:null,
      scenarios:['macros:open', 'share:macros'],
      options:[
        { k:'hoy', label:'hoy · el carrusel (abre en tu última lámina; aros si nunca deslizaste)' },
        mvOpt('macroprog', 'aros', 'radar + 3 anillos', 'la de antes de v276: el radar del día (7 ejes contra la meta) y un anillo por macro (toca uno: lo que queda); con [ver %] en %. Al hornear: macroViz = rings'),
        mvOpt('macroprog', 'barras', 'una barra por macro con su meta', 'protein · barra · 142 / 180 g (o 79% con [ver %]); pasar la meta más de 5 % pinta la barra y el número en --bad. Al hornear: macroViz = bars'),
        mvOpt('macroprog', 'medidor', 'medidor de terminal', 'el de la búsqueda y el OCR, de 12 celdas por macro con octavos de bloque y su %, y 153/150 g a la derecha; sin color. Al hornear: macroViz = meter')
      ] },
    { id:'macrodist', n:26, group:'V276', title:'macros · distribución', rule:'BRAND §4 anillo y gráficas · B-07', src:'encargo 24-sep · v276',
      question:'¿Cómo ves de dónde salen tus kcal (P·4 C·4 F·9) contra la distribución de tu meta? Cada opción ocupa el lugar del carrusel y de la tarjeta de compartir el panel, con tus números; la que elijas será con la que abre el carrusel y la que sale al compartir.',
      status:'open', decided:null, shipped:null,
      scenarios:['macros:open', 'share:macros'],
      options:[
        { k:'hoy', label:'hoy · el carrusel (abre en tu última lámina; aros si nunca deslizaste)' },
        mvOpt('macrodist', 'reparto', 'barra apilada hoy contra la meta', 'hoy en una barra de 10 y la meta en una fina debajo, en escala de opacidad (P --fill · C --o60 · F --o30); leyenda P 28% · meta 25 y "% de las kcal · P·4 C·4 F·9"; los tres enteros suman 100. Al hornear: macroViz = split'),
        mvOpt('macrodist', 'tabla', 'tabla hoy / meta / %', 'kcal, protein, carbs y fat en filas; el % de la meta en --bad si pasa de 105 %. Al hornear: macroViz = table'),
        mvOpt('macrodist', 'dona', 'dona por kcal', 'arcos P · C · F (trazo 1.8) con su leyenda y la meta al lado. Es la única que no está en el carrusel: BRAND §4 deja el anillo de kcal como única gráfica circular, así que entra solo si la eliges aquí (sería una decisión de BRAND §9). Al hornear: macroViz = donut')
      ] }
  ];

})();
