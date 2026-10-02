# TRK Biometrics · el Atajo de iOS que se descarga

El iPhone no deja que una web lea Salud. Este atajo lee 7 días de Salud, escribe el texto `trk2` que la app ya entiende
(`parseHealthPaste` en `index.html`) y lo copia al portapapeles. Un dato sin registros se salta (cada tipo va dentro de
un "Si trajo algo") y se copia tras cada tipo: lo leído nunca se pierde por lo que venga después (v292). En la app, `sync biometrics` lo corre y `▶ traer datos`
lo pega. El atajo no abre ninguna página ni manda nada a internet.

## Archivos

| archivo | qué es |
|---|---|
| `build.cjs` | arma el plist del atajo, lo valida y lo corre contra una Salud de mentira |
| `TRK Biometrics.shortcut` (aquí) | el plist XML **sin firmar** que genera `build.cjs` (un iPhone no lo importa así) |
| `sign.cjs` | lo firma con HubSign y deja el firmado en la raíz del repo |
| `../../TRK Biometrics.shortcut` (raíz) | el **firmado** (AEA1); `tools/publish-site.cjs` lo publica en `https://gymtrk.app/TRK%20Biometrics.shortcut` |
| `aea.cjs` | abre un atajo firmado (AEA1 → LZFSE → Apple Archive → plist) para ver qué lleva dentro |
| `plist.cjs` | plist de Apple en node puro: escribir XML, leer XML y binario |
| `test.cjs` | pruebas sin iPhone: el validador, el corredor de mentira, `--check` y `--verify` |
| `fetch-ref.cjs`, `dump.cjs` | bajan y leen atajos públicos de referencia (se guardan fuera del repo) |
| `FUENTES.md` | de qué atajo real salió cada identificador y qué quedó sin confirmar |

## Cambiar el atajo

```
node tools/shortcut/build.cjs            # reescribe el plist y enseña lo que copiaría
node tools/shortcut/sign.cjs             # lo firma (sube SOLO el plist a HubSign) y verifica lo que vuelve
node tools/shortcut/build.cjs --check    # el plist en disco es el de hoy y HP_EXAMPLE de index.html coincide
node tools/shortcut/sign.cjs --verify    # el firmado de la raíz lleva exactamente esas acciones
node tools/shortcut/test.cjs             # todo lo anterior + las roturas a propósito que el validador y el corredor deben ver
```

Si cambia lo que el atajo copia, `build.cjs` imprime el `HP_EXAMPLE` nuevo: se pega en `index.html` (la app prueba con ese
texto que lo lee completo, en `_bioSyncSelfCheck` y `_atajoSelfCheck`). Un tipo de Salud que el iPhone no reconozca se
corrige en `BLOCKS` (arriba de `build.cjs`), se vuelve a firmar y se publica: el usuario no edita nada, reinstala.

El archivo se llama igual que el atajo **a propósito**: el iPhone le pone al atajo importado el nombre del archivo, y la
app lo corre por nombre (`shortcuts://run-shortcut?name=TRK%20Biometrics`). Si se renombra uno, se renombra el otro
(`NAME` en `build.cjs`, `BIO_NAME`/`BIO_FILE` en `index.html`, `SHORTCUT_FILE` en `tools/publish-site.cjs`).

## Enlace de iCloud (un toque)

Solo se crea desde un iPhone que ya tenga el atajo: en Atajos, mantener presionado `TRK Biometrics` → Compartir → Copiar
enlace de iCloud. Ese enlace va en `SHORTCUT_URL` (`index.html`) y pasa a ser el botón `▶ instalar atajo`.

## Lo que solo se puede comprobar en un iPhone

1. Abrir `https://gymtrk.app/?atajo=1` en Safari → `▶ descargar atajo`. **Safari lo guarda como `TRK Biometrics.shortcut.html`**
   (visto en el iPhone del dueño, 2-oct): en Archivos se le cambia el nombre a `TRK Biometrics.shortcut` → tocarlo → sale
   **Agregar atajo**. El atajo toma el nombre del archivo: si queda `… 2.shortcut`, la app no lo encuentra.
2. En la app, `sync biometrics` → `[ya lo tengo]`: se abre Atajos y corre **hasta el final** aunque falte un dato; la
   primera vez pide permiso por cada dato de Salud (una vez por tipo; no se pueden juntar).
3. Volver a la app: aparece `▶ traer datos` → **Pegar** → `✓ Salud · N días` y la lista de qué llegó.
4. En esa lista, qué quedó en `—`. `grasa` y `reposo` son los dos nombres sin confirmar (ver `FUENTES.md`).

## Receta a mano (respaldo, ya no está en la app)

Si el archivo firmado dejara de importarse, el mismo atajo se arma una vez en el iPhone. Por cada dato:
**Buscar muestras de salud** (Tipo; filtro *Fecha de inicio · está en los últimos · 7 días*; pasos y energía con
*Agrupar por: Día*) → **Si** *Muestras de salud* *tiene algún valor* (lo que sigue va adentro, hasta *Agregar a variable*) → **Repetir con cada** → dentro, un **Texto** con la palabra, un espacio, *Fecha de inicio* del
*Elemento de repetición* en formato **ISO 8601** con *Incluir hora*, un espacio y *Valor* (peso y energía añaden un espacio
y *Unidad*; sueño lleva *Fecha de inicio*, *Fecha de finalización* y *Valor*) → **Agregar a variable** `datos` con los
*Resultados de la repetición*. Palabras: `steps` Pasos · `act` Energía activa · `bas` Energía en reposo · `weight` Peso ·
`fat` Porcentaje de grasa corporal · `rhr` Frecuencia cardiaca en reposo · `hrv` Variabilidad de la frecuencia cardiaca ·
`sleep` Sueño. La primera acción es un **Texto** `trk2` agregado a `datos`; las últimas, **Combinar texto** (`datos`, con
*Líneas nuevas*) y **Copiar al portapapeles**. Se llama `TRK Biometrics`.
