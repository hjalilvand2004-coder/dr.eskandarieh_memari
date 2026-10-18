"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { SectionHeader, EmptyState, fa, DemoBadge, KeyValue } from "@/components/shared/ui-bits";
import { useAppStore, canWrite } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import {
  Database, Upload, FileSpreadsheet, Globe, Wind, Trash2, ShieldAlert,
  Table2, BookA, Loader2, FileCheck2,
} from "lucide-react";

interface DatasetRow {
  id: string;
  name: string;
  kind: string;
  origin: string;
  source?: string | null;
  license?: string | null;
  scale?: string | null;
  crs?: string | null;
  units?: string | null;
  timeRange?: string | null;
  timeResolution?: string | null;
  missingPolicy?: string | null;
  qualityNote?: string | null;
  uncertainty?: string | null;
  enteredBy?: string | null;
  version: number;
  rowCount: number;
  variables?: string | null;
}

interface QualityReport {
  rows: number;
  cols: number;
  columns: Array<{ name: string; type: string; missing: number; numericCount: number; min?: number; max?: number; unique: number; sample: string[] }>;
  duplicateRows: number;
  issues: string[];
  suggestions: string[];
  preview: Record<string, unknown>[];
}

const ORIGIN_LABEL: Record<string, string> = {
  observed: "مشاهده‌شده", simulated: "شبیه‌سازی‌شده", predicted: "پیش‌بینی‌شده", synthetic_demo: "نمایشی (صوری)",
};
const KIND_LABEL: Record<string, string> = {
  csv: "CSV/Excel", geojson: "GeoJSON", epw: "EPW اقلیمی", simulation_output: "خروجی شبیه‌سازی", field_sensor: "حسگر میدانی", image: "تصویر",
};

export function DataView() {
  const [datasets, setDatasets] = React.useState<DatasetRow[] | null>(null);
  const [weather, setWeather] = React.useState<{ name: string; note?: string | null } | null>(null);
  const role = useAppStore((s) => s.user?.role);
  const writable = canWrite(role);

  const reload = React.useCallback(() => {
    fetch("/api/datasets").then((r) => r.json()).then((j) => j.ok && setDatasets(j.data));
    fetch("/api/bootstrap").then((r) => r.json()).then((j) => j.ok && setWeather(j.data.weather));
  }, []);
  React.useEffect(reload, [reload]);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="پایگاه داده و مدیریت کیفیت"
        subtitle="هر مجموعه داده با منشأ، مجوز، مقیاس، CRS، واحد، بازه زمانی، عدم‌قطعیت و نوع داده ثبت می‌شود. داده خام هرگز اصلاح نمی‌شود."
        icon={<Database />}
        actions={writable ? <UploadDialog onDone={reload} /> : undefined}
      />

      {/* وضعیت EPW — صادقانه */}
      <Alert className="border-dashed">
        <Wind className="h-4 w-4" />
        <AlertTitle className="text-sm">فایل آب‌وهوایی (EPW) — پیکربندی‌نشده</AlertTitle>
        <AlertDescription className="text-xs leading-6">
          {weather?.note} هیچ داده اقلیمی جعل نشده است. پس از بارگذاری EPW از بخش ورود فایل، هدر فایل و پوشش زمانی استخراج و ثبت می‌شود.
        </AlertDescription>
      </Alert>

      {/* فهرست مجموعه داده‌ها */}
      <div className="grid lg:grid-cols-2 gap-5">
        {(datasets ?? []).map((d) => (
          <DatasetCard key={d.id} ds={d} canDelete={role === "admin"} onDeleted={reload} />
        ))}
      </div>

      {/* راهنمای نوع داده */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BookA className="h-4 w-4" /> فرهنگ نوع داده و قرارداد برچسب‌ها</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs leading-6">
          <div className="rounded-lg border p-3"><Badge variant="outline" className="text-[10px] mb-1.5">مشاهده‌شده</Badge><p className="text-muted-foreground">اندازه‌گیری یا برداشت میدانی مستند با منبع و تاریخ.</p></div>
          <div className="rounded-lg border p-3"><Badge variant="outline" className="text-[10px] mb-1.5">شبیه‌سازی‌شده</Badge><p className="text-muted-foreground">خروجی موتور محاسباتی با ثبت پارامترها و نسخه.</p></div>
          <div className="rounded-lg border p-3"><Badge variant="outline" className="text-[10px] mb-1.5">پیش‌بینی‌شده</Badge><p className="text-muted-foreground">برآورد مدل آماری/یادگیری ماشین با دامنه اعتبار مشخص.</p></div>
          <div className="rounded-lg border p-3"><Badge variant="outline" className="text-[10px] mb-1.5">نمایشی</Badge><p className="text-muted-foreground">داده صوری برای نمایش مسیر — فاقد اعتبار استنادی. <DemoBadge className="mt-1.5" /></p></div>
        </CardContent>
      </Card>
    </div>
  );
}

