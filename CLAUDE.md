# gym//TRK — project context (read me first)

> Single-file PWA gym + nutrition tracker. **Live:** https://dxxniel-bot.github.io/gym-trk/
> **Repo:** https://github.com/dxxniel-bot/gym-trk (branch `main`) · **Local (XboxL):** `X:\freelance\gym-trk\`
> Owner: dxxniel. Status: **deployed & functional, in active development.**

This file is the continuity anchor — a new chat opened in this folder should read it first.
Deeper project state / design history also lives in Obsidian: `G:\My Drive\AI_SYSTEM\projects\gym-trk\STATE.md` (syncs across machines via Google Drive) and the Figma reference at `G:\My Drive\AI_SYSTEM\imports\topics\fitness-calories-app.md`.

## What it is
A mobile-first web app (works on iPhone via "Add to Home Screen") to log gym workouts + nutrition. Rebuilt from the user's old Expo Go app (`ironLOG`). Aesthetic: **terminal/CLI, monochrome, JetBrains Mono**.

## How to run / deploy
- **Run locally:** static files; serve the folder and open the port. On **mopo** the repo is cloned at `G:\My Drive\AI_SYSTEM\projects\gym-trk\repo\` and there's a `.claude/launch.json` (one dir up) that serves it via `python -m http.server 4599 -d repo` for the Claude Code preview. On XboxL it was `X:\freelance\gym-trk\`.
- **Deploy:** `git push` to `main` → GitHub Pages auto-rebuilds (~1-2 min). No backend. **The iPhone is the test field** — camera/PWA need HTTPS, so always commit+push to deploy; localhost isn't enough for on-device testing.
- **Bump `sw.js` cache** (`gymtrk-vN`) on every shippable change so devices pick up the new build. Currently at **v47**.
- **Git identity** (set locally in the clone): `dxxniel-bot <dxxniel-bot@users.noreply.github.com>`. Commit directly to `main` (that IS the deploy flow — don't branch).
- **Continue from another machine:** `git clone https://github.com/dxxniel-bot/gym-trk` (or `git pull` in the existing clone), edit, push.

## Architecture
- **`index.html`** — the ENTIRE app (HTML + CSS + JS inline). Single-page, JS-rendered screens via a `render()` router on `state.screen`. ~all logic here.
- **`manifest.json` + `sw.js`** — PWA (installable + offline). `sw.js` is **network-first** for same-origin (online = latest deploy, offline = cache) — cache name bump (`gymtrk-vN`) forces refresh.
- **`*-prototype.html`** — static design references (superseded by `index.html`; keep for design history).

### Data model (localStorage key `gymtrk_db_v1`)
```
{ version, profile:{username,sex,age,weightKg,heightCm,activity,goal},
  settings:{unit, goals:{kcal,protein,carbs,fat,sodium,potassium,sugar,fiber,water,caffeine}},
  activeGym, gyms[], rotIdx,
  machines:{ '<gymName>':{ '<exerciseNameLower>':{brand,setup,na} } },   // per-gym machine/brand/setup linking; falls back to split's machine default
  split:{ name, days:[ {id,name,tag,metric,allowFailure, exercises:[{name,muscle,type,machine,unilateral,sets(=defaultcount)}]} ] },
  sessions:[ {id,date,dayId,dayName,gym,type,exercises:[{name,muscle,machine,setup,sets:[{w,r,rir,unit,side,fsOn,extraW,isDrop,done}]}]} ],
  meals:{ 'YYYY-MM-DD':[ {id,time,tag,name,qty, kcal,protein,carbs,fat,sugar,sodium,potassium,fiber,caffeine,water} ] },
  foods:[ {id,barcode,name,brand,serving, per:{...same nutrients per 1 serving}} ] }
```
- **No-data-loss rule:** keep the LS key stable, never clear it, migrate additively in `migrate()`. Editing code never touches LS. `[settings]` has export/import JSON (backup) + "log in" restores from a pasted backup.

