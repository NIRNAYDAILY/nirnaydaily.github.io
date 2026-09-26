#!/usr/bin/env python3
"""Build the search-engine friendly pages of Nirnay Daily.

Creates one static page for every Bare Act, full Supreme Court judgment, landmark case and
daily edition, plus section index pages and sitemap.xml. Reads only the site's own data files.
Run from the repository root:  python3 tools/build_pages.py
"""
import datetime as dt, html, json, os, re, shutil

SITE = "https://nirnaydaily.github.io"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TODAY = (dt.datetime.utcnow() + dt.timedelta(hours=5, minutes=30)).date()

def P(*a): return os.path.join(ROOT, *a)
def load(p, default=None):
    try:
        with open(P(p), encoding="utf-8") as f: return json.load(f)
    except FileNotFoundError: return default
E = lambda s: html.escape(str(s if s is not None else ""), quote=True)

GA_ID = ""
m = re.search(r'NIRNAY_GA_ID="(G-[A-Z0-9]+)"', open(P("index.html"), encoding="utf-8").read())
if m: GA_ID = m.group(1)

SEAL = ('<svg viewBox="0 0 400 400" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">'
        '<circle cx="200" cy="200" r="185"/><path d="M200 110v170M160 290h80M130 150h140M130 150l-28 60a28 28 0 0 0 56 0L130 150zM270 150l-28 60a28 28 0 0 0 56 0L270 150z"/>'
        '<circle cx="200" cy="118" r="8"/></g></svg>')
CHAT = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
        '<path d="M4 5h16v11H9l-5 4V5z"/><circle cx="11" cy="10" r="2.6"/><path d="M13 12l2.2 2.2"/></svg>')

PAGES = []   # (path, lastmod) for the sitemap

def page(path, title, desc, body, crumbs=(), jsonld=None, lastmod=None):
    """Write /path/index.html. path like 'bare-acts/bns/'."""
    url = SITE + "/" + path
    ld = f'<script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False)}</script>' if jsonld else ""
    crumb_html = ""
    if crumbs:
        parts = ['<a href="/">Nirnay Daily</a>'] + [f'<a href="/{p}">{E(n)}</a>' if p is not None else E(n) for n, p in crumbs]
        crumb_html = '<div class="crumbs">' + " › ".join(parts) + "</div>"
    ga = ""
    if GA_ID:
        ga = (f'<script>window.NIRNAY_GA_ID="{GA_ID}";</script><script src="/assets/analytics.js"></script>')
    doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E(title)} · Nirnay Daily</title>
<meta name="description" content="{E(desc[:300])}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc[:300])}">
<meta property="og:type" content="article">
<meta property="og:url" content="{url}">
<meta property="og:site_name" content="Nirnay Daily">
<meta name="theme-color" content="#6E1E22">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='5' fill='%236E1E22'/%3E%3Cpath d='M12 5v14M8 19h8M5 8h14M5 8l-2 4.5a2 2 0 0 0 4 0L5 8zM19 8l-2 4.5a2 2 0 0 0 4 0L19 8z' stroke='%23F3C46B' stroke-width='1.4' fill='none'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Tiro+Devanagari+Hindi&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/assets/page.css">
{ga}
{ld}
</head>
<body>
<header class="bar"><div class="wrap">
  <a class="brand" href="/">{SEAL}<b>NIRNAY DAILY<span lang="hi">निर्णय</span></b></a>
  <nav aria-label="Sections"><a href="/">Home</a><a href="/updates/">Daily updates</a><a href="/judgments/">Full judgments</a><a href="/landmarks/">Landmark cases</a><a href="/bare-acts/">Bare Acts</a><a href="/careers/">Careers</a></nav>
