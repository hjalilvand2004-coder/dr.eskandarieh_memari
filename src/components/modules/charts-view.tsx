"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader, EmptyState, fa, DemoBadge } from "@/components/shared/ui-bits";
import { EChart, useBaseOption } from "@/components/charts/echart";
import { Scatter3D, type Scatter3DHandle } from "@/components/charts/scatter3d";
import * as echarts from "echarts";
import { useTheme } from "next-themes";
import { toast } from "@/hooks/use-toast";
import { fetchJson } from "@/lib/safe-json";
import { LineChart, Download, FileImage, FileCode2, FileDown, History, Loader2, Boxes } from "lucide-react";

interface Building {
  code: string; block: string; indicators: { footprintM2: number; svRatio: number; heightM: number; wwrPct: number; compactness: number }; energy?: { totalKwhM2a: number; coolingKwhM2a: number; heatingKwhM2a: number };
}
interface Block { code: string; name: string; hwRatio: number; coverage: number; skylineCv: number; vegetationFraction: number }
interface Calibration { period: string; measuredKwh: number; simulatedKwh: number }

type ChartKind = "scatter" | "box" | "blocks" | "timeline" | "sv_energy" | "scatter3d";

const CHART_KINDS: Array<{ key: ChartKind; label: string }> = [
  { key: "scatter", label: "پراکندگی سطح ↔ تقاضا" },
  { key: "sv_energy", label: "پراکندگی S/V ↔ تقاضا" },
  { key: "scatter3d", label: "پراکندگی سه‌بعدی: سطح × ارتفاع × تقاضا" },
  { key: "box", label: "جعبه‌ای تقاضا بر پایه بلوک" },
  { key: "blocks", label: "میله‌ای شاخص‌های بلوکی" },
  { key: "timeline", label: "سری زمانی کالیبراسیون (نمایشی)" },
];

interface ChartSpec {
  kind: ChartKind;
  title: string;
  caption: string;
  figureNo: string;
}

const DATE = new Date().toLocaleDateString("fa-IR");
const VERSION = "demo-morph-energy-v1";

