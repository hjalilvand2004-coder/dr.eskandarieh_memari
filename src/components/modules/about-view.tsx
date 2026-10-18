"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionHeader, fa, KeyValue } from "@/components/shared/ui-bits";
import { useAppStore } from "@/lib/store";
import { Compass, ServerCog, ShieldCheck, Route, CheckCircle2, CircleDashed, Link2, ScrollText } from "lucide-react";

const DONE = [
  "پوسته کامل فارسی و راست‌به‌چپ با فونت Vazirmatn و تم روشن/تیره",
  "مدیریت فضای پژوهش: پرسش‌ها، فرضیه‌ها، فصل‌ها، کانبان، یادداشت‌ها، منابع + ورود BibTeX/RIS",
  "ورود داده CSV/GeoJSON/EPW با گزارش کیفیت دو مرحله‌ای و حفظ داده خام",
  "فرهنگ داده و ثبت کامل منشأ (منبع، مجوز، CRS، واحد، بازه، عدم‌قطعیت، نوع داده)",
  "اطلس مکانی تعاملی با لایه‌ها، رنگ‌آمیزی شاخص‌محور و راهنمای رنگ کوررنگ‌پسند",
  "محاسبه واقعی ۹ شاخص ریخت‌شناختی از هندسه (S/V، فشردگی، H/W، اشغال، حیاط، دیوار مشترک و…)",
  "تحلیل اکتشافی کامل: توصیف، پرت، همبستگی، توزیع",
  "خوشه‌بندی K-Means واقعی (k-means++، seed، Silhouette) و پروفایل تیپ‌ها",
  "رگرسیون OLS واقعی با تفکیک گروهی بلوکی و کنترل نشت داده",
  "ارزیابی مسیر الف (NMBE/CV(RMSE)) و مسیر ب (MAE/RMSE/R²/MAPE) با قرارداد مستند",
  "استودیو نمودار با خروجی PNG چاپ، SVG، CSV و ثبت منشأ هر شکل",
  "نمای سه‌بعدی نقشه با MapLibre GL (اکسترودشن ارتفاع بناها، رنگ شاخص‌محور، چرخش/شیب، انتخاب بنا) — آفلاین بدون کاشی اینترنتی",
  "پراکندگی سه‌بعدی WebGL (Three.js) در آزمایشگاه و استودیو با خروجی PNG چاپی و هاور مقادیر",
  "دیاگرام ساختاری زنجیره پژوهش با React Flow (پرسش ← فرضیه ← متغیر ← داده ← روش ← نتیجه ← فصل)",
  "سناریوسازی با برآورد مدل جانشین و خودداری از عدد صوری برای سناریوهای خارج از دامنه مدل",
  "دستیار پژوهشی مبتنی بر اسناد پروژه با ارجاع و حالت هوشمند اختیاری",
  "ثبت نسخه‌ها، seed و رویدادهای ممیزی برای بازتولیدپذیری",
];

const PARTIAL = [
  "کاشی‌های پایه جغرافیایی اینترنتی (OSM/ساتلایت) زیر نمای سه‌بعدی — نسخه فعلی عمداً آفلاین و بدون کاشی است",
  "شاخص سایه/دسترسی خورشیدی — نیازمند محاسبات تابش معتبر",
  "خوشه‌بندی سلسله‌مراتبی و Random Forest / XGBoost — پس از داده واقعی و ضرورت علمی",
  "بهینه‌سازی چندهدفه NSGA-II و جبهه پارتو — مرحله سوم",
];

const EXTERNAL = [
  { t: "موتور EnergyPlus", d: "اجرای شبیه‌سازی انرژی ساختمان؛ نیازمند پیکربندی سرویس محاسباتی و EPW" },
  { t: "Ladybug / Honeybee", d: "مسیر اتصال جایگزین برای تحلیل تابش و سایه" },
  { t: "ENVI-met", d: "خرداقلیم محله‌ای؛ نیازمند نصب و مجوز مستقل" },
  { t: "PostgreSQL + PostGIS", d: "در نسخه استقرار سازمانی؛ محیط فعلی SQLite" },
  { t: "صف پردازش Redis/Celery", d: "برای کارهای طولانی شبیه‌سازی در استقرار کامل" },
];