function DatasetCard({ ds, canDelete, onDeleted }: { ds: DatasetRow; canDelete: boolean; onDeleted: () => void }) {
  const [openDict, setOpenDict] = React.useState(false);
  const variables = React.useMemo(() => {
    try {
      return ds.variables ? (JSON.parse(ds.variables) as Array<{ key: string; label?: string; unit?: string; type?: string; missing?: number }>) : null;
    } catch {
      return null;
    }
  }, [ds.variables]);

  const del = async () => {
    const res = await fetch(`/api/datasets?id=${ds.id}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) {
      toast({ title: "مجموعه داده حذف شد", description: "رویداد در ممیزی ثبت شد." });
      onDeleted();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              {ds.kind === "epw" ? <Wind className="h-4 w-4" /> : ds.kind === "geojson" ? <Globe className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4 text-turquoise-deep" />}
              {ds.name}
            </CardTitle>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant="outline" className="text-[10px]">{KIND_LABEL[ds.kind] ?? ds.kind}</Badge>
              <Badge variant="outline" className={`text-[10px] ${ds.origin === "synthetic_demo" ? "border-copper/50 text-copper" : "border-turquoise/50 text-turquoise-deep"}`}>
                {ORIGIN_LABEL[ds.origin] ?? ds.origin}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">نسخه {fa(ds.version, 0)}</Badge>
              <Badge variant="secondary" className="text-[10px]">{fa(ds.rowCount, 0)} رکورد</Badge>
            </div>
          </div>
          {canDelete && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={del} aria-label={`حذف ${ds.name}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="text-xs">
        <KeyValue k="منبع" v={ds.source || "—"} />
        <KeyValue k="مجوز" v={ds.license || "—"} />
        <KeyValue k="مقیاس مکانی" v={ds.scale || "—"} />
        <KeyValue k="CRS" v={ds.crs || "—"} />
        <KeyValue k="واحدها" v={ds.units || "—"} />
        <KeyValue k="بازه/تفکیک زمانی" v={`${ds.timeRange || "—"} • ${ds.timeResolution || "—"}`} />
        <KeyValue k="سیاست مقدار گمشده" v={ds.missingPolicy || "—"} />
        <KeyValue k="عدم‌قطعیت" v={ds.uncertainty || "—"} />
        <KeyValue k="مسئول ورود" v={ds.enteredBy || "—"} />
        {ds.qualityNote && <p className="mt-2 rounded-lg bg-copper/10 border border-copper/30 px-2.5 py-1.5 text-[11px] text-copper leading-5">{ds.qualityNote}</p>}
        {variables && (
          <>
            <Separator className="my-3" />
            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setOpenDict(!openDict)}>
              <Table2 className="h-3.5 w-3.5 ml-1" /> فرهنگ داده ({fa(variables.length, 0)} متغیر)
            </Button>
            {openDict && (
              <div className="mt-2 overflow-x-auto">
                <table className="sci-table w-full text-[11px] border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">متغیر</th>
                      <th className="text-right p-2">واحد</th>
                      <th className="text-right p-2">نوع</th>
                      {variables.some((v) => v.missing !== undefined) && <th className="text-right p-2">گمشده</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {variables.map((v, i) => (
                      <tr key={`${v.key}-${i}`} className="border-b last:border-0">
                        <td className="p-2 font-medium">{v.label || v.key}</td>
                        <td className="p-2 text-muted-foreground" dir="auto">{v.unit || "—"}</td>
                        <td className="p-2 text-muted-foreground">{v.type || "—"}</td>
                        {variables.some((x) => x.missing !== undefined) && <td className="p-2 num">{v.missing ?? 0}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────── ورود فایل دو مرحله‌ای ───────────────

function UploadDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [kind, setKind] = React.useState("csv");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [report, setReport] = React.useState<QualityReport | null>(null);
  const [meta, setMeta] = React.useState({ source: "", license: "", scale: "building", crs: "", units: "", timeRange: "", timeResolution: "", missingPolicy: "", uncertainty: "ارزیابی نشده", enteredBy: "پژوهشگر" });
  const [importing, setImporting] = React.useState(false);

  const analyze = async () => {
    if (!file) {
      toast({ title: "فایل انتخاب نشده", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setReport(null);
    const fd = new FormData();
    fd.append("mode", "analyze");
    fd.append("kind", kind);
    fd.append("file", file);
    try {
      const res = await fetch("/api/datasets", { method: "POST", body: fd });
      const j = await res.json();
      if (j.ok) setReport(j.data.report);
      else toast({ title: j.error, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const confirmImport = async () => {
    if (!file || !report) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("mode", "import");
    fd.append("kind", kind);
    fd.append("file", file);
    Object.entries(meta).forEach(([k, v]) => fd.append(k, v));
    try {
      const res = await fetch("/api/datasets", { method: "POST", body: fd });
      const j = await res.json();
      if (j.ok) {
        toast({ title: "مجموعه داده وارد شد", description: "داده خام دست‌نخورده ذخیره شد و رویداد ممیزی ثبت گردید." });
        setOpen(false);
        setReport(null);
        setFile(null);
        onDone();
      } else toast({ title: j.error, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Upload className="h-4 w-4" /> ورود داده</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ورود داده — با پیش‌نمایش و گزارش کیفیت پیش از تأیید</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>نوع فایل</Label>
              <Select value={kind} onValueChange={(v) => { setKind(v); setReport(null); }}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV / Excel (خروجی CSV)</SelectItem>
                  <SelectItem value="geojson">GeoJSON</SelectItem>
                  <SelectItem value="epw">EPW آب‌وهوایی</SelectItem>
                  <SelectItem value="simulation_output">خروجی شبیه‌سازی (CSV مستند)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>فایل</Label>
              <Input type="file" accept={kind === "geojson" ? ".geojson,.json" : kind === "epw" ? ".epw" : ".csv,.txt"} onChange={(e) => { setFile(e.target.files?.[0] ?? null); setReport(null); }} className="text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              ["source", "منبع"],
              ["license", "مجوز استفاده"],
              ["scale", "مقیاس (بنا/بلوک/محله)"],
              ["crs", "دستگاه مختصات (CRS)"],
              ["units", "واحد متغیرها"],
              ["timeRange", "بازه زمانی"],
              ["timeResolution", "تفکیک زمانی"],
              ["missingPolicy", "روش برخورد با گمشده‌ها"],
              ["enteredBy", "مسئول ورود"],
            ].map(([k, l]) => (
              <div key={k} className="space-y-1">
                <Label className="text-[11px]">{l}</Label>
                <Input className="h-8 text-xs" value={meta[k as keyof typeof meta]} onChange={(e) => setMeta({ ...meta, [k]: e.target.value })} />
              </div>
            ))}
          </div>

          <Button onClick={analyze} disabled={analyzing || !file} className="w-full gap-2">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
            تحلیل کیفیت (بدون ورود نهایی)
          </Button>

          {report && (
            <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
              <p className="text-sm font-bold flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-copper" /> گزارش کیفیت پیش از ورود نهایی</p>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <Badge variant="secondary">{fa(report.rows, 0)} سطر</Badge>
                <Badge variant="secondary">{fa(report.cols, 0)} ستون</Badge>
                {report.duplicateRows > 0 && <Badge variant="outline" className="text-destructive border-destructive/40">{fa(report.duplicateRows, 0)} سطر تکراری</Badge>}
              </div>
              <div>
                <p className="text-[11px] font-semibold mb-1">یافته‌ها:</p>
                <ul className="list-disc pr-5 text-[11px] space-y-1 leading-5 text-muted-foreground">
                  {report.issues.map((i, k) => <li key={k}>{i}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold mb-1">پیشنهاد پاک‌سازی (اجرا فقط با تأیید شما — داده خام حفظ می‌شود):</p>
                <ul className="list-disc pr-5 text-[11px] space-y-1 leading-5 text-muted-foreground">
                  {report.suggestions.map((i, k) => <li key={k}>{i}</li>)}
                </ul>
              </div>
              {report.columns.length > 0 && (
                <div className="overflow-x-auto max-h-40">
                  <table className="sci-table w-full text-[10px] border rounded-lg overflow-hidden">
                    <thead><tr className="border-b"><th className="text-right p-1.5">ستون</th><th className="text-right p-1.5">نوع</th><th className="text-right p-1.5">گمشده</th><th className="text-right p-1.5">بازه</th></tr></thead>
                    <tbody>
                      {report.columns.map((c, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="p-1.5">{c.name}</td>
                          <td className="p-1.5">{c.type === "numeric" ? "عددی" : c.type === "categorical" ? "طبقه‌ای" : c.type}</td>
                          <td className="p-1.5 num">{fa(c.missing, 0)}</td>
                          <td className="p-1.5 num" dir="ltr">{c.min !== undefined ? `${c.min} … ${c.max}` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {report.preview.length > 0 && (
                <div className="overflow-x-auto max-h-40">
                  <table className="sci-table w-full text-[10px] border rounded-lg overflow-hidden">
                    <thead><tr className="border-b">{Object.keys(report.preview[0]).map((h) => <th key={h} className="text-right p-1.5">{h}</th>)}</tr></thead>
                    <tbody>
                      {report.preview.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          {Object.values(row).map((v, k) => <td key={k} className="p-1.5" dir="auto">{v === null ? "—" : String(v)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Button onClick={confirmImport} disabled={importing} className="w-full bg-turquoise hover:bg-turquoise-deep text-white">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأیید و ورود نهایی (حفظ داده خام + ثبت ممیزی)"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
