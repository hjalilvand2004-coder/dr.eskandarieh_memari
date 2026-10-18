"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SectionHeader, EmptyState, fa, DemoBadge } from "@/components/shared/ui-bits";
import { EChart, useBaseOption } from "@/components/charts/echart";
import { useAppStore, canWrite } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { Target, Play, Info, Loader2, Scale, ShieldAlert } from "lucide-react";

interface Scenario {
  id: string; name: string; category: string; description: string; heritageConstraint?: string | null;
  status: string; result?: string | null; evaluationNote?: string | null;
}
interface ScenarioResult {
  quantitative: boolean;
  baseMeanKwhM2a?: number;
  scenarioMeanKwhM2a?: number;
  absChangeKwhM2a?: number;
  relChangePct?: number;
  affectedBuildings?: number;
  note?: string;
}

const CATEGORY_FA: Record<string, string> = {
  envelope: "پوسته و بازشوها", shading: "سایه‌بان و تابش", material: "مصالح", vegetation: "پوشش گیاهی",
  low_intervention: "کم‌مداخله", operation: "بهره‌برداری",
};
const OBJECTIVES_FA = ["کاهش انرژی", "بهبود آسایش", "کاهش هزینه", "حفظ ارزش‌های تاریخی"];

export function ScenariosView() {
  const [scenarios, setScenarios] = React.useState<Scenario[]>([]);
  const [results, setResults] = React.useState<Record<string, ScenarioResult>>({});
  const [busy, setBusy] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const role = useAppStore((s) => s.user?.role);
  const writable = canWrite(role);
  const base = useBaseOption();

  const reload = React.useCallback(() => {
    fetch("/api/bootstrap").then((r) => r.json()).then((j) => { if (j.ok) { setScenarios(j.data.scenarios); setLoading(false); } });
  }, []);
  React.useEffect(reload, [reload]);

  const evaluate = async (sc: Scenario) => {
    setBusy(sc.id);
    try {
      const r = await fetch("/api/scenarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "evaluate", scenarioId: sc.id }) });
      const j = await r.json();
      if (j.ok) {
        setResults((prev) => ({ ...prev, [sc.id]: j.data }));
        reload();
        toast({ title: j.data.quantitative ? "سناریو برآورد شد" : "سناریو کمّی ارزیابی نشد", description: j.data.quantitative ? `تغییر نسبی: ${j.data.relChangePct}٪` : "نیازمند مدل مناسب — بدون تولید عدد صوری" });
      } else toast({ title: j.error, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const evaluated = scenarios.filter((s) => s.status === "evaluated" && s.result);
  const barOption: React.ComponentProps<typeof EChart>["option"] | null = React.useMemo(() => {
    if (evaluated.length === 0) return null;
    const items = evaluated.map((s) => {
      const r = JSON.parse(s.result!) as ScenarioResult;
      return { name: s.name, rel: r.relChangePct ?? 0, abs: r.absChangeKwhM2a ?? 0 };
    });
    return {
      ...base,
      tooltip: { ...base.tooltip },
      grid: { top: 30, right: 20, bottom: 60, left: 56 },
      xAxis: { type: "category", data: items.map((i) => i.name), axisLabel: { fontSize: 10, fontFamily: "Vazirmatn", interval: 0, rotate: 12, width: 110, overflow: "truncate" } },
      yAxis: {
        type: "value", name: "تغییر تقاضای کل (kWh/m²·a)", nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10 },
        axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } },
      },
      series: [
        {
          type: "bar",
          data: items.map((i) => ({ value: i.abs, itemStyle: { color: i.abs <= 0 ? "#17877d" : "#b4693b" } })),
          barWidth: "38%",
        },
      ],
    };
  }, [evaluated, base]);

  if (loading) return <EmptyState title="در حال بارگذاری سناریوها…" />;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="سناریوسازی و پشتیبانی تصمیم"
        subtitle="تعریف سناریوهای مداخله در چارچوب حفاظت میراثی، برآورد با مدل جانشین و مقایسه با وضع پایه."
        icon={<Target />}
        actions={<DemoBadge />}
      />

      <Alert className="border-copper/40 bg-copper/5">
        <ShieldAlert className="h-4 w-4 text-copper" />
        <AlertTitle className="text-sm">چارچوب حفاظتی</AlertTitle>
        <AlertDescription className="text-xs leading-6">
          اصالت تاریخی به امتیاز ساختگی تقلیل نمی‌یابد؛ محدودیت‌های هر سناریو باید از اسناد ضوابط و نظر متخصص میراث دریافت شود.
          پیشنهادهای این ماژول «گزینه پژوهشی» هستند، نه مجوز مداخله در بافت میراثی. نتایج برآورد مدل جانشین است، نه شبیه‌سازی واقعی.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-5">
        {scenarios.map((sc) => {
          const res = results[sc.id] ?? (sc.result ? (JSON.parse(sc.result) as ScenarioResult) : null);
          return (
            <Card key={sc.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm leading-6">{sc.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px] shrink-0">{CATEGORY_FA[sc.category] ?? sc.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 text-xs">
                <p className="leading-6 text-muted-foreground">{sc.description}</p>
                {sc.heritageConstraint && (
                  <p className="rounded-lg border border-copper/30 bg-copper/5 px-2.5 py-1.5 leading-5 text-copper">
                    محدودیت حفاظتی: {sc.heritageConstraint}
                  </p>
                )}
                {res?.quantitative ? (
                  <div className="rounded-xl border p-3 space-y-1.5">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className="text-[10px] text-muted-foreground">پایه</p><p className="font-bold num" dir="ltr">{res.baseMeanKwhM2a}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">سناریو</p><p className="font-bold num" dir="ltr">{res.scenarioMeanKwhM2a}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">تغییر نسبی</p><p className={`font-bold num ${"dir-ltr"}`} dir="ltr">{res.relChangePct}٪</p></div>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-5">{res.note}</p>
                    <p className="text-[10px] text-copper leading-5">واحد: kWh/m²·a (تقاضای ویژه نمایشی) • {fa(res.affectedBuildings ?? 0, 0)} بنا متأثر</p>
                  </div>
                ) : res && !res.quantitative ? (
                  <p className="rounded-lg border border-dashed px-2.5 py-1.5 leading-5 text-muted-foreground">
                    برآورد کمّی انجام نشد — این سناریو نیازمند مدل/شبیه‌سازی مناسب (مانند خرداقلیم) است و عمداً عدد صوری تولید نشده است.
                  </p>
                ) : null}
                {sc.evaluationNote && res?.quantitative === undefined && (
                  <p className="text-[10px] text-muted-foreground leading-5">{sc.evaluationNote}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {OBJECTIVES_FA.slice(0, 2).map((o) => <Badge key={o} variant="secondary" className="text-[9px]">{o}</Badge>)}
                </div>
                {writable && (
                  <Button size="sm" variant="outline" onClick={() => evaluate(sc)} disabled={busy === sc.id} className="gap-1.5 w-full">
                    {busy === sc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    {res ? "اجرای مجدد برآورد" : "برآورد با مدل جانشین"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {barOption && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4" /> مقایسه سناریوهای برآوردشده با وضع پایه</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <EChart option={barOption} height={300} />
            <p className="text-[11px] text-muted-foreground mt-2 leading-6 flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              رنگ فیروزه‌ای: کاهش تقاضا • رنگ مسی: افزایش. گزینه «بهترین» به ترجیحات تصمیم‌گیر، قیود حفاظتی و عدم‌قطعیت برآورد بستگی دارد؛
              سامانه هیچ گزینه‌ای را به‌صورت مطلق توصیه نمی‌کند. بهینه‌سازی چندهدفه (NSGA-II) در مرحله سوم نقشه راه فعال می‌شود.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
