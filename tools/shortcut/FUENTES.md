# TRK Biometrics · de dónde salió cada identificador del atajo

Regla: nada del atajo se escribió "de memoria". Cada identificador de `build.cjs` se leyó en un atajo público real
(bajado sin firmar con `fetch-ref.cjs` del API de registros de Apple, `https://www.icloud.com/shortcuts/api/records/<id>`)
o en el código de un compilador de atajos que ya firma con HubSign. Lo que no se pudo ver en una acción real está marcado
**sin confirmar** y en `build.cjs` lleva `soft: true` (va después de los confirmados; desde v292 se copia al portapapeles
tras **cada** tipo, así un tipo que detenga el atajo solo se lleva a los que van después de él).

Los atajos de referencia son de sus autores: no están en este repo. Se anota el id, el nombre y qué se leyó.

## Atajos leídos (1-oct-2026)

| clave | id de iCloud | nombre | versión del cliente | cómo se llegó a él |
|---|---|---|---|---|
| EX | `1617296a8c8546b49be47740be2550b3` | Export Daily Health Data | 1050.19 | investigación previa al encargo |
| IC1 | `38adde90a2704f7b871cb9a44527db5d` | Upload Wellness Data | 3218.0.9 | foro de intervals.icu, hilo 86164 |
| IC2 | `68d796ffedb740f7a7949b2f21787a2c` | Save HR and HRV Template | 2302.0.5 | foro de intervals.icu, hilo 86164 |
| HS | `de7b62a33ca74958b1bd7db751a0f294` | Harbor Scale - Health Tracker | 4046.0.2.2 (el cliente más nuevo de los diez) | galería pública |
| SW | `75917e208570424386167a0d6f084de0` | Sleep Widget | 2510.5.1 | galería pública (RoutineHub) |
| LW | `9187073de86341bdbb32e934985a1be1` | Log Weight & Waist | 1184.4.4 | galería pública (RoutineHub) |
| RW | `c2d76de1938e45b5842e13a66bafaa7a` | Record Weight | 1030.13 | galería pública |
| CSV | `e8e6e10725ad430d9b1fd18a460c709b` | Import CSV Weight Fat BMI To Health App | 1305.1.2 | galería pública |
| BT | `6f1a47884ff84ba99b42c242b6bd96fd` | Import Bed Times | 1206.3.2 | galería pública |
| HL | `7eb3dc66536b47c7bc66500f55ddbd87` | Health Sample Logger | 2038.0.1.10 | galería pública (RoutineHub) |

Otras fuentes: **Cherri** (`github.com/electrikmilk/cherri`: `signing.go`, `shortcut.go`, `actions/sharing.cherri`), el
compilador que firma con HubSign; y su incidencia #214 (un atajo firmado por HubSign importado en iOS 27.0.1).

## Acciones