export function ChartsView() {
  const [atlas, setAtlas] = React.useState<{ buildings: Building[]; blocks: Block[] } | null>(null);
  const [calibration, setCalibration] = React.useState<Calibration[] | null>(null);
  const [spec, setSpec] = React.useState<ChartSpec>({ kind: "scatter", title: "رابطه سطح اشغال و تقاضای انرژی ویژه بناهای نمونه", caption: "توزیع بناهای نمونه نمایشی برحسب سطح اشغال و تقاضای انرژی ویژه. رنگ: بلوک.", figureNo: "شکل ۱" });
  const [loading, setLoading] = React.useState(true);
  const chartRef = React.useRef<echarts.ECharts | null>(null);
  const scatter3dRef = React.useRef<Scatter3DHandle | null>(null);
  const base = useBaseOption();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const cssVar = (name: string, fallback: string) =>
    typeof window !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback : fallback;

  React.useEffect(() => {
    Promise.all([
      fetchJson<{ buildings: Building[]; blocks: Block[] }>("/api/atlas"),
      fetchJson<Array<{ name: string; data: string | null }>>("/api/datasets"),
    ]).then(([a, d]) => {
      if (a.ok && a.data) setAtlas({ buildings: a.data.buildings, blocks: a.data.blocks });
      if (d.ok && d.data) {
        const cal = (d.data as Array<{ name: string; data: string | null }>).find((x) => x.name.includes("کالیبراسیون"));
        if (cal?.data) setCalibration(JSON.parse(cal.data));
      }
    }).finally(() => setLoading(false));
  }, []);

  const blockColors = ["#1f4e6e", "#17877d", "#b4693b"];
  const kind = spec.kind;

  const makeOption = () => {
    if (!atlas) return {};
    const axisCommon = (nameX: string, nameY: string) => ({
      xAxis: { type: "value", name: nameX, nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10 }, axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } } },
      yAxis: { type: "value", name: nameY, nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10 }, axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } } },
    });
    const nameGap = { grid: { top: 30, right: 24, bottom: 48, left: 60 } };

    if (kind === "scatter" || kind === "sv_energy") {
      const getX = kind === "scatter" ? (b: Building) => Math.round(b.indicators.footprintM2) : (b: Building) => Number(b.indicators.svRatio.toFixed(3));
      const xName = kind === "scatter" ? "سطح اشغال (m²)" : "S/V (m⁻¹)";
      const blockNames = atlas.blocks.map((b) => b.code);
      return {
        ...base,
        ...nameGap,
        tooltip: { ...base.tooltip },
        legend: { ...base.legend, top: 2, data: blockNames },
        ...axisCommon(xName, "تقاضای کل (kWh/m²·a)"),
        series: atlas.blocks.map((bl, i) => ({
          name: bl.code,
          type: "scatter",
          symbolSize: 9,
          itemStyle: { color: blockColors[i % blockColors.length], opacity: 0.8 },
          data: atlas.buildings.filter((b) => b.block === bl.code && b.energy).map((b) => [getX(b), b.energy!.totalKwhM2a]),
        })),
      };
    }
    if (kind === "box") {
      const groups = atlas.blocks.map((bl) => atlas.buildings.filter((b) => b.block === bl.code && b.energy).map((b) => b.energy!.totalKwhM2a).sort((a, b) => a - b));
      return {
        ...base,
        ...nameGap,
        tooltip: { ...base.tooltip },
        ...axisCommon("", "تقاضای کل (kWh/m²·a)"),
        xAxis: { type: "category", data: atlas.blocks.map((b) => b.name), axisLabel: { fontSize: 9, fontFamily: "Vazirmatn" } },
        series: [{ type: "boxPlot", data: groups.map((g) => [g[0], g[Math.floor(g.length * 0.25)], g[Math.floor(g.length * 0.5)], g[Math.floor(g.length * 0.75)], g[g.length - 1]]), itemStyle: { color: "#17877d33", borderColor: "#17877d" } }],
      };
    }
    if (kind === "blocks") {
      return {
        ...base,
        tooltip: { ...base.tooltip },
        legend: { ...base.legend, top: 2 },
        grid: { top: 34, right: 24, bottom: 40, left: 52 },
        xAxis: { type: "category", data: atlas.blocks.map((b) => b.name), axisLabel: { fontSize: 9, fontFamily: "Vazirmatn" } },
        yAxis: { type: "value", axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } } },
        series: [
          { name: "H/W", type: "bar", data: atlas.blocks.map((b) => Number(b.hwRatio.toFixed(2))), itemStyle: { color: "#1f4e6e" }, barWidth: "20%" },
          { name: "اشغال (٪)", type: "bar", data: atlas.blocks.map((b) => Number((b.coverage * 100).toFixed(1))), itemStyle: { color: "#17877d" }, barWidth: "20%" },
          { name: "پوشش گیاهی (٪)", type: "bar", data: atlas.blocks.map((b) => Number((b.vegetationFraction * 100).toFixed(1))), itemStyle: { color: "#7a8c5c" }, barWidth: "20%" },
        ],
      };
    }
    // timeline
    if (!calibration) return {};
    return {
      ...base,
      tooltip: { ...base.tooltip },
      legend: { ...base.legend, top: 2 },
      grid: { top: 34, right: 24, bottom: 52, left: 60 },
      xAxis: { type: "category", data: calibration.map((_, i) => `دوره ${i + 1}`), axisLabel: { fontSize: 9, fontFamily: "Vazirmatn" } },
      yAxis: { type: "value", name: "kWh", nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10 }, axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } } },
      series: [
        { name: "اندازه‌گیری معادل", type: "line", data: calibration.map((c) => c.measuredKwh), lineStyle: { width: 2.5, color: "#1f4e6e" }, itemStyle: { color: "#1f4e6e" }, symbolSize: 6 },
        { name: "شبیه‌سازی معادل", type: "line", data: calibration.map((c) => c.simulatedKwh), lineStyle: { width: 2, type: "dashed", color: "#b4693b" }, itemStyle: { color: "#b4693b" }, symbolSize: 6 },
      ],
    };
  };
  const option: React.ComponentProps<typeof EChart>["option"] = makeOption();

  const makeCsv = () => {
    if (!atlas) return "";
    if (kind === "scatter" || kind === "sv_energy") {
      const header = kind === "scatter" ? "code,block,footprintM2,totalKwhM2a" : "code,block,svRatio,totalKwhM2a";
      const rows = atlas.buildings.filter((b) => b.energy).map((b) =>
        [b.code, b.block, kind === "scatter" ? Math.round(b.indicators.footprintM2) : b.indicators.svRatio.toFixed(3), b.energy!.totalKwhM2a].join(",")
      );
      return [header, ...rows].join("\n");
    }
    if (kind === "scatter3d") {
      const rows = atlas.buildings.filter((b) => b.energy).map((b) =>
        [b.code, b.block, Math.round(b.indicators.footprintM2), b.indicators.heightM, b.energy!.totalKwhM2a].join(",")
      );
      return ["code,block,footprintM2,heightM,totalKwhM2a", ...rows].join("\n");
    }
    if (kind === "box" || kind === "blocks") {
      const rows = atlas.blocks.map((b) => `${b.code},${b.hwRatio.toFixed(2)},${(b.coverage * 100).toFixed(1)},${(b.vegetationFraction * 100).toFixed(1)}`);
      return ["block,hwRatio,coveragePct,vegetationPct", ...rows].join("\n");
    }
    if (calibration) {
      return ["period,measuredKwh,simulatedKwh", ...calibration.map((c) => `${c.period},${c.measuredKwh},${c.simulatedKwh}`)].join("\n");
    }
    return "";
  };
  const dataBehindCsv = makeCsv();

  // نقاط سه‌بعدی استودیو: سطح × ارتفاع × تقاضا به رنگ بلوک
  const scatter3dPoints = atlas
    ? atlas.buildings
        .filter((b) => b.energy)
        .map((b) => ({
          x: Math.round(b.indicators.footprintM2),
          y: b.energy!.totalKwhM2a,
          z: b.indicators.heightM,
          color: blockColors[Math.max(0, atlas.blocks.findIndex((bl) => bl.code === b.block)) % blockColors.length],
          code: b.code,
        }))
    : [];

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob(["\uFEFF" + content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  if (loading) return <EmptyState title="در حال بارگذاری استودیو…" />;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="استودیو نمودارهای علمی"
        subtitle="ساخت شکل قابل استناد با داده پشت نمودار، منشأ، روش تولید، نسخه تحلیل و کپشن پیشنهادی — خروجی PNG چاپی و SVG."
        icon={<LineChart />}
        actions={<DemoBadge />}
      />

      <div className="grid xl:grid-cols-[1fr_340px] gap-5 items-start">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="inline-grid place-items-center h-7 w-7 rounded-lg bg-primary text-primary-foreground text-xs font-bold">{spec.figureNo}</span>
                {spec.title || "شکل بدون عنوان"}
              </span>
              <div className="flex items-center gap-1.5 no-print">
                <Select value={spec.kind} onValueChange={(v) => {
                  const k = v as ChartKind;
                  if (k === "scatter3d" && spec.kind !== "scatter3d") {
                    setSpec({ ...spec, kind: k, title: "رابطه سه‌بعدی سطح، ارتفاع و تقاضای انرژی بناهای نمونه", caption: "پراکندگی سه‌بعدی بناهای نمونه نمایشی در فضای سطح اشغال، ارتفاع و تقاضای انرژی ویژه؛ رنگ: بلوک. محورها مقیاس یکسان ندارند و نمایش اکتشافی است." });
                  } else setSpec({ ...spec, kind: k });
                }}>
                  <SelectTrigger className="w-52 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHART_KINDS.map((k) => <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            {kind === "scatter3d" ? (
              <Scatter3D
                points={scatter3dPoints}
                axes={{ x: "سطح اشغال (m²)", y: "تقاضای کل (kWh/m²·a)", z: "ارتفاع (m)" }}
                height={400}
                bg={cssVar("--card", isDark ? "#142838" : "#fffdf8")}
                gridColor={cssVar("--border", isDark ? "#24425a" : "#e8e2d2")}
                labelColor={cssVar("--muted-foreground", isDark ? "#9db0be" : "#5d6b77")}
                onReady={(h) => (scatter3dRef.current = h)}
                ariaLabel="پراکندگی سه‌بعدی سطح، ارتفاع و تقاضای انرژی بناهای نمونه"
              />
            ) : (
              <EChart option={option} height={400} onReady={(c) => (chartRef.current = c)} />
            )}
            <div className="flex flex-wrap gap-2 mt-3 no-print">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                let url: string | null = null;
                if (kind === "scatter3d") url = scatter3dRef.current?.toDataURL(3) ?? null;
                else if (chartRef.current) url = chartRef.current.getDataURL({ type: "png", pixelRatio: 3, backgroundColor: "#ffffff" });
                if (!url) return;
                const a = document.createElement("a");
                a.href = url;
                a.download = `${spec.figureNo.replace(/\s/g, "-")}.png`;
                a.click();
                toast({ title: "PNG با وضوح چاپ ذخیره شد", description: "پس‌زمینه سفید و مقیاس ۳×" });
              }}>
                <FileImage className="h-3.5 w-3.5" /> خروجی PNG (چاپ)
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                if (kind === "scatter3d") {
                  toast({ title: "خروجی SVG برای نمودار سه‌بعدی پشتیبانی نمی‌شود", description: "از خروجی PNG چاپی استفاده کنید.", variant: "destructive" });
                  return;
                }
                if (!chartRef.current) return;
                const svg = chartRef.current.renderToSVGString({ backgroundColor: "#ffffff" });
                downloadFile(svg, `${spec.figureNo.replace(/\s/g, "-")}.svg`, "image/svg+xml");
                toast({ title: "SVG ذخیره شد" });
              }}>
                <FileCode2 className="h-3.5 w-3.5" /> خروجی SVG
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                downloadFile(dataBehindCsv, `${spec.figureNo.replace(/\s/g, "-")}-data.csv`, "text/csv;charset=utf-8");
                toast({ title: "داده پشت نمودار ذخیره شد" });
              }}>
                <FileDown className="h-3.5 w-3.5" /> داده نمودار (CSV)
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
                <Download className="h-3.5 w-3.5" /> چاپ/PDF گزارش
              </Button>
            </div>
            <div className="mt-4 print-only">
              <p className="text-sm font-bold">{spec.figureNo} — {spec.title}</p>
              <p className="text-xs leading-6">{spec.caption}</p>
            </div>
          </CardContent>
        </Card>

        {/* مشخصات شکل */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">ویرایش شکل</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><Label className="text-[11px]">شماره شکل</Label><Input value={spec.figureNo} onChange={(e) => setSpec({ ...spec, figureNo: e.target.value })} className="h-8 text-xs" /></div>
              <div className="space-y-1"><Label className="text-[11px]">عنوان</Label><Input value={spec.title} onChange={(e) => setSpec({ ...spec, title: e.target.value })} className="h-8 text-xs" /></div>
              <div className="space-y-1"><Label className="text-[11px]">کپشن پیشنهادی (قابل ویرایش)</Label><Textarea value={spec.caption} onChange={(e) => setSpec({ ...spec, caption: e.target.value })} className="min-h-24 text-xs leading-6" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4" /> منشأ و ردیابی</CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] space-y-2 leading-5">
              <p><b>منبع داده:</b> {spec.kind === "timeline" ? "مجموعه «سری کالیبراسیون (نمایشی)»" : "موجودیت‌های فضایی + داده انرژی نمایشی"}</p>
              <p><b>روش تولید:</b> {spec.kind === "scatter3d" ? "پراکندگی سه‌بعدی WebGL (Three.js) از سه متغیر با محورهای برچسب‌دار؛ رنگ: بلوک" : spec.kind === "scatter" || spec.kind === "sv_energy" ? "پراکندگی دوبعدی بر داده بناهای نمایشی" : spec.kind === "box" ? "جعبه‌ای (پنج‌عددی) بر داده بلوک‌ها" : spec.kind === "blocks" ? "میله‌ای گروهی شاخص‌های بلوکی محاسبه‌شده از هندسه" : "سری زمانی مقایسه‌ای دو سری معادل"}</p>
              <p><b>تاریخ تولید:</b> {DATE}</p>
              <p><b>نسخه تحلیل:</b> {VERSION}</p>
              <p><b>پالت:</b> سازگار با اختلال دید رنگ (Okabe/Viridis) • فونت: Vazirmatn</p>
              <div className="rounded-lg bg-copper/10 border border-copper/30 px-2.5 py-2 text-copper">
                ⚠ این شکل بر داده نمایشی ساخته شده و برای استناد علمی معتبر نیست. پس از جایگزینی با داده واقعی، نسخه تحلیل جدید ثبت می‌شود.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
