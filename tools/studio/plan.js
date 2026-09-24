// gym//TRK · estudio · //PLAN (tools/studio/plan.js)
// La ruta de la guía (plan aprobado: G0 → G3 → G4) tal como la ve el dueño en la pestaña //PLAN.
// Cada fase: { id, title, version, status, items:[{ id, text, status, proposal?, audit? }] }.
//   status: 'hecho' | 'en curso' | 'por decidir' | 'pendiente'
//   proposal: id de TRK_PROPOSALS (el ítem abre esa propuesta) · audit: ID de la auditoría o meta del auditor.
// Se actualiza en cada entrega: al implementar, el ítem pasa a 'hecho' y la fase lleva su versión.
// Sin datos personales (tools/ es público).
(function(){ 'use strict';
  const P = (id, title, version, status, items) => ({ id, title, version, status, items });
  const I = (id, text, status, extra) => Object.assign({ id, text, status }, extra || {});

  window.TRK_PLAN = {
    updated: '2026-09-23',
    note: 'ruta de la guía: G1 y G2 hechos, F0 y T preparan el estudio; G0 se decide aquí, TS (v267) hornea el "terminal sobrio" y luego vienen primer arranque (v268), cuentas (v269 · v270) y tour (v271). G3 y G4 completan la identidad sin versión fija. Cada entrega borra el CSS de su propuesta y la marca shipped.',
    phases: [

      P('G1', 'guía', null, 'hecho', [
        I('brand', 'BRAND.md: identidad CMD hacker × glass moderno, reglas B-01…B-12 y registro de decisiones', 'hecho'),
        I('ds', 'DESIGN_SYSTEM.md como referencia del estado actual (tokens, roles, fichas, protocolo)', 'hecho'),
        I('rules', 'auditor con reglas R-* y modo --strict contra la línea base', 'hecho', { audit: 'ds-audit --strict' }),
        I('audit', 'auditoría de diseño completa por pantalla (T-01…T-12, M0…M6)', 'hecho'),
      ]),

      P('G2', 'datos y sistema sin cambiar el look', 'v258', 'hecho', [
        I('sess', 'con sesión viva, start / log past / rest / skip no corren; solo resume', 'hecho', { audit: 'M1-01 · R-SESS' }),
        I('resume', 'continuar una sesión pasada ya no la saca del historial; abortar la deja intacta', 'hecho', { audit: 'M3-09' }),
        I('undo', '↩ deshace el último ✓ por su hora y conserva peso/reps/RIR', 'hecho', { audit: 'M2-08' }),
        I('manual', 'registrar manualmente guarda en la comida elegida', 'hecho', { audit: 'M4-08' }),
        I('approx', 'comida aproximada con micros en null y ~ en la retención', 'hecho'),
        I('leaks', 'botones con estilo propio: fugas del navegador 16→0', 'hecho', { audit: 'T-01' }),
        I('scroll', 'cerrar un sheet ya no sube al inicio (reRender)', 'hecho', { audit: 'T-10 · SCROLL 35→0' }),
        I('focus', 'con todo hecho el enfoque se queda en el último ejercicio', 'hecho', { audit: 'M2-02' }),
        I('close', 'cerrar a las HH:MM en gris y sin ■ (guarda, no destruye)', 'hecho', { audit: 'M2-09' }),
      ]),

      P('F0', 'la sesión por recuperar ya no se borra', 'v259', 'hecho', [
        I('pending', 'espejo sin contestar en su propia clave; solo un botón explícito lo borra', 'hecho', { audit: 'P0 latente' }),
        I('queue', 'avisos del arranque en cola: espejo → IndexedDB, nunca uno encima del otro', 'hecho'),
        I('demo', 'las tres rutas de importación rechazan una base de demo', 'hecho'),
        I('radvar', 'R-RAD / R-RADF resuelven los alias de radio desde :root', 'hecho'),
        I('checks', '7 asserts nuevos en el self-check de UI; ds-diff 0 diferencias', 'hecho'),
      ]),

      P('T', 'tokens exactos y el guardia', 'v260', 'hecho', [
        I('lh', 'interlineado --lh-tight/ui/read/share en 38 sitios', 'hecho', { audit: 'R-LH 30→12' }),
        I('op', 'opacidad de estado --op-press/disabled/pf/drop/dim', 'hecho', { audit: 'R-OP 20→10' }),
        I('bw', 'líneas por rol: los 11 --bw-* con su valor de hoy', 'hecho'),
        I('sw', 'trazos --sw-* (gráficas, radar, FC, íconos, anillo)', 'hecho'),
        I('rfloat', 'radio por pieza flotante --r-nav/toast/pop/bar (alias que G3 apunta a --r-float)', 'hecho'),
        I('guard', 'guardia de las vistas previas: almacenamiento en sombra, falla cerrado', 'hecho'),
        I('diff', 'ds-diff detrás del guardia y con más propiedades: 0 diferencias en 57 escenarios', 'hecho'),
        I('font', 'la fuente solo carga 400·700·800', 'hecho', { audit: 'R-FONT 2→0' }),
      ]),

      P('S1', 'estudio', 'v261', 'hecho', [
        I('sw', 'el service worker solo guarda respuestas buenas; sin red, index.html solo para navegar (no para scripts)', 'hecho'),
        I('frames', 'vistas previas de la app real detrás del guardia, 1:1 en el teléfono', 'hecho'),
        I('screens', 'todas las pantallas, hojas y overlays como escenarios, con recorrido', 'hecho'),
        I('data', 'datos: tuyos (solo lectura) · demo · archivo', 'hecho'),
        I('tune', 'controles por rol con rango BRAND y rango explorar', 'hecho'),
        I('proposals', 'propuestas hoy | A | B | C aplicadas a la app real, con medición', 'hecho'),
        I('looks', 'looks guardados con estado, código para pasar de dispositivo y hoja de elección', 'hecho'),
        I('inspect', 'inspector: tocar un elemento → rol, token y dónde se usa', 'hecho'),
        I('zero', 'cero escrituras: monitor de storage y prueba completa con firmas', 'hecho'),
        I('check', 'check.cjs valida propuestas, controles, escenarios, demo, plan y seguridad', 'hecho'),
      ]),

      P('G0', 'decisiones', null, 'por decidir', [
        I('nav', 'nav: texto con > que parpadea y el nombre fijo (23-sep)', 'hecho', { proposal: 'nav' }),
        I('primary', 'primario gym//TRK: bloque invertido de 44 (v267)', 'hecho', { proposal: 'primary' }),
        I('float', 'radio flotante --r-float: 12 (look "1", 22-sep) → 8 con las esquinas de 4 (23-sep)', 'hecho', { proposal: 'float' }),
        I('ring', 'panel del anillo: vidrio sutil (look "1")', 'hecho', { proposal: 'ring' }),
        I('icons', 'set de íconos TRK (share, camera, nav, escáner)', 'por decidir', { proposal: 'icons' }),
        I('boot', 'shader del arranque: matriz de fósforo (look "1")', 'hecho', { proposal: 'boot' }),
        I('field', 'borde de campo editable 1 px --o40 (look "1")', 'hecho', { proposal: 'field' }),
        I('log', 'registrar lo elegido en BRAND §9 y cerrar BRAND §10', 'pendiente'),
        I('point', 'BRAND §4 apunta al estudio (el lab queda como histórico)', 'pendiente'),
      ]),

      P('TS', 'terminal sobrio', 'v267', 'hecho', [
        I('corners', 'esquinas: control y tarjeta a 4, lo que flota a 8 ("4 px, suave")', 'hecho', { proposal: 'corners', audit: 'B-05 · rad (render)' }),
        I('type', 'escala 10·12·14·20·28 y --t-field 16 solo en lo editable ("14 · 20, más compacto")', 'hecho', { proposal: 'type', audit: 'B-04' }),
        I('fields', 'casilla fina: 1 px --o40, sin relleno, 16 px; con foco el borde a --fg', 'hecho', { proposal: 'fields', audit: 'B-11' }),
        I('primary', 'primario de 44 (--h-pri), 800, invertido al presionar', 'hecho', { proposal: 'primary' }),
        I('secondary', 'secundarios [verbo] sin caja; las etiquetas ya no traen sus corchetes', 'hecho', { proposal: 'secondary', audit: 'B-06 · M3-08' }),
        I('toggles', 'opciones sin caja: la elegida [entre corchetes], nada se mueve al elegir', 'hecho', { proposal: 'toggles' }),
        I('fs', 'FS de la tabla: caja fina apagado, celda invertida encendido; DS sin caja; columna 28', 'hecho'),
        I('nav', 'nav de texto: > que parpadea en la activa (--dur-blink, fijo con reduced-motion), sin íconos ni animar el layout; oculta también en histedit', 'hecho', { proposal: 'nav', audit: 'MOTION ↓' }),
        I('glyphs', 'glifos de interfaz desde JetBrains Mono (&text=); ✓ ○ ↩ y ⠿ no existen en la fuente y siguen en la de respaldo', 'hecho', { audit: 'BRAND §10' }),
        I('rad', '_dsRenderCheck cuenta esquinas de contenido más redondas que 4 (rad)', 'hecho', { audit: 'rad' }),
        I('nosplit', 'cuenta nueva sin split: [+ log past session] abre una sesión libre; rest/skip no mueven nada', 'hecho', { audit: 'R-SESS' }),
        I('sandbox', 'falso positivo del sandbox con el almacén vacío', 'hecho'),
      ]),

      P('P1', 'primer arranque', 'v268', 'pendiente', [
        I('onboard', 'formulario de perfil nuevo en el estilo terminal sobrio', 'pendiente'),
        I('spin', 'animaciones de terminal: trkSpin ▖▘▝▗ que cuenta segundos y trkProgress █░', 'pendiente'),
        I('boot', 'arranque "loading gym tracker" en cada apertura, menos de 1 s, se salta tocando', 'pendiente'),
      ]),

      P('AC', 'cuentas', 'v269 · v270', 'pendiente', [
        I('records', 'v269 · capa de registros, sombra en IndexedDB v2 y código muerto', 'pendiente'),
        I('sync', 'v270 · pantallas de cuenta en el estilo nuevo, sync con Supabase y //ACCOUNT', 'pendiente'),
      ]),

      P('TR', 'tour por sección', 'v271', 'pendiente', [
        I('tour', 'tour por sección para cuentas nuevas, con [saltar]; va después de las cuentas y viaja con ellas', 'pendiente'),
      ]),

      P('G3a', 'chrome', null, 'en curso', [
        I('nav', 'nav de texto con > que parpadea (≥44, sin animar columnas, oculta en secundarias) · v267', 'hecho', { proposal: 'nav', audit: 'RADF 9→0' }),
        I('float', '--r-float en nav, sheet, toast, popover y barras · 12 en v262, 8 en v267', 'hecho', { proposal: 'float', audit: 'RADF 9→0' }),
        I('glass', 'vidrio con borde .5 y sin sombra blanda', 'pendiente', { audit: 'GLS-1' }),
        I('pop', '.gloss y .tsel de vidrio como el resto del chrome', 'pendiente'),
        I('abort', '--abort retirado: [abort] en --o60 que pasa a --bad al sostener', 'pendiente'),
        I('motion', 'la nav no anima layout · v267', 'hecho', { audit: 'MOTION ↓' }),
      ]),

      P('G3b', 'formas del contenido', null, 'en curso', [
        I('cards', '.card/.grp/.ptile/.hcal → panel //TÍTULO + regla o caja de 2 px', 'pendiente', { proposal: 'cards', audit: 'RAD 46→0' }),
        I('corners', 'esquinas de contenido: control y tarjeta a 4, flotante a 8 · v267', 'hecho', { proposal: 'corners', audit: 'B-05 · rad' }),
        I('primary', 'primario gym//TRK en .start/.ok/.save, uno por vista · v267', 'hecho', { proposal: 'primary', audit: 'OK ≤1 por plantilla' }),
        I('secondary', 'secundarios como [verbo] · v267', 'hecho', { proposal: 'secondary', audit: 'M3-08' }),
        I('field', 'borde de campo solo en editables · v262', 'hecho', { proposal: 'field' }),
        I('ring', 'panel del anillo de vidrio sutil, sin brillo ni punto al 0 % · v262', 'hecho', { proposal: 'ring', audit: 'M4-03' }),
        I('ringstay', 'el anillo se queda, solo en macros (decidido)', 'pendiente', { proposal: 'keepring' }),
        I('dot', 'punto al 0 % del anillo corregido (ringHTML, shareImage)', 'pendiente', { audit: 'M4-03' }),
      ]),

      P('G3c', 'voz, glifos y color', null, 'pendiente', [
        I('labels', '//etiquetas de sistema en inglés (la lista del estudio) · v262', 'hecho', { proposal: 'english', audit: 'LANG 11→0 · T-05' }),
        I('fieldlbl', 'etiquetas de campo en minúsculas', 'pendiente', { audit: 'VOZ-2' }),
        I('back', '[‹ origen] con state._from y su scroll', 'pendiente', { proposal: 'back', audit: 'T-02 · BRK 1→0' }),
        I('glyphs', 'glifos fuera del set → GLYPHS; 📷 → ícono TRK', 'pendiente', { audit: 'GLY 46→0 · GLYE 4→0 · T-09' }),
        I('green', 'verde solo en el glifo o el número; fresco sin verde · v262', 'hecho', { proposal: 'green', audit: 'T-08 · SEM ↓' }),
        I('recovery', 'recovery ~43 en una línea, sin héroe ni color de veredicto · v262', 'hecho', { proposal: 'recovery', audit: 'T-07 · M5-01' }),
        I('retention', 'retención como fila de diagnóstico solo fuera de rango · v262', 'hecho', { proposal: 'retention', audit: 'M4-01' }),
        I('wordmark', 'marca única gym//TRK · v262', 'hecho', { proposal: 'wordmark', audit: 'M3-13' }),
      ]),

      P('G3d', 'íconos y arranque', null, 'pendiente', [
        I('icons', 'icon(name) reemplaza EXSH_SVG (NAVIC salió en v267: la nav es de texto)', 'por decidir', { proposal: 'icons', audit: 'M2-12' }),
        I('scan', 'ícono TRK del escáner', 'por decidir', { proposal: 'icons' }),
        I('shader', 'shader de fósforo con /max, dpr y resize (sin comprimir) · v262', 'hecho', { proposal: 'boot', audit: 'T-11' }),
        I('rm', 'shader apagado con reduced-motion y al ocultarse', 'pendiente', { audit: 'T-11' }),
        I('lines', 'líneas del arranque impresas una a una', 'pendiente'),
      ]),

      P('G4a', 'interacción', null, 'pendiente', [
        I('hit', '.u-hit: toque de 44 en [comandos]', 'pendiente', { audit: 'T-03 · A11Y-6 · hit 747→meta' }),
        I('floor', 'piso de texto --o40', 'pendiente', { audit: 'T-04 · txt 132→0' }),
        I('opsnap', 'opacidades sueltas a la escalera', 'pendiente', { proposal: 'opacity', audit: 'R-OP ↓' }),
        I('ask', 'textos por defecto de TRKAsk/Hold (nada de ¿seguro?)', 'pendiente', { audit: 'VOZ-5' }),
        I('inline', 'errores en línea dentro del sheet', 'pendiente'),
        I('undo', 'deshacer para registros del día, rest/skip y el deslizar', 'pendiente', { audit: 'M2-07 · M1-03' }),
        I('check', 'toque del ✓ ampliado a 44×42', 'pendiente', { audit: 'M2-06' }),
        I('rows', 'filas TRKLog tocables a 44', 'pendiente', { audit: 'M4-07' }),
      ]),

      P('G4b', 'movimiento y limpieza', null, 'pendiente', [
        I('spinner', 'spinner de texto (pasa a P1 · v268)', 'pendiente'),
        I('bounce', 'fuera los rebotes y las transiciones sueltas', 'pendiente', { audit: 'MOTION ↓' }),
        I('lhsnap', 'interlineados sueltos a la escala --lh-*', 'pendiente', { proposal: 'lh', audit: 'R-LH ↓' }),
        I('dead', 'código muerto: miniBars, updateNowBar, renderShareWeight, agenda', 'pendiente'),
        I('clock', 'fuera el reloj de la barra de estado', 'pendiente', { audit: 'M6-20' }),
        I('design', 'retirar ?design / DESIGN_KNOBS tras importar sus ajustes al estudio', 'pendiente'),
      ]),

      P('G4c', 'honestidad y estados', null, 'pendiente', [
        I('offline', 'estados sin conexión: ⚠ sin conexión · [reintentar]', 'pendiente', { audit: 'M4-09' }),
        I('empty', 'vacíos con su texto exacto y una acción', 'pendiente'),
        I('maint', '~mantenimiento con confianza', 'pendiente', { audit: 'HON-3 · M5-06' }),
        I('minus', 'signo − real en los cambios', 'pendiente'),
        I('radar', 'radar 7.5 px → 10 o barras', 'pendiente', { audit: 'M4-11' }),
        I('e1rm', 'e1RM en lbs sin kg escrito a mano; uni y bi aparte', 'pendiente', { audit: 'M5-04' }),
        I('focusmode', 'señales honestas del modo enfoque', 'pendiente', { audit: 'M2-10 · M2-16' }),
        I('first', 'M0 primer uso', 'pendiente', { audit: 'M0' }),
      ]),
    ],
  };
})();
