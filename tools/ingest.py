#!/usr/bin/env python3
"""Nirnay Daily – apply new editions dropped into inbox/ to the website data.

The scheduled tasks write ONE small file per update into inbox/ (through the GitHub
tools, no git needed). This script runs in GitHub Actions on every push that touches
inbox/, merges each file into data/ with the archive rules, then deletes it.

Inbox file names start with their kind:
  digest_<anything>.json      a judgments & orders edition     -> data/digest.json (+ archive, 120)
  tribunals_<anything>.json   a tribunals edition              -> data/tribunals.json (+ archive, 120)
  news_<anything>.json        a Legal News edition             -> data/news.json (+ archive, 120)
  booklet_<anything>.json     a weekly careers booklet edition -> data/careers.json (+ archive, 52)
  pool_<anything>.json        the whole Careers Portal         -> data/careers-pool.json
  journal_<YYYY-MM>.json      a Monthly Journal issue -> data/journal/ + journal/<YYYY-MM>.html
  sc_<anything>.json          Supreme Court judgments to host:
      {"date":"YYYY-MM-DD","items":[{"name","src" (official sci.gov.in PDF),"citation","date",
        "keys":[...], "parties":["distinctive party name", ...]}]}
      Each PDF is downloaded from the official site, checked to contain the party names,
      and stored in judgments/sc/daily-<date>.json with an entry in data/sc-library.json.
A report of every run is written to data/ingest-log.json.
"""
import datetime, glob, json, os, re, subprocess, sys, tempfile, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
NOW = datetime.datetime.now(IST)
TODAY = NOW.date().isoformat()
SECTIONS = ["judiciary", "govt", "exams", "llm", "private"]
NEWS_CATS = ["Judiciary", "Bar & Bar Councils", "Legislature", "Executive & Government", "Legal Education & Careers", "Other Legal News"]
log = {"ran": NOW.isoformat(timespec="minutes"), "processed": [], "errors": [], "notes": []}


def load(p, default):
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def save(p, obj):
    s = json.dumps(obj, ensure_ascii=False, indent=1)
    s = s.replace("�", "▯")
    with open(p, "w", encoding="utf-8") as f:
        f.write(s + "\n")


def archive_apply(latest_path, archive_path, new, key, keep):
    cur = load(latest_path, None)
    arc = load(archive_path, [])
    if not isinstance(arc, list):
        arc = []
    k_new = key(new)
    if not k_new:
        raise ValueError("new edition has no date/id")
    if cur and key(cur) and key(cur) != k_new:
        if not any(key(e) == key(cur) for e in arc):
            arc.insert(0, cur)
    arc = [e for e in arc if key(e) != k_new]          # a re-run replaces, never duplicates
    arc.sort(key=lambda e: key(e) or "", reverse=True)
    save(archive_path, arc[:keep])
    save(latest_path, new)


def iso_short(s):
    try:
        return datetime.datetime.strptime(s.strip(), "%d %b %Y").date().isoformat()
    except Exception:
        return None


# ---------------------------------------------------------------- handlers
def h_digest(d):
    ids = [c.get("id") for c in d.get("chapters", [])]
    for need in ("sc", "hc", "dc"):
        if need not in ids:
            raise ValueError(f"digest has no chapter '{need}'")
    archive_apply("data/digest.json", "data/digest-archive.json", d, lambda e: iso_short(e["edition"].get("dateShort", "")), 120)
    n = sum(len(p.get("items", [])) for c in d["chapters"] for p in c.get("pages", []))
    return f"judgments & orders {d['edition']['dateShort']}: {n} items"


def h_tribunals(d):
    if "edition" not in d or not isinstance(d.get("items"), list):
        raise ValueError("tribunals edition needs 'edition' and 'items'")
    archive_apply("data/tribunals.json", "data/tribunals-archive.json", d, lambda e: iso_short(e["edition"].get("dateShort", "")), 120)
    return f"tribunals {d['edition']['dateShort']}: {len(d['items'])} items"


def h_news(d):
    ed = d.get("edition", {})
    if not ed.get("edition_id") or not isinstance(d.get("items"), list):
        raise ValueError("news edition needs edition.edition_id and items")
    for it in d["items"]:
        for f in ("cat", "headline", "text", "date", "src"):
            if not it.get(f):
                raise ValueError(f"news item missing '{f}': {it.get('headline', '')[:60]}")
        if it["cat"] not in NEWS_CATS:
            it["cat"] = "Other Legal News"
    archive_apply("data/news.json", "data/news-archive.json", d, lambda e: e.get("edition", {}).get("edition_id"), 120)
    return f"legal news {ed['edition_id']}: {len(d['items'])} items"


def h_booklet(d):
    if not d.get("edition", {}).get("iso") or not d.get("sections"):
        raise ValueError("booklet needs edition.iso and sections")
    archive_apply("data/careers.json", "data/careers-archive.json", d, lambda e: e.get("edition", {}).get("iso"), 52)
    return f"careers booklet {d['edition']['iso']}"


