"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, StatCard, EmptyState, fa, KeyValue, FormulaBox, DemoBadge } from "@/components/shared/ui-bits";
import { EChart, useBaseOption } from "@/components/charts/echart";
import { useAppStore } from "@/lib/store";
import { viridisAt } from "@/lib/palette";
import type { IndicatorMeta } from "@/lib/indicators";
import { toast } from "@/hooks/use-toast";
import { Map, ZoomIn, ZoomOut, Crosshair, Layers, Ruler, Sun, Leaf, Loader2 } from "lucide-react";

interface Building {
  code: string;
  block: string;
  name: string;
  polygon: [number, number][];
  courtyard: [number, number][] | null;
  props: { heightM: number; floors: number; era: string; material: string; condition: string; wwrPct: number; envelopeQuality: number; protectiveStatus: string };
  indicators: { footprintM2: number; perimeterM: number; volumeM3: number; svRatio: number; compactness: number; courtyardShare: number; orientationDeg: number; wwrPct: number; heightM: number; sharedWallsM: number; adjacentCount: number };
  energy?: { heatingKwhM2a: number; coolingKwhM2a: number; totalKwhM2a: number; comfortHoursOut: number };
}
interface Block {
  code: string; name: string; polygon: [number, number][]; areaM2: number; buildingCount: number; coverage: number; hwRatio: number; skylineCv: number; avgHeightM: number; avgCourtyardShare: number; vegetationFraction: number; permeableFraction: number; totalFootprintM2: number;
}
interface AtlasData {
  buildings: Building[];
  blocks: Block[];
  district: { buildingCount: number; blockCount: number; totalFootprintM2: number; totalBlockAreaM2: number; coverage: number; avgHeightM: number; meanSvRatio: number; courtyardBuildings: number };
  catalog: IndicatorMeta[];
}

const COLOR_MODES = [
  { key: "svRatio", label: "نسبت پوسته به حجم S/V", unit: "m⁻¹", get: (b: Building) => b.indicators.svRatio, digits: 3 },
  { key: "compactness", label: "فشردگی (گرِویل)", unit: "—", get: (b: Building) => b.indicators.compactness, digits: 3 },
  { key: "heightM", label: "ارتفاع بنا", unit: "m", get: (b: Building) => b.indicators.heightM, digits: 1 },
  { key: "orientationDeg", label: "جهت‌گیری", unit: "درجه", get: (b: Building) => b.indicators.orientationDeg, digits: 0 },
  { key: "wwrPct", label: "نسبت بازشو WWR", unit: "٪", get: (b: Building) => b.indicators.wwrPct, digits: 1 },
  { key: "courtyardShare", label: "سهم حیاط", unit: "—", get: (b: Building) => b.indicators.courtyardShare, digits: 2 },
  { key: "sharedWallsM", label: "دیوار مشترک", unit: "m", get: (b: Building) => b.indicators.sharedWallsM, digits: 1 },
  { key: "energyTotal", label: "تقاضای انرژی کل (نمایشی)", unit: "kWh/m²·a", get: (b: Building) => b.energy?.totalKwhM2a ?? NaN, digits: 1, demoOnly: true },
  { key: "cooling", label: "تقاضای سرمایش (نمایشی)", unit: "kWh/m²·a", get: (b: Building) => b.energy?.coolingKwhM2a ?? NaN, digits: 1, demoOnly: true },
  { key: "heating", label: "تقاضای گرمایش (نمایشی)", unit: "kWh/m²·a", get: (b: Building) => b.energy?.heatingKwhM2a ?? NaN, digits: 1, demoOnly: true },
];

