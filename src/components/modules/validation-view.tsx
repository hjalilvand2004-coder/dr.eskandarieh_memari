"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, EmptyState, fa, ValidationStatusBadge, LoadingSkeleton } from "@/components/shared/ui-bits";
import { EChart, useBaseOption } from "@/components/charts/echart";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, Play, Info, Clock, FileWarning, Loader2 } from "lucide-react";

interface Metrics {
  n: number; MAE: number; RMSE: number; R2: number | null; NMBE: number | null; CVRMSE: number | null; MAPE: number | null; mapeExcluded?: string;
}
interface PathAResult {
  metrics: Metrics;
  thresholds: { source: string; cvrmse: number; nmbeAbs: number; caveat: string };
  verdict: string;
  series: Array<{ idx: number; period: string; observed: number; predicted: number }>;
  statusLabel: string;
}

export function ValidationView() {
  const [history, setHistory] = React.useState<Array<{ id: string; path: string; verdict?: string | null; createdAt: string; metrics: string; dataType?: string | null }>>([]);
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(() => {
    fetch("/api/validation").then((r) => r.json()).then((j) => { if (j.ok) setHistory(j.data.results); }).finally(() => setLoading(false));
  }, []);
  React.useEffect(reload, [reload]);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="ارزیابی و اعتبارسنجی مدل"
        subtitle="سه مسیر تفکیک‌شده: الف) شبیه‌سازی در برابر اندازه‌گیری، ب) مدل یادگیری ماشین در برابر آزمون مستقل، ج) سازگاری مدل جانشین."
        icon={<ShieldCheck />}
      />

      <Alert className="text-xs leading-6">
        <Info className="h-4 w-4" />
        <AlertTitle className="text-sm">اصول گزارش‌گری این ماژول</AlertTitle>
        <AlertDescription>
          هیچ آستانه‌ای بدون منبع و شرایط کاربرد، معیار قطعی معرفی نمی‌شود. مدلی که فقط بر داده شبیه‌سازی یا داده نمایشی آموزش دیده است،
          اعتبارسنجی‌شده با واقعیت معرفی نمی‌گردد. قرارداد علامت NMBE: مقدار مثبت = کم‌برآوردی مدل.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="a">
        <TabsList className="h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="a" className="text-xs">الف) شبیه‌سازی ↔ اندازه‌گیری</TabsTrigger>
          <TabsTrigger value="b" className="text-xs">ب) مدل ML ↔ آزمون مستقل</TabsTrigger>
          <TabsTrigger value="c" className="text-xs">ج) سازگاری مدل جانشین</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">تاریخچه نتایج</TabsTrigger>
        </TabsList>
        <TabsContent value="a" className="mt-4"><PathA onDone={reload} /></TabsContent>
        <TabsContent value="b" className="mt-4"><PathB /></TabsContent>
        <TabsContent value="c" className="mt-4"><PathC /></TabsContent>
        <TabsContent value="history" className="mt-4"><History history={history} loading={loading} /></TabsContent>
      </Tabs>
    </div>
  );
}

function MetricsGrid({ m, prefix = "" }: { m: Metrics; prefix?: string }) {
  const items = [
    { l: "MAE", v: m.MAE, d: 2 },
    { l: "RMSE", v: m.RMSE, d: 2 },
    { l: "R²", v: m.R2, d: 3 },
    { l: "NMBE (٪)", v: m.NMBE, d: 2 },
    { l: "CV(RMSE) (٪)", v: m.CVRMSE, d: 2 },
    { l: "MAPE (٪)", v: m.MAPE, d: 2 },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((it) => (
        <div key={it.l} className="rounded-xl border p-3 text-center">
          <p className="text-[10px] text-muted-foreground">{prefix}{it.l}</p>
          <p className="text-lg font-bold num" dir="ltr">{it.v === null ? "—" : it.v.toFixed(it.d)}</p>
        </div>
      ))}
    </div>
  );
}

