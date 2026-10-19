#!/usr/bin/env python3
"""Update v1.3.0 release body: add explicit warning about GitHub's auto
'Source code (zip)' link and the green 'Code -> Download ZIP' button."""
import json, os
import urllib.request

TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO = "hjalilvand2004-coder/dr.eskandarieh_memari"
RELEASE_ID = 417025514  # v1.3.0

API = f"https://api.github.com/repos/{REPO}/releases/{RELEASE_ID}"


def req(url, method="GET", data=None):
    r = urllib.request.Request(url, method=method)
    r.add_header("Authorization", f"token {TOKEN}")
    r.add_header("Accept", "application/vnd.github+json")
    body = json.dumps(data).encode() if data else None
    if body:
        r.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(r, body) as resp:
        return json.loads(resp.read().decode())


rel = req(API)
body = rel["body"]

marker = "اگر فایل دانلودی شما حدود ۹۸ مگابایت است، فایل اشتباهی است (سورس مخزن). فایل صحیح ~۱۱۷ مگ است."

extra = (
    marker + "\n\n"
    "**دو مسیر خطای رایج (هر دو فقط سورسِ اجرایی‌نشدنی می‌دهند):**\n"
    "1. دکمه سبز **«Code → Download ZIP»** در صفحه اصلی مخزن\n"
    "2. لینک **«Source code (zip)»** که گیت‌هاب زیر لیست فایل‌های همین صفحه ریلیز نشان می‌دهد\n\n"
    "هر دو همیشه حدود ۹۶ مگ هستند و در همه نسخه‌ها تقریباً ثابت‌اند، چون فقط سورس کد هستند. "
    "فایل صحیح همیشه **Shiraz-Atlas-vX.Y.Z-Windows.zip** با حجم ~۱۱۷ مگ است."
)

if "Source code (zip)" in body:
    print("Already patched — no change needed.")
else:
    new_body = body.replace(marker, extra)
    req(API, method="PATCH", data={"body": new_body})
    print("v1.3.0 release body patched with explicit Source-code warning.")
