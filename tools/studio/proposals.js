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
  const TRK = {
    progress: '<path d="M3 18h4v-6h4v3h4V8h6"/>',
    gym: '<path d="M4 9v6M7 6v12M17 6v12M20 9v6M7 12h10"/>',
    macros: '<circle cx="12" cy="12" r="8"/><path d="M12 4v8h8"/>',
    share: '<path d="M9 9H5v11h14V9h-4M12 15V3M8 7l4-4 4 4"/>'
  };
  // trazo que no escala: 1.6 px reales a cualquier tamaño (22 en la nav, 16 en la cabecera del ejercicio)
  const trkSvg = (k, px) => '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '" aria-hidden="true" fill="none" stroke="currentColor"'
    + ' stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter">' + TRK[k].replace(/\/>/g, ' vector-effect="non-scaling-stroke"/>') + '</svg>';
  const NAV_ICON = { progress: 'progress', home: 'gym', macros: 'macros' };   // data-screen → ícono (NAVIC de index.html)
  function patchIcons(W){ const d = W.document;
    d.querySelectorAll('#nav a[data-screen]').forEach(a => {
      if(a.querySelector('[data-trk-patch]')) return;
      const ic = a.querySelector('.ic'), k = NAV_ICON[a.dataset.screen]; if(!ic || !k) return;
      const s = d.createElement('span'); s.className = 'ic trkp-ic'; s.setAttribute('data-trk-patch', ''); s.innerHTML = trkSvg(k, 22);
      ic.classList.add('trkp-old'); a.insertBefore(s, ic.nextSibling); });
    d.querySelectorAll('.exshr').forEach(b => {
      if(b.querySelector('[data-trk-patch]')) return;
      const old = b.querySelector('svg'); if(!old) return;
      const s = d.createElement('span'); s.className = 'trkp-ic'; s.setAttribute('data-trk-patch', ''); s.innerHTML = trkSvg('share', 16);
      old.classList.add('trkp-old'); b.appendChild(s); });
  }
  // cámara TRK como máscara (el 📷 vive en CSS: .exsh .camon::before). Sin '#' ni colores de la paleta: la máscara solo usa alfa.
  const CAM_MASK = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'1.6\' stroke-linecap=\'square\' stroke-linejoin=\'miter\'%3E%3Cpath vector-effect=\'non-scaling-stroke\' d=\'M3 7h4l2-3h6l2 3h4v13H3z\'/%3E%3Cpath vector-effect=\'non-scaling-stroke\' d=\'M9 10h6v6H9z\'/%3E%3C/svg%3E")';


  // ---------- CSS compartido por las tres navs de texto (brand-lab §1: texto siempre, ≥44, sin animar columnas) ----------
  const navText = P => `
${P} .nav{gap:0;}
${P} .nav a{height:44px; min-width:44px; justify-content:center; gap:0; padding:0 var(--s4); color:var(--o50); font-weight:700; transition:none;}
${P} .nav a .ic{display:none;}
${P} .nav a .lbl{grid-template-columns:1fr; opacity:1; transition:none;}
${P} .nav a.active{gap:0; padding:0 var(--s4);}`;
  // primario gym//TRK: los tres destinos reales (.start sin .ghost, el ok de las hojas, guardar sesión)
  const PRIM = ['.start:not(.ghost)', '.sheetbtns .ok', '.footer .save'];
  const prim = (P, suf) => PRIM.map(s => P + ' ' + s + (suf || '')).join(', ');
  // quita el glifo inicial de la etiqueta (▶ / ✓) para que el '>' de la opción B no se sume a él
  function patchPrimGlyph(W){ W.document.querySelectorAll(PRIM.join(',')).forEach(b => patchText(b, v => v.replace(/^(\s*)[▶✓]\s+/, '$1'))); }

  const P = (id, k) => 'html[data-v-' + id + '="' + k + '"]';

  window.TRK_PROPOSALS = [

    // ======================= G0 · los 7 del brand-lab en la app real =======================
    { id:'nav', n:1, group:'G0', title:'nav', rule:'B-05 · B-11 · BRAND §4 nav', src:'brand-lab §1',
      question:'¿Qué barra de navegación? Las tres son de texto (sin íconos), de 44 px de alto y sin animar el ancho; cambia la forma y cómo se marca la pestaña activa.',
      status:'open', decided:null, shipped:null,
      scenarios:['home', 'macros', 'progress', 'stack'],
      options:[
        { k:'hoy', label:'hoy · cápsula con íconos que abre la etiqueta' },
        { k:'A', label:'cápsula 999 · activa invertida', note:'Cápsula de vidrio; la pestaña activa es un bloque invertido (fondo --fill).',
          css: navText(P('nav','A')) + `
${P('nav','A')} .nav{padding:var(--s1); border-radius:var(--r-pill);}
${P('nav','A')} .nav a{border-radius:var(--r-pill);}
${P('nav','A')} .nav a.active{background:var(--fill); color:var(--on-fill);}` },
        { k:'B', label:'barra de 12 px · activa entre [ ]', note:'Si eliges también el radio flotante, la barra toma --r-float en lugar de 12.',
          css: navText(P('nav','B')) + `
${P('nav','B')} .nav{padding:0 var(--s2); border-radius:12px;}
${P('nav','B')} .nav a.active{background:none; color:var(--fg);}
${P('nav','B')} .nav a.active::before{content:'['; color:var(--o50); margin-right:var(--s1);}
${P('nav','B')} .nav a.active::after{content:']'; color:var(--o50); margin-left:var(--s1);}` },
        { k:'C', label:'barra ancha de 8 px · prompt > y subrayado', note:'Ocupa el ancho (12 px a cada lado); > y _ a los extremos; la activa lleva una línea de 2 px.',
          css: navText(P('nav','C')) + `
${P('nav','C')} .nav{left:var(--s4); right:var(--s4); width:auto; max-width:none; margin:0; justify-content:space-between; padding:0 var(--s2); border-radius:8px;}
${P('nav','C')} .nav::before{content:'>'; font-size:var(--t-label); color:var(--o40); padding:0 var(--s2);}
${P('nav','C')} .nav::after{content:'_'; font-size:var(--t-label); color:var(--o40); padding:0 var(--s2);}
${P('nav','C')} .nav a{position:relative;}
${P('nav','C')} .nav a.active{background:none; color:var(--fg);}
${P('nav','C')} .nav a.active::after{content:''; position:absolute; left:var(--s4); right:var(--s4); bottom:var(--s3); height:var(--bw-mark); background:var(--fill);}` }
      ] },

    { id:'primary', n:2, group:'G0', title:'primary', rule:'B-06 · B-05 · BRAND §4 primario', src:'brand-lab §2',
      question:'¿Cómo se ve el botón principal (uno por vista)? Mismo tamaño en las tres: 48 px, 2 px de radio, 12/800. Tócalo para ver el presionado.',
      status:'open', decided:null, shipped:null,
      scenarios:['home', 'workout', 'live:workout', 'm:food', 'm:weight', 'landing'],
      options:[
        { k:'hoy', label:'hoy · bloque blanco de 12 px' },
        { k:'A', label:'bloque invertido', note:'Presionado = se invierte (negro con contorno).',
          css: `
${prim(P('primary','A'))}{height:48px; border:0; border-radius:var(--r-sm); background:var(--fill); color:var(--on-fill); font-size:var(--t-data); font-weight:800; letter-spacing:var(--ls-ui);}
${prim(P('primary','A'), ':active')}{background:var(--bg); color:var(--fg); box-shadow:inset 0 0 0 var(--bw-ctl) var(--fg);}` },
        { k:'B', label:'vidrio + borde · glifo >', note:'Fondo de vidrio fuerte SIN blur (el blur es solo del chrome) y borde de 1 px; el ▶/✓ de la etiqueta pasa a > tenue. Presionado = se llena.',
          css: `
${prim(P('primary','B'))}{height:48px; border:var(--bw-ctl) solid var(--fg); border-radius:var(--r-sm); background:var(--glass-bg-strong); color:var(--fg); font-size:var(--t-data); font-weight:800; letter-spacing:var(--ls-ui);}
${prim(P('primary','B'), '::before')}{content:'>'; color:var(--o50); margin-right:var(--s3);}
${prim(P('primary','B'), ':active')}{background:var(--fill); color:var(--on-fill);}`,
          dom: patchPrimGlyph },
        { k:'C', label:'invertido con cursor ▌', note:'Texto a la izquierda y cursor que parpadea a la derecha. Ojo: BRAND §3 reserva ▌ para arranque y vacíos; elegir C abre esa excepción.',
          css: `
${prim(P('primary','C'))}{display:flex; align-items:center; justify-content:flex-start; text-align:left; height:48px; padding:0 var(--s5); border:0; border-radius:var(--r-sm); background:var(--fill); color:var(--on-fill); font-size:var(--t-data); font-weight:800; letter-spacing:var(--ls-ui);}
${prim(P('primary','C'), '::after')}{content:'▌'; margin-left:auto; animation:blink 1.15s var(--ease-step) infinite;}
${prim(P('primary','C'), ':active')}{background:var(--bg); color:var(--fg); box-shadow:inset 0 0 0 var(--bw-ctl) var(--fg);}` }
      ] },

    { id:'float', n:3, group:'G0', title:'float radius', rule:'B-05 · BRAND §4', src:'brand-lab §3',
      question:'Implementado en v262: tu elección ya es el look de la app ("hoy").', status:'shipped', decided:{ pick:'B', date:'2026-09-22', quote:'TRK-PICK v1 · 1 · base v261 · datos demo · 3float=B' }, shipped:'v262',
      scenarios:['m:food', 'm:sleep', 'm:metric', 'macros', 'home'],
      options:[ { k:'hoy', label:'hoy · 12 px (v262)' }, { k:'B', label:'12 px', note:'horneado en index.html en v262; su CSS de propuesta se borró' } ] },
    { id:'ring', n:4, group:'G0', title:'ring panel', rule:'B-05 · B-07 · BRAND §4 anillo', src:'brand-lab §4',
      question:'Implementado en v262: tu elección ya es el look de la app ("hoy").', status:'shipped', decided:{ pick:'C', date:'2026-09-22', quote:'TRK-PICK v1 · 1 · base v261 · datos demo · 4ring=C' }, shipped:'v262',
      scenarios:['macros', 'macros:open', 'share:food'],
      options:[ { k:'hoy', label:'hoy · vidrio sutil (v262)' }, { k:'C', label:'vidrio sutil', note:'horneado en index.html en v262; su CSS de propuesta se borró' } ] },
    { id:'icons', n:5, group:'G0', title:'TRK icons', rule:'B-08 · BRAND §4 íconos', src:'brand-lab §5',
      question:'¿Cambiamos los íconos por el set TRK (rejilla 24, trazo 1.6, remates cuadrados)? Aplica a la nav, a [compartir] del ejercicio y a la marca de la serie grabada (el 📷 pasa a cámara TRK).',
      status:'open', decided:null, shipped:null,
      scenarios:['home', 'workout', 'live:workout', 'popup:exshare'],
      options:[
        { k:'hoy', label:'hoy · trazo redondo + 📷' },
        { k:'A', label:'set TRK', note:'Con una nav de solo texto (nav A/B/C) los íconos de la nav no se ven; compartir y cámara sí.',
          css: `
${P('icons','A')} .nav a .ic.trkp-old, ${P('icons','A')} .exshr svg.trkp-old{display:none;}
${P('icons','A')} .nav a .trkp-ic{width:22px; height:22px;}
${P('icons','A')} .nav a .trkp-ic svg{width:22px; height:22px; stroke-linecap:square; stroke-linejoin:miter;}
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
      question:'Las tarjetas de 16 px salen del contenido. ¿Cómo se agrupa: //TÍTULO sobre una regla (plano, como terminal) o caja de 2 px?',
      status:'open', decided:null, shipped:null,
      scenarios:['progress', 'history', 'macros', 'm:food', 'home'],
      options:[
        { k:'hoy', label:'hoy · tarjetas de 16 px con fondo' },
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
      question:'Las acciones puntuales van entre corchetes, [verbo] de texto (rest day, skip day, abort, ↩, cerrar), no botones con borde; el principal sigue siendo botón.',
      status:'decided', decided:{ pick:'A', date:'2026-09-21', quote:'corchetes para cosas puntuales y btns para principales' }, shipped:null,
      scenarios:['home', 'workout', 'live:workout', 'settings', 'm:food'],
      options:[
        { k:'hoy', label:'hoy · botones con borde de 12 px' },
        { k:'A', label:'[verbo]', note:'Sin caja; zona de toque de 44 px. La barra de descanso no cambia (su ::after ya amplía el toque).',
          css: `
${P('secondary','A')} .secondary{justify-content:flex-start; gap:var(--s5);}
${P('secondary','A')} .secondary .b, ${P('secondary','A')} .footer .abort, ${P('secondary','A')} .footer .undo, ${P('secondary','A')} .sheetbtns .cancel{flex:0 0 auto; min-width:44px; height:44px; padding:0 var(--s2); border:0; border-radius:0; background:none; font-size:var(--t-data); font-weight:700; letter-spacing:var(--ls-ui);}
${P('secondary','A')} .secondary .b{color:var(--o60);}
${P('secondary','A')} .secondary .b:active, ${P('secondary','A')} .footer .abort:active, ${P('secondary','A')} .footer .undo:active, ${P('secondary','A')} .sheetbtns .cancel:active{background:none; color:var(--fg);}
${P('secondary','A')} .secondary .b::before, ${P('secondary','A')} .footer .abort::before, ${P('secondary','A')} .footer .undo::before, ${P('secondary','A')} .sheetbtns .cancel::before{content:'[';}
${P('secondary','A')} .secondary .b::after, ${P('secondary','A')} .footer .abort::after, ${P('secondary','A')} .footer .undo::after, ${P('secondary','A')} .sheetbtns .cancel::after{content:']';}` }
      ] },

    { id:'green', n:10, group:'G3', title:'color', rule:'B-07', src:'plan · G3c',
      question:'Implementado en v262: tu elección ya es el look de la app ("hoy").', status:'shipped', decided:{ pick:'A', date:'2026-09-22', quote:'TRK-PICK v1 · 1 · base v261 · datos demo · 10green=A' }, shipped:'v262',
      scenarios:['home', 'progress', 'macros', 'macros:open', 'm:muscle', 'm:metric'],
      options:[ { k:'hoy', label:'hoy · verde solo en glifo o número (v262)' }, { k:'A', label:'verde solo en glifo o número', note:'horneado en index.html en v262; su CSS de propuesta se borró' } ] },
    { id:'back', n:11, group:'G3', title:'back', rule:'B-06 · BRAND §3 corchetes · GLYPHS', src:'plan · G3c',
      question:'¿El botón "← back" (← está fuera del set) pasa a [‹ gym], texto con el nombre de a dónde vuelve?',
      status:'open', decided:null, shipped:null,
      scenarios:['settings', 'history', 'splitedit', 'workout', 'histedit', 'share:session'],
      options:[
        { k:'hoy', label:'hoy · píldora "← back"' },
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
      question:'Afilado para datos (0–2 px), radio chico solo en lo que flota.',
      status:'decided', decided:{ pick:'A', date:'2026-09-21', quote:'Mixto con regla' }, shipped:null,
      scenarios:['home', 'progress', 'macros', 'workout', 'settings', 'm:food'],
      options:[
        { k:'hoy', label:'hoy · tarjetas 16, controles 12, chips píldora' },
        { k:'A', label:'contenido a 2 px', note:'--radius y --r-ctl a 2 px; popovers y barra de guardado se quedan en 12 (flotan); chips a 2; barras a 0.',
          tokens:{ '--radius':'2px', '--r-ctl':'var(--r-sm)', '--r-pop':'12px', '--r-bar':'12px' },   // --r-pop/--r-bar leían --r-ctl: se fijan a su valor de hoy
          css: `
${P('corners','A')} .spc, ${P('corners','A')} .wchip, ${P('corners','A')} .chst, ${P('corners','A')} .chip, ${P('corners','A')} .ag-chip{border-radius:var(--r-sm);}
${P('corners','A')} .bar, ${P('corners','A')} .wprog, ${P('corners','A')} .vbar, ${P('corners','A')} .bar>i, ${P('corners','A')} .wprog>i, ${P('corners','A')} .vbar>i{border-radius:0;}` }
      ] },

    { id:'keepring', n:19, group:'G3', title:'kcal ring', rule:'BRAND §4 anillo', src:'BRAND §9',
      question:'El anillo de kcal se queda, única gráfica circular (macros y compartir). Su panel se elige en la propuesta 4.',
      status:'decided', decided:{ pick:'hoy', date:'2026-09-21', quote:'dejarlo, pero que todo sea un mix cmdhacker/glass moderno' }, shipped:null,
      scenarios:['macros', 'share:food'],
      options:[ { k:'hoy', label:'se queda' } ] }
  ];

})();