export function AtlasView() {
  const [data, setData] = React.useState<AtlasData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [colorMode, setColorMode] = React.useState("svRatio");
  const [showBlocks, setShowBlocks] = React.useState(true);
  const [showCourtyards, setShowCourtyards] = React.useState(true);
  const [showLabels, setShowLabels] = React.useState(true);
  const [showVegetation, setShowVegetation] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [viewBox, setViewBox] = React.useState("");
  const dragRef = React.useRef<{ x: number; y: number; vb: number[] } | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const { setAtlasSelection } = useAppStore();

  React.useEffect(() => {
    fetch("/api/atlas")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setData(j.data);
          const xs = j.data.buildings.flatMap((b: Building) => b.polygon.map((p) => p[0]));
          const ys = j.data.buildings.flatMap((b: Building) => b.polygon.map((p) => p[1]));
          const pad = 12;
          const minX = Math.min(...xs) - pad;
          const minY = Math.min(...ys) - pad;
          const w = Math.max(...xs) - Math.min(...xs) + 2 * pad;
          const h = Math.max(...ys) - Math.min(...ys) + 2 * pad;
          setViewBox(`${minX} ${minY} ${w} ${h}`);
        } else toast({ title: j.error, variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, []);

  const mode = COLOR_MODES.find((m) => m.key === colorMode)!;
  const values = React.useMemo(
    () => (data ? data.buildings.map((b) => mode.get(b)).filter((v) => Number.isFinite(v)) : []),
    [data, mode]
  );
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;

  const colorOf = (b: Building): string => {
    const v = mode.get(b);
    if (!Number.isFinite(v)) return "var(--muted)";
    const t = max > min ? (v - min) / (max - min) : 0.5;
    return viridisAt(t);
  };

  const selectBuilding = (code: string) => {
    setSelected(code === selected ? null : code);
    const b = data?.buildings.find((x) => x.code === code);
    setAtlasSelection({ buildingCode: code === selected ? null : code, blockCode: b?.block ?? null });
  };

  const zoom = (factor: number) => {
    const parts = viewBox.split(" ").map(Number);
    const cx = parts[0] + parts[2] / 2;
    const cy = parts[1] + parts[3] / 2;
    const w = parts[2] * factor;
    const h = parts[3] * factor;
    setViewBox(`${cx - w / 2} ${cy - h / 2} ${w} ${h}`);
  };
  const resetView = () => {
    if (!data) return;
    const xs = data.buildings.flatMap((b) => b.polygon.map((p) => p[0]));
    const ys = data.buildings.flatMap((b) => b.polygon.map((p) => p[1]));
    setViewBox(`${Math.min(...xs) - 12} ${Math.min(...ys) - 12} ${Math.max(...xs) - Math.min(...xs) + 24} ${Math.max(...ys) - Math.min(...ys) + 24}`);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoom(e.deltaY > 0 ? 1.12 : 0.89);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    const parts = viewBox.split(" ").map(Number);
    dragRef.current = { x: e.clientX, y: e.clientY, vb: parts };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const parts = dragRef.current.vb;
    const scaleX = parts[2] / rect.width;
    const scaleY = parts[3] / rect.height;
    const dx = (e.clientX - dragRef.current.x) * scaleX;
    const dy = (e.clientY - dragRef.current.y) * scaleY;
    setViewBox(`${parts[0] - dx} ${parts[1] - dy} ${parts[2]} ${parts[3]}`);
  };
  const endDrag = () => (dragRef.current = null);

  if (loading) return <EmptyState title="در حال محاسبه شاخص‌های ریخت‌شناسی…" hint="موتور هندسی سامانه در حال اجراست." />;
  if (!data) return <EmptyState title="اطلس بارگذاری نشد" />;

  const selBuilding = data.buildings.find((b) => b.code === selected);
  const maxY = Math.max(...data.buildings.flatMap((b) => b.polygon.map((p) => p[1]))) + 12;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="اطلس مکانی و ریخت‌شناسی"
        subtitle="نقشه تعاملی دوبعدی بافت نمایشی — رنگ‌آمیزی بر پایه شاخص انتخابی با محاسبه واقعی از هندسه. انتخاب بنا با نمودارها هماهنگ می‌شود."
        icon={<Map />}
        actions={
          <div className="flex items-center gap-2">
            <Select value={colorMode} onValueChange={setColorMode}>
              <SelectTrigger className="w-56 h-9 text-xs" aria-label="شاخص رنگ‌آمیزی"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COLOR_MODES.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label} {m.demoOnly ? "• نمایشی" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* خلاصه محدوده */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="بناهای محدوده" value={fa(data.district.buildingCount, 0)} unit="بنا" tone="lapis" hint={`${fa(data.district.courtyardBuildings, 0)} بنا با حیاط مرکزی`} />
        <StatCard label="سطح اشغال محدوده" value={fa(Math.round(data.district.coverage * 100), 0)} unit="٪" tone="turquoise" hint={`از ${fa(data.district.totalBlockAreaM2, 0)} m² سطح بلوک‌ها`} />
        <StatCard label="میانگین ارتفاع" value={fa(data.district.avgHeightM, 1)} unit="m" tone="copper" hint="خط آسمان نمایشی" />
        <StatCard label="میانگین S/V" value={fa(data.district.meanSvRatio, 2)} unit="m⁻¹" hint="پوسته به حجم" />
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-5 items-start">
        {/* نقشه */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> نقشه تعاملی — لایه‌ها و رنگ‌آمیزی</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => zoom(0.8)} aria-label="بزرگ‌نمایی"><ZoomIn className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => zoom(1.25)} aria-label="کوچک‌نمایی"><ZoomOut className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={resetView} aria-label="بازنشانی نما"><Crosshair className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1.5">
              {[
                { l: "محدوده بلوک‌ها", v: showBlocks, set: setShowBlocks },
                { l: "حیاط‌های مرکزی", v: showCourtyards, set: setShowCourtyards },
                { l: "برچسب بناها", v: showLabels, set: setShowLabels },
                { l: "پوشش گیاهی (نمایشی)", v: showVegetation, set: setShowVegetation },
              ].map((s) => (
                <label key={s.l} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                  <Switch checked={s.v} onCheckedChange={s.set} className="scale-90" />
                  {s.l}
                </label>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <svg
              ref={svgRef}
              viewBox={viewBox}
              className="w-full h-[420px] md:h-[520px] bg-[#f3ecdd] dark:bg-[#0d1a26] touch-none select-none"
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              role="img"
              aria-label={`نقشه ریخت‌شناسی با رنگ‌آمیزی ${mode.label}`}
            >
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-muted-foreground/20" />
                </pattern>
              </defs>
              <rect x={-200} y={-200} width={1000} height={1000} fill="url(#grid)" />

              {/* بلوک‌ها */}
              {showBlocks &&
                data.blocks.map((bl) => (
                  <polygon
                    key={bl.code}
                    points={bl.polygon.map(([x, y]) => `${x},${maxY - y}`).join(" ")}
                    fill="none"
                    stroke="#b4693b"
                    strokeWidth={0.7}
                    strokeDasharray="3 2"
                    opacity={0.9}
                  />
                ))}
              {showBlocks &&
                data.blocks.map((bl) => {
                  const cx = bl.polygon.reduce((a, p) => a + p[0], 0) / bl.polygon.length;
                  const cy = maxY - bl.polygon.reduce((a, p) => a + p[1], 0) / bl.polygon.length;
                  return (
                    <text key={`lbl-${bl.code}`} x={cx} y={cy + 1.2} textAnchor="middle" fontSize={3.2} fill="#b4693b" fontWeight="700" fontFamily="Vazirmatn">
                      {bl.name} • H/W={bl.hwRatio.toFixed(1)} • اشغال={(bl.coverage * 100).toFixed(0)}٪
                    </text>
                  );
                })}

              {/* بناهای مجاور برای سایه‌گذاری نرم (استفاده از فیلتر ساده) */}
              {data.buildings.map((b) => (
                <g key={b.code} onClick={() => selectBuilding(b.code)} className="cursor-pointer">
                  <polygon
                    points={b.polygon.map(([x, y]) => `${x},${maxY - y}`).join(" ")}
                    fill={colorOf(b)}
                    stroke={selected === b.code ? "#b4693b" : "#ffffff88"}
                    strokeWidth={selected === b.code ? 0.9 : 0.25}
                    opacity={selected && selected !== b.code ? 0.45 : 1}
                  />
                  {showCourtyards && b.courtyard && (
                    <polygon
                      points={b.courtyard.map(([x, y]) => `${x},${maxY - y}`).join(" ")}
                      fill="#7a8c5c"
                      opacity={0.55}
                      stroke="#55663c"
                      strokeWidth={0.2}
                      pointerEvents="none"
                    />
                  )}
                  {showLabels && (
                    <text
                      x={b.polygon.reduce((a, p) => a + p[0], 0) / b.polygon.length}
                      y={maxY - b.polygon.reduce((a, p) => a + p[1], 0) / b.polygon.length + 1}
                      textAnchor="middle"
                      fontSize={2.6}
                      fill={selected === b.code ? "#ffffff" : "#1b2a38"}
                      fontWeight="600"
                      fontFamily="Vazirmatn"
                      pointerEvents="none"
                    >
                      {b.code}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </CardContent>
          {/* راهنمای رنگ */}
          <div className="px-4 py-3 border-t bg-muted/30">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <svg width="140" height="10" className="rounded" role="img" aria-label="راهنمای رنگ">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <rect key={i} x={i * 3.5} y={0} width={3.5} height={10} fill={viridisAt(i / 39)} />
                  ))}
                </svg>
                <span className="text-[11px] num" dir="ltr">{min.toFixed(mode.digits)}</span>
                <span className="text-[11px] text-muted-foreground">تا</span>
                <span className="text-[11px] num" dir="ltr">{max.toFixed(mode.digits)}</span>
                <Badge variant="outline" className="text-[10px]">{mode.unit}</Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">روش طبقه‌بندی: رنگ پیوسته viridis (کوررنگ‌پسند) • {mode.label}</span>
              <span className="text-[11px] text-muted-foreground">منبع لایه: موجودیت‌های فضایی نمایشی سامانه • {new Date().toLocaleDateString("fa-IR")}</span>
            </div>
          </div>
        </Card>

        {/* پنل جزئیات */}
        <Card className="sticky top-20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Ruler className="h-4 w-4 text-copper" /> مشخصات انتخاب</CardTitle>
          </CardHeader>
          <CardContent>
            {!selBuilding ? (
              <EmptyState title="بنا انتخاب نشده" hint="روی نقشه کلیک کنید تا مشخصات، شاخص‌ها و انرژی نمایشی آن اینجا نمایش یابد." />
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="font-bold text-sm">{selBuilding.name}</p>
                  <p className="text-[11px] text-muted-foreground">{data.blocks.find((b) => b.code === selBuilding.block)?.name}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-[11px] font-semibold mb-1 text-primary">شاخص‌های محاسبه‌شده از هندسه</p>
                  <KeyValue k="سطح اشغال" v={`${fa(Math.round(selBuilding.indicators.footprintM2), 0)} m²`} />
                  <KeyValue k="حجم" v={`${fa(Math.round(selBuilding.indicators.volumeM3), 0)} m³`} />
                  <KeyValue k="S/V پوسته" v={`${selBuilding.indicators.svRatio.toFixed(3)} m⁻¹`} />
                  <KeyValue k="فشردگی" v={selBuilding.indicators.compactness.toFixed(3)} />
                  <KeyValue k="سهم حیاط" v={`${fa(Math.round(selBuilding.indicators.courtyardShare * 100), 0)}٪`} />
                  <KeyValue k="جهت‌گیری" v={`${fa(Math.round(selBuilding.indicators.orientationDeg), 0)}°`} />
                  <KeyValue k="ارتفاع" v={`${selBuilding.indicators.heightM} m`} />
                  <KeyValue k="دیوار مشترک" v={`${selBuilding.indicators.sharedWallsM} m (${fa(selBuilding.indicators.adjacentCount, 0)} مجاور)`} />
                </div>
                <Separator />
                <div>
                  <p className="text-[11px] font-semibold mb-1 text-copper">ویژگی‌های ثبت‌شده (نمایشی)</p>
                  <KeyValue k="دوره ساخت" v={selBuilding.props.era} />
                  <KeyValue k="مصالح" v={selBuilding.props.material} />
                  <KeyValue k="وضعیت" v={selBuilding.props.condition} />
                  <KeyValue k="وضعیت حفاظتی" v={selBuilding.props.protectiveStatus} />
                  <KeyValue k="WWR" v={`${selBuilding.indicators.wwrPct}٪`} />
                  <KeyValue k="کیفیت پوسته" v={`${fa(selBuilding.props.envelopeQuality, 0)} از ۵`} />
                </div>
                {selBuilding.energy && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-[11px] font-semibold mb-1 flex items-center gap-1.5 text-turquoise-deep dark:text-turquoise">
                        <Sun className="h-3.5 w-3.5" /> انرژی (داده نمایشی)
                      </p>
                      <KeyValue k="گرمایش ویژه" v={`${selBuilding.energy.heatingKwhM2a} kWh/m²·a`} />
                      <KeyValue k="سرمایش ویژه" v={`${selBuilding.energy.coolingKwhM2a} kWh/m²·a`} />
                      <KeyValue k="تقاضای کل" v={`${selBuilding.energy.totalKwhM2a} kWh/m²·a`} />
                      <KeyValue k="ساعات خارج آسایش" v={`${fa(selBuilding.energy.comfortHoursOut, 0)} h/a`} />
                      <p className="text-[10px] text-copper mt-2">تقاضا ≠ مصرف نهایی ≠ انرژی اولیه؛ این مقادیر صوری‌اند.</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* نمودارهای متصل به انتخاب */}
      <AtlasLinkedCharts data={data} selected={selected} />

      {/* کاتالوگ شاخص‌ها */}
      <IndicatorCatalogCard catalog={data.catalog} />
    </div>
  );
}

// ─────────────── نمودارهای متصل ───────────────

function AtlasLinkedCharts({ data, selected }: { data: AtlasData; selected: string | null }) {
  const base = useBaseOption();
  const selBuilding = data.buildings.find((b) => b.code === selected);
  const selBlock = selBuilding?.block ?? null;

  const scatterOption: React.ComponentProps<typeof EChart>["option"] = {
    ...base,
    tooltip: { ...base.tooltip },
    grid: { top: 36, right: 24, bottom: 46, left: 58 },
    xAxis: {
      type: "value", name: "سطح اشغال (m²)", nameLocation: "middle", nameGap: 30,
      axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } },
      nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10, color: base.axis.labelColor },
    },
    yAxis: {
      type: "value", name: "تقاضای کل (kWh/m²·a)", nameLocation: "middle", nameGap: 40,
      axisLabel: { color: base.axis.labelColor, fontSize: 10 }, splitLine: { lineStyle: { color: base.axis.splitLineColor } },
      nameTextStyle: { fontFamily: "Vazirmatn", fontSize: 10, color: base.axis.labelColor },
    },
    series: [
      {
        type: "scatter",
        symbolSize: (val: number[], params: { dataIndex: number }) => (data.buildings[params.dataIndex].code === selected ? 16 : 8),
        itemStyle: {
          opacity: 0.75,
          color: (p: { dataIndex: number }) => {
            const b = data.buildings[p.dataIndex];
            if (b.code === selected) return "#b4693b";
            if (selBlock && b.block === selBlock) return "#17877d";
            return "#1f4e6e";
          },
        },
        data: data.buildings.map((b) => [Math.round(b.indicators.footprintM2), b.energy?.totalKwhM2a ?? 0]),
      },
    ],
  };

  const barOption: React.ComponentProps<typeof EChart>["option"] = {
    ...base,
    tooltip: { ...base.tooltip },
    grid: { top: 36, right: 24, bottom: 40, left: 52 },
    xAxis: { type: "category", data: data.blocks.map((b) => b.name), axisLabel: { color: base.axis.labelColor, fontSize: 9, fontFamily: "Vazirmatn" } },
    yAxis: {
      type: "value", name: "مقدار", axisLabel: { color: base.axis.labelColor, fontSize: 10 },
      splitLine: { lineStyle: { color: base.axis.splitLineColor } },
    },
    series: [
      {
        type: "bar",
        data: data.blocks.map((b) => ({ value: Number(b.hwRatio.toFixed(2)), itemStyle: { color: "#1f4e6e" } })),
        name: "H/W",
        barWidth: "18%",
      },
      {
        type: "bar",
        data: data.blocks.map((b) => ({ value: Number((b.coverage * 100).toFixed(1)), itemStyle: { color: "#17877d" } })),
        name: "سطح اشغال (٪)",
        barWidth: "18%",
      },
      {
        type: "bar",
        data: data.blocks.map((b) => ({ value: Number(b.skylineCv.toFixed(2)), itemStyle: { color: "#b4693b" } })),
        name: "ناهمگونی خط آسمان",
        barWidth: "18%",
      },
    ],
    legend: { ...base.legend, top: 4 },
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">اتصال انتخاب نقشه به نمودار — سطح اشغال ↔ تقاضای انرژی (نمایشی)</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {selBuilding && (
            <p className="text-[11px] text-copper mb-1">
              انتخاب فعال: {selBuilding.name} {selBlock && `(بلوک ${selBlock} با فیروزه‌ای برجسته شده)`}
            </p>
          )}
          <EChart option={scatterOption} height={300} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm">شاخص‌های بلوکی — H/W، اشغال و خط آسمان</CardTitle></CardHeader>
        <CardContent className="p-3">
          <EChart option={barOption} height={300} />
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────── کاتالوگ شاخص‌ها ───────────────

function IndicatorCatalogCard({ catalog }: { catalog: IndicatorMeta[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">کاتالوگ شاخص‌های ریخت‌شناسی — تعریف، فرمول، واحد، مقیاس، داده لازم و محدودیت</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {catalog.map((ind) => (
          <div key={ind.key} className={`rounded-xl border p-4 space-y-2.5 ${ind.status !== "computed" ? "border-dashed bg-muted/20" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold leading-5">{ind.title}</p>
              <Badge variant="outline" className={`text-[9px] shrink-0 ${ind.status === "computed" ? "border-turquoise/50 text-turquoise-deep dark:text-turquoise" : "border-muted-foreground/40 text-muted-foreground"}`}>
                {ind.status === "computed" ? (ind.statusNote ? "محاسبه‌شده (نمایشی)" : "محاسبه‌شده") : ind.status === "needs_simulation" ? "نیازمند شبیه‌سازی" : "نیازمند داده"}
              </Badge>
            </div>
            <p className="text-[11px] leading-5 text-muted-foreground">{ind.definition}</p>
            <FormulaBox formula={ind.formula} />
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[9px]">واحد: {ind.unit}</Badge>
              <Badge variant="secondary" className="text-[9px]">مقیاس: {ind.scale === "building" ? "بنا" : ind.scale === "block" ? "بلوک" : "محدوده"}</Badge>
            </div>
            <p className="text-[10px] leading-4 text-muted-foreground"><b className="text-foreground">داده لازم:</b> {ind.requiredData}</p>
            <p className="text-[10px] leading-4 text-copper"><b>محدودیت:</b> {ind.limitation}</p>
            {ind.status === "needs_simulation" && (
              <p className="text-[10px] leading-4 text-destructive">
                این شاخص تا فراهم شدن هندسه سه‌بعدی، فایل EPW و موتور تابش معتبر محاسبه نمی‌شود — به‌جای آن «داده موجود نیست» نمایش داده می‌شود.
              </p>
            )}
            {ind.statusNote && <p className="text-[10px] text-copper leading-4">{ind.statusNote}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