</div></header>
<main class="wrap">
{crumb_html}
{body}
</main>
<footer><div class="wrap">
  <div><b style="color:#fff;font-family:var(--official);letter-spacing:.08em">NIRNAY DAILY</b> · Daily Indian court judgments and orders, full Supreme Court judgments, landmark cases, Bare Acts and a careers portal for law students.</div>
  <div><a href="/">Home</a> · <a href="/updates/">Daily updates</a> · <a href="/judgments/">Full judgments</a> · <a href="/landmarks/">Landmark cases</a> · <a href="/bare-acts/">Bare Acts</a> · <a href="/careers/">Careers</a></div>
  <div>Summaries are for information only and are not legal advice. Always read the official text before relying on it. Visits are counted with Google Analytics to improve the site; no names or contact details are collected.</div>
</div></footer>
<a class="mitra" href="/?mitra=1">{CHAT}<span>Ask Nirnay Mitra</span></a>
</body>
</html>
"""
    d = P(path); os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f: f.write(doc)
    PAGES.append((path, lastmod or TODAY.isoformat()))

def reflow(t):
    """Join lines broken for justified layout into readable paragraphs (same rules as the site reader)."""
    out, cur = [], ""
    for raw in t.split("\n"):
        l = raw.strip()
        if not l:
            if cur: out.append(cur); cur = ""
            continue
        if not cur: cur = l; continue
        ends = re.search(r'[.:;?!)\]"”’]$', cur); starts = re.match(r'^([A-Z(“"\'‘]|\d+[.)]|\(\w+\))', l)
        if ends and starts and (len(l) < 55 or re.match(r'^(\d+[.)]|\([a-z0-9]+\))', l, re.I) or len(cur) < 60):
            out.append(cur); cur = l
        elif cur.endswith("-") and re.match(r'^[a-z]', l): cur = cur[:-1] + l
        else: cur += " " + l
    if cur: out.append(cur)
    return out

def text_html(pages):
    parts = []
    for i, p in enumerate(pages, 1):
        paras = "".join(f"<p>{E(x)}</p>" for x in reflow(p))
        parts.append(f'<section id="page-{i}"><div class="pg">Page {i} of {len(pages)}</div>{paras}</section>')
    return '<article class="text">' + "".join(parts) + "</article>"

def summary_of(pages, n=280):
    t = " ".join(" ".join(pages[:3]).split())
    return t[:n]

def slugify(s, n=4):
    words = [w for w in re.sub(r"[^a-z0-9 ]", " ", s.lower()).split() if w not in {"the","of","and","v","vs","mr","m","s","smt","shri","sri","anr","ors","others","in","re","a","for","on","to"}]
    return "-".join(words[:n]) or "item"

def iso_from_short(s):
    try: return dt.datetime.strptime(s.strip(), "%d %b %Y").date().isoformat()
    except Exception: return None

def fmt_long(iso):
    try: d = dt.date.fromisoformat(iso); return f"{d.day} {d.strftime('%B %Y')}"
    except Exception: return iso or ""

def clean_dir(name):
    d = P(name)
    if os.path.isdir(d):
        for x in os.listdir(d):
            q = os.path.join(d, x)
            if os.path.isdir(q) and os.path.exists(os.path.join(q, "index.html")): shutil.rmtree(q)
        if os.path.exists(os.path.join(d, "index.html")): os.remove(os.path.join(d, "index.html"))

# ------------------------------------------------------------------ data
ACTS = load("data/bare-acts.json", {"central": [], "maharashtra": []})
LIB = load("data/sc-library.json", {"items": []})
LM = load("data/landmarks.json", {"themes": {}, "items": []})
THEMES = LM.get("themes", {})
lm_by_name = {x["name"]: x for x in LM["items"]}
lib_by_name = {x["name"]: x for x in LIB["items"]}

for d in ["bare-acts", "judgments", "landmarks", "updates", "careers"]: clean_dir(d)

# ------------------------------------------------------------------ Bare Acts
def act_path(a): return f"bare-acts/{a['slug']}/"
for tier, label, jur in [("central", "Central Act", "IN"), ("maharashtra", "Maharashtra State Act", "IN-MH")]:
    for a in ACTS.get(tier, []):
        data = load(a["file"])
        if not data: continue
        pages = data["pages"]
        actno = f"Act No. {a['actNo']} of {a['year']}" if a.get("actNo") else ""
        refs = "".join(f'<span class="ref">{E(r)}</span>' for r in [a.get("short"), actno] if r)
        rep = f'<p class="note"><b>This Act replaced:</b> {E(a["replaces"])}</p>' if a.get("replaces") else ""
        asof = f" · text as on {E(a['asOf'])}" if a.get("asOf") else ""
        body = f"""<div class="kicker">{label} · Bare Act</div>
