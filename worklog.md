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
