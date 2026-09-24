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
  // v267 · la nav es de texto (sin .ic ni NAVIC): el set ya solo toca [compartir] del ejercicio y la cámara
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
  // cámara TRK como máscara (el 📷 vive en CSS: .exsh .camon::before). Sin '#' ni colores de la paleta: la máscara solo usa alfa.
  const CAM_MASK = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'1.6\' stroke-linecap=\'square\' stroke-linejoin=\'miter\'%3E%3Cpath vector-effect=\'non-scaling-stroke\' d=\'M3 7h4l2-3h6l2 3h4v13H3z\'/%3E%3Cpath vector-effect=\'non-scaling-stroke\' d=\'M9 10h6v6H9z\'/%3E%3C/svg%3E")';


  // v267 · nav (1), primario (2) y secundarios (9) se hornearon en index.html: su CSS de propuesta y sus ayudas se borraron

  const P = (id, k) => 'html[data-v-' + id + '="' + k + '"]';

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
      question:'¿Cambiamos los íconos por el set TRK (rejilla 24, trazo 1.6, remates cuadrados)? Aplica a [compartir] del ejercicio y a la marca de la serie grabada (el 📷 pasa a cámara TRK). La nav ya no lleva íconos desde v267.',
      status:'open', decided:null, shipped:null,
      scenarios:['workout', 'live:workout', 'popup:exshare'],
      options:[
        { k:'hoy', label:'hoy · trazo redondo + 📷' },
        { k:'A', label:'set TRK', note:'Compartir y cámara; la nav es de texto desde v267.',
          css: `
${P('icons','A')} .exshr svg.trkp-old{display:none;}
${P('icons','A')} .exshr .trkp-ic{display:inline-flex;}
${P('icons','A')} .exsh .camon::before{content:''; display:block; width:14px; height:14px; background:currentColor; -webkit-mask:${CAM_MASK} center/contain no-repeat; mask:${CAM_MASK} center/contain no-repeat;}`,
          dom: patchIcons }
      ] },

    { id:'boot', n:6, group:'G0', title:'boot shader', rule:'BRAND §4 arranque · B-09', src:'brand-lab §6',
      question:'Implementado en v262: tu elección ya es el look de la app ("hoy").', status:'shipped', decided:{ pick:'C', date:'2026-09-22', quote:'TRK-PICK v1 · 1 · base v261 · datos demo · 6boot=C' }, shipped:'v262',
      scenarios:['boot'],
      options:[ { k:'hoy', label:'hoy · matriz de fósforo (v262)' }, { k:'C', label:'matriz de fósforo', note:'horneado en index.html en v262; su CSS de propuesta se borró' } ] },
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
        { k:'A', label:'a los tokens de estado', note:'No se tocan las marcas (MRV .7, relleno de mantener .22, shader .5) ni el subtexto de la opción elegida. La opción sugerida del perfil (.75) pasa a .7, no a .45: bajo --o40 no se lee. :active y arrastre solo se ven al tocar.',
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
      question:'Implementado en v267: escala 10·12·14·20·28 y --t-field 16 solo en lo editable ("hoy" ya es eso). Antes 10·12·18·24·34: "fuentes muy grandes para lo que son".',
      status:'shipped', decided:{ pick:'A', date:'2026-09-23', quote:'14 · 20, más compacto' }, shipped:'v267',
      scenarios:['home', 'progress', 'macros', 'm:metric', 'onboard', 'share:session'],
      options:[
        { k:'hoy', label:'hoy · 10·12·14·20·28 + campo 16 (v267)' },
        { k:'A', label:'14 · 20, más compacto', note:'horneado en index.html en v267 (--t-section 18→14, --t-display 24→20, --t-hero 34→28, --t-field 16 nuevo: con menos de 16 el iPhone hace zoom al enfocar)' }
      ] },
    { id:'fields', n:21, group:'G3', title:'fields', rule:'B-11 · WCAG 1.4.11 · BRAND §4', src:'BRAND §9',
      question:'Implementado en v267: la casilla es una caja fina (1 px --o40, sin relleno, radio 4, 16 px) y con foco el borde sube a --fg ("hoy" ya es eso).',
      status:'shipped', decided:{ pick:'A', date:'2026-09-23', quote:'el redondeado en general... de los botones, de las casillas de escribir, siento que es demasiado' }, shipped:'v267',
      scenarios:['onboard', 'login', 'm:food', 'm:weight', 'm:goals', 'm:sleep'],
      options:[
        { k:'hoy', label:'hoy · caja fina de 16 px (v267)' },
        { k:'A', label:'caja fina, sin relleno', note:'horneado en index.html en v267 en .field, #fa_q, textarea.ta, .mdcust, sueño, perfil del ejercicio, .msum-time, .gnmin y .senm; sin CSS de propuesta' }
      ] },
    { id:'toggles', n:22, group:'G3', title:'toggles', rule:'B-06 · BRAND §3 corchetes', src:'BRAND §9',
      question:'Implementado en v267: las opciones no llevan caja; la elegida va [entre corchetes] en --fg/700 y las demás en --o50. Los corchetes apagados guardan su lugar: nada se mueve al elegir ("hoy" ya es eso).',
      status:'shipped', decided:{ pick:'A', date:'2026-09-23', quote:'que sea una estética más sobria, que sea más terminal' }, shipped:'v267',
      scenarios:['onboard', 'm:goals', 'm:stacknew', 'm:exedit', 'm:profile'],
      options:[
        { k:'hoy', label:'hoy · [elegida] sin caja (v267)' },
        { k:'A', label:'[elegida]', note:'horneado en index.html en v267 (antes: cada opción elegida era un bloque blanco lleno, "tosco, todo muy gordo"); .toggles.wrap = 2 columnas a la izquierda; la sugerida del perfil lleva subrayado punteado. Sin CSS de propuesta' }
      ] }
  ];

})();