<h1>{E(a['title'])}</h1>
<div class="refs">{refs}</div>
<div class="meta">{a.get('pages') or len(pages)} pages · Official text from India Code, Government of India{asof}</div>
{rep}
<div class="btns"><a class="btn primary" href="/{E(a['pdf'])}">Download official PDF</a><a class="btn" href="/#a-{E(a['slug'])}">Search inside this Act</a><a class="btn" href="/bare-acts/">All Bare Acts</a></div>
<p class="lead">The full, current text of {E(a['title'])}{' (' + E(a['short']) + ')' if a.get('short') else ''}, as published by the Government on India Code, the official repository of Central and State Acts.</p>
{text_html(pages)}"""
        desc = f"Read the full bare act of {a['title']}{' (' + a['short'] + ')' if a.get('short') else ''}{', ' + actno if actno else ''}. Official latest text from India Code{', as on ' + a['asOf'] if a.get('asOf') else ''}, with PDF download."
        ld = {"@context": "https://schema.org", "@type": "Legislation", "name": a["title"], "legislationIdentifier": actno or a["title"],
              "legislationJurisdiction": jur, "inLanguage": "en", "url": SITE + "/" + act_path(a),
              "isBasedOn": "https://indiacode.gov.in/", "publisher": {"@type": "Organization", "name": "Nirnay Daily"}}
        if a.get("short"): ld["alternateName"] = a["short"]
        page(act_path(a), f"{a['title']}{' (' + a['short'] + ')' if a.get('short') else ''}: Bare Act", desc, body,
             crumbs=[("Bare Acts", "bare-acts/"), (a["title"], None)], jsonld=ld)

def act_list(tier):
    items = sorted(ACTS.get(tier, []), key=lambda a: (a.get("cat") or "", a["title"]))
    out, cat = [], None
    for a in items:
        if a.get("cat") != cat:
            cat = a.get("cat"); out.append(f'<h3 style="margin:18px 0 6px;font:600 12px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)">{E(cat)}</h3>')
        sub = " · ".join(x for x in [a.get("short"), f"Act No. {a['actNo']} of {a['year']}" if a.get("actNo") else "", ("Replaced " + a["replaces"]) if a.get("replaces") else ""] if x)
        out.append(f'<a class="item" style="--c:{"#9E2A2B" if tier=="central" else "#C2610F"}" href="/{act_path(a)}"><h3>{E(a["title"])}</h3><small>{E(sub)}</small></a>')
    return "".join(out)
page("bare-acts/", "Bare Acts of India and Maharashtra (latest official text)",
     f"Free bare acts: {len(ACTS.get('central',[]))} Central Acts including BNS, BNSS, BSA, the Constitution of India, CPC and the Labour Codes, and {len(ACTS.get('maharashtra',[]))} Maharashtra Acts, with official PDFs from India Code.",
     f"""<div class="kicker">Official texts · Latest versions</div><h1>Bare Acts</h1>
