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
