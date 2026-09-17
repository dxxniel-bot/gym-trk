# gym//TRK · app nativa (iOS + Android)

La MISMA `index.html` de la web, envuelta con **Capacitor 8**, para leer **Salud (iOS / HealthKit)** y
**Health Connect (Android)** con `@capgo/capacitor-health`. La web (GitHub Pages) sigue igual.

- **Nunca `npm install` en I:** (Google Drive). `npm` solo corre en el clon `X:\AI_SYSTEM\projects\gym-trk\repo\native`
  o en GitHub Actions (`scripts/guard-drive.cjs` lo bloquea).
- `ios/`, `android/` y `www/` **se generan en cada build** de CI (`npx cap add` + `scripts/patch-*.sh`); no se versionan.
- `capacitor.config.json`: `iosScheme` / `androidScheme` / `hostname` están **congelados** — cambiarlos cambia el origen
  del WebView y los datos locales "desaparecen".

## Cómo funciona dentro de la app (`index.html`, v222)
- `NATIVE_APP` detecta el cascarón; los plugins se llaman por `Capacitor.Plugins.X` (sin bundler).
- El db se espeja a `Library/db_A.json` / `db_B.json` (alternados); `nativeBoot()` recupera el más nuevo si el WebView
  desalojó localStorage. Exportar abre la hoja de compartir y deja el archivo en **Archivos › gym//TRK**.
- `healthSyncNative()` corre al abrir, al volver a la app (`resume`) y con el botón de **Settings › //SALUD**
  (máx. cada 5 min salvo manual): totales diarios por agregado, sueño por noche (una fuente por noche), entrenos de 14 días
  y FC SOLO alrededor de tus sesiones de las últimas 72 h. Todo entra por `ingestHealth()` (misma capa que la web, v220).
- Sin service worker dentro de la app.

## Pasos del dueño

### 0 · Chequeo sin código (hoy)
iPhone → Salud → Corazón → Frecuencia cardíaca → **Mostrar todos los datos**, en un día que entrenaste:
¿hay filas de **Google Health**? ¿cada cuánto (5 s, 1 min)? ¿son instantes o rangos? ¿cuánto tardaron en aparecer?
Además: Google Health → Conexiones → Apps y servicios → **Apple Health** debe estar conectado.

### 1 · Probe (lo primero que se instala)
1. GitHub → Actions → **native-ios** → Run workflow → `target = probe`.
2. Descarga el artifact (`.ipa`).
3. Instálalo con **Sideloadly** (Windows + iTunes; tu Apple ID gratuito). Ajustes → General → VPN y gestión de
   dispositivos → confía en tu perfil.
4. Abre la app: **1 · pedir permiso** → **2b · FC de tu último entreno** → **3 · sueño**.

**Decisión 1:** si el permiso falla con "Missing com.apple.developer.healthkit entitlement", reinstala con **Impactor**
(open source, Windows). Si tampoco, HealthKit requerirá Apple Developer Program (99 USD/año).
**Decisión 3:** FC por serie solo si el intervalo mediano es ≤ 15 s. Con ~60 s la app muestra solo el resumen de sesión
(ya está programado así). Si salen "muestras agrupadas" hará falta un plugin propio (HKQuantitySeriesSampleQuery).

### 2 · App completa
1. En la PWA: Settings → **export file** (respaldo `.json`).
2. Actions → native-ios → `target = app` → instala encima (mismo bundle id `io.github.dxxnielbot.gymtrk`, mismo Apple ID).
3. En la app: **log in / import file** con ese respaldo. Desde ese día registra solo en la app (dos copias divergen).
4. Settings → //SALUD → **conectar Salud**.

**Decisión 2 (durabilidad):** registra un set, cierra la app a la fuerza, reinicia el teléfono y reinstala el mismo
IPA encima: los datos deben seguir ahí.

La firma gratuita **caduca cada 7 días**: la app no abre, pero los datos se conservan. Sideloadly puede re-firmar solo
si la PC está encendida en la misma red.

### Android
Una sola vez, en X: (o cualquier PC con Java):
```
keytool -genkeypair -v -keystore gymtrk.keystore -alias gymtrk -keyalg RSA -keysize 2048 -validity 10000
```
Guarda la keystore FUERA del repo (y respáldala). En GitHub → Settings → Secrets → Actions crea:
`ANDROID_KEYSTORE_B64` (el archivo en base64), `ANDROID_KEYSTORE_PASS`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASS`.
Luego Actions → **native-android**. El APK se instala directo (orígenes desconocidos). Health Connect limita a 30 días
de historial salvo que concedas "acceso al historial".

## Cuando haya cuentas de pago
- **Apple Developer Program:** firma en CI con API key de App Store Connect → TestFlight; se va la caducidad de 7 días;
  se puede añadir `com.apple.developer.healthkit.background-delivery`. App Store exige etiqueta de privacidad y política.
- **Google Play:** AAB (`bundleRelease`), declaración de apps de salud y justificación por permiso de Health Connect.

## Límites conocidos
- En iOS un permiso de lectura negado se ve igual que "no hay datos" (diseño de Apple) → el log de //SALUD lo advierte.
- HealthKit no deja leer con el teléfono bloqueado → se reintenta al abrir.
- HRV: iOS da SDNN, Android RMSSD (nunca se mezclan). Google Health no manda HRV ni energía basal a Salud.
- Sin Mac no hay Web Inspector para iOS → el log de //SALUD es la herramienta de diagnóstico; en Android `chrome://inspect`.
