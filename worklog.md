# Worklog

---
Task ID: 1
Agent: main (Z.ai)
Task: پیاده‌سازی کامل «شیراز | اطلس هوشمند ریخت‌شناسی و انرژی» — سامانه وب فارسی RTL برای رساله دکتری معماری (ریخت‌شناسی بافت تاریخی + کارایی انرژی)

Work Log:
- بارگذاری اسکیل fullstack-dev و راه‌اندازی محیط (Next.js 16 + TS + Tailwind 4 + shadcn/ui + Prisma/SQLite)
- نصب echarts و vazirmatn (فونت محلی OFL در public/fonts)
- Design System: پالت شیراز (لاجوردی #1f4e6e، فیروزه‌ای #17877d، مسی #b4693b، ماسه‌ای، خاکی) در globals.css با تم روشن/تیره، girih pattern، scrollbar، print stylesheet، reduce-motion
- layout.tsx: lang=fa dir=rtl + ThemeProvider
- prisma/schema.prisma: ۱۷ موجودیت (Project, ResearchQuestion, Hypothesis, Chapter, Task, Note, Reference, Document, Dataset, SpatialEntity, MorphologyIndicator, WeatherFile, SimulationModel, ExperimentRun, Scenario, MLModel, ValidationResult, ChartSpecification, Report, AuditEvent) + db:push
- کتابخانه‌های علمی (همه با محاسبه واقعی):
  - science/rng.ts: mulberry32 seeded PRNG
  - science/stats.ts: describe, pearson, computeMetrics (MAE/RMSE/R²/NMBE/CV(RMSE)/MAPE با قرارداد علامت مستند و حذف هوشمند MAPE), fitScaler/transform, parseNumeric (ارقام فارسی)
  - science/kmeans.ts: K-Means با k-means++ و Silhouette
  - science/ols.ts: OLS با معادلات نرمال + ridge 1e-8، groupSplit گروهی بلوکی
  - science/morphology.ts: shoelace area، perimeter، centroid، compactness گرِویل، sharedWallLength، orientation، skyline CV، H/W، coverage
  - science/atlas-compute.ts: محاسبه شاخص‌ها برای ۵۱ بنا/۳ بلوک از هندسه
  - science/demo.ts: مولد بافت نمایشی (seed=1403، ۵۱ بنا، ۳ بلوک حیاط‌مرکز، انرژی صوری برچسب‌دار، سری کالیبراسیون ۱۶ دوره)
- API Routes: bootstrap (seed+load)، atlas (محاسبه هندسی زنده)، ml (eda/kmeans/regression با ثبت MLModel و ValidationResult)، validation (مسیر a/b/c با آستانه Guideline 14 و توضیح caveat)، datasets (CSV/GeoJSON/EPW با تحلیل کیفیت دو مرحله‌ای analyze→import، پارس CSV با کوتیشن و ارقام فارسی)، project (CRUD میز پژوهش)، scenarios (برآورد مدل جانشین + خودداری از عدد صوری برای سناریوهای خارج دامنه)، assistant (بازیابی واژه‌ای دقیق + حالت AI با z-ai-web-dev-sdk و سقوط ایمن)
- SPA پوسته: login سه‌نقشی (مدیر/پژوهشگر/مشاهده‌گر) با attribution دکتر سارا اسکندریه - ماه افزارهوشمندرسا MahAI.ir؛ AppShell با sidebar لاجوردی ۱۱ ماژول، breadcrumb، وضعیت ذخیره، تعویض تم، toggle انیمیشن
- ۱۱ ماژول کامل: dashboard، research (پرسش/فرضیه/فصل/کانبان drag&drop/یادداشت/منابع BibTeX-RIS/گراف ارتباطات ECharts)، data (فرهنگ داده + ورود دو مرحله‌ای)، atlas (SVG تعاملی pan/zoom/layers/viridis choropleth/انتخاب↔نمودار/کاتالوگ شاخص با فرمول و محدودیت)، simulation (صادقانه «پیکربندی‌نشده»)، lab (EDA/KMeans/OLS با seed و کنترل نشت)، validation (سه مسیر + تاریخچه)، charts (استودیو با PNG 3x/SVG/CSV/منشأ)، scenarios (برآورد جانشین)، assistant (ارجاع‌دار)، about (فهرست صادقانه اجراشده/ناقص/خارجی)
- تست علمی: scripts/test-science.ts — ۴۲ تست همه سبز (معیارها دستی، OLS بازیابی y=3+2x، بدون نشت گروهی، Silhouette>0.9، shoelace، بازتولیدپذیری seed)
- رفع باگ‌ها: ایمپورت جاافتاده seedIfEmpty (atlas/datasets/validation)، Roadmap→Route در lucide، فیلد createdAt (ExperimentRun/Scenario)، تطبیق واژه‌ای دقیق دستیار، خروج از useMemo با React Compiler
- راستی‌آزمایی مرورگر (agent-browser): ورود، داشبورد، اطلس (انتخاب بنا A-13 + پنل)، EDA اجرا، رگرسیون از UI (R²=0.833, MAE=5.21)، سناریو (-1.8%، ۴۷ بنا)، دستیار با citation و حالت AI واقعی، کانبان، منابع، استودیو، تم تیره، موبایل 390px — بدون خطای کنسول
- تست نهایی API: ۸/۸ سبز؛ lint پاک

Stage Summary:
- مسیر کامل «ورود داده → اطلس و شاخص‌های واقعی → تحلیل آماری/ML واقعی → ارزیابی معیارها → نمودار قابل استناد → گزارش چاپی» برقرار است
- همه نتایج انرژی «نمایشی ـ فاقد اعتبار برای استناد علمی» برچسب دارند؛ موتور شبیه‌سازی صادقانه پیکربندی‌نشده است
- بازتولیدپذیری: seed، نسخه داده (demo-morph-energy-v1)، MLModel/ValidationResult/AuditEvent ثبت می‌شوند
- جایگزینی داده واقعی: از ماژول پایگاه داده (CSV/GeoJSON/EPW با گزارش کیفیت) پشتیبانی می‌شود

---
Task ID: 2
Agent: main (Z.ai)
Task: بسته‌بندی نسخه‌دار و پرتابل سامانه (درخواست کاربر: فایل زیپ با نسخه‌بندی + اجرای تک‌کلیکی روی لپ‌تاپ بدون پایتون/پای‌چارم)

Work Log:
- اضافه شدن binaryTargets=["native","windows"] به prisma/schema.prisma و regen کلاینت (query_engine-windows.dll.node در بیلد گنجانده شد)
- بیلد production با output=standalone (Next.js 16.1.3) — ۱۱ مسیر API + SPA
- دانلود Node.js v22.21.1 برای سه پلتفرم (win-x64 exe، linux-x64، darwin-arm64) از nodejs.org با تأیید SHA256
- مونتاژ بسته پرتابل dist/Shiraz-Atlas-v1.0.0-Portable: app/ (سرور مستقل + db نمایشی)، runtime/ (سه node)، لانچرها
- START-WINDOWS.bat (+ کپی «شروع-سامانه.bat»): تنظیم خودکار DATABASE_URL مطلق با اسلش رو به جلو، باز شدن خودکار مرورگر با PowerShell poll، پورت قابل تغییر
- START-MAC-LINUX.sh: تشخیص OS/ARCH، chmod خودکار، باز شدن مرورگر با curl poll
- حذف .env مطلق از بسته؛ package.json بسته → name=shiraz-smart-atlas, version=1.0.0
- README-فارسی.txt (UTF-8 BOM): اجرا بدون نصب، عیب‌یابی، اصول صداقت علمی، attribution MahAI.ir
- VERSION.txt + CHANGELOG.md (semver 1.0.0) + env.example (بدون کلید واقعی)
- تست دود کامل از خود بسته با node همراه: صفحه ۲۰۰، bootstrap (پروژه/۴ پرسش/۲ دیتاست)، اطلس ۵۱ بنا/۳ بلوک، رگرسیون OLS واقعی با ثبت MLModel+ValidationResult، K-Means واقعی
- کشف مهم: فایل SQLite نو (۰ بایتی) جدول ندارد — seedIfEmpty به db:push وابسته است؛ DB بسته با اسکریپت scripts/rebuild-portable-db.sh از صفر ساخته شد (schema push + seed تمیز بدون رکورد آزمایشی)
- نسخه‌بندی git: commit «v1.0.0 — انتشار پرتابل» + tag v1.0.0؛ package.json اصلی → version 1.0.0
- خروجی‌ها در download/: Shiraz-Atlas-v1.0.0-Portable.zip (191MB)، Shiraz-Atlas-v1.0.0-Source.zip (643KB از git archive)، SHA256SUMS-v1.0.0.txt؛ تست یکپارچگی unzip -t سبز

Stage Summary:
- بسته پرتابل روی «لپ‌تاپ بدون هیچ پیش‌نیازی» اجرا می‌شود: استخراج ZIP → دوبار کلیک روی START-WINDOWS.bat → مرورگر خودکار روی localhost:3000
- هر سه پلتفرم (ویندوز ۶۴بیت، مک سیلیکون، لینوکس x64) پشتیبانی می‌شوند؛ DB پشتیبان‌گیری/انتقال با کپی app/db/custom.db
- نسخه بعد می‌تواند: اتوپرویژنینگ DB در اولین اجرا (بدون نیاز به db:push)، لانچر با انتخاب پورت در صورت اشغال، بیلد مخصوص Intel Mac

---
Task ID: 3
Agent: main (Z.ai)
Task: گرفتن اسکرین‌شات از همه صفحات سامانه (لاگین تا همه قابلیت‌ها) به درخواست کاربر

Work Log:
- بوت سرور پرتابل v1.0.0 (استندالون + node همراه) و اسکرین‌شات با agent-browser در سشن واحد (sandbox پروسه پس‌زمینه بین فراخوانی‌ها را می‌کشد)
- کشف و رفع ۴ مشکل اتوماسیون: input بدون type attribute (سلکتور input[type=text] نمی‌گیرد)، تب‌های Radix به event cascade نیاز دارند (pointerdown→click)، برچسب دکمه آموزش «آموزش و ارزیابی» است، انتخاب بنا با کلیک روی svg g.cursor-pointer
- ۱۵ اسکرین‌شات نهایی همه به‌صورت بصری راستی‌آزمایی شدند: لاگین، داشبورد، میز پژوهش، پایگاه داده، اطلس + انتخاب A-13 (پنل مشخصات کامل)، شبیه‌سازی (صادقانه پیکربندی‌نشده)، EDA (آمار واقعی ۵۱ بنا)، K-Means (Silhouette=0.282، radar+scatter)، رگرسیون OLS (R²=0.823 + خط 1:1 + باقیمانده)، اعتبارسنجی مسیر a (MAE=410.94، R²=0.687، CV(RMSE)=8.71% + توست)، استودیو نمودار (منشأ+خروجی‌ها)، سناریوها (چارچوب اصالت+محدودیت‌ها)، دستیار (پاسخ با ارجاع)، درباره (فهرست صادقانه اجراشده/ناقص/خارجی)
- خروجی: download/screenshots-v1.0.0/ (۱۵ PNG، 1600×900) + Shiraz-Atlas-Screenshots-v1.0.0.zip (تست یکپارچگی سبز)
- اسکریپت‌های قابل استفاده مجدد: scripts/capture-screenshots.sh + retake1..6

Stage Summary:
- ست کامل اسکرین‌شات برای ارائه/مستندات رساله آماده است؛ همه شات‌ها از بیلد پرتابل واقعی v1.0.0 (نه dev) گرفته شده‌اند

---
Task ID: 4
Agent: main (Z.ai)
Task: ارتقای گرافیک سامانه + سیستم تم چندگانه با تنظیم سراسری توسط ادمین در زمان اجرا (درخواست کاربر: «گرافیک ضعیف است... امکان تغییر تم در رنگ‌های مختلف فراهم شود، ادمین بتواند هنگام اجرا تنظیم کند»)

Work Log:
- طراحی Skin System مستقل از حالت روشن/تیره: ویژگی data-skin روی <html> با ۶ تم (شیراز کلاسیک، فیروزه‌ای، آبی تیره، شیشه‌ای مدرن/گلس‌مورفیسم، زعفرانی، زمردی) × دو حالت روشن/تیره = ۱۲ پالت کامل در globals.css
- بازنقشه‌برداری توکن‌های میراثی (lapis/turquoise/copper/sand/earth) در هر تم → تمام ماژول‌های موجود بدون تغییر کد با تم هماهنگ شدند
- مدل SystemSetting در Prisma (key=theme.skin) + API /api/settings (GET عمومی، POST فقط نقش ادمین + ثبت AuditEvent با action=theme.set)؛ db:push انجام شد
- SkinProvider: اعمال فوری data-skin، انتقال نرم رنگ‌ها (کلاس skin-switching)، localStorage برای جلوگیری از پرش + اسکریپت ضد FOUC در layout، همگام‌سازی با مقدار سرور (سرور مرجع نهایی)
- ThemeGallery: پاپ‌اور گالری ۶ تم با پیش‌نمایش رنگی، نشان «دسترسی مدیر» برای ادمین، توست «برای همه کاربران ثبت شد» / «پیش‌نمایش محلی» برای غیرادمین
- ارتقای گرافیک: body با هاله‌های radial رنگ تم، کارت‌ها با سایه چندلایه و hover نرم، سایدبار با لوگوی درخشان/نشانگر فعال/چیپ آیکن، هدر شیشه‌ای، StatCard با چیپ آیکن و عدد گرادیانی، SectionHeader با چیپ آیکن، انیمیشن module-fade، هاله‌های شناور orb با درفت آهسته
- بازطراحی صفحه ورود: پنل شیشه‌ای با girih زنده SVG (currentColor)، بج‌ها، کارت‌های ویژگی، CTA گرادیانی با sheen
- echart.tsx: پالت نمودار از متغیرهای CSS (--chart-1..5, --popover, --border, --foreground) خوانده می‌شود + MutationObserver روی data-skin → بازسازی نمودار هنگام تعویض تم
- راستی‌آزمایی مرورگری کامل: ۶ تم روشن + شیشه‌ای تیره + لاگین/خروج + رگرسیون OLS واقعی در تم شیشه‌ای تیره (R²=۰٫۸۲۳) + اطلس + ممیزی (۶ رکورد theme.set) + رفتار غیرادمین (پیش‌نمایش محلی، POST=403، ری‌لود=بازگشت به تم سرور) + موبایل 390px — صفر خطای کنسول
- بسته پرتابل v1.1.0: بیلد standalone، استخراج runtime سه‌پلتفرمی از زیپ v1.0.0 (بدون دانلود مجدد)، DB تمیز (پیش‌فرض شیراز)، VERSION.txt و CHANGELOG.md جدید، تست دود با node همراه: ۷/۷ سبز شامل GET/POST settings
- اصلاح مخزن گیت: خروجی‌های حجیم (download/، db/*.db، .zscripts و ...) از tracking خارج و به .gitignore اضافه شد؛ سورس‌زیپ از ۳۸۸MB به ۶۳۲KB رسید
- نسخه‌بندی: commit v1.1.0 + tag انوتیتشد؛ package.json → 1.1.0

Stage Summary:
- تحویلی‌ها در download/: Shiraz-Atlas-v1.1.0-Portable.zip (191MB)، Shiraz-Atlas-v1.1.0-Source.zip (632KB)، SHA256SUMS-v1.1.0.txt، Shiraz-Atlas-Themes-v1.1.0.zip (۱۲ اسکرین‌شات تم‌ها)
- معماری تم: افزودن تم جدید فقط با یک بلاک CSS (data-skin جدید) + یک ردیف در src/lib/skins.ts
- رفتار تم: ادمین=ثبت سراسری+ممیزی؛ پژوهشگر/مشاهده‌گر=پیش‌نمایش محلی تا ری‌لود

---
Task ID: 5
Agent: main (Z.ai)
Task: تحویل فایل زیپ نسخه جدید v1.1.0 در ادامه ارسال تصاویر تم‌ها (درخواست کاربر: «خود فایل زیپ نسخه جدید را نفرستادی... نسخه جدید خود سامانه را هم بفرست»)

Work Log:
- بازبینی وضعیت: Task ID 4 (سیستم تم + ارتقای گرافیک) کامل بود و هر ۴ خروجی v1.1.0 از قبل در download/ موجود؛ کاربر فایل زیپ نسخه جدید را دریافت نکرده بود
- راستی‌آزمایی تحویل: sha256sum -c روی هر سه فایل = OK؛ unzip -t روی سه ZIP = سالم؛ سایزها: Portable 191MB، Source 632KB، Themes 2.5MB
- ساخت و اجرای scripts/smoke-portable-v110.sh روی بسته پرتابل v1.1.0 با node همراه بسته: ۷/۷ سبز (صفحه 200، bootstrap، API جدید settings با skin=shiraz، اطلس ۵۱ بنا، OLS واقعی با ثبت MLModel/ValidationResult، K-Means، اعتبارسنجی)
- ZIPهای تحویلی دست‌نخورده ماندند (تست دود فقط روی dist اجرا شد؛ DB داخل ZIP همچنان اولیه/پاک است)

Stage Summary:
- فایل زیپ نسخه جدید v1.1.0 (پرتابل + سورس + چک‌سام) آماده و سالم در download/ برای دریافت نهایی کاربر؛ نسخه v1.0.0 و اسکرین‌شات‌ها نیز محفوظ

---
Task ID: 6
Agent: main (Z.ai)
Task: ارسال واقعی فایل زیپ نسخه جدید به کاربر (کاربر: «فراموش کردی فایل زیپ نسخه جدید را بفرستی»)

Work Log:
- علت یافت شد: ZIPهای v1.1.0 زودتر از تصاویر ساخته شده بودند و در پیام بعدی به‌عنوان پیوست جدید ظاهر نشدند؛ ابزار مستقیم send_message در محیط موجود نیست، تحویل از طریق download/ انجام می‌شود
- اقدام ۱ — نسخه فشرده فقط-ویندوز: استخراج ZIP اصلی دست‌نخورده (DB پاک ۲۴۴KB)، حذف runtime مک/لینوکس (۳۰۷MB) و START-MAC-LINUX.sh، افزودن هشدار «فقط ویندوز ۶۴بیت» به ابتدای README، zip → Shiraz-Atlas-v1.1.0-Windows.zip (116MB در برابر 191MB)
- تست دود نسخه ویندوزی با node سیستم: ۴/۴ سبز (صفحه 200، API تم skin=shiraz، اطلس، OLS واقعی)
- اقدام ۲ — تازه‌سازی mtime سه فایل اصلی v1.1.0 (touch) برای الصاق مجدد در پیام جاری
- SHA256SUMS-v1.1.0.txt به ۴ رکورد به‌روز شد (چک‌سام ویندوزی: 7bd71f55...)؛ unzip -t روی ZIP جدید سبز؛ پاک‌سازی winbuild

Stage Summary:
- دو مسیر تحویل موازی: ZIP کامل سه‌پلتفرمی (191MB) + ZIP فقط-ویندوز (116MB) — هر دو در download/ با mtime تازه؛ اگر پیوست بزرگ نرسد، نسخه 116MB جایگزین مطمئن است

---
Task ID: 7
Agent: main (Z.ai)
Task: انتشار نسخه v1.1.0 در گیت‌هاب (درخواست کاربر: آدرس github.com/hjalilvand2004-coder/dr.eskandarieh_memari.git)

Work Log:
- بررسی مخزن مقصد با git ls-remote: مخزن موجود، عمومی و خالی (بدون ref)؛ push بدون احراز هویت ممکن نیست
- محیط: بدون credential helper / .netrc / GITHUB_TOKEN و بدون gh CLI → توکن از کاربر لازم است
- آماده‌سازی انتشار: ساخت README.md فارسی حرفه‌ای (معرفی، ۱۱ ماژول، سیستم تم v1.1.0، اجرای پرتابل و سورس، اصول صداقت علمی، attribution) و commit (2aefd89)
- git remote add origin → hjalilvand2004-coder/dr.eskandarieh_memari.git
- ممیزی امنیتی push: هیچ فایل حساس (.env/db/token) ردیابی نمی‌شود؛ بزرگ‌ترین فایل bun.lock = 329KB
- پیش‌نمایش انتشار: شاخه main با ۱۰ کامیت + تگ‌های v1.0.0 و v1.1.0

Stage Summary:
- همه‌چیز برای push یک‌فرمانی آماده است؛ منتظر Personal Access Token (دسترسی repo) از کاربر برای اجرای push origin main --tags

---
Task ID: 8
Agent: main (Z.ai)
Task: پوش نسخه v1.1.0 به گیت‌هاب با توکن کاربر + Release با فایل‌های زیپ

Work Log:
- پوش اولیه رد شد: download/Shiraz-Atlas-v1.0.0-Portable.zip (191MB) در تاریخچه بود و از سقف ۱۰۰MB گیت‌هاب بزرگ‌تر
- اسکن تاریخچه: فقط همین یک blob بزرگ؛ حذف از تاریخچه با git-filter-repo (نصب در ~/.local، اجرا با مسیر کامل) → ۰ blob بزرگ، کامیت‌ها بازنویسی شدند، تگ‌ها بازنویسی و سالم
- ریموت توسط filter-repo حذف شده بود → دوباره add شد؛ پوش دوم موفق: main + تگ v1.0.0 + تگ v1.1.0
- راستی‌آزمایی با git ls-remote: refs/heads/main = ecfc569 و دو تگ روی گیت‌هاب
- ساخت GitHub Release v1.1.0 (id=416253136) با توضیحات فارسی + آپلود ۴ دارایی: Portable (191MB)، Windows (116MB)، Source (646KB)، SHA256SUMS — همه state=uploaded
- نکته: در میانه کار محدودیت نرخ API بدون توکن (۶۰/ساعت) خورد؛ با هدر Authorization حل شد

Stage Summary:
- مخزن: github.com/hjalilvand2004-coder/dr.eskandarieh_memari (main + ۲ تگ + README فارسی)
- Release: .../releases/tag/v1.1.0 با لینک دائمی دانلود هر ۴ فایل — مشکل تکراری «دریافت نشدن زیپ» دیگر برطرف است
- تاریخچه گیت اکنون کاملاً تمیز از فایل‌های حجیم است

---
Task ID: 9
Agent: main (Z.ai)
Task: قراردادن کل ساختار اجرای قابل حمل (BAT + ران‌تایم + اپ + DB) داخل مخزن گیت‌هاب و پوش (درخواست کاربر: اجرا روی لپ‌تاپ بدون پایتون/پای‌چارم با دوبار کلیک روی فایل‌های Bat)

Work Log:
- ساخت پوشه portable/ در ریشه مخزن از ZIP ویندوزی سالم (DB پاک): START-WINDOWS.bat، شروع-سامانه.bat، README-فارسی، VERSION، CHANGELOG، env.example، runtime/windows-x64/node.exe (82MB)، app استندالون کامل (node_modules ردیابی‌شده + .next + db)
- رفع اشکال نسخه: هر دو لانچر v1.0.0 بودند → v1.1.0 (در portable/ و dist/)
- START-MAC-LINUX.sh جدید برای کپی مخزن: اول ران‌تایم همراه، بعد node سیستم، در غیر این صورت راهنمای دریافت ZIP کامل از Releases
- .gitattributes (bat=CRLF، sh=LF، باینری‌ها binary) + استثنای .gitignore برای node_modules پرتابل + حذف app/.env مطلقِ باقی‌مانده از محیط ساخت
- تست دود از خود portable/ (۴/۴ سبز) و سپس تست از کلون تازه /tmp (root/bootstrap/OLS همه سبز) — شبیه‌سازی دقیق لپ‌تاپ کاربر
- پوش: ۱۶۱۷ فایل؛ هشدار GH001 برای node.exe 81.83MB (فقط هشدار، زیر سقف ۱۰۰MB)؛ main → 73f3637 روی گیت‌هاب
- راستی‌آزمایی API: پوشه portable/ با ۹ آیتم روی گیت‌هاب نمایان است

Stage Summary:
- مخزن اکنون هم سورس کامل و هم نسخه اجرای قابل حمل ویندوز را دارد؛ دانلود ZIP مخزن → portable/START-WINDOWS.bat → اجرا بدون هیچ پیش‌نیازی
- ران‌تایم‌های مک/لینوکس (>100MB سقف گیت‌هاب) فقط در Release ZIPها هستند؛ در مخزن با node سیستم جایگزین می‌شوند

---
Task ID: 10
Agent: main (Z.ai)
Task: توسعه قابلیت‌های مرحله ۲ — نمای سه‌بعدی نقشه + نمودار سه‌بعدی و دیاگرام ساختاری (React Flow)؛ بدون پوش به گیت‌هاب (دستور صریح کاربر)

Work Log:
- تصمیم فنی: echarts-gl با echarts ۶ ناسازگار است → نمودار سه‌بعدی با Three.js (نسخه ۰.۱۸۶) ساخته شد؛ نقشه سه‌بعدی با maplibre-gl v6؛ دیاگرام با @xyflow/react v12
- atlas-3d.tsx: fill-extrusion ارتفاع واقعی بناها (+ضریب نمایشی ×۱/×۲/×۳)، نگاشت متر محلی → مختصات بافت تاریخی شیراز (۲۹.۶۱۰۳، ۵۲.۵۳۵۰)، رنگ شاخص‌محور هماهنگ با دوبعدی، انتخاب مسی + کم‌رنگ‌سازی، حیاط/بلوک، fitBounds با pitch 52 — کاملاً آفلاین (بدون کاشی/گلیف اینترنتی)
- رفع دو باگ اصلی: (۱) maplibre v6 default export ندارد → ایمپورت named؛ (۲) Worker failed to load → setWorkerUrl("/maplibre-gl-worker.js") + کپی worker در public؛ (۳) تضاد absolute inset-0 با position:relative خودکار maplibre → کانتینر h-full
- scatter3d.tsx: Points با vertexColors، OrbitControls damping، Raycaster هاور با tooltip فارسی، برچسب محور پروژه‌شده HTML، خروجی toDataURL با pixelRatio ۳ (preserveDrawingBuffer)
- API kmeans: فیلد scatter3d (کد، سطح، ارتفاع، تقاضا، برچسب خوشه)
- lab-view: کلید دوبعدی/سه‌بعدی در تب خوشه‌بندی + خروجی PNG
- research-flow.tsx: لایه‌بندی قطعی RTL (۷ لایه × ROW 86px)، گره‌های واقعی پرسش/فرضیه (linkedQuestionCode)/فصل، MiniMap، تم‌آگاه با متغیر CSS؛ در کنار گراف نیرویی قدیمی با کلید تعویض
- charts-view: نوع scatter3d با کپشن/عنوان خودکار، CSV سه‌ستونه، PNG چاپی، SVG صادقانه غیرفعال
- about-view: سه قابلیت به «اجراشده» اضافه شد؛ «کاشی پایه اینترنتی» به ناقص/مرحله ۳ منتقل شد
- راستی‌آزمایی مرورگری کامل: ورود مدیر → اطلس ۳بعدی (رندر، کلیک A-09 → پنل کامل)، آزمایشگاه kmeans ۳بعدی، React Flow کامل، استودیو scatter3d، تم شیشه‌ای روی ۳بعدی، موبایل ۳۹۰px — صفر خطای کنسول
- لینت: ۰ خطا (استثنای portable/dist/download در eslint ignores + حذف useMemoهای دستی برای React Compiler)
- کامیت محلی aa4d5eb + f82543a — هیچ پوشی انجام نشد

Stage Summary:
- هر دو قابلیت نقشه راه مرحله ۲ در سامانه فعال و مرورگری راستی‌آزمایی شده‌اند؛ همه اصول صداقت علمی (برچسب نمایشی، موقعیت نمایشی، ضریب ارتفاع نمایشی) حفظ شده است
- آماده برای: بسته‌بندی v1.2.0 + پوش پس از اعلام کاربر

---
Task ID: 11
Agent: main (Z.ai)
Task: تقویت تم‌های گرافیکی + ۴ تم جدید + رنگ فونت زنده‌تر؛ سپس پوش v1.2.0 به گیت‌هاب + Release (درخواست کاربر: «تم را جذاب‌تر کن، رنگ فونت روشن‌تر زردرنگ زنده... اگر اوکی بود پوش کن»)

Work Log:
- چهار تم جدید کامل (روشن+تیره): گل سرخ شیراز (rose)، بنفش سلطنتی (royal)، غروب کویر (sunset)، شفق نورانی (aurora) — هرکدام ~۴۰ توکن در globals.css + متادیتا و swatch در skins.ts (مجموع: ۱۰ تم × ۲ = ۲۰ پالت)
- روشن‌تر/زنده‌تر کردن فونت: همه ۶ تم تیره (foreground/card/popover/secondary/sidebar-accent → عاجی گرم روشن)، muted-foreground‌ها +۳۰٪ روشن‌تر، سایدبار حالت روشن هم روشن‌تر شد
- لایه جذابیت مشترک: دکمه/badge اصلی گرادیانی با هاله رنگ تم (bg-primary selector)، سایدبار با گرادیان عمق ۱۹۸درجه (mix با sidebar-ring بالا و تیره پایین)، کارت‌ها با هایلایت شیشه‌ای inset
- گالری تم: max-h-[58vh] + اسکرول برای ۱۰ آیتم
- راستی‌آزمایی مرورگری: ورود مدیر → گالری ۱۰ تم → اعمال rose/royal/sunset/aurora روشن و تیره → اطلس + نمای سه‌بعدی در تم rose تیره → توست ثبت سراسری ادمین → صفر خطای کنسول
- نسخه‌بندی v1.2.0: package.json، README.md (بخش نسخه و ماژول‌ها و فناوری‌ها)، portable/VERSION.txt، portable/CHANGELOG.md (بخش 1.2.0)، لانچرهای BAT → v1.2.0
- بیلد standalone جدید + جایگزینی کامل portable/app در مخزن (DB دست‌نخورده ماند؛ .env مطلق کپی نشد)؛ maplibre/three در chunks کلاینت تأیید شد
- کشف: DB پرتابل کامیت‌شده v1.1.0 یک رکورد OLS آزمایشی داشت (از تست دود قبلی) → بازسازی DB پاک seed-only با scripts/rebuild-portable-db-v120.sh (۲۴۴KB، PRISTINE-DB: OK)
- تست دود پرتابل: root/settings/bootstrap/atlas(۵۱ بنا)/OLS/kmeans(scatter3d=۵۱)/validation — همه سبز
- کامیت 8a7a6e8 + تگ v1.2.0 و پوش به گیت‌هاب (مجوز کاربر) — main = 8a7a6e8
- Release v1.2.0 (id=416358478) با ۳ دارایی: Windows.zip (122MB)، Repository.zip (100MB، کل مخزن شامل پرتابل)، SHA256SUMS — همه state=uploaded
- نکته: ZIPهای v1.1.0 قبلی در download/ بین سشن‌ها پاک شده بودند؛ ZIPها از portable/ مخزن بازسازی شدند؛ اسکرین‌شات‌های تم در tool-results/ (gitignore شد)

Stage Summary:
- سامانه اکنون ۱۰ تم × دو حالت با فونت زنده عاجی دارد؛ هر ۴ تم جدید مرورگری راستی‌آزمایی شد
- مخزن: main=8a7a6e8 + تگ v1.2.0 + Release کامل با لینک دانلود دائمی
- DB پرتابل این‌بار واقعاً seed-only است (حتی تمیزتر از v1.1.0)

---
Task ID: 12
Agent: main (Z.ai)
Task: بررسی وضعیت پوش نسخه جدید (پرسش کاربر: «الان این نسخه جدید را در گیت اپ پوش کردی»)

Work Log:
- راستی‌آزمایی گیت‌هاب: main از قبل در 8a7a6e8 (v1.2.0) بود + تگ v1.2.0 + Release id=416358478 با هر ۳ دارایی state=uploaded
- تنها فاصله: کامیت محلی da8b341 (فقط worklog.md) پوش نشده بود → با توکن در URL پوش شد
- همگام‌سازی کامل: main محلی = main گیت‌هاب = da8b341

Stage Summary:
- نسخه v1.2.0 (۱۰ تم + فونت زنده + سه‌بعدی) کاملاً روی گیت‌هاب منتشر شده است؛ مخزن ۱۰۰٪ همگام

---
Task ID: 13
Agent: main (Z.ai)
Task: ساخت فایل HTML تشریحی رسپانسیو و پرجذابیت برای معرفی کامل سامانه (ساختار، کارکردها، رویکرد فنی و علمی ریخت‌شناسی/انرژی)

Work Log:
- استخراج واقعیت‌ها از سورس: ۱۱ ماژول از app-shell.tsx، ۱۱ شاخص ریخت‌شناسی از indicators.ts، موتور علمی (OLS/K-Means/موران/هندسه) از src/lib/science، نسخه v1.2.0
- فایل خودکفای download/Shiraz-Atlas-System-Overview.html (68KB، بدون وابستگی اجباری خارجی؛ فونت وزیرمتن CDN اختیاری با فال‌بک)
- طراحی: پالت لاجوردی-طلایی میراثی شیراز، نقش گره‌چینی SVG، شیشه‌گرا، ستاره‌های canvas، شمارنده فارسی متحرک، تیلت سه‌بعدی کارت‌ها، ظهور تدریجی با IntersectionObserver + جاروب ایمنی برای پرش End/لینک، نوار پیشرفت اسکرول
- بخش‌ها: هیرو + رساله، معرفی، معماری ۵ لایه، ۱۱ ماژول با کارکرد، چرخه علمی ۷گانه، کاتالوگ ۱۱ شاخص با فرمول LTR و وضعیت صادقانه، پیوند ریخت‌شناسی↔انرژی (S/V، H/W، WWR، حیاط، دیوار مشترک، خط آسمان)، صداقت علمی ۴گانه، ۱۰ تم، استقرار پرتابل، پانویس با انتساب MahAI.ir
- راستی‌آزمایی مرورگری: هیرو/ماژول‌ها/پایپ‌لاین/انرژی/تم‌ها/پانویس + موبایل ۳۹۰px + پرش End — صفر خطای کنسول
- فال‌بک‌های امنیتی: noscript، print CSS، try/catch برای مرورگر بدون IntersectionObserver

Stage Summary:
- فایل تشریحی آماده و راستی‌آزمایی‌شده در download/ است؛ هیچ تغییری در سورس سامانه داده نشد و پوشی انجام نشد (خارج از دامنه مجوز قبلی)

---
Task ID: 14
Agent: main (Z.ai)
Task: افزودن فایل HTML تشریحی به مخزن گیت‌هاب (درخواست صریح کاربر)

Work Log:
- پوشه download/ در .gitignore است → کپی فایل به مکان استاندارد مخزن: docs/Shiraz-Atlas-System-Overview.html (68KB خودکفا)
- افزودن بخش «📖 معرفی تشریحی سامانه» به README با لینک فایل + پیش‌نمایش زنده raw.githack
- کامیت و پوش main با توکن

Stage Summary:
- فایل تشریحی اکنون در مخزن عمومی است: docs/Shiraz-Atlas-System-Overview.html + لینک از README
