#!/usr/bin/env python3
"""Nirnay Daily – make a downloadable PDF for every judgment in data/sc-library.json.

- Daily judgments whose official PDF was saved (judgments/sc/pdf/<slug>.pdf, "pdfKind":"original")
  are left exactly as the Court issued them.
- Scanned landmark judgments (type "img") are rebuilt page-for-page from the stored scans.
- Text judgments get a clean, typeset A4 PDF of the full text, page by page as in the original,
  with a Nirnay Daily title page.
Only items without a PDF are processed, unless --all is given.
Usage: python3 tools/make_pdfs.py [--all] [slug ...]
"""
import io, json, os, re, sys, datetime
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
OUT = "judgments/sc/pdf"
FONTS = os.path.join("tools", "fonts")


def reflow(t):
    """Same paragraph logic as the website reader."""
    out, cur = [], ""
    for raw in t.split("\n"):
        l = raw.strip()
        if not l:
            if cur: out.append(cur); cur = ""
            continue
        if not cur:
            cur = l; continue
        ends = re.search(r'[.:;?!)\]"”’]$', cur)
        starts = re.match(r'^([A-Z(“"\'‘]|\d+[.)]|\(\w+\))', l)
        if ends and starts and (len(l) < 55 or re.match(r'^(\d+[.)]|\([a-z0-9]+\))', l, re.I) or len(cur) < 60):
            out.append(cur); cur = l
        elif cur.endswith("-") and re.match(r"^[a-z]", l):
            cur = cur[:-1] + l
        else:
            cur += " " + l
    if cur: out.append(cur)
    return out


def landmark_meta():
    """Citation, date and bench of landmark judgments, as listed on the website."""
    try:
        html = open("index.html", encoding="utf-8").read()
    except Exception:
        return {}
    meta = {}
    for m in re.finditer(r'\{y:\d+,d:"(\d{4}-\d\d-\d\d)"([^{}]*?)name:"([^"]+)"(?:,cit:"([^"]*)")?', html):
        b = re.search(r"bench:(\d+)", m.group(2))
        meta[m.group(3)] = {"date": m.group(1), "citation": m.group(4) or "", "bench": b.group(1) if b else ""}
    return meta


LM = None


def load_pages(e):
    d = json.load(open(e["file"], encoding="utf-8"))
    if "items" in d and isinstance(d["items"], dict):
        d = d["items"][e["slug"]]
    return d["pages"]


