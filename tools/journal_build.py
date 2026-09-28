#!/usr/bin/env python3
"""Build the Nirnay Daily Monthly Journal.

  python3 tools/journal_build.py 2026-09 [--ig OUT.html]

Reads  data/journal/<month>.json   (articles written by the editor; see SCHEMA below)
Adds   the month's numbers from tools/journal_stats.py (saved into the JSON the first time, so
       a re-build later shows the same figures even after archives are trimmed)
Writes journal/<month>.html        (newspaper page on the website)
       journal/index.html          (list of all issues)
       --ig OUT.html               (1080x1350 Instagram slides, rendered to PNG by journal_render.js)

SCHEMA of data/journal/<month>.json  – LAW CONTENT ONLY (nothing about the website)
{ "month":"2026-09", "issue":"Vol. I · No. 1", "published":"2026-10-01",
  "lead":{"kicker":"Landmark Judgment · Supreme Court","headline":"…","deck":"…","body":["para", …],   # the month's top ruling
          "cases":[{"name":"X v. Y","note":"citation · bench · date","src":"url"}]},
  "articles":[{"section":"Landmark Judgment · Supreme Court","landmark":true,"headline":"…","body":["para", …],
               "cases":[{"name":"X v. Y","note":"one line","src":"url"}]}, …],      # ordered by importance
  "policy":[{"cat":"Legislature","region":"All India","headline":"…","text":"…","src":"url","srcName":"…"}],
  "briefs":[{"court":"…","caseName":"…","note":"one sentence","src":"url"}] }
Careers & openings are filled automatically from data/careers-pool.json (official sources) – do not write them.
Slides: cover (lead) → one slide per article in the given order → Law & Policy → Careers & openings → month in numbers →
pictographs → In Brief → back slide with email and Instagram only.
"""
import json, os, sys, html, calendar, glob, importlib.util

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
E = lambda s: html.escape(str(s if s is not None else ""), quote=True)
IG = "https://www.instagram.com/nirnay_daily_/"
MAIL = "nirnaydaily@gmail.com"
# categorical palette (validated: lightness, chroma, CVD, contrast on #FBF7EF)
C_SC, C_HC, C_DC = "#9E2A2B", "#1F6FA8", "#B7791F"
RAMP = ["#F4E3DD", "#E6B8AE", "#D48A7E", "#B85750", "#9E2A2B", "#6E1A1C"]  # sequential, one hue

spec = importlib.util.spec_from_file_location("js", P("tools", "journal_stats.py"))
js = importlib.util.module_from_spec(spec); spec.loader.exec_module(js)

ICON = {
 "gavel": '<path d="M14 3l7 7-3 3-7-7zM9 8l7 7M4 20l7-7M2 22h9" stroke-linecap="round"/>',
 "court": '<path d="M3 10h18M5 10v8M9.5 10v8M14.5 10v8M19 10v8M2 21h20M12 3l9 5H3z" stroke-linejoin="round"/>',
 "news": '<rect x="3" y="4" width="15" height="16" rx="1"/><path d="M18 8h3v10a2 2 0 0 1-2 2M6 8h9M6 12h9M6 16h5"/>',
 "tribunal": '<path d="M12 3v18M5 7h14M5 7l-3 7h6zM19 7l-3 7h6zM8 21h8"/>',
 "scroll": '<path d="M7 3h11a2 2 0 0 1 2 2v2h-4M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7M9 9h6M9 13h6M9 17h4"/>',
 "book": '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
 "brief": '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
 "archive": '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>',
 "ig": '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
 "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 "cal": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
}
ico = lambda k, s=28, c="currentColor": f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="1.7" aria-hidden="true">{ICON[k]}</svg>'


def tiles(S):
    d, t, n = S["digest"], S["tribunals"], S["news"]; k = dict(d["byKind"])
    T = [("gavel", d["items"], "judgments & orders reported"),
         ("court", 1 + d["highCourtsCovered"], "courts: the Supreme Court and High Courts"),
         ("court", d["supremeCourt"], "Supreme Court judgments & orders"),
         ("gavel", d["highCourts"], "High Court judgments & orders"),
         ("tribunal", t["items"], "tribunal rulings"),
         ("gavel", d["districtCourts"], "district & sessions court rulings"),
         ("scroll", k.get("Held", 0), "cases decided (the rest were notices, interim orders or reserved)"),
         ("news", n["items"], "legislative, executive & Bar developments")]
    return "".join(f'<div class="tile">{ico(k2, 28)}<b>{v:,}</b><span>{E(lbl)}</span></div>' for k2, v, lbl in T)


def bars(pairs, color, n=8, w=460, label_w=170, title="", rh=26):
    pairs = [(k, v) for k, v in pairs if v][:n]
    if not pairs: return '<p class="empty">Nothing to show this month.</p>'
    mx = max(v for _, v in pairs); h = rh * len(pairs) + 6; bw = w - label_w - 50; bh = round(rh * .54)
    rows = []
    for i, (k, v) in enumerate(pairs):
        y = i * rh + 4; L = max(4, round(bw * v / mx))
        rows.append(f'<g><title>{E(k)}: {v}</title><text x="{label_w-10}" y="{y+bh*.8+2}" text-anchor="end" class="bl">{E(k)}</text>'
                    f'<rect x="{label_w}" y="{y+2}" width="{L}" height="{bh}" rx="3" fill="{color}"/>'
                    f'<text x="{label_w+L+8}" y="{y+bh*.8+2}" class="bv">{v}</text></g>')
    return f'<svg class="chart" viewBox="0 0 {w} {h}" role="img" aria-label="{E(title)}">{"".join(rows)}</svg>'