### Screens (state.screen)
`landing` → `onboard` → `home` (gym: rotation w/ ‹›day picker, //NEXT, start/rest/skip, log-later, **//VOLUME** weekly-sets-per-muscle vs MEV/MAV/MRV, //STATS) · `workout` (live logging + bg duration; log-later mode = backdated + date/dur + advance-rotation toggle) · `macros` (kcal ring + macro rings w/ g⇄% & logged⇄remaining toggles + intake bars + bloat + food log w/ per-item P/C/F + per-meal totals + tap-to-detail) · `splitedit` (rename/add/remove days & exercises, edit exercise) · `history` (past sessions → view/edit/delete) · `settings` (//PROFILE editable, //TRAINING, //DATA export/import) · `progress` (stub).
Gym stats helpers: `weeklySets(days)`, `VOL_LANDMARKS` (RP MEV/MAV/MRV), `volStatus()`, `isHardSet()` (RIR≤4), `e1rmTrend()` (Epley, not yet surfaced). Top-lift & raw-volume removed on purpose.
Native-feel: viewport `maximum-scale=1,user-scalable=no`, body `position:fixed`, inputs `font-size:16px`, frame fills screen `@media(max-width:440px)`.

### External (client-side, no keys/backend)
- **OpenFoodFacts** — barcode lookup (`/api/v2/product/{code}.json`) + name search (`/cgi/search.pl`). Barcode-not-found → offers **photo-of-label OCR** (primary) and name search (both link the food to the scanned code in `foods[]`).
- **Live barcode scanner** (`openBarcode()` → `startScan()`) — MFP-style: tap scan → camera opens immediately with center reticle overlay → auto-detects → found→`openVerify` (forward), not-found→`openRegisterMenu(code)` (register, barcode linked). **Architecture = live preview + background still-frame decode** (the key fix — Quagga LiveStream and `BarcodeDetector` both fail on iOS Safari): we own the `<video>` via `getUserMedia` (`facingMode:environment` 1280×720), then a loop every ~360 ms grabs the current frame to an offscreen canvas (center band, ~62% height, downscaled ≤1000 px) and decodes it **as a still image** — `BarcodeDetector.detect(canvas)` if available (Android/desktop, faster ~170 ms), else `Quagga.decodeSingle({src:canvas.toDataURL()})` (reliable on iOS). A `decoding` mutex serializes decodes so the loop and the manual button never run Quagga concurrently. **On hit:** `navigator.vibrate(55)` + green lock-on animation (`.scan-reticle.hit` → green frame `bcpop` + `✓` `bcchk`, scan line hidden) so the user can lower the phone, ~430 ms pause, then `doLookup`. **📷 capturar** button = thorough full-res decode of the *current preview frame* via `decodeImgSrc()` (multi-patch `decodeSingle`), or a file photo (`decodeBarcodeImage`) if no live camera — no longer ignored, since there's no running LiveStream to collide with. Manual numeric entry is the last fallback. `window._scanner={stream,video,timer}`; `stopScan()`/`closeModal()` clear the timer + stop tracks so the camera light goes off on close. **Replaced html5-qrcode (v5 ZXing → v6 Quagga2 LiveStream → v47 still-frame decode)** because live detection never worked reliably on iPhone.
- **Tesseract.js** (CDN, lazy) — photo→OCR of nutrition labels (FALLBACK when AI proxy off). `prepImage()` preps image; `parseNutritionText()` handles kcal-vs-kJ, comma decimals, g↔mg.
- **AI label reading (Gemini via Cloudflare Worker)** — `proxy/gymtrk-ai-worker.js` holds the OWNER's one Gemini key (free tier) so users need no key. App: `AI_PROXY_URL` const (empty ⇒ falls back to OCR), `aiPhoto()` POSTs a compressed JPEG dataURL → proxy → structured nutrition → verify; `labelPhoto()` routes to AI if configured else OCR; `fileToDataURL/sanitizePer/labelFallback`. To enable: deploy the Worker (see `proxy/README.md`), set `AI_PROXY_URL`. Verified via mocked proxy in preview. **NOTE: the AI schema returns the OLD per-serving shape and will be upgraded together with the canonical food-model refactor (below).**

## Done
Landing (create/login) · onboarding + auto-calc goals · gym home (rotation, start/rest/skip, prev, stats) · workout logging (muscle-grouped sets table: weight/unit/reps/rir, unilateral R/L pairs, drop set ↓, machine FS, +set/+exercise, mark-done, save→persist→advance rotation, abort) · **per-gym machine/brand/setup**: in a workout, the machine chip in each exercise header is tappable → modal to edit MARCA + SETUP or mark N/A; stored in `db.machines[gym][exercise]`, swaps with the active gym, "+ machine" placeholder to add on the fly (`openMachineEdit`, `machineRec`, `setMachine`, `exKey`) · macros (rings P/C/F, intake bars Na/K/sugar/fiber/water, bloat risk, food log) · food DB (barcode OFF + **live Quagga2 scanner**, name search + link-to-code, **photo OCR fallback when barcode not found**, text parse, manual, verify-before-add, qty, quick re-add) · PWA offline · export/import.

## Pending / next
- **✅ DONE (v25/v26) — canonical per-100 food model (math correctness).** Implemented + verified (porción=130, envase=1040, ×2=2080; legacy migration reproduces printed values; OFF/AI map to per100). **v26: split REGISTER vs LOG (user-required).** `openVerify`=REGISTER screen (name + porción size + macros-per-serving + envase/piezas; NO unit/qty) → "continuar → loguear" → `openLog`=LOG screen (unit `<select>` + qty + live totals). Saved foods (`pickfood`)→`openLog` directly; `editmeal`→`openLog` (meal items store `_food`+`_unit` for exact re-edit). `commitLog` replaces commitFood; `readRegister` builds canonical food (per-serving→per100). Below = the shipped design for reference.
  - **Store:** `food = { base:'g'|'ml', per100:{kcal,protein,carbs,fat,sugar,fiber,sodium(mg),potassium(mg),caffeine(mg)}, sizes:{serving?,piece?,container?}(grams/ml), servingLabel?, name, brand, barcode }`. (No `water` in per100 — for liquids, volume L = grams/1000 at log time.)
  - **Log = MyFitnessPal style:** unit dropdown built from `sizes` → `porción (30 g)` / `pieza` / `envase (240 g)` / `100 g` / `g`(or ml) + a qty field; grams = qty × unitGrams; nutrients = per100 × grams/100.
  - **UX RULE (user-required): the unit/serving is ALWAYS a `<select>` of default options — never free-typed.** The only typed fields are numbers (qty + the gram/ml size values), all `type="number" inputmode="decimal"` so the keyboard is numeric. No character-typing for units → no parse errors. Verified helpers: `gramsForUnit(food,unitKey)`, `foodUnits(food)`→[{key,label,grams}], `computeNutrients(food,unitKey,qty)`, `normalizeExtract(d)`→{base,per100,sizes,servingLabel} (converts whatever basis the label printed into per100 using serving_g / container_g; sets warnGrams when grams unknown).
  - **Touches (interlocking — do as one coherent, preview-verified change):** `mapProduct` (OFF→per100), `openVerify`+`readVerify` (base toggle + per100 inputs + size fields + live "por porción / envase total" readouts), `commitFood`, the pick-food→log path (add the unit dropdown), `aiPhoto`+Worker schema (extract basis, serving_g, serving_label, piece_g, pieces_per_container, container_g, servings_per_container, values; app normalizes), OCR/text/manual producers. **Migrate** legacy `foods[]` (`per`+`serving` string) via a `per100Of(food)` compat accessor; existing meal items already store absolute values so macros/totals are unaffected.
  - Was deliberately NOT rushed in the AI-proxy turn to avoid breaking the laptop's recent serving/liquid rework.
- **Splits workshop** (view/edit/create splits; currently a seeded default split, `[change split]`/`[schedule]` are stubs/alerts).
- Barcode scanner is now **photo-capture + `Quagga.decodeSingle`** (laptop v8, replaced flaky live scan) — confirm reliability on device.
- **`progress`** screen (charts: volume, PRs, bodyweight).
- Refine OCR accuracy after device testing.
- (Stretch) real cross-device sync/account backend; icons for PWA. Possible: structured setup fields (seat/back/height) instead of free text; a "view/edit all machines for a gym" screen.

## Design language
Monochrome: bg `#1e1e1e`, frame `#0c0c0c`, text white + opacity scale (`--o50` etc.). JetBrains Mono. `//SECTION` headers (e.g. `//NEXT`/`WORKOUT` = 2-line right-aligned label, 16px ExtraBold 50%, beside the day name 22px). Brackets for actions `[+ set]` `[change gym]`. **Radial rings ONLY for macros (P/C/F)**; everything else linear/text (user-specified). Frame 393×852.
