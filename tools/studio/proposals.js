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
  // diccionario ES→EN de etiquetas de sistema (BRAND §3 idioma). Solo se cambia un prefijo EXACTO de la lista, así una
  // etiqueta del dueño (músculo, ejercicio, comida, hábito propio) nunca coincide y queda intacta.
  const EN = {
    'COBERTURA':'COVERAGE', 'ESTÍMULO':'STIMULUS', 'SALUD':'HEALTH', 'PERFIL':'PROFILE', 'HOY':'TODAY', 'AYER':'YESTERDAY',
    'MAÑANA':'TOMORROW', 'DIAGNÓSTICO':'DIAGNOSIS', 'VOLUMEN':'VOLUME', 'FATIGA':'FATIGUE', 'RECUPERACIÓN':'RECOVERY',
    'RENDIMIENTO':'PERFORMANCE', 'TENDENCIAS':'TRENDS', 'REGISTROS RECIENTES':'RECENT LOGS', 'FASES':'PHASES',
    'BLOQUES':'BLOCKS', 'COMPOSICIÓN':'COMPOSITION', 'POR MÚSCULO':'BY MUSCLE', 'MICRONUTRIENTES':'MICRONUTRIENTS',
    'MÚSCULOS DEL MOTOR':'PRIME MOVERS', 'MÚSCULOS':'MUSCLES', 'FUERZA':'STRENGTH', 'PERFIL DE RESISTENCIA':'RESISTANCE PROFILE',
    'LONGITUD MUSCULAR':'MUSCLE LENGTH', 'TUS ETIQUETAS':'YOUR TAGS', 'EJERCICIOS DE ETIQUETAS DE GRUPO':'GROUP-TAG EXERCISES',
    'BÁSICOS':'BASICS', 'PROTECCIÓN':'PROTECTION', 'QUÉ OCUPA':'STORAGE', 'PRODUCTOS':'PRODUCTS', 'EN ESTE DÍA':'THIS DAY',
    'EN LÍNEA':'ONLINE', 'A OTRA MEAL':'TO ANOTHER MEAL',
    // rótulos de las fichas de progreso (.plbl: minúsculas en el HTML, mayúsculas por CSS)
    'peso':'weight', 'pasos':'steps', 'agua':'water', 'sueño':'sleep', 'ánimo':'mood', 'volumen · sem':'volume · wk',
    'tensión · sem':'tension · wk', 'kcal · prom 7d':'kcal · avg 7d', 'FC reposo':'resting HR', 'energía activa':'active energy',
    'recuperación':'recovery', 'descanso':'rest'
  };
  const EN_KEYS = Object.keys(EN).sort((a, b) => b.length - a.length);
  function toEN(v){ const m = /^(\s*(?:\/\/)?)([\s\S]*)$/.exec(v), pre = m[1], rest = m[2];
    for(let i = 0; i < EN_KEYS.length; i++){ const k = EN_KEYS[i];
      if(rest.indexOf(k) === 0){ const nx = rest.charAt(k.length); if(nx === '' || nx === ' ' || nx === '·') return pre + EN[k] + rest.slice(k.length); } }
    return v; }
  // contenedores de etiquetas de sistema (nunca .n de ejercicio, .ml de comida, nombres de músculo ni de split)
  const SYS_LABELS = '.section>.h, .grp-label, .plbl, .ready .rk, .dnlbl, .restbar .rl, .bootov .bt';
  function patchEN(W){ W.document.querySelectorAll(SYS_LABELS).forEach(el => patchText(el, toEN)); }

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

  // ---------- arranque: corredor WebGL1 común para los shaders de propuesta ----------
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
  const UNI = 'uniform vec2 res;uniform float time;uniform float dpr;';
  const NOISE = 'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.;a*=.5;}return v;}';
  // A · líneas corregidas: se mide contra el lado MAYOR (cover: los anillos llegan arriba y abajo) y celdas cuadradas
  const FS_LINES = UNI + 'float rnd(float x){return fract(sin(x)*1e4);}void main(){vec2 uv=(gl_FragCoord.xy*2.0-res)/max(res.x,res.y);float q=128.0;uv=floor(uv*q)/q;float t=time*0.06+rnd(uv.x)*0.4;float lw=0.0008;float v=0.0;for(int j=0;j<3;j++){for(int i=0;i<5;i++){v+=lw*float(i*i)/abs(fract(t-0.01*float(j)+float(i)*0.01)-length(uv)*1.15);}}v=clamp(v/3.0,0.0,1.0);gl_FragColor=vec4(vec3(v),1.0);}';
  // B · tramado 1-bit: ruido lento + Bayer 4×4 en celdas de 3 px (× dpr)
  const FS_DITHER = UNI + NOISE + 'float b2(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}void main(){float P=3.0*dpr;vec2 c=floor(gl_FragCoord.xy/P);vec2 uv=(c*P*2.0-res)/max(res.x,res.y);float f=fbm(uv*1.4+vec2(0.,-time*.05))*.95-.38-length(uv)*.22+.06*sin(time*.4+uv.y*3.);float bay=b2(.5*c)*.25+b2(c);float bit=step(bay,f);gl_FragColor=vec4(vec3(bit*.7),1.0);}';
  // C · matriz de puntos de fósforo: rejilla de 6 px (× dpr), onda desde el centro modulada por ruido
  const FS_PHOSPHOR = UNI + NOISE + 'void main(){float G=6.0*dpr;vec2 g=gl_FragCoord.xy/G;vec2 id=floor(g),f=fract(g)-.5;vec2 uv=(id*G*2.0-res)/max(res.x,res.y);float w=.5+.5*sin(length(uv)*9.0-time*1.3);float nz=fbm(uv*2.2+time*.04);float b=pow(w*nz,1.6)*1.8;float d=smoothstep(.34,.12,length(f));gl_FragColor=vec4(vec3(clamp(b,0.,1.)*d),1.0);}';

  function glRunner(FS){
    return function(canvas, W){
      const V = (canvas.ownerDocument && canvas.ownerDocument.defaultView) || W, doc = V.document;
      let gl = null;
      try{ gl = canvas.getContext('webgl', { antialias: false, alpha: false }) || canvas.getContext('experimental-webgl'); }catch(_){}
      if(!gl) return null;
      let raf = 0, alive = true, lost = false, dirty = true, uR = null, uT = null, uD = null, dpr = 1, ro = null;
      const t0 = V.performance.now();
      const still = !!(V.matchMedia && V.matchMedia('(prefers-reduced-motion: reduce)').matches);   // reduced-motion = un cuadro quieto
      function init(){
        let prec = 'highp';
        try{ const f = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT); if(!f || !f.precision) prec = 'mediump'; }catch(_){ prec = 'mediump'; }
        const mk = (ty, src) => { const s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s);
          if(!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()){ try{ V.console.warn('shader de propuesta', gl.getShaderInfoLog(s)); }catch(_){} return null; } return s; };
        const vs = mk(gl.VERTEX_SHADER, VS), fs = mk(gl.FRAGMENT_SHADER, 'precision ' + prec + ' float;' + FS);
        if(!vs || !fs) return false;
        const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
        gl.useProgram(prog);
        const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const pl = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);
        uR = gl.getUniformLocation(prog, 'res'); uT = gl.getUniformLocation(prog, 'time'); uD = gl.getUniformLocation(prog, 'dpr');
        dirty = true; return true; }
      function size(){ dirty = false; dpr = Math.min(V.devicePixelRatio || 1, 2);
        const r = canvas.getBoundingClientRect(), w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
        if(canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
        gl.viewport(0, 0, canvas.width, canvas.height); }
      function frame(){ raf = 0; if(!alive || lost) return;
        if(dirty) size();
        gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, still ? 1 : (V.performance.now() - t0) / 1000 + 1); gl.uniform1f(uD, dpr);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if(!still && doc.visibilityState !== 'hidden') raf = V.requestAnimationFrame(frame); }
      const kick = () => { if(alive && !lost && !raf) raf = V.requestAnimationFrame(frame); };
      const onResize = () => { dirty = true; kick(); };
      const onVis = () => { if(doc.visibilityState === 'hidden'){ if(raf){ V.cancelAnimationFrame(raf); raf = 0; } } else kick(); };   // apagado en segundo plano
      const onLost = e => { e.preventDefault(); lost = true; if(raf){ V.cancelAnimationFrame(raf); raf = 0; } };
      const onRestored = () => { lost = false; if(init()) kick(); };
      if(!init()) return null;
      V.addEventListener('resize', onResize); doc.addEventListener('visibilitychange', onVis);
      canvas.addEventListener('webglcontextlost', onLost, false); canvas.addEventListener('webglcontextrestored', onRestored, false);
      try{ if(V.ResizeObserver){ ro = new V.ResizeObserver(onResize); ro.observe(canvas); } }catch(_){}
      kick();
      return function stop(){ if(!alive) return; alive = false;
        if(raf){ try{ V.cancelAnimationFrame(raf); }catch(_){} raf = 0; }
        V.removeEventListener('resize', onResize); doc.removeEventListener('visibilitychange', onVis);
        canvas.removeEventListener('webglcontextlost', onLost, false); canvas.removeEventListener('webglcontextrestored', onRestored, false);
        if(ro){ try{ ro.disconnect(); }catch(_){} }
        try{ const x = gl.getExtension('WEBGL_lose_context'); if(x) x.loseContext(); }catch(_){} };   // igual que startShader: libera el contexto
    };
  }

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
      question:'¿Cuánto redondeo lleva lo que flota (hojas, toasts, popovers, barra de guardado, nav)? El contenido se queda en 2 px.',
      status:'open', decided:null, shipped:null,
      scenarios:['m:food', 'm:sleep', 'm:metric', 'macros', 'home'],
      // --r-float aún no existe en index.html: cada opción lo declara en tokens. La nav A (cápsula 999) se respeta.
      options:[
        { k:'hoy', label:'hoy · hojas 22, toasts y nav píldora, popovers 12' },
        { k:'A', label:'8 px', tokens:{ '--r-float':'8px' },
          css: floatCss(P('float','A')) },
        { k:'B', label:'12 px', tokens:{ '--r-float':'12px' },
          css: floatCss(P('float','B')) }
      ] },

    { id:'ring', n:4, group:'G0', title:'ring panel', rule:'B-05 · B-07 · BRAND §4 anillo', src:'brand-lab §4',
      question:'El anillo de kcal se queda (decidido). ¿Sobre qué va? En A, B y C además se quita el brillo, deja de recortarse en cuadro y desaparece el punto al 0 %.',
      status:'open', decided:null, shipped:null,
      scenarios:['macros', 'macros:open', 'share:food'],
      options:[
        { k:'hoy', label:'hoy · tarjeta de 16 px + brillo' },
        { k:'A', label:'plano, entre dos reglas', css: ringFix(P('ring','A')) + `
${P('ring','A')} .card:has(>.hero){background:none; border:0; border-top:var(--bw-sep) solid var(--o20); border-bottom:var(--bw-sep) solid var(--o20); border-radius:0;}` },
        { k:'B', label:'caja de 2 px', css: ringFix(P('ring','B')) + `
${P('ring','B')} .card:has(>.hero){background:none; border:var(--bw-sep) solid var(--o20); border-radius:var(--r-sm);}` },
        // BRAND §10 "panel del anillo (plano vs vidrio sutil)": relleno translúcido + canto, SIN backdrop-filter (blur solo en el chrome, §7)
        { k:'C', label:'vidrio sutil', note:'Relleno de vidrio y canto de .5 px, sin desenfoque (el blur es solo del chrome que flota).',
          css: ringFix(P('ring','C')) + `
${P('ring','C')} .card:has(>.hero){background:var(--glass-bg-strong); border:var(--bw-sep) solid var(--glass-edge); border-radius:var(--r-ctl);}` }
      ] },

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
      question:'¿Qué shader lleva el arranque? A es el de hoy corregido (ya no se ve comprimido); B y C son alternativas monocromas. Todas se apagan con reduced-motion y en segundo plano.',
      status:'open', decided:null, shipped:null,
      scenarios:['boot'],
      options:[
        { k:'hoy', label:'hoy · líneas (comprimido en vertical)' },
        { k:'A', label:'líneas corregidas', note:'Se mide contra el lado mayor (cover) y las celdas son cuadradas: los anillos llegan arriba y abajo.', shader: glRunner(FS_LINES) },
        { k:'B', label:'tramado 1-bit', note:'Ruido lento con Bayer 4×4 en celdas de 3 px.', shader: glRunner(FS_DITHER) },
        { k:'C', label:'matriz de fósforo', note:'Rejilla de puntos de 6 px con una onda que sale del centro.', shader: glRunner(FS_PHOSPHOR) }
      ] },

    { id:'field', n:7, group:'G0', title:'field edge', rule:'B-11 · WCAG 1.4.11', src:'brand-lab §7',
      question:'¿Subimos el borde de los campos que se editan a 1 px --o40 (≈4.9:1, pasa WCAG)? Lo de solo lectura sigue en línea fina.',
      status:'open', decided:null, shipped:null,
      scenarios:['workout', 'live:workout', 'histedit', 'm:session'],
      options:[
        { k:'hoy', label:'hoy · .5 px --o20 (≈2.0:1)' },
        { k:'A', label:'1 px --o40 solo en editables', note:'Series bloqueadas del historial (data-locked) y el FS de solo lectura no cambian; el chip de peso en aviso conserva su color.',
          css: `
${P('field','A')} .inp:not([data-locked]), ${P('field','A')} .pick:not([data-locked]), ${P('field','A')} .fs:not(.ds), ${P('field','A')} .bwchip:not(.warn), ${P('field','A')} .inp-mini{border:var(--bw-field) solid var(--o40);}` }
      ] },

    // ======================= G3 · la identidad aplicada =======================
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
      question:'Lo que está en orden no lleva color: ¿quitamos el verde de las frases ("fresco", "en meta", "low", diagnóstico ok) y lo dejamos solo en glifos y números?',
      status:'open', decided:null, shipped:null,
      scenarios:['home', 'progress', 'macros', 'macros:open', 'm:muscle', 'm:metric'],
      options:[
        { k:'hoy', label:'hoy · frases enteras en verde' },
        { k:'A', label:'verde solo en glifo o número', note:'Siguen verdes: número del macro en meta, ✓ de tomas, PR, reloj de descanso al terminar. El toast ✓ pierde el borde verde.',
          // !important: el color de "fresco" viene en style="" en línea (recStateCol en dayMusclesLineHTML, //MÚSCULOS y su detalle)
          css: `
${P('green','A')} .ready span[style*="var(--good)"]{color:var(--o50)!important;}
${P('green','A')} .mscrec[style*="var(--good)"], ${P('green','A')} .mscd .mdv span[style*="var(--good)"]{color:var(--o50)!important;}
${P('green','A')} .pst.good, ${P('green','A')} .pill.good, ${P('green','A')} .dx-ok{color:var(--o50);}
${P('green','A')} .toast.ok{border-color:var(--glass-ring);}` }
      ] },

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
      question:'La recuperación queda en su mínimo: "recovery ~43 ›" en una línea 12/800, sin héroe ni color de veredicto (BRAND §4). El detalle sigue al tocarla.',
      status:'decided', decided:{ pick:'A', date:'2026-09-21', quote:'conserva pero hazlo lo más reduccionista posible' }, shipped:null,
      scenarios:['home', 'm:ready'],
      options:[
        { k:'hoy', label:'hoy · recuperación 43 · y sus motivos' },
        { k:'A', label:'recovery ~43', note:'La línea mide 44 px (se toca para abrir el detalle).',
          css: `
${P('recovery','A')} .ready[data-act="readiness"]{display:flex; align-items:center; min-height:44px; margin-top:0; font-size:0; letter-spacing:0;}
${P('recovery','A')} .ready[data-act="readiness"] .rk{font-size:var(--t-data); font-weight:800; letter-spacing:var(--ls-ui); color:var(--o50);}
${P('recovery','A')} .ready[data-act="readiness"] b{font-size:var(--t-data); font-weight:800; color:var(--fg); margin-left:1ch;}
${P('recovery','A')} .ready[data-act="readiness"] b::before{content:'~';}
${P('recovery','A')} .ready[data-act="readiness"] .rl{display:none;}
${P('recovery','A')} .ready[data-act="readiness"] .rl:last-child{display:inline; font-size:var(--t-data); color:var(--o40); margin-left:1ch;}`,
          dom: W => W.document.querySelectorAll('.ready[data-act="readiness"] .rk').forEach(el => patchText(el, toEN)) }
      ] },

    { id:'retention', n:13, group:'G3', title:'retention', rule:'BRAND §4 puntuaciones · B-10 · B-07', src:'plan · G3c',
      // BRAND §4: la retención es una fila de diagnóstico que SOLO aparece si se sale de rango ("high"); las dos opciones lo respetan
      question:'La retención solo aparece cuando se sale de rango (BRAND §4). ¿Cómo se lee esa fila: la línea corta con su etiqueta, o la fila de diagnóstico con Na:K?',
      status:'open', decided:null, shipped:null,
      scenarios:['macros:high', 'macros:open'],
      options:[
        { k:'hoy', label:'hoy · barra + etiqueta de color + consejos, siempre' },
        { k:'A', label:'una línea, solo si se sale de rango', note:'"retention 62 high", sin barra ni consejos; la fila (y su regla) solo aparece en "high", con el número en rojo.',
          css: retentionCss(P('retention','A')) + retentionHide(P('retention','A')), dom: patchRetention },
        { k:'B', label:'diagnóstico, solo si se sale de rango', note:'"retention 62 · Na:K 2.1 →" como en BRAND §4: sin etiqueta, con la razón sodio:potasio del día; solo el número va en rojo. Si ocultaste sodio/potasio en metas, sin Na:K.',
          css: retentionCss(P('retention','B')) + retentionHide(P('retention','B')) + `
${P('retention','B')} .mrow:has(.pill.over) .pill{display:none;}
${P('retention','B')} .mrow:has(.pill.over) .trkp-nak{color:var(--o50);}
${P('retention','B')} .mrow:has(.pill.over) .mv::after{content:' →'; color:var(--o50);}`,
          dom: W => { patchRetention(W); patchNaK(W); } }
      ] },

    { id:'wordmark', n:14, group:'G3', title:'wordmark', rule:'BRAND §3 marca', src:'plan · G3c',
      question:'¿Una sola marca gym//TRK en todas partes: gym y TRK en blanco 800, // en --o40, sin tracking?',
      status:'open', decided:null, shipped:null,
      scenarios:['boot', 'landing', 'login', 'onboard', 'share:session', 'share:food'],
      options:[
        { k:'hoy', label:'hoy · cinco variantes (gym tenue, // a --o50, pie en --o35…)' },
        { k:'A', label:'gym//TRK única', note:'Arranque, landing/login/onboard, pie de compartir y wrap. El "· wrap" del rótulo del wrap también sube a blanco.',
          css: `
${P('wordmark','A')} .shfoot{color:var(--fg); letter-spacing:0;}
${P('wordmark','A')} #app .u-lsnum.u-w8{letter-spacing:0;}
${P('wordmark','A')} #app .u-lsnum.u-w8>.u-o50{color:var(--o40);}
${P('wordmark','A')} .ws-kick, ${P('wordmark','A')} .ws-cardf{color:var(--fg); letter-spacing:0;}
${P('wordmark','A')} .ws-kick .s, ${P('wordmark','A')} .ws-cardf span{color:var(--o40);}
${P('wordmark','A')} .bootov .bt.trkp-wmhost{font-size:0;}
${P('wordmark','A')} .bootov .bt .trkp-wm{font-size:var(--t-section); letter-spacing:0; color:var(--fg);}
${P('wordmark','A')} .bootov .bt .trkp-wm .trkp-s{color:var(--o40);}`,
          // el arranque escribe <span class="s">gym</span>//TRK (gym tenue): se oculta y se pone la marca correcta al lado
          dom: W => { const d = W.document;
            d.querySelectorAll('.bootov .bt').forEach(bt => {
              const s = bt.firstElementChild;
              if(bt.querySelector('[data-trk-patch]') || !s || !s.classList.contains('s') || s.textContent !== 'gym') return;
              const m = d.createElement('span'); m.className = 'trkp-wm'; m.setAttribute('data-trk-patch', '');
              m.innerHTML = 'gym<span class="trkp-s">//</span>TRK'; bt.classList.add('trkp-wmhost'); bt.insertBefore(m, s); }); } }
      ] },

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
      question:'Etiquetas de sistema en inglés, prosa en español. Tus etiquetas (músculos, ejercicios, comidas, splits) no se traducen.',
      status:'decided', decided:{ pick:'A', date:'2026-09-21', quote:'Etiquetas en inglés' }, shipped:null,
      scenarios:['progress', 'home', 'macros', 'm:muscle', 'm:metric', 'settings'],
      options:[
        { k:'hoy', label:'hoy · mezcla (COBERTURA, SALUD, REGISTROS RECIENTES…)' },
        { k:'A', label:'inglés', note:'Solo cambia rótulos de sistema de una lista cerrada (//COVERAGE, //HEALTH, RECENT LOGS, weight, steps…). Pendiente para G3c: rótulos de campo de las hojas.',
          dom: patchEN }
      ] },

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

  // ---------- piezas de CSS reutilizadas por varias opciones ----------
  function floatCss(p){ return `
${p} .sheet{border-radius:0 0 var(--r-float) var(--r-float);}
${p} .toast, ${p} .tsel, ${p} .gloss, ${p} .savebar, ${p} .ag-supp-pop, ${p} .dragghost{border-radius:var(--r-float);}
${p}:not([data-v-nav="A"]) .nav{border-radius:var(--r-float);}
${p}:not([data-v-nav="A"]) .nav a{border-radius:max(var(--r-sm), calc(var(--r-float) - 6px));}`; }
  // anillo: sin brillo (ni en las celdas de macro), el svg no recorta y el trazo al 0 % no pinta un punto
  function ringFix(p){ return `
${p} .ring svg{overflow:visible;}
${p} .hero .ring-fill, ${p} .cell .ring-fill{filter:none;}
${p} .ring-fill[style^="stroke-dasharray:0 100"]{visibility:hidden;}`; }
  function retentionCss(p){ return `
${p} .mrow:has(.pill){grid-template-columns:1fr auto;}
${p} .mrow:has(.pill) .bar, ${p} .mrow:has(.pill) .mv .g, ${p} .mrow:has(.pill) + .bltips{display:none;}
${p} .mrow:has(.pill) .pill{color:var(--o50);}
${p} .mrow:has(.pill.over) .mv{color:var(--bad);}`; }
  // la fila (sus consejos y la regla de arriba) solo queda si la etiqueta es "high" (.pill.over)
  function retentionHide(p){ return `
${p} .mrow:has(.pill:not(.over)), ${p} .mrow:has(.pill:not(.over)) + .bltips, ${p} hr.rule:has(+ .mrow .pill:not(.over)){display:none;}`; }
  // Na:K del día desde las filas de INTAKE (sodium / potassium, primer número de .mv); nodo propio con data-trk-patch
  function patchNaK(W){ const d = W.document, rows = [...d.querySelectorAll('.mrow')];
    const num = lbl => { const r = rows.find(x => { const l = x.querySelector('.ml'); return l && l.textContent.trim() === lbl; });
      const v = r && r.querySelector('.mv'); return v ? parseFloat(v.textContent.replace(/,/g, '')) : NaN; };
    const na = num('sodium'), k = num('potassium'); if(!(na >= 0) || !(k > 0)) return;
    rows.forEach(r => { const pl = r.querySelector('.pill.over'), mv = r.querySelector('.mv'); if(!pl || !mv || mv.querySelector('.trkp-nak')) return;
      const s = d.createElement('span'); s.className = 'trkp-nak'; s.setAttribute('data-trk-patch', ''); s.textContent = ' · Na:K ' + (Math.round(na / k * 10) / 10);
      mv.appendChild(s); }); }
  function patchRetention(W){ W.document.querySelectorAll('.mrow').forEach(r => {
    if(!r.querySelector('.pill')) return; patchText(r.querySelector('.ml'), v => v.replace('water retention', 'retention')); }); }
})();
