/* Nirnay Mitra — official-source search (Cloudflare Worker)
   The website's chat box calls this only when a question is not found on Nirnay Daily.
   It asks Claude to search OFFICIAL Indian government / court websites only and
   returns a short plain-English answer with official links.
   Secrets (set by .github/workflows/mitra-worker.yml): ANTHROPIC_API_KEY */

const ALLOWED_ORIGINS = [
  "https://nirnaydaily.in", "https://www.nirnaydaily.in",
  "https://nirnaydaily.github.io",
  "http://localhost:8765", "http://127.0.0.1:8765",
];

/* Official sources. gov.in and nic.in cover every Ministry, court, State and PIB site
   (subdomains are included automatically). The rest are official bodies off those domains. */
const OFFICIAL_SHORT = ["gov.in", "nic.in", "sansad.in", "barcouncilofindia.org", "consortiumofnlus.ac.in", "allahabadhighcourt.in"];
const OFFICIAL_LONG = [ // used only if the short list is rejected by the search tool
  "sci.gov.in", "indiacode.gov.in", "indiacode.nic.in", "egazette.gov.in", "pib.gov.in", "legislative.gov.in",
  "lawmin.gov.in", "ecourts.gov.in", "sansad.in", "prsindia.org", "bombayhighcourt.gov.in", "bombayhighcourt.nic.in",
  "delhihighcourt.nic.in", "mphc.gov.in", "hcraj.nic.in", "highcourtchd.gov.in", "allahabadhighcourt.in",
  "hcmadras.tn.gov.in", "mhc.tn.gov.in", "karnatakajudiciary.kar.nic.in", "hckerala.gov.in", "calcuttahighcourt.gov.in",
  "tshc.gov.in", "aphc.gov.in", "gujarathighcourt.nic.in", "patnahighcourt.gov.in", "orissahighcourt.nic.in",
  "highcourtchhattisgarh.gov.in", "jharkhandhighcourt.nic.in", "ghconline.gov.in", "hphighcourt.nic.in",
  "jkhighcourt.nic.in", "highcourtofuttarakhand.gov.in", "barcouncilofindia.org", "consortiumofnlus.ac.in",
  "maharashtra.gov.in", "nalsa.gov.in", "upsc.gov.in", "lawcommissionofindia.nic.in",
];
const isOfficial = (url) => {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return OFFICIAL_SHORT.some((d) => h === d || h.endsWith("." + d)) ||
           OFFICIAL_LONG.some((d) => h === d || h.endsWith("." + d));
  } catch { return false; }
};

const MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5"]; // fast first; second only if the first is unavailable

const SYSTEM = `You are Nirnay Mitra, the search assistant of Nirnay Daily, an Indian legal information website.
Today is ${"{TODAY}"} (India).
RULES
1. Answer ONLY questions about Indian law, courts, judgments and orders, Acts and rules, government legal notifications, the Bar, legal education, law exams and legal careers, and government (official) matters. For anything else (chit-chat, jokes, coding, homework on other subjects, abuse, random text) reply with exactly: OFFTOPIC
2. Use the web_search tool. It only returns official government and court websites. Base every fact ONLY on what those official pages say. Never use memory for case names, citations, section numbers, dates or holdings, and never invent anything.
3. If the official pages do not answer the question, reply with exactly: NOTFOUND
4. Otherwise answer in plain, simple English (or in Hindi/Marathi if the question is in that language) in at most 110 words: what it is, the key facts (court, case title, date, section, notification number, last date) as the official source states them. No markdown headings, no bullet symbols, no links in the text (links are shown separately). Do not give personal legal advice; you may say what the law or order says.
5. Prefer the newest official document. Old laws: the IPC, CrPC and Evidence Act were replaced on 1 July 2024 by the BNS, BNSS and BSA.`;

const recent = new Map(); // best-effort per-visitor limit (per Worker instance)
function limited(ip) {
  const now = Date.now(), w = 10 * 60 * 1000, max = 15;
  const list = (recent.get(ip) || []).filter((t) => now - t < w);
  list.push(now); recent.set(ip, list);
  if (recent.size > 5000) recent.clear();
  return list.length > max;
}

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
const json = (obj, status, origin) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin) } });

async function callClaude(env, q, domains, model) {
  const today = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" });
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model, max_tokens: 700,
      system: SYSTEM.replace("{TODAY}", today),
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3, allowed_domains: domains, user_location: { type: "approximate", country: "IN", timezone: "Asia/Kolkata" } }],
      messages: [{ role: "user", content: q }],
    }),
  });
}

export function parseReply(data) {
  const blocks = (data && data.content) || [];
  let text = "";
  const cited = [], found = [];
  for (const b of blocks) {
    if (b.type === "text") {
      text += b.text;
      for (const c of b.citations || []) if (c.url) cited.push({ url: c.url, title: c.title || c.url });
    } else if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const r of b.content) if (r.url) found.push({ url: r.url, title: r.title || r.url });
    }
  }
  text = text.replace(/\s+\n/g, "\n").trim();
  const seen = new Set();
  const links = [...cited, ...found].filter((l) => isOfficial(l.url) && !seen.has(l.url) && seen.add(l.url)).slice(0, 4);
  if (/^OFFTOPIC\b/.test(text)) return { status: "offtopic" };
  if (/^NOTFOUND\b/.test(text) || !text) return { status: "notfound", links };
  if (!links.length) return { status: "notfound", links: [] }; // never show an answer without an official source
  return { status: "ok", answer: text.replace(/\*\*/g, "").slice(0, 1200), links };
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    if (request.method === "GET") return json({ ok: true, service: "Nirnay Mitra" }, 200, origin);
    if (request.method !== "POST") return json({ status: "error", error: "Method not allowed" }, 405, origin);
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ status: "error", error: "Not allowed" }, 403, origin);
    if (!env.ANTHROPIC_API_KEY) return json({ status: "error", error: "Search is not configured yet" }, 503, origin);

    let q = "";
    try { q = String((await request.json()).q || ""); } catch {}
    q = q.replace(/\s+/g, " ").trim().slice(0, 300);
    if (q.length < 2) return json({ status: "error", error: "Empty question" }, 400, origin);
    const ip = request.headers.get("CF-Connecting-IP") || "?";
    if (limited(ip)) return json({ status: "error", error: "Too many searches. Please wait a few minutes." }, 429, origin);

    // Same question asked again within a day: answer instantly from cache.
    const key = new Request("https://mitra.cache/" + encodeURIComponent(q.toLowerCase()));
    const cache = caches.default;
    const hit = await cache.match(key);
    if (hit) { const body = await hit.json(); return json({ ...body, cached: true }, 200, origin); }

    let res, domains = OFFICIAL_SHORT, mi = 0;
    for (let tries = 0; tries < 4; tries++) {
      res = await callClaude(env, q, domains, MODELS[mi]);
      if (res.ok) break;
      const err = await res.text();
      if (res.status === 400 && /domain/i.test(err) && domains === OFFICIAL_SHORT) { domains = OFFICIAL_LONG; continue; }
      if ((res.status === 400 || res.status === 404) && /model|tool/i.test(err) && mi + 1 < MODELS.length) { mi++; continue; }
      console.log("Anthropic error", res.status, err.slice(0, 500));
      return json({ status: "error", error: "Official-source search is unavailable right now." }, 502, origin);
    }
    const out = parseReply(await res.json());
    if (out.status !== "offtopic") {
      ctx.waitUntil(cache.put(key, new Response(JSON.stringify(out), { headers: { "Cache-Control": "max-age=86400" } })));
    }
    return json(out, 200, origin);
  },
};
