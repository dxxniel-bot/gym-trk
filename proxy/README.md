# gym//TRK — AI label proxy (Cloudflare Worker + Gemini)

Lets the app read a nutrition-label photo with AI **without any user putting in a key**.
You (the owner) deploy this once with **one** Gemini key. End users just use the app.

- **Cost:** Google Gemini Flash has a generous **free tier** → ~$0 for normal use.
- **Privacy/abuse:** the Worker only accepts requests from the app's origin, caps image size, and (optionally) rate-limits per IP/day.

---

## 1. Get a free Gemini API key
1. Go to **https://aistudio.google.com/apikey** (sign in with Google).
2. **Create API key** → copy it (starts with `AIza...`).

## 2. Create the Worker (no install needed — dashboard route)
1. Go to **https://dash.cloudflare.com** → sign up (free) → **Workers & Pages** → **Create** → **Create Worker**.
2. Name it e.g. `gymtrk-ai`. Click **Deploy** (the default hello-world), then **Edit code**.
3. Delete the sample, paste the entire contents of **`gymtrk-ai-worker.js`**, click **Deploy**.
4. **Settings → Variables and Secrets → Add → Secret**: name `GEMINI_KEY`, value = your `AIza...` key. **Deploy** again.
5. Copy the Worker URL — looks like `https://gymtrk-ai.<your-subdomain>.workers.dev`.

> Prefer CLI? `npm i -g wrangler` → `wrangler deploy gymtrk-ai-worker.js --name gymtrk-ai` → `wrangler secret put GEMINI_KEY`.

## 3. Point the app at it
In `index.html`, set:
```js
const AI_PROXY_URL='https://gymtrk-ai.<your-subdomain>.workers.dev';
```
Commit + push. Done — the 📷 photo button now uses AI. If `AI_PROXY_URL` is empty, the app falls back to on-device OCR.

## 4. (Optional) rate limit per IP/day
1. **Workers & Pages → KV → Create namespace** (e.g. `gymtrk_rl`).
2. In the Worker → **Settings → Bindings → Add → KV namespace**: variable name **`RL`**, select the namespace. Deploy.
3. The Worker auto-enables a 60 req/IP/day cap (edit `DAILY_IP_LIMIT` in the code).

---

## Test it
```bash
curl -X POST https://gymtrk-ai.<sub>.workers.dev \
  -H 'Origin: https://dxxniel-bot.github.io' \
  -H 'Content-Type: application/json' \
  -d '{"image":"data:image/jpeg;base64,<...>"}'
```
Expect `{"ok":true,"data":{"name":...,"serving":...,"basis":...,"found":[...],"per":{...}}}`.

## Response contract (what the app expects)
```
{ ok:true, data:{
   name:   string,
   serving:string,                        // "30 g" / "1 galleta (28 g)" / "240 ml" / ""
   basis: "serving"|"100g"|"100ml"|"unknown",
   found: string[],                       // nutrients actually printed on the label
   per:  { kcal, protein, carbs, fat, sugar, fiber,   // g (macros), kcal
           sodium, potassium, caffeine,               // mg
           water }                                    // L (≈always 0 from a label)
}}
```
On any failure the Worker returns `{ error: "<reason>" }` with a 4xx/5xx; the app shows a clear message and offers retry / text / manual.
