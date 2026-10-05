#!/usr/bin/env python3
"""Stores the official PDF of every State Act listed in data/state-acts-pdfs.json
as a download on this repository's Releases page (one release per State).

Why Releases: the PDFs of all Madhya Pradesh, Rajasthan and Chhattisgarh Acts come
to more than 2 GB, which is over GitHub Pages' 1 GB website limit. Release files
do not count towards that limit and download from github.com directly.

Each PDF is fetched from India Code (indiacode.gov.in), the Government of India's
official repository of Acts, and must match the SHA-256 recorded in the manifest
(taken from the copy checked when the list was built). Files already uploaded are
skipped, so the workflow can be re-run safely.
"""
import hashlib, json, os, subprocess, sys, time, urllib.request

REPO = os.environ.get("GITHUB_REPOSITORY", "NIRNAYDAILY/nirnaydaily.github.io")
MAN = json.load(open("data/state-acts-pdfs.json"))
NAMES = {"madhya-pradesh": "Madhya Pradesh", "rajasthan": "Rajasthan", "chhattisgarh": "Chhattisgarh"}


def gh(*args, check=True):
    r = subprocess.run(["gh", *args], capture_output=True, text=True)
    if check and r.returncode:
        raise RuntimeError(" ".join(args[:3]) + ": " + r.stderr.strip())
    return r


def fetch(bid, path):
    url = f"https://indiacode.gov.in/server/api/core/bitstreams/{bid}/content"
    for i in range(6):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Nirnay Daily; +https://nirnaydaily.github.io)"})
            with urllib.request.urlopen(req, timeout=600) as r, open(path, "wb") as fh:
                while True:
                    b = r.read(1 << 20)
                    if not b:
                        break
                    fh.write(b)
            return True
        except Exception as e:
            print("  retry", bid, e, flush=True)
            time.sleep(5 * (i + 1))
    return False


summary = []
for st, items in MAN["states"].items():
    tag = MAN["tagPrefix"] + st
    if gh("release", "view", tag, "-R", REPO, check=False).returncode:
        gh("release", "create", tag, "-R", REPO, "--title", f"{NAMES[st]} Acts — official PDFs",
           "--notes", f"Official PDFs of {NAMES[st]} State Acts, as published by the Government of India on "
                      f"India Code (https://indiacode.gov.in). Used by the Bare Acts section of https://nirnaydaily.github.io.",
           "--latest=false")
    have = {a["name"] for a in json.loads(gh("release", "view", tag, "-R", REPO, "--json", "assets").stdout)["assets"]}
    added = failed = 0
    for it in items:
        name = it["slug"] + ".pdf"
        if name in have:
            continue
        tmp = "/tmp/" + name
        ok = fetch(it["id"], tmp)
        if ok:
            h = hashlib.sha256(open(tmp, "rb").read()).hexdigest()
            ok = h == it["sha256"]
            if not ok:
                print("  checksum differs, skipped:", name, flush=True)
        if ok:
            r = gh("release", "upload", tag, tmp, "-R", REPO, "--clobber", check=False)
            ok = r.returncode == 0
            if not ok:
                print("  upload failed:", name, r.stderr.strip(), flush=True)
        if os.path.exists(tmp):
            os.remove(tmp)
        added += ok
        failed += not ok
    line = f"{NAMES[st]}: {len(items)} listed, {len(have)} already stored, {added} added, {failed} failed"
    print(line, flush=True)
    summary.append(line)

if os.environ.get("GITHUB_STEP_SUMMARY"):
    open(os.environ["GITHUB_STEP_SUMMARY"], "a").write("\n".join("- " + s for s in summary) + "\n")
