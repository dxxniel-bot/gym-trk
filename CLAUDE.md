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
- **Bump `sw.js` cache** (`gymtrk-vN`) on every shippable change so devices pick up the new build. Currently at **v6**.
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
`landing` (create account / log in) → `onboard` (biometrics → auto-calc goals, Mifflin-St Jeor) → `home` (gym: rotation day, //NEXT, start/rest/skip, //PREV, //STATS) → `workout` (live set logging) · `macros` (kcal ring + macro rings + intake bars + bloat risk + food log) · `progress` (stub) · `settings` (export/import/reset).

### External (client-side, no keys/backend)
- **OpenFoodFacts** — barcode lookup (`/api/v2/product/{code}.json`) + name search (`/cgi/search.pl`). Barcode-not-found → offers **photo-of-label OCR** (primary) and name search (both link the food to the scanned code in `foods[]`).
- **Quagga2** (`@ericblade/quagga2`, CDN, lazy) — live camera barcode scanner in `openBarcode()`. Auto-starts on modal open, LiveStream `facingMode:environment` @ ideal 1280×720, readers EAN/EAN8/UPC/UPC_E/CODE128, requires 2 consistent reads before accepting. **Replaced html5-qrcode (v5 ZXing → v6 Quagga2)** because neither html5-qrcode nor ZXing detected reliably on iPhone. `closeModal()` calls `Quagga.stop()`.
- **Tesseract.js** (CDN, lazy) — photo→OCR of nutrition labels. `prepImage()` downscales+grayscales+contrasts before OCR; `parseNutritionText()` handles kcal-vs-kJ, comma decimals, g↔mg; verify modal shows raw OCR text for manual correction.

## Done
Landing (create/login) · onboarding + auto-calc goals · gym home (rotation, start/rest/skip, prev, stats) · workout logging (muscle-grouped sets table: weight/unit/reps/rir, unilateral R/L pairs, drop set ↓, machine FS, +set/+exercise, mark-done, save→persist→advance rotation, abort) · **per-gym machine/brand/setup**: in a workout, the machine chip in each exercise header is tappable → modal to edit MARCA + SETUP or mark N/A; stored in `db.machines[gym][exercise]`, swaps with the active gym, "+ machine" placeholder to add on the fly (`openMachineEdit`, `machineRec`, `setMachine`, `exKey`) · macros (rings P/C/F, intake bars Na/K/sugar/fiber/water, bloat risk, food log) · food DB (barcode OFF + **live Quagga2 scanner**, name search + link-to-code, **photo OCR fallback when barcode not found**, text parse, manual, verify-before-add, qty, quick re-add) · PWA offline · export/import.

## Pending / next
- **⚠ OPEN BUG (in progress): barcode scanner not detecting on iPhone.** History: html5-qrcode → ZXing (v5) → Quagga2 (v6), still reported "no detecta" before the v6 Quagga2 switch was tested on-device. **Next step: get the user's on-device diagnosis** — (1) does the camera preview show in the black box? (2) what does the status text say (iniciando / apunta al código / cámara no disponible)? (3) is the barcode sharp or blurry on screen? (4) which product/code. Then pinpoint: permission vs camera-not-starting vs focus/resolution vs decoder. Note: iOS Safari has **no native BarcodeDetector**, so we're stuck with a JS decoder. Candidate fixes if Quagga2 still fails: torch/tap-to-focus, higher res, a "capture frame & decode" still-image path, or `area`-constrained scanning. Camera detection can't be verified in the headless Claude preview (no camera) — only the user's iPhone can confirm.
- **Splits workshop** (view/edit/create splits; currently a seeded default split, `[change split]`/`[schedule]` are stubs/alerts). ← biggest feature next.
- **`progress`** screen (charts: volume, PRs, bodyweight).
- Refine OCR accuracy after device testing.
- (Stretch) real cross-device sync/account backend; icons for PWA. Possible: structured setup fields (seat/back/height) instead of free text; a "view/edit all machines for a gym" screen.

## Design language
Monochrome: bg `#1e1e1e`, frame `#0c0c0c`, text white + opacity scale (`--o50` etc.). JetBrains Mono. `//SECTION` headers (e.g. `//NEXT`/`WORKOUT` = 2-line right-aligned label, 16px ExtraBold 50%, beside the day name 22px). Brackets for actions `[+ set]` `[change gym]`. **Radial rings ONLY for macros (P/C/F)**; everything else linear/text (user-specified). Frame 393×852.
