#!/usr/bin/env python3
"""Add researched legal-news stories to the News Archive (data/news-history/).

Usage:  python3 tools/news_history.py PERIOD_FILE.json [MORE.json ...]

Each input file: {"period": "...", "items": [{date, cat, region, body, headline, text, why?, src, srcName}]}
Stories are validated (category, date, allowed legal/official source domain), de-duplicated
against what is already in the archive, and written to data/news-history/<year>.json plus index.json.
"""
import json, os, re, sys, datetime, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "news-history")
CATS = ["Judiciary", "Bar & Bar Councils", "Legislature", "Executive & Government",
        "Legal Education & Careers", "Other Legal News"]
LEGAL = ["livelaw.in", "barandbench.com", "scconline.com", "verdictum.in", "lawbeat.in",
         "latestlaws.com", "lawtrend.in", "prsindia.org", "barcouncilofindia.org",
         "consortiumofnlus.ac.in", "sansad.in", "images.assettype.com"]
OFFICIAL_SUFFIX = (".gov.in", ".nic.in")
START, END = "2021-10-01", datetime.date.today().isoformat()


def ok_domain(url):
    host = urllib.parse.urlparse(url).netloc.lower().split(":")[0]
    if host.endswith(OFFICIAL_SUFFIX) or host in ("gov.in", "nic.in"):
        return True
    return any(host == d or host.endswith("." + d) for d in LEGAL)


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def clean(s):
    s = (s or "").replace("�", "").strip()
    return re.sub(r"\s+", " ", s)


def main(files):
    os.makedirs(OUT, exist_ok=True)
    years = {}
    for fn in os.listdir(OUT):
        m = re.fullmatch(r"(\d{4})\.json", fn)
        if m:
            years[m.group(1)] = json.load(open(os.path.join(OUT, fn)))["items"]
    seen_src = {(i["src"], i["date"]) for it in years.values() for i in it}
    seen_head = {(i["date"], norm(i["headline"])[:60]) for it in years.values() for i in it}
    added = rejected = 0
    for f in files:
        for i in json.load(open(f)).get("items", []):
            i = {k: clean(v) if isinstance(v, str) else v for k, v in i.items()}
            why = None
            if i.get("cat") not in CATS: why = "category"
            elif not re.fullmatch(r"\d{4}-\d{2}-\d{2}", i.get("date", "")) or not (START <= i["date"] <= END): why = "date"
            elif not i.get("src", "").startswith("http") or not ok_domain(i["src"]): why = "source " + i.get("src", "")
            elif not i.get("headline") or not i.get("text"): why = "empty"
            key = (i.get("date"), norm(i.get("headline"))[:60])
            if not why and (key in seen_head or ((i["src"], i["date"]) in seen_src and "monthly-policy-review" not in i["src"])):
                why = "duplicate"
            if why:
                rejected += 1
                print("skip:", why, "|", i.get("date"), i.get("headline", "")[:70])
                continue
            item = {k: i[k] for k in ("date", "cat", "region", "body", "headline", "text", "why", "src", "srcName") if i.get(k)}
            years.setdefault(i["date"][:4], []).append(item)
            seen_src.add((i["src"], i["date"])); seen_head.add(key); added += 1
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).isoformat(timespec="minutes")
    for y, items in years.items():
        items.sort(key=lambda x: x["date"], reverse=True)
        json.dump({"year": int(y), "count": len(items), "items": items},
                  open(os.path.join(OUT, f"{y}.json"), "w"), ensure_ascii=False, indent=1)
    ys = sorted(years, reverse=True)
    json.dump({"years": ys, "counts": {y: len(years[y]) for y in ys}, "updated": now,
               "note": "Top legal news stories each month, from legal publications and official sources."},
              open(os.path.join(OUT, "index.json"), "w"), ensure_ascii=False, indent=1)
    print(f"added {added}, skipped {rejected}; total {sum(len(v) for v in years.values())} stories in {len(ys)} years")


if __name__ == "__main__":
    main(sys.argv[1:])