<p class="lead">The current text of India's principal Central Acts and of Maharashtra's State Acts, as published by the Government on India Code. Where a new law replaced an old one, only the new law is listed, for example the Bharatiya Nyaya Sanhita, 2023 in place of the Indian Penal Code.</p>
<div class="cols"><section><h2>Central Acts</h2><div class="list">{act_list('central')}</div></section>
<section><h2>Maharashtra Acts</h2><div class="list">{act_list('maharashtra')}</div></section></div>""",
     crumbs=[("Bare Acts", None)])

# ------------------------------------------------------------------ Full judgments
bundles = {}
def judgment_pages(item):
    d = bundles.get(item["file"])
    if d is None: d = bundles[item["file"]] = load(item["file"]) or {}
    if "items" in d: d = d["items"].get(item["slug"], {})
    return d.get("pages") or []
def j_path(item): return f"judgments/{item['slug']}/"
for it in LIB["items"]:
    l = lm_by_name.get(it["name"])
    cits = [c for c in ((l.get("cit") or "").split(" · ") if l else [it.get("citation")]) if c]
    if l and l.get("no"): cits.append(l["no"])
    date = l["d"] if l else it.get("date")
    held = l.get("held") if l else ""
    note = l.get("note") if l else ""
    refs = "".join(f'<span class="ref">{E(c)}</span>' for c in cits)
    meta = " · ".join(x for x in [f"Decided {fmt_long(date)}" if date else "", f"{l['bench']}-judge bench" if l and l.get("bench") else "",
                                   f"{it.get('pages')} pages", "Official text of the Supreme Court of India"] if x)
    if it.get("type") == "img":
        text = f'<p class="note">This judgment is available as scanned pages of the official Supreme Court Reports. <a href="/#j-{E(it["slug"])}">Open the scanned judgment</a>.</p>'
        pages = []
    else:
        pages = judgment_pages(it)
        if not pages: continue
        text = text_html(pages)
    body = f"""<div class="kicker">Supreme Court of India · Full judgment</div>
<h1>{E(it['name'])}</h1>
<div class="refs">{refs}</div>
<div class="meta">{E(meta)}</div>
{f'<p class="lead"><b>Held:</b> {E(held)}</p>' if held else ''}
{f'<p class="note">{E(note)}</p>' if note else ''}
<div class="btns"><a class="btn primary" href="/#j-{E(it['slug'])}">Open in the reader (search, go to page)</a><a class="btn" href="/judgments/">All full judgments</a>{'<a class="btn" href="/landmarks/">Landmark cases</a>' if l else ''}</div>
{text}"""
    desc = (f"Full text of {it['name']}" + (f", {cits[0]}" if cits else "") + (f", decided {fmt_long(date)}" if date else "") +
            ". " + (held or (summary_of(pages) if pages else "")))
    ld = {"@context": "https://schema.org", "@type": "CreativeWork", "name": it["name"], "genre": "Judgment",
          "author": {"@type": "GovernmentOrganization", "name": "Supreme Court of India"}, "url": SITE + "/" + j_path(it), "inLanguage": "en"}
    if date: ld["datePublished"] = date
    if cits: ld["identifier"] = cits
    page(j_path(it), f"{it['name']}" + (f" ({cits[0]})" if cits else "") + ": Full Judgment", desc, body,
         crumbs=[("Full judgments", "judgments/"), (it["name"], None)], jsonld=ld)

def year_of(it):
    l = lm_by_name.get(it["name"]); return (l["y"] if l else int((it.get("date") or "0")[:4] or 0))
lib_sorted = sorted(LIB["items"], key=year_of, reverse=True)
page("judgments/", "Full Supreme Court judgments (official text)",
     f"Read {len(LIB['items'])} full Supreme Court of India judgments free, from Kesavananda Bharati to recent rulings, taken from the Court's official copies.",
     f"""<div class="kicker">Supreme Court of India · Official texts</div><h1>Full judgments</h1>
