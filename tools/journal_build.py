#!/usr/bin/env python3
"""Build the Nirnay Daily Monthly Journal – a law-only newspaper of 10+ pages.

  python3 tools/journal_build.py 2026-09 [--restat]

Reads  data/journal/<month>.json  (written by the editor – SCHEMA below)
Adds   the month's law statistics from tools/journal_stats.py (stored in the JSON the first time)
Writes journal/<month>.html  – every page is 1080x1350 (Instagram 4:5). The same file is
       shown on the website, printed to PDF, and cut into Instagram slides by journal_render.js.
       journal/index.html   – list of issues

Page order: cover (lead landmark) → lead continued → articles in the order given (landmark
judgments first, then Supreme Court, High Courts, district courts, tribunals) → Law & Policy →
two pictograph pages → In Brief → back page (email + Instagram only).

SCHEMA of data/journal/<month>.json – LAW CONTENT ONLY (nothing about the website)
{ "month":"2026-09", "issue":"Vol. I · No. 1", "published":"2026-10-01",
  "lead":    ARTICLE,                       # the month's most important judgment
  "articles":[ARTICLE, …],                  # ordered by importance, landmark ones first (6–10)
  "policy":  [{"cat":"Legislature|Executive & Government|Judiciary|Bar & Bar Councils|Legal Education & Careers|Other Legal News",
               "region":"…","headline":"…","text":"2–3 sentences","src":"url","srcName":"…"}],
  "briefs":  [{"court":"…","caseName":"…","note":"one sentence","src":"url"}] }
ARTICLE = {"kicker":"Landmark Judgment · Supreme Court", "landmark":true|false, "court":"Supreme Court of India",
  "caseName":"X v. Y", "citation":"…", "caseNo":"…", "coram":"…", "date":"Decided 24 Sep 2026",
  "area":"POCSO / Family", "headline":"…", "deck":"one sentence",
  "body":["para", …],        # 220–330 words in total (cover lead: 380–480 words, split over 2 pages)
  "held":"what the court held, one or two sentences", "why":"why it matters, one sentence",
  "src":"url", "srcName":"LiveLaw"}
"""
import json, os, sys, html, calendar, glob, importlib.util

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
E = lambda s: html.escape(str(s if s is not None else ""), quote=True)
IG_HANDLE, IG = "@nirnay_daily_", "https://www.instagram.com/nirnay_daily_/"
MAIL = "nirnaydaily@gmail.com"
C_SC, C_HC, C_DC = "#9E2A2B", "#1F6FA8", "#B7791F"      # validated categorical trio on #FBF7EF
RAMP = ["#F4E3DD", "#E6B8AE", "#D48A7E", "#B85750", "#9E2A2B", "#6E1A1C"]   # one-hue sequential

spec = importlib.util.spec_from_file_location("js", P("tools", "journal_stats.py"))
js = importlib.util.module_from_spec(spec); spec.loader.exec_module(js)

ICON = {
 "gavel": '<path d="M14 3l7 7-3 3-7-7zM9 8l7 7M4 20l7-7M2 22h9" stroke-linecap="round"/>',
 "court": '<path d="M3 10h18M5 10v8M9.5 10v8M14.5 10v8M19 10v8M2 21h20M12 3l9 5H3z" stroke-linejoin="round"/>',
 "scale": '<path d="M12 3v18M5 7h14M5 7l-3 7h6zM19 7l-3 7h6zM8 21h8"/>',
 "news": '<rect x="3" y="4" width="15" height="16" rx="1"/><path d="M18 8h3v10a2 2 0 0 1-2 2M6 8h9M6 12h9M6 16h5"/>',
 "scroll": '<path d="M7 3h11a2 2 0 0 1 2 2v2h-4M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7M9 9h6M9 13h6M9 17h4"/>',
 "check": '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
 "bell": '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4"/>',
 "pause": '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
 "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 "split": '<path d="M12 3v18M5 8l-3 4 3 4M19 8l3 4-3 4"/>',
 "refer": '<path d="M4 12h13M13 7l5 5-5 5"/>',
 "ig": '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
 "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
}
ico = lambda k, s=28, c="currentColor", w=1.7: f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="{w}" aria-hidden="true">{ICON[k]}</svg>'
KIND_ICON = {"Held": "check", "Notice": "bell", "Reserved": "pause", "Pending": "clock", "Split": "split", "Referred": "refer"}
KIND_LABEL = {"Held": "decided", "Notice": "notice issued", "Reserved": "verdict reserved", "Pending": "interim orders", "Split": "split verdicts", "Referred": "referred to larger bench"}


