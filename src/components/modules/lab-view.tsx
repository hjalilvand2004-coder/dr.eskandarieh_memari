"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SectionHeader, EmptyState, fa, DemoBadge, LoadingSkeleton } from "@/components/shared/ui-bits";
import { EChart, useBaseOption } from "@/components/charts/echart";
import { toast } from "@/hooks/use-toast";
import { BrainCircuit, Loader2, Play, Info, Sigma, GitBranch, BarChart3 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EdaResult {
  stats: Array<{ key: string; label: string; unit: string; n: number; missing: number; mean: number; median: number; std: number; min: number; max: number; q1: number; q3: number; outliers: number }>;
  corrMatrix: { cols: string[]; matrix: number[][] };
  histograms: Array<{ key: string; label: string; unit: string; min: number; max: number; counts: number[]; binWidth: number }>;
  n: number;
  demoLabel: string;
}

interface KMeansResult {
  modelId: string; k: number; inertia: number; silhouette: number; iterations: number; converged: boolean; clusterSizes: number[];
  centroids: number[][]; featureLabels: string[]; seed: number;
  profiles: Array<{ cluster: number; size: number; featureMeans: Array<{ key: string; label: string; value: number }>; meanTotal: number; meanCooling: number; meanHeating: number; codes: string[] }>;
  labels: number[];
  points: Array<{ x: number; y: number; label: number; code: string }>;
}

interface RegResult {
  modelId: string;
  target: { key: string; label: string; unit: string };
  features: Array<{ key: string; label: string }>;
  coefStd: number[];
  coefOriginal: number[];
  intercept: number;
  r2Train: number;
  split: { trainBlocks: string[]; testBlocks: string[]; trainSize: number; testSize: number };
  metricsTest: { n: number; MAE: number; RMSE: number; R2: number | null; NMBE: number | null; CVRMSE: number | null; MAPE: number | null; mapeExcluded?: string };
  metricsTrain: { n: number; MAE: number; RMSE: number; R2: number | null };
  scatterTest: Array<{ code: string; observed: number; predicted: number; block: string }>;
  scatterTrain: Array<{ code: string; observed: number; predicted: number; block: string }>;
  residualsTest: Array<{ code: string; predicted: number; residual: number; block: string }>;
  seed: number;
  status: string;
}

const BAR_COLORS = ["#1f4e6e", "#17877d", "#b4693b", "#d9a441", "#7a8c5c", "#8b5d76"];

export function LabView() {
  const [tab, setTab] = React.useState("eda");
  return (
    <div className="space-y-5">
      <SectionHeader
        title="آزمایشگاه علم داده و هوش مصنوعی"
        subtitle="تحلیل اکتشافی، خوشه‌بندی تیپ‌های ریخت‌شناختی و مدل پیش‌بینی — با کنترل نشت داده (پیش‌پردازش فقط با داده آموزش؛ تفکیک گروهی بر پایه بلوک)."
        icon={<BrainCircuit />}
        actions={<DemoBadge />}
      />
      <Alert className="text-xs leading-6">
        <Info className="h-4 w-4" />
        محاسبات این ماژول به‌صورت واقعی در سرور اجرا می‌شوند (K-Means با مقداردهی k-means++ و رگرسیون OLS با حل معادلات نرمال).
        داده‌ی ورودی «نمایشی» است؛ بنابراین یافته‌ها نمایش مسیر روش‌شناسی‌اند، نه نتیجه علمی رساله. الگوریتم‌های Random Forest و XGBoost
        پس از فراهم شدن داده واقعی و ضرورت علمی افزوده خواهند شد (فهرست «نیازمند اتصال/توسعه»).
      </Alert>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="eda" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" /> تحلیل اکتشافی</TabsTrigger>
          <TabsTrigger value="kmeans" className="gap-1.5 text-xs"><GitBranch className="h-3.5 w-3.5" /> خوشه‌بندی تیپ‌ها</TabsTrigger>
          <TabsTrigger value="regression" className="gap-1.5 text-xs"><Sigma className="h-3.5 w-3.5" /> رگرسیون و پیش‌بینی</TabsTrigger>
        </TabsList>
        <TabsContent value="eda" className="mt-4"><EdaTab /></TabsContent>
        <TabsContent value="kmeans" className="mt-4"><KMeansTab /></TabsContent>
        <TabsContent value="regression" className="mt-4"><RegressionTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────── EDA ───────────────

function EdaTab() {
  const [res, setRes] = React.useState<EdaResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/ml", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "eda" }) });
      const j = await r.json();
      if (j.ok) setRes(j.data);
      else toast({ title: j.error, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const heatOption: React.ComponentProps<typeof EChart>["option"] | null = React.useMemo(() => {
    if (!res) return null;
    const labels = res.corrMatrix.cols;
    const data: Array<[number, number, number]> = [];
    res.corrMatrix.matrix.forEach((row, i) => row.forEach((v, j) => data.push([j, i, v])));
    return {
      tooltip: { position: "top", formatter: (p: { data: [number, number, number] }) => `${labels[p.data[1]]} ↔ ${labels[p.data[0]]}: ${p.data[2]}` },
      grid: { top: 8, right: 8, bottom: 130, left: 130 },
      xAxis: { type: "category", data: labels, axisLabel: { rotate: 38, fontSize: 9, fontFamily: "Vazirmatn" }, splitArea: { show: true } },
      yAxis: { type: "category", data: labels, axisLabel: { fontSize: 9, fontFamily: "Vazirmatn" }, splitArea: { show: true } },
      visualMap: {
        min: -1, max: 1, calculable: false, orient: "horizontal", left: "center", bottom: 0,
        inRange: { color: ["#b4693b", "#efe6d3", "#17877d"] },
        textStyle: { fontFamily: "Vazirmatn", fontSize: 10 },
      },
      series: [{ type: "heatmap", data, label: { show: true, fontSize: 8, formatter: (p: { data: [number, number, number] }) => p.data[2].toFixed(2) } }],
    };
  }, [res]);

  if (!res) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          {loading ? <LoadingSkeleton /> : (
            <>
              <p className="text-sm text-muted-foreground">اجرای تحلیل اکتشافی روی مجموعه رکوردهای نمایشی (آمار توصیفی، داده پرت، همبستگی، توزیع).</p>
              <Button onClick={run} className="gap-2"><Play className="h-4 w-4" /> اجرای EDA</Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">آمار توصیفی ({fa(res.n, 0)} رکورد)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="sci-table w-full text-[11px] border rounded-lg overflow-hidden">
            <thead>
              <tr className="border-b">
                {["متغیر", "واحد", "میانگین", "میانه", "انحراف معیار", "کمینه", "بیشینه", "چارک ۱", "چارک ۳", "پرت (IQR)"].map((h) => (
                  <th key={h} className="text-right p-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {res.stats.map((s) => (
                <tr key={s.key} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="p-2 font-medium whitespace-nowrap">{s.label}</td>
                  <td className="p-2 text-muted-foreground" dir="auto">{s.unit}</td>
                  <td className="p-2 num" dir="ltr">{s.mean.toFixed(1)}</td>
                  <td className="p-2 num" dir="ltr">{s.median.toFixed(1)}</td>
                  <td className="p-2 num" dir="ltr">{s.std.toFixed(1)}</td>
                  <td className="p-2 num" dir="ltr">{s.min.toFixed(1)}</td>
                  <td className="p-2 num" dir="ltr">{s.max.toFixed(1)}</td>
                  <td className="p-2 num" dir="ltr">{s.q1.toFixed(1)}</td>
                  <td className="p-2 num" dir="ltr">{s.q3.toFixed(1)}</td>
                  <td className="p-2 num">{fa(s.outliers, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm">ماتریس همبستگی پیرسون</CardTitle></CardHeader>
          <CardContent className="p-3">{heatOption && <EChart option={heatOption} height={420} />}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm">توزیع متغیرهای کلیدی</CardTitle></CardHeader>
          <CardContent className="p-3 grid gap-4">
            {res.histograms.filter((h) => ["total", "cooling", "heightM", "wwrPct"].includes(h.key)).map((h) => (
              <div key={h.key}>
                <p className="text-[11px] font-semibold mb-1">{h.label} <span className="text-muted-foreground" dir="auto">({h.unit})</span></p>
                <EChart
                  height={110}
                  option={{
                    grid: { top: 4, right: 8, bottom: 20, left: 8 },
                    xAxis: { type: "category", data: h.counts.map((_, i) => `${(h.min + i * h.binWidth).toFixed(0)}`), axisLabel: { fontSize: 8, fontFamily: "Vazirmatn" } },
                    yAxis: { type: "value", axisLabel: { fontSize: 8 }, splitLine: { show: false } },
                    series: [{ type: "bar", data: h.counts, itemStyle: { color: "#17877d" } }],
                    tooltip: {},
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─────────────── K-Means ───────────────

function KMeansTab() {
  const [k, setK] = React.useState("3");
  const [seed, setSeed] = React.useState("42");
  const [res, setRes] = React.useState<KMeansResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const base = useBaseOption();

  const run = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/ml", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "kmeans", k: Number(k), seed: Number(seed) }) });
      const j = await r.json();
      if (j.ok) {
        setRes(j.data);
        toast({ title: "خوشه‌بندی اجرا شد", description: `Silhouette = ${j.data.silhouette.toFixed(3)} • ${j.data.iterations} تکرار` });
      } else toast({ title: j.error, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const scatterOption: React.ComponentProps<typeof EChart>["option"] | null = React.useMemo(() => {
    if (!res) return null;
    return {
      ...base,
      tooltip: { ...base.tooltip, formatter: (p: { data: { code?: string; value: number[] } }) => `${p.data.code ?? ""}<br/>سطح: ${p.data.value[0]} m² • تقاضا: ${p.data.value[1]}` },
      grid: { top: 20, right: 20, bottom: 44, left: 52 },
      xAxis: { type: "value", name: "سطح اشغال (m²)", nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10 }, axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } } },
      yAxis: { type: "value", name: "تقاضای کل (kWh/m²·a)", nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10 }, axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } } },
      series: [
        {
          type: "scatter",
          symbolSize: 10,
          itemStyle: { opacity: 0.85 },
          data: res.points.map((p) => ({ value: [p.x, p.y], code: p.code, itemStyle: { color: BAR_COLORS[p.label % BAR_COLORS.length] } })),
        },
      ],
    };
  }, [res, base]);

  if (!res) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            خوشه‌بندی K-Means روی ۵ ویژگی ریخت‌شناختی (ارتفاع، WWR، کیفیت پوسته، سطح اشغال، حیاط) با استانداردسازی و seed ثبت‌شده.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1"><Label className="text-xs">تعداد خوشه (k)</Label><Input value={k} onChange={(e) => setK(e.target.value)} className="w-20 h-9" type="number" min={2} max={6} /></div>
            <div className="space-y-1"><Label className="text-xs">Seed (بازتولیدپذیری)</Label><Input value={seed} onChange={(e) => setSeed(e.target.value)} className="w-24 h-9" type="number" /></div>
            <Button onClick={run} disabled={loading} className="gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} اجرای خوشه‌بندی</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profileOption: React.ComponentProps<typeof EChart>["option"] = {
    ...base,
    tooltip: { ...base.tooltip },
    legend: { ...base.legend, top: 2 },
    radar: {
      indicator: res.profiles[0].featureMeans.map((f) => ({ name: f.label, max: 1 })),
      radius: "62%",
      axisName: { color: base.axis.labelColor, fontSize: 10, fontFamily: "Vazirmatn" },
    },
    series: [
      {
        type: "radar",
        data: res.profiles.map((p) => ({
          name: `تیپ ${p.cluster} (n=${p.size})`,
          value: p.featureMeans.map((f) => {
            // نرمال‌سازی صرفاً برای مقایسه پروفایل (نمایش) — مقدار اصلی در جدول درج شده است
            const all = res.profiles.flatMap((x) => x.featureMeans.map((g) => g.value));
            const max = Math.max(...all) || 1;
            return Math.round((f.value / max) * 100) / 100;
          }),
          areaStyle: { opacity: 0.15 },
          lineStyle: { width: 2 },
        })),
      },
    ],
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="gap-1.5 text-[11px]">Silhouette: <b className="num" dir="ltr">{res.silhouette.toFixed(3)}</b></Badge>
        <Badge variant="outline" className="gap-1.5 text-[11px]">Inertia (WCSS): <b className="num" dir="ltr">{res.inertia.toFixed(1)}</b></Badge>
        <Badge variant="outline" className="gap-1.5 text-[11px]">تکرار: {fa(res.iterations, 0)} {res.converged ? "(همگرا)" : "(حد تکرار)"}</Badge>
        <Badge variant="outline" className="gap-1.5 text-[11px]">Seed: <b className="num" dir="ltr">{res.seed}</b></Badge>
        <span className="text-[11px] text-muted-foreground">مدل با شناسه ثبت شد — بازتولیدپذیر</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm">پروفایل تیپ‌ها (نمایش مقایسه‌ای نرمال‌شده)</CardTitle></CardHeader>
          <CardContent className="p-3"><EChart option={profileOption} height={330} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm">پراکندگی بناها به رنگ تیپ</CardTitle></CardHeader>
          <CardContent className="p-3"><EChart option={scatterOption ?? {}} height={330} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm">جدول تیپ‌ها — مقادیر اصلی</CardTitle></CardHeader>
        <CardContent className="p-3 overflow-x-auto">
          <table className="sci-table w-full text-[11px] border rounded-lg overflow-hidden">
            <thead>
              <tr className="border-b">
                <th className="text-right p-2">تیپ</th>
                <th className="text-right p-2">اندازه</th>
                {res.profiles[0]?.featureMeans.map((f) => <th key={f.key} className="text-right p-2 whitespace-nowrap">{f.label}</th>)}
                <th className="text-right p-2">تقاضای کل*</th>
              </tr>
            </thead>
            <tbody>
              {res.profiles.map((p) => (
                <tr key={p.cluster} className="border-b last:border-0">
                  <td className="p-2 font-bold">تیپ {fa(p.cluster, 0)}</td>
                  <td className="p-2 num">{fa(p.size, 0)}</td>
                  {p.featureMeans.map((f) => <td key={f.key} className="p-2 num" dir="ltr">{f.value.toFixed(1)}</td>)}
                  <td className="p-2 num" dir="ltr">{p.meanTotal.toFixed(1)}</td>
                </tr>
              ))}
              </tbody>
            </table>
            <p className="text-[10px] text-copper mt-2 leading-5">* تقاضای انرژی میانگین اعضا بر داده نمایشی است. تفسیر تیپ‌ها به‌عنوان «الگو» نیازمند تکرار با داده واقعی است.</p>
          </CardContent>
        </Card>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={() => { setRes(null); }}>اجرای جدید با پارامتر دیگر</Button>
      </div>
    </div>
  );
}

// ─────────────── رگرسیون ───────────────

function RegressionTab() {
  const [target, setTarget] = React.useState("total");
  const [seed, setSeed] = React.useState("42");
  const [res, setRes] = React.useState<RegResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const base = useBaseOption();

  const run = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/ml", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "regression", target, seed: Number(seed) }) });
      const j = await r.json();
      if (j.ok) {
        setRes(j.data);
        toast({ title: "رگرسیون آموزش دید و ارزیابی شد", description: `آزمون گروهی — R²=${j.data.metricsTest.R2?.toFixed(3)}` });
      } else toast({ title: j.error, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const scatterOption: React.ComponentProps<typeof EChart>["option"] | null = React.useMemo(() => {
    if (!res) return null;
    const all = [...res.scatterTrain.map((s) => [s.observed, s.predicted]), ...res.scatterTest.map((s) => [s.observed, s.predicted])];
    const minV = Math.floor(Math.min(...all.flat()));
    const maxV = Math.ceil(Math.max(...all.flat()));
    return {
      ...base,
      tooltip: { ...base.tooltip, formatter: (p: { data: { value: number[]; code?: string } }) => `${p.data.code ?? ""}<br/>مشاهده: ${p.data.value[0]} • پیش‌بینی: ${p.data.value[1]}` },
      grid: { top: 24, right: 20, bottom: 44, left: 54 },
      xAxis: { type: "value", name: "مشاهده‌شده", min: minV, max: maxV, nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10 }, axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } } },
      yAxis: { type: "value", name: "پیش‌بینی‌شده", min: minV, max: maxV, nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10 }, axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } } },
      series: [
        { type: "scatter", name: "آموزش", symbolSize: 8, itemStyle: { color: "#1f4e6e", opacity: 0.55 }, data: res.scatterTrain.map((s) => ({ value: [s.observed, s.predicted], code: s.code })) },
        { type: "scatter", name: "آزمون", symbolSize: 11, itemStyle: { color: "#b4693b", opacity: 0.9 }, data: res.scatterTest.map((s) => ({ value: [s.observed, s.predicted], code: s.code })) },
        { type: "line", name: "خط ۱:۱", symbol: "none", lineStyle: { type: "dashed", color: "#17877d", width: 2 }, data: [[minV, minV], [maxV, maxV]], tooltip: { show: false } },
      ],
      legend: { ...base.legend, top: 0, data: ["آموزش", "آزمون", "خط ۱:۱"] },
    };
  }, [res, base]);

  const residualOption: React.ComponentProps<typeof EChart>["option"] | null = React.useMemo(() => {
    if (!res) return null;
    return {
      ...base,
      tooltip: { ...base.tooltip },
      grid: { top: 24, right: 20, bottom: 44, left: 54 },
      xAxis: { type: "value", name: "پیش‌بینی‌شده", nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10 }, axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } } },
      yAxis: { type: "value", name: "باقیمانده", nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10 }, axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } } },
      series: [{ type: "scatter", symbolSize: 9, itemStyle: { color: "#17877d", opacity: 0.8 }, data: res.residualsTest.map((r) => [r.predicted, Math.round(r.residual * 100) / 100]) }],
    };
  }, [res, base]);

  if (!res) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-6">
            رگرسیون خطی چندمتغیره (OLS) با ۵ ویژگی ریخت‌شناختی. تفکیک گروهی بر پایه بلوک: ۲ بلوک آموزش، ۱ بلوک آزمون — کنترل نشت فضایی.
            پیش‌پردازش (استانداردسازی) فقط با داده آموزش برازش می‌شود.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">متغیر وابسته</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="w-52 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">تقاضای کل ویژه (نمایشی)</SelectItem>
                  <SelectItem value="cooling">تقاضای سرمایش ویژه (نمایشی)</SelectItem>
                  <SelectItem value="heating">تقاضای گرمایش ویژه (نمایشی)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Seed</Label><Input value={seed} onChange={(e) => setSeed(e.target.value)} className="w-24 h-9" type="number" /></div>
            <Button onClick={run} disabled={loading} className="gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} آموزش و ارزیابی</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* وضعیت صریح */}
      <Alert className="border-d9a441/50 bg-[#d9a441]/5">
        <Info className="h-4 w-4 text-[#8a6a1c]" />
        <AlertTitle className="text-sm">وضعیت مدل: ارزیابی داخلی (hold-out گروهی) — نه اعتبارسنجی خارجی</AlertTitle>
        <AlertDescription className="text-xs leading-6">
          مدل فقط بر داده نمایشی آموزش دیده است و به‌هیچ‌وجه مدل اعتبارسنجی‌شده با واقعیت نیست.
          دامنه اعتبار: بناهای نمایشی با ویژگی‌های مشابه نمونه؛ تعمیم به بافت واقعی شیراز نیازمند داده میدانی است.
        </AlertDescription>
      </Alert>

      {/* معیارها */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { l: "MAE آزمون", v: res.metricsTest.MAE.toFixed(2), u: res.target.unit },
          { l: "RMSE آزمون", v: res.metricsTest.RMSE.toFixed(2), u: res.target.unit },
          { l: "R² آزمون", v: res.metricsTest.R2?.toFixed(3) ?? "—", u: "" },
          { l: "NMBE آزمون", v: res.metricsTest.NMBE?.toFixed(2) ?? "—", u: "٪" },
          { l: "CV(RMSE) آزمون", v: res.metricsTest.CVRMSE?.toFixed(2) ?? "—", u: "٪" },
          { l: "MAPE", v: res.metricsTest.MAPE?.toFixed(2) ?? "محاسبه نشد", u: res.metricsTest.MAPE ? "٪" : "" },
        ].map((m) => (
          <div key={m.l} className="rounded-xl border p-3 text-center">
            <p className="text-[10px] text-muted-foreground">{m.l}</p>
            <p className="text-lg font-bold num" dir="ltr">{m.v} <span className="text-[10px] font-normal text-muted-foreground">{m.u}</span></p>
          </div>
        ))}
      </div>
      {res.metricsTest.mapeExcluded && <p className="text-[11px] text-copper leading-5">⚠ {res.metricsTest.mapeExcluded}</p>}

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">مشاهده‌شده ↔ پیش‌بینی‌شده با خط ۱:۱ ({res.target.unit})</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <EChart option={scatterOption} height={330} />
            <p className="text-[10px] text-muted-foreground mt-1">تفکیک گروهی: آموزش = بلوک‌های {res.split.trainBlocks.join("، ")} ({fa(res.split.trainSize, 0)} بنا) • آزمون = بلوک {res.split.testBlocks.join("، ")} ({fa(res.split.testSize, 0)} بنا) • Seed={res.seed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm">باقیمانده در برابر پیش‌بینی (داده آزمون)</CardTitle></CardHeader>
          <CardContent className="p-3"><EChart option={residualOption} height={330} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm">ضرایب مدل — بتای استانداردشده (سهم نسبی) و شیب واحد اصلی</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="sci-table w-full text-[11px] border rounded-lg overflow-hidden">
            <thead><tr className="border-b"><th className="text-right p-2">ویژگی</th><th className="text-right p-2">بتای استاندارد</th><th className="text-right p-2">شیب (واحد اصلی)</th></tr></thead>
            <tbody>
              {res.features.map((f, i) => (
                <tr key={f.key} className="border-b last:border-0">
                  <td className="p-2 font-medium">{f.label}</td>
                  <td className="p-2 num" dir="ltr">{res.coefStd[i].toFixed(3)}</td>
                  <td className="p-2 num" dir="ltr">{res.coefOriginal[i].toFixed(3)}</td>
                </tr>
              ))}
              <tr><td className="p-2 font-medium">عرض از مبدأ</td><td className="p-2">—</td><td className="p-2 num" dir="ltr">{res.intercept.toFixed(2)}</td></tr>
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground mt-2 leading-5">
            R² آموزش: {res.r2Train.toFixed(3)} • R² آزمون: {res.metricsTest.R2?.toFixed(3) ?? "—"} •
            بتای استاندارد برای مقایسه سهم نسبی ویژگی‌هاست و به معنای رابطه علّی نیست.
          </p>
        </CardContent>
      </Card>
      <Button variant="outline" size="sm" onClick={() => setRes(null)}>آموزش مدل جدید</Button>
    </div>
  );
}