def typeset(e, pages, out):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
    from reportlab.lib.colors import HexColor
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, PageBreak, KeepTogether
    for name, f in (("Serif", "DejaVuSerif.ttf"), ("Serif-Bold", "DejaVuSerif-Bold.ttf"), ("Serif-Italic", "DejaVuSerif-Italic.ttf")):
        if name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(name, os.path.join(FONTS, f)))
    ink, red, grey = HexColor("#1D2230"), HexColor("#7A1C2B"), HexColor("#596171")
    body = ParagraphStyle("b", fontName="Serif", fontSize=10.5, leading=15, alignment=TA_JUSTIFY, textColor=ink, spaceAfter=6)
    kick = ParagraphStyle("k", fontName="Serif-Bold", fontSize=9, leading=12, textColor=red, alignment=TA_CENTER, spaceAfter=4)
    title = ParagraphStyle("t", fontName="Serif-Bold", fontSize=19, leading=24, textColor=ink, alignment=TA_CENTER, spaceAfter=10)
    meta = ParagraphStyle("m", fontName="Serif", fontSize=10.5, leading=15, textColor=grey, alignment=TA_CENTER, spaceAfter=4)
    note = ParagraphStyle("n", fontName="Serif-Italic", fontSize=9.5, leading=13.5, textColor=grey, alignment=TA_CENTER, spaceAfter=4)
    pgno = ParagraphStyle("p", fontName="Serif-Bold", fontSize=8.5, leading=11, textColor=red, spaceBefore=6, spaceAfter=8)

    def deco(c, doc):
        c.saveState()
        c.setFont("Serif", 8); c.setFillColor(grey)
        c.drawString(20 * mm, 12 * mm, "Nirnay Daily  ·  nirnaydaily.github.io")
        c.drawRightString(A4[0] - 20 * mm, 12 * mm, f"{doc.page}")
        c.setStrokeColor(red); c.setLineWidth(0.6); c.line(20 * mm, A4[1] - 14 * mm, A4[0] - 20 * mm, A4[1] - 14 * mm)
        c.setFont("Serif", 7.5); c.drawString(20 * mm, A4[1] - 12 * mm, e["name"][:110])
        c.restoreState()

    doc = BaseDocTemplate(out, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=20 * mm, bottomMargin=20 * mm,
                          title=e["name"], author="Supreme Court of India", subject="Full text · Nirnay Daily", creator="Nirnay Daily")
    fr = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")
    doc.addPageTemplates([PageTemplate(id="p", frames=[fr], onPage=deco)])
    E = lambda s: escape(s or "")
    global LM
    if LM is None: LM = landmark_meta()
    lm = LM.get(e["name"], {})
    cit = e.get("citation") or lm.get("citation") or ""
    date = ""
    d0 = e.get("date") or lm.get("date")
    if d0:
        try: date = datetime.date.fromisoformat(d0).strftime("Decided %d %B %Y").replace(" 0", " ") + (f" · {lm['bench']}-judge bench" if lm.get("bench") else "")
        except Exception: pass
    story = [Spacer(1, 30 * mm), Paragraph("SUPREME COURT OF INDIA", kick), Paragraph(E(e["name"]), title)]
    for m in (cit, date, f"{len(pages)} pages of the original"):
        if m: story.append(Paragraph(E(m), meta))
    story += [Spacer(1, 8 * mm),
              Paragraph(E(e.get("note") or "Full text of the judgment as issued by the Supreme Court of India, reproduced page by page. "
                          "Page markers follow the original document."), note),
              Paragraph("Nirnay Daily · nirnaydaily.github.io · nirnaydaily@gmail.com", note), PageBreak()]
    for i, p in enumerate(pages):
        story.append(Paragraph(f"— Original page {i + 1} of {len(pages)} —", pgno))
        for par in reflow(p.replace("�", "▯")):
            story.append(Paragraph(E(par), body))
    doc.build(story)


def scans(e, out):
    import img2pdf
    ix = json.load(open(e["file"]))
    base = os.path.dirname(e["file"])
    chunks, imgs = {}, []
    for p in ix["pages"]:
        c = p[0]
        if c not in chunks:
            chunks[c] = open(os.path.join(base, f"p{c:02d}.png"), "rb").read()
        imgs.append(chunks[c][p[1]:p[1] + p[2]])
    open(out, "wb").write(img2pdf.convert(imgs, title=e["name"], author="Supreme Court of India"))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--all" in sys.argv
    lib = json.load(open("data/sc-library.json", encoding="utf-8"))
    os.makedirs(OUT, exist_ok=True)
    done = []
    for e in lib["items"]:
        if args and e["slug"] not in args:
            continue
        out = f"{OUT}/{e['slug']}.pdf"
        if e.get("pdfKind") == "original" and os.path.exists(out):
            e["pdf"] = out; continue
        if e.get("pdf") and os.path.exists(e["pdf"]) and not force:
            continue
        try:
            if e.get("type") == "img":
                scans(e, out); e["pdfKind"] = "scan"
            else:
                typeset(e, load_pages(e), out); e["pdfKind"] = "typeset"
            e["pdf"] = out; e["pdfBytes"] = os.path.getsize(out); done.append(e["slug"])
        except Exception as ex:
            print("could not make PDF for", e["slug"], ex, file=sys.stderr)
    json.dump(lib, open("data/sc-library.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps({"made": done}))


if __name__ == "__main__":
    main()
