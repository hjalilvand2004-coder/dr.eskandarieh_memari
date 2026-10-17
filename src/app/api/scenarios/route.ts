import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ScenarioParams {
  envelopeQualityDelta?: number;
  wwrRelativeDelta?: number;
  operationComfortDelta?: number;
  vegetationDelta?: number;
  scope?: string;
}

interface SurrogateArtifact {
  intercept: number;
  coefStd: number[];
  coefOriginal: number[];
  scaler: { mean: number[]; std: number[] };
}

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

const FEATURE_KEYS = ["heightM", "wwrPct", "envelopeQuality", "footprintM2", "courtyardShare"] as const;

function applySurrogate(art: SurrogateArtifact, feats: number[]): number {
  const z = feats.map((v, j) => (v - art.scaler.mean[j]) / art.scaler.std[j]);
  return art.intercept + z.reduce((a, v, j) => a + v * art.coefStd[j], 0);
}

/**
 * سناریوسازی و پشتیبانی تصمیم — برآورد با مدل جانشین (OLS)
 * ⚠ خروجی، برآورد مدل جانشین بر داده نمایشی است؛ نه شبیه‌سازی واقعی و نه مجوز مداخله میراثی.
 * سناریوهایی که ویژگی‌های مدل‌شده را تغییر نمی‌دهند (مثل پوشش گیاهی) کمّی ارزیابی نمی‌شوند.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "evaluate") {
      const scenarioId = String(body.scenarioId);
      const scenario = await db.scenario.findUnique({ where: { id: scenarioId } });
      if (!scenario) return NextResponse.json({ ok: false, error: "سناریو یافت نشد" }, { status: 404 });

      const params = JSON.parse(scenario.params) as ScenarioParams;
      const quantitative = (params.envelopeQualityDelta ?? 0) !== 0 || (params.wwrRelativeDelta ?? 0) !== 0;

      if (!quantitative) {
        await db.scenario.update({
          where: { id: scenarioId },
          data: {
            status: "defined",
            evaluationNote:
              (scenario.evaluationNote ? scenario.evaluationNote + " " : "") +
              "برآورد کمّی انجام نشد: تغییرات این سناریو در ویژگی‌های مدل جانشین فعلی (رگرسیون خطی بر ریخت‌شناسی و پوسته) بازتاب ندارد و نیازمند مدل/شبیه‌سازی مناسب است. هیچ عدد صوری تولید نشد.",
          },
        });
        return NextResponse.json({
          ok: true,
          data: { quantitative: false, note: "این سناریو نیازمند مدل خرداقلیم یا شبیه‌سازی مناسب است؛ برآورد کمّی صوری انجام نمی‌شود." },
        });
      }

      // مدل جانشین: آخرین رگرسیون OLS آموزش‌دیده روی target=total
      const model = await db.mLModel.findFirst({ where: { algorithm: "ols", target: "total" }, orderBy: { createdAt: "desc" } });
      if (!model?.artifacts) {
        return NextResponse.json({ ok: false, error: "مدل جانشین یافت نشد. ابتدا در آزمایشگاه علم داده رگرسیون را آموزش دهید." }, { status: 409 });
      }
      const art = JSON.parse(model.artifacts) as SurrogateArtifact;

      const ds = await db.dataset.findFirst({ where: { name: { contains: "ریخت‌شناسی و انرژی" } } });
      if (!ds?.data) return NextResponse.json({ ok: false, error: "مجموعه داده تحلیلی یافت نشد" }, { status: 404 });
      const rows = JSON.parse(ds.data) as AnalysisRow[];

      const basePreds: number[] = [];
      const scenarioPreds: number[] = [];
      rows.forEach((r) => {
        const feats = FEATURE_KEYS.map((f) => r[f] as number);
        if (params.scope === "envelopeQuality<=3" && r.envelopeQuality > 3) {
          basePreds.push(applySurrogate(art, feats));
          scenarioPreds.push(applySurrogate(art, feats));
          return;
        }
        const newEnvQ = Math.min(5, r.envelopeQuality + (params.envelopeQualityDelta ?? 0));
        const newWwr = Math.max(5, r.wwrPct * (1 + (params.wwrRelativeDelta ?? 0)));
        const feats2 = [r.heightM, newWwr, newEnvQ, r.footprintM2, r.courtyardShare];
        basePreds.push(applySurrogate(art, feats));
        scenarioPreds.push(applySurrogate(art, feats2));
      });

      const baseMean = basePreds.reduce((a, b) => a + b, 0) / basePreds.length;
      const scenMean = scenarioPreds.reduce((a, b) => a + b, 0) / scenarioPreds.length;
      const absChange = scenMean - baseMean;
      const relChange = baseMean !== 0 ? absChange / baseMean : 0;
      const affected = basePreds.filter((b, i) => b !== scenarioPreds[i]).length;

      const result = {
        baseMeanKwhM2a: Math.round(baseMean * 10) / 10,
        scenarioMeanKwhM2a: Math.round(scenMean * 10) / 10,
        absChangeKwhM2a: Math.round(absChange * 10) / 10,
        relChangePct: Math.round(relChange * 1000) / 10,
        affectedBuildings: affected,
        note:
          "برآورد بر پایه مدل جانشین خطی آموزش‌دیده روی داده نمایشی است. تغییر مطلق/نسبی فقط در دامنه ویژگی‌های مشاهده‌شده معنا دارد و «بهترین» گزینه به ترجیحات، قیود حفاظتی و عدم‌قطعیت بستگی دارد.",
        surrogateModelId: model.id,
      };

      await db.scenario.update({ where: { id: scenarioId }, data: { status: "evaluated", result: JSON.stringify(result) } });
      return NextResponse.json({ ok: true, data: { quantitative: true, ...result } });
    }

    if (action === "add") {
      const created = await db.scenario.create({
        data: {
          name: String(body.name ?? "سناریوی جدید"),
          category: ["envelope", "shading", "material", "vegetation", "low_intervention", "operation"].includes(body.category) ? body.category : "envelope",
          description: String(body.description ?? ""),
          params: JSON.stringify(body.params ?? {}),
          heritageConstraint: body.heritageConstraint ?? null,
          objectives: JSON.stringify(body.objectives ?? []),
        },
      });
      return NextResponse.json({ ok: true, data: { id: created.id } });
    }

    return NextResponse.json({ ok: false, error: "عملیات ناشناخته" }, { status: 400 });
  } catch (err) {
    console.error("scenarios error", err);
    return NextResponse.json({ ok: false, error: "خطا در سناریوسازی" }, { status: 500 });
  }
}
