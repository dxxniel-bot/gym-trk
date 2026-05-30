# gym//TRK — project context (read me first)

> Single-file PWA gym + nutrition tracker. **Live:** https://dxxniel-bot.github.io/gym-trk/
> **Repo:** https://github.com/dxxniel-bot/gym-trk (branch `main`) · **Local (XboxL):** `X:\freelance\gym-trk\`
> Owner: dxxniel. Status: **deployed & functional, in active development.**

This file is the continuity anchor — a new chat opened in this folder should read it first.
Deeper project state / design history also lives in Obsidian: `G:\My Drive\AI_SYSTEM\projects\gym-trk\STATE.md` (syncs across machines via Google Drive) and the Figma reference at `G:\My Drive\AI_SYSTEM\imports\topics\fitness-calories-app.md`.

## What it is
A mobile-first web app (works on iPhone via "Add to Home Screen") to log gym workouts + nutrition. Rebuilt from the user's old Expo Go app (`ironLOG`). Aesthetic: **terminal/CLI, monochrome, JetBrains Mono**.

## How to run / deploy
- **Run locally:** static files; serve the folder (e.g. `python -m http.server 4599 -d "X:/freelance/gym-trk"`) and open `http://localhost:4599`. (Earlier sessions used the Claude Code preview server on port 4599.)
- **Deploy:** `git push` to `main` → GitHub Pages auto-rebuilds (~1-2 min). No backend.
- **Continue from another machine (mopo):** `git clone https://github.com/dxxniel-bot/gym-trk`, edit, push.

## Architecture
- **`index.html`** — the ENTIRE app (HTML + CSS + JS inline). Single-page, JS-rendered screens via a `render()` router on `state.screen`. ~all logic here.
- **`manifest.json` + `sw.js`** — PWA (installable + offline). `sw.js` is **network-first** for same-origin (online = latest deploy, offline = cache) — cache name bump (`gymtrk-vN`) forces refresh.
- **`*-prototype.html`** — static design references (superseded by `index.html`; keep for design history).

### Data model (localStorage key `gymtrk_db_v1`)
```
{ version, profile:{username,sex,age,weightKg,heightCm,activity,goal},
  settings:{unit, goals:{kcal,protein,carbs,fat,sodium,potassium,sugar,fiber,water,caffeine}},
  activeGym, gyms[], rotIdx,
  split:{ name, days:[ {id,name,tag,metric,allowFailure, exercises:[{name,muscle,type,machine,unilateral,sets(=defaultcount)}]} ] },
  sessions:[ {id,date,dayId,dayName,gym,type,exercises:[{name,muscle,sets:[{w,r,rir,unit,side,fsOn,extraW,isDrop,done}]}]} ],
  meals:{ 'YYYY-MM-DD':[ {id,time,tag,name,qty, kcal,protein,carbs,fat,sugar,sodium,potassium,fiber,caffeine,water} ] },
  foods:[ {id,barcode,name,brand,serving, per:{...same nutrients per 1 serving}} ] }
```
- **No-data-loss rule:** keep the LS key stable, never clear it, migrate additively in `migrate()`. Editing code never touches LS. `[settings]` has export/import JSON (backup) + "log in" restores from a pasted backup.

### Screens (state.screen)
`landing` (create account / log in) → `onboard` (biometrics → auto-calc goals, Mifflin-St Jeor) → `home` (gym: rotation day, //NEXT, start/rest/skip, //PREV, //STATS) → `workout` (live set logging) · `macros` (kcal ring + macro rings + intake bars + bloat risk + food log) · `progress` (stub) · `settings` (export/import/reset).

### External (client-side, no keys/backend)
- **OpenFoodFacts** — barcode lookup (`/api/v2/product/{code}.json`) + name search (`/cgi/search.pl`). Used for food data. Barcode-not-found → name search → links food to the scanned code in `foods[]`.
- **html5-qrcode** (CDN, lazy) — camera barcode scan.
- **Tesseract.js** (CDN, lazy) — photo→OCR of nutrition labels → `parseNutritionText()`.

## Done
Landing (create/login) · onboarding + auto-calc goals · gym home (rotation, start/rest/skip, prev, stats) · workout logging (muscle-grouped sets table: weight/unit/reps/rir, unilateral R/L pairs, drop set ↓, machine FS, +set/+exercise, mark-done, save→persist→advance rotation, abort) · macros (rings P/C/F, intake bars Na/K/sugar/fiber/water, bloat risk, food log) · food DB (barcode OFF, name search + link-to-code, photo OCR, text parse, manual, verify-before-add, qty, quick re-add) · PWA offline · export/import.

## Pending / next
- **Splits workshop** (view/edit/create splits; currently a seeded default split, `[change split]`/`[schedule]` are stubs/alerts). ← biggest next.
- **`progress`** screen (charts: volume, PRs, bodyweight).
- Refine camera scan / OCR after device testing.
- (Stretch) real cross-device sync/account backend; icons for PWA.

## Design language
Monochrome: bg `#1e1e1e`, frame `#0c0c0c`, text white + opacity scale (`--o50` etc.). JetBrains Mono. `//SECTION` headers (e.g. `//NEXT`/`WORKOUT` = 2-line right-aligned label, 16px ExtraBold 50%, beside the day name 22px). Brackets for actions `[+ set]` `[change gym]`. **Radial rings ONLY for macros (P/C/F)**; everything else linear/text (user-specified). Frame 393×852.