export function AboutView() {
  const audit = useAppStore((s) => s.lastSavedAt);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="درباره سامانه"
        subtitle="شیراز | اطلس هوشمند ریخت‌شناسی و انرژی — محیط یکپارچه مدیریت پژوهش، تحلیل فضایی، شبیه‌سازی و ارزیابی مدل"
        icon={<Compass />}
      />

      <Card className="girih-bg">
        <CardContent className="p-6 grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">موضوع رساله</p>
            <p className="font-semibold leading-7">تبیین الگوهای ریخت‌شناسی در بافت تاریخی با تأکید بر کارایی انرژی</p>
            <p className="text-turquoise-deep dark:text-turquoise mt-1">نمونه پژوهشی: بافت تاریخی شهر شیراز</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">اصل بنیادین</p>
            <p className="leading-6 text-muted-foreground text-xs">
              موضوع اصلی سامانه معماری، ریخت‌شناسی و عملکرد انرژی است؛ هوش مصنوعی و علم داده ابزار پشتیبان پژوهش‌اند.
              هیچ نتیجه علمی، داده میدانی، منبع یا خروجی شبیه‌سازی جعل نمی‌شود.
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">طراح و مالک</p>
            <p className="font-semibold leading-7">دکتر سارا اسکندریه</p>
            <p className="text-xs text-muted-foreground">شرکت ماه افزارهوشمندرسا — MahAI.ir</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* قابلیت‌های اجراشده */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-turquoise" /> قابلیت‌های اجراشده ({fa(DONE.length, 0)} مورد)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {DONE.map((d, i) => (
              <p key={i} className="text-xs leading-6 flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 mt-1 shrink-0 text-turquoise" /> {d}
              </p>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          {/* ناقص */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CircleDashed className="h-4 w-4 text-[#d9a441]" /> قابلیت‌های ناقص / نیازمند ادامه (مثبت و شفاف)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {PARTIAL.map((d, i) => (
                <p key={i} className="text-xs leading-6 flex items-start gap-2 text-muted-foreground">
                  <CircleDashed className="h-3.5 w-3.5 mt-1 shrink-0 text-[#d9a441]" /> {d}
                </p>
              ))}
            </CardContent>
          </Card>

          {/* نیازمند اتصال خارجی */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4 text-copper" /> نیازمند اتصال خارجی</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {EXTERNAL.map((e) => (
                <div key={e.t} className="rounded-lg border p-2.5">
                  <p className="text-xs font-semibold">{e.t}</p>
                  <p className="text-[11px] text-muted-foreground leading-5 mt-0.5">{e.d}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* معماری فنی */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ServerCog className="h-4 w-4" /> معماری فنی نسخه فعلی</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] leading-5">
          <div className="rounded-lg border p-3"><p className="font-bold text-xs mb-1">واحد جلو</p><p className="text-muted-foreground">Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui + RTL کامل</p></div>
          <div className="rounded-lg border p-3"><p className="font-bold text-xs mb-1">نمودار و اطلس</p><p className="text-muted-foreground">Apache ECharts + اطلس دوبعدی SVG تعاملی (پن/زوم/انتخاب)</p></div>
          <div className="rounded-lg border p-3"><p className="font-bold text-xs mb-1">پایگاه داده</p><p className="text-muted-foreground">Prisma ORM + SQLite — ۱۷ موجودیت رساله (Project تا AuditEvent)</p></div>
          <div className="rounded-lg border p-3"><p className="font-bold text-xs mb-1">موتور تحلیل</p><p className="text-muted-foreground">محاسبات آماری و ML واقعی در TypeScript: K-Means++، OLS، معیارهای Guideline-14، آمار توصیفی</p></div>
        </CardContent>
      </Card>

      {/* امنیت و نقشه راه */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> امنیت و حاکمیت داده</CardTitle></CardHeader>
          <CardContent className="text-xs space-y-2.5 leading-6 text-muted-foreground">
            <p>• نقش‌های سه‌گانه مدیر/پژوهشگر/مشاهده‌گر با محدودیت عملیات نوشتن و حذف (حذف فقط مدیر)</p>
            <p>• ثبت رویدادهای مهم در AuditEvent (ورود/حذف داده، تغییر وضعیت‌ها)</p>
            <p>• اعتبارسنجی فایل ورودی و گزارش کیفیت پیش از ورود نهایی</p>
            <p>• داده خام هرگز اصلاح یا حذف نمی‌شود؛ پردازش نسخه جدید می‌سازد</p>
            <p>• عدم ارسال اسناد خصوصی به سرویس خارجی بدون رضایت (حالت هوشمند دستیار اختیاری است)</p>
            <p>• پشتیبان‌گیری: فایل پایگاه در مسیر <span className="font-mono">db/custom.db</span> قابل نسخه‌برداری است</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Route className="h-4 w-4" /> نقشه راه اجرا</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-xs leading-6">
            <div>
              <Badge className="bg-turquoise text-white text-[10px] mb-1">مرحله ۱ — تکمیل</Badge>
              <p className="text-muted-foreground">مسیر کامل واقعی «ورود داده ← تحلیل ← ارزیابی ← نمودار ← گزارش» + اطلس و شاخص‌ها + ثبت منشأ</p>
            </div>
            <Separator />
            <div>
              <Badge variant="outline" className="text-[10px] mb-1">مرحله ۲ — در حال اجرا</Badge>
              <p className="text-muted-foreground">اتصال شبیه‌سازی انرژی، مدیریت آزمایش‌ها، خوشه‌بندی سلسله‌مراتبی، اعتبارسنجی فضایی، تحلیل توضیح‌پذیری (SHAP) — نمای سه‌بعدی نقشه، پراکندگی سه‌بعدی و دیاگرام ساختاری React Flow اجرا شد</p>
            </div>
            <Separator />
            <div>
              <Badge variant="outline" className="text-[10px] mb-1">مرحله ۳ — پیش‌رو</Badge>
              <p className="text-muted-foreground">بهینه‌سازی چندهدفه (NSGA-II)، کاشی پایه جغرافیایی و مدل شهری کامل سه‌بعدی، توسعه کامل دستیار RAG و قابلیت‌های پیشرفته</p>
            </div>
            <p className="text-[10px] text-muted-foreground">آخرین ذخیره محیط: {audit ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* راهنمای نصب */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ScrollText className="h-4 w-4" /> راهنمای اجرا و توسعه</CardTitle></CardHeader>
        <CardContent className="text-xs space-y-2">
          <p className="leading-6 text-muted-foreground">
            محیط توسعه: <span className="font-mono" dir="ltr">bun install</span> سپس <span className="font-mono" dir="ltr">bun run dev</span> (پورت ۳۰۰۰) •
            همگام‌سازی پایگاه: <span className="font-mono" dir="ltr">bun run db:push</span> •
            متغیرهای محیطی نمونه در <span className="font-mono" dir="ltr">.env</span> با کلید <span className="font-mono" dir="ltr">DATABASE_URL=file:./db/custom.db</span>
          </p>
          <p className="leading-6 text-muted-foreground">
            جایگزینی داده نمایشی: از ماژول «پایگاه داده» فایل واقعی CSV/GeoJSON/EPW را وارد کنید؛ سپس مجموعه داده نمایشی را حذف
            و تحلیل‌ها را با داده واقعی دوباره اجرا کنید. نسخه تحلیل جدید به‌صورت خودکار در نتایج ثبت می‌شود.
          </p>
        </CardContent>
      </Card>

      {/* ممیزی */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">جدول موجودیت‌های مدل داده (بازتولیدپذیری)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">موجودیت</TableHead>
                <TableHead className="text-right">نقش در ردیابی</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["Project", "قلمرو پژوهش و موضوع رساله"],
                ["ResearchQuestion / Hypothesis", "پرسش‌ها و فرضیه‌ها با وضعیت آزمون"],
                ["Dataset", "منشأ، مجوز، CRS، واحد، نوع داده و نسخه"],
                ["SpatialEntity", "هندسه و ویژگی‌های بنا/بلوک"],
                ["MorphologyIndicator", "کاتالوگ شاخص‌ها با تعریف و محدودیت"],
                ["WeatherFile", "وضعیت EPW — فعلاً پیکربندی‌نشده"],
                ["SimulationModel / ExperimentRun", "مدل و صف آزمایش با وضعیت صادقانه"],
                ["Scenario", "سناریوها و محدودیت حفاظتی + نتیجه برآورد"],
                ["MLModel", "الگوریتم، ویژگی‌ها، seed، تفکیک، محدودیت تعمیم"],
                ["ValidationResult", "معیارها، آستانه، نوع داده و وضعیت اعتبارسنجی"],
                ["ChartSpecification", "مشخصات شکل علمی و منشأ آن"],
                ["Reference / Document", "منابع و اسناد دستیار"],
                ["Report / AuditEvent", "گزارش‌ها و رویدادهای حاکمیت داده"],
              ].map(([a, b]) => (
                <TableRow key={a}>
                  <TableCell className="font-mono text-[11px]" dir="ltr">{a}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">{b}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
