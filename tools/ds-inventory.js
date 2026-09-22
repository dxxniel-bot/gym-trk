// gym//TRK · inventario en pantalla (BRAND.md §8, DESIGN_SYSTEM.md §18)
// Lo que tools/ds-audit.cjs (estático) no puede ver: el estilo REAL pintado. Se pega en la consola de la app abierta
// (o se inyecta con la herramienta de navegador) con el respaldo real cargado y `localStorage.gymtrk_design` borrado
// (los ajustes de ?design=1 alteran las medidas). Mide a 393×852 y 375×812.
//
//   await dsSweep()          → { pantalla: {ua, hit, txt, fsOff, blur, glyph, samples} }  (usa _dsRenderCheck de la app)
//   dsInventory()            → inventario detallado de la pantalla actual (tamaños, colores→token, radios, bordes,
//                              sombras, blur, tracking, animaciones, glifos, toques <44) — el de la auditoría 2026-09-21
//   await dsSweep({inv:true})→ lo mismo por pantalla, con el inventario detallado
//
// ⚠ Solo en el preview (localhost) con una copia del respaldo: el recorrido abre una sesión de prueba y pantallas de
// edición; nunca lo corras en el teléfono con los datos reales.
//
// Los conteos `render` de tools/ds-baseline.json salen de dsSweep(); `--strict` del auditor no los mide (son de
// navegador), así que se comparan a mano o con este mismo script antes/después de cada fase.
(function(){
  const W=ms=>new Promise(r=>setTimeout(r,ms));
  window.dsInventory=function(){
    const app=document.getElementById('app'), R=document.documentElement, probe=document.createElement('div'); document.body.appendChild(probe);
    const toRGB=v=>{ probe.style.color=''; probe.style.color=v; return getComputedStyle(probe).color; };
    const TOK=['--fg','--o70','--o60','--o50','--o40','--o35','--o30','--o20','--o12','--o10','--line','--border','--bg','--card','--card2','--sheet-bg','--track','--faint','--fill','--on-fill','--good','--bad','--warn','--info'];
    const cmap={}; TOK.forEach(n=>{ const v=getComputedStyle(R).getPropertyValue(n).trim(); if(v){ const k=toRGB(v); if(!cmap[k])cmap[k]=n; } }); probe.remove();
    const cname=c=>(!c||c==='rgba(0, 0, 0, 0)'||c==='transparent')?null:(cmap[c]||('RAW '+c));
    const inc=(o,k)=>{ o[k]=(o[k]||0)+1; }, cls=e=>e.tagName.toLowerCase()+(e.classList&&e.classList.length?'.'+[...e.classList].slice(0,2).join('.'):'');
    const A={fs:{},fw:{},color:{},bg:{},radius:{},border:{},shadow:{},backdrop:{},ls:{},anim:{},trans:{},glyph:{},smallTap:[],n:0};
    [...app.querySelectorAll('*')].filter(e=>{ const r=e.getBoundingClientRect(); return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'; }).forEach(e=>{ const cs=getComputedStyle(e); A.n++;
      const txt=[...e.childNodes].filter(n=>n.nodeType===3&&n.nodeValue.trim()).map(n=>n.nodeValue).join('');
      if(txt){ inc(A.fs,cs.fontSize); inc(A.fw,cs.fontWeight); inc(A.color,cname(cs.color)); if(cs.letterSpacing!=='normal')inc(A.ls,cs.letterSpacing);
        for(const ch of txt){ if(ch.charCodeAt(0)>126&&!/[áéíóúñüÁÉÍÓÚÑ¿¡·—–×]/.test(ch))inc(A.glyph,ch); } }
      const b=cname(cs.backgroundColor); if(b)inc(A.bg,b);
      if(cs.borderRadius&&cs.borderRadius!=='0px')inc(A.radius,cs.borderRadius);
      ['Top','Right','Bottom','Left'].forEach(s=>{ const w=cs['border'+s+'Width']; if(w!=='0px'&&cs['border'+s+'Style']!=='none')inc(A.border,w+' '+(cname(cs['border'+s+'Color'])||'?')); });
      if(cs.boxShadow!=='none')inc(A.shadow,cs.boxShadow.slice(0,60));
      const bf=cs.backdropFilter||cs.webkitBackdropFilter; if(bf&&bf!=='none')inc(A.backdrop,bf);
      if(cs.animationName!=='none')inc(A.anim,cs.animationName+' '+cs.animationDuration+(cs.animationIterationCount==='infinite'?' ∞':''));
      if(cs.transitionDuration&&cs.transitionDuration!=='0s')inc(A.trans,cs.transitionProperty.slice(0,30)+' '+cs.transitionDuration);
      if(e.matches('button,a,input,select,textarea,[data-act],[role=button],[role=tab]')&&!e.parentElement.closest('button,[data-act]')){ const r=e.getBoundingClientRect(); if((r.width<44||r.height<44)&&A.smallTap.length<200)A.smallTap.push(cls(e)+' '+Math.round(r.width)+'x'+Math.round(r.height)); } });
    const top=(o,n)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n||14).map(([k,v])=>k+'×'+v).join(' | ');
    return {n:A.n, fs:top(A.fs), fw:top(A.fw), color:top(A.color,16), bg:top(A.bg,10), radius:top(A.radius,10), border:top(A.border,8), shadow:top(A.shadow,6), backdrop:top(A.backdrop,4), ls:top(A.ls,8), anim:top(A.anim,8), trans:top(A.trans,8), glyph:top(A.glyph,25), smallTap:A.smallTap.slice(0,24), smallTapN:A.smallTap.length}; };
  // pantallas y hojas del recorrido (mismo orden que la auditoría 2026-09-21); cada una se abre y se mide
  window.dsSweep=async function(opt){ opt=opt||{}; const out={}, errs={};
    const measure=()=>{ const r=(typeof _dsRenderCheck==='function')?_dsRenderCheck():{}; return opt.inv?Object.assign(r,{inv:dsInventory()}):r; };
    const S=async(name,fn)=>{ try{ try{ closeExShare(); }catch(_){} try{ closeModal(); }catch(_){} await W(220); await fn(); await W(420); out[name]=measure(); }catch(e){ errs[name]=String(e).slice(0,160); } };
    const ss=(db.sessions||[]).filter(s=>s.type!=='rest'), last=ss[ss.length-1], days=Object.keys(db.meals||{}).filter(k=>(db.meals[k]||[]).length).sort(), food=days[days.length-1];
    const hadLive=!!db.activeWork, liveBak=hadLive?JSON.stringify(db.activeWork):null;
    await S('home',async()=>{ go('home'); });
    await S('macros',async()=>{ go('macros'); state.macroDate=food; render(); });
    await S('sheet:foodadd',async()=>{ openFoodAdd(); });
    await S('progress',async()=>{ go('progress'); });
    await S('sheet:metric-steps',async()=>{ window._mdRange=30; openMetricDetail('steps'); });
    await S('sheet:streak',async()=>{ openStreakSheet(); });
    await S('sheet:sleeplog',async()=>{ openSleepLog(); });
    await S('sheet:rhrlog',async()=>{ openHealthNumLog('rhr'); });
    await S('history',async()=>{ go('history'); });
    if(last)await S('histedit',async()=>{ state._histSessId=last.id; go('histedit'); });
    await S('settings',async()=>{ go('settings'); });
    await S('stack',async()=>{ go('stack'); });
    await S('splitedit',async()=>{ go('splitedit'); });
    await S('share:food',async()=>{ state.shareType='food'; state.macroDate=food; go('share'); });
    if(last)await S('share:session',async()=>{ state.shareType='session'; state.shareId=last.id; go('share'); });
    // la sesión en vivo se mide con una sesión de prueba que NO se guarda (se restaura lo que hubiera)
    const _save=save; try{ save=()=>true;
      await S('workout',async()=>{ if(!db.activeWork)db.activeWork=newWorkSession(); go('workout'); });
      await S('popup:exshare',async()=>{ openExShare(0); });
    } finally { save=_save; try{ closeExShare(); }catch(_){} db.activeWork=hadLive?JSON.parse(liveBak):null; go('home'); }
    if(Object.keys(errs).length)console.warn('dsSweep errores', errs);
    return out; };
})();
