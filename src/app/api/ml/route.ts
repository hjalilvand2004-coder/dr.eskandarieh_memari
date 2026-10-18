import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kmeans } from "@/lib/science/kmeans";
import { olsFit, olsPredict, groupSplit } from "@/lib/science/ols";
import { describe, pearson, computeMetrics } from "@/lib/science/stats";

export const dynamic = "force-dynamic";

interface AnalysisRow {
  code: string;
  block: string;
  heightM: number;
  floors: number;
  wwrPct: number;
  envelopeQuality: number;
  footprintM2: number;
  courtyardShare: number;
  heating: number;
  cooling: number;
  total: number;
  comfortHoursOut: number;
}

const NUMERIC_COLS: Array<{ key: keyof AnalysisRow; label: string; unit: string }> = [
  { key: "heightM", label: "ارتفاع بنا", unit: "m" },
  { key: "floors", label: "طبقات", unit: "طبقه" },
  { key: "wwrPct", label: "نسبت بازشو به دیوار", unit: "%" },
  { key: "envelopeQuality", label: "کیفیت پوسته", unit: "درجه ۱-۵" },
  { key: "footprintM2", label: "سطح اشغال", unit: "m²" },
  { key: "courtyardShare", label: "حیاط مرکزی (۰/۱)", unit: "—" },
  { key: "heating", label: "گرمایش ویژه (نمایشی)", unit: "kWh/m²·a" },
  { key: "cooling", label: "سرمایش ویژه (نمایشی)", unit: "kWh/m²·a" },
  { key: "total", label: "تقاضای کل ویژه (نمایشی)", unit: "kWh/m²·a" },
  { key: "comfortHoursOut", label: "ساعات خارج آسایش (نمایشی)", unit: "h/a" },
];

async function loadRows(): Promise<AnalysisRow[]> {
  const ds = await db.dataset.findFirst({ where: { name: { contains: "ریخت‌شناسی و انرژی" } } });
  if (!ds?.data) return [];
  return JSON.parse(ds.data) as AnalysisRow[];
}