def section_icon(a):
    c = (a.get("court") or "").lower()
    return "court" if "supreme" in c else ("scale" if "tribunal" in c or "nclt" in c else "gavel")


# ---------------------------------------------------------------- charts
def bars(pairs, color, n=8, w=900, label_w=300, rh=44, title=""):
    pairs = [(k, v) for k, v in pairs if v][:n]
    if not pairs: return '<p class="empty">None reported this month.</p>'
    mx = max(v for _, v in pairs); h = rh * len(pairs) + 6; bw = w - label_w - 60; bh = round(rh * .5)
    rows = []
    for i, (k, v) in enumerate(pairs):
        y = i * rh + 4; L = max(6, round(bw * v / mx))
        rows.append(f'<g><title>{E(k)}: {v}</title><text x="{label_w-12}" y="{y+bh*.82+1}" text-anchor="end" class="bl">{E(k)}</text>'
                    f'<rect x="{label_w}" y="{y+1}" width="{L}" height="{bh}" rx="4" fill="{color}"/>'
                    f'<text x="{label_w+L+10}" y="{y+bh*.82+1}" class="bv">{v}</text></g>')
    return f'<svg class="chart" viewBox="0 0 {w} {h}" role="img" aria-label="{E(title)}">{"".join(rows)}</svg>'