def deadline(it):
    for f in it.get("facts", []):
        if f.get("iso"):
            return f["iso"]
    return None


def h_pool(d):
    secs = {s.get("id"): s for s in d.get("sections", [])}
    if [s for s in SECTIONS if s not in secs]:
        raise ValueError("careers pool must have the five sections " + ", ".join(SECTIONS))
    removed = 0
    for sid in SECTIONS:
        s = secs[sid]
        keep = []
        for it in s.get("items", []):
            dl = deadline(it)
            if dl and dl < TODAY:
                removed += 1
                continue
            if dl and it.get("status") in ("Open", "Closing soon"):
                days = (datetime.date.fromisoformat(dl) - NOW.date()).days
                it["status"] = "Closing soon" if days <= 7 else "Open"
            keep.append(it)
        rank = {"Closing soon": 0, "Open": 1, "Awaited": 2}
        keep.sort(key=lambda it: (rank.get(it.get("status"), 3), deadline(it) or "9999"))
        s["items"] = keep
    d["sections"] = [secs[s] for s in SECTIONS]
    d["updated"] = TODAY
    save("data/careers-pool.json", d)
    n = sum(len(s["items"]) for s in d["sections"])
    return f"careers portal: {n} listings ({removed} closed removed)"


def norm(s):
    s = unicodedata.normalize("NFKD", s or "").lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def slugify(name, year, taken):
    first = re.split(r"\s+v(?:s)?\.?\s+|\s+versus\s+", name, flags=re.I)[0]
    words = [w for w in norm(first).split() if w not in {"m", "s", "the", "of", "sri", "smt", "shri", "dr", "ms", "mr", "and", "ors", "anr", "state"}]
    base = "-".join(words[:2]) or "judgment"
    slug = f"{base}-{year}"
    i = 2
    while slug in taken:
        slug = f"{base}-{year}-{i}"; i += 1
    return slug


def fetch_pdf(url, out):
    url = url.replace("main.sci.gov.in", "api.sci.gov.in")
    if not re.match(r"^https://(www\.|api\.|main\.)?sci\.gov\.in/", url):
        raise ValueError("not an official sci.gov.in link")
    subprocess.run(["curl", "-sSL", "--max-time", "120", "-A",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
                    "-e", "https://www.sci.gov.in/", "-o", out, url], check=True)
    with open(out, "rb") as f:
        if f.read(4) != b"%PDF":
            raise ValueError("download is not a PDF (the site may have refused it)")
    return url


def h_sc(d):
    lib = load("data/sc-library.json", {"items": []})
    items = lib.setdefault("items", [])
    taken = {i["slug"] for i in items}
    known = {norm(i.get("name")) for i in items} | {i.get("src") for i in items if i.get("src")}
    date = d.get("date") or TODAY
    bundle_path = f"judgments/sc/daily-{date}.json"
    bundle = load(bundle_path, {"date": date, "items": {}})
    added, failed = [], []
    for it in d.get("items", []):
        name = it.get("name", "").strip()
        if not name or norm(name) in known or it.get("src") in known:
            continue
        try:
            with tempfile.TemporaryDirectory() as tmp:
                pdf = os.path.join(tmp, "j.pdf")
                src = fetch_pdf(it.get("src", ""), pdf)
                txt = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, check=True).stdout.decode("utf-8", "replace")
                pdf_bytes = open(pdf, "rb").read()
            pages = txt.split("\f")
            while pages and not pages[-1].strip():
                pages.pop()
            head = norm(" ".join(pages[:3]))
            checks = [p for p in (it.get("parties") or []) if p] + ([it["citation"]] if re.search(r"INSC", it.get("citation", "")) else [])
            if not checks:
                raise ValueError("no party names given to verify the PDF")
            missing = [c for c in checks if norm(c) not in head]
            if missing:
                raise ValueError("PDF does not match the case (not found: " + "; ".join(missing) + ")")
            pages = [p.replace("�", "▯") for p in pages]
            year = (it.get("date") or date)[:4]
            slug = slugify(name, year, taken); taken.add(slug)
            bundle["items"][slug] = {"slug": slug, "name": name, "src": src, "pages": pages}
            e = {"slug": slug, "name": name, "type": "text", "file": bundle_path, "pages": len(pages),
                 "origin": "daily", "source": "Supreme Court of India", "words": len(" ".join(pages).split()),
                 "src": src, "added": TODAY, "keys": it.get("keys") or [p.lower() for p in it.get("parties", [])][:2]}
            if not it.get("citation"):   # read the neutral citation from the Court's own first page
                mc = re.search(r"\b(20\d\d)\s+INSC\s+(\d+)", " ".join(pages[:2]))
                if mc: it["citation"] = f"{mc.group(1)} INSC {mc.group(2)}"
            if it.get("citation"): e["citation"] = it["citation"]
            if it.get("caseNo"): e["caseNo"] = it["caseNo"]
            if it.get("date"): e["date"] = it["date"]
            if os.environ.get("NIRNAY_PUBLIC_PDFS") == "1":   # save the official PDF for free download
                os.makedirs("judgments/sc/pdf", exist_ok=True)
                with open(f"judgments/sc/pdf/{slug}.pdf", "wb") as fh:
                    fh.write(pdf_bytes)
                e.update({"pdf": f"judgments/sc/pdf/{slug}.pdf", "pdfKind": "original", "pdfBytes": len(pdf_bytes)})
            items.append(e); added.append(name)
        except Exception as ex:
            failed.append(f"{name}: {ex}")
    if bundle["items"]:
        save(bundle_path, bundle)
    # retention: daily bundles kept 365 days and under 400 MB
    bundles = sorted(glob.glob("judgments/sc/daily-*.json"))
    cutoff = (NOW.date() - datetime.timedelta(days=365)).isoformat()
    total = sum(os.path.getsize(b) for b in bundles)
    for b in bundles:
        bdate = b[len("judgments/sc/daily-"):-5]
        if bdate < cutoff or total > 400 * 1024 * 1024:
            total -= os.path.getsize(b); os.remove(b)
            for i in items:
                if i.get("origin") == "daily" and i.get("file") == b and i.get("pdf") and os.path.exists(i["pdf"]):
                    os.remove(i["pdf"])
            items[:] = [i for i in items if not (i.get("origin") == "daily" and i.get("file") == b)]
    lib["updated"] = TODAY
    save("data/sc-library.json", lib)
    if failed:
        log["notes"].append("Supreme Court judgments not hosted: " + " | ".join(failed))
    return f"supreme court full texts: {len(added)} added" + (f", {len(failed)} could not be verified" if failed else "")


