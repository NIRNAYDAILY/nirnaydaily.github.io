#!/usr/bin/env python3
"""Count what Nirnay Daily published in one month, from the site's own data files.

Usage: python3 tools/journal_stats.py 2026-09   -> prints JSON (also used by journal_build.py)
Every number here is computed from data/ — nothing is estimated.
"""
import json, os, sys, calendar, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda *p: os.path.join(ROOT, *p)
MON = {m: i for i, m in enumerate(calendar.month_abbr) if m}


def load(name, default=None):
    try:
        return json.load(open(D("data", name)))
    except Exception:
        return default


def iso_from_short(s):
    """'26 Sep 2026' -> '2026-09-26'"""
    try:
        d, m, y = s.split()[:3]
        return f"{int(y):04d}-{MON[m[:3]]:02d}-{int(d):02d}"
    except Exception:
        return None


def editions(latest, archive, key=lambda e: iso_from_short(e["edition"].get("dateShort", ""))):
    seen, out = set(), []
    for e in ([latest] if latest else []) + (archive or []):
        k = key(e)
        if k and k not in seen:
            seen.add(k); out.append((k, e))
    return out


def stats(month):
    y, m = map(int, month.split("-"))
    days = calendar.monthrange(y, m)[1]
    inm = lambda iso: bool(iso) and iso.startswith(month)
    S = {"month": month, "monthName": f"{calendar.month_name[m]} {y}", "daysInMonth": days}

    # Judgments & orders digest
    dig = [(k, e) for k, e in editions(load("digest.json"), load("digest-archive.json", [])) if inm(k)]
    per_day = collections.Counter(); courts = collections.Counter(); kinds = collections.Counter()
    sc = hc = dc = 0; cases = []
    for k, e in dig:
        for ch in e.get("chapters", []):
            for p in ch.get("pages", []):
                for it in p.get("items", []):
                    per_day[k] += 1; kinds[it.get("kind", "")] += 1
                    if ch["id"] == "sc": sc += 1; courts["Supreme Court"] += 1
                    elif ch["id"] == "hc": hc += 1; courts[(p.get("court") or "High Court") + " HC"] += 1
                    else: dc += 1
        for h in e.get("highlights", []):
            cases.append({"date": k, "court": h.get("court"), "caseName": h.get("caseName"), "text": h.get("text")})
    S["digest"] = {"editions": len(dig), "items": sc + hc + dc, "supremeCourt": sc, "highCourts": hc, "districtCourts": dc,
                   "highCourtsCovered": len([c for c in courts if c.endswith(" HC")]),
                   "byCourt": courts.most_common(), "byKind": kinds.most_common(),
                   "perDay": {k: per_day[k] for k in sorted(per_day)}, "highlights": cases}

    # Tribunals
    tri = [(k, e) for k, e in editions(load("tribunals.json"), load("tribunals-archive.json", [])) if inm(k)]
    tc = collections.Counter(it.get("tribunal", "Other") for _, e in tri for it in e.get("items", []))
    S["tribunals"] = {"editions": len(tri), "items": sum(tc.values()), "byTribunal": tc.most_common()}

    # Legal News (twice daily)
    nws = [(e["edition"].get("edition_id"), e) for e in ([load("news.json")] if load("news.json") else []) + (load("news-archive.json", []) or [])]
    nws = [(k, e) for k, e in dict(nws).items() if k and inm(e["edition"].get("iso", ""))]
    cat = collections.Counter(); reg = collections.Counter(); heads = []
    for k, e in nws:
        for it in e.get("items", []):
            cat[it.get("cat", "Other Legal News")] += 1; reg[it.get("region", "All India")] += 1
            heads.append({"edition": k, "cat": it.get("cat"), "region": it.get("region"), "headline": it.get("headline"), "src": it.get("src"), "srcName": it.get("srcName")})
    S["news"] = {"editions": len(nws), "items": sum(cat.values()), "byCategory": cat.most_common(),
                 "states": len([r for r in reg if r and r != "All India"]), "byRegion": reg.most_common(), "headlines": heads}

    # Full Supreme Court judgments added to the library
    lib = load("sc-library.json", {"items": []})["items"]
    added = [i for i in lib if i.get("origin") == "daily" and inm(i.get("added", ""))]
    S["library"] = {"addedThisMonth": len(added), "addedNames": [i.get("name") for i in added],
                    "total": len(lib), "landmarks": len([i for i in lib if i.get("origin") == "landmark"])}

    # Careers
    pool = load("careers-pool.json", {"sections": []})
    items = [(s["id"], s.get("title", s["id"]), it) for s in pool.get("sections", []) for it in s.get("items", [])]
    booklets = [(k, e) for k, e in editions(load("careers.json"), load("careers-archive.json", []), key=lambda e: e["edition"].get("iso")) if inm(k)]
    S["careers"] = {"openNow": len(items), "addedThisMonth": len([1 for *_, it in items if inm(it.get("added", ""))]),
                    "bySection": collections.Counter(t for _, t, _ in items).most_common(),
                    "booklets": len(booklets),
                    "closingSoon": [{"name": it.get("name"), "org": it.get("org")} for *_, it in items if it.get("status") == "Closing soon"][:6]}

    # Bare Acts & News Archive (library size at month end)
    ba = load("bare-acts.json", {})
    S["bareActs"] = {"central": len(ba.get("central", []) if isinstance(ba.get("central"), list) else ba.get("central", {}).get("items", [])),
                     "maharashtra": len(ba.get("maharashtra", []) if isinstance(ba.get("maharashtra"), list) else ba.get("maharashtra", {}).get("items", []))}
    ix = load("news-history/index.json", {})
    S["newsArchive"] = {"stories": sum((ix.get("counts") or {}).values()), "years": len(ix.get("years", []))}
    S["generated"] = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).isoformat(timespec="minutes")
    return S


if __name__ == "__main__":
    print(json.dumps(stats(sys.argv[1]), ensure_ascii=False, indent=1))