/**
 * آزمایشگاه علم داده — محاسبات واقعی:
 * op=eda        → آمار توصیفی + ماتریس همبستگی + توزیع‌ها
 * op=kmeans     → خوشه‌بندی K-Means واقعی (k-means++، seed ثبت‌شده، silhouette)
 * op=regression → رگرسیون OLS با تفکیک گروهی بر پایه بلوک + معیارهای آزمون
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const op = body.op as string;
    const rows = await loadRows();
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "مجموعه داده تحلیلی یافت نشد." }, { status: 404 });
    }
    const demoNote = "داده نمایشی ـ فاقد اعتبار برای استناد علمی";

    if (op === "eda") {
      const stats = NUMERIC_COLS.map((c) => {
        const values = rows.map((r) => r[c.key] as number);
        const d = describe(values);
        return { key: c.key, label: c.label, unit: c.unit, ...d };
      });
      // ماتریس همبستگی پیرسون
      const cols = NUMERIC_COLS.filter((c) => ["heightM", "wwrPct", "envelopeQuality", "footprintM2", "courtyardShare", "heating", "cooling", "total", "comfortHoursOut"].includes(c.key));
      const matrix = cols.map((ci) => cols.map((cj) => Math.round(pearson(rows.map((r) => r[ci.key] as number), rows.map((r) => r[cj.key] as number)) * 1000) / 1000));
      const histograms = NUMERIC_COLS.map((c) => {
        const values = rows.map((r) => r[c.key] as number);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const bins = 10;
        const counts = new Array(bins).fill(0);
        values.forEach((v) => {
          const idx = Math.min(bins - 1, Math.floor(((v - min) / (max - min || 1)) * bins));
          counts[idx]++;
        });
        return { key: c.key, label: c.label, unit: c.unit, min, max, counts, binWidth: (max - min) / bins };
      });
      return NextResponse.json({ ok: true, data: { stats, corrMatrix: { cols: cols.map((c) => c.label), matrix }, histograms, n: rows.length, demoLabel: demoNote } });
    }

    if (op === "kmeans") {
      const k = Math.max(2, Math.min(6, Number(body.k) || 3));
      const seed = Number(body.seed) || 42;
      const featureKeys = ["heightM", "wwrPct", "envelopeQuality", "footprintM2", "courtyardShare"] as const;
      const featureLabels: Record<string, string> = {
        heightM: "ارتفاع (m)",
        wwrPct: "بازشو (%)",
        envelopeQuality: "کیفیت پوسته",
        footprintM2: "سطح اشغال (m²)",
        courtyardShare: "حیاط (۰/۱)",
      };
      const X = rows.map((r) => featureKeys.map((f) => r[f] as number));
      const res = kmeans(X, k, seed);
      // پروفایل تیپ‌ها: میانگین هر ویژگی + هدف انرژی در هر خوشه
      const profiles = Array.from({ length: k }, (_, c) => {
        const members = rows.filter((_, i) => res.labels[i] === c);
        const avg = (f: keyof AnalysisRow) => (members.length ? members.reduce((a, m) => a + (m[f] as number), 0) / members.length : 0);
        return {
          cluster: c + 1,
          size: members.length,
          codes: members.map((m) => m.code),
          featureMeans: featureKeys.map((f) => ({ key: f, label: featureLabels[f], value: Math.round(avg(f) * 100) / 100 })),
          meanTotal: Math.round(avg("total") * 10) / 10,
          meanCooling: Math.round(avg("cooling") * 10) / 10,
          meanHeating: Math.round(avg("heating") * 10) / 10,
        };
      });
      // ثبت مدل برای بازتولیدپذیری
      const saved = await db.mLModel.create({
        data: {
          name: `K-Means (k=${k})`,
          algorithm: "kmeans",
          task: "clustering",
          features: JSON.stringify(featureKeys),
          params: JSON.stringify({ k, seed, maxIter: 300, init: "kmeans++", standardize: true }),
          seed,
          dataVersion: "demo-morph-energy-v1",
          splitStrategy: "full_sample_clustering",
          trainSize: rows.length,
          status: "internal_eval",
          artifacts: JSON.stringify({ inertia: res.inertia, silhouette: res.silhouette, clusterSizes: res.clusterSizes }),
          limitations: "خوشه‌بندی بر داده نمایشی؛ عمومیت‌پذیری تا ورود داده واقعی نامعتبر است.",
        },
      });
      const points = rows.map((r, i) => ({
        x: r.footprintM2,
        y: r.total,
        label: res.labels[i],
        code: r.code,
      }));
      return NextResponse.json({
        ok: true,
        data: {
          modelId: saved.id,
          labels: res.labels,
          k: res.k,
          inertia: res.inertia,
          silhouette: res.silhouette,
          iterations: res.iterations,
          converged: res.converged,
          clusterSizes: res.clusterSizes,
          centroids: res.centroidsOriginal,
          featureLabels: featureKeys.map((f) => featureLabels[f]),
          profiles,
          points,
          demoLabel: demoNote,
          seed,
        },
      });
    }

    if (op === "regression") {
      const target = (["total", "cooling", "heating"].includes(body.target) ? body.target : "total") as keyof AnalysisRow;
      const seed = Number(body.seed) || 42;
      const featureKeys = ["heightM", "wwrPct", "envelopeQuality", "footprintM2", "courtyardShare"] as const;
      const featureLabels: Record<string, string> = {
        heightM: "ارتفاع بنا (m)",
        wwrPct: "نسبت بازشو به دیوار (%)",
        envelopeQuality: "کیفیت پوسته (درجه)",
        footprintM2: "سطح اشغال (m²)",
        courtyardShare: "حیاط مرکزی (۰/۱)",
      };
      const targetLabel = NUMERIC_COLS.find((c) => c.key === target)?.label ?? String(target);

      const X = rows.map((r) => featureKeys.map((f) => r[f] as number));
      const y = rows.map((r) => r[target] as number);
      const groups = rows.map((r) => r.block);

      // تفکیک گروهی بر پایه بلوک — کنترل نشت فضایی (۲ بلوک آموزش، ۱ بلوک آزمون)
      const { trainIdx, testIdx } = groupSplit(groups, 1 / 3, seed);
      const Xtr = trainIdx.map((i) => X[i]);
      const ytr = trainIdx.map((i) => y[i]);
      const Xte = testIdx.map((i) => X[i]);
      const yte = testIdx.map((i) => y[i]);

      const model = olsFit(Xtr, ytr);
      const predTrain = olsPredict(model, Xtr);
      const predTest = olsPredict(model, Xte);
      const mTest = computeMetrics(yte, predTest);
      const mTrain = computeMetrics(ytr, predTrain);

      const saved = await db.mLModel.create({
        data: {
          name: `OLS — ${targetLabel}`,
          algorithm: "ols",
          task: "regression",
          features: JSON.stringify(featureKeys),
          target,
          params: JSON.stringify({ standardize: true, ridge: 1e-8, split: "group_by_block", seed, testShare: (testIdx.length / rows.length).toFixed(2) }),
          seed,
          dataVersion: "demo-morph-energy-v1",
          splitStrategy: "group_split_by_block",
          trainSize: trainIdx.length,
          testSize: testIdx.length,
          status: "internal_eval",
          artifacts: JSON.stringify({
            intercept: model.intercept,
            coefStd: model.coefStd,
            coefOriginal: model.coefOriginal,
            scaler: model.scaler,
            r2Train: model.r2Train,
          }),
          limitations: "مدل فقط بر داده نمایشی آموزش دیده است؛ به هیچ وجه مدل اعتبارسنجی‌شده با واقعیت نیست. تعمیم فراتر از دامنه نمونه نامعتبر است.",
        },
      });

      const savedVal = await db.validationResult.create({
        data: {
          modelId: saved.id,
          path: "b_ml_vs_test",
          metrics: JSON.stringify({ test: mTest, train: mTrain }),
          criteriaVersion: "ارزیابی داخلی نگه‌داشته آزمون (hold-out گروهی)",
          timeBasis: "—",
          dataType: "نمایشی (synthetic_demo)",
          thresholds: JSON.stringify({ note: "آستانه پذیرش برای داده نمایشی تعریف نمی‌شود؛ پس از داده واقعی مستند می‌گردد." }),
          verdict: "ارزیابی داخلی",
          note: "تفکیک گروهی بر پایه بلوک؛ پیش‌پردازش فقط با داده آموزش برازش شده است.",
        },
      });

      return NextResponse.json({
        ok: true,
        data: {
          modelId: saved.id,
          validationId: savedVal.id,
          target: { key: target, label: targetLabel, unit: "kWh/m²·a" },
          features: featureKeys.map((f) => ({ key: f, label: featureLabels[f] })),
          coefStd: model.coefStd,
          coefOriginal: model.coefOriginal,
          intercept: model.intercept,
          r2Train: model.r2Train,
          split: { trainBlocks: Array.from(new Set(trainIdx.map((i) => rows[i].block))), testBlocks: Array.from(new Set(testIdx.map((i) => rows[i].block))), trainSize: trainIdx.length, testSize: testIdx.length },
          metricsTest: mTest,
          metricsTrain: mTrain,
          scatterTest: testIdx.map((i, j) => ({ code: rows[i].code, observed: y[i], predicted: predTest[j], block: rows[i].block })),
          scatterTrain: trainIdx.map((i, j) => ({ code: rows[i].code, observed: y[i], predicted: predTrain[j], block: rows[i].block })),
          residualsTest: testIdx.map((i, j) => ({ code: rows[i].code, predicted: predTest[j], residual: y[i] - predTest[j], block: rows[i].block })),
          demoLabel: demoNote,
          seed,
          status: "ارزیابی داخلی (hold-out گروهی) — نه اعتبارسنجی خارجی",
        },
      });
    }

    return NextResponse.json({ ok: false, error: "عملیات ناشناخته" }, { status: 400 });
  } catch (err) {
    console.error("ml error", err);
    return NextResponse.json({ ok: false, error: "خطا در اجرای تحلیل" }, { status: 500 });
  }
}
