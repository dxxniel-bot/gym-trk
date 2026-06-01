/**
 * gym//TRK — AI nutrition-label proxy (Cloudflare Worker)
 * --------------------------------------------------------
 * Holds the OWNER's Google Gemini API key (as a secret) so end users never need one.
 * The app POSTs a label photo; this reads it with Gemini vision and returns structured
 * nutrition JSON that maps straight into the app's verify screen.
 *
 * Deploy: see proxy/README.md. Set secret GEMINI_KEY. Optionally bind a KV namespace
 * named RL to enable per-IP daily rate limiting.
 */

const ALLOWED_ORIGINS = [
  'https://dxxniel-bot.github.io',
  'http://localhost:4599',
  'http://127.0.0.1:4599',
];
const MODEL = 'gemini-2.0-flash';      // free-tier, vision-capable
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // ~5MB decoded
const DAILY_IP_LIMIT = 60;             // only enforced if a KV namespace `RL` is bound

const PROMPT = `You are reading a photo of a packaged food's nutrition label. It may be from any country/language ("Informacion Nutrimental", "Nutrition Facts", etc.) and need NOT follow the US format.
Extract the values into the JSON schema. Rules:
- "basis": what the numbers are per. "serving" if the primary column is per portion/serving; "100g" if per 100 g; "100ml" if per 100 ml; else "unknown". If both per-serving and per-100 columns exist, PREFER per-serving and set basis="serving".
- "serving": serving size text exactly as printed (e.g. "30 g", "1 galleta (28 g)", "240 ml"). "" if not shown.
- "per" units: kcal = number; protein/carbs/fat/sugar/fiber in GRAMS; sodium/potassium/caffeine in MILLIGRAMS; water = 0.
  Convert when needed: sodium/potassium given in g -> multiply by 1000 (mg). Energy given only in kJ -> kcal = kJ / 4.184.
- "found": array listing ONLY the nutrient keys actually printed on the label (subset of kcal,protein,carbs,fat,sugar,fiber,sodium,potassium,caffeine). For any nutrient NOT on the label, set its "per" value to 0 and DO NOT include it in "found".
- "name": product name if clearly visible, else "".
- Numbers only in numeric fields (no units, no ranges). If a value is unreadable, use 0 and omit it from "found".
Return ONLY the JSON object.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    serving: { type: 'STRING' },
    basis: { type: 'STRING', enum: ['serving', '100g', '100ml', 'unknown'] },
    found: { type: 'ARRAY', items: { type: 'STRING' } },
    per: {
      type: 'OBJECT',
      properties: {
        kcal: { type: 'NUMBER' }, protein: { type: 'NUMBER' }, carbs: { type: 'NUMBER' },
        fat: { type: 'NUMBER' }, sugar: { type: 'NUMBER' }, fiber: { type: 'NUMBER' },
        sodium: { type: 'NUMBER' }, potassium: { type: 'NUMBER' }, caffeine: { type: 'NUMBER' },
        water: { type: 'NUMBER' },
      },
    },
  },
  required: ['basis', 'found', 'per'],
};

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
    if (req.method !== 'POST') return json({ error: 'method' }, 405, origin);
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: 'origin' }, 403, origin);
    if (!env.GEMINI_KEY) return json({ error: 'misconfigured: no GEMINI_KEY' }, 500, origin);

    // optional per-IP daily rate limit (needs a KV namespace bound as `RL`)
    if (env.RL) {
      const ip = req.headers.get('CF-Connecting-IP') || 'anon';
      const day = new Date().toISOString().slice(0, 10);
      const key = `rl:${day}:${ip}`;
      const n = parseInt((await env.RL.get(key)) || '0', 10);
      if (n >= DAILY_IP_LIMIT) return json({ error: 'rate-limit' }, 429, origin);
      await env.RL.put(key, String(n + 1), { expirationTtl: 90000 });
    }

    let body;
    try { body = await req.json(); } catch { return json({ error: 'badjson' }, 400, origin); }
    const m = /^data:(image\/[\w.+-]+);base64,(.+)$/s.exec(body && body.image || '');
    if (!m) return json({ error: 'noimage' }, 400, origin);
    const mime = m[1], b64 = m[2];
    if (b64.length * 0.75 > MAX_IMAGE_BYTES) return json({ error: 'toobig' }, 413, origin);

    const gReq = {
      contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mime, data: b64 } }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: SCHEMA },
    };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_KEY}`;

    let gr;
    try {
      gr = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gReq) });
    } catch (e) {
      return json({ error: 'fetch-failed', detail: String(e).slice(0, 200) }, 502, origin);
    }
    if (!gr.ok) {
      const t = await gr.text();
      return json({ error: 'upstream ' + gr.status, detail: t.slice(0, 300) }, 502, origin);
    }
    const g = await gr.json();
    const txt = g && g.candidates && g.candidates[0] && g.candidates[0].content
      && g.candidates[0].content.parts && g.candidates[0].content.parts[0]
      && g.candidates[0].content.parts[0].text || '';
    let data;
    try { data = JSON.parse(txt); } catch { return json({ error: 'parse', raw: txt.slice(0, 400) }, 502, origin); }
    return json({ ok: true, data }, 200, origin);
  },
};

function cors(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}
function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) },
  });
}
