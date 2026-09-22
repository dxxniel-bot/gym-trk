// gym//TRK · estudio · CONTROLES POR ROL (tools/studio/knobs.js) → window.TRK_KNOBS
// Contrato: tools/studio/CONTRACT.md §4. Cada ítem mueve UN token de :root de index.html.
//   d = valor de HOY en :root (check.cjs lo verifica) · min/max = rango BRAND · x = rango "explorar" (sale como pregunta).
//   kind:'alpha' → el token es rgba(rgb, a) y el control mueve a · sel = dónde vive el token (inspector / "dónde se ve").
//   note 'hoy fuera de BRAND · G3' = hoy está fuera del rango BRAND; G3 lo trae adentro (o el dueño decide otra cosa).
// Solo datos + checks puros: sin almacenamiento, sin red, sin DOM.
(function(){ 'use strict';
  const FG = '243,243,243', GL = '14,14,14';
  const G3 = 'hoy fuera de BRAND · G3';

  // valor → número (acepta 12, '12px', '.5', 'rgba(r,g,b,a)' → a, '120ms')
  function num(v){
    if(typeof v === 'number') return v;
    const s = String(v == null ? '' : v).trim();
    const m = /^rgba?\(([^)]*)\)$/i.exec(s);
    if(m){ const p = m[1].split(','); return p.length > 3 ? parseFloat(p[3]) : 1; }
    return parseFloat(s);
  }
  // contraste WCAG de --fg a opacidad a sobre #000 (mezcla lineal en sRGB, como la pinta el navegador)
  function contrast(a){
    const lin = c => { c = c / 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
    const [r, g, b] = FG.split(',').map(n => +n * a);
    const L = .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
    return (L + .05) / .05;
  }
  // lector de valores para los checks: lo movido o, si no, el de hoy
  const reader = (items, vals) => tok => { const v = vals && vals[tok] != null ? vals[tok] : (items.find(i => i.tok === tok) || {}).d; return num(v); };
  const r2 = n => Math.round(n * 100) / 100;

  // ---- selectores de las líneas (§9, exactos) ----
  const BW = {
    sep: '.mmrow,.mscrow,.dxrow,.stline,.mdtr,.trow+.trow,.mdtabs,.mdstats,.hrow,.hist-rail .hitem,.lc,.mrec+.mrec,.msum-items,.stq,.exrow,.senm,.pickitem,.nvm,.ws-h,.u-sep,.whl-sel',
    box: '.spc,.wq,.wchip,.chst,.msum-time,.sedrift,.mgbar,.bwchip,.inp,.pick,.tselo,.fs,.chip,.moodpad,.inp-mini',
    dash: '.exsub .mch,.exhead .mch,[data-gloss],.u-dash',
    leader: '.line .dots,.mddots',
    field: '.mmrow select,select.pfsel,#pf_gym,.pfw,.mdcust input,.field input,.field select,.slph input,.slblk input,#fa_q,textarea.ta,.gnmin',
    ctl: '.status .back,.secondary .b,button.b,button.t,button.cancel,.mdcust .b,.lact,.restbar a,.footer .abort,.footer .undo,.toggles button,.sheetbtns .cancel,.fa-btns .b,.fa-empty .fa-em-step,.start.ghost,.hold,.ag-chip',
    card: '.pfeat,.pthrow,.ptile,.hcal,.card,.grp,.ws-card,.ag-blk',
    rule: '.rule,.footer,.restbar,.stk-blk,.ghead,.grp .item,.shbanner,.nl-row,.mbody,.seday',
    chrome: '.glass,.glass-strong,.sheet.glass-strong,.tsel,.gloss,.savebar,.dragghost',
    mark: '.moodpt,.scan-reticle .frame2',
    focus: ':focus-visible'
  };

  const K = [
    // ---------------------------------------------------------------- tipografía (B-04 · escala 10·12·16·22·34)
    { g:'tipografía', key:'type', rule:'B-04 · TYP-1',
      note:'una sola escala 10·12·16·22·34; orden obligatorio rótulo < dato < sección < display < héroe; 800 nunca bajo 12 (el 800 vive en --t-data).',
      items:[
        { tok:'--t-label',   l:'rótulo',   d:10, min:10, max:11, step:1, u:'px', kind:'px', x:{min:9, max:12} },
        { tok:'--t-data',    l:'dato',     d:12, min:12, max:13, step:1, u:'px', kind:'px', x:{min:11,max:14} },
        { tok:'--t-section', l:'sección', d:18, min:16, max:20, step:1, u:'px', kind:'px', x:{min:14,max:20}, note:'también es el tamaño de los campos: bajo 16 vuelve el zoom de iOS al escribir' },
        { tok:'--t-display', l:'display',  d:24, min:20, max:26, step:1, u:'px', kind:'px', x:{min:18,max:28},
          sel:'.whdr .wname,.ring.lg .num,.pval,.msum-tot b,.lkc b,.shsn,.shr-ring .ring.lg .num,.shm-g,.exbn,.shstat-n,.ws-big span,.ws-year,.u-disp' },
        { tok:'--t-hero',    l:'héroe',    d:34, min:32, max:36, step:1, u:'px', kind:'px', x:{min:26,max:44},
          sel:'.strk-n,.mdval,.exov,.u-hero' }
      ],
      check(vals){ const v = reader(this.items, vals), out = [];
        const o = ['--t-label','--t-data','--t-section','--t-display','--t-hero'].map(v);
        for(let i = 1; i < o.length; i++) if(!(o[i-1] < o[i])){ out.push('orden roto: rótulo < dato < sección < display < héroe'); break; }
        if(v('--t-data') < 12) out.push('800 bajo 12: --t-data lleva peso 800 (.uname, .streak…)');
        return out.length ? out.join(' · ') : null; } },

    // ---------------------------------------------------------------- tracking (em)
    { g:'tracking', key:'tracking', rule:'B-04 · TYP-2',
      note:'espaciado entre letras por rol; la marca gym//TRK va sin tracking.',
      items:[
        { tok:'--ls-caps',  l:'mayúsculas · rótulo', d:.2,   min:.12, max:.24, step:.01, u:'em', kind:'num', x:{min:0,  max:.3},
          sel:'.rot .lbl,.whdr .wlbl,.grp-label,.pfl,.spl,.strk-k,.cm .cmh,.pthl,.lpr,.plbl,.hmon,.hcalh .hct,.tselh,.ready .rk,.field label,.shcap,.shstat-l,.nl-hd,.stk-blk summary,.ag-nohr .gl,.u-lscaps' },
        { tok:'--ls-title', l:'título de hoja',      d:.12,  min:.08, max:.16, step:.01, u:'em', kind:'num', x:{min:0,  max:.24},
          sel:'.supps .sph .h,.sheet h3,.shr-ring .ring.lg .of,.sgh' },
        { tok:'--ls-num',   l:'número grande',       d:-.03, min:-.05,max:0,   step:.01, u:'em', kind:'num', x:{min:-.08,max:.02},
          sel:'.whdr .wname,.strk-n,.mdval,.pval,.mkc,.msum-tot b,.shr-ring .ring.lg .num,.shm-g,.exov,.shstat-n,.u-lsnum' },
        { tok:'--ls-ui',    l:'texto de control',    d:.03,  min:0,   max:.05, step:.01, u:'em', kind:'num', x:{min:-.02,max:.1},
          sel:'.whdr .wmeta,.start,.secondary .b,button.b,.vst,.wq,.pthl span,.mdtabs span,.lact,.dragghost,.thead .cl,.ready,.exT,.restbar .rl,.footer .save,.toggles button,.moodax,.nav a,.nav a .lbl>span,.shm-l,.nl-hd .nl-hi,.fa-btns .b,.fa-empty .fa-em-step .lb,.dnlbl,.hold,.u-lsui' }
      ] },

    // ---------------------------------------------------------------- interlineado
    { g:'interlineado', key:'lineheight', rule:'B-04 · TYP-3',
      note:'interlineado por rol: apretado (números) ≤ interfaz ≤ lectura ≤ compartir.',
      items:[
        { tok:'--lh-tight', l:'apretado · números', d:1,   min:1,    max:1.1, step:.05, u:'', kind:'num', x:{min:.9, max:1.2},
          sel:'.whdr .wname,.ring-center,.gmore,.strk-n,.ptchev,.pval,.hrow .hchev,.msum-tot b,.dgrip,.setn,.dchk,.rirb,.lk,.semv span,.shm-g,.exsh .camon::before,.dnav,.ws-big,.ws-month,.ag-mk .mg' },
        { tok:'--lh-ui',    l:'interfaz',           d:1.2, min:1.15, max:1.3, step:.05, u:'', kind:'num', x:{min:1,  max:1.5},
          sel:'.sgoal,.whdr .wlbl,.whdr .wmeta,.strk-h,.hrow .hnm,.shtop,.shfoot,.shsn,.exbn' },
        { tok:'--lh-read',  l:'lectura',            d:1.4, min:1.35, max:1.5, step:.05, u:'', kind:'num', x:{min:1.2,max:1.7},
          sel:'.status .center,.dxev,.dxdo,.strk-sub,.stqc,.bltip' },
        { tok:'--lh-share', l:'compartir',          d:1.6, min:1.4,  max:1.7, step:.05, u:'', kind:'num', x:{min:1.2,max:2},
          sel:'.strk-side,.srw,.exbr' }
      ],
      check(vals){ const v = reader(this.items, vals);
        const o = ['--lh-tight','--lh-ui','--lh-read','--lh-share'].map(v);
        for(let i = 1; i < o.length; i++) if(o[i-1] > o[i]) return 'orden roto: apretado ≤ interfaz ≤ lectura ≤ compartir';
        return null; } },

    // ---------------------------------------------------------------- líneas (--bw-*, §9)
    { g:'líneas', key:'lines', rule:'B-05 · B-01',
      note:'grosor de línea por rol. Borde del vidrio .5 en BRAND §4; el borde de campo sigue abierto (WCAG 1.4.11, BRAND §10).',
      items:[
        { tok:'--bw-sep',    l:'separador de lista', d:.5,  min:.5, max:1,   step:.5, u:'px', kind:'px', x:{min:0, max:2}, sel:BW.sep },
        { tok:'--bw-box',    l:'caja de dato',       d:.5,  min:.5, max:1,   step:.5, u:'px', kind:'px', x:{min:0, max:2}, sel:BW.box },
        { tok:'--bw-dash',   l:'subrayado punteado', d:1,   min:.5, max:1,   step:.5, u:'px', kind:'px', x:{min:0, max:2}, sel:BW.dash },
        { tok:'--bw-leader', l:'guía ····',          d:1,   min:.5, max:1,   step:.5, u:'px', kind:'px', x:{min:0, max:2}, sel:BW.leader },
        { tok:'--bw-field',  l:'campo',              d:1,   min:1,  max:1.5, step:.5, u:'px', kind:'px', x:{min:.5,max:2}, sel:BW.field },
        { tok:'--bw-ctl',    l:'control',            d:1,   min:.5, max:1.5, step:.5, u:'px', kind:'px', x:{min:0, max:2}, sel:BW.ctl },
        { tok:'--bw-card',   l:'tarjeta',            d:1,   min:.5, max:1,   step:.5, u:'px', kind:'px', x:{min:0, max:2}, sel:BW.card },
        { tok:'--bw-rule',   l:'regla',              d:1,   min:.5, max:1,   step:.5, u:'px', kind:'px', x:{min:0, max:2}, sel:BW.rule },
        { tok:'--bw-chrome', l:'borde del vidrio',   d:1,   min:.5, max:1,   step:.5, u:'px', kind:'px', x:{min:0, max:2}, sel:BW.chrome },
        { tok:'--bw-mark',   l:'marca',              d:2,   min:1.5,max:2,   step:.5, u:'px', kind:'px', x:{min:1, max:3}, sel:BW.mark },
        { tok:'--bw-focus',  l:'foco',               d:1.5, min:1.5,max:2,   step:.5, u:'px', kind:'px', x:{min:1, max:3}, sel:BW.focus }
      ],
      check(vals){ const v = reader(this.items, vals), out = [];
        if(v('--bw-field') <= 0) out.push('campo sin borde: no se ve dónde escribir (WCAG 1.4.11)');
        if(v('--bw-focus') < 1.5) out.push('foco < 1.5 px: poco visible');
        return out.length ? out.join(' · ') : null; } },

    // ---------------------------------------------------------------- trazos SVG (unidades del viewBox)
    { g:'trazos', key:'strokes', rule:'B-04 · BRAND §4 (íconos 1.6)',
      note:'trazos SVG en unidades del viewBox; ícono TRK = 1.6 (rejilla 24, remates cuadrados).',
      items:[
        { tok:'--sw-grid',    l:'rejilla de gráfica',  d:.5,  min:.5, max:1,   step:.1, u:'', kind:'num', x:{min:.2,max:1.5}, sel:'.sw-grid' },
        { tok:'--sw-ref',     l:'línea de referencia', d:1,   min:.5, max:1.5, step:.1, u:'', kind:'num', x:{min:.3,max:2},   sel:'.sw-ref' },
        { tok:'--sw-data',    l:'dato',                d:1.4, min:1.2,max:2,   step:.1, u:'', kind:'num', x:{min:.8,max:3},   sel:'.sw-data' },
        { tok:'--sw-data-lg', l:'dato grande',         d:1.8, min:1.4,max:2.4, step:.1, u:'', kind:'num', x:{min:1, max:3.5}, sel:'.sw-data-lg' },
        { tok:'--sw-icon',    l:'ícono',               d:1.6, min:1.4,max:2,   step:.1, u:'', kind:'num', x:{min:1, max:2.5}, sel:'.nav a .ic svg' },
        { tok:'--sw-ring-lg', l:'anillo grande',       d:1.4, min:1,  max:2.4, step:.1, u:'', kind:'num', x:{min:.6,max:4},   sel:'.ring.lg .ring-track,.ring.lg .ring-fill' },
        { tok:'--sw-ring-md', l:'anillo mediano',      d:1.8, min:1.2,max:2.8, step:.1, u:'', kind:'num', x:{min:.8,max:4},   sel:'.ring.md .ring-track,.ring.md .ring-fill' }
      ],
      check(vals){ const v = reader(this.items, vals);
        return v('--sw-grid') > v('--sw-data') ? 'la rejilla pesa más que el dato' : null; } },

    // ------------------------------------------------- radios (B-05 v264: una sola familia · todo control a --r-ctl 12)
    { g:'radios', key:'radius', rule:'B-05 · BRAND §9 2026-09-22 ("que parezcan de la misma familia")',
      note:'una sola familia: 0 en reglas y barras · 2 solo en marcas que no se tocan · 4 en marcas de gráfica · 12 en TODO control (botón, campo, celda de la tabla, chip, toggle) · 16 en tarjetas · 12 en lo que flota · 50 % solo en puntos. alias = hoy el token apunta a otro (var()).',
      items:[
        { tok:'--r-sm',    l:'marca que no se toca',   d:2,   min:0, max:2,  step:1, u:'px', kind:'px', x:{min:0, max:6},
          sel:'.frame,.strk-row .cd,.mdtabs .tabind,input[type=range].gslider,.slfc i,.slsw,.wdot' },
        { tok:'--r-mark',  l:'marca de gráfica',       d:4,   min:2, max:6,  step:1, u:'px', kind:'px', x:{min:0, max:6},
          sel:'.cd,.hypno,.ag-blk' },
        { tok:'--r-ctl',   l:'TODO control',           d:12,  min:8, max:16, step:1, u:'px', kind:'px', x:{min:0, max:20},
          sel:'.status .back,.section .meta[data-act],.start,.secondary .b,button.b,button.t,button.cancel,.mmrow select,select.pfsel,#pf_gym,.pfw,.wq,.mdcust input,.mdcust .b,.lact,.restbar a,.footer .abort,.footer .undo,.footer .save,.field input,.field select,.toggles button,.moodpad,.slph input,.slblk input,.sheetbtns .ok,.sheetbtns .cancel,.shimgv,#fa_q,.fa-btns .b,.fa-empty .fa-em-step,.scan-reticle .frame2,textarea.ta,.ag-supp-pop,.hold,.inp,.pick,.fs,.bwchip,.inp-mini,.tselo,.msum-time,.chip,.spc,.wchip,.ag-chip,.chst' },
        { tok:'--radius',  l:'tarjeta',                d:16,  min:12, max:20, step:1, u:'px', kind:'px', x:{min:0, max:30}, dk:'radius',
          sel:'.pfeat,.pthrow,.ptile,.hcal,.card,.grp,.ws-card' },
        { tok:'--r-pill',  l:'píldora · solo barras finas', d:999, min:0, max:999, step:1, u:'px', kind:'px', x:{min:0, max:999},
          presets:[{l:'recta',v:0},{l:'píldora',v:999}],
          sel:'.bar,.wprog,.vbar,.bar>i,.wprog>i,.vbar>i' },
        // v262 · un solo radio para todo lo que flota (look "1": 12); hoja, nav, toast, menús y barra lo siguen como alias
        { tok:'--r-float', l:'todo lo que flota',     d:12,  min:8, max:12, step:1, u:'px', kind:'px', x:{min:0, max:24},
          sel:'.sheet,.nav,.toast,.tsel,.gloss,.savebar,.dragghost' },
        { tok:'--r-sheet', l:'hoja',                   d:12,  min:8, max:12, step:1, u:'px', kind:'px', x:{min:0, max:34}, dk:'sheetR', alias:'--r-float',
          sel:'.sheet' },
        { tok:'--r-nav',   l:'nav',                    d:12,  min:8, max:12, step:1, u:'px', kind:'px', x:{min:0, max:999}, alias:'--r-float',
          presets:[{l:'8',v:8},{l:'12',v:12},{l:'píldora',v:999}], sel:'.nav,.nav a' },
        { tok:'--r-toast', l:'aviso (toast)',          d:12,  min:8, max:12, step:1, u:'px', kind:'px', x:{min:0, max:999}, alias:'--r-float',
          presets:[{l:'8',v:8},{l:'12',v:12},{l:'píldora',v:999}], sel:'.toast' },
        { tok:'--r-pop',   l:'menú flotante',          d:12,  min:8, max:12, step:1, u:'px', kind:'px', x:{min:0, max:20}, alias:'--r-float',
          sel:'.tsel,.gloss' },
        { tok:'--r-bar',   l:'barra flotante',         d:12,  min:8, max:12, step:1, u:'px', kind:'px', x:{min:0, max:20}, alias:'--r-float',
          sel:'.savebar' }
      ],
      check(vals){ const v = reader(this.items, vals), out = [];
        if(v('--r-sm') > 2) out.push('--r-sm es para marcas que no se tocan: 0–2');
        if(v('--r-mark') < 2 || v('--r-mark') > 6) out.push('--r-mark fuera de 2–6');
        if(v('--r-ctl') < 8 || v('--r-ctl') > 16) out.push('todo control comparte --r-ctl: 8–16');
        if(v('--radius') < v('--r-ctl')) out.push('la tarjeta no puede ser menos redonda que el control que envuelve');
        const pl = v('--r-pill'); if(pl > 0 && pl < 999) out.push('--r-pill solo tapa barras finas: 0 o 999');
        const fl = ['--r-sheet','--r-nav','--r-toast','--r-pop','--r-bar'].filter(t => v(t) < 8 || v(t) > 12);
        if(fl.length) out.push('flotante fuera de 8–12: ' + fl.join(' '));
        const f = ['--r-nav','--r-toast','--r-pop','--r-bar'].map(v);
        if(f.some(n => n !== f[0])) out.push('el chrome flotante no comparte un solo radio (--r-float)');
        return out.length ? out.join(' · ') : null; } },

    // ---------------------------------------------------------------- opacidad (B-04 · B-11)
    { g:'opacidad', key:'opacity', rule:'B-04 · B-11',
      note:'la paleta es la opacidad del blanco. Texto nunca bajo --o40, y --o40 sobre #000 ≥ 4.5:1 (desde ~.48). --o35 hacia abajo: líneas y fondos, no texto.',
      items:[
        { tok:'--o70', l:'texto fuerte',        d:.74, min:.7,  max:.8,  step:.01, u:'a', kind:'alpha', rgb:FG, x:{min:.6, max:.9} },
        { tok:'--o60', l:'texto',               d:.66, min:.6,  max:.72, step:.01, u:'a', kind:'alpha', rgb:FG, x:{min:.5, max:.85} },
        { tok:'--o50', l:'texto tenue',         d:.56, min:.52, max:.64, step:.01, u:'a', kind:'alpha', rgb:FG, x:{min:.45,max:.75} },
        { tok:'--o40', l:'piso de texto',       d:.5,  min:.48, max:.56, step:.01, u:'a', kind:'alpha', rgb:FG, x:{min:.4, max:.65} },
        { tok:'--o35', l:'bajo el piso',        d:.46, min:.4,  max:.48, step:.01, u:'a', kind:'alpha', rgb:FG, x:{min:.3, max:.55} },
        { tok:'--o30', l:'glifo apagado',       d:.4,  min:.34, max:.44, step:.01, u:'a', kind:'alpha', rgb:FG, x:{min:.25,max:.5} },
        { tok:'--o20', l:'borde de control',    d:.26, min:.2,  max:.32, step:.01, u:'a', kind:'alpha', rgb:FG, x:{min:.12,max:.4} },
        { tok:'--o12', l:'línea tenue',         d:.1,  min:.08, max:.14, step:.01, u:'a', kind:'alpha', rgb:FG, x:{min:.04,max:.2} },
        { tok:'--o10', l:'fondo apenas',        d:.06, min:.04, max:.08, step:.01, u:'a', kind:'alpha', rgb:FG, x:{min:.02,max:.12} },
        { tok:'--op-press',    l:'presionado',          d:.7,  min:.6, max:.8, step:.01, u:'', kind:'num', x:{min:.4, max:.9},
          sel:'.sgoal:active,.mscrow:active,.strk:active,.line.lnav:active,.stq.u-tap:active' },
        { tok:'--op-disabled', l:'deshabilitado',       d:.4,  min:.3, max:.5, step:.01, u:'', kind:'num', x:{min:.2, max:.6},
          sel:'input[type=range].gslider:disabled' },
        { tok:'--op-pf',       l:'valor sugerido',      d:.45, min:.5, max:.6, step:.01, u:'', kind:'num', x:{min:.3, max:.7},
          note:G3 + ' · es texto: .45 queda bajo el piso --o40 (B-11)', sel:'.inp.pf,.pick.pf' },
        { tok:'--op-drop',     l:'serie drop',          d:.82, min:.7, max:.9, step:.01, u:'', kind:'num', x:{min:.5, max:1},
          sel:'.srow.isdrop,.pair.isdrop' },
        { tok:'--op-dim',      l:'ejercicio fuera de foco', d:.28, min:.2, max:.4, step:.01, u:'', kind:'num', x:{min:.1, max:.6},
          sel:'.wfocus .ex:not(.current)' }
      ],
      check(vals){ const v = reader(this.items, vals), out = [];
        const c = contrast(v('--o40'));
        if(c < 4.5) out.push('--o40 sobre #000 = ' + r2(c) + ':1 (< 4.5)');
        const L = ['--o70','--o60','--o50','--o40','--o35','--o30','--o20','--o12','--o10'];
        for(let i = 1; i < L.length; i++) if(!(v(L[i-1]) > v(L[i]))){ out.push('escalera no monótona en ' + L[i-1] + ' > ' + L[i]); break; }
        return out.length ? out.join(' · ') : null; } },

    // ---------------------------------------------------------------- espaciado (rangos de DESIGN_KNOBS de index.html)
    { g:'espaciado', key:'spacing', rule:'DESIGN_KNOBS (?design)',
      note:'ritmo de página; mismos rangos que el panel ?design. dk = su clave en gymtrk_design (para [importar mis ajustes], solo lectura).',
      items:[
        { tok:'--sp-py',      l:'página · arriba',      d:22, min:6, max:56, step:1, u:'px', kind:'px', x:{min:6, max:56}, dk:'pageY',    sel:'.scroll' },
        { tok:'--sp-px',      l:'página · lados',       d:18, min:6, max:40, step:1, u:'px', kind:'px', x:{min:6, max:40}, dk:'pageX',
          sel:'.scroll,.savebar,.footer,.restbar,.nav,.exshh,.exshv,.toasts' },
        { tok:'--sp-card',    l:'tarjeta · interior',   d:15, min:6, max:30, step:1, u:'px', kind:'px', x:{min:6, max:30}, dk:'cardPad',  sel:'.pfeat,.pthrow,.ex,.card' },
        { tok:'--sp-gap',     l:'separación tarjetas',  d:12, min:2, max:34, step:1, u:'px', kind:'px', x:{min:2, max:34}, dk:'cardGap',  sel:'.newmeal,.wlog,.hcal,.card,.grp' },
        { tok:'--sp-section', l:'separación secciones', d:14, min:2, max:40, step:1, u:'px', kind:'px', x:{min:2, max:40}, dk:'section',
          sel:'.section,.grp-label,.mdhd,.sheet h3,.ws-cardh' },
        { tok:'--sp-field',   l:'campos de formulario', d:12, min:2, max:30, step:1, u:'px', kind:'px', x:{min:2, max:30}, dk:'field',    sel:'.field' },
        { tok:'--sp-row',     l:'filas de lista',       d:12, min:4, max:26, step:1, u:'px', kind:'px', x:{min:4, max:26}, dk:'row',      sel:'.item,.grp .item' },
        { tok:'--sp-sheet',   l:'hoja · interior',      d:18, min:6, max:30, step:1, u:'px', kind:'px', x:{min:6, max:30}, dk:'sheetPad', sel:'.sheet' }
      ] },

    // ---------------------------------------------------------------- vidrio (B-01: solo chrome)
    { g:'vidrio', key:'glass', rule:'B-01 · BRAND §4',
      note:'chrome flotante neutro (nav, hoja, toast, popover). Sin sombra blanda; blur solo en el chrome.',
      items:[
        { tok:'--glass-bg',        l:'fondo',          d:.55, min:.45, max:.7,  step:.01, u:'a',  kind:'alpha', rgb:GL, x:{min:.2, max:.9},  sel:'.glass,.glass-strong' },
        { tok:'--glass-bg-strong', l:'fondo fuerte',   d:.72, min:.6,  max:.85, step:.01, u:'a',  kind:'alpha', rgb:GL, x:{min:.3, max:.95}, sel:'.glass-strong' },
        { tok:'--glass-blur',      l:'desenfoque',     d:18,  min:12,  max:24,  step:1,   u:'px', kind:'px',             x:{min:0,  max:40},  sel:'.glass,.glass-strong' },
        { tok:'--glass-sat',       l:'saturación',     d:1,   min:1,   max:2,   step:.1,  u:'',   kind:'num',            x:{min:.5, max:2.5}, sel:'.glass,.glass-strong' },
        { tok:'--glass-ring',      l:'aro interior',   d:.1,  min:.06, max:.16, step:.01, u:'a',  kind:'alpha', rgb:FG, x:{min:0,  max:.3},  sel:'.glass,.glass-strong' },
        { tok:'--glass-edge',      l:'borde alto',     d:.14, min:.08, max:.2,  step:.01, u:'a',  kind:'alpha', rgb:FG, x:{min:0,  max:.35}, sel:'.glass,.glass-strong' },
        { tok:'--glass-edge-lo',   l:'borde bajo',     d:.06, min:.03, max:.1,  step:.01, u:'a',  kind:'alpha', rgb:FG, x:{min:0,  max:.2},  sel:'.glass,.glass-strong' }
      ],
      check(vals){ const v = reader(this.items, vals), out = [];
        if(v('--glass-bg-strong') < v('--glass-bg')) out.push('el fondo fuerte es más claro que el normal');
        if(v('--glass-edge') < v('--glass-edge-lo')) out.push('borde alto < borde bajo: la luz queda al revés');
        return out.length ? out.join(' · ') : null; } },

    // ---------------------------------------------------------------- movimiento (B-09)
    { g:'movimiento', key:'motion', rule:'B-09',
      note:'el contenido imprime (opacidad + ≤4 px), el chrome se desliza; un movimiento visible por toque; reduced-motion = instantáneo.',
      items:[
        { tok:'--dur-1',      l:'rápido · toque',       d:120, min:80,  max:160,  step:20, u:'ms', kind:'ms', x:{min:0,  max:300},  sel:'.ptile.tap,.dchk.pop,.pairdone.pop' },
        { tok:'--dur-2',      l:'medio · entrar',       d:180, min:140, max:240,  step:20, u:'ms', kind:'ms', x:{min:0,  max:400},
          sel:'.chev,.cell .sub,.cell .cap,.hrow .hchev,.lt .lx,.mchev,.enter,.mdtabs .tabind,.tsel,.modal.in,.modal.out,.modal.out .sheet,.nav a,.nav a .lbl,.bootov,.gloss' },
        { tok:'--dur-3',      l:'lento · chrome',       d:280, min:220, max:360,  step:20, u:'ms', kind:'ms', x:{min:0,  max:600},
          sel:'.ring-track,.ring-fill,.modal.in .sheet,.nav a,.nav a .lbl,.fa-empty .fa-em-step,.fa-empty .fa-em-arr,.scan-reticle.hit .frame2,.scan-reticle.hit .chk,.wstage,.toast,.toast.out' },
        { tok:'--dur-screen', l:'cambio de pantalla',   d:140, min:100, max:200,  step:20, u:'ms', kind:'ms', x:{min:0,  max:400},  sel:'.fadein' },
        { tok:'--mv-1',       l:'desplazamiento',       d:4,   min:0,   max:4,    step:1,  u:'px', kind:'px', x:{min:0,  max:12},   sel:'.enter' },
        { tok:'--dur-hold',   l:'mantener para confirmar', d:900, min:700, max:1200, step:20, u:'ms', kind:'ms', x:{min:400,max:2000}, sel:'.hold' }
      ],
      check(vals){ const v = reader(this.items, vals), out = [];
        if(v('--mv-1') > 4) out.push('desplazamiento > 4 px: el contenido ya no "imprime" (B-09)');
        if(!(v('--dur-1') <= v('--dur-2') && v('--dur-2') <= v('--dur-3'))) out.push('orden roto: dur-1 ≤ dur-2 ≤ dur-3');
        return out.length ? out.join(' · ') : null; } }
  ];

  // se muestran, no se mueven
  K.locked = ['fuente JetBrains Mono', 'pesos 400·700·800', 'escala de espacio --s1…--s8', 'colores semánticos', 'capas z'];
  // utilidades puras para el estudio (contraste en vivo)
  K.contrast = contrast;
  K.num = num;
  window.TRK_KNOBS = K;
})();