class Waiting(Exception):
    pass


def h_journal(d):
    month = d.get("month") or ""
    if not re.match(r"^\d{4}-\d{2}$", month) or not d.get("lead"):
        raise ValueError("journal needs 'month' (YYYY-MM) and 'lead'")
    pub = d.get("published") or ""
    if pub and TODAY < pub:
        raise Waiting(f"monthly journal {month} is waiting for its publication date {pub}")
    os.makedirs("data/journal", exist_ok=True)
    save(f"data/journal/{month}.json", d)
    subprocess.run([sys.executable, "tools/journal_build.py", month], check=True)
    return f"monthly journal {month} published at journal/{month}.html"


HANDLERS = {"journal": h_journal, "digest": h_digest, "tribunals": h_tribunals, "news": h_news, "booklet": h_booklet, "pool": h_pool, "sc": h_sc}


def recent_index():
    """Small file the scheduled tasks read to avoid repeating stories."""
    eds = ([load("data/news.json", None)] + load("data/news-archive.json", []))[:14]
    trs = ([load("data/tribunals.json", None)] + load("data/tribunals-archive.json", []))[:7]
    save("data/recent.json", {
        "updated": NOW.isoformat(timespec="minutes"),
        "news": [{"edition": e["edition"].get("edition_id"), "headline": i.get("headline"), "src": i.get("src")} for e in eds if e for i in e.get("items", [])],
        "tribunals": [{"edition": e["edition"].get("dateShort"), "caseName": i.get("caseName"), "src": i.get("src")} for e in trs if e for i in e.get("items", [])],
        "latest": {
            "digest": (load("data/digest.json", {}).get("edition") or {}).get("dateShort"),
            "tribunals": (load("data/tribunals.json", {}).get("edition") or {}).get("dateShort"),
            "news": (load("data/news.json", {}).get("edition") or {}).get("edition_id"),
            "careersBooklet": (load("data/careers.json", {}).get("edition") or {}).get("iso"),
            "careersPool": load("data/careers-pool.json", {}).get("updated"),
        },
    })


def main():
    files = sorted(f for f in glob.glob("inbox/*.json"))
    # oldest name first, but the careers pool after a booklet of the same run
    for f in files:
        base = os.path.basename(f)
        kind = base.split("_", 1)[0].split("-", 1)[0].lower()
        h = HANDLERS.get(kind)
        try:
            if not h:
                raise ValueError(f"unknown kind '{kind}' (use digest_, tribunals_, news_, booklet_, pool_ or sc_)")
            with open(f, encoding="utf-8") as fh:
                data = json.load(fh)
            if isinstance(data, dict) and set(data) == {"kind", "data"}:
                data = data["data"]
            log["processed"].append(f"{base}: {h(data)}")
            os.remove(f)
        except Waiting as w:
            log["notes"].append(f"{base}: {w}")
        except Exception as ex:
            log["errors"].append(f"{base}: {ex}")
            os.makedirs("inbox/failed", exist_ok=True)
            os.replace(f, os.path.join("inbox/failed", base))
    recent_index()
    save("data/ingest-log.json", log)
    print(json.dumps(log, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
