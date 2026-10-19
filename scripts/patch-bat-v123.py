#!/usr/bin/env python3
"""CRLF-safe patcher for START-WINDOWS.bat / شروع-سامانه.bat (v1.2.2 -> v1.2.3)"""
import sys, io

def patch(path: str) -> None:
    with open(path, "rb") as f:
        raw = f.read()
    crlf = b"\r\n" in raw
    text = raw.decode("utf-8")
    if crlf:
        # work in normalized space, restore at the end
        text = text.replace("\r\n", "\n")

    orig = text

    # 1) title + header block version
    text = text.replace(
        "title Shiraz Smart Atlas v1.2.2 - Morphology and Energy",
        "title Shiraz Smart Atlas v1.2.3 - Morphology and Energy",
    )
    text = text.replace(
        "rem  v1.2.2 - resilient start:",
        "rem  v1.2.3 - resilient start:",
    )
    # 2) add stale-instance remark after port-fallback remark line
    text = text.replace(
        "rem    * Auto port fallback if 3000 is busy  (app writes port.txt)\n",
        "rem    * Auto port fallback if 3000 is busy  (app writes port.txt)\n"
        "rem    * v1.2.3: stale instances of THIS app from earlier runs are\n"
        "rem      closed automatically (old copies kept answering on port\n"
        "rem      3000 with \"Internal Server Error\" after upgrading)\n",
    )
    # 3) banner: version + no static URL
    text = text.replace(
        "echo   Shiraz Smart Atlas v1.2.2",
        "echo   Shiraz Smart Atlas v1.2.3",
    )
    text = text.replace(
        "echo   URL   : http://localhost:3000   auto-fallback if busy",
        "echo   URL   : shown below after start - browser opens automatically",
    )
    # 4) FA guidance lines after "Starting server..."
    fa_block = (
        "echo FA: پس از آماده‌شدن، نشانی صحیح در همین پنجره نمایش داده می‌شود\n"
        "echo     و مرورگر خودکار باز می‌شود. اگر تب قدیمی localhost:3000 باز است،\n"
        "echo     آن را ببندید و فقط از نشانی جدید استفاده کنید.\n"
        "echo FA: نمونه‌های قدیمی همین سامانه که از اجرای قبل مانده‌اند،\n"
        "echo     به‌طور خودکار بسته می‌شوند.\n"
    )
    marker = "echo Starting server... your browser will open automatically.\n"
    if marker in text and "نمونه‌های قدیمی" not in text:
        text = text.replace(marker, marker + fa_block)

    if text == orig:
        print(f"[WARN] no changes applied to {path}")
    if crlf:
        text = text.replace("\n", "\r\n")
    with open(path, "wb") as f:
        f.write(text.encode("utf-8"))
    print(f"[OK] patched {path} (crlf={crlf})")

if __name__ == "__main__":
    for p in sys.argv[1:]:
        patch(p)