def icon_array(d):
    parts = [(d["supremeCourt"], C_SC, "Supreme Court"), (d["highCourts"], C_HC, "High Courts"), (d["districtCourts"], C_DC, "District courts")]
    total = sum(p[0] for p in parts)
    if not total: return '<p class="empty">No rulings reported.</p>'
    per = next(x for x in (1, 2, 5, 10, 20, 50) if total / x <= 150)
    cells = []
    for n, col, lbl in parts: cells += [(col, lbl)] * -(-n // per)
    cols = 25; s = 28; g = 6; rows = -(-len(cells) // cols)
    rects = "".join(f'<rect x="{(i%cols)*(s+g)}" y="{(i//cols)*(s+g)}" width="{s}" height="{s}" rx="6" fill="{c}"><title>{E(l)}</title></rect>' for i, (c, l) in enumerate(cells))
    legend = "".join(f'<span><i style="background:{c}"></i>{E(l)}&nbsp;<b>{n}</b></span>' for n, c, l in parts if n)
    return (f'<svg class="chart" viewBox="0 0 {cols*(s+g)} {rows*(s+g)}" role="img" aria-label="Rulings by court level">{rects}</svg>'
            f'<div class="legend">{legend}</div><p class="note">Each square = {per} judgment{"s" if per > 1 else ""} or order{"s" if per > 1 else ""} reported.</p>')


def month_calendar(S):
    y, m = map(int, S["month"].split("-")); per = S["digest"]["perDay"]
    mx = max(list(per.values()) + [1]); s = 62; g = 8
    first, days = calendar.monthrange(y, m)
    out = [f'<text x="{i*(s+g)+s/2}" y="16" text-anchor="middle" class="dw">{d}</text>' for i, d in enumerate("MTWTFSS")]
    for day in range(1, days + 1):
        idx = first + day - 1; x = (idx % 7) * (s + g); yy = 26 + (idx // 7) * (s + g)
        v = per.get(f"{S['month']}-{day:02d}", 0)
        fill = "#EFE6D6" if not v else RAMP[min(len(RAMP) - 1, 1 + int((len(RAMP) - 2) * v / mx))]
        ink = "#fff" if v and RAMP.index(fill) >= 3 else "#3B332A"
        out.append(f'<g><title>{day} {calendar.month_abbr[m]}: {v} rulings</title><rect x="{x}" y="{yy}" width="{s}" height="{s}" rx="8" fill="{fill}"/>'
                   f'<text x="{x+8}" y="{yy+19}" class="dn" fill="{ink}">{day}</text>'
                   + (f'<text x="{x+s/2}" y="{yy+50}" text-anchor="middle" class="dv" fill="{ink}">{v}</text>' if v else "") + "</g>")
    rows = -(-(first + days) // 7)
    return (f'<svg class="chart" viewBox="0 0 {7*(s+g)} {26+rows*(s+g)}" role="img" aria-label="Rulings reported each day">{"".join(out)}</svg>'
            f'<div class="legend"><span>Fewer</span>{"".join(f"<i style=background:{c}></i>" for c in RAMP[1:])}<span>More rulings</span></div>')


def kinds_row(d):
    k = dict(d["byKind"])
    return "".join(f'<div class="kind">{ico(KIND_ICON.get(n, "check"), 46, C_SC)}<b>{k[n]}</b><span>{E(KIND_LABEL.get(n, n))}</span></div>'
                   for n in ["Held", "Notice", "Reserved", "Pending", "Split", "Referred"] if k.get(n))


# ---------------------------------------------------------------- page parts
def paras(body, cap=False):
    out = []
    for i, p in enumerate(body or []):
        out.append(f'<p><span class="cap">{E(p[0])}</span>{E(p[1:])}</p>' if (i == 0 and cap and p) else f"<p>{E(p)}</p>")
    return "".join(out)


def casebox(a):
    bits = [("Court", a.get("court")), ("Case", a.get("caseName")), ("Citation", a.get("citation")), ("Case No.", a.get("caseNo")),
            ("Bench", a.get("coram")), ("Date", a.get("date")), ("Area", a.get("area"))]
    return '<dl class="casebox">' + "".join(f"<dt>{k}</dt><dd>{E(v)}</dd>" for k, v in bits if v) + "</dl>"


def heldbox(a):
    h = (f'<div class="held"><div class="hk">{ico("check", 26, C_SC)}What the court held</div><p>{E(a["held"])}</p></div>' if a.get("held") else "")
    w = (f'<div class="why"><div class="hk">Why it matters</div><p>{E(a["why"])}</p></div>' if a.get("why") else "")
    s = (f'<p class="src">Source: {E(a.get("srcName") or "")} · <a href="{E(a["src"])}">{E(a["src"])}</a></p>' if a.get("src") else "")
    return h + w + s


def fs(body):
    w = sum(len(p.split()) for p in (body or []))
    return "21.5px" if w < 170 else ("20px" if w < 240 else "19px")


def run_head(J, label):
    return f'<div class="rh"><span>NIRNAY DAILY · निर्णय</span><span>{E(label)}</span><span>{E(J["stats"]["monthName"])}</span></div>'


def run_foot(J, n):
    return f'<div class="rf"><span>The Monthly Journal · {E(J.get("issue",""))}</span><span class="pn">{n}</span></div>'


CSS = """
:root{--ink:#221E1B;--ink2:#4A423A;--ink3:#7A6E5E;--paper:#FBF7EF;--rule:#D9CCB3;--stamp:#9E2A2B}
*{box-sizing:border-box}
html{background:#E6DDCC}body{margin:0;font-family:"Libre Caslon Text",Georgia,serif;color:var(--ink)}
.bar{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 16px;background:#221E1B;color:#fff;font:13px "IBM Plex Mono",monospace}
.bar a{color:#F3C46B;text-decoration:none}
.stack{padding:18px 12px 40px;display:grid;gap:18px;justify-content:center}
.pw{width:min(1080px,calc(100vw - 24px));aspect-ratio:1080/1350;position:relative;overflow:hidden;box-shadow:0 10px 30px -12px rgba(60,40,10,.45)}
.pg{width:1080px;height:1350px;position:absolute;top:0;left:0;transform-origin:top left;transform:scale(var(--s,1));background:var(--paper);overflow:hidden}
.pg .frame{position:absolute;inset:28px;border:3px double var(--ink);pointer-events:none}
.pg .in{position:absolute;inset:52px 60px 96px;overflow:hidden;display:flex;flex-direction:column}
.rh{display:flex;justify-content:space-between;font:600 15px "Cinzel",serif;letter-spacing:.18em;color:var(--ink3);border-bottom:1px solid var(--ink);padding-bottom:8px;margin-bottom:22px;flex:none}
.rf{position:absolute;left:60px;right:60px;bottom:48px;display:flex;justify-content:space-between;border-top:1px solid var(--rule);padding-top:10px;font:15px "IBM Plex Mono",monospace;color:var(--ink3)}
.rf .pn{font:600 18px "Cinzel",serif;color:var(--stamp)}
.kick{font:600 17px "Cinzel",serif;letter-spacing:.24em;color:var(--stamp);text-transform:uppercase}
.kline{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.lm{display:inline-block;margin:0 !important;background:var(--stamp);color:#fff;font:600 14px "Cinzel",serif;letter-spacing:.2em;padding:5px 12px;margin-bottom:10px}
h2{font:400 56px/1.06 "Libre Caslon Display",serif;margin:8px 0 12px}
.deck{font:italic 24px/1.45 "Libre Caslon Text",serif;color:var(--ink2);margin:0 0 16px}
.cols{column-count:2;column-gap:36px;column-rule:1px solid var(--rule);font-size:19.5px;line-height:1.6}
.cols p{margin:0 0 12px;text-align:justify;hyphens:auto}
.cap{float:left;font:400 84px/.8 "Libre Caslon Display",serif;color:var(--stamp);margin:8px 10px 0 0}
.casebox{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;margin:0 0 16px;padding:12px 16px;border:1px solid var(--rule);border-left:5px solid var(--stamp);background:#fff;font:16px/1.4 "IBM Plex Sans",sans-serif}
.casebox dt{font:600 12px "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--ink3);padding-top:3px}
.casebox dd{margin:0;color:var(--ink)}
.held,.why{padding:14px 18px;margin-top:14px;font-size:19px;line-height:1.5}
.held{background:#fff;border:1px solid var(--rule);border-top:4px solid var(--stamp)}
.why{background:#221E1B;color:#EDE5D6}
.hk{display:flex;align-items:center;gap:8px;font:600 14px "Cinzel",serif;letter-spacing:.2em;text-transform:uppercase;color:var(--stamp);margin-bottom:6px}
.why .hk{color:#F3C46B}
.held p,.why p{margin:0}
.src{font:13px/1.4 "IBM Plex Mono",monospace;color:var(--ink3);margin:12px 0 0;word-break:break-all}.src a{color:var(--ink3)}
.wm{position:absolute;right:70px;top:430px;opacity:.06;pointer-events:none}
.push{margin-top:auto}
/* cover */
.mast{text-align:center;border-bottom:5px double var(--ink);padding-bottom:14px;margin-bottom:18px}
.mast .k{font:600 18px "Cinzel",serif;letter-spacing:.34em;color:var(--stamp)}
.mast h1{font:400 112px/1 "Libre Caslon Display",serif;margin:8px 0 4px}.mast h1 span{font-family:"Tiro Devanagari Hindi",serif;color:var(--stamp);font-size:.55em;margin-left:12px}
.mast .sub{font:italic 22px "Libre Caslon Text",serif;color:var(--ink2)}
.mast .d{display:flex;justify-content:space-between;font:17px "IBM Plex Mono",monospace;letter-spacing:.06em;text-transform:uppercase;border-top:1px solid var(--ink);padding-top:10px;margin-top:12px}
.cover-grid{display:grid;grid-template-columns:1.55fr 1fr;gap:28px;min-height:0;flex:1}
.cover-grid .cols{column-count:1;font-size:19.5px}
.inside{border-left:1px solid var(--rule);padding-left:22px}
.inside h3{font:600 16px "Cinzel",serif;letter-spacing:.24em;color:var(--stamp);margin:0 0 10px;text-transform:uppercase}
.inside ol{list-style:none;margin:0;padding:0;font:17px/1.35 "Libre Caslon Text",serif}
.inside li{display:grid;grid-template-columns:1fr auto;gap:10px;padding:9px 0;border-bottom:1px dotted var(--rule)}
.inside li b{font:600 17px "Cinzel",serif;color:var(--stamp)}
.inside li small{display:block;font:12px "IBM Plex Mono",monospace;letter-spacing:.06em;color:var(--ink3);text-transform:uppercase}
/* policy + briefs */
.plist{display:grid;gap:14px}
.pitem{display:grid;grid-template-columns:230px 1fr;gap:16px;padding:14px 0;border-bottom:1px solid var(--rule)}
.pitem .tag{font:600 12px "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:var(--c,#9E2A2B);padding:4px 8px;height:max-content;border-radius:3px;text-align:center;justify-self:start;max-width:230px}
.pitem h4{font:400 27px/1.15 "Libre Caslon Display",serif;margin:0 0 6px}
.pitem p{margin:0;font-size:18px;line-height:1.5;color:var(--ink2)}
.pitem .meta{font:13px "IBM Plex Mono",monospace;color:var(--ink3);margin-top:6px}
.briefs{column-count:2;column-gap:34px;column-rule:1px solid var(--rule)}
.brief{break-inside:avoid;padding:0 0 14px;margin-bottom:14px;border-bottom:1px dotted var(--rule)}
.brief .ct{font:600 12px "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--stamp)}
.brief b{display:block;font:700 18px/1.3 "Libre Caslon Text",serif;margin:3px 0}
.brief p{margin:0;font-size:17px;line-height:1.45;color:var(--ink2)}
h3.sec{font:400 50px/1.05 "Libre Caslon Display",serif;margin:4px 0 16px}
/* pictographs */
.panel{border:1px solid var(--rule);background:#fff;padding:18px 20px;margin-bottom:18px}
.panel h4{font:600 15px "Cinzel",serif;letter-spacing:.22em;text-transform:uppercase;color:var(--stamp);margin:0 0 12px}
.chart{width:100%;height:auto;display:block}
.chart .bl{font:22px "IBM Plex Sans",sans-serif;fill:#3B332A}.chart .bv{font:600 22px "IBM Plex Mono",monospace;fill:#3B332A}
.chart .dw{font:600 14px "IBM Plex Mono",monospace;fill:#7A6E5E}.chart .dn{font:600 14px "IBM Plex Mono",monospace}.chart .dv{font:400 24px "Libre Caslon Display",serif}
.legend{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;font:17px "IBM Plex Sans",sans-serif;color:var(--ink2);margin-top:10px}
.legend i{display:inline-block;width:18px;height:18px;border-radius:4px;margin-right:7px;vertical-align:-3px}
.legend span{display:inline-flex;align-items:center}
.note,.empty{font:15px "IBM Plex Sans",sans-serif;color:var(--ink3);margin:6px 0 0}
.kinds{display:flex;flex-wrap:wrap;gap:0}
.kind{flex:1;min-width:150px;display:grid;justify-items:center;text-align:center;padding:10px 6px;border-left:1px solid var(--rule)}.kind:first-child{border-left:0}
.kind b{font:400 50px/1 "Libre Caslon Display",serif;margin-top:6px}.kind span{font:15px "IBM Plex Sans",sans-serif;color:var(--ink2)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}
/* back page */
.back{background:#221E1B;color:#EDE5D6}.back .frame{border-color:#F3C46B}
.back .in{justify-content:center;text-align:center;align-items:center}
.back h1{font:400 110px/1 "Libre Caslon Display",serif;color:#fff;margin:14px 0 6px}.back h1 span{font-family:"Tiro Devanagari Hindi",serif;color:#F3C46B;font-size:.55em;margin-left:12px}
.back .k{font:600 18px "Cinzel",serif;letter-spacing:.34em;color:#F3C46B}
.back .q{font:italic 26px/1.5 "Libre Caslon Text",serif;max-width:760px;margin:22px auto 0;color:#D8CDBA}
.contact{position:absolute;left:60px;right:60px;bottom:96px;display:flex;justify-content:center;gap:48px;border-top:1px solid rgba(243,196,107,.5);padding-top:22px;font:26px "IBM Plex Mono",monospace;color:#fff}
.contact a{color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:12px}
.back .rf{border-color:rgba(243,196,107,.3);color:#A89A84}
@media print{@page{size:1080px 1350px;margin:0}html,body{background:#fff}.bar{display:none}.stack{padding:0;gap:0;display:block}
 .pw{width:1080px;aspect-ratio:auto;height:1350px;box-shadow:none;break-after:page}.pg{transform:none}}
"""

FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Tiro+Devanagari+Hindi&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">'
SCALE = "<script>function fit(){document.querySelectorAll('.pw').forEach(w=>w.style.setProperty('--s',w.clientWidth/1080))}addEventListener('resize',fit);fit();</script>"


def pages(J):
    S = J["stats"]; L = J["lead"]; A = J.get("articles", []); out = []
    pol = J.get("policy", []); br = J.get("briefs", [])
    # plan page numbers for the contents box
    n_pol = -(-len(pol) // 5) if pol else 0
    n_br = -(-len(br) // 12) if br else 0
    first_art = 3
    toc = [(a.get("kicker", ""), a.get("headline", ""), first_art + i) for i, a in enumerate(A)]
    p_pol = first_art + len(A); p_pic = p_pol + n_pol; p_br = p_pic + 2
    if pol: toc.append(("Law & Policy", "Parliament, Government, Bar and legal education", p_pol))
    toc.append(("The Month in Law", "Pictographs of the month's rulings", p_pic))
    if br: toc.append(("In Brief", "More rulings of the month", p_br))
    lb = L.get("body", []); cut, wc = 0, 0
    for para in lb:
        wc += len(para.split())
        if cut and wc > 150: break
        cut += 1
    # 1 cover
    out.append(f"""<div class="in"><header class="mast"><div class="k">The Monthly Journal of</div><h1>Nirnay Daily<span>निर्णय</span></h1>
<div class="sub">India's courts and laws, month by month</div><div class="d"><span>{E(J.get("issue",""))}</span><span>{E(S["monthName"])}</span></div></header>
<div class="cover-grid"><div><div class="kline">{'<span class="lm">Landmark</span>' if L.get("landmark") else ''}<span class="kick">{E(L.get("kicker"))}</span></div><h2>{E(L.get("headline"))}</h2>
<p class="deck">{E(L.get("deck"))}</p><div class="cols">{paras(lb[:cut], cap=True)}</div><p class="note">Continued on page 2 →</p></div>
<aside class="inside"><h3>Inside this issue</h3><ol>{"".join(f'<li><span><small>{E(k)}</small>{E(h)}</span><b>{p}</b></li>' for k, h, p in toc[:9])}</ol></aside></div></div>""")
    # 2 lead continued
    out.append(f"""<div class="in">{run_head(J, "Lead story")}<div class="kick">{E(L.get("kicker"))} · continued</div><h2 style="font-size:44px">{E(L.get("headline"))}</h2>
{casebox(L)}<div class="cols" style="font-size:{fs(lb[cut:])}">{paras(lb[cut:])}</div><div class="push">{heldbox(L)}</div></div>""")
    # articles
    for a in A:
        out.append(f"""<div class="in">{run_head(J, (a.get("kicker") or "").split("·")[-1].strip() or "Judgment")}
<div class="kline">{ico(section_icon(a), 30, "#9E2A2B")}{'<span class="lm">Landmark</span>' if a.get("landmark") else ''}<span class="kick">{E(a.get("kicker"))}</span></div><h2>{E(a.get("headline"))}</h2>
<p class="deck">{E(a.get("deck"))}</p>{casebox(a)}<div class="cols" style="font-size:{fs(a.get("body"))}">{paras(a.get("body"), cap=True)}</div><div class="push">{heldbox(a)}</div></div>""")
    # law & policy
    colr = {"Legislature": C_HC, "Executive & Government": "#5B4B8A", "Judiciary": C_SC, "Bar & Bar Councils": C_DC,
            "Legal Education & Careers": "#2F7D4F", "Other Legal News": "#6B6254"}
    for i in range(0, len(pol), 5):
        items = "".join(f'<div class="pitem"><span class="tag" style="--c:{colr.get(x.get("cat"), "#6B6254")}">{E(x.get("cat"))}</span><div>'
                        f'<h4>{E(x.get("headline"))}</h4><p>{E(x.get("text"))}</p><div class="meta">{E(x.get("region") or "All India")} · Source: {E(x.get("srcName"))}</div></div></div>'
                        for x in pol[i:i + 5])
        out.append(f'<div class="in">{run_head(J, "Law & Policy")}<div class="kick">Parliament · Government · Bar · Legal education</div><h3 class="sec">Law &amp; Policy</h3><div class="plist">{items}</div></div>')
    # pictographs
    d = S["digest"]
    out.append(f"""<div class="in">{run_head(J, "The Month in Law")}<div class="kick">Pictograph</div><h3 class="sec">The month in law</h3>
<div class="panel"><h4>Where the rulings came from · {d["items"]} judgments &amp; orders</h4>{icon_array(d)}</div>
<div class="panel"><h4>How the cases stood</h4><div class="kinds">{kinds_row(d)}</div></div>
<div class="panel"><h4>Rulings reported each day</h4><div style="width:64%">{month_calendar(S)}</div></div></div>""")
    hcs = [(c.replace(" HC", ""), v) for c, v in d["byCourt"] if c.endswith(" HC")]
    out.append(f"""<div class="in">{run_head(J, "The Month in Law")}<div class="kick">Pictograph</div><h3 class="sec">Subjects, courts and tribunals</h3>
<div class="panel"><h4>Areas of law in the month's rulings</h4>{bars(d["byArea"], C_SC, 8, label_w=330, rh=40)}</div>
<div class="two"><div class="panel"><h4>Busiest High Courts</h4>{bars(hcs, C_HC, 7, w=440, label_w=190, rh=40)}</div>
<div class="panel"><h4>Tribunal rulings</h4>{bars(S["tribunals"]["byTribunal"], C_DC, 7, w=440, label_w=130, rh=40)}</div></div>
<div class="panel"><h4>Legal developments by subject</h4>{bars(S["news"]["byCategory"], "#5B4B8A", 6, label_w=380, rh=40)}</div></div>""")
    # briefs
    for i in range(0, len(br), 12):
        items = "".join(f'<div class="brief"><div class="ct">{E(x.get("court"))}</div><b>{E(x.get("caseName"))}</b><p>{E(x.get("note"))}</p></div>' for x in br[i:i + 12])
        out.append(f'<div class="in">{run_head(J, "In Brief")}<div class="kick">More rulings of the month</div><h3 class="sec">In brief</h3><div class="briefs">{items}</div></div>')
    # back page
    out.append(f"""<div class="in"><div class="k">The Monthly Journal of</div><h1>Nirnay Daily<span>निर्णय</span></h1>
<div class="k" style="letter-spacing:.2em">{E(S["monthName"])} · {E(J.get("issue",""))}</div>
<p class="q">निर्णय — a decision; a judgment.</p></div>
<div class="contact"><a href="{IG}">{ico("ig", 34, "#F3C46B")} {IG_HANDLE}</a><a href="mailto:{MAIL}">{ico("mail", 34, "#F3C46B")} {MAIL}</a></div>""")
    html_pages = []
    for i, body in enumerate(out, 1):
        cls = "pg back" if i == len(out) else "pg"
        foot = run_foot(J, i) if i > 1 else run_foot(J, 1)
        html_pages.append(f'<div class="pw"><section class="{cls}" id="p{i}"><div class="frame"></div>{body}{foot}</section></div>')
    return html_pages


def page(J):
    S = J["stats"]; pg = pages(J)
    title = f'{S["monthName"]} · Nirnay Daily Monthly Journal'
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            f'<title>{E(title)}</title><meta name="description" content="{E(J["lead"].get("headline"))}">{FONTS}'
            f'<script>window.NIRNAY_GA_ID="G-5Q7X36D16B";</script><script src="../assets/analytics.js"></script><style>{CSS}</style></head><body>'
            f'<div class="bar"><a href="../">← Nirnay Daily</a><span>{len(pg)} pages · <a href="./">All issues</a> · <a href="#" onclick="print();return false">Save as PDF</a></span></div>'
            f'<main class="stack">{"".join(pg)}</main>{SCALE}</body></html>')


def index_page():
    issues = []
    for f in sorted(glob.glob(P("data", "journal", "????-??.json")), reverse=True):
        J = json.load(open(f))
        issues.append(f'<li><a href="{E(J["month"])}.html"><small>{E(J.get("issue",""))}</small><b>{E(J["stats"]["monthName"])}</b><span>{E(J["lead"].get("headline"))}</span></a></li>')
    body = "".join(issues) or '<li class="soon">The first issue will be published on 1 October 2026.</li>'
    css = """body{margin:0;background:#FBF7EF;color:#221E1B;font-family:"Libre Caslon Text",Georgia,serif}
.bar{display:flex;justify-content:space-between;padding:10px 16px;background:#221E1B;font:13px "IBM Plex Mono",monospace;color:#fff}.bar a{color:#F3C46B;text-decoration:none}
header{text-align:center;padding:30px 16px 14px;border-bottom:5px double #221E1B;max-width:900px;margin:0 auto}
header .k{font:600 14px "Cinzel",serif;letter-spacing:.32em;color:#9E2A2B}header h1{font:400 clamp(48px,10vw,88px)/1 "Libre Caslon Display",serif;margin:8px 0}
header h1 span{font-family:"Tiro Devanagari Hindi",serif;color:#9E2A2B;font-size:.55em;margin-left:10px}
ul{list-style:none;padding:0 16px;margin:24px auto;max-width:900px;display:grid;gap:12px}
li a{display:grid;gap:4px;padding:18px 20px;background:#fff;border:1px solid #D9CCB3;border-left:5px solid #9E2A2B;text-decoration:none;color:#221E1B}
li small{font:600 12px "Cinzel",serif;letter-spacing:.2em;color:#9E2A2B}li b{font:400 32px "Libre Caslon Display",serif}li span{font-style:italic;color:#4A423A}
.soon{text-align:center;font-style:italic;color:#4A423A;padding:30px}
footer{text-align:center;padding:20px;font:14px "IBM Plex Mono",monospace;color:#7A6E5E}footer a{color:#9E2A2B}"""
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            f'<title>Monthly Journal · Nirnay Daily</title>{FONTS}<script>window.NIRNAY_GA_ID="G-5Q7X36D16B";</script><script src="../assets/analytics.js"></script><style>{css}</style></head><body>'
            f'<div class="bar"><a href="../">← Nirnay Daily</a><span>A new issue on the 1st of every month</span></div>'
            f'<header><div class="k">The Monthly Journal of</div><h1>Nirnay Daily<span>निर्णय</span></h1></header><ul>{body}</ul>'
            f'<footer><a href="{IG}">{IG_HANDLE}</a> · <a href="mailto:{MAIL}">{MAIL}</a></footer></body></html>')


def main():
    month = sys.argv[1]; src = P("data", "journal", f"{month}.json")
    J = json.load(open(src))
    if "stats" not in J or "--restat" in sys.argv:
        J["stats"] = js.stats(month)
        json.dump(J, open(src, "w"), ensure_ascii=False, indent=1)
    os.makedirs(P("journal"), exist_ok=True)
    out = page(J)
    assert "�" not in out
    open(P("journal", f"{month}.html"), "w").write(out)
    open(P("journal", "index.html"), "w").write(index_page())
    print("built", month, "pages:", out.count('class="pw"'))


if __name__ == "__main__":
    main()
