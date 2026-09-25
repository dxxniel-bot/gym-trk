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
    updated: '2026-09-24',
    note: 'ruta de la guía: G1 y G2 hechos, F0 y T preparan el estudio; G0 se decide aquí, TS (v267) hornea el "terminal sobrio", P1 (v268) el primer arranque, v269 y v270 (salud por Atajo) lo que pediste el 24-sep, v271 comida y unidades, v272 σ v2 y estado del progreso, v273 split: cómo entrenas (diario, días fijos o rotativo, días sin gym, ciclo real y RIR o RPE), v274 progreso por ejercicio (la bitácora #1, #2, #3… con su gráfica), v275 suplementos con marca, frasco y aviso (cuántas quedan, aviso a una semana, pausa, archivo y volver con otra marca), v276 macros: laboratorio, carrusel y compartir (las versiones del panel en un carrusel, compartir el panel y las propuestas 25 y 26 para elegir la que abre) y v277 alta paso a paso (10 pantallas con [‹ atrás], //SETUP N/10 y [más adelante]; nada se escribe hasta ▶ ir al gym); en el orden que aprobaste siguen cuentas (v278, con los pasos de correo y código al inicio del alta), Pro y anuncios (v279, con el paso del plan de pago) y tour (v280). G3 y G4 completan la identidad sin versión fija. Cada entrega borra el CSS de su propuesta y la marca shipped.',
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
        I('icons', 'set de íconos TRK (share, escáner; la cámara ya es la de video con REC · v269, la nav es de texto · v267)', 'por decidir', { proposal: 'icons' }),
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

      P('P1', 'primer arranque', 'v268', 'hecho', [
        I('onboard', 'perfil nuevo en filas de terminal: clave en minúsculas, > en la fila con foco, casillas de 40, Enter salta al siguiente, vista previa de kcal y proteína ("tosco, todo muy gordo" → sobrio)', 'hecho', { proposal: 'fields' }),
        I('onbsave', 'empezar ya no pisa nada: conserva el perfil y la meta de sueño, escribe goalHist de hoy y el peso solo si lo escribiste', 'hecho'),
        I('spin', 'animaciones de terminal: trkSpin ▖▘▝▗ que cuenta segundos (un solo ticker que se apaga solo) y trkProgress [█▍░] en búsqueda, código de barras, OCR, lectura con IA, //ESPACIO y el toast de tarea; fuera los anillos .spin/.fa-spin', 'hecho', { audit: 'MOTION 10→7 · EXEMPT 31→28' }),
        I('boot', 'arranque "loading gym tracker" en cada apertura: líneas reales impresas una a una, barra y ready▌ en ~1 s; corto sin shader con sesión viva o si abriste hace <30 min; se salta tocando', 'hecho', { proposal: 'boot' }),
        I('z2', 'ningún aviso del arranque se abre debajo del arranque o del recap: la cola espera a que se cierren', 'hecho', { audit: 'Z-2' }),
        I('check', '_v268SelfCheck: barra, ticker que se detiene, cola bajo el arranque y empezar en sandbox', 'hecho'),
      ]),

      P('V269', 'lo que pediste el 24-sep', 'v269', 'hecho', [
        I('mood', 'fuera el ánimo: hoja, tile, fila de //STATS y su peso en recovery (sueño .35 · FC reposo .25 · HRV .20 · carga .25 · comida .15); migrate() borra el dato con foto pre-data2 en IndexedDB ("te había dicho de que quitaras lo del mood")', 'hecho'),
        I('rest', 'rest day = descanso programado: se registra sin mover el split (mañana sigue el mismo día) y se quita con [undo rest] (en inicio: rest today ✓); skip day salta el día del split; los dos con deshacer', 'hecho', { audit: 'R-SESS' }),
        I('ring', 'panel del anillo: sin barra de scroll (el ancho ya no brinca) y reglas a sangre con 16 arriba y abajo; [ver gramos|ver %] a la derecha', 'hecho', { proposal: 'ring' }),
        I('supps', 'cuenta nueva: //SUPPS arriba de las comidas con [+ supp] y ··· → [ignorar por ahora] (vuelve en ajustes)', 'hecho'),
        I('camera', 'serie grabada: cámara de video con punto REC rojo, fija; fuera el 📷', 'hecho', { proposal: 'camera', audit: 'R-GLYE 4→2' }),
        I('progedit', '//PROGRESS en modo widgets: [edit] o mantener 0.5 s, − quitar, ⠿ arrastrar, [+ add], [cancel], ✓ done; se guarda en settings.progLayout y viaja con los respaldos', 'hecho', { proposal: 'progedit' }),
        I('units', 'peso corporal con su propia unidad (kg por defecto) aparte de las pesas del gym: //PROFILE, registro, tile, detalle, throwback y wrap', 'hecho'),
        I('onboard', 'perfil: [‹ atrás], unidades primero, actividad y objetivo en lista con su descripción fija, casillas de 36 y letra de campo 14 app-wide', 'hecho', { proposal: 'fields' }),
        I('check', '_v269SelfCheck: ánimo purgado, recovery sin ánimo, rest/unrest/skip, cámara, widgets de progreso, unidad corporal ida y vuelta', 'hecho'),
      ]),

      P('V270', 'salud por Atajo', 'v270', 'hecho', [
        I('shortcut', 'Atajo de Salud: pega todo de un toque (pasos, peso y grasa, sueño con fases, FC en reposo, HRV, energía) en formato trk2; lo tecleado gana; receta de 7 pasos que explica que aún no somos app nativa ("literalmente todo")', 'hecho'),
        I('stats', '//STATS: health · paste y renglones tocables de 44 (.line.stat.tap)', 'hecho', { audit: 'hit 714→715' }),
        I('check', '_healthPasteSelfCheck: miles, mediana HRV, kJ, lb, grasa, noche sin minutos dobles, texto ajeno, peso tecleado gana, idempotente', 'hecho'),
        I('url', 'SHORTCUT_URL: enlace de iCloud cuando el dueño arme el Atajo una vez en su iPhone', 'pendiente'),
      ]),

      P('V271', 'comida y unidades', 'v271', 'hecho', [
        I('cancel', '[cancel] al loguear ya no agrega el alimento: vuelve a la búsqueda o cierra; alimento nuevo con la fila "guardar en mis alimentos [sí] no" y el primario siempre loguear ("a pesar de que le doy cancelar se me agrega")', 'hecho'),
        I('foodadd', '[+ food] entre corchetes en la cabecera de cada comida, a la derecha del nombre (44 px); fuera la fila del final', 'hecho', { audit: 'hit 715→713' }),
        I('hier', 'jerarquía: el nombre de la comida manda (--t-section 800 --fg) y su total baja a --o70 700', 'hecho'),
        I('macros', 'macros por alimento de vuelta: P · C · F en cada fila con la fuente principal en blanco y negrita, sin color; ~ si es aproximado', 'hecho'),
        I('scroll', '[ver gramos|ver %] y los demás toggles ya no suben hasta arriba (reRender); en % un anillo muestra lo que queda', 'hecho', { audit: 'R-SCROLL toggles 3→0' }),
        I('units', 'duraciones en h y min en toda la app: 5 h 12 min en lugar de 5.2 h (sueño, recuperación, sesión, agenda, recap, export); el descanso sigue en m:ss', 'hecho'),
      ]),

      P('V272', 'σ v2 y estado del progreso', 'v272', 'hecho', [
        I('sigma', 'σ en lugar de T: estímulo por serie según qué tan cerca del fallo (RIR 0 declarado cuenta 0.5, sin 1RM se usan las reps); fuera MEV/MRV y la guía RP ("esa madre realmente no sirve"); bandas por semana 4 · 10 · 20 · 30 (Pelland 2026) con marcas neutras en 10 y 20', 'hecho'),
        I('stimulus', '//STIMULUS y //MUSCLES en σ de 7 días por músculo real: una frase solo si hay algo que mover, color solo en el ⚠, "mucho fallo" una vez arriba si sale en 3 o más músculos', 'hecho'),
        I('diag', 'diagnóstico nuevo: mucho fallo, fallo pesado en básicos, sesión cargada, series de más de 30 reps ("más bien fatiga cardiovascular"), piernas sin recuperar', 'hecho'),
        I('state', 'estado por ejercicio: progresando · estable · estancado · retrocediendo (tendencia del e1RM en 4 a 16 semanas; pocos datos lo dice)', 'hecho'),
        I('fatigue', 'fatiga acumulada: ≥2 ejercicios bajando y carga o fallo altos → se ofrece una semana ligera (5–7 días, −30 a −50 % series, RIR +2); nunca se impone', 'hecho'),
        I('e1rm', 'e1RM honesto: en su unidad real (lbs o placas, ya no "kg" sobre libras), sin drops ni sugerencias, con su línea de estado', 'hecho', { audit: 'M5-04' }),
        I('rir', 'en la sesión, "obj RIR" según la carga relativa en lugar del conteo por zonas; los números de serie ya no se pintan', 'hecho'),
        I('check', 'self-checks: tabla de calibración de σ, estado por ejercicio, diagnóstico y músculos', 'hecho', { audit: 'glyph 67→72 (etiqueta del dueño)' }),
      ]),

      P('V273', 'split: cómo entrenas', 'v273', 'hecho', [
        I('mode', 'cómo entrenas, antes que los días ("antes de todo poner si se entrena a diario… qué días on, qué días off"): //SCHEDULE con modo [diario] · días fijos · rotativo; rotativo con días on 1–6 y off 1–3; días fijos con una rutina o descanso por día de la semana ("todos los lunes se hace esta rutina"), y ahí [skip day] ya no sale', 'hecho'),
        I('blocked', 'días sin gym L M X J V S D en su propia línea ("ningún gimnasio abre los domingos"): cuentan como descanso, no rompen la racha y el pronóstico los salta; en inicio: hoy toca descanso · domingo sin gym · siguiente: mañana · <día> con [entrenar igual] (sin primario)', 'hecho'),
        I('cycle', 'ciclo real y adaptativo ("mi split actual realmente sería un split de ocho días"): 6 días a 3 on / 1 off = 8; tras 3 entrenados seguidos toca descanso y un día sin entrenar ES descanso ("si no se entrena = descanso"); ROTATION · 8 d, +Nd y el .ics con la fecha real; //COVERAGE en sets por semana con ese ciclo', 'hecho'),
        I('effort', 'intensidad RIR o RPE por split ("mi amigo utiliza el RPE"): la sesión congela su escala; RPE F 10 9.5 9 8.5 8 7.5 7 6 5 en dos filas de 44 y se guarda como RIR = 10 − RPE; fallo (F) [sí] no; la etiqueta @ RIR · F se calcula; compartir, historial y export en la escala de la sesión', 'hecho', { audit: '33 self-checks · dsSweep sin cambios' }),
      ]),

      P('V274', 'progreso por ejercicio', 'v274', 'hecho', [
        I('note', 'lo que pediste: "irme a progreso, seleccionar el ejercicio y… ver… un enlistado de… la fecha de la sesión… peso, número de repeticiones e intensidad, y… una gráfica de progreso respecto a ese ejercicio… como… las notas" (las de tu amigo: #1, #2, #3… con fecha y series)', 'hecho'),
        I('screen', 'una pantalla por ejercicio (sin barra de abajo, [‹ back] a donde estabas): //EXERCISE [bi] nombre · tipo · N sesiones · unidad y su línea de estado (progresando · +0.6 %/sem · 6 sesiones en 5 sem); la historia va por nombre + variante, nunca por el id del día: el mismo ejercicio en 3 días del split es UNA historia, y uni ≠ bi', 'hecho'),
        I('chart', 'gráfica e1RM · peso top · volumen en la unidad real del ejercicio, periodos 30D 90D 6M 1A todo (6M por defecto); sin drops ni series en otra unidad; en máquina, polea o smith solo el gym de la última vez ("la línea: solo <gym> · otra máquina no se compara")', 'hecho'),
        I('log', '//LOG numerado, la más nueva arriba: #17 · fecha · día · gym, el ▲% de capacidad y debajo las series como en RECENT (peso×reps y RIR o RPE de esa sesión, drops con ↓); tocar una abre la sesión', 'hecho'),
        I('entries', 'entradas: //EXERCISES en progreso (los de los últimos 60 días · estado · veces · última, [ver todos · N]); //RECORDS, la tile y //STRENGTH de e1RM; catálogo ··· → historial; perfil del ejercicio [historial ›]; en el entreno, tocar el nombre → [historial] [cambiar ejercicio]; en el historial, el nombre de cada ejercicio', 'hecho', { audit: 'filas de 44 · hit 713 igual' }),
        I('check', '_exHistSelfCheck: 2 días del split = una historia, fila vieja sin tipo cuenta como libre, pista de lateralidad, uni ≠ bi, #1 la más vieja, unidad real, drops en texto', 'hecho', { audit: '34 self-checks · glyph 72→87 (etiqueta del dueño)' }),
      ]),

      P('V275', 'suplementos con marca, frasco y aviso', 'v275', 'hecho', [
        I('note', 'lo que pediste: la marca o el producto, "cuántas pastillas… por porción" (p. ej. 2), la frecuencia, "cuántas… trae el frasco", que avise "una semana antes de que se acabe", archivar, pausar o "no lo encontré", y si vuelves al mismo con otra marca, que confirme si cambió la dosis o la presentación', 'hecho'),
        I('brand', 'marca y frasco sin partir la historia: el suplemento sigue siendo el genérico (mismo item → sus tomas, su historial y "tomar X" no se parten); la marca vive en sus productos y el frasco en sus frascos; en el editor, PRODUCTO · FRASCO (opcional): marca (con tus marcas de antes) · producto · presentación (cápsulas, softgels, tabletas, gomitas, polvo, líquido, gotas, spray, crema, otro) · por toma · trae el frasco · lo abriste · quedan hoy', 'hecho'),
        I('stock', 'lo que queda se calcula con tus tomas: lo que trae el frasco − los días con toma (tomada o tarde; saltada no) desde que lo abriste × por toma + tu corrección; los días que alcanza salen de tu periodización; en la lista: "quedan 80 cáps · ~40 d"', 'hecho'),
        I('warn', 'aviso a una semana: "⚠ quedan 10 softgels · ~5 d" o "⚠ se acabó" en la lista, "⚠ ~5 d" en su celda de //SUPPS y, una vez al día al abrir macros, el aviso "⚠ omega-3 · quedan 10 softgels · ~5 d" con [ver] → TODOS (un aviso, no un error: borde --warn, sin ✕); se acabó → [abrí otro frasco], [se acabó · archivar] o [pausar]', 'hecho'),
        I('status', '[más] en lugar de borrar: pausar / archivar · se acabó / archivar · no lo encontré / borrar · con su historial (al final); en TODOS, EN PAUSA y ARCHIVADOS con su motivo, fecha y [reactivar]; cada cambio con [deshacer] exacto; sus tomas y la nutrición de sus días se quedan', 'hecho'),
        I('swap', 'volver con otra marca: si agregas uno que ya estaba en pausa o archivado sale "ya estaba archivado · Norda" → volver con esa marca, con otra (su historial sigue) o crear otro aparte; marca nueva = producto y frasco nuevos, el anterior guarda su dosis y nutrición para los días viejos; si cambió la presentación, lo que va por toma o la dosis, "cambió con la marca nueva" lo lista antes de guardar', 'hecho'),
        I('fixes', 'la invitación de //SUPPS cuenta solo los activos (todo archivado → vuelve); uno agregado mientras ves otro día en macros empieza ese día; el export lista marca, por toma y lo que queda', 'hecho'),
        I('check', '_suppSelfCheck: tarde cuenta y saltada no, 19 días, sin frasco no hay cuenta, aviso a 7 días, se acabó, archivar conserva tomas y nutrición, otra marca cuenta desde su frasco, deshacer exacto, todo archivado → invitación, reactivar', 'hecho', { audit: '35 self-checks · dsSweep sin cambios · stack hit 43→41, editor 41→40' }),
      ]),

      P('V276', 'macros: laboratorio, carrusel y compartir', 'v276', 'hecho', [
        I('note', 'lo que pediste (24-sep): propuestas de barras de progreso y de distribución de los macros, verlas "en un carrusel" dentro del panel (izquierda-derecha) mientras eliges, y una versión para compartir', 'hecho'),
        I('viz', 'una sola función para las versiones (el carrusel, el estudio y la tarjeta): aros (el radar y los 3 anillos de antes) · barras con la meta (142 / 180 g, o % con [ver %]) · medidor de terminal de 12 celdas · reparto por kcal P·4 C·4 F·9 (tres enteros que suman 100) contra la meta en escala de opacidad · tabla hoy / meta / % (más de 105 % en --bad) · dona solo de laboratorio (BRAND §4: el anillo de kcal es la única gráfica circular)', 'hecho'),
        I('carousel', 'carrusel en el panel abierto, en lugar del radar y los anillos: una lámina por versión que deslizas izquierda-derecha (scroll-snap), pestañas de texto de 44 abajo (aros · barras · medidor · reparto · tabla; con movimiento reducido, sin animar), recuerda la última (settings.macroViz) y el carril toma la altura de la lámina a la vista (la más alta dejaba huecos)', 'hecho'),
        I('share', '[share] en macros → compartir: el día · tus comidas / el panel de macros: el anillo de kcal grande (verde o rojo como en la app) y la versión elegida, vertical a su altura, con gym//TRK; copiar texto; la imagen ya pinta barras, reparto, radar y dona', 'hecho'),
        I('labprog', 'laboratorio: 25 macros · progreso (aros · barras · medidor), cada opción con la función de la app y los números de tu día, en el panel y en la tarjeta; lo que elijas viaja en la hoja TRK-PICK y queda como la versión con la que abre el carrusel', 'hecho', { proposal: 'macroprog' }),
        I('labdist', 'laboratorio: 26 macros · distribución (reparto · tabla · dona); la dona solo entra al carrusel si la eliges aquí', 'hecho', { proposal: 'macrodist' }),
        I('check', '_macroVizSelfCheck: el reparto suma 100 (30/42 en el ejemplo), cada versión se pinta, barras en gramos contra la meta, medidor de terminal, tabla con el % de la meta, clave inválida → aros, la dona solo si la eliges y el carrusel trae 5', 'hecho', { audit: '36 self-checks · dsSweep sin cambios · panel abierto: 25 toques chicos en las 5 versiones, como v275' }),
      ]),

      P('V277', 'alta paso a paso', 'v277', 'hecho', [
        I('note', 'lo que pediste: "pantalla por pantalla: usuario → biométricos → objetivo → split (ahora o después) → dieta (ahora o después) → Atajo de Salud → plan de pago", con [‹ atrás] y casillas que cuadren (el formulario de una sola pantalla de v268-v269 era "todo goofy")', 'hecho'),
        I('steps', '10 pantallas, una pregunta cada una: nombre y gym · ¿en qué pesas? (peso corporal y pesas del gym, ANTES del cuerpo) · tu cuerpo (sexo, edad, estatura y peso en tu unidad, con "mantenimiento 2,610 kcal al día" en vivo; ~ mientras sean los de por defecto) · actividad (4 filas con su descripción) · objetivo (3 filas con sus kcal) · cómo entrenas · tu rutina · metas del día · conecta Salud · listo', 'hecho', { proposal: 'fields' }),
        I('chrome', '[‹ atrás] siempre (en el paso 1 vuelve a la entrada), gym//TRK //SETUP 3/10 y la barra [███░░░░░░░], la pregunta en grande y su por qué en una línea; filas de 44 con casilla de 36; las filas de muchas opciones apilan la etiqueta arriba; ▶ seguir abajo, en la zona del pulgar, y [más adelante] en los opcionales', 'hecho', { proposal: 'toggles' }),
        I('train', 'cómo entrenas (lo de v273) antes de la rutina: diario / días fijos / rotativo con días on 1-6 y off 1-3, días sin gym L M X J V S D en su línea, intensidad RIR o RPE con una línea que la explica; la rutina: plantillas o desde cero; las metas: kcal, proteína, carbos, grasa y agua calculadas y editables (lo que cambies se respeta)', 'hecho'),
        I('health', 'conecta Salud: en iPhone explica el Atajo y abre [cómo se arma el Atajo]; en Android, por ahora a mano', 'hecho'),
        I('ready', 'listo: resumen ✓ / — de lo que quedó y ready▌ → ▶ ir al gym (o al editor de split si elegiste desde cero)', 'hecho'),
        I('draft', 'borrador en db.onb: cada toque y tecla se guarda (si la app se cierra, vuelve a su paso); NADA de tu perfil se escribe hasta ▶ ir al gym (perfil, unidades, metas con tus ajustes, goalHist de hoy, el peso del día en kg, el split con su plan y su RIR o RPE); lo que dejaste para después no se escribe; atrás del sistema = un paso atrás', 'hecho'),
        I('owner', 'tú nunca lo ves: migrate() marca hecho el alta de cualquier base con usuario', 'hecho'),
        I('error', 'errores en línea (⚠ peso en lbs, entre 66 y 550): nombre obligatorio; edad 13-99, estatura 120-230 cm y peso revisados en TU unidad', 'hecho'),
        I('bug', 'bug de camino: un comentario // dentro de migrate() (una sola línea) se comía el resto de la función; lo cazó la prueba de la racha y quedó como /* */', 'hecho'),
        I('check', '_onbSelfCheck: quien ya tiene perfil no lo ve, sin nombre no avanza, peso en tu unidad (150 lbs = 68.04 kg), paso N/M y atrás, más adelante en los opcionales, el resumen trae lo elegido, nada se escribe antes de terminar, la meta ajustada se respeta, plantilla + rotativo 3/1 + domingo + RPE → ciclo de 4, lo que dejaste para después no se escribe', 'hecho', { audit: '37 self-checks · dsSweep sin cambios · por paso txt 0' }),
        I('studio', 'estudio: onb:1 … onb:10, onb:error y onboard (retomada en su paso) como usuario nuevo solo en memoria; tu perfil, tu db.onb y tu split vuelven idénticos', 'hecho'),
        I('account', 'los pasos de cuenta (correo + código) entran como pasos 1-2 con v278', 'pendiente'),
        I('plan', 'el paso del plan de pago entra con v279', 'pendiente'),
      ]),

      P('V278', 'cuentas', 'v278', 'pendiente', [
        I('onbacct', 'alta: los pasos de cuenta (correo y código) entran al principio del alta paso a paso', 'pendiente'),
        I('records', 'capa de registros, sombra en IndexedDB v2 y código muerto', 'pendiente'),
        I('sync', 'pantallas de cuenta en el estilo nuevo, sync con Supabase y //ACCOUNT', 'pendiente'),
      ]),

      P('V279', 'Pro y anuncios', 'v279', 'pendiente', [
        I('onbpro', 'alta: el paso del plan de pago (lo último que pediste en el orden del alta)', 'pendiente'),
        I('pro', 'plan Pro y anuncios (cobro en la web primero)', 'pendiente'),
      ]),

      P('V280', 'tour por sección', 'v280', 'pendiente', [
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
        I('fieldlbl', 'etiquetas de campo en minúsculas (el perfil nuevo ya las usa · v268)', 'en curso', { audit: 'VOZ-2' }),
        I('back', '[‹ origen] con state._from y su scroll', 'pendiente', { proposal: 'back', audit: 'T-02 · BRK 1→0' }),
        I('glyphs', 'glifos fuera del set → GLYPHS; el 📷 ya es la cámara de video con REC · v269', 'en curso', { proposal: 'camera', audit: 'GLY 46→0 · GLYE 4→2→0 · T-09' }),
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
        I('lines', 'líneas del arranque impresas una a una (visibilidad, sin movimiento) · v268', 'hecho', { proposal: 'boot' }),
      ]),

      P('G4a', 'interacción', null, 'en curso', [
        I('hit', '.u-hit: toque de 44 en [comandos]', 'pendiente', { audit: 'T-03 · A11Y-6 · hit 747→meta' }),
        I('floor', 'piso de texto --o40', 'pendiente', { audit: 'T-04 · txt 132→0' }),
        I('opsnap', 'opacidades sueltas a la escalera', 'pendiente', { proposal: 'opacity', audit: 'R-OP ↓' }),
        I('ask', 'textos por defecto de TRKAsk/Hold (nada de ¿seguro?)', 'pendiente', { audit: 'VOZ-5' }),
        I('inline', 'errores en línea dentro del sheet', 'pendiente'),
        I('undo', 'deshacer para registros del día, rest/skip (hecho en v269) y el deslizar', 'en curso', { audit: 'M2-07 · M1-03' }),
        I('check', 'toque del ✓ ampliado a 44×42', 'pendiente', { audit: 'M2-06' }),
        I('rows', 'filas TRKLog tocables a 44', 'pendiente', { audit: 'M4-07' }),
      ]),

      P('G4b', 'movimiento y limpieza', null, 'pendiente', [
        I('spinner', 'spinner de texto ▖▘▝▗ y barra de progreso de bloques · v268 (P1)', 'hecho', { audit: 'MOTION 10→7' }),
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
        I('e1rm', 'e1RM en lbs sin kg escrito a mano (unidad real · v272); uni y bi aparte', 'en curso', { audit: 'M5-04' }),
        I('focusmode', 'señales honestas del modo enfoque', 'pendiente', { audit: 'M2-10 · M2-16' }),
        I('first', 'M0 primer uso', 'pendiente', { audit: 'M0' }),
      ]),
    ],
  };
})();
