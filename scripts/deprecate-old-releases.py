#!/usr/bin/env python3
"""Prepend deprecation warning to old releases (v1.2.0..v1.2.3) via GitHub API."""
import json, os, urllib.request, urllib.parse

TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO = "hjalilvand2004-coder/dr.eskandarieh_memari"
WARN = (
    "> ⛔ **این نسخه منسوخ است — دانلود نکنید.** "
    "برای نصب/ارتقاء از ریلیز **v1.3.0** استفاده کنید و فایل `Shiraz-Atlas-v1.3.0-Windows.zip` (≈۱۱۷ مگابایت) را بگیرید.\n\n"
    "> ⛔ **DEPRECATED — do not download.** Use release **v1.3.0** instead.\n\n---\n\n"
)

def api(path, method="GET", data=None):
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/{path}",
        data=json.dumps(data).encode() if data is not None else None,
        headers={"Authorization": f"token {TOKEN}", "Content-Type": "application/json", "User-Agent": "rel-mgr"},
        method=method,
    )
    with urllib.request.urlopen(req) as r:
        return json.load(r)

rels = api("releases?per_page=20")
for rel in rels:
    tag = rel["tag_name"]
    if tag in ("v1.2.0", "v1.2.1", "v1.2.2", "v1.2.3"):
        body = rel.get("body") or ""
        if "این نسخه منسوخ است" in body:
            print(f"{tag}: already marked")
            continue
        api(f"releases/{rel['id']}", method="PATCH", data={"body": WARN + body})
        print(f"{tag}: deprecation warning added")
    elif tag == "v1.3.0":
        print(f"{tag}: latest, untouched")
print("done")
