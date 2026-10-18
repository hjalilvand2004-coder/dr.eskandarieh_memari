import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";
import { parseNumeric } from "@/lib/science/stats";

export const dynamic = "force-dynamic";

export interface QualityColumn {
  name: string;
  type: "numeric" | "categorical" | "mixed" | "empty";
  missing: number;
  numericCount: number;
  min?: number;
  max?: number;
  unique: number;
  sample: string[];
}

export interface QualityReport {
  rows: number;
  cols: number;
  columns: QualityColumn[];
  duplicateRows: number;
  issues: string[];
  suggestions: string[];
  preview: Record<string, string | number | null>[];
}

/** پارس CSV ساده با پشتیبانی کوتیشن */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuote = false;
  const sep = (text.split("\n")[0].match(/;/g)?.length ?? 0) > (text.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuote = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuote = true;
    } else if (ch === sep) {
      cur.push(field);
      field = "";
    } else if (ch === "\n") {
      cur.push(field);
      field = "";
      rows.push(cur);
      cur = [];
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function analyzeCsv(text: string): QualityReport {
  const table = parseCsv(text);
  if (table.length < 2) {
    return { rows: 0, cols: 0, columns: [], duplicateRows: 0, issues: ["فایل CSV حداقل باید یک سطر سرستون و یک سطر داده داشته باشد."], suggestions: [], preview: [] };
  }
  const header = table[0].map((h, i) => h.trim() || `ستون ${i + 1}`);
  const body = table.slice(1);
  const columns: QualityColumn[] = header.map((name, j) => {
    const vals = body.map((r) => (r[j] ?? "").trim());
    const missing = vals.filter((v) => v === "" || v.toLowerCase() === "na" || v.toLowerCase() === "nan").length;
    const numerics = vals.filter((v) => v !== "" && parseNumeric(v) !== null);
    const type: QualityColumn["type"] = vals.every((v) => v === "") ? "empty" : numerics.length >= vals.filter((v) => v !== "").length * 0.8 && numerics.length > 0 ? "numeric" : "categorical";
    const nums = numerics.map((v) => parseNumeric(v)!).filter((v) => v !== null);
    return {
      name,
      type,
      missing,
      numericCount: numerics.length,
      min: nums.length ? Math.min(...nums) : undefined,
      max: nums.length ? Math.max(...nums) : undefined,
      unique: new Set(vals).size,
      sample: vals.slice(0, 4),
    };
  });
  const seen = new Set<string>();
  let duplicateRows = 0;
  body.forEach((r) => {
    const key = r.join("|");
    if (seen.has(key)) duplicateRows++;
    else seen.add(key);
  });
  const issues: string[] = [];
  const suggestions: string[] = [];
  columns.forEach((c) => {
    if (c.missing > 0) issues.push(`ستون «${c.name}»: ${c.missing} مقدار گمشده دارد.`);
    if (c.type === "empty") issues.push(`ستون «${c.name}» کاملاً خالی است.`);
  });
  if (duplicateRows > 0) issues.push(`${duplicateRows} سطر تکراری شناسایی شد.`);
  if (issues.length === 0) issues.push("مشکل ساختاری خاصی یافت نشد.");
  suggestions.push("واحد هر متغیر و دستگاه مختصات (در صورت وجود ستون مکانی) را پیش از ورود نهایی ثبت کنید.");
  if (columns.some((c) => c.missing > 0)) suggestions.push("برای مقادیر گمشده، روش برخورد (حذف سطر، جایگذاری، یا حفظ به‌عنوان NA) را صریحاً انتخاب و مستند کنید.");
  const preview = body.slice(0, 8).map((r) => {
    const obj: Record<string, string | number | null> = {};
    header.forEach((h, j) => {
      const raw = (r[j] ?? "").trim();
      const num = parseNumeric(raw);
      obj[h] = raw === "" ? null : num !== null ? num : raw;
    });
    return obj;
  });
  return { rows: body.length, cols: header.length, columns, duplicateRows, issues, suggestions, preview };
}

function analyzeGeoJson(text: string): QualityReport {
  try {
    const gj = JSON.parse(text);
    const features = gj.features ?? [];
    const issues: string[] = [];
    const suggestions: string[] = ["دستگاه مختصات مرجع (CRS) فایل را ثبت کنید؛ GeoJSON استاندارد WGS84 است.", "هندسه‌های چندقسمتی (MultiPolygon) در نسخه اول به‌صورت ساده نمایش داده می‌شوند."];
    let invalid = 0;
    let withProps = 0;
    features.forEach((f: { geometry?: { coordinates?: unknown } | null; properties?: Record<string, unknown> | null }) => {
      const coords = f.geometry?.coordinates;
      if (!coords || (Array.isArray(coords) && coords.length === 0)) invalid++;
      if (f.properties && Object.keys(f.properties).length > 0) withProps++;
    });
    if (invalid > 0) issues.push(`${invalid} ویژگی بدون هندسه معتبر شناسایی شد.`);
    if (withProps === 0) issues.push("هیچ ویژگی‌ای فیلد توصیفی (properties) ندارد؛ داده صرفاً هندسی است.");
    if (issues.length === 0) issues.push("ساختار GeoJSON معتبر است.");
    return { rows: features.length, cols: withProps, columns: [], duplicateRows: 0, issues, suggestions, preview: features.slice(0, 5).map((f: { properties?: Record<string, unknown>; geometry?: { type?: string } }) => ({ ...(f.properties ?? {}), _geometryType: f.geometry?.type ?? "—", _valid: true })) };
  } catch {
    return { rows: 0, cols: 0, columns: [], duplicateRows: 0, issues: ["فایل JSON معتبر نیست."], suggestions: [], preview: [] };
  }
}

function analyzeEpw(text: string): QualityReport {
  const lines = text.split(/\r?\n/);
  const issues: string[] = [];
  const headerInfo: Record<string, string> = {};
  if (lines[0]?.startsWith("LOCATION")) {
    const parts = lines[0].split(",");
    headerInfo["شهر"] = parts[1] ?? "";
    headerInfo["عرض جغرافیایی"] = parts[6] ?? "";
    headerInfo["طول جغرافیایی"] = parts[7] ?? "";
    headerInfo["منطقه زمانی"] = parts[8] ?? "";
    headerInfo["ارتفاع از دریا (m)"] = parts[9] ?? "";
  } else {
    issues.push("سطر LOCATION یافت نشد؛ فایل ممکن است EPW استاندارد نباشد.");
  }
  const dataRows = lines.filter((l) => l && !l.startsWith("LOCATION") && !l.startsWith("DATA PERIODS") && !l.startsWith("DESIGN CONDITIONS") && !l.startsWith("TYPICAL") && !l.startsWith("GROUND") && !l.startsWith("HOLIDAYS") && !l.startsWith("COMMENTS")).length;
  suggestions.push("برای شبیه‌سازی انرژی، بازه و منبع فایل (TMY/TMYx/AMy) و دوره پوشش آن مستند شود.");
  return {
    rows: dataRows,
    cols: 8,
    columns: [],
    duplicateRows: 0,
    issues: issues.length ? issues : ["ساختار EPW تشخیص داده شد."],
    suggestions,
    preview: [{ ...headerInfo, "سطرهای داده": dataRows }],
  };
}

/** GET: فهرست کامل مجموعه داده‌ها (با داده برای جدول‌ها) */
export async function GET() {
  try {
    await seedIfEmpty();
    const datasets = await db.dataset.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ ok: true, data: datasets });
  } catch (err) {
    console.error("datasets GET error", err);
    return NextResponse.json({ ok: false, error: "خطا در بارگذاری مجموعه داده‌ها" }, { status: 500 });
  }
}