<p class="lead">The complete text of landmark and recent Supreme Court judgments, taken from the Supreme Court's own copies.</p>
<div class="list">{''.join(f'<a class="item" href="/{j_path(it)}"><h3>{E(it["name"])}</h3><small>{E(" · ".join(str(x) for x in [year_of(it) or "", it.get("citation") or (lm_by_name.get(it["name"],{}).get("cit") or ""), str(it.get("pages"))+" pages"] if x))}</small></a>' for it in lib_sorted)}</div>""",
     crumbs=[("Full judgments", None)])

# ------------------------------------------------------------------ Landmarks
used = set()
def lm_slug(x):
    s = slugify(x["name"].split(" v. ")[0], 3) + f"-{x['y']}"
    base, i = s, 2
    while s in used: s = f"{base}-{i}"; i += 1
    used.add(s); return s
lm_links = {}
for x in LM["items"]:
    lib = lib_by_name.get(x["name"])
    if lib: lm_links[x["name"]] = "/" + j_path(lib); continue
    s = lm_slug(x); path = f"landmarks/{s}/"; lm_links[x["name"]] = "/" + path
    refs = "".join(f'<span class="ref">{E(c)}</span>' for c in ((x.get("cit") or "").split(" · ") + [x.get("no") or ""]) if c)
    src = x.get("src") or ""
    via = x.get("via") or ("Indian Kanoon" if "indiankanoon" in src else "source")
    body = f"""<div class="kicker">Landmark · {E(x['court'])} · {E(THEMES.get(x['t'], ''))}</div>
<h1>{E(x['name'])}</h1>
<div class="refs">{refs}</div>
<div class="meta">{E(x['court'])}{' · ' + (('Single judge' if x.get('bench')==1 else str(x['bench'])+'-member bench')) if x.get('bench') else ''} · Decided {E(fmt_long(x['d']))}</div>
<p class="lead"><b>Held:</b> {E(x['held'])}</p>
{f'<p class="note">{E(x["note"])}</p>' if x.get('note') else ''}
<div class="btns">{f'<a class="btn primary" href="{E(src)}" rel="noopener">Read the judgment ({E(via)})</a>' if src else ''}<a class="btn" href="/landmarks/">All landmark cases</a></div>"""
    ld = {"@context": "https://schema.org", "@type": "CreativeWork", "name": x["name"], "genre": "Judgment", "datePublished": x["d"],
          "author": {"@type": "GovernmentOrganization", "name": x["court"]}, "abstract": x["held"], "url": SITE + "/" + path}
    page(path, f"{x['name']}" + (f" ({(x.get('cit') or x.get('no') or '').split(' · ')[0]})" if (x.get('cit') or x.get('no')) else "") + ": Landmark judgment",
         f"{x['name']}, {x['court']}, {x['y']}. {x['held']}", body, crumbs=[("Landmark cases", "landmarks/"), (x["name"], None)], jsonld=ld)

lm_sorted = sorted(LM["items"], key=lambda x: x["d"])
rows, dec = [], None
for x in lm_sorted:
    d = x["y"] // 10 * 10
    if d != dec: dec = d; rows.append(f"<h2>The {d}s</h2>")
    rows.append(f'<a class="item" href="{lm_links[x["name"]]}"><span class="tag">{E(x["court"])} · {x["y"]}</span><h3>{E(x["name"])}</h3><small>{E(x.get("cit") or x.get("no") or "")}</small></a>')
page("landmarks/", "Landmark judgments of Indian courts",
     f"{len(LM['items'])} landmark judgments of the Supreme Court, High Courts, trial courts and tribunals of India, with citations and what each case held.",
     f"""<div class="kicker">The Library</div><h1>Landmark judgments</h1>
<p class="lead">Landmark decisions of the Supreme Court, High Courts, trial courts and tribunals, arranged by decade, each with its citation and what the court held.</p>
<div class="list">{''.join(rows)}</div>""", crumbs=[("Landmark cases", None)])

# ------------------------------------------------------------------ Daily updates
dig = [e for e in [load("data/digest.json")] + (load("data/digest-archive.json", []) or []) if e]
tri = [e for e in [load("data/tribunals.json")] + (load("data/tribunals-archive.json", []) or []) if e]
tri_by = {iso_from_short((e.get("edition") or {}).get("dateShort", "")): e for e in tri}
def lib_for(it):
    hay = " ".join(str(it.get(k) or "") for k in ("citation", "caseName")).lower()
    for x in LIB["items"]:
        if x.get("origin") == "daily" and any(k and k.lower() in hay for k in x.get("keys", [])): return x
    return None
def story(it, court):
    cite = " · ".join(x for x in [it.get("citation"), it.get("caseNo")] if x)
    fj = lib_for(it)
    name = it.get("caseName") or "Case title not yet reported"
    return f"""<div class="story"><div class="meta">{E(court)} · {E(it.get('date',''))}{' · ' + E(it['tag']) if it.get('tag') else ''}</div>