| en `build.cjs` | identificador | parámetros | visto en |
|---|---|---|---|
| Buscar muestras de salud | `is.workflow.actions.filter.health.quantity` | `WFContentItemFilter` (`WFContentPredicateTableTemplate`, `WFActionParameterFilterPrefix` 1, `WFContentPredicateBoundedDate` false), `WFContentItemSortProperty` "Start Date", `WFContentItemSortOrder` "Oldest First", `WFContentItemLimitEnabled` false | EX, IC1, IC2, HS, SW, LW, RW |
| …agrupar por día | `WFHKSampleFilteringGroupBy` "Day", `WFHKSampleFilteringFillMissing` false | | EX, LW (SW agrupa por "Minute" sin unidad) |
| Repetir con cada | `is.workflow.actions.repeat.each` | inicio: `WFInput` (salida "Health Samples"), `GroupingIdentifier`, `WFControlFlowMode` 0 · fin: `GroupingIdentifier`, `WFControlFlowMode` 2, `UUID` (su salida es "Repeat Results") | EX, HS |
| Si (v292) | `is.workflow.actions.conditional` | inicio: `WFInput` = `{Type:"Variable", Variable:<adjunto con la salida>}`, `WFControlFlowMode` 0, `GroupingIdentifier`, `WFCondition` · fin: `UUID`, `GroupingIdentifier`, `WFControlFlowMode` 2 · sin "Si no" (el modo 1 es opcional: IC2 #29–#31, SW #287–#289 y LW #177–#181 no lo llevan) | IC2 #29 (condición **100** sobre la salida de una acción), SW #287 y LW #177 (condición 101 sobre la salida **"Health Samples"** de un Buscar) |
| Texto | `is.workflow.actions.gettext` | `WFTextActionText` (`WFTextTokenString` con `attachmentsByRange`; sin variables, la cadena sola) | EX, SW, LW |
| Agregar a variable | `is.workflow.actions.appendvariable` | `WFInput`, `WFVariableName` | IC1, SW, LW |
| Combinar texto | `is.workflow.actions.text.combine` | `WFTextSeparator` "New Lines", `text` | LW (EX e IC1 lo usan con "Custom"; IC1 parte texto con "New Lines") |
| Copiar al portapapeles | `is.workflow.actions.setclipboard` | `WFInput` | Cherri `actions/sharing.cherri` (`setClipboard(variable value: 'WFInput')`). **No aparece en ninguno de los 10 atajos leídos.** |
| Comentario | `is.workflow.actions.comment` | `WFCommentActionText` | SW, LW, HL, IC2, CSV |

## El "Si trajo algo" (v292)

- `WFCondition` **100** = "tiene algún valor" · **101** = "no tiene ningún valor". Se lee en lo que cada atajo hace adentro:
  IC2 #28–#31 saca la clave `error` de una respuesta y, con 100, la enseña en una alerta "Error"; LW #176–#181 busca el peso y,
  con 101, avisa "It appears no weight measurement have been entered into Apple Health yet" y sale.
- **Una búsqueda de Salud vacía no detiene el atajo**: ese aviso de LW solo puede salir si el atajo sigue corriendo después de
  un Buscar sin resultados. SW #286–#289 hace lo mismo con el sueño (si no hay muestras, busca otra vez con otro filtro).
- `build.cjs` usa el 100 sobre "Health Samples": la combinación de las dos cosas vistas (100 sobre una salida · un Si sobre
  "Health Samples"). Dentro van el Repetir y el Agregar a variable, así ninguno recibe una lista vacía.
- **Lo que NO se pudo ver:** qué acción exacta se le detuvo al dueño con HRV sin datos (no hubo captura). Por eso HRV va al
  final y se copia tras cada tipo: si la búsqueda misma de HRV se detuviera, todo lo demás ya está copiado.
- **Permisos:** Atajos pide el permiso de Salud por tipo, la primera vez que corre cada Buscar. No hay parámetro en el plist
  para pedirlos juntos, y en los atajos leídos cada Buscar lleva exactamente un tipo (36 de 36).

## El filtro

- Tipo: `{Property:"Type", Operator:4, Values:{Enumeration:{Value:<nombre>, WFSerializationType:"WFStringSubstitutableState"}}, Removable:false, Bounded:true}` · EX, IC1, HS.
- **"en los últimos 7 días" es el operador `1001`, no el `1002`.** El encargo decía 1002 (leído de EX), pero 1002 es
  "es hoy" (EX exporta el día de hoy; los valores `Unit`/`Number` que trae son restos). Pruebas: RW filtra el peso con
  `Operator:1001, Values:{Unit:16, Number:30}` (30 días), LW usa 1001 con el número en una variable, HS usa
  `1001` con `{Unit:16, Number:"1"}`, y Cherri (`shortcut.go`) declara `IsToday: 1002`, `Between: 1003` y genera
  `1000`/`1001` para "en los próximos / en los últimos". `Unit:16` = día.
- Se escribe como lo hace el cliente más nuevo que se leyó (HS): `Values:{Unit:16, Number:"7"}`.

## Tipos de Salud (el valor que se guarda es el nombre en inglés, aunque el iPhone esté en español)

| palabra `trk2` | tipo | estado | visto en |
|---|---|---|---|
| `steps` | `Steps` | confirmado | EX (lista de tipos) |
| `act` | `Active Calories` | confirmado | EX, SW |
| `weight` | `Weight` | confirmado | LW, RW |
| `rhr` | `Resting Heart Rate` | confirmado | IC1, SW |
| `hrv` | `Heart Rate Variability` | confirmado | IC1, IC2 |
| `sleep` | `Sleep` | confirmado | SW (acción Buscar con filtro `Value` = "Asleep", "Core", "Deep", "REM") |
| `fat` | `Body Fat Percentage` | **sin confirmar en Buscar** | CSV lo usa en la acción *Registrar muestra* (`WFQuantitySampleType`). Los demás nombres coinciden entre Registrar y Buscar ("Weight", "Sleep", "Heart Rate"), pero no se vio en un Buscar |
| `bas` | `Resting Calories` | **sin confirmar** | ningún atajo leído pide energía en reposo. Se eligió por analogía con `Active Calories` (Atajos dice "Calories" donde la app Salud dice "Energy"). Si el iPhone no lo reconoce, la app marcará `reposo —` y aquí se cambia el nombre |

Un atajo de un repo público que usa `Body Mass` (github.com/alisoltani7596/workout-block-1) **no** se tomó como fuente:
ese XML fue escrito a mano, no exportado de un iPhone.

## Propiedades de cada muestra

`WFPropertyVariableAggrandizement` sobre `Repeat Item` (así lo escribe HS, el cliente más nuevo, y SW):
`Start Date` (EX, HS, SW) · `End Date` (SW) · `Value` (EX, SW, LW) · `Unit` (EX, como acción *Obtener detalles*).
Fecha: `WFDateFormatVariableAggrandizement` con `WFDateFormatStyle` "ISO 8601" y `WFISO8601IncludeTime` true (EX, HS).

## Firma (HubSign)

- `POST https://hubsign.routinehub.services/sign`, JSON `{shortcutName, shortcut}` (`shortcut` = el plist XML). Es lo
  que manda Cherri (`signing.go`). En `GET /sign` hay un formulario público con los mismos dos campos.
- Respuesta del 1-oct-2026: `HTTP 200`, `Content-Type: application/octet-stream`,
  `Content-Disposition: attachment; filename=TRK Biometrics.shortcut`, 26 314 bytes, empieza con `AEA1`.
- **Con el `fetch` de node respondió `HTTP 403` y la página "Just a moment…" de Cloudflare**; con `curl` (sin cambiarle
  nada) respondió el archivo. Por eso `sign.cjs` usa `curl`. Si un día `curl` también recibe el reto, no se rodea.
- Qué devolvió, abierto con `aea.cjs`: un Apple Archive con `Shortcut.wflow`; la suma SHA-256 del contenido coincide;
  cadena de firma `Apple System Integration CA 4 ← Apple Root CA - G3`; **las 49 acciones (v287; 77 desde v292) son idénticas a las enviadas**.
  Lo único que cambió el firmante: `WFWorkflowClientVersion` "3218.0.9" → "1505.3" (su Mac es más vieja; lo mismo que
  reporta la incidencia #214 de Cherri).
- El certificado de quien firma vence el 26-oct-2027. No se sabe si un archivo firmado deja de importarse después.
- El lector de `aea.cjs` se comprobó contra un atajo firmado en una Mac de verdad (el de workout-block-1): 56 acciones,
  las mismas que su XML, y la suma del contenido coincide.

## El nombre

El iPhone le pone al atajo importado **el nombre del archivo** (un PR de `hankberger/iPhoneAutomations` lo dice igual:
"the file is named after the shortcut, so it imports under that name"). La app lo corre por nombre
(`shortcuts://run-shortcut?name=TRK%20Biometrics`), así que el archivo publicado se llama `TRK Biometrics.shortcut`
(en la URL, `TRK%20Biometrics.shortcut`) y no `trk-biometrics.shortcut`. `shortcuts://import-shortcut?url=` solo acepta
enlaces de icloud.com (mismo PR): por eso se instala bajando el archivo.

## Lo que no se pudo probar sin un iPhone

1. Que iOS 26/27 importe el archivo firmado por HubSign (hay un reporte ajeno de que sí, en iOS 27.0.1).
2. Que cada tipo devuelva datos con el iPhone en español, sobre todo `Resting Calories` y `Body Fat Percentage`.
   Y que un tipo SIN datos (HRV en el iPhone del dueño) se salte sin detener nada (v292).
3. Que `shortcuts://run-shortcut` abra Atajos desde la app instalada en la pantalla de inicio.
4. Cómo escribe el iPhone cada valor (separador decimal, unidad, nombre de la fase del sueño). `parseHealthPaste` ya lee
   las variantes en español de México, de España y en inglés.