/** POST: تحلیل کیفیت (mode=analyze) یا ورود نهایی (mode=import) */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const mode = String(form.get("mode") ?? "analyze");
    const kind = String(form.get("kind") ?? "csv");
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "فایلی انتخاب نشده است." }, { status: 400 });
    const text = await file.text();

    let report: QualityReport;
    if (kind === "geojson") report = analyzeGeoJson(text);
    else if (kind === "epw") report = analyzeEpw(text);
    else report = analyzeCsv(text);

    if (mode === "analyze") {
      return NextResponse.json({ ok: true, data: { report, fileName: file.name, kind } });
    }

    // ورود نهایی — تنها با تأیید صریح پژوهشگر
    const meta = {
      source: String(form.get("source") ?? ""),
      license: String(form.get("license") ?? "نامشخص — باید ثبت شود"),
      scale: String(form.get("scale") ?? ""),
      crs: String(form.get("crs") ?? ""),
      units: String(form.get("units") ?? ""),
      timeRange: String(form.get("timeRange") ?? ""),
      timeResolution: String(form.get("timeResolution") ?? ""),
      missingPolicy: String(form.get("missingPolicy") ?? "بر اساس گزارش کیفیت — ثبت شود"),
      uncertainty: String(form.get("uncertainty") ?? "ارزیابی نشده"),
      enteredBy: String(form.get("enteredBy") ?? "پژوهشگر"),
      qualityNote: "گزارش کیفیت پیش از ورود تأیید شد: " + report.issues.join(" "),
    };
    const variables = report.columns.length
      ? JSON.stringify(report.columns.map((c) => ({ key: c.name, label: c.name, type: c.type, missing: c.missing, min: c.min, max: c.max, unique: c.unique })))
      : null;

    const created = await db.dataset.create({
      data: {
        name: file.name.replace(/\.(csv|geojson|json|epw|txt)$/i, ""),
        kind,
        origin: "observed", // نوع داده توسط پژوهشگر در ویرایش اصلاح می‌شود؛ پیش‌فرض صادقانه ثبت می‌شود
        ...meta,
        rowCount: report.rows,
        variables,
        data: kind === "csv" ? text.slice(0, 2_000_000) : text.slice(0, 4_000_000),
        version: 1,
      },
    });
    await db.auditEvent.create({
      data: { actor: meta.enteredBy || "پژوهشگر", action: "dataset_import", target: created.id, detail: `ورود فایل ${file.name} (${report.rows} سطر) پس از تأیید گزارش کیفیت` },
    });
    return NextResponse.json({ ok: true, data: { id: created.id, report } });
  } catch (err) {
    console.error("datasets POST error", err);
    return NextResponse.json({ ok: false, error: "خطا در پردازش فایل" }, { status: 500 });
  }
}

/** DELETE: حذف مجموعه داده — فقط با ردگیری ممیزی */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "شناسه لازم است" }, { status: 400 });
    const ds = await db.dataset.findUnique({ where: { id } });
    if (!ds) return NextResponse.json({ ok: false, error: "یافت نشد" }, { status: 404 });
    await db.dataset.delete({ where: { id } });
    await db.auditEvent.create({ data: { actor: "پژوهشگر", action: "dataset_delete", target: id, detail: `حذف مجموعه داده «${ds.name}»` } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("datasets DELETE error", err);
    return NextResponse.json({ ok: false, error: "خطا در حذف" }, { status: 500 });
  }
}
