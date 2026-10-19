#!/usr/bin/env python3
"""Patch v1.3.0 texts: BAT FA hints (CRLF-safe), VERSION.txt, README-فارسی.txt"""
import io, os

ROOT = "/home/z/my-project/portable"

# ── 1) START-WINDOWS.bat — add version-chip hint lines ──
bat = os.path.join(ROOT, "START-WINDOWS.bat")
with open(bat, "rb") as f:
    data = f.read().decode("utf-8")

anchor = "به‌طور خودکار بسته می‌شوند."
hint = (
    "echo FA: پس از بازشدن سامانه، در نوار بالا عبارت «سرور نسخهٔ ۱.۳.۰»\r\n"
    "echo     را ببینید؛ اگر عدد دیگری بود یعنی یک نمونهٔ قدیمی هنوز فعال است.\r\n"
)
if "سرور نسخهٔ ۱.۳.۰" not in data:
    assert anchor in data, "BAT anchor not found"
    data = data.replace(anchor, anchor + "\r\n" + hint.rstrip("\r\n"), 1)
    with open(bat, "wb") as f:
        f.write(data.encode("utf-8"))
    print("[bat] hint lines added")
else:
    print("[bat] already patched")

# ── 2) VERSION.txt ──
version_txt = """شیراز | اطلس هوشمند ریخت‌شناسی و انرژی
نسخه: 1.3.0
تاریخ: 1404-07-27 (2025-10-19)
ساخت: 1.3.0+zombie-cleanup-identity-chip

تغییرات اصلی نسبت به 1.2.3:
- پاکسازی قطعی «زامبی‌ها»: اگر پروسهٔ node از اجرای قبل هنوز زنده
  مانده باشد (حتی وقتی هنگ کرده و به HTTP جواب نمی‌دهد) بر اساس
  مسیر پوشهٔ برنامه شناسایی و بسته می‌شود — این همان علت تکرار
  «Internal Server Error» بعد از ارتقاء بود: پروسهٔ قدیمی فایل‌های
  استاتیک جدید را از دیسک می‌خواند ولی کد قدیمی را از حافظه اجرا می‌کرد
- شناسنامهٔ زندهٔ سرور در نوار بالای سامانه: «سرور نسخهٔ ۱.۳.۰»
  اگر عدد دیگری دیدید یعنی یک نمونهٔ قدیمی در حال سرو است
- هشدار شفاف در صفحه هنگام بی‌پاسخ‌بودن سرور یا ناسازگاری نسخه
- ثبت کرش‌های غیرمنتظره در app/crash-log.txt (به‌همراه diagnostic-report.txt)
- شمارهٔ نسخه از یک منبع یگانه (lib/version.ts) در سرور، رابط کاربری و لانچر

اجرا: دوبار کلیک روی START-WINDOWS.bat (یا شروع-سامانه.bat)
پیش‌نیاز: هیچ (ران‌تایم Node.js همراه بسته است) — اینترنت لازم نیست
توصیه: پوشه برنامه را در مسیر محلی ساده نگه دارید (خارج از OneDrive)
"""
with open(os.path.join(ROOT, "VERSION.txt"), "w", encoding="utf-8") as f:
    f.write(version_txt)
print("[version.txt] written")

# ── 3) README-فارسی.txt — prepend download guidance ──
readme_path = os.path.join(ROOT, "README-فارسی.txt")
guide = """═══════════════════════════════════════════════════════════════
فایل درست برای دانلود — خیلی مهم
═══════════════════════════════════════════════════════════════
✔ فایل صحیح:  Shiraz-Atlas-v1.3.0-Windows.zip
✔ حجم تقریبی صحیح: حدود ۱۲۰ تا ۱۲۵ مگابایت
✘ اگر فایلی حدود ۹۵ تا ۱۰۱ مگابایت دانلود کردید (Repository.zip)،
  آن فایل «سورس مخزن گیت» است، نه بستهٔ اجرایی ویندوز — اجرایش نکنید
✔ همیشه از صفحهٔ آخرین ریلیز در گیت‌آپ، فایل Shiraz-Atlas-vX.Y.Z-Windows.zip
  را دانلود کنید.
پس از دانلود: در یک پوشهٔ «جدید» استخراج کنید (روی پوشهٔ قبلی
استخراج نکنید) و دوبار کلیک روی START-WINDOWS.bat
═══════════════════════════════════════════════════════════════

"""
with open(readme_path, "r", encoding="utf-8") as f:
    body = f.read()
if "فایل درست برای دانلود" not in body:
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(guide + body)
    print("[readme] guidance prepended")
else:
    print("[readme] already patched")
print("OK")