<h3>{E(name)}</h3>{f'<div class="meta">{E(cite)}</div>' if cite else ''}{f'<div class="meta">Coram: {E(it["coram"])}</div>' if it.get('coram') else ''}
<p><b>{E(it.get('headline',''))}</b></p><p><span class="kind">{E(it.get('kind') or 'Held')}</span>{E(it.get('text',''))}</p>
{f'<p><i>Why it matters:</i> {E(it["why"])}</p>' if it.get('why') else ''}
<div class="src">{f'<a href="/{j_path(fj)}"><b>Read the full judgment</b></a> · ' if fj else ''}{f'<a href="{E(it["src"])}" rel="noopener">Source: {E(it.get("srcName") or "report")}</a>' if it.get('src') else ''}</div></div>"""
ed_list = []
seen = set()
for e in dig:
    ed = e.get("edition") or {}; iso = iso_from_short(ed.get("dateShort", ""))
    if not iso or iso in seen: continue
    seen.add(iso)
    secs, n = [], 0
    for ch in e.get("chapters", []):
        title = {"sc": "Supreme Court of India", "hc": "High Courts", "dc": "District & Sessions Courts"}.get(ch["id"], ch["id"])
        blocks = []
        for p in ch.get("pages", []):
            its = p.get("items") or []
            if not its: continue
            court = "Supreme Court" if ch["id"] == "sc" else (("High Court of " + p["court"]) if ch["id"] == "hc" else "")
            sub = p.get("title") if ch["id"] == "sc" else (("High Court of " + p["court"]) if ch["id"] == "hc" else "")
            if sub: blocks.append(f'<h3 style="margin-top:18px;font:600 13px var(--official);letter-spacing:.1em;text-transform:uppercase;color:var(--stamp)">{E(sub)}</h3>')
            for it in its:
                n += 1; blocks.append(story(it, court or it.get("court", "District court")))
        if blocks: secs.append(f"<h2>{E(title)}</h2>" + "".join(blocks))
    t = tri_by.get(iso)
    if t and t.get("items"):
        secs.append("<h2>Tribunals</h2>" + "".join(story(it, it.get("bench") or it.get("tribunal", "")) for it in t["items"])); n += len(t["items"])
    path = f"updates/{iso}/"
    ed_list.append((iso, ed, n))
    page(path, f"Court judgments and orders of {fmt_long(iso)}",
         f"Nirnay Daily for {ed.get('dateLong') or fmt_long(iso)}: {n} judgments and orders of the Supreme Court, High Courts, district courts and tribunals, with case names, citations and case numbers.",
         f"""<div class="kicker">Nirnay Daily · {E(ed.get('vol',''))}</div><h1>Judgments & orders: {E(ed.get('dateLong') or fmt_long(iso))}</h1>
<p class="meta">{E(ed.get('window',''))}</p>
<div class="btns"><a class="btn primary" href="/#supreme-court">Open the live daily pages</a><a class="btn" href="/updates/">All editions</a></div>
{''.join(secs)}""", crumbs=[("Daily updates", "updates/"), (fmt_long(iso), None)], lastmod=iso)
page("updates/", "Daily judgments and orders of Indian courts",
     "Every Nirnay Daily edition: daily judgments and orders of the Supreme Court, High Courts, district courts and tribunals of India.",
     f"""<div class="kicker">Archive</div><h1>Daily updates</h1><p class="lead">Every edition of Nirnay Daily, newest first.</p>