// ── مسیر الف ──
function PathA({ onDone }: { onDone: () => void }) {
  const [res, setRes] = React.useState<PathAResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const base = useBaseOption();

  const run = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/validation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "a" }) });
      const j = await r.json();
      if (j.ok) {
        setRes(j.data);
        onDone();
        toast({ title: "ارزیابی مسیر الف اجرا شد", description: j.data.verdict });
      } else toast({ title: j.error, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const tsOption: React.ComponentProps<typeof EChart>["option"] | null = React.useMemo(() => {
    if (!res) return null;
    return {
      ...base,
      tooltip: { ...base.tooltip },
      legend: { ...base.legend, top: 0 },
      grid: { top: 30, right: 20, bottom: 46, left: 56 },
      xAxis: {
        type: "category", data: res.series.map((s) => `د${s.idx}`),
        axisLabel: { color: base.axis.labelColor, fontSize: 9, interval: 0, rotate: 40, fontFamily: "Vazirmatn" },
      },
      yAxis: { type: "value", name: "kWh", nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10 }, axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } } },
      series: [
        { type: "line", name: "اندازه‌گیری معادل", data: res.series.map((s) => s.observed), symbolSize: 6, lineStyle: { width: 2.5, color: "#1f4e6e" }, itemStyle: { color: "#1f4e6e" } },
        { type: "line", name: "شبیه‌سازی معادل", data: res.series.map((s) => s.predicted), symbolSize: 6, lineStyle: { width: 2, type: "dashed", color: "#b4693b" }, itemStyle: { color: "#b4693b" } },
      ],
    };
  }, [res, base]);

  const errDistOption: React.ComponentProps<typeof EChart>["option"] | null = React.useMemo(() => {
    if (!res) return null;
    const errs = res.series.map((s) => s.predicted - s.observed);
    const bins = 8;
    const min = Math.min(...errs);
    const max = Math.max(...errs);
    const counts = new Array(bins).fill(0);
    errs.forEach((e) => counts[Math.min(bins - 1, Math.floor(((e - min) / ((max - min) || 1)) * bins))]++);
    return {
      ...base,
      grid: { top: 12, right: 16, bottom: 36, left: 46 },
      xAxis: { type: "category", data: counts.map((_, i) => `${(min + (i * (max - min)) / bins).toFixed(0)}`), name: "خطا (kWh)", nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 9 }, axisLabel: { fontSize: 9, fontFamily: "Vazirmatn" } },
      yAxis: { type: "value", axisLabel: { fontSize: 9, color: base.axis.labelColor }, splitLine: { lineStyle: { color: base.axis.splitLineColor } } },
      series: [{ type: "bar", data: counts, itemStyle: { color: "#17877d" } }],
    };
  }, [res, base]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
              ارزیابی سازگاری خروجی شبیه‌سازی با اندازه‌گیری (کالیبراسیون). داده فعلی «نمایشی» است و فقط سازوکار محاسبه و گزارش‌گری را نشان می‌دهد؛
              معادل اندازه‌گیری میدانی واقعی نیست.
            </p>
            <Button onClick={run} disabled={loading} className="gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} اجرای ارزیابی</Button>
          </div>
          {res && (
            <>
              <div className="flex flex-wrap gap-2">
                <ValidationStatusBadge status="internal_eval" />
                <Badge variant="outline" className="text-[11px]">{res.statusLabel}</Badge>
                <Badge variant="outline" className="text-[11px] border-d9a441/50 text-[#8a6a1c] dark:text-[#e5bc6b]">{res.verdict}</Badge>
              </div>
              <MetricsGrid m={res.metrics} />
              <p className="text-[11px] text-muted-foreground leading-6">
                مبنای آستانه: {res.thresholds.source} — CV(RMSE) ≤ {fa(res.thresholds.cvrmse, 0)}٪ و |NMBE| ≤ {fa(res.thresholds.nmbeAbs, 0)}٪. {res.thresholds.caveat}
              </p>
              {res.metrics.mapeExcluded && <p className="text-[11px] text-copper leading-5">⚠ {res.metrics.mapeExcluded}</p>}
            </>
          )}
        </CardContent>
      </Card>
      {res && (
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm">سری زمانی مقایسه‌ای (۱۶ دوره نمایشی)</CardTitle></CardHeader>
            <CardContent className="p-3"><EChart option={tsOption} height={300} /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm">توزیع خطا (شبیه‌سازی − اندازه‌گیری)</CardTitle></CardHeader>
            <CardContent className="p-3"><EChart option={errDistOption} height={300} /></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── مسیر ب ──
function PathB() {
  const [res, setRes] = React.useState<{ empty: boolean; message?: string; result?: { metrics: string; criteriaVersion: string; dataType: string; note: string; verdict?: string | null; modelId?: string | null } } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/validation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "b" }) })
      .then((r) => r.json())
      .then((j) => j.ok && setRes(j.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!res || res.empty) {
    return (
      <EmptyState
        title="هنوز مدل رگرسیونی ارزیابی نشده است"
        hint="به آزمایشگاه علم داده بروید، رگرسیون را آموزش دهید؛ نتیجه ارزیابی آزمون مستقل گروهی اینجا ثبت و نمایش داده می‌شود."
      />
    );
  }
  const m = JSON.parse(res.result!.metrics) as { test: Metrics; train: Metrics };
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <ValidationStatusBadge status="internal_eval" />
            <Badge variant="outline" className="text-[11px]">تفکیک گروهی بر پایه بلوک</Badge>
            <Badge variant="outline" className="text-[11px]">{res.result!.dataType}</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-6">{res.result!.note}</p>
          <MetricsGrid m={m.test} prefix="آزمون — " />
          <MetricsGrid m={m.train} prefix="آموزش — " />
          <p className="text-[11px] text-muted-foreground leading-6">
            معیار نسخه: {res.result!.criteriaVersion}. توجه: این ارزیابی «درون‌داده نمایشی» است؛ اعتبار بیرونی نیازمند داده مشاهده‌شده مستقل است.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── مسیر ج ──
function PathC() {
  return (
    <EmptyState
      title="سازگاری مدل جانشین هنوز فعال نشده است"
      hint="پس از آموزش رگرسیون در آزمایشگاه علم داده، مقایسه خروجی جانشین با داده مبنای آن قابل اجراست. توجه: سازگاری با داده مبنای نمایشی، اعتبار در برابر واقعیت نیست."
    />
  );
}

// ── تاریخچه ──
function History({ history, loading }: { history: Array<{ id: string; path: string; verdict?: string | null; createdAt: string; metrics: string; dataType?: string | null }>; loading: boolean }) {
  if (loading) return <LoadingSkeleton />;
  if (history.length === 0) {
    return <EmptyState title="تاریخچه خالی است" hint="پس از اجرای اولین ارزیابی، نتایج اینجا با مهر زمانی ثبت می‌شوند." />;
  }
  const PATH: Record<string, string> = {
    a_simulation_vs_measurement: "الف) شبیه‌سازی ↔ اندازه‌گیری",
    b_ml_vs_test: "ب) ML ↔ آزمون مستقل",
    c_surrogate_consistency: "ج) سازگاری جانشین",
  };
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> تاریخچه ارزیابی‌ها (ردیابی نتایج)</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {history.map((h) => (
          <div key={h.id} className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <FileWarning className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold">{PATH[h.path] ?? h.path}</span>
              {h.dataType && <Badge variant="secondary" className="text-[10px]">{h.dataType}</Badge>}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {h.verdict && <span>{h.verdict}</span>}
              <span className="num">{new Date(h.createdAt).toLocaleString("fa-IR")}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