def icon_array(d):
    parts = [(d["supremeCourt"], C_SC, "Supreme Court"), (d["highCourts"], C_HC, "High Courts"), (d["districtCourts"], C_DC, "District courts")]
    total = sum(p[0] for p in parts)
    if not total: return ""
    per = 1 if total <= 120 else (2 if total <= 240 else 5)
    cells = []
    for n, col, lbl in parts:
        cells += [(col, lbl)] * -(-n // per)
    cols = 20; s = 14; g = 3; rows = -(-len(cells) // cols)
    rects = "".join(f'<rect x="{(i%cols)*(s+g)}" y="{(i//cols)*(s+g)}" width="{s}" height="{s}" rx="3" fill="{c}"><title>{E(l)}</title></rect>' for i, (c, l) in enumerate(cells))
    W = cols * (s + g); H = rows * (s + g)
    legend = "".join(f'<span><i style="background:{c}"></i>{E(l)}&nbsp;<b>{n}</b></span>' for n, c, l in parts if n)
    return (f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Judgments and orders by court level">{rects}</svg>'
            f'<div class="legend">{legend}</div><p class="note">Each square = {per} judgment{"s" if per > 1 else ""} or order{"s" if per > 1 else ""}.</p>')


def month_calendar(S):
    y, m = map(int, S["month"].split("-")); per = S["digest"]["perDay"]
    news_days = {}
    for h in S["news"]["headlines"]:
        news_days[h["edition"][:10]] = news_days.get(h["edition"][:10], 0) + 1
    mx = max(list(per.values()) + [1]); s = 44; g = 5
    first, days = calendar.monthrange(y, m)  # Monday=0
    out = [f'<text x="{i*(s+g)+s/2}" y="12" text-anchor="middle" class="dw">{d}</text>' for i, d in enumerate("MTWTFSS")]
    for day in range(1, days + 1):
        idx = first + day - 1; x = (idx % 7) * (s + g); yy = 20 + (idx // 7) * (s + g)
        iso = f"{S['month']}-{day:02d}"; v = per.get(iso, 0)
        fill = "#EFE6D6" if not v else RAMP[min(len(RAMP) - 1, 1 + int((len(RAMP) - 2) * v / mx))]
        ink = "#fff" if v and RAMP.index(fill) >= 3 else "#3B332A"
        dot = f'<circle cx="{x+s-8}" cy="{yy+8}" r="3.5" fill="{C_HC}"/>' if news_days.get(iso) else ""
        out.append(f'<g><title>{day} {calendar.month_abbr[m]}: {v} judgments & orders{", legal developments reported" if news_days.get(iso) else ""}</title>'
                   f'<rect x="{x}" y="{yy}" width="{s}" height="{s}" rx="5" fill="{fill}"/><text x="{x+6}" y="{yy+15}" class="dn" fill="{ink}">{day}</text>'
                   + (f'<text x="{x+s/2}" y="{yy+35}" text-anchor="middle" class="dv" fill="{ink}">{v}</text>' if v else "") + dot + "</g>")
    rows = -(-(first + days) // 7); W = 7 * (s + g); H = 20 + rows * (s + g)
    return (f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Judgments and orders summarised on each day">{"".join(out)}</svg>'
            f'<div class="legend"><span>Fewer</span>{"".join(f"<i style=background:{c}></i>" for c in RAMP[1:])}<span>More</span>'
            f'<span style="margin-left:10px"><i style="background:{C_HC};border-radius:50%"></i>Legal developments reported</span></div>')


def paras(body, cap=False):
    out = []
    for i, p in enumerate(body or []):
        if i == 0 and cap and p:
            out.append(f'<p><span class="cap">{E(p[0])}</span>{E(p[1:])}</p>')
        else:
            out.append(f"<p>{E(p)}</p>")
    return "".join(out)


def cases(cs):
    if not cs: return ""
    li = "".join(f'<li><b>{E(c.get("name"))}</b>{(" — " + E(c["note"])) if c.get("note") else ""}'
                 f'</li>' for c in cs)
    return f'<ul class="cases">{li}</ul>'


CSS = """
:root{--ink:#221E1B;--ink2:#4A423A;--ink3:#7A6E5E;--paper:#FBF7EF;--rule:#D9CCB3;--stamp:#9E2A2B;--gold:#B7791F;
--display:"Libre Caslon Display",Georgia,serif;--serif:"Libre Caslon Text",Georgia,serif;--official:"Cinzel",Georgia,serif;
--sans:"IBM Plex Sans",system-ui,sans-serif;--mono:"IBM Plex Mono",monospace;--deva:"Tiro Devanagari Hindi",serif}
*{box-sizing:border-box}html{background:#E9E1D2}
body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.65 var(--serif);max-width:1180px;margin:0 auto;box-shadow:0 0 40px rgba(60,40,10,.18)}
a{color:var(--stamp)}
.top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 28px;background:#221E1B;color:#fff;font:12px var(--mono)}
.top a{color:#F3C46B;text-decoration:none}
.mast{text-align:center;padding:26px 28px 10px;border-bottom:4px double var(--ink)}
.mast .kick{font:600 12px var(--official);letter-spacing:.32em;color:var(--stamp)}
.mast h1{font:400 clamp(44px,8vw,92px)/1 var(--display);margin:8px 0 4px;letter-spacing:.01em}
.mast h1 span{font-family:var(--deva);color:var(--stamp);font-size:.6em;margin-left:.15em}
.mast .sub{font:italic 16px var(--serif);color:var(--ink2)}
.dateline{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:8px 28px;border-bottom:1px solid var(--ink);font:12px var(--mono);letter-spacing:.06em;text-transform:uppercase}
main{padding:24px 28px 10px}
.lead{display:grid;grid-template-columns:1.7fr 1fr;gap:34px;border-bottom:1px solid var(--rule);padding-bottom:24px}
.kicker{font:600 11.5px var(--official);letter-spacing:.24em;color:var(--stamp);text-transform:uppercase;margin-bottom:6px}
.lead h2{font:400 clamp(32px,4.4vw,52px)/1.05 var(--display);margin:0 0 10px}
.deck{font:italic 19px/1.5 var(--serif);color:var(--ink2);margin:0 0 14px}
.cols{column-count:2;column-gap:28px;column-rule:1px solid var(--rule)}
.cols p,.art p{margin:0 0 12px;text-align:justify;hyphens:auto}
.cap{float:left;font:400 64px/.8 var(--display);color:var(--stamp);margin:6px 8px 0 0}
.panel{border:1px solid var(--rule);background:#fff;padding:16px 16px 12px}
.panel h3,.sec h3{font:600 12px var(--official);letter-spacing:.2em;text-transform:uppercase;color:var(--stamp);margin:0 0 10px;border-bottom:1px solid var(--rule);padding-bottom:6px}
.numbers{margin:24px 0;border-top:3px solid var(--ink);border-bottom:1px solid var(--ink);padding:16px 0}
.numbers h3{font:600 13px var(--official);letter-spacing:.26em;text-align:center;margin:0 0 14px;text-transform:uppercase}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
.tile{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:10px;padding:10px 14px;border-left:1px solid var(--rule);color:var(--stamp)}
.tile:nth-child(4n+1){border-left:0}
.tile svg{grid-row:span 2;align-self:center}
.tile b{font:400 34px/1 var(--display);color:var(--ink)}
.tile span{font:13px/1.35 var(--sans);color:var(--ink2)}
.pictos{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:18px;margin-bottom:24px}
.chart{width:100%;height:auto;display:block}
.chart .bl{font:12px var(--sans);fill:#3B332A}.chart .bv{font:600 12px var(--mono);fill:#3B332A}
.chart .dw{font:600 10px var(--mono);fill:#7A6E5E}.chart .dn{font:600 10px var(--mono)}.chart .dv{font:400 15px var(--display)}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;font:12px var(--sans);color:var(--ink2);margin-top:8px}
.legend i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.legend span{display:inline-flex;align-items:center}
.note{font:12px var(--sans);color:var(--ink3);margin:6px 0 0}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:1px solid var(--ink)}
.art{padding:16px 18px 10px;border-left:1px solid var(--rule)}
.art:nth-child(3n+1){border-left:0;padding-left:0}
.art .kicker{margin-top:2px}
.art h4{font:400 25px/1.12 var(--display);margin:0 0 8px}
.art p{font-size:15.5px;line-height:1.6}
.cases{margin:4px 0 10px;padding-left:18px;font:14px/1.5 var(--serif);color:var(--ink2)}
.cases li{margin-bottom:4px}.cases a{font:12px var(--sans)}
.side{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin:10px 0 22px}
.editor{background:#221E1B;color:#EDE5D6;padding:22px 26px;margin:6px 0 20px;display:grid;grid-template-columns:1.6fr 1fr;gap:28px}
.editor h4{font:400 26px/1.15 var(--display);margin:0 0 8px;color:#fff}
.editor p{margin:0 0 10px;font-size:15.5px}
.editor .kicker{color:#F3C46B}
.editor ul{margin:0;padding-left:18px;font-size:15px}
.foot{border-top:4px double var(--ink);padding:14px 28px 24px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font:12.5px var(--sans);color:var(--ink2)}
.empty{font:13px var(--sans);color:var(--ink3)}
.lmk{background:var(--stamp);color:#fff;padding:2px 7px;margin-right:6px;letter-spacing:.14em}
.sech{font:600 13px var(--official);letter-spacing:.26em;text-transform:uppercase;text-align:center;border-top:3px solid var(--ink);border-bottom:1px solid var(--ink);padding:10px 0;margin:10px 0 14px}
.polgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-bottom:22px}.pol{border-top:1px solid var(--rule);padding-top:10px;min-width:0;overflow-wrap:anywhere}
.dlb{display:inline-block;font:600 12px var(--mono);color:#fff;background:var(--stamp);padding:3px 8px;border-radius:3px}
.pol h4{font:400 22px/1.15 var(--display);margin:0 0 6px}.pol p{margin:0 0 6px;font-size:15px;line-height:1.55;color:var(--ink2)}.pol .srcn{font:12px var(--mono);color:var(--ink3)}
.awl{columns:2;column-gap:28px;padding-left:18px;font-size:15px;color:var(--ink2);margin:0 0 24px}
.briefs ul{column-count:2;column-gap:28px;column-rule:1px solid var(--rule);padding:0;list-style:none;margin:0 0 24px}
.briefs li{break-inside:avoid;margin-bottom:10px;font-size:15px;line-height:1.5;color:var(--ink2)}.briefs li b{color:var(--ink)}
.noprint{}
@media (max-width:900px){.lead,.pictos,.side,.editor,.polgrid{grid-template-columns:1fr}.briefs ul{column-count:1}.grid{grid-template-columns:1fr}.art{border-left:0;padding-left:0;border-top:1px solid var(--rule)}
 .tiles{grid-template-columns:repeat(2,1fr)}.tile:nth-child(odd){border-left:0}.tile:nth-child(4n+1){border-left:0}.cols{column-count:1}}
@media (max-width:560px){main,.top,.dateline,.foot{padding-left:16px;padding-right:16px}.mast{padding:20px 16px 8px}.tile b{font-size:28px}.tile{padding:10px 8px}.editor{padding:18px 16px}}
@media print{html{background:#fff}body{box-shadow:none}.top,.noprint{display:none}a{color:inherit;text-decoration:none}}
"""

HEAD = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/png" sizes="192x192" href="/assets/brand/icon-192.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta property="og:image" content="https://nirnaydaily.github.io/assets/brand/og-card.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Tiro+Devanagari+Hindi&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<script>window.NIRNAY_GA_ID="G-5Q7X36D16B";</script><script src="../assets/analytics.js"></script>
<style>{css}</style></head><body>"""


def careers_snapshot(month):
    """Openings still open on the 1st of next month, from data/careers-pool.json (official sources only)."""
    import re, datetime
    y, m = map(int, month.split("-"))
    first_next = (datetime.date(y, m, calendar.monthrange(y, m)[1]) + datetime.timedelta(days=1)).isoformat()
    try: pool = json.load(open(P("data", "careers-pool.json")))
    except Exception: return {"open": [], "awaited": []}
    strip = lambda t: re.sub(r"<[^>]+>", "", t or "").strip()
    open_, wait = [], []
    for sec in pool.get("sections", []):
        for it in sec.get("items", []):
            dl = next((f for f in it.get("facts", []) if f.get("iso")), None)
            link = (it.get("links") or [{}])[0]
            row = {"section": sec.get("title") or sec.get("short"), "name": it.get("name"), "org": it.get("org"),
                   "eligibility": strip(it.get("eligibility")), "status": it.get("status"),
                   "deadline": dl["v"] if dl else "", "dlLabel": (dl.get("k") or "Last date") if dl else "", "iso": dl["iso"] if dl else "", "url": link.get("url", "")}
            if it.get("status") == "Awaited": wait.append(row)
            elif dl and dl["iso"] >= first_next: open_.append(row)
    open_.sort(key=lambda r: r["iso"])
    return {"open": open_[:8], "awaited": wait[:6]}


def careers_html(C):
    host = lambda u: (u.split("/")[2] if u.count("/") >= 2 else u).replace("www.", "")
    cards = "".join(f'<div class="pol"><div class="kicker">{E(c["section"])}</div><h4>{E(c["name"])}</h4>'
                    f'<p><b>{E(c["org"])}</b></p><p><b>Who can apply:</b> {E(c["eligibility"])}</p>'
                    f'<p><span class="dlb">{E(c.get("dlLabel") or "Last date")}: {E(c["deadline"])}</span></p><p class="srcn">Official site: {E(host(c["url"]))}</p></div>' for c in C.get("open", []))
    aw = "".join(f'<li><b>{E(c["name"])}</b> — {E(c["org"])}</li>' for c in C.get("awaited", []))
    return f'<div class="polgrid">{cards}</div>' + (f'<p class="kicker" style="margin-top:6px">Expected soon</p><ul class="awl">{aw}</ul>' if aw else "")


def lm(a): return '<span class="lmk">Landmark</span> ' if a.get("landmark") else ""


def policy_html(pol):
    return "".join(f'<div class="pol"><div class="kicker">{E(x.get("cat"))} · {E(x.get("region") or "All India")}</div><h4>{E(x.get("headline"))}</h4>'
                   f'<p>{E(x.get("text"))}</p></div>' for x in pol)


def page(J):
    S = J["stats"]; mn = S["monthName"]; L = J["lead"]
    arts = "".join(f'<article class="art"><div class="kicker">{lm(a)}{E(a.get("section"))}</div><h4>{E(a.get("headline"))}</h4>'
                   f'{paras(a.get("body"))}{cases(a.get("cases"))}</article>' for a in J.get("articles", []))
    trib = S["tribunals"]["byTribunal"]; cats = S["news"]["byCategory"]
    briefs = "".join(f'<li><span class="kicker">{E(b.get("court"))}</span> <b>{E(b.get("caseName"))}</b> — {E(b.get("note"))}</li>' for b in J.get("briefs", []))
    return (HEAD.format(title=E(f"{mn} · Nirnay Daily Monthly Journal"), desc=E(L.get("deck", "")), css=CSS) + f"""
<div class="top"><a href="../">← Nirnay Daily</a><span><a href="./">All issues</a> · <a href="#" onclick="print();return false">Print / save as PDF</a></span></div>
<header class="mast"><div class="kick">The Monthly Journal of</div><h1>Nirnay Daily<span lang="hi">निर्णय</span></h1>
<div class="sub">India's courts and laws, month by month</div></header>
<div class="dateline"><span>{E(J.get("issue",""))}</span><span>{E(mn)} issue</span><span>Judgments · Orders · Legal developments</span></div>
<main>
<section class="lead"><div><div class="kicker">{lm(L)}{E(L.get("kicker"))}</div><h2>{E(L.get("headline"))}</h2><p class="deck">{E(L.get("deck"))}</p>
<div class="cols">{paras(L.get("body"), cap=True)}</div>{cases(L.get("cases"))}</div>
<aside class="panel"><h3>Where the month's rulings came from</h3>{icon_array(S["digest"])}</aside></section>
<section class="grid">{arts}</section>
{f'<section class="policy"><h3 class="sech">Law &amp; Policy</h3><div class="polgrid">{policy_html(J.get("policy", []))}</div></section>' if J.get("policy") else ''}
{f'<section class="careers"><h3 class="sech">Careers &amp; openings</h3>{careers_html(J["careers"])}</section>' if J.get("careers", {}).get("open") or J.get("careers", {}).get("awaited") else ''}
<section class="numbers"><h3>The month in numbers</h3><div class="tiles">{tiles(S)}</div></section>
<section class="pictos">
<div class="panel"><h3>Rulings reported each day</h3>{month_calendar(S)}</div>
<div class="panel"><h3>Busiest courts</h3>{bars(S["digest"]["byCourt"], C_SC, 9, title="Judgments and orders by court")}</div>
<div class="panel"><h3>Areas of law</h3>{bars(S["digest"]["byArea"], C_HC, 7, label_w=150, title="Rulings by area of law")}
<h3 style="margin-top:14px">Tribunal rulings</h3>{bars(trib, C_DC, 6, label_w=120, title="Tribunal rulings by tribunal")}</div>
</section>
{f'<section class="briefs"><h3 class="sech">In brief</h3><ul>{briefs}</ul></section>' if briefs else ''}
</main>
<footer class="foot"><span>© {S["month"][:4]} Nirnay Daily · निर्णय</span>
<span>Instagram <a href="{IG}">@nirnay_daily_</a> · <a href="mailto:{MAIL}">{MAIL}</a></span></footer>
</body></html>""")


IG_CSS = """
*{box-sizing:border-box}body{margin:0;background:#333}
.s{width:1080px;height:1350px;position:relative;overflow:hidden;background:#FBF7EF;color:#221E1B;font-family:"Libre Caslon Text",Georgia,serif;margin:0 0 20px}
.s .frame{position:absolute;inset:34px;border:3px double #221E1B}
.s .in{position:absolute;inset:64px 70px}
.kick{font:600 22px "Cinzel",serif;letter-spacing:.3em;color:#9E2A2B;text-transform:uppercase}
.mh{text-align:center;border-bottom:5px double #221E1B;padding-bottom:18px}
.mh h1{font:400 118px/1 "Libre Caslon Display",serif;margin:10px 0 6px}.mh h1 span{font-family:"Tiro Devanagari Hindi",serif;color:#9E2A2B;font-size:.55em;margin-left:14px}
.mh .d{display:flex;justify-content:space-between;font:22px "IBM Plex Mono",monospace;letter-spacing:.06em;text-transform:uppercase;border-top:1px solid #221E1B;padding-top:12px;margin-top:12px}
h2{font:400 70px/1.04 "Libre Caslon Display",serif;margin:28px 0 16px}
h3{font:400 58px/1.05 "Libre Caslon Display",serif;margin:14px 0 18px}
.deck{font:italic 32px/1.45 "Libre Caslon Text",serif;color:#4A423A;margin:0}
p.b{font-size:31px;line-height:1.55;margin:0 0 20px;color:#2E2822}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-top:26px;border-top:3px solid #221E1B}
.tile{display:grid;grid-template-columns:auto 1fr;column-gap:18px;align-items:center;padding:22px 10px;border-bottom:1px solid #D9CCB3;color:#9E2A2B}
.tile:nth-child(odd){border-right:1px solid #D9CCB3}
.tile b{font:400 64px/1 "Libre Caslon Display",serif;color:#221E1B;display:block}
.tile span{font:22px/1.3 "IBM Plex Sans",sans-serif;color:#4A423A}
.tile svg{width:52px;height:52px;grid-row:span 2}
.chart{width:100%;height:auto}.chart .bl{font:14px "IBM Plex Sans";fill:#3B332A}.chart .bv{font:600 14px "IBM Plex Mono";fill:#3B332A}
.chart .dw{font:600 11px "IBM Plex Mono";fill:#7A6E5E}.chart .dn{font:600 11px "IBM Plex Mono"}.chart .dv{font:400 16px "Libre Caslon Display"}
.legend{display:flex;flex-wrap:wrap;gap:8px 20px;font:22px "IBM Plex Sans";color:#4A423A;margin-top:14px}.legend i{display:inline-block;width:20px;height:20px;border-radius:4px;margin-right:8px;vertical-align:-3px}
.note{font:20px "IBM Plex Sans";color:#7A6E5E}
.cases{font:27px/1.45 "Libre Caslon Text",serif;color:#3B332A;padding-left:30px;margin:10px 0}.cases li{margin-bottom:12px}.cases a{display:none}
.foot{position:absolute;left:70px;right:70px;bottom:62px;display:flex;justify-content:space-between;font:21px "IBM Plex Mono",monospace;color:#7A6E5E;border-top:1px solid #D9CCB3;padding-top:12px}
.pg{font:600 20px "Cinzel",serif;letter-spacing:.2em;color:#9E2A2B}
.end{background:#221E1B;color:#fff}.end .frame{border-color:#F3C46B}.end h2{color:#fff}.end p.b{color:#EDE5D6}.end .kick{color:#F3C46B}
.in{display:flex;flex-direction:column}
.pic{margin-top:auto;border-top:3px solid #221E1B;padding-top:22px;margin-bottom:40px}
.pic.two{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.ph{font:600 20px "Cinzel",serif;letter-spacing:.2em;color:#9E2A2B;text-transform:uppercase;margin-bottom:14px}
.pstat{display:grid;grid-template-columns:auto 1fr;column-gap:22px;align-items:center}
.pstat svg{grid-row:span 2}.pstat b{font:400 96px/1 "Libre Caslon Display",serif;color:#221E1B}.pstat span{font:24px/1.35 "IBM Plex Sans";color:#4A423A}
.pic .chart .bl{font:26px "IBM Plex Sans"}.pic .chart .bv{font:600 26px "IBM Plex Mono"}
.mini{display:grid;grid-template-columns:repeat(3,1fr);margin-top:40px;border-top:3px solid #221E1B;border-bottom:1px solid #221E1B}
.mini div{display:grid;justify-items:center;text-align:center;padding:22px 8px;border-left:1px solid #D9CCB3}.mini div:first-child{border-left:0}
.mini b{font:400 72px/1.05 "Libre Caslon Display",serif}.mini span{font:22px "IBM Plex Sans";color:#4A423A}
.seal{margin-top:auto;margin-bottom:40px;text-align:center}
.tile{padding:32px 10px}
.lmk{display:inline-block;background:#9E2A2B;color:#fff;letter-spacing:.2em;padding:4px 12px;margin-right:14px}
.pi,.bi{border-top:1px solid #D9CCB3;padding:16px 0 4px}.pk{font:600 17px "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:#9E2A2B}
.pi b{display:block;font:400 36px/1.15 "Libre Caslon Display",serif;margin:6px 0}.pi p{font-size:24px;line-height:1.45;margin:0 0 8px;color:#3B332A}
.bi b{display:block;font:700 26px/1.3 "Libre Caslon Text",serif;margin:4px 0}.bi p{font-size:23px;line-height:1.4;margin:0 0 6px;color:#3B332A}
.ci{border-top:1px solid #D9CCB3;padding:14px 0 6px}.ci b{display:block;font:400 32px/1.15 "Libre Caslon Display",serif;margin:4px 0}
.ci .org{font:600 21px "IBM Plex Sans",sans-serif;color:#4A423A}.ci p{font-size:21px;line-height:1.4;margin:6px 0;color:#3B332A}.ci p span{font-weight:700}
.ci .dl{display:inline-block;font:600 19px "IBM Plex Mono",monospace;color:#fff;background:#9E2A2B;padding:4px 10px;border-radius:3px}
.contact{position:absolute;left:70px;right:70px;bottom:120px;display:flex;justify-content:center;gap:50px;border-top:1px solid rgba(243,196,107,.5);padding-top:24px;font:28px "IBM Plex Mono",monospace;color:#fff}
.contact span{display:inline-flex;align-items:center;gap:12px}
"""


def section_picto(sec, S):
    k = (sec or "").lower(); d = S["digest"]
    if "supreme" in k:
        return f'<div class="pic"><div class="pstat">{ico("court", 70, "#9E2A2B")}<b>{d["supremeCourt"]:,}</b><span>Supreme Court judgments and orders reported this month</span></div></div>'
    if "high" in k:
        hcs = [(c.replace(" HC", ""), v) for c, v in d["byCourt"] if c.endswith(" HC")]
        return f'<div class="pic"><div class="ph">Busiest High Courts this month</div>{bars(hcs, C_HC, 5, w=900, label_w=300, rh=46)}</div>'
    if "tribunal" in k or "nclt" in k or "nclat" in k:
        return f'<div class="pic"><div class="ph">Tribunal rulings this month</div>{bars(S["tribunals"]["byTribunal"], C_DC, 5, w=900, label_w=200, rh=46)}</div>'
    if "district" in k or "sessions" in k:
        return f'<div class="pic"><div class="pstat">{ico("gavel", 70, "#9E2A2B")}<b>{d["districtCourts"]:,}</b><span>district and sessions court rulings reported this month</span></div></div>'
    return ""


def ig(J):
    S = J["stats"]; mn = S["monthName"]; L = J["lead"]; d = S["digest"]; slides = []
    foot = lambda i: f'<div class="foot"><span>NIRNAY DAILY · {E(mn.upper())}</span><span class="pg">{i}</span></div>'
    badge = lambda a: '<span class="lmk">Landmark</span>' if a.get("landmark") else ""
    slides.append(f"""<section class="s"><div class="frame"></div><div class="in"><div class="mh"><div class="kick">The Monthly Journal of</div>
<h1>Nirnay Daily<span>निर्णय</span></h1><div class="d"><span>{E(J.get("issue",""))}</span><span>{E(mn)}</span></div></div>
<div class="kick" style="margin-top:34px">{badge(L)}{E(L.get("kicker"))}</div><h2>{E(L.get("headline"))}</h2><p class="deck">{E(L.get("deck"))}</p>
<div class="mini">{"".join(f'<div>{ico(k, 54, "#9E2A2B")}<b>{v:,}</b><span>{E(t)}</span></div>' for k, v, t in [("gavel", d["items"], "judgments & orders"), ("court", 1 + d["highCourtsCovered"], "courts covered"), ("tribunal", S["tribunals"]["items"], "tribunal rulings")])}</div>
<div class="seal">{ico("court", 150, "#E7D8BC")}</div></div>{foot("SWIPE →")}</section>""")
    lead_rest = (L.get("body") or [])
    if lead_rest:
        cs = "".join(f"<li><b>{E(c.get('name'))}</b>{(' — ' + E(c['note'])) if c.get('note') else ''}</li>" for c in (L.get("cases") or [])[:2])
        slides.append(f"""<section class="s"><div class="frame"></div><div class="in"><div class="kick">{badge(L)}{E(L.get("kicker"))}</div><h3>{E(L.get("headline"))}</h3>
{"".join(f'<p class="b">{E(p)}</p>' for p in lead_rest[:3])}{f'<ul class="cases">{cs}</ul>' if cs else ''}</div>{foot(2)}</section>""")
    n = len(slides) + 1
    for a in J.get("articles", []):
        body = "".join(f'<p class="b">{E(p)}</p>' for p in (a.get("body") or [])[:2])
        cs = "".join(f"<li><b>{E(c.get('name'))}</b>{(' — ' + E(c['note'])) if c.get('note') else ''}</li>" for c in (a.get("cases") or [])[:3])
        slides.append(f"""<section class="s"><div class="frame"></div><div class="in"><div class="kick">{badge(a)}{E(a.get("section"))}</div><h3>{E(a.get("headline"))}</h3>
{body}{f'<ul class="cases">{cs}</ul>' if cs else ''}{section_picto(a.get("section"), S)}</div>{foot(n)}</section>"""); n += 1
    pol = J.get("policy", [])
    for i in range(0, len(pol), 4):
        items = "".join(f'<div class="pi"><div class="pk">{E(x.get("cat"))} · {E(x.get("region") or "All India")}</div><b>{E(x.get("headline"))}</b><p>{E(x.get("text"))}</p></div>' for x in pol[i:i + 4])
        slides.append(f"""<section class="s"><div class="frame"></div><div class="in"><div class="kick">Parliament · Government · Bar</div><h3>Law &amp; Policy</h3>{items}</div>{foot(n)}</section>"""); n += 1
    C = J.get("careers", {}); co = C.get("open", [])
    for i in range(0, len(co), 4):
        items = "".join(f'<div class="ci"><div class="pk">{E(c["section"])}</div><b>{E(c["name"])}</b><div class="org">{E(c["org"])}</div>'
                        f'<p><span>Who can apply:</span> {E(c["eligibility"])}</p><div class="dl">{E(c.get("dlLabel") or "Last date")}: {E(c["deadline"])}</div></div>' for c in co[i:i + 4])
        slides.append(f"""<section class="s"><div class="frame"></div><div class="in"><div class="kick">Jobs · Exams · Admissions</div><h3>Careers &amp; openings</h3>{items}</div>{foot(n)}</section>"""); n += 1
    if C.get("awaited"):
        aw = "".join(f'<div class="bi"><div class="pk">{E(c["section"])}</div><b>{E(c["name"])}</b><p>{E(c["org"])} · {E(c["eligibility"])}</p></div>' for c in C["awaited"][:5])
        slides.append(f"""<section class="s"><div class="frame"></div><div class="in"><div class="kick">Notification awaited</div><h3>Openings expected soon</h3>{aw}</div>{foot(n)}</section>"""); n += 1
    slides.append(f"""<section class="s"><div class="frame"></div><div class="in"><div class="kick">{E(mn)}</div><h3>The month in numbers</h3>
<div class="tiles">{tiles(S)}</div></div>{foot(n)}</section>"""); n += 1
    slides.append(f"""<section class="s"><div class="frame"></div><div class="in"><div class="kick">Pictograph</div><h3>Where the rulings came from</h3>
<div style="margin-top:20px">{icon_array(d)}</div><div class="kick" style="margin-top:36px">Rulings reported each day</div>
<div style="width:72%;margin-top:14px">{month_calendar(S)}</div></div>{foot(n)}</section>"""); n += 1
    slides.append(f"""<section class="s"><div class="frame"></div><div class="in"><div class="kick">Pictograph</div><h3>Areas of law</h3>
<div class="pic" style="margin-top:10px;border:0;padding:0">{bars(d["byArea"], C_SC, 8, w=900, label_w=330, rh=46)}</div>
<div class="kick" style="margin-top:10px">Tribunal rulings</div><div class="pic" style="margin:14px 0 0;border:0;padding:0">{bars(S["tribunals"]["byTribunal"], C_DC, 5, w=900, label_w=200, rh=46)}</div></div>{foot(n)}</section>"""); n += 1
    br = J.get("briefs", [])
    for i in range(0, len(br), 7):
        items = "".join(f'<div class="bi"><div class="pk">{E(x.get("court"))}</div><b>{E(x.get("caseName"))}</b><p>{E(x.get("note"))}</p></div>' for x in br[i:i + 7])
        slides.append(f"""<section class="s"><div class="frame"></div><div class="in"><div class="kick">More rulings of the month</div><h3>In brief</h3>{items}</div>{foot(n)}</section>"""); n += 1
    slides.append(f"""<section class="s end"><div class="frame"></div><div class="in" style="justify-content:center;text-align:center"><div class="kick">The Monthly Journal of</div>
<h2 style="font-size:110px;margin:16px 0 8px">Nirnay Daily</h2><div class="kick" style="letter-spacing:.2em">{E(mn)} · {E(J.get("issue",""))}</div>
<p class="deck" style="color:#D8CDBA;margin-top:26px">निर्णय — a decision; a judgment.</p></div>
<div class="contact"><span>{ico("ig", 34, "#F3C46B")} @nirnay_daily_</span><span>{ico("mail", 34, "#F3C46B")} {MAIL}</span></div>{foot(n)}</section>""")
    return f'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Tiro+Devanagari+Hindi&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"><style>{IG_CSS}</style></head><body>{"".join(slides)}</body></html>'


def index_page():
    issues = []
    for f in sorted(glob.glob(P("data", "journal", "????-??.json")), reverse=True):
        J = json.load(open(f))
        issues.append(f'<li><a href="{E(J["month"])}.html"><span class="kicker">{E(J.get("issue",""))}</span><b>{E(J["stats"]["monthName"])}</b>'
                      f'<span>{E(J["lead"].get("headline"))}</span></a></li>')
    body = "".join(issues) or '<li class="empty">The first issue will be published on 1 October 2026.</li>'
    css = CSS + """.issues{list-style:none;padding:0;margin:20px 0;display:grid;gap:12px}.issues a{display:grid;gap:4px;padding:16px 18px;border:1px solid var(--rule);background:#fff;text-decoration:none;color:var(--ink)}
.issues b{font:400 30px var(--display)}.issues a span:last-child{font:italic 17px var(--serif);color:var(--ink2)}"""
    return (HEAD.format(title="Monthly Journal · Nirnay Daily", desc="The month's most important Indian judgments and legal developments.", css=css) +
            f"""<div class="top"><a href="../">← Nirnay Daily</a><span>A new issue on the 1st of every month</span></div>
<header class="mast"><div class="kick">The Monthly Journal of</div><h1>Nirnay Daily<span lang="hi">निर्णय</span></h1><div class="sub">All issues</div></header>
<main><ul class="issues">{body}</ul></main><footer class="foot"><span>© Nirnay Daily · निर्णय</span><span><a href="{IG}">@nirnay_daily_</a> · <a href="mailto:{MAIL}">{MAIL}</a></span></footer></body></html>""")


def main():
    month = sys.argv[1]; src = P("data", "journal", f"{month}.json")
    J = json.load(open(src))
    if "stats" not in J or "--restat" in sys.argv:
        J["stats"] = js.stats(month)
        J["careers"] = careers_snapshot(month)
        json.dump(J, open(src, "w"), ensure_ascii=False, indent=1)
    os.makedirs(P("journal"), exist_ok=True)
    open(P("journal", f"{month}.html"), "w").write(page(J))
    open(P("journal", "index.html"), "w").write(index_page())
    if "--ig" in sys.argv:
        open(sys.argv[sys.argv.index("--ig") + 1], "w").write(ig(J))
    for f in [P("journal", f"{month}.html")]:
        assert "�" not in open(f).read()
    print("built", month)


if __name__ == "__main__":
    main()
