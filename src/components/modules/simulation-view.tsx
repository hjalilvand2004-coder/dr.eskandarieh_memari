"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionHeader, EmptyState, fa, KeyValue, UnconfiguredBadge } from "@/components/shared/ui-bits";
import { toast } from "@/hooks/use-toast";
import { fetchJson } from "@/lib/safe-json";
import { FlaskConical, Cog, TriangleAlert, Layers3, ClipboardList } from "lucide-react";

interface SimModel {
  name: string; engine: string; geometrySrc?: string | null; status: string; note?: string | null;
  materials?: string | null; schedules?: string | null; hvac?: string | null;
}
interface Run {
  id: string; label: string; status: string; engine?: string | null; errorMessage?: string | null; durationMs?: number | null; startedAt?: string | null;
}
interface Weather {
  name: string; location?: string | null; origin: string; note?: string | null;
}

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار", queued: "در صف", running: "در حال اجرا", done: "انجام‌شده", failed: "ناموفق", blocked: "مسدود", draft: "پیش‌نویس",
};

export function SimulationView() {
  const [simModel, setSimModel] = React.useState<SimModel | null>(null);
  const [runs, setRuns] = React.useState<Run[]>([]);
  const [weather, setWeather] = React.useState<Weather | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchJson("/api/bootstrap")
      .then((j) => {
        if (j.ok && j.data) {
          setSimModel((j.data as Record<string, unknown>).simModel as never);
          setRuns((j.data as Record<string, unknown>).experimentRuns as never);
          setWeather((j.data as Record<string, unknown>).weather as never);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <EmptyState title="در حال بارگذاری آزمایشگاه…" />;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="آزمایشگاه شبیه‌سازی علمی"
        subtitle="مدیریت مدل پایه، ماتریس آزمایش‌ها و صف اجرا — با تفکیک صریح وضعیت اتصال به موتورهای محاسباتی."
        icon={<FlaskConical />}
        actions={<UnconfiguredBadge text="EnergyPlus متصل نیست" />}
      />

      <Alert className="border-destructive/40 bg-destructive/5">
        <TriangleAlert className="h-4 w-4 text-destructive" />
        <AlertTitle className="text-sm">اتصال موتور شبیه‌سازی هنوز پیکربندی نشده است</AlertTitle>
        <AlertDescription className="text-xs leading-6">
          هیچ انیمیشن یا مقدار ساختگی به‌عنوان شبیه‌سازی واقعی نمایش داده نمی‌شود. برای پیکربندی لازم است:
          فایل EPW معتبر شیراز، مشخصات مصالح و پوسته، برنامه بهره‌برداری و سیستم‌های انرژی ثبت شود و زیرساخت اجرای
          EnergyPlus (یا مسیر Ladybug/Honeybee) فراهم گردد. مقادیر انرژی موجود در سامانه «نمایشی» و برچسب‌دارند.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* مدل پایه */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Cog className="h-4 w-4" /> مدل پایه ثبت‌شده</CardTitle></CardHeader>
          <CardContent className="text-xs">
            <KeyValue k="نام مدل" v={simModel?.name ?? "—"} />
            <KeyValue k="موتور" v={<span className="text-destructive font-semibold">پیکربندی‌نشده</span>} />
            <KeyValue k="هندسه" v={simModel?.geometrySrc ?? "—"} />
            <KeyValue k="مصالح" v="نیازمند ثبت پس از برداشت میدانی" />
            <KeyValue k="برنامه بهره‌برداری" v="نیازمند تعریف" />
            <KeyValue k="سیستم‌های انرژی" v="نیازمند تعریف" />
            <KeyValue k="فایل آب‌وهوایی" v={weather ? `${weather.name} (${weather.location ?? ""})` : "—"} />
            {simModel?.note && <p className="mt-3 rounded-lg bg-muted/50 border px-3 py-2 leading-5 text-muted-foreground">{simModel.note}</p>}
          </CardContent>
        </Card>

        {/* الزامات خروجی */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers3 className="h-4 w-4" /> خروجی‌های پس از اتصال (تعریف دقیق)</CardTitle></CardHeader>
          <CardContent className="text-xs space-y-2.5 leading-6 text-muted-foreground">
            <p><b className="text-foreground">تقاضای انرژی:</b> بار سرمایشی/گرمایشی ویژه (kWh/m²·a) — هدف اصلی رساله و قابل اتصال به ریخت‌شناسی.</p>
            <p><b className="text-foreground">مصرف نهایی:</b> انرژی خریداری‌شده پس از راندمان سیستم‌ها — با تعریف مرز سیستم مستند می‌شود.</p>
            <p><b className="text-foreground">انرژی اولیه:</b> با ضریب تبدیل استاندارد — فقط با ذکر منبع ضرایب.</p>
            <p><b className="text-foreground">آسایش حرارتی:</b> دمای عملیاتی داخل و ساعات خارج از بازه آسایش با معیار مشخص (مثلاً بازه آسایش تطبیقی مستندشده).</p>
            <p><b className="text-foreground">بار اوج و تابش/سایه:</b> با گزارش موتور محاسباتی و نسخه مدل.</p>
            <p className="text-copper">این چهار مفهوم در همه گزارش‌ها تفکیک می‌شوند و با هم جمع نمی‌گردند.</p>
          </CardContent>
        </Card>
      </div>

      {/* صف اجرا */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" /> صف آزمایش‌ها و ماتریس اجرا</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">آزمایش</TableHead>
                <TableHead className="text-right">موتور</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-right">توضیح</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-xs">{r.label}</TableCell>
                  <TableCell className="text-xs">{r.engine ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${r.status === "blocked" ? "border-destructive/40 text-destructive" : "border-turquoise/50 text-turquoise-deep"}`}>
                      {STATUS_FA[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground leading-5">{r.errorMessage ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-[11px] text-muted-foreground mt-3 leading-5">
            پس از پیکربندی موتور، هر اجرا با نسخه مدل، پارامترها، seed و گزارش موتور ثبت می‌شود تا نتایج بازتولیدپذیر باشند.
            می‌توانید خروجی شبیه‌سازی انجام‌شده در ابزار دیگر را نیز از طریق «ورود داده» با نوع «خروجی شبیه‌سازی» وارد کنید.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