<div class="list">{''.join(f'<a class="item" href="/updates/{iso}/"><h3>{E(ed.get("dateLong") or fmt_long(iso))}</h3><small>{n} judgments and orders</small></a>' for iso, ed, n in sorted(ed_list, reverse=True))}</div>""",
     crumbs=[("Daily updates", None)])

# ------------------------------------------------------------------ Careers
pool = load("data/careers-pool.json"); car = load("data/careers.json")
src = pool or car
if src:
    secs = [dict(s, items=list(s.get("items") or [])) for s in src.get("sections", [])]
    if pool and car:
        for cs in car.get("sections", []):
            t = next((s for s in secs if s["id"] == cs["id"]), None)
            if not t: continue
            keys = {(x["name"] + "|" + x["org"]).lower() for x in t["items"]}
            t["items"] += [x for x in cs.get("items", []) if (x["name"] + "|" + x["org"]).lower() not in keys]
    def deadline(it): return next((f["iso"] for f in it.get("facts", []) if f.get("iso")), None)
    def status(it):
        d = deadline(it); n = (dt.date.fromisoformat(d) - TODAY).days if d else None
        if n is not None and n < 0: return "closed", "Closed"
        if n is not None and n <= 7: return "soon", "Closing soon"
        s = str(it.get("status", "")).lower()
        if "closing" in s or s == "open": return "open", "Open"
        return "await", it.get("status") or "Awaited"
    rank = {"soon": 0, "open": 1, "await": 2}
    body, total = [], 0
    for s in secs:
        its = sorted([x for x in s["items"] if status(x)[0] != "closed"], key=lambda x: (rank[status(x)[0]], deadline(x) or "9999"))
        if not its: continue
        total += len(its)
        cards = []
        for x in its:
            cls, lab = status(x)
            facts = " · ".join(f"{f['k']}: {f['v']}" for f in x.get("facts", []))
            link = (x.get("links") or [{}])[0]
            elig = re.sub(r"</?b>", "", x.get("eligibility") or "")
            cards.append(f"""<div class="story"><div class="meta"><span class="status {cls}">{E(lab)}</span> {E(x.get('sector',''))}</div>
<h3>{E(x['name'])}</h3><div class="meta">{E(x['org'])}</div><p>{E(elig)}</p><p class="meta">{E(facts)}</p>
{f'<div class="src"><a href="{E(link.get("url"))}" rel="noopener">{E(link.get("label") or "Official notice")} (official site)</a></div>' if link.get('url') else ''}</div>""")
        body.append(f"<h2>{E(s.get('title',''))}</h2>" + "".join(cards))
    page("careers/", "Law jobs, judiciary exams, internships and LLM admissions",
         f"{total} open and upcoming legal opportunities in India for law students and fresh graduates: judiciary exams, government legal jobs, internships, AIBE, CLAT PG and LLM admissions. Checked {fmt_long(TODAY.isoformat())}.",
         f"""<div class="kicker">Careers Portal · checked {E(fmt_long(TODAY.isoformat()))}</div><h1>Law careers: jobs, exams & LLM admissions</h1>
<p class="lead">Open and upcoming opportunities for final-year law students and fresh graduates. Every listing links to the recruiting body's official website. Closed listings are removed automatically.</p>
<div class="btns"><a class="btn primary" href="/#careers">Open the interactive Careers Portal</a></div>{''.join(body)}""",
         crumbs=[("Careers", None)])

# ------------------------------------------------------------------ sitemap
urls = [("", TODAY.isoformat())] + PAGES
with open(P("sitemap.xml"), "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for path, lm in urls:
        f.write(f"  <url><loc>{SITE}/{path}</loc><lastmod>{lm}</lastmod></url>\n")
    f.write("</urlset>\n")
print(f"Built {len(PAGES)} pages; sitemap has {len(urls)} URLs.")
