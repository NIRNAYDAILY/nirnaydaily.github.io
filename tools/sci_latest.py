#!/usr/bin/env python3
"""Pick up EVERY judgment on the Supreme Court of India's own "Latest Judgments" list
(https://www.sci.gov.in/ home page) and queue the ones the library does not have yet.

It writes inbox/sc_<decision date>-auto.json files; tools/ingest.py (h_sc) then downloads
each official PDF, checks it against the party name, and adds it to Full Judgments.
Official source only: every link is the Court's own sci.gov.in PDF.
"""
import html, json, os, re, subprocess, sys
from collections import defaultdict

HOME = "https://www.sci.gov.in/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
GENERIC = {"the", "state", "of", "union", "india", "and", "ors", "anr", "others", "another", "govt", "government",
           "m", "s", "ms", "mr", "smt", "shri", "sri", "dr", "ltd", "pvt", "limited", "private", "company", "co",
           "through", "thr", "its", "secretary", "director", "commissioner", "commr", "addl", "dy", "deputy",
           "chief", "general", "manager", "officer", "authority", "corporation", "board", "district", "collector",
           "central", "bureau", "investigation", "national", "west", "east", "north", "south", "uttar", "pradesh",
           "madhya", "andhra", "himachal", "arunachal", "tamil", "nadu", "bengal", "kerala", "karnataka",
           "maharashtra", "punjab", "haryana", "rajasthan", "gujarat", "bihar", "odisha", "orissa", "assam",
           "telangana", "jharkhand", "chhattisgarh", "uttarakhand", "goa", "delhi", "nct", "sikkim", "tripura",
           "manipur", "meghalaya", "mizoram", "nagaland", "jammu", "kashmir", "ladakh", "puducherry", "u", "p",
           "lrs", "lr", "dead", "by", "vs", "v", "versus", "etc", "tax", "income", "commercial", "bank", "insurance"}
SMALL = {"of", "and", "the", "for", "in", "on", "at", "to", "by", "through", "thr"}


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def tidy_party(p):
    p = re.sub(r"\s+", " ", p).strip(" .-")
    out = []
    for i, w in enumerate(p.split(" ")):
        lw = w.lower()
        if i and lw in SMALL:
            out.append(lw)
        elif re.fullmatch(r"(?:[A-Za-z]\.){2,}[A-Za-z]?\.?", w):   # initials like U.P. / M.P.
            out.append(w.upper())
        elif lw in ("m/s", "m/s."):
            out.append("M/s")
        else:
            out.append(".".join(x[:1].upper() + x[1:].lower() for x in w.split(".")))
    return " ".join(out)


def check_word(party):
    """A distinctive word of the party name that should appear on the judgment's first pages."""
    words = [w for w in norm(party).split() if w not in GENERIC and len(w) >= 4 and not w.isdigit()]
    return max(words, key=len) if words else None


def status(msg):
    import datetime
    print("sci_latest:", msg)
    with open("data/sci-latest-status.json", "w", encoding="utf-8") as fh:
        json.dump({"checked": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%MZ"), "result": msg}, fh)


def main():
    lib = json.load(open("data/sc-library.json", encoding="utf-8"))
    have = set()
    for i in lib.get("items", []):
        m = re.search(r"diary_no=(\d+).*?order_date=([\d-]+)", i.get("src", ""))
        if m:
            have.add((m.group(1), m.group(2)))
    have_names = {norm(i.get("name")) for i in lib.get("items", [])}

    page = subprocess.run(["curl", "-sSL", "--max-time", "90", "-A", UA, HOME],
                          capture_output=True, check=True).stdout.decode("utf-8", "replace")
    rows = re.findall(r'<a href="(https://www\.sci\.gov\.in/view-pdf/\?diary_no=(\d+)&(?:amp;)?type=j&(?:amp;)?order_date=([\d-]+)'
                      r'&(?:amp;)?from=latest_judgements_order)"[^>]*>(.*?)</a>', page, flags=re.S)
    if not rows:
        status("no judgments found on the Supreme Court home page (layout may have changed)")
        return
    queued = defaultdict(list)
    seen = set()
    for _url, diary, odate, inner in rows:
        if (diary, odate) in have or (diary, odate) in seen:
            continue
        seen.add((diary, odate))
        text = html.unescape(re.sub(r"<[^>]+>", " ", inner.split("<span")[0]))
        text = re.sub(r"\s+", " ", text).strip()
        parts = [p.strip() for p in re.split(r"\s+-\s+", text) if p.strip()]
        title = parts[0] if parts else ""
        caseno = parts[1] if len(parts) > 1 else ""
        sides = re.split(r"\s+VS\.?\s+|\s+V/S\.?\s+|\s+VERSUS\s+", title, maxsplit=1, flags=re.I)
        if len(sides) != 2:
            continue
        pet, res = tidy_party(sides[0]), tidy_party(sides[1])
        name = f"{pet} v. {res}"
        if norm(name) in have_names:
            continue
        word = check_word(pet) or check_word(res)
        if not word:
            continue
        src = f"https://www.sci.gov.in/sci-get-pdf/?diary_no={diary}&type=j&order_date={odate}&from=latest_judgements_order"
        item = {"name": name, "src": src, "date": odate, "parties": [word],
                "keys": [k for k in [norm(sides[0])[:40], norm(sides[1])[:40]] if k][:2]}
        if caseno:
            item["caseNo"] = caseno
        queued[odate].append(item)
    os.makedirs("inbox", exist_ok=True)
    n = 0
    for odate, items in sorted(queued.items()):
        with open(f"inbox/sc_{odate}-auto.json", "w", encoding="utf-8") as fh:
            json.dump({"date": odate, "items": items}, fh, ensure_ascii=False, indent=1)
        n += len(items)
    status(f"{len(rows)} on the Court's list, {n} new queued")


if __name__ == "__main__":
    try:
        main()
    except Exception as ex:   # never block the rest of the daily update
        status(f"skipped – {ex}")
