"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { SectionHeader, StatCard, ValidationStatusBadge, fa, EmptyState } from "@/components/shared/ui-bits";
import { useAppStore } from "@/lib/store";
import {
  LayoutDashboard, Database, BrainCircuit, ShieldCheck, BookOpen, ArrowLeft,
  Building2, Layers, FlaskConical, Target,
} from "lucide-react";

interface BootstrapData {
  project?: { title: string; subtitle?: string | null; goal?: string | null; scope?: string | null } | null;
  questions?: Array<{ id: string; code: string; text: string; priority: string }>;
  hypotheses?: Array<{ id: string; code: string; text: string; status: string; note?: string | null }>;
  chapters?: Array<{ id: string; order: number; title: string; status: string; progress: number }>;
  datasets?: Array<{ id: string; name: string; kind: string; origin: string; rowCount: number; qualityNote?: string | null }>;
  stats?: { entityCount: number; indicatorCount: number; mlCount: number; validationCount: number };
  simModel?: { engine: string; note?: string | null } | null;
}

const PIPELINE = [
  { key: "ورود داده", state: "done", desc: "داده نمایشی برچسب‌دار + ورود CSV/GeoJSON/EPW" },
  { key: "اطلس و شاخص‌ها", state: "done", desc: "محاسبه واقعی ۹ شاخص از هندسه" },
  { key: "تحلیل آماری", state: "done", desc: "EDA، K-Means و رگرسیون واقعی" },
  { key: "ارزیابی مدل", state: "done", desc: "معیارهای کامل بر داده آزمون گروهی" },
  { key: "نمودار علمی", state: "done", desc: "استودیو با منشأ و خروجی چاپ" },
  { key: "گزارش", state: "done", desc: "خروجی چاپ پایان‌نامه" },
  { key: "شبیه‌سازی انرژی", state: "blocked", desc: "اتصال موتور پیکربندی نشده" },
];

export function DashboardView() {
  const setModule = useAppStore((s) => s.setModule);
  const [data, setData] = React.useState<BootstrapData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/bootstrap")
      .then((r) => r.json())
      .then((j) => j.ok && setData(j.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <EmptyState title="در حال بارگذاری داشبورد…" />;
  if (!data) return <EmptyState title="بارگذاری نشد" hint="اتصال به سرور را بررسی کنید." />;

  const st = data.stats ?? { entityCount: 0, indicatorCount: 0, mlCount: 0, validationCount: 0 };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="داشبورد پژوهش"
        subtitle="نمای کلی مسیر پژوهش، وضعیت داده و زنجیره تحلیل. همه اعداد از پایگاه سامانه خوانده می‌شوند."
        icon={<LayoutDashboard />}
      />

      {/* پروژه */}
      <Card className="girih-bg">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground">پروژه فعال</p>
              <h3 className="text-base font-bold leading-7 mt-0.5">{data.project?.title}</h3>
              <p className="text-sm text-turquoise-deep dark:text-turquoise">{data.project?.subtitle}</p>
            </div>
            <Badge className="bg-turquoise/15 text-turquoise-deep dark:text-turquoise border-turquoise/30">در جریان</Badge>
          </div>
          {data.project?.goal && (
            <p className="mt-3 text-sm leading-7 text-muted-foreground border-r-2 border-copper/50 pr-3">{data.project.goal}</p>
          )}
        </CardContent>
      </Card>

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="موجودیت فضایی" value={fa(st.entityCount)} unit="بنا و بلوک" icon={<Building2 />} tone="lapis" hint="نمایشی — قابل جایگزینی با برداشت واقعی" />
        <StatCard label="مجموعه داده" value={fa(data.datasets?.length ?? 0)} unit="مجموعه" icon={<Database />} tone="turquoise" hint="با منشأ و گزارش کیفیت" />
        <StatCard label="مدل‌های ثبت‌شده" value={fa(st.mlCount)} unit="مدل" icon={<BrainCircuit />} tone="copper" hint="با seed و نسخه داده" />
        <StatCard label="نتایج ارزیابی" value={fa(st.validationCount)} unit="نتیجه" icon={<ShieldCheck />} hint="با وضعیت صریح اعتبارسنجی" />
      </div>

      {/* زنجیره پژوهش */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">مسیر اصلی: ورود داده ← تحلیل ← ارزیابی ← نمودار ← گزارش</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {PIPELINE.map((p, i) => (
              <div
                key={p.key}
                className={`rounded-xl border px-3 py-2 text-xs leading-5 ${
                  p.state === "blocked"
                    ? "border-dashed border-muted-foreground/40 text-muted-foreground"
                    : "border-turquoise/40 bg-turquoise/5"
                }`}
              >
                <p className="font-semibold flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${p.state === "blocked" ? "bg-muted-foreground" : "bg-turquoise"}`} aria-hidden />
                  {i + 1}. {p.key}
                </p>
                <p className="text-muted-foreground mt-0.5">{p.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* پیشرفت فصل‌ها */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden /> پیشرفت فصل‌های رساله
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data.chapters ?? []).map((ch) => (
              <div key={ch.id}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium">فصل {fa(ch.order, 0)}: {ch.title}</span>
                  <span className="text-xs text-muted-foreground num">{fa(ch.progress, 0)}٪</span>
                </div>
                <Progress value={ch.progress} className="h-2" aria-label={`پیشرفت فصل ${ch.title}`} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setModule("research")}>
              مدیریت فصل‌ها <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* فرضیه‌ها */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-copper" aria-hidden /> وضعیت فرضیه‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data.hypotheses ?? []).map((h) => (
              <div key={h.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[11px] font-bold">{h.code}</Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {h.status === "under_test" ? "در حال آزمون" : h.status === "proposed" ? "پیشنهادی" : h.status === "supported" ? "پشتیبانی‌شده" : h.status === "rejected" ? "ردشده" : "نامشخص"}
                  </Badge>
                </div>
                <p className="text-sm mt-2 leading-6">{h.text}</p>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setModule("lab")}>
              آزمون در آزمایشگاه علم داده <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* وضعیت شبیه‌سازی — صادقانه */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" aria-hidden /> وضعیت اتصال موتور شبیه‌سازی
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="border-destructive/40 text-destructive">اتصال موتور شبیه‌سازی هنوز پیکربندی نشده است</Badge>
          <span className="text-xs text-muted-foreground leading-6">
            {data.simModel?.note} هیچ خروجی انرژی واقعی تولید نمی‌شود؛ مقادیر انرژی موجود صرفاً «نمایشی» هستند.
          </span>
          <Button variant="outline" size="sm" onClick={() => setModule("simulation")}>
            آزمایشگاه شبیه‌سازی <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
